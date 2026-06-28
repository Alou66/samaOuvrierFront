import { useCallback, useEffect, useState } from 'react'
import { requestService } from '../../services/request.service'
import { proposalService } from '../../services/proposal.service'
import { missionService } from '../../services/mission.service'
import { workerService } from '../../services/worker.service'
import { useAuth } from '../../context/AuthContext'
import { useTrip } from '../../context/TripContext'
import { formatDuration, formatPrice } from '../../utils/format'
import Stars from '../../components/Stars'
import LocationMap from '../../components/LocationMap'

// Données de démo minimales (affiché quand aucun worker connecté)
const DEMO_WORKER = {
  id: 1,
  nom: 'Moussa Diop',
  metier: 'Plombier',
  ville: 'Dakar',
  note: 4.8,
  avis: 32,
  isAvailable: true,
  role: 'WORKER',
}

const PROPOSAL_BADGE = {
  PENDING:  'bg-yellow-100 text-yellow-700',
  ACCEPTED: 'bg-green-100 text-green-700',
  REJECTED: 'bg-stone-100 text-stone-400',
  EXPIRED:  'bg-stone-100 text-stone-400',
}

const PROPOSAL_LABEL = {
  PENDING:  'En attente',
  ACCEPTED: 'Acceptée',
  REJECTED: 'Refusée',
  EXPIRED:  'Expirée',
}

const URGENCY_BADGE = {
  HIGH:   'bg-red-100 text-red-700',
  NORMAL: 'bg-yellow-50 text-yellow-700',
  LOW:    'bg-stone-100 text-stone-500',
}

const URGENCY_LABEL = {
  HIGH:   'Urgent',
  NORMAL: 'Normal',
  LOW:    'Faible',
}

export default function WorkerDashboard() {
  const { user } = useAuth()
  const { trip, demarrerMissionDirecte, marquerArrive, terminerTrajet } = useTrip()

  const moi = (user?.role === 'WORKER' ? user : null) ?? DEMO_WORKER

  const [isAvailable, setIsAvailable] = useState(moi?.isAvailable ?? true)

  // Données API
  const [newRequests, setNewRequests] = useState([])   // demandes ouvertes pour mon métier (pas encore proposé)
  const [myProposals, setMyProposals] = useState([])   // propositions envoyées
  const [myMissions, setMyMissions] = useState([])     // missions assignées
  const [requestsById, setRequestsById] = useState({}) // lookup pour le contexte des missions

  // Formulaire de proposition
  const [proposingId, setProposingId] = useState(null)
  const [proposalForm, setProposalForm] = useState({ price: '', estimatedDurationMinutes: '', message: '' })

  const loadData = useCallback(() => {
    if (!moi?.id || !moi?.metier) return

    Promise.all([
      requestService.getRequestsByMetier(moi.metier),
      proposalService.getProposalsByWorker(moi.id),
      missionService.getMissionsByWorker(moi.id),
    ])
      .then(([metierRequests, proposals, missions]) => {
        const byReqId = Object.fromEntries(metierRequests.map((r) => [r.id, r]))
        setRequestsById(byReqId)

        // Requêtes sur lesquelles j'ai déjà proposé
        const proposedIds = new Set(proposals.map((p) => p.requestId))

        // Nouvelles demandes = OPEN ou PROPOSALS_SENT, pas encore proposé
        setNewRequests(
          metierRequests.filter(
            (r) =>
              (r.status === 'OPEN' || r.status === 'PROPOSALS_SENT') &&
              !proposedIds.has(r.id)
          )
        )

        setMyProposals(proposals)
        setMyMissions(missions)
      })
      .catch((err) => console.error('[WorkerDashboard] Erreur chargement:', err))
  }, [moi?.id, moi?.metier])

  useEffect(() => {
    loadData()
  }, [loadData])

  // Synchroniser la disponibilité avec le profil chargé
  useEffect(() => {
    setIsAvailable(moi?.isAvailable ?? true)
  }, [moi?.id])

  // Mission active (STARTED depuis l'API)
  const activeMission = myMissions.find((m) => m.status === 'STARTED') ?? null
  // Mission en attente (PENDING depuis l'API)
  const pendingMissions = myMissions.filter((m) => m.status === 'PENDING')
  // Propositions en attente d'une réponse client
  const pendingProposals = myProposals.filter((p) => p.status === 'PENDING')
  // Propositions acceptées (ouvrier choisi, mission en cours)
  const acceptedProposals = myProposals.filter((p) => p.status === 'ACCEPTED')

  const tripEstLeMien = trip?.worker?.id === moi.id || trip?.missionId === activeMission?.id

  const enMission = !!activeMission || !!pendingMissions.length || tripEstLeMien

  // ─── Disponibilité ────────────────────────────────────────────────────────

  const toggleAvailability = () => {
    const next = !isAvailable
    setIsAvailable(next)
    if (moi?.id) {
      workerService.updateAvailability(moi.id, next).catch(console.error)
    }
  }

  // ─── Proposition ──────────────────────────────────────────────────────────

  const ouvrirFormProposition = (requestId) => {
    setProposingId(requestId)
    setProposalForm({ price: '', estimatedDurationMinutes: '', message: '' })
  }

  const soumettreProposition = async (requestId) => {
    try {
      await proposalService.createProposal({
        requestId,
        workerId: moi.id,
        workerNom: moi.nom,
        workerNote: moi.note ?? null,
        price: Number(proposalForm.price),
        estimatedDurationMinutes: Number(proposalForm.estimatedDurationMinutes),
        message: proposalForm.message,
        expiresAt: new Date(Date.now() + 48 * 60 * 60 * 1000).toISOString(),
      })
      await requestService.updateRequestStatus(requestId, 'PROPOSALS_SENT')
    } catch (err) {
      console.error('[WorkerDashboard] Erreur proposition:', err)
    } finally {
      setProposingId(null)
      loadData()
    }
  }

  // ─── Démarrer une mission ─────────────────────────────────────────────────

  const demarrerMission = async (mission) => {
    try {
      await missionService.startMission(mission.id)
      const request = requestsById[mission.requestId]
      if (request) {
        await requestService.updateRequestStatus(request.id, 'IN_PROGRESS')
      }
      // Lancer le suivi carte
      demarrerMissionDirecte({
        worker: { id: moi.id, nom: moi.nom, metier: moi.metier },
        metier: moi.metier,
        ville: request?.ville ?? moi.ville,
        missionId: mission.id,
        clientId: mission.clientId,
      })
      loadData()
    } catch (err) {
      console.error('[WorkerDashboard] Erreur démarrage mission:', err)
    }
  }

  // ─── Terminer une mission ─────────────────────────────────────────────────

  const terminerMission = async (mission) => {
    try {
      await missionService.completeMission(mission.id)
      const request = requestsById[mission.requestId]
      if (request) {
        await requestService.updateRequestStatus(request.id, 'CLOSED')
      }
      if (tripEstLeMien) terminerTrajet()
      setIsAvailable(true)
      if (moi?.id) {
        workerService.updateAvailability(moi.id, true).catch(console.error)
      }
      loadData()
    } catch (err) {
      console.error('[WorkerDashboard] Erreur terminaison mission:', err)
    }
  }

  // ─── Ignorer une demande ──────────────────────────────────────────────────

  const ignorerDemande = (requestId) => {
    setNewRequests((prev) => prev.filter((r) => r.id !== requestId))
  }

  const missionsTerminees = myMissions.filter((m) => m.status === 'COMPLETED').length

  // ─── Rendu ────────────────────────────────────────────────────────────────

  return (
    <div className="flex flex-col gap-4">

      {/* ── Salutation + stats ───────────────────────────────────────────── */}
      <div className="flex flex-col gap-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <h1 className="text-xl font-bold text-stone-900">
              Bonjour, {moi.nom.split(' ')[0]} 👋
            </h1>
            <p className="text-sm text-stone-500">
              {moi.metier} · {moi.ville}
            </p>
          </div>
          {/* Toggle disponibilité compact */}
          <div className="flex items-center gap-2 rounded-xl border border-stone-200 bg-white px-4 py-2">
            <span className="text-sm font-medium text-stone-700">
              {enMission ? 'En mission' : isAvailable ? 'Disponible' : 'Indisponible'}
            </span>
            <button
              disabled={enMission}
              onClick={toggleAvailability}
              className={`relative h-6 w-11 rounded-full transition disabled:cursor-not-allowed disabled:opacity-50 ${
                isAvailable ? 'bg-green-500' : 'bg-stone-300'
              }`}
            >
              <span className={`absolute top-0.5 h-5 w-5 rounded-full bg-white transition ${isAvailable ? 'left-5' : 'left-0.5'}`} />
            </button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {[
            { label: 'Nouvelles demandes',   value: newRequests.length,      color: 'text-yellow-700',  bg: 'bg-yellow-50' },
            { label: 'Propositions envoyées', value: pendingProposals.length, color: 'text-blue-700',    bg: 'bg-blue-50' },
            { label: 'Missions confirmées',  value: acceptedProposals.length, color: 'text-primary-700', bg: 'bg-primary-50' },
            { label: 'Missions terminées',   value: missionsTerminees,        color: 'text-green-700',   bg: 'bg-green-50' },
          ].map((s) => (
            <div key={s.label} className={`flex flex-col items-center justify-center rounded-xl border border-stone-200 p-4 text-center ${s.bg}`}>
              <p className={`text-3xl font-bold ${s.color}`}>{s.value}</p>
              <p className="mt-1 text-xs text-stone-500">{s.label}</p>
            </div>
          ))}
        </div>

        {/* Note moyenne */}
        {moi.note > 0 && (
          <div className="flex items-center gap-3 rounded-xl border border-stone-200 bg-white px-4 py-3">
            <Stars note={moi.note} size="text-base" />
            <p className="text-sm text-stone-700">
              <span className="font-semibold">{moi.note}</span> / 5
              <span className="ml-1 text-stone-400">({moi.avis} avis)</span>
            </p>
          </div>
        )}
      </div>

      {/* ── Carte + suivi mission active ─────────────────────────────────── */}
      {(tripEstLeMien && trip?.statut === 'en_route') && (
        <div className="flex flex-col gap-3 rounded-xl border border-primary-200 bg-white p-4">
          <div className="relative h-72 sm:h-96">
            <LocationMap />
          </div>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="font-semibold text-stone-900">En route vers le client</p>
              <p className="text-sm text-stone-500">
                {trip.metier} à {trip.ville} · arrivée estimée dans {trip.etaMin} min
              </p>
            </div>
            <div className="flex gap-2">
              <button
                onClick={marquerArrive}
                className="rounded-lg bg-primary-600 px-4 py-2 text-sm font-medium text-white hover:bg-primary-700"
              >
                Je suis arrivé
              </button>
              {activeMission && (
                <button
                  onClick={() => terminerMission(activeMission)}
                  className="rounded-lg border border-stone-300 px-4 py-2 text-sm font-medium text-stone-700 hover:bg-sand-50"
                >
                  Terminer
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {(tripEstLeMien && trip?.statut === 'arrive') && (
        <div className="flex flex-col gap-3 rounded-xl border border-green-200 bg-green-50 p-4">
          <p className="font-semibold text-green-800">Vous êtes arrivé chez le client</p>
          {activeMission && (
            <button
              onClick={() => terminerMission(activeMission)}
              className="rounded-lg bg-primary-600 px-4 py-2 text-sm font-medium text-white hover:bg-primary-700 sm:self-start"
            >
              Terminer la mission
            </button>
          )}
        </div>
      )}

      {/* Mission active hors TripContext (STARTED mais carte non lancée) */}
      {activeMission && !tripEstLeMien && (
        <div className="flex flex-col gap-3 rounded-xl border border-primary-200 bg-primary-50 p-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="font-semibold text-primary-700">Mission en cours</p>
            <p className="text-sm text-stone-600">
              {requestsById[activeMission.requestId]?.metier} à{' '}
              {requestsById[activeMission.requestId]?.ville}
            </p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => demarrerMission(activeMission)}
              className="rounded-lg bg-primary-600 px-4 py-2 text-sm font-medium text-white hover:bg-primary-700"
            >
              Afficher la carte
            </button>
            <button
              onClick={() => terminerMission(activeMission)}
              className="rounded-lg border border-stone-300 px-4 py-2 text-sm font-medium text-stone-700 hover:bg-white"
            >
              Terminer
            </button>
          </div>
        </div>
      )}

      {/* ── Missions en attente de démarrage (PENDING) ────────────────────── */}
      {pendingMissions.length > 0 && (
        <section className="rounded-xl border border-stone-200 bg-white p-5">
          <h2 className="mb-3 font-semibold text-stone-900">
            Missions confirmées — à démarrer
          </h2>
          <ul className="flex flex-col gap-3">
            {pendingMissions.map((m) => {
              const req = requestsById[m.requestId]
              return (
                <li
                  key={m.id}
                  className="flex flex-col gap-2 rounded-lg border border-primary-100 bg-primary-50 p-3 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div>
                    <p className="font-medium text-stone-900">
                      {req?.metier ?? 'Mission'} — {req?.ville ?? ''}
                    </p>
                    {req?.adresse && <p className="text-sm text-stone-500">{req.adresse}</p>}
                    {req?.description && (
                      <p className="text-xs italic text-stone-400 line-clamp-2">{req.description}</p>
                    )}
                  </div>
                  <button
                    onClick={() => demarrerMission(m)}
                    className="shrink-0 rounded-lg bg-primary-600 px-4 py-2 text-sm font-medium text-white hover:bg-primary-700"
                  >
                    Démarrer la mission
                  </button>
                </li>
              )
            })}
          </ul>
        </section>
      )}

      {/* ── Nouvelles demandes pour mon métier ────────────────────────────── */}
      <section className="rounded-xl border border-stone-200 bg-white p-5">
        <h2 className="mb-3 font-semibold text-stone-900">
          Nouvelles demandes
          {newRequests.length > 0 && (
            <span className="ml-2 rounded-full bg-primary-600 px-2 py-0.5 text-xs font-medium text-white">
              {newRequests.length}
            </span>
          )}
        </h2>

        {newRequests.length === 0 && (
          <p className="text-sm text-stone-500">
            Aucune nouvelle demande pour {moi.metier} pour le moment.
          </p>
        )}

        <ul className="flex flex-col gap-3">
          {newRequests.map((r) => (
            <li key={r.id} className="rounded-lg border border-stone-100 p-3">
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div className="flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="font-medium text-stone-800">{r.metier}</p>
                    {r.urgency && (
                      <span
                        className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                          URGENCY_BADGE[r.urgency] ?? 'bg-stone-100 text-stone-500'
                        }`}
                      >
                        {URGENCY_LABEL[r.urgency] ?? r.urgency}
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-stone-500">{r.adresse ?? r.ville}</p>
                  {r.description && (
                    <p className="mt-1 text-xs italic text-stone-400 line-clamp-3">
                      {r.description}
                    </p>
                  )}
                  {r.budget && (
                    <p className="mt-1 text-xs text-stone-500">
                      Budget indicatif : {formatPrice(r.budget)}
                    </p>
                  )}
                </div>
                <span className="rounded-full bg-yellow-50 px-2 py-0.5 text-xs font-medium text-yellow-700">
                  {r.status === 'OPEN' ? 'Nouvelle' : 'En attente de propositions'}
                </span>
              </div>

              {proposingId !== r.id && (
                <div className="mt-2 flex gap-2">
                  <button
                    onClick={() => ouvrirFormProposition(r.id)}
                    className="rounded-lg bg-green-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-green-700"
                  >
                    Faire une proposition
                  </button>
                  <button
                    onClick={() => ignorerDemande(r.id)}
                    className="rounded-lg border border-stone-300 px-3 py-1.5 text-sm font-medium text-stone-600 hover:bg-sand-50"
                  >
                    Ignorer
                  </button>
                </div>
              )}

              {/* Formulaire de proposition inline */}
              {proposingId === r.id && (
                <form
                  onSubmit={(e) => {
                    e.preventDefault()
                    soumettreProposition(r.id)
                  }}
                  className="mt-3 flex flex-col gap-2 border-t border-stone-100 pt-3"
                >
                  <div className="flex gap-2">
                    <div className="flex-1">
                      <label className="mb-1 block text-xs font-medium text-stone-600">
                        Prix (FCFA)
                      </label>
                      <input
                        type="number"
                        placeholder={r.budget ? `Budget : ${r.budget}` : 'Votre prix'}
                        value={proposalForm.price}
                        onChange={(e) => setProposalForm((f) => ({ ...f, price: e.target.value }))}
                        required
                        min="0"
                        className="w-full rounded-lg border border-stone-200 px-3 py-1.5 text-sm"
                      />
                    </div>
                    <div className="flex-1">
                      <label className="mb-1 block text-xs font-medium text-stone-600">
                        Durée estimée
                      </label>
                      <select
                        value={proposalForm.estimatedDurationMinutes}
                        onChange={(e) =>
                          setProposalForm((f) => ({
                            ...f,
                            estimatedDurationMinutes: e.target.value,
                          }))
                        }
                        required
                        className="w-full rounded-lg border border-stone-200 px-3 py-1.5 text-sm"
                      >
                        <option value="">Choisir...</option>
                        {[30, 45, 60, 90, 120, 180, 240, 360, 480].map((min) => (
                          <option key={min} value={min}>
                            {formatDuration(min)}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <textarea
                    placeholder="Message pour le client — décrivez votre approche, votre disponibilité..."
                    value={proposalForm.message}
                    onChange={(e) => setProposalForm((f) => ({ ...f, message: e.target.value }))}
                    rows={2}
                    required
                    className="w-full rounded-lg border border-stone-200 px-3 py-1.5 text-sm"
                  />

                  <div className="flex gap-2">
                    <button
                      type="submit"
                      className="rounded-lg bg-primary-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-primary-700"
                    >
                      Envoyer la proposition
                    </button>
                    <button
                      type="button"
                      onClick={() => setProposingId(null)}
                      className="rounded-lg border border-stone-300 px-3 py-1.5 text-sm font-medium text-stone-600"
                    >
                      Annuler
                    </button>
                  </div>
                </form>
              )}
            </li>
          ))}
        </ul>
      </section>

      {/* ── Propositions en attente de réponse ───────────────────────────── */}
      {pendingProposals.length > 0 && (
        <section className="rounded-xl border border-stone-200 bg-white p-5">
          <h2 className="mb-3 font-semibold text-stone-900">
            Mes propositions en attente ({pendingProposals.length})
          </h2>
          <ul className="flex flex-col gap-2">
            {pendingProposals.map((p) => {
              const req = requestsById[p.requestId]
              return (
                <li
                  key={p.id}
                  className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-stone-100 bg-sand-50 p-3"
                >
                  <div>
                    <p className="text-sm font-medium text-stone-800">
                      {req?.metier ?? p.requestId} — {req?.adresse ?? req?.ville ?? ''}
                    </p>
                    <p className="text-xs text-stone-500">
                      {formatPrice(p.price)} · {formatDuration(p.estimatedDurationMinutes)}
                    </p>
                  </div>
                  <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${PROPOSAL_BADGE[p.status]}`}>
                    {PROPOSAL_LABEL[p.status]}
                  </span>
                </li>
              )
            })}
          </ul>
        </section>
      )}

      {/* ── Propositions acceptées (sélectionné par le client) ───────────── */}
      {acceptedProposals.length > 0 && (
        <section className="rounded-xl border border-green-100 bg-white p-5">
          <h2 className="mb-3 font-semibold text-stone-900">
            Propositions acceptées ({acceptedProposals.length})
          </h2>
          <ul className="flex flex-col gap-2">
            {acceptedProposals.map((p) => {
              const req = requestsById[p.requestId]
              const mission = myMissions.find((m) => m.proposalId === p.id)
              return (
                <li
                  key={p.id}
                  className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-green-100 bg-green-50 p-3"
                >
                  <div>
                    <p className="text-sm font-medium text-stone-800">
                      {req?.metier ?? ''} — {req?.adresse ?? req?.ville ?? ''}
                    </p>
                    <p className="text-xs text-stone-500">
                      {formatPrice(p.price)} · {formatDuration(p.estimatedDurationMinutes)}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="rounded-full bg-green-100 px-2 py-0.5 text-xs font-medium text-green-700">
                      Sélectionné
                    </span>
                    {mission?.status === 'PENDING' && (
                      <button
                        onClick={() => demarrerMission(mission)}
                        className="rounded-lg bg-primary-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-primary-700"
                      >
                        Démarrer
                      </button>
                    )}
                  </div>
                </li>
              )
            })}
          </ul>
        </section>
      )}
    </div>
  )
}
