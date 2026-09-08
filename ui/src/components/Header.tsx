import { Link, useRouterState } from '@tanstack/react-router'
import { useEffect, useState } from 'react'
import { tools } from '../app/tools'
import ThemeToggle from './ThemeToggle'

export default function Header() {
  const pathname = useRouterState({ select: (state) => state.location.pathname })
  const hash = useRouterState({ select: (state) => state.location.hash })
  const [active, setActive] = useState<string>('network')

  useEffect(() => {
    if (pathname !== '/') {
      return
    }

    const fromHash = hash.replace(/^#/, '')
    if (fromHash) {
      setActive(fromHash)
    }

    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((entry) => entry.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0]
        if (visible?.target.id) {
          setActive(visible.target.id)
        }
      },
      { rootMargin: '-30% 0px -50% 0px', threshold: [0.15, 0.4, 0.7] },
    )

    for (const tool of tools) {
      const el = document.getElementById(tool.id)
      if (el) {
        observer.observe(el)
      }
    }

    return () => observer.disconnect()
  }, [pathname, hash])

  return (
    <header className="sticky top-0 z-50 border-b border-[var(--line)] bg-[var(--header-bg)] px-4 backdrop-blur-lg">
      <nav className="page-wrap flex flex-wrap items-center gap-x-3 gap-y-2 py-3 sm:py-4">
        <h2 className="m-0 flex-shrink-0 text-base font-semibold tracking-tight">
          <Link
            to="/"
            hash=""
            className="inline-flex items-center gap-2 rounded-full border border-[var(--chip-line)] bg-[var(--chip-bg)] px-3 py-1.5 text-sm text-[var(--sea-ink)] no-underline shadow-[0_8px_24px_rgba(30,90,72,0.08)] sm:px-4 sm:py-2"
          >
            <span className="h-2 w-2 rounded-full bg-[linear-gradient(90deg,#56c6be,#7ed3bf)]" />
            Lust
          </Link>
        </h2>

        <div className="order-3 flex w-full flex-wrap items-center gap-x-4 gap-y-1 pb-1 text-sm font-semibold sm:order-none sm:w-auto sm:flex-nowrap sm:pb-0">
          {tools.map((tool) => (
            <Link
              key={tool.id}
              to="/"
              hash={tool.id}
              className={
                pathname === '/' && active === tool.id
                  ? 'nav-link is-active'
                  : 'nav-link'
              }
              onClick={() => {
                if (pathname === '/') {
                  document
                    .getElementById(tool.id)
                    ?.scrollIntoView({ behavior: 'smooth', block: 'start' })
                }
              }}
            >
              {tool.title}
            </Link>
          ))}
        </div>

        <div className="ml-auto flex items-center gap-4 text-sm font-semibold">
          <Link
            to="/about"
            className="nav-link"
            activeProps={{ className: 'nav-link is-active' }}
          >
            About
          </Link>
          <ThemeToggle />
        </div>
      </nav>
    </header>
  )
}
