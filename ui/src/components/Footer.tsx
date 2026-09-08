export default function Footer() {
  return (
    <footer className="border-t border-[var(--line)] px-4 py-4 text-[var(--sea-ink-soft)]">
      <p className="page-wrap m-0 text-xs">
        密钥不会单独存盘；中转写入会备份 ~/.codex 下的原配置。
      </p>
    </footer>
  )
}
