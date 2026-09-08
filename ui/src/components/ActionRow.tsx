export default function ActionRow({
  title,
  detail,
  locked,
  busy,
  actions,
}: {
  title: string
  detail: string
  locked?: boolean
  busy: boolean
  actions: Array<{
    id: string
    label: string
    tone?: 'quiet'
    onClick: () => void
  }>
}) {
  return (
    <li className="flex flex-col gap-4 px-5 py-5 sm:flex-row sm:items-center sm:justify-between sm:px-6">
      <div className="min-w-0">
        <div className="flex flex-wrap items-center gap-2">
          <h2 className="m-0 text-base font-semibold text-[var(--sea-ink)]">
            {title}
          </h2>
          {locked ? (
            <span className="rounded-full border border-[var(--chip-line)] px-2 py-0.5 text-[0.65rem] font-semibold text-[var(--sea-ink-soft)]">
              需要密钥
            </span>
          ) : null}
        </div>
        <p className="mt-1 mb-0 text-sm leading-6 text-[var(--sea-ink-soft)]">
          {detail}
        </p>
      </div>
      <div className="flex shrink-0 flex-wrap gap-2">
        {actions.map((action) => (
          <button
            key={action.id}
            type="button"
            onClick={action.onClick}
            disabled={busy}
            className={
              action.tone === 'quiet'
                ? 'rounded-full border border-[var(--line)] bg-transparent px-4 py-2 text-sm font-semibold text-[var(--sea-ink-soft)] transition hover:border-[var(--lagoon)] hover:text-[var(--sea-ink)] disabled:cursor-not-allowed disabled:opacity-60'
                : 'rounded-full border border-[rgba(50,143,151,0.3)] bg-[rgba(79,184,178,0.14)] px-4 py-2 text-sm font-semibold text-[var(--lagoon-deep)] transition hover:-translate-y-0.5 hover:bg-[rgba(79,184,178,0.24)] disabled:cursor-not-allowed disabled:opacity-60'
            }
          >
            {action.label}
          </button>
        ))}
      </div>
    </li>
  )
}
