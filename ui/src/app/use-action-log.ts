import { useState } from 'react'
import toast from 'react-hot-toast'

export function useActionLog() {
  const [busy, setBusy] = useState<string | null>(null)

  async function run(id: string, task: () => Promise<string>) {
    setBusy(id)
    try {
      toast.success(await task())
    } catch (err) {
      toast.error(err instanceof Error ? err.message : String(err))
    } finally {
      setBusy(null)
    }
  }

  return { busy, run }
}
