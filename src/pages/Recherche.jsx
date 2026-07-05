import { useEffect, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { workerService } from '../services/worker.service'
import { villeService } from '../services/ville.service'
import { metierService } from '../services/metier.service'
import WorkerCard from '../components/WorkerCard'
import VilleSelect from '../components/VilleSelect'
import Pagination from '../components/Pagination'

const PAGE_SIZE = 12

// ── Page de recherche ─────────────────────────────────────────────────────────

export default function Recherche() {
  const [searchParams, setSearchParams] = useSearchParams()

  // Contrôles — ce que l'utilisateur saisit (pas encore envoyé à l'API)
  const [ville,               setVille]               = useState(searchParams.get('ville')  || '')
  const [metier,              setMetier]              = useState(searchParams.get('metier') || '')
  const [disponibleSeulement, setDisponibleSeulement] = useState(false)
  const [noteMin,             setNoteMin]             = useState(0)

  // Filtres appliqués — mis à jour uniquement sur "Appliquer" → déclenchent l'appel API
  const [applied, setApplied] = useState({
    ville:               searchParams.get('ville')  || '',
    metier:              searchParams.get('metier') || '',
    disponibleSeulement: false,
    noteMin:             0,
  })

  // Pagination
  const [page, setPage] = useState(0)

  // Résultats du backend
  const [content,       setContent]       = useState([])
  const [totalPages,    setTotalPages]    = useState(0)
  const [totalElements, setTotalElements] = useState(0)
  const [loading,       setLoading]       = useState(true)

  // Données de référence
  const [villes,  setVilles]  = useState([])
  const [metiers, setMetiers] = useState([])

  // Chargement unique des listes de référence
  useEffect(() => {
    villeService.getAllVilles()
      .then((data) => setVilles(data.map((v) => v.name)))
      .catch(console.error)
    metierService.getAllMetiers()
      .then((data) => setMetiers(data.map((m) => m.name)))
      .catch(console.error)
  }, [])

  // Appel API à chaque changement de filtres appliqués ou de page
  useEffect(() => {
    setLoading(true)

    const filters = { page, size: PAGE_SIZE }
    if (applied.metier)              filters.metier      = applied.metier
    if (applied.ville)               filters.ville       = applied.ville
    if (applied.disponibleSeulement) filters.isAvailable = true
    if (applied.noteMin > 0)         filters.noteMin     = applied.noteMin

    workerService.getAllWorkers(filters)
      .then((data) => {
        setContent(data.content        ?? [])
        setTotalPages(data.totalPages   ?? 0)
        setTotalElements(data.totalElements ?? 0)
      })
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [applied, page])

  // Applique les filtres et revient à la page 0
  const applyFilters = () => {
    setPage(0)
    setApplied({ ville, metier, disponibleSeulement, noteMin })
    const params = new URLSearchParams()
    if (ville)  params.set('ville', ville)
    if (metier) params.set('metier', metier)
    setSearchParams(params)
  }

  const handlePageChange = (newPage) => {
    setPage(newPage)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  return (
    <div className="flex flex-col gap-6 lg:flex-row">

      {/* Sidebar filtres */}
      <aside className="w-full shrink-0 rounded-xl border border-stone-200 bg-white p-4 lg:w-64">
        <h2 className="mb-3 font-semibold text-stone-900">Filtres</h2>

        <div className="flex flex-col gap-4">
          <div>
            <label className="mb-1 block text-sm font-medium text-stone-700">Métier</label>
            <select
              value={metier}
              onChange={(e) => setMetier(e.target.value)}
              className="w-full rounded-lg border border-stone-200 px-3 py-2 text-sm"
            >
              <option value="">Tous</option>
              {metiers.map((m) => (
                <option key={m} value={m}>{m}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-stone-700">Ville</label>
            <VilleSelect
              value={ville}
              onChange={setVille}
              villes={villes}
              placeholder="Toutes les villes"
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-stone-700">Note minimale</label>
            <select
              value={noteMin}
              onChange={(e) => setNoteMin(Number(e.target.value))}
              className="w-full rounded-lg border border-stone-200 px-3 py-2 text-sm"
            >
              <option value={0}>Toutes les notes</option>
              <option value={3}>3 étoiles et plus</option>
              <option value={4}>4 étoiles et plus</option>
              <option value={4.5}>4.5 étoiles et plus</option>
            </select>
          </div>

          <label className="flex items-center gap-2 text-sm text-stone-700">
            <input
              type="checkbox"
              checked={disponibleSeulement}
              onChange={(e) => setDisponibleSeulement(e.target.checked)}
              className="h-4 w-4 rounded border-stone-300 text-primary-600"
            />
            Disponible uniquement
          </label>

          <button
            onClick={applyFilters}
            disabled={loading}
            className="rounded-lg bg-primary-600 px-4 py-2 text-sm font-medium text-white hover:bg-primary-700 disabled:opacity-60"
          >
            Appliquer
          </button>
        </div>
      </aside>

      {/* Résultats */}
      <div className="flex-1">

        {/* En-tête : compteur + indicateur de page */}
        <div className="mb-4 flex items-center justify-between">
          <p className="text-sm text-stone-500">
            {loading
              ? 'Chargement…'
              : `${totalElements} ouvrier${totalElements !== 1 ? 's' : ''} trouvé${totalElements !== 1 ? 's' : ''}`
            }
          </p>
          {totalPages > 1 && !loading && (
            <p className="text-sm text-stone-400">
              Page {page + 1} / {totalPages}
            </p>
          )}
        </div>

        {/* Skeleton */}
        {loading ? (
          <div className="grid gap-4 sm:grid-cols-2">
            {Array.from({ length: 4 }, (_, i) => (
              <div key={i} className="h-40 animate-pulse rounded-xl bg-stone-100" />
            ))}
          </div>
        ) : (
          <>
            <div className="grid gap-4 sm:grid-cols-2">
              {content.map((w) => (
                <WorkerCard key={w.id} worker={w} />
              ))}
              {content.length === 0 && (
                <p className="col-span-full rounded-xl border border-dashed border-stone-300 p-8 text-center text-stone-500">
                  Aucun ouvrier ne correspond à votre recherche.
                </p>
              )}
            </div>

            <Pagination page={page} totalPages={totalPages} onChange={handlePageChange} />
          </>
        )}
      </div>
    </div>
  )
}
