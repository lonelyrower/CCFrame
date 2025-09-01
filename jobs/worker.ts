import { ensureWorkers } from './queue'

async function main() {
  try {
    await ensureWorkers()
    // Keep process alive
    // eslint-disable-next-line no-constant-condition
    while (true) {
      await new Promise((r) => setTimeout(r, 60_000))
    }
  } catch (err) {
    console.error('Worker failed to start:', err)
    process.exit(1)
  }
}

main()
