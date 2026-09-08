import { useActionLog } from '#/app/use-action-log'
import ActionRow from '#/components/ActionRow'
import { installClash } from '#/lib/clash'

export default function NetworkPanel() {
  const { busy, run } = useActionLog()

  return (
    <section
      id="network"
      className="island-shell scroll-mt-28 overflow-hidden rounded-[1.5rem]"
    >
      <h1 className="m-0 border-b border-[var(--line)] px-5 py-4 text-xl font-semibold text-[var(--sea-ink)] sm:px-6">
        Network
      </h1>
      <ul className="m-0 list-none divide-y divide-[var(--line)] p-0">
        <ActionRow
          title="Clash Verge"
          detail="启动随包安装程序。"
          busy={busy !== null}
          actions={[
            {
              id: 'install',
              label: busy === 'install' ? '正在启动…' : '安装',
              onClick: () =>
                run('install', async () => {
                  await installClash()
                  return 'Clash Verge 安装程序已启动。'
                }),
            },
          ]}
        />
      </ul>
    </section>
  )
}
