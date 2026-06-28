import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { requestService } from '../../services/request.service'
import { missionService } from '../../services/mission.service'
import { ratingService } from '../../services/rating.service'
import { useAuth } from '../../context/AuthContext'
import { useTrip } from '../../context/TripContext'
import ProposalsList from '../../components/ProposalsList'
import RatingModal from '../../components/RatingModal'

// Workflow request : OPEN → PROPOSALS_SENT → SELECTED → IN_PROGRESS → CLOSED | CANCELLED
const STATUS_CONFIG = {
  OPEN:           { texte: 'Ouverte',              classe: 'bg-yellow-100 text-yellow-700',  step: 1 },
  PROPOSALS_SENT: { texte: 'Propositions reçues',  classe: 'bg-blue-100 text-blue-700',      step: 2 },
  SELECTED:       { texte: 'Ouvrier confirmé',     classe: 'bg-primary-100 text-primary-700', step: 3 },
  IN_PROGRESS:    { texte: 'En cours',             classe: 'bg-primary-100 text-primary-700', step: 3 },
  CLOSED:         { texte: 'Terminée',             classe: 'bg-green-100 text-green-700',     step: 4 },
  CANCELLED:      { texte: 'Annulée',              classe: 'bg-red-100 text-red-700',         step: null },
}

const STEPS = ['Ouverte', 'Propositions', 'En cours', 'Terminée']

const MISSION_STATUS = {
  PENDING:    { texte: 'Ouvrier en route bientôt',  classe: 'text-stone-500' },
  STARTED:    { texte: 'Ouvrier en chemin',          classe: 'text-primary-700 font-medium' },
  COMPLETED:  { texte: 'Mission terminée',           classe: 'text-green-700 font-medium' },
  CANCELLED:  { texte: 'Mission annulée',            classe: 'text-red-600' },
}

function StatusPipeline({ status }) {
  const config = STATUS_CONFIG[status]
  const currentStep = config?.step ?? 0
  if (!currentStep) return null

  return (
    <div className="mt-2 flex items-center">
      {STEPS.map((label, i) => {
        const step = i + 1
        const done = step < currentStep
        const active = step === currentStep
        return (
          <div key={label} className="flex items-center">
            <div
              className={`flex h-5 w-5 items-center justify-center rounded-full text-xs font-semibold ${
                done
                  ? 'bg-primary-600 text-white'
                  : active
                    ? 'bg-primary-100 text-primary-700 ring-2 ring-primary-400'
                    : 'bg-stone-100 text-stone-400'
              }`}
            >
              {done ? '✓' : step}
            </div>
            {i < STEPS.length - 1 && (
              <div className={`h-px w-6 ${done ? 'bg-primary-400' : 'bg-stone-200'}`} />
            )}
          </div>
        )
      })}
    </div>
  )
}

export default function ClientRequests() {
  const { user } = useAuth()
  const { demarrerMissionDirecte } = useTrip()
  const navigate = useNavigate()

  const [demandes, setDemandes] = useState([])
  const [missionByRequest, setMissionByRequest] = useState({})
  const [workerByRequest, setWorkerByRequest] = useState({})  // workerNom indexed by requestId
  const [ratingTarget, setRatingTarget] = useState(null)      // { missionId, workerId, workerNom }
  const [ratedMissions, setRatedMissions] = useState(new Set())

  useEffect(() => {
    if (!user?.id) return

    Promise.all([
      requestService.getRequestsByClient(user.id),
      missionService.getMissionsByClient(user.id),
    ])
      .then(([requests, missions]) => {
        setDemandes(requests)

        // Index missions par requestId
        const byReq = {}
        missions.forEach((m) => {
          byReq[m.requestId] = m
        })
        setMissionByRequest(byReq)
      })
      .catch((err) => console.error('[ClientRequests] Erreur chargement:', err))
  }, [user?.id])

  const handleProposalAccepted = (demandeId) => {
    setDemandes((prev) =>
      prev.map((d) => (d.id === demandeId ? { ...d, status: 'SELECTED' } : d))
    )
    // Recharger les missions pour afficher la nouvelle
    missionService
      .getMissionsByClient(user.id)
      .then((missions) => {
        const byReq = {}
        missions.forEach((m) => (byReq[m.requestId] = m))
        setMissionByRequest(byReq)
      })
      .catch(console.error)
  }

  const suivreMission = (mission, worker) => {
    demarrerMissionDirecte({
      worker: { id: mission.workerId, nom: worker?.nom ?? 'Ouvrier', metier: worker?.metier ?? '' },
      metier: worker?.metier ?? '',
      ville: worker?.ville ?? '',
      missionId: mission.id,
      clientId: user?.id,
    })
    navigate('/')
  }

  const ouvrirNotation = (mission, workerNom) => {
    setRatingTarget({ missionId: mission.id, workerId: mission.workerId, workerNom })
  }

  const soumettreNotation = ({ note, commentaire }) => {
    if (!ratingTarget) return
    ratingService
      .saveRating({
        missionId: ratingTarget.missionId,
        clientId: user?.id,
        workerId: ratingTarget.workerId,
        rating: note,
        comment: commentaire,
        createdAt: new Date().toISOString(),
      })
      .catch((err) => console.error('[ClientRequests] Erreur sauvegarde notation:', err))

    setRatedMissions((prev) => new Set(prev).add(ratingTarget.missionId))
    setRatingTarget(null)
  }

  return (
    <div className="mx-auto w-full max-w-2xl lg:max-w-none">
      <div className="mb-4 flex items-center justify-between">
        <h1 className="text-lg font-bold text-stone-900">Mes demandes</h1>
        <button
          onClick={() => navigate('/nouvelle-demande')}
          className="rounded-xl bg-primary-600 px-4 py-2 text-sm font-semibold text-white hover:bg-primary-700"
        >
          + Nouvelle demande
        </button>
      </div>

      {demandes.length === 0 && (
        <div className="rounded-xl border border-dashed border-stone-300 p-10 text-center text-stone-500">
          <p className="font-medium">Aucune demande pour le moment.</p>
          <p className="mt-1 text-sm">
            <button
              onClick={() => navigate('/nouvelle-demande')}
              className="font-semibold text-primary-600 hover:underline"
            >
              Faites votre première demande
            </button>{' '}
            et recevez des propositions d'ouvriers qualifiés.
          </p>
        </div>
      )}

      <ul className="flex flex-col gap-3 lg:grid lg:grid-cols-2 lg:gap-4 xl:grid-cols-3">
        {demandes.map((d) => {
          const config = STATUS_CONFIG[d.status] ?? {
            texte: d.status,
            classe: 'bg-stone-100 text-stone-500',
          }
          const mission = missionByRequest[d.id] ?? null
          const missionInfo = mission ? MISSION_STATUS[mission.status] : null
          const dejaNote = ratedMissions.has(mission?.id)

          return (
            <li key={d.id} className="rounded-xl border border-stone-200 bg-white p-4">
              {/* En-tête */}
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div>
                  <p className="font-medium text-stone-900">{d.metier}</p>
                  <p className="text-sm text-stone-500">{d.adresse ?? d.ville}</p>
                  {d.description && (
                    <p className="mt-1 text-xs italic text-stone-400 line-clamp-2">
                      {d.description}
                    </p>
                  )}
                </div>
                <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${config.classe}`}>
                  {config.texte}
                </span>
              </div>

              {/* Pipeline de statut */}
              <StatusPipeline status={d.status} />

              {/* Propositions */}
              <ProposalsList
                requestId={d.id}
                clientId={user?.id}
                requestStatus={d.status}
                onProposalAccepted={() => handleProposalAccepted(d.id)}
              />

              {/* Statut de la mission */}
              {mission && (
                <div className="mt-3 rounded-lg border border-stone-100 bg-sand-50 p-3">
                  <div className="flex items-center justify-between gap-2">
                    <p className={`text-sm ${missionInfo?.classe ?? 'text-stone-500'}`}>
                      {missionInfo?.texte ?? mission.status}
                    </p>
                    {/* Bouton "Suivre" pour mission démarrée */}
                    {mission.status === 'STARTED' && (
                      <button
                        onClick={() => suivreMission(mission, { nom: 'Ouvrier', metier: d.metier, ville: d.ville })}
                        className="shrink-0 rounded-lg bg-primary-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-primary-700"
                      >
                        Suivre sur la carte
                      </button>
                    )}
                  </div>

                  {/* Notation après mission terminée */}
                  {mission.status === 'COMPLETED' && !dejaNote && (
                    <button
                      onClick={() => ouvrirNotation(mission, d.metier)}
                      className="mt-2 w-full rounded-lg bg-amber-500 px-3 py-2 text-sm font-medium text-white hover:bg-amber-600"
                    >
                      ★ Évaluer l'ouvrier
                    </button>
                  )}

                  {mission.status === 'COMPLETED' && dejaNote && (
                    <p className="mt-2 text-xs text-green-700">Merci pour votre évaluation !</p>
                  )}
                </div>
              )}
            </li>
          )
        })}
      </ul>

      <RatingModal
        open={!!ratingTarget}
        workerName={ratingTarget?.workerNom ?? ''}
        onSubmit={soumettreNotation}
        onSkip={() => setRatingTarget(null)}
      />
    </div>
  )
}
