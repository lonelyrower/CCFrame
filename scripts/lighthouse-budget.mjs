#!/usr/bin/env node

import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { mkdir, readFile, writeFile } from 'node:fs/promises'
import { spawn } from 'node:child_process'
import { setTimeout as sleep } from 'node:timers/promises'
import { launch } from 'chrome-launcher'
import lighthouse from 'lighthouse'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const projectRoot = path.join(__dirname, '..')
const logsDir = path.join(projectRoot, 'logs', 'lighthouse')
const budgetsPath = path.join(projectRoot, 'lighthouse-budget.json')

async function ensureSetup() {
  await mkdir(logsDir, { recursive: true })
  if (!fs.existsSync(budgetsPath)) {
    throw new Error(`未找到预算文件: ${budgetsPath}`)
  }
}

function sanitizePathSegment(segment) {
  return segment.replace(/[^a-z0-9]+/gi, '-').replace(/^-+|-+$/g, '') || 'root'
}

function fmtMs(value) {
  return `${Math.round(value)}ms`
}

function fmtCls(value) {
  return value.toFixed(3)
}

async function waitForServer(baseUrl, timeoutMs = 30000) {
  const start = Date.now()
  while (Date.now() - start < timeoutMs) {
    try {
      const response = await fetch(baseUrl, { method: 'GET' })
      if (response.ok) {
        return true
      }
    } catch (error) {
      await sleep(1000)
    }
  }
  return false
}

async function startPreviewServer(port) {
  if (process.env.LIGHTHOUSE_SKIP_SERVER === 'true') {
    return null
  }

  const baseUrl = `http://127.0.0.1:${port}`
  const command = process.platform === 'win32' ? 'npx.cmd' : 'npx'
  const child = spawn(command, ['next', 'start', '--port', String(port)], {
    cwd: projectRoot,
    env: { ...process.env, PORT: String(port) },
    stdio: ['ignore', 'pipe', 'pipe'],
  })

  child.stdout?.on('data', (chunk) => {
    const text = chunk.toString()
    if (process.env.DEBUG_LH) {
      process.stdout.write(`[lighthouse-server] ${text}`)
    }
  })

  child.stderr?.on('data', (chunk) => {
    const text = chunk.toString()
    process.stderr.write(`[lighthouse-server] ${text}`)
  })

  const ready = await waitForServer(baseUrl)
  if (!ready) {
    child.kill()
    throw new Error(`next start 未在预期时间内启动 (baseUrl: ${baseUrl})`)
  }

  return child
}

async function run() {
  await ensureSetup()

  const budgets = JSON.parse(await readFile(budgetsPath, 'utf8'))
  const port = Number(process.env.LIGHTHOUSE_PORT || '3010')
  const baseUrl = process.env.LIGHTHOUSE_BASE_URL || `http://127.0.0.1:${port}`
  const modes = (process.env.LIGHTHOUSE_MODES || 'mobile,desktop')
    .split(',')
    .map((mode) => mode.trim())
    .filter(Boolean)

  if (!modes.length) {
    throw new Error('未指定任何 Lighthouse form factor（LIGHTHOUSE_MODES）')
  }

  const serverProcess = await startPreviewServer(port)

  const chrome = await launch({
    chromeFlags: ['--headless=new', '--no-sandbox', '--disable-gpu', '--disable-dev-shm-usage'],
  })

  const failures = []

  try {
    for (const entry of budgets) {
      const targetUrl = new URL(entry.path, baseUrl).toString()

      for (const mode of modes) {
        const options = {
          port: chrome.port,
          logLevel: 'error',
          output: 'json',
          onlyCategories: ['performance'],
          emulatedFormFactor: mode,
        }

        if (mode === 'desktop') {
          options.screenEmulation = {
            disabled: false,
            mobile: false,
            width: 1350,
            height: 940,
            deviceScaleFactor: 1,
          }
        }

        const config = {
          extends: 'lighthouse:default',
          settings: {
            budgets,
          },
        }

        console.log(`🔍 运行 Lighthouse: ${targetUrl} (${mode})`)

        let runnerResult
        try {
          runnerResult = await lighthouse(targetUrl, options, config)
        } catch (error) {
          failures.push({
            url: targetUrl,
            mode,
            reason: `Lighthouse 运行失败: ${error.message}`,
          })
          continue
        }

        const { lhr } = runnerResult
        const audits = lhr?.audits ?? {}
        const metrics = {
          lcp: audits['largest-contentful-paint']?.numericValue ?? Number.POSITIVE_INFINITY,
          cls: audits['cumulative-layout-shift']?.numericValue ?? Number.POSITIVE_INFINITY,
          tbt: audits['total-blocking-time']?.numericValue ?? Number.POSITIVE_INFINITY,
          interactive: audits.interactive?.numericValue ?? Number.POSITIVE_INFINITY,
          score: lhr?.categories?.performance?.score ?? 0,
        }

        const resourceSummary = audits['resource-summary']?.details?.items ?? []
        const thirdPartySummary = audits['third-party-summary']?.details?.summary ?? {}

        const summaryLookup = Object.fromEntries(
          resourceSummary.map((item) => [item.resourceType, item])
        )

        const result = {
          url: targetUrl,
          mode,
          metrics,
          resourceSummary: {
            totalKb: (summaryLookup.total?.transferSize ?? 0) / 1024,
            scriptKb: (summaryLookup.script?.transferSize ?? 0) / 1024,
            imageKb: (summaryLookup.image?.transferSize ?? 0) / 1024,
            fontKb: (summaryLookup.font?.transferSize ?? 0) / 1024,
            thirdPartyRequests: thirdPartySummary.requestCount ?? 0,
          },
          budgetBreaches: [],
        }

        for (const timing of entry.timings ?? []) {
          const mapping = {
            'largest-contentful-paint': 'lcp',
            'cumulative-layout-shift': 'cls',
            'total-blocking-time': 'tbt',
            interactive: 'interactive',
          }
          const metricKey = mapping[timing.metric]
          const actual = metricKey ? metrics[metricKey] : undefined

          if (typeof actual !== 'number' || Number.isNaN(actual)) continue

          if (timing.metric === 'cumulative-layout-shift') {
            if (actual > timing.budget) {
              result.budgetBreaches.push(
                `${mode} ${entry.path} CLS ${fmtCls(actual)} > 预算 ${fmtCls(timing.budget)}`
              )
            }
          } else if (actual > timing.budget) {
            result.budgetBreaches.push(
              `${mode} ${entry.path} ${timing.metric} ${fmtMs(actual)} > 预算 ${fmtMs(timing.budget)}`
            )
          }
        }

        for (const sizeBudget of entry.resourceSizes ?? []) {
          const summary = summaryLookup[sizeBudget.resourceType]
          if (!summary) continue
          const actualKb = (summary.transferSize ?? 0) / 1024
          if (actualKb > sizeBudget.budget) {
            result.budgetBreaches.push(
              `${mode} ${entry.path} ${sizeBudget.resourceType} ${actualKb.toFixed(0)}KB > 预算 ${sizeBudget.budget}KB`
            )
          }
        }

        for (const countBudget of entry.resourceCounts ?? []) {
          if (countBudget.resourceType === 'third-party') {
            const thirdPartyCount = thirdPartySummary.requestCount ?? 0
            if (thirdPartyCount > countBudget.budget) {
              result.budgetBreaches.push(
                `${mode} ${entry.path} 第三方请求 ${thirdPartyCount} > 预算 ${countBudget.budget}`
              )
            }
          }
        }

        const filename = `lighthouse-${mode}-${sanitizePathSegment(entry.path)}.json`
        const filePath = path.join(logsDir, filename)
        await writeFile(filePath, JSON.stringify({ lhr, result }, null, 2), 'utf8')

        if (result.budgetBreaches.length) {
          failures.push(...result.budgetBreaches.map((reason) => ({ url: targetUrl, mode, reason })))
          console.error(`❌ 预算未通过 (${targetUrl}, ${mode})`)
          result.budgetBreaches.forEach((item) => console.error(`   ↳ ${item}`))
        } else {
          console.log(
            `✅ Lighthouse 通过 (${mode}) - LCP ${fmtMs(metrics.lcp)}, CLS ${fmtCls(metrics.cls)}, TBT ${fmtMs(metrics.tbt)}`
          )
        }
      }
    }
  } finally {
    await chrome.kill()
    if (serverProcess) {
      serverProcess.kill()
    }
  }

  if (failures.length) {
    console.error('\nLighthouse 预算校验失败：')
    failures.forEach((failure) => {
      console.error(` - [${failure.mode}] ${failure.url}: ${failure.reason}`)
    })
    process.exitCode = 1
  } else {
    console.log('\n🎯 Lighthouse 预算全部达标')
  }
}

run().catch((error) => {
  console.error('运行 Lighthouse 预算脚本失败', error)
  process.exitCode = 1
})
