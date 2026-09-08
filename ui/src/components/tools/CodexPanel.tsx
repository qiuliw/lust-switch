import { useState } from 'react'
import toast from 'react-hot-toast'
import { useActionLog } from '#/app/use-action-log'
import ActionRow from '#/components/ActionRow'
import SecretField from '#/components/SecretField'
import { applyCodexRelay, copyText, exitCodexRelay } from '#/lib/codex'
import { buildImageSkillPrompt } from '#/lib/image-prompt'

export default function CodexPanel() {
  const [apiKey, setApiKey] = useState('')
  const { busy, run } = useActionLog()
  const key = apiKey.trim()
  const hasKey = key.length > 0

  return (
    <section
      id="codex"
      className="island-shell scroll-mt-28 overflow-hidden rounded-[1.5rem]"
    >
      <h1 className="m-0 border-b border-[var(--line)] px-5 py-4 text-xl font-semibold text-[var(--sea-ink)] sm:px-6">
        Codex
      </h1>
      <div className="border-b border-[var(--line)] px-5 py-5 sm:px-6">
        <p className="mb-3 text-sm font-semibold text-[var(--sea-ink)]">
          配置文件与技能
        </p>
        <SecretField
          id="relay-api-key"
          label="API 密钥"
          value={apiKey}
          onChange={setApiKey}
          placeholder="中转站 API 密钥"
        />
      </div>
      <ul className="m-0 list-none divide-y divide-[var(--line)] p-0">
        <ActionRow
          title="接入 AIGPT 中转"
          detail="写入 ~/.codex/config.toml，并把密钥合入 auth.json。首次会备份原文件。"
          locked={!hasKey}
          busy={busy !== null}
          actions={[
            {
              id: 'apply',
              label: busy === 'apply' ? '写入中…' : '写入',
              onClick: () => {
                if (!hasKey) {
                  toast.error('请先填入中转站 API 密钥')
                  return
                }
                run('apply', async () => {
                  await applyCodexRelay(key)
                  return '中转已写入。请重启 Codex。'
                })
              },
            },
            {
              id: 'exit',
              label: busy === 'exit' ? '恢复中…' : '退出',
              tone: 'quiet',
              onClick: () =>
                run('exit', async () => {
                  await exitCodexRelay()
                  return '已退出中转，配置已按备份恢复。'
                }),
            },
          ]}
        />
        <ActionRow
          title="图片技能提示词"
          detail="生成 image-generator 文案，粘贴到 Codex 对话里让它完成本地技能配置。"
          locked={!hasKey}
          busy={busy !== null}
          actions={[
            {
              id: 'copy',
              label: busy === 'copy' ? '复制中…' : '复制文案',
              onClick: () => {
                if (!hasKey) {
                  toast.error('请先填入中转站 API 密钥')
                  return
                }
                run('copy', async () => {
                  await copyText(buildImageSkillPrompt(key))
                  return '文案已复制，可直接粘贴到 Codex。'
                })
              },
            },
          ]}
        />
      </ul>
    </section>
  )
}
