import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { workerService } from '../services/worker.service'
import { requestService } from '../services/request.service'
import { useAuth } from '../context/AuthContext'
import Stars from '../components/Stars'
import { CheckIcon } from '../components/Icons'

export default function RequestIntervention() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { user } = useAuth()

  const [worker, setWorker] = useState(null)
  const [description, setDescription] = useState('')
  const [adresse, setAdresse] = useState('')
  const [budget, setBudget] = useState('')
  const [urgency, setUrgency] = useState('NORMAL')
  const [envoye, setEnvoye] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    workerService
      .getWorkerById(id)
      .then(setWorker)
      .catch((err) => console.error('[RequestIntervention] Erreur chargement ouvrier:', err))
  }, [id])

  if (!worker) return null

  const handleSubmit = async (e) => {
    e.preventDefault()
    setSubmitting(true)
    try {
      await requestService.createRequest({
        clientId: user?.id ?? null,
        metier: worker.metier,
        description,
        ville: worker.ville,
        adresse,
        budget: budget ? Number(budget) : null,
        urgency,
        photos: [],
      })
    } catch (err) {
      console.error('[RequestIntervention] Erreur création demande:', err)
    } finally {
      setSubmitting(false)
      setEnvoye(true)
    }
  }

  if (envoye) {
    return (
      <div className="mx-auto max-w-md rounded-xl border border-green-200 bg-green-50 p-6 text-center">
        <CheckIcon className="mx-auto h-9 w-9 text-green-700" />
        <h1 className="mt-2 text-lg font-semibold text-green-800">Demande envoyée</h1>
        <p className="mt-1 text-sm text-green-700">
          Votre demande a été publiée. Les ouvriers disponibles vont vous faire des propositions.
        </p>
        <button
          onClick={() => navigate('/demandes')}
          className="mt-4 rounded-lg bg-primary-600 px-4 py-2 text-sm font-medium text-white hover:bg-primary-700"
        >
          Voir mes demandes
        </button>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-lg">
      {/* Résumé de l'ouvrier cible */}
      <div className="mb-4 flex items-center gap-3 rounded-xl border border-stone-200 bg-white p-4">
        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-primary-100 text-xl font-bold text-primary-600">
          {worker.nom.charAt(0)}
        </div>
        <div className="min-w-0 flex-1">
          <p className="font-semibold text-stone-900">{worker.nom}</p>
          <p className="text-sm text-stone-500">
            {worker.metier} · {worker.ville}
          </p>
          <div className="mt-0.5 flex items-center gap-1 text-xs">
            <Stars note={worker.note} size="text-xs" />
            <span className="text-stone-400">
              {worker.note} ({worker.avis} avis)
            </span>
          </div>
        </div>
        <span
          className={`shrink-0 rounded-full px-2 py-0.5 text-xs font-medium ${
            worker.isAvailable ? 'bg-green-100 text-green-700' : 'bg-stone-100 text-stone-500'
          }`}
        >
          {worker.isAvailable ? 'Disponible' : 'Indisponible'}
        </span>
      </div>

      <h1 className="mb-4 text-lg font-bold text-stone-900">Décrivez votre besoin</h1>

      <form
        onSubmit={handleSubmit}
        className="flex flex-col gap-4 rounded-xl border border-stone-200 bg-white p-5"
      >
        <div>
          <label className="mb-1 block text-sm font-medium text-stone-700">
            Description du besoin <span className="text-red-500">*</span>
          </label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={4}
            required
            className="w-full rounded-lg border border-stone-200 px-3 py-2 text-sm"
            placeholder="Décrivez votre problème en détail : symptômes, urgence, contexte..."
          />
          <p className="mt-1 text-xs text-stone-400">
            L'ouvrier vous proposera un prix et un délai adaptés.
          </p>
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium text-stone-700">
            Adresse d'intervention <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            value={adresse}
            onChange={(e) => setAdresse(e.target.value)}
            placeholder="Quartier, ville..."
            className="w-full rounded-lg border border-stone-200 px-3 py-2 text-sm"
            required
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="mb-1 block text-sm font-medium text-stone-700">
              Budget indicatif (FCFA)
            </label>
            <input
              type="number"
              value={budget}
              onChange={(e) => setBudget(e.target.value)}
              min="0"
              step="500"
              placeholder="Optionnel"
              className="w-full rounded-lg border border-stone-200 px-3 py-2 text-sm"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-stone-700">Urgence</label>
            <select
              value={urgency}
              onChange={(e) => setUrgency(e.target.value)}
              className="w-full rounded-lg border border-stone-200 px-3 py-2 text-sm"
            >
              <option value="LOW">Faible — pas urgent</option>
              <option value="NORMAL">Normale</option>
              <option value="HIGH">Haute — urgent</option>
            </select>
          </div>
        </div>

        <button
          type="submit"
          disabled={submitting}
          className="rounded-lg bg-primary-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-primary-700 disabled:opacity-60"
        >
          {submitting ? 'Envoi en cours…' : 'Envoyer la demande'}
        </button>
      </form>
    </div>
  )
}
