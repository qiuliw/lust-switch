import { useState } from 'react'

export function useActionLog(initial: string) {
  const [busy, setBusy] = useState<string | null>(null)
  const [log, setLog] = useState(initial)
  const [error, setError] = useState<string | null>(null)

  async function run(id: string, task: () => Promise<string>) {
    setBusy(id)
    setError(null)
    try {
      setLog(await task())
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err))
    } finally {
      setBusy(null)
    }
  }

  return { busy, log, error, run }
}
