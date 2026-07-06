import { useEffect, useState } from 'react'
import { useNavigate, useParams, Link } from 'react-router-dom'
import { workerService } from '../services/worker.service'
import { ratingService } from '../services/rating.service'
import Stars from '../components/Stars'
import Avatar from '../components/Avatar'

export default function WorkerProfile() {
  const { id } = useParams()
  const navigate = useNavigate()

  const [worker, setWorker] = useState(null)
  const [ratings, setRatings] = useState([])
  const [notFound, setNotFound] = useState(false)

  useEffect(() => {
    workerService
      .getWorkerById(id)
      .then(setWorker)
      .catch((err) => {
        console.error("[WorkerProfile] Impossible de charger l'ouvrier:", err)
        setNotFound(true)
      })

    ratingService
      .getRatingsByWorker(id)
      .then(setRatings)
      .catch((err) => console.error('[WorkerProfile] Erreur chargement avis:', err))
  }, [id])

  if (notFound) {
    return (
      <div className="text-center text-stone-500">
        Ouvrier introuvable.{' '}
        <Link to="/recherche" className="text-primary-600">
          Retour à la recherche
        </Link>
      </div>
    )
  }

  if (!worker) return null

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-4 rounded-xl border border-stone-200 bg-white p-5 sm:flex-row sm:items-center">
        <Avatar
          src={worker.photoProfil}
          name={worker.nom}
          className="h-20 w-20 bg-primary-100 text-3xl text-primary-600"
        />
        <div className="flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="text-xl font-bold text-stone-900">{worker.nom}</h1>
            <span
              className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                worker.isAvailable ? 'bg-green-100 text-green-700' : 'bg-stone-100 text-stone-500'
              }`}
            >
              {worker.isAvailable ? 'Disponible' : 'Indisponible'}
            </span>
          </div>
          <p className="text-sm text-stone-500">
            {worker.metier} · {worker.ville}
            {worker.yearsOfExperience ? ` · ${worker.yearsOfExperience} ans d'exp.` : ''}
          </p>
          <div className="mt-1 flex items-center gap-1.5 text-sm">
            <Stars note={worker.note} />
            <span className="text-stone-500">
              {worker.note} ({worker.avis} avis)
            </span>
          </div>
          {worker.languages?.length > 0 && (
            <p className="mt-1 text-xs text-stone-400">{worker.languages.join(' · ')}</p>
          )}
        </div>
        <button
          disabled={!worker.isAvailable}
          onClick={() => navigate(`/ouvrier/${worker.id}/demande`)}
          className="rounded-lg bg-primary-600 px-5 py-2.5 text-sm font-medium text-white hover:bg-primary-700 disabled:cursor-not-allowed disabled:bg-stone-300"
        >
          Demander une intervention
        </button>
      </div>

      <section className="rounded-xl border border-stone-200 bg-white p-5">
        <h2 className="mb-2 font-semibold text-stone-900">À propos</h2>
        <p className="text-sm text-stone-600">{worker.description}</p>
      </section>

      <section className="rounded-xl border border-stone-200 bg-white p-5">
        <h2 className="mb-3 font-semibold text-stone-900">
          Avis clients{ratings.length > 0 ? ` (${ratings.length})` : ''}
        </h2>
        {ratings.length === 0 && (
          <p className="text-sm text-stone-500">Aucun avis pour le moment.</p>
        )}
        <ul className="flex flex-col gap-3">
          {ratings.map((r) => (
            <li key={r.id} className="rounded-lg bg-sand-50 p-3">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-stone-800">Client</span>
                <Stars note={r.rating} size="text-sm" />
              </div>
              <p className="mt-1 text-sm text-stone-600">{r.comment}</p>
            </li>
          ))}
        </ul>
      </section>
    </div>
  )
}
