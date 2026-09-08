import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/about')({
  component: About,
})

function About() {
  const year = new Date().getFullYear()

  return (
    <main className="page-wrap px-4 py-6">
      <section className="island-shell rounded-2xl p-6 sm:p-8">
        <h1 className="mb-6 text-xl font-semibold text-[var(--sea-ink)]">
          About
        </h1>
        <p className="m-0 text-sm leading-7 text-[var(--sea-ink-soft)]">
          Copyright © {year}{' '}
          <a
            href="https://github.com/admincloudai"
            target="_blank"
            rel="noreferrer"
          >
            @admincloudai
          </a>
          . All rights reserved.
        </p>
      </section>
    </main>
  )
}
