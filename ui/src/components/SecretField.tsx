import { Eye, EyeOff } from 'lucide-react'
import { useState } from 'react'

export default function SecretField({
  id,
  value,
  onChange,
  placeholder,
  label,
}: {
  id: string
  value: string
  onChange: (value: string) => void
  placeholder: string
  label: string
}) {
  const [show, setShow] = useState(false)

  return (
    <div>
      <label htmlFor={id} className="sr-only">
        {label}
      </label>
      <div className="relative">
        <input
          id={id}
          type={show ? 'text' : 'password'}
          value={value}
          onChange={(event) => onChange(event.target.value)}
          autoComplete="off"
          spellCheck={false}
          placeholder={placeholder}
          className="min-h-11 w-full rounded-xl border border-[var(--line)] bg-[var(--surface-strong)] py-2 pr-11 pl-3 font-mono text-sm text-[var(--sea-ink)] outline-none ring-[var(--lagoon)] focus:ring-2"
        />
        <button
          type="button"
          onClick={() => setShow((visible) => !visible)}
          aria-label={show ? '隐藏密钥' : '显示密钥'}
          className="absolute top-1/2 right-1.5 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-lg text-[var(--sea-ink-soft)] transition hover:bg-[var(--link-bg-hover)] hover:text-[var(--sea-ink)]"
        >
          {show ? (
            <EyeOff className="h-4 w-4" strokeWidth={1.75} />
          ) : (
            <Eye className="h-4 w-4" strokeWidth={1.75} />
          )}
        </button>
      </div>
    </div>
  )
}
