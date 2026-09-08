import { invoke } from '@tauri-apps/api/core'

export async function installClash(): Promise<void> {
  await invoke('install_clash')
}
