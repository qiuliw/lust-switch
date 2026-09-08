import { invoke } from '@tauri-apps/api/core'

export async function applyCodexRelay(apiKey: string): Promise<void> {
  await invoke('apply_codex_relay', { apiKey })
}

export async function exitCodexRelay(): Promise<void> {
  await invoke('exit_codex_relay')
}

export async function copyText(text: string): Promise<void> {
  try {
    await invoke('copy_text', { text })
  } catch {
    await navigator.clipboard.writeText(text)
  }
}
