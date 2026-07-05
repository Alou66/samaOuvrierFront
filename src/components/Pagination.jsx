// Navigation page par page pour un PageResponse backend ({ page, totalPages }).
export default function Pagination({ page, totalPages, onChange }) {
  if (totalPages <= 1) return null

  // Pages visibles : toutes si ≤ 7, sinon fenêtre ± 2 autour de la page courante
  // avec ellipsis entre les sauts.
  let visible
  if (totalPages <= 7) {
    visible = Array.from({ length: totalPages }, (_, i) => i)
  } else {
    const kept = new Set([0, totalPages - 1])
    for (let i = Math.max(0, page - 2); i <= Math.min(totalPages - 1, page + 2); i++) {
      kept.add(i)
    }
    const sorted = [...kept].sort((a, b) => a - b)
    visible = []
    for (let i = 0; i < sorted.length; i++) {
      if (i > 0 && sorted[i] - sorted[i - 1] > 1) visible.push('…')
      visible.push(sorted[i])
    }
  }

  return (
    <div className="mt-6 flex flex-wrap items-center justify-center gap-2">
      <button
        onClick={() => onChange(page - 1)}
        disabled={page === 0}
        className="rounded-lg border border-stone-200 px-4 py-2 text-sm font-medium text-stone-600 hover:bg-stone-50 disabled:cursor-not-allowed disabled:opacity-40"
      >
        ← Précédente
      </button>

      <div className="flex gap-1">
        {visible.map((item, idx) =>
          item === '…' ? (
            <span
              key={`sep-${idx}`}
              className="flex h-8 w-8 items-center justify-center text-sm text-stone-400"
            >
              …
            </span>
          ) : (
            <button
              key={item}
              onClick={() => onChange(item)}
              className={`h-8 w-8 rounded-lg text-sm font-medium transition ${
                item === page
                  ? 'bg-primary-600 text-white'
                  : 'border border-stone-200 text-stone-600 hover:bg-stone-50'
              }`}
            >
              {item + 1}
            </button>
          )
        )}
      </div>

      <button
        onClick={() => onChange(page + 1)}
        disabled={page >= totalPages - 1}
        className="rounded-lg border border-stone-200 px-4 py-2 text-sm font-medium text-stone-600 hover:bg-stone-50 disabled:cursor-not-allowed disabled:opacity-40"
      >
        Suivante →
      </button>
    </div>
  )
}
