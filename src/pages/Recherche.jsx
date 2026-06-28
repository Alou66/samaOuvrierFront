import { useEffect, useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { METIERS, VILLES } from '../constants/referenceData'
import { workerService } from '../services/worker.service'
import WorkerCard from '../components/WorkerCard'

export default function Recherche() {
  const [searchParams, setSearchParams] = useSearchParams()
  const [ville, setVille] = useState(searchParams.get('ville') || '')
  const [metier, setMetier] = useState(searchParams.get('metier') || '')
  const [disponibleSeulement, setDisponibleSeulement] = useState(false)
  const [noteMin, setNoteMin] = useState(0)

  const [workers, setWorkers] = useState([])

  useEffect(() => {
    workerService
      .getAllWorkers()
      .then(setWorkers)
      .catch((err) => console.error("[Recherche] Impossible de charger les ouvriers depuis l'API:", err))
  }, [])

  const results = useMemo(() => {
    return workers.filter((w) => {
      if (ville && w.ville !== ville) return false
      if (metier && w.metier !== metier) return false
      if (disponibleSeulement && !w.isAvailable) return false
      if (w.note < noteMin) return false
      return true
    })
  }, [workers, ville, metier, disponibleSeulement, noteMin])

  const applyFilters = () => {
    const params = new URLSearchParams()
    if (ville) params.set('ville', ville)
    if (metier) params.set('metier', metier)
    setSearchParams(params)
  }

  return (
    <div className="flex flex-col gap-6 lg:flex-row">
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
              {METIERS.map((m) => (
                <option key={m} value={m}>
                  {m}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-stone-700">Ville</label>
            <select
              value={ville}
              onChange={(e) => setVille(e.target.value)}
              className="w-full rounded-lg border border-stone-200 px-3 py-2 text-sm"
            >
              <option value="">Toutes</option>
              {VILLES.map((v) => (
                <option key={v} value={v}>
                  {v}
                </option>
              ))}
            </select>
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
            className="rounded-lg bg-primary-600 px-4 py-2 text-sm font-medium text-white hover:bg-primary-700"
          >
            Appliquer
          </button>
        </div>
      </aside>

      <div className="flex-1">
        <p className="mb-4 text-sm text-stone-500">{results.length} ouvrier(s) trouvé(s)</p>
        <div className="grid gap-4 sm:grid-cols-2">
          {results.map((w) => (
            <WorkerCard key={w.id} worker={w} />
          ))}
          {results.length === 0 && (
            <p className="col-span-full rounded-xl border border-dashed border-stone-300 p-8 text-center text-stone-500">
              Aucun ouvrier ne correspond à votre recherche.
            </p>
          )}
        </div>
      </div>
    </div>
  )
}
