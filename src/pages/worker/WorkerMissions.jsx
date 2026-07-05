import { useCallback, useEffect, useState } from 'react'
import { missionService } from '../../services/mission.service'
import { formatDuration, formatPrice } from '../../utils/format'
import Stars from '../../components/Stars'
import Pagination from '../../components/Pagination'

const RATING_FILTERS = [
  { key: '',        label: 'Toutes les notes' },
  { key: '5',       label: '5 étoiles' },
  { key: '4',       label: '4 étoiles et +' },
  { key: '3',       label: '3 étoiles et +' },
  { key: '2',       label: '2 étoiles et +' },
  { key: '1',       label: '1 étoile et +' },
  { key: 'unrated', label: 'Non notées' },
]

const PAGE_SIZE = 10

const EMPTY_PAGE = { content: [], page: 0, totalPages: 0, totalElements: 0 }

export default function WorkerMissions() {
  const [missionsPage, setMissionsPage] = useState(EMPTY_PAGE)
  const [page,     setPage]     = useState(0)
  const [from,     setFrom]     = useState('')
  const [to,       setTo]       = useState('')
  const [ratingKey, setRatingKey] = useState('')
  const [loading,  setLoading]  = useState(true)
  const [error,    setError]    = useState(false)

  const loadData = useCallback(() => {
    setLoading(true)
    missionService
      .getCompletedMissionsByWorker({
        page,
        size: PAGE_SIZE,
        from: from || undefined,
        to: to || undefined,
        minRating: ratingKey && ratingKey !== 'unrated' ? Number(ratingKey) : undefined,
        unratedOnly: ratingKey === 'unrated',
      })
      .then((data) => {
        setMissionsPage(data)
        setError(false)
      })
      .catch((err) => {
        console.error('[WorkerMissions] Erreur chargement:', err)
        setError(true)
      })
      .finally(() => setLoading(false))
  }, [page, from, to, ratingKey])

  useEffect(() => { loadData() }, [loadData])

  const handleFilterChange = (setter) => (value) => {
    setPage(0)
    setter(value)
  }

  const resetFilters = () => {
    setPage(0)
    setFrom('')
    setTo('')
    setRatingKey('')
  }

  const hasActiveFilters = from || to || ratingKey

  return (
    <div className="flex flex-col gap-4">
      <div>
        <h1 className="text-xl font-semibold text-stone-900">Mes missions terminées</h1>
        <p className="mt-1 text-sm text-stone-500">
          {missionsPage.totalElements} mission{missionsPage.totalElements > 1 ? 's' : ''} terminée
          {missionsPage.totalElements > 1 ? 's' : ''}
        </p>
      </div>

      {/* ── Filtres ──────────────────────────────────────────────────────────── */}
      <section className="flex flex-col gap-3 rounded-xl border border-stone-200 bg-white p-4">
        <div className="flex flex-wrap gap-1.5">
          {RATING_FILTERS.map((f) => (
            <button
              key={f.key}
              onClick={() => handleFilterChange(setRatingKey)(f.key)}
              className={`rounded-full px-3 py-1 text-xs font-medium transition ${
                ratingKey === f.key
                  ? 'bg-primary-600 text-white'
                  : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>

        <div className="flex flex-wrap items-end gap-3">
          <label className="flex flex-col gap-1 text-xs font-medium text-stone-500">
            Du
            <input
              type="date"
              value={from}
              max={to || undefined}
              onChange={(e) => handleFilterChange(setFrom)(e.target.value)}
              className="rounded-lg border border-stone-200 px-3 py-1.5 text-sm text-stone-700"
            />
          </label>
          <label className="flex flex-col gap-1 text-xs font-medium text-stone-500">
            Au
            <input
              type="date"
              value={to}
              min={from || undefined}
              onChange={(e) => handleFilterChange(setTo)(e.target.value)}
              className="rounded-lg border border-stone-200 px-3 py-1.5 text-sm text-stone-700"
            />
          </label>
          {hasActiveFilters && (
            <button
              onClick={resetFilters}
              className="rounded-lg border border-stone-300 px-3 py-1.5 text-xs font-medium text-stone-600 hover:bg-stone-50"
            >
              Réinitialiser les filtres
            </button>
          )}
        </div>
      </section>

      {/* ── Erreur ───────────────────────────────────────────────────────────── */}
      {error && (
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border-2 border-orange-200 bg-orange-50 p-4">
          <p className="text-sm text-orange-700">Impossible de charger vos missions terminées.</p>
          <button
            onClick={loadData}
            className="shrink-0 rounded-lg bg-orange-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-orange-700"
          >
            Réessayer
          </button>
        </div>
      )}

      {/* ── Liste ────────────────────────────────────────────────────────────── */}
      <section className="rounded-xl border border-stone-200 bg-white p-5">
        {loading ? (
          <p className="py-6 text-center text-sm text-stone-400">Chargement…</p>
        ) : missionsPage.content.length === 0 ? (
          <p className="py-6 text-center text-sm text-stone-400">
            {hasActiveFilters ? 'Aucune mission ne correspond à ces filtres.' : 'Aucune mission terminée pour le moment.'}
          </p>
        ) : (
          <ul className="flex flex-col gap-3">
            {missionsPage.content.map((m) => (
              <li key={m.id} className="flex flex-col gap-3 rounded-lg border border-stone-100 p-4 sm:flex-row sm:items-start sm:justify-between">
                <div className="min-w-0">
                  <p className="font-medium text-stone-900">
                    {m.metier ?? 'Mission'} {m.ville && `— ${m.ville}`}
                  </p>
                  {m.adresse && <p className="text-sm text-stone-500">{m.adresse}</p>}
                  <p className="mt-1 text-xs text-stone-400">
                    Client : <span className="text-stone-600">{m.clientNom ?? `#${m.clientId}`}</span>
                    {' · '}Terminée le {m.completedAt ? new Date(m.completedAt).toLocaleDateString('fr-FR') : '—'}
                    {' · '}{formatPrice(m.price)}
                    {' · '}{formatDuration(m.estimatedDurationMinutes)}
                  </p>
                </div>

                <div className="shrink-0 rounded-lg bg-sand-50 p-3 sm:w-64">
                  {m.ratingValue ? (
                    <>
                      <div className="flex items-center gap-2">
                        <Stars note={m.ratingValue} />
                        <span className="text-xs font-semibold text-stone-700">{m.ratingValue}/5</span>
                      </div>
                      {m.ratingComment && (
                        <p className="mt-1 text-sm italic text-stone-600">"{m.ratingComment}"</p>
                      )}
                      {m.ratingCreatedAt && (
                        <p className="mt-1 text-xs text-stone-400">
                          Notée le {new Date(m.ratingCreatedAt).toLocaleDateString('fr-FR')}
                        </p>
                      )}
                    </>
                  ) : (
                    <p className="text-sm text-stone-400">Pas encore notée par le client</p>
                  )}
                </div>
              </li>
            ))}
          </ul>
        )}

        <Pagination page={page} totalPages={missionsPage.totalPages} onChange={setPage} />
      </section>
    </div>
  )
}
