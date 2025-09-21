#!/usr/bin/env node\n\nimport fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import lighthouse from 'lighthouse'
import chromeLauncher from 'chrome-launcher'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const rootDir = path.resolve(__dirname, '..')

function parseArgs() {
  const args = process.argv.slice(2)
  const result = {}
  for (const arg of args) {
    if (arg.startsWith('--')) {
      const [key, value = 'true'] = arg.replace(/^--/, '').split('=')
      result[key] = value
    }
  }
  return result
}

async function run() {
  const args = parseArgs()
  const url = args.url || 'http://localhost:3000/'
  const formFactor = args.formFactor === 'desktop' ? 'desktop' : 'mobile'
  const outputDir = path.join(rootDir, 'logs', 'perf')
  fs.mkdirSync(outputDir, { recursive: true })

  console.log(`📊 Running Lighthouse against ${url} (${formFactor})`)

  const chrome = await chromeLauncher.launch({
    chromeFlags: ['--headless', '--disable-gpu', '--no-sandbox', '--disable-dev-shm-usage'],
  })

  try {
    const flags = {
      port: chrome.port,
      logLevel: 'error',
      output: 'json',
      onlyCategories: ['performance'],
      formFactor,
      screenEmulation: formFactor === 'desktop' ? { disabled: false, mobile: false, width: 1366, height: 768, deviceScaleFactor: 1 } : undefined,
    }

    const config = null
    const runnerResult = await lighthouse(url, flags, config)
    const { lhr } = runnerResult

    const summary = {
      url,
      formFactor,
      timestamp: new Date().toISOString(),
      performanceScore: lhr.categories.performance.score,
      metrics: {
        lighthouseVersion: lhr.lighthouseVersion,
        firstContentfulPaint: lhr.audits['first-contentful-paint']?.numericValue,
        largestContentfulPaint: lhr.audits['largest-contentful-paint']?.numericValue,
        cumulativeLayoutShift: lhr.audits['cumulative-layout-shift']?.numericValue,
        totalBlockingTime: lhr.audits['total-blocking-time']?.numericValue,
        speedIndex: lhr.audits['speed-index']?.numericValue,
      },
    }

    const outputPath = path.join(outputDir, `lighthouse-${Date.now()}.json`)
    fs.writeFileSync(outputPath, JSON.stringify({ summary, report: lhr }, null, 2), 'utf8')

    console.log('✅ Lighthouse completed')
    console.table({
      Performance: summary.performanceScore,
      'LCP (ms)': summary.metrics.largestContentfulPaint,
      'CLS': summary.metrics.cumulativeLayoutShift,
      'TBT (ms)': summary.metrics.totalBlockingTime,
    })
    console.log(`📁 Report saved to ${path.relative(rootDir, outputPath)}`)
  } finally {
    await chrome.kill()
  }
}

run().catch((error) => {
  console.error('Lighthouse benchmark failed:', error)
  process.exit(1)
})

