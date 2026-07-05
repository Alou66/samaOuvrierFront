import { useEffect, useRef, useState } from 'react'

/**
 * Select de ville avec recherche intégrée.
 *
 * @param {string}   value       - ville sélectionnée (chaîne)
 * @param {Function} onChange    - callback(villeString)
 * @param {string[]} villes      - liste des villes disponibles
 * @param {string}   placeholder
 * @param {string}   className   - classes supplémentaires sur le conteneur
 */
export default function VilleSelect({
  value,
  onChange,
  villes = [],
  placeholder = 'Choisir une ville…',
  className = '',
}) {
  const [open,  setOpen]  = useState(false)
  const [query, setQuery] = useState('')
  const containerRef = useRef(null)
  const inputRef     = useRef(null)

  // Fermer sur clic extérieur
  useEffect(() => {
    const handler = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setOpen(false)
        setQuery('')
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  // Focus l'input quand le dropdown s'ouvre
  useEffect(() => {
    if (open) inputRef.current?.focus()
  }, [open])

  const filtered = query.trim()
    ? villes.filter((v) => v.toLowerCase().includes(query.toLowerCase()))
    : villes

  const select = (v) => {
    onChange(v)
    setOpen(false)
    setQuery('')
  }

  const clear = (e) => {
    e.stopPropagation()
    onChange('')
    setQuery('')
  }

  return (
    <div ref={containerRef} className={`relative ${className}`}>
      {/* Bouton principal */}
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className={`flex w-full items-center gap-2 rounded-xl border bg-white px-3 py-2.5 text-left text-sm transition ${
          open
            ? 'border-primary-400 ring-2 ring-primary-100'
            : 'border-stone-200 hover:border-stone-300'
        }`}
      >
        <span className={`flex-1 truncate ${value ? 'text-stone-900' : 'text-stone-400'}`}>
          {value || placeholder}
        </span>
        <span className="flex shrink-0 items-center gap-1">
          {value && (
            <span
              onClick={clear}
              className="flex h-4 w-4 cursor-pointer items-center justify-center rounded-full text-stone-300 hover:bg-stone-100 hover:text-stone-500"
            >
              ✕
            </span>
          )}
          <svg
            className={`h-4 w-4 text-stone-400 transition-transform ${open ? 'rotate-180' : ''}`}
            fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
          </svg>
        </span>
      </button>

      {/* Dropdown */}
      {open && (
        <div className="absolute left-0 right-0 top-full z-50 mt-1 overflow-hidden rounded-xl border border-stone-200 bg-white shadow-lg">
          {/* Champ de recherche */}
          <div className="border-b border-stone-100 px-3 py-2">
            <input
              ref={inputRef}
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Rechercher…"
              className="w-full bg-transparent text-sm text-stone-900 outline-none placeholder:text-stone-400"
            />
          </div>

          {/* Liste filtrée */}
          <ul className="max-h-48 overflow-y-auto">
            {filtered.length === 0 ? (
              <li className="px-3 py-3 text-sm text-stone-400">Aucune ville trouvée.</li>
            ) : (
              filtered.map((v) => (
                <li key={v}>
                  <button
                    type="button"
                    onClick={() => select(v)}
                    className={`w-full px-3 py-2 text-left text-sm transition ${
                      v === value
                        ? 'bg-primary-50 font-semibold text-primary-700'
                        : 'text-stone-700 hover:bg-stone-50 hover:text-stone-900'
                    }`}
                  >
                    {v}
                  </button>
                </li>
              ))
            )}
          </ul>
        </div>
      )}
    </div>
  )
}
