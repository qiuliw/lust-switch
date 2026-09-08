import { createFileRoute, useRouterState } from '@tanstack/react-router'
import { useEffect } from 'react'
import CodexPanel from '#/components/tools/CodexPanel'
import NetworkPanel from '#/components/tools/NetworkPanel'

export const Route = createFileRoute('/')({ component: Home })

function Home() {
  const hash = useRouterState({ select: (state) => state.location.hash })

  useEffect(() => {
    const id = hash.replace(/^#/, '')
    if (!id) {
      return
    }
    requestAnimationFrame(() => {
      document.getElementById(id)?.scrollIntoView({
        behavior: 'smooth',
        block: 'start',
      })
    })
  }, [hash])

  return (
    <main className="page-wrap flex flex-col gap-5 px-4 py-6">
      <NetworkPanel />
      <CodexPanel />
    </main>
  )
}
