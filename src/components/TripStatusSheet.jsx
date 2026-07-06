import { useState } from 'react'
import { useTrip } from '../context/TripContext'
import { useAuth } from '../context/AuthContext'
import { ratingService } from '../services/rating.service'
import RatingModal from './RatingModal'
import Avatar from './Avatar'

/**
 * Sheet superposée à la carte (Home page) affichant le statut d'une mission suivie.
 * S'affiche uniquement quand le trip est en_route ou arrive.
 */
export default function TripStatusSheet() {
  const { trip, marquerArrive, terminerTrajet } = useTrip()
  const { user } = useAuth()
  const [notationOuverte, setNotationOuverte] = useState(false)

  if (!trip || (trip.statut !== 'en_route' && trip.statut !== 'arrive')) return null

  const enregistrerNote = ({ note, commentaire }) => {
    ratingService
      .saveRating({
        missionId: trip.missionId ?? null,
        clientId: trip.clientId ?? user?.id ?? null,
        workerId: trip.worker?.id ?? null,
        rating: note,
        comment: commentaire,
        createdAt: new Date().toISOString(),
      })
      .catch((err) => console.error('[TripStatusSheet] Erreur sauvegarde notation:', err))

    setNotationOuverte(false)
    terminerTrajet()
  }

  return (
    <div className="absolute inset-x-0 bottom-0 z-[500] p-3">
      <div className="rounded-2xl border border-primary-100 bg-white p-4 shadow-lg">
        <div className="flex items-center gap-3">
          <Avatar
            src={trip.worker?.photoProfil}
            name={trip.worker?.nom}
            className="h-12 w-12 bg-primary-100 text-lg text-primary-700"
          />
          <div className="flex-1">
            <p className="font-semibold text-stone-900">{trip.worker?.nom}</p>
            <p className="text-sm text-stone-500">{trip.worker?.metier}</p>
          </div>
          {trip.statut === 'en_route' && (
            <div className="text-right">
              <p className="text-xl font-bold text-primary-700">{trip.etaMin} min</p>
              <p className="text-xs text-stone-500">Arrivée estimée</p>
            </div>
          )}
        </div>

        {trip.statut === 'arrive' ? (
          <div className="mt-3 rounded-lg bg-primary-50 p-3 text-center">
            <p className="font-semibold text-primary-700">L'ouvrier est arrivé</p>
            <p className="mt-1 text-sm text-stone-600">{trip.worker?.nom} est devant chez vous.</p>
            <button
              onClick={() => setNotationOuverte(true)}
              className="mt-3 w-full rounded-lg bg-primary-600 px-4 py-2 text-sm font-medium text-white hover:bg-primary-700"
            >
              Terminé — Laisser un avis
            </button>
            <button
              onClick={terminerTrajet}
              className="mt-2 text-sm text-stone-400 underline"
            >
              Fermer sans noter
            </button>
          </div>
        ) : (
          <div className="mt-3 flex items-center justify-between gap-2">
            <p className="text-sm text-stone-500">{trip.worker?.nom} est en route vers vous.</p>
            <button
              onClick={marquerArrive}
              className="shrink-0 rounded-lg bg-primary-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-primary-700"
            >
              Marquer arrivé
            </button>
          </div>
        )}
      </div>

      <RatingModal
        open={notationOuverte}
        workerName={trip.worker?.nom}
        onSubmit={enregistrerNote}
        onSkip={() => {
          setNotationOuverte(false)
          terminerTrajet()
        }}
      />
    </div>
  )
}
