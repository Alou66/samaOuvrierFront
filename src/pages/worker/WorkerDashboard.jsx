import { useCallback, useEffect, useState } from 'react'
import api from '../../services/api'
import { requestService } from '../../services/request.service'
import { proposalService } from '../../services/proposal.service'
import { missionService } from '../../services/mission.service'
import { workerService } from '../../services/worker.service'
import { ratingService } from '../../services/rating.service'
import { useAuth } from '../../context/AuthContext'
import { useTrip } from '../../context/TripContext'
import { formatDuration, formatPrice } from '../../utils/format'
import Stars from '../../components/Stars'
import LocationMap from '../../components/LocationMap'

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
  HIGH: 'Urgent', NORMAL: 'Normal', LOW: 'Faible',
}

// ─── Confirmation inline ──────────────────────────────────────────────────────

function ConfirmInline({ message, confirmLabel = 'Confirmer', loading, onConfirm, onCancel }) {
  return (
    <div className="flex flex-wrap items-center gap-3 rounded-lg border border-red-200 bg-red-50 p-3">
      <p className="flex-1 text-sm text-red-700">{message}</p>
      <button
        onClick={onConfirm}
        disabled={loading}
        className="shrink-0 rounded-lg bg-red-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-red-700 disabled:opacity-50"
      >
        {loading ? '…' : confirmLabel}
      </button>
      <button
        onClick={onCancel}
        className="shrink-0 rounded-lg border border-stone-300 px-3 py-1.5 text-xs font-medium text-stone-600"
      >
        Annuler
      </button>
    </div>
  )
}

// ─── Dashboard principal ──────────────────────────────────────────────────────

export default function WorkerDashboard() {
  const { user, updateUser } = useAuth()
  const { trip, demarrerMissionDirecte, marquerArrive, terminerTrajet } = useTrip()

  const moi = user

  const [isAvailable, setIsAvailable] = useState(moi?.workerProfile?.isAvailable ?? true)

  // Données API
  const [newRequests,   setNewRequests]   = useState([])
  const [myProposals,   setMyProposals]   = useState([])
  const [myMissions,    setMyMissions]    = useState([])
  const [myRatings,     setMyRatings]     = useState([])
  const [requestsById,  setRequestsById]  = useState({})

  // Formulaire proposition
  const [proposingId,   setProposingId]   = useState(null)
  const [proposalForm,  setProposalForm]  = useState({ price: '', estimatedDurationMinutes: '', message: '' })

  // Confirmations
  const [confirmWithdraw, setConfirmWithdraw] = useState(null) // proposalId
  const [confirmCancelM,  setConfirmCancelM]  = useState(null) // missionId
  const [actionLoading,   setActionLoading]   = useState(false)
  const [loadError,       setLoadError]       = useState(false)

  const loadData = useCallback(() => {
    if (!moi?.id || !moi?.workerProfile?.metier) return

    Promise.all([
      requestService.getAvailableRequests({ metier: moi.workerProfile?.metier, ville: moi.ville }),
      proposalService.getMyProposals(),
      missionService.getMissionsByWorker(),
      ratingService.getRatingsByWorker(moi.id),
    ])
      .then(([metierRequests, proposals, missions, ratings]) => {
        const byReqId = Object.fromEntries(metierRequests.map((r) => [r.id, r]))
        setRequestsById(byReqId)

        const proposedIds = new Set(proposals.map((p) => p.requestId))
        setNewRequests(
          metierRequests.filter(
            (r) => (r.status === 'OPEN' || r.status === 'PROPOSALS_SENT') && !proposedIds.has(r.id)
          )
        )
        setMyProposals(proposals)
        setMyMissions(missions)
        setMyRatings(ratings)
        setLoadError(false)
      })
      .catch((err) => {
        // On ne réinitialise pas les données déjà affichées (évite un flash à
        // vide sur une simple erreur réseau passagère), mais on prévient
        // l'ouvrier que ce qu'il voit peut être obsolète : sans ce signal, une
        // mission déjà terminée/annulée côté serveur pouvait rester affichée
        // comme active indéfiniment (le statut "en mission" ne se corrigeant
        // qu'au prochain chargement réussi), bloquant à tort la réception de
        // nouvelles demandes.
        console.error('[WorkerDashboard] Erreur chargement:', err)
        setLoadError(true)
      })
  }, [moi?.id, moi?.workerProfile?.metier])

  useEffect(() => { loadData() }, [loadData])
  useEffect(() => { setIsAvailable(moi?.workerProfile?.isAvailable ?? true) }, [moi?.id])

  // Dérivés
  const activeMission    = myMissions.find((m) => m.status === 'STARTED') ?? null
  const pendingMissions  = myMissions.filter((m) => m.status === 'PENDING')
  const pendingProposals = myProposals.filter((p) => p.status === 'PENDING')
  const missionsTerminees = myMissions.filter((m) => m.status === 'COMPLETED').length

  // Propositions acceptées dont la mission n'est PAS encore terminée ou annulée
  const acceptedProposals = myProposals.filter((p) => {
    if (p.status !== 'ACCEPTED') return false
    const mission = myMissions.find((m) => m.proposalId === p.id)
    if (!mission) return true
    return mission.status !== 'COMPLETED' && mission.status !== 'CANCELLED'
  })

  const tripEstLeMien = !!trip && (trip.worker?.id === moi.id || trip.missionId === activeMission?.id)
  const enMission = !!activeMission || !!pendingMissions.length || tripEstLeMien

  // Nettoyer le TripContext si plus aucune mission active au chargement
  useEffect(() => {
    if (!trip) return
    if (trip.worker?.id !== moi?.id) return
    const hasActive = myMissions.some((m) => m.status === 'STARTED' || m.status === 'PENDING')
    if (!hasActive) terminerTrajet()
  }, [myMissions])

  // ─── Disponibilité ────────────────────────────────────────────────────────

  const toggleAvailability = async () => {
    const next = !isAvailable
    try {
      const updated = await workerService.updateAvailability(next)
      setIsAvailable(updated.workerProfile?.isAvailable ?? next)
      updateUser(updated)
    } catch (err) {
      console.error('[WorkerDashboard] Erreur mise à jour disponibilité:', err)
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
        workerNote: moi.workerProfile?.note ?? null,
        price: Number(proposalForm.price),
        estimatedDurationMinutes: Number(proposalForm.estimatedDurationMinutes),
        message: proposalForm.message,
        expiresAt: new Date(Date.now() + 48 * 60 * 60 * 1000).toISOString(),
      })
    } catch (err) {
      console.error('[WorkerDashboard] Erreur proposition:', err)
    } finally {
      setProposingId(null)
      loadData()
    }
  }

  // ─── Retirer une proposition ──────────────────────────────────────────────

  const retirerProposition = async (proposalId, requestId) => {
    setActionLoading(true)
    try {
      await proposalService.withdrawProposal(proposalId)
      loadData()
    } catch (err) {
      console.error('[WorkerDashboard] Erreur retrait proposition:', err)
    } finally {
      setActionLoading(false)
      setConfirmWithdraw(null)
    }
  }

  // ─── Démarrer une mission ─────────────────────────────────────────────────

  const demarrerMission = async (mission) => {
    try {
      await missionService.startMission(mission.id)
      const request = requestsById[mission.requestId]
      demarrerMissionDirecte({
        worker: { id: moi.id, nom: moi.nom, metier: moi.workerProfile?.metier, photoProfil: moi.photoProfilUrl },
        metier: moi.workerProfile?.metier,
        ville: request?.ville ?? moi.ville,
        missionId: mission.id,
        clientId: mission.clientId,
      })
      // Le backend passe automatiquement l'ouvrier indisponible tant que la
      // mission est démarrée : on relit son profil pour rester synchronisé.
      const { data } = await api.get('/api/account/me')
      setIsAvailable(data.workerProfile?.isAvailable ?? false)
      updateUser(data)
      loadData()
    } catch (err) {
      console.error('[WorkerDashboard] Erreur démarrage mission:', err)
    }
  }

  // ─── Annuler une mission PENDING ──────────────────────────────────────────

  const annulerMission = async (mission) => {
    setActionLoading(true)
    try {
      await missionService.cancelMission(mission.id)
      // Le backend remet automatiquement l'ouvrier disponible (s'il n'a plus
      // d'autre mission en cours) : on relit son profil pour rester synchronisé.
      const { data } = await api.get('/api/account/me')
      setIsAvailable(data.workerProfile?.isAvailable ?? true)
      updateUser(data)
      loadData()
    } catch (err) {
      console.error('[WorkerDashboard] Erreur annulation mission:', err)
    } finally {
      setActionLoading(false)
      setConfirmCancelM(null)
    }
  }

  // ─── Terminer une mission ─────────────────────────────────────────────────

  const terminerMission = async (mission) => {
    try {
      await missionService.completeMission(mission.id)
      if (tripEstLeMien) terminerTrajet()
      // Le backend remet automatiquement l'ouvrier disponible (s'il n'a plus
      // d'autre mission en cours) : on relit son profil pour rester synchronisé.
      const { data } = await api.get('/api/account/me')
      setIsAvailable(data.workerProfile?.isAvailable ?? true)
      updateUser(data)
      loadData()
    } catch (err) {
      console.error('[WorkerDashboard] Erreur terminaison mission:', err)
    }
  }

  // ─── Ignorer une demande ──────────────────────────────────────────────────

  const ignorerDemande = (requestId) => setNewRequests((prev) => prev.filter((r) => r.id !== requestId))

  // ─── Rendu ────────────────────────────────────────────────────────────────

  return (
    <div className="flex flex-col gap-4">

      {/* Bannière échec de rafraîchissement — les données affichées peuvent être obsolètes */}
      {loadError && (
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border-2 border-orange-200 bg-orange-50 p-4">
          <p className="text-sm text-orange-700">
            Impossible de mettre à jour vos données (connexion instable). Les informations affichées
            (missions, demandes, propositions) peuvent être obsolètes.
          </p>
          <button
            onClick={loadData}
            className="shrink-0 rounded-lg bg-orange-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-orange-700"
          >
            Réessayer
          </button>
        </div>
      )}

      {/* Bannière dossier en attente */}
      {moi.workerProfile?.verificationStatus === 'PENDING' && (
        <div className="rounded-xl border-2 border-yellow-200 bg-yellow-50 p-4">
          <p className="font-semibold text-yellow-800">Dossier en cours de vérification</p>
          <p className="mt-1 text-sm text-yellow-700">
            Votre profil est en attente de validation par notre équipe. Vous recevrez une notification
            une fois approuvé. Vous ne pouvez pas encore répondre aux demandes.
          </p>
        </div>
      )}

      {moi.workerProfile?.verificationStatus === 'REJECTED' && (
        <div className="rounded-xl border-2 border-red-200 bg-red-50 p-4">
          <p className="font-semibold text-red-800">Dossier rejeté</p>
          <p className="mt-1 text-sm text-red-700">
            Votre dossier n'a pas été approuvé.
            {moi.workerProfile?.rejectionReason && ` Motif : "${moi.workerProfile.rejectionReason}".`}
            {' '}Contactez l'administrateur pour régulariser votre situation.
          </p>
        </div>
      )}

      {/* Salutation + stats */}
      <div className="flex flex-col gap-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <h1 className="text-xl font-bold text-stone-900">Bonjour, {moi.nom.split(' ')[0]} 👋</h1>
            <p className="text-sm text-stone-500">{moi.workerProfile?.metier} · {moi.ville}</p>
          </div>
          <div className="flex items-center gap-2 rounded-xl border border-stone-200 bg-white px-4 py-2">
            <span className="text-sm font-medium text-stone-700">
              {enMission ? 'En mission' : isAvailable ? 'Disponible' : 'Indisponible'}
            </span>
            <button
              disabled={enMission}
              onClick={toggleAvailability}
              className={`relative h-6 w-11 rounded-full transition disabled:cursor-not-allowed disabled:opacity-50 ${isAvailable ? 'bg-green-500' : 'bg-stone-300'}`}
            >
              <span className={`absolute top-0.5 h-5 w-5 rounded-full bg-white transition ${isAvailable ? 'left-5' : 'left-0.5'}`} />
            </button>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {[
            { label: 'Nouvelles demandes',    value: newRequests.length,                                           color: 'text-yellow-700',  bg: 'bg-yellow-50' },
            { label: 'Propositions envoyées', value: pendingProposals.length,                                          color: 'text-blue-700',    bg: 'bg-blue-50' },
            { label: 'Missions en cours',     value: pendingMissions.length + (activeMission ? 1 : 0),                 color: 'text-primary-700', bg: 'bg-primary-50' },
            { label: 'Missions terminées',    value: missionsTerminees,                                                 color: 'text-green-700',   bg: 'bg-green-50' },
          ].map((s) => (
            <div key={s.label} className={`flex flex-col items-center justify-center rounded-xl border border-stone-200 p-4 text-center ${s.bg}`}>
              <p className={`text-3xl font-bold ${s.color}`}>{s.value}</p>
              <p className="mt-1 text-xs text-stone-500">{s.label}</p>
            </div>
          ))}
        </div>

        {moi.workerProfile?.note > 0 && (
          <div className="flex items-center gap-3 rounded-xl border border-stone-200 bg-white px-4 py-3">
            <Stars note={moi.workerProfile.note} size="text-base" />
            <p className="text-sm text-stone-700">
              <span className="font-semibold">{moi.workerProfile.note}</span> / 5
              <span className="ml-1 text-stone-400">({moi.workerProfile.ratingCount} avis)</span>
            </p>
          </div>
        )}
      </div>

      {/* Carte suivi mission */}
      {(tripEstLeMien && trip?.statut === 'en_route') && (
        <div className="flex flex-col gap-3 rounded-xl border border-primary-200 bg-white p-4">
          <div className="relative h-72 sm:h-96"><LocationMap /></div>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="font-semibold text-stone-900">En route vers le client</p>
              <p className="text-sm text-stone-500">{trip.metier} à {trip.ville} · arrivée estimée dans {trip.etaMin} min</p>
            </div>
            <div className="flex gap-2">
              <button onClick={marquerArrive} className="rounded-lg bg-primary-600 px-4 py-2 text-sm font-medium text-white hover:bg-primary-700">Je suis arrivé</button>
              {activeMission && (
                <button onClick={() => terminerMission(activeMission)} className="rounded-lg border border-stone-300 px-4 py-2 text-sm font-medium text-stone-700 hover:bg-sand-50">Terminer</button>
              )}
            </div>
          </div>
        </div>
      )}

      {(tripEstLeMien && trip?.statut === 'arrive') && (
        <div className="flex flex-col gap-3 rounded-xl border border-green-200 bg-green-50 p-4">
          <p className="font-semibold text-green-800">Vous êtes arrivé chez le client</p>
          {activeMission && (
            <button onClick={() => terminerMission(activeMission)} className="rounded-lg bg-primary-600 px-4 py-2 text-sm font-medium text-white hover:bg-primary-700 sm:self-start">Terminer la mission</button>
          )}
        </div>
      )}

      {activeMission && !tripEstLeMien && (
        <div className="flex flex-col gap-3 rounded-xl border border-primary-200 bg-primary-50 p-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="font-semibold text-primary-700">Mission en cours</p>
            <p className="text-sm text-stone-600">{requestsById[activeMission.requestId]?.metier} à {requestsById[activeMission.requestId]?.ville}</p>
          </div>
          <div className="flex gap-2">
            <button onClick={() => demarrerMission(activeMission)} className="rounded-lg bg-primary-600 px-4 py-2 text-sm font-medium text-white hover:bg-primary-700">Afficher la carte</button>
            <button onClick={() => terminerMission(activeMission)} className="rounded-lg border border-stone-300 px-4 py-2 text-sm font-medium text-stone-700 hover:bg-white">Terminer</button>
          </div>
        </div>
      )}

      {/* ── Missions confirmées — à démarrer (PENDING) ───────────────────────── */}
      {pendingMissions.length > 0 && (
        <section className="rounded-xl border border-stone-200 bg-white p-5">
          <h2 className="mb-3 font-semibold text-stone-900">Missions confirmées — à démarrer</h2>
          <ul className="flex flex-col gap-3">
            {pendingMissions.map((m) => {
              const req = requestsById[m.requestId]
              return (
                <li key={m.id} className="flex flex-col gap-2 rounded-lg border border-primary-100 bg-primary-50 p-3">
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <div>
                      <p className="font-medium text-stone-900">{req?.metier ?? 'Mission'} — {req?.ville ?? ''}</p>
                      {req?.adresse && <p className="text-sm text-stone-500">{req.adresse}</p>}
                      {req?.description && <p className="text-xs italic text-stone-400 line-clamp-2">{req.description}</p>}
                    </div>
                    <button
                      onClick={() => demarrerMission(m)}
                      className="shrink-0 rounded-lg bg-primary-600 px-4 py-2 text-sm font-medium text-white hover:bg-primary-700"
                    >
                      Démarrer la mission
                    </button>
                  </div>

                  {/* Annuler la mission (avant démarrage) */}
                  {confirmCancelM === m.id ? (
                    <ConfirmInline
                      message="Annuler cette mission ? La demande sera remise en attente pour un autre ouvrier."
                      confirmLabel="Confirmer l'annulation"
                      loading={actionLoading}
                      onConfirm={() => annulerMission(m)}
                      onCancel={() => setConfirmCancelM(null)}
                    />
                  ) : (
                    <button
                      onClick={() => setConfirmCancelM(m.id)}
                      className="self-start rounded-lg border border-red-200 px-3 py-1 text-xs font-medium text-red-500 hover:bg-red-50"
                    >
                      Annuler la mission
                    </button>
                  )}
                </li>
              )
            })}
          </ul>
        </section>
      )}

      {/* ── Nouvelles demandes ───────────────────────────────────────────────── */}
      <section className="rounded-xl border border-stone-200 bg-white p-5">
        <h2 className="mb-3 font-semibold text-stone-900">
          Nouvelles demandes
          {!enMission && newRequests.length > 0 && (
            <span className="ml-2 rounded-full bg-primary-600 px-2 py-0.5 text-xs font-medium text-white">{newRequests.length}</span>
          )}
        </h2>

        {enMission && (
          <p className="text-sm text-stone-500">
            Vous êtes en mission : vous ne recevez pas de nouvelles demandes tant qu'elle n'est pas terminée ou annulée.
          </p>
        )}

        {!enMission && newRequests.length === 0 && (
          <p className="text-sm text-stone-500">
          Aucune nouvelle demande pour <span className="font-medium">{moi.workerProfile?.metier}</span> à <span className="font-medium">{moi.ville}</span> pour le moment.
        </p>
        )}

        <ul className="flex flex-col gap-3">
          {!enMission && newRequests.map((r) => (
            <li key={r.id} className="rounded-lg border border-stone-100 p-3">
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div className="flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="font-medium text-stone-800">{r.metier}</p>
                    {r.urgency && (
                      <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${URGENCY_BADGE[r.urgency] ?? 'bg-stone-100 text-stone-500'}`}>
                        {URGENCY_LABEL[r.urgency] ?? r.urgency}
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-stone-500">{r.adresse ?? r.ville}</p>
                  {r.description && <p className="mt-1 text-xs italic text-stone-400 line-clamp-3">{r.description}</p>}
                  {r.budget && <p className="mt-1 text-xs text-stone-500">Budget indicatif : {formatPrice(r.budget)}</p>}
                  {r.photos?.[0] && (
                    <a href={r.photos[0]} target="_blank" rel="noopener noreferrer" className="mt-2 block">
                      <img
                        src={r.photos[0]}
                        alt="Photo du problème"
                        className="max-h-36 w-full rounded-lg object-cover border border-stone-100 hover:opacity-90 transition"
                      />
                      <p className="mt-0.5 text-[10px] text-stone-400">Cliquer pour agrandir</p>
                    </a>
                  )}
                </div>
                <span className="rounded-full bg-yellow-50 px-2 py-0.5 text-xs font-medium text-yellow-700">
                  {r.status === 'OPEN' ? 'Nouvelle' : 'En attente de propositions'}
                </span>
              </div>

              {proposingId !== r.id && (
                <div className="mt-2 flex gap-2">
                  <button onClick={() => ouvrirFormProposition(r.id)} className="rounded-lg bg-green-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-green-700">
                    Faire une proposition
                  </button>
                  <button onClick={() => ignorerDemande(r.id)} className="rounded-lg border border-stone-300 px-3 py-1.5 text-sm font-medium text-stone-600 hover:bg-sand-50">
                    Ignorer
                  </button>
                </div>
              )}

              {proposingId === r.id && (
                <form
                  onSubmit={(e) => { e.preventDefault(); soumettreProposition(r.id) }}
                  className="mt-3 flex flex-col gap-2 border-t border-stone-100 pt-3"
                >
                  <div className="flex gap-2">
                    <div className="flex-1">
                      <label className="mb-1 block text-xs font-medium text-stone-600">Prix (FCFA)</label>
                      <input
                        type="number"
                        placeholder={r.budget ? `Budget : ${r.budget}` : 'Votre prix'}
                        value={proposalForm.price}
                        onChange={(e) => setProposalForm((f) => ({ ...f, price: e.target.value }))}
                        required min="0"
                        className="w-full rounded-lg border border-stone-200 px-3 py-1.5 text-sm"
                      />
                    </div>
                    <div className="flex-1">
                      <label className="mb-1 block text-xs font-medium text-stone-600">Durée estimée</label>
                      <select
                        value={proposalForm.estimatedDurationMinutes}
                        onChange={(e) => setProposalForm((f) => ({ ...f, estimatedDurationMinutes: e.target.value }))}
                        required
                        className="w-full rounded-lg border border-stone-200 px-3 py-1.5 text-sm"
                      >
                        <option value="">Choisir...</option>
                        {[30, 45, 60, 90, 120, 180, 240, 360, 480].map((min) => (
                          <option key={min} value={min}>{formatDuration(min)}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                  <textarea
                    placeholder="Message pour le client — décrivez votre approche, votre disponibilité..."
                    value={proposalForm.message}
                    onChange={(e) => setProposalForm((f) => ({ ...f, message: e.target.value }))}
                    rows={2} required
                    className="w-full rounded-lg border border-stone-200 px-3 py-1.5 text-sm"
                  />
                  <div className="flex gap-2">
                    <button type="submit" className="rounded-lg bg-primary-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-primary-700">
                      Envoyer la proposition
                    </button>
                    <button type="button" onClick={() => setProposingId(null)} className="rounded-lg border border-stone-300 px-3 py-1.5 text-sm font-medium text-stone-600">
                      Annuler
                    </button>
                  </div>
                </form>
              )}
            </li>
          ))}
        </ul>
      </section>

      {/* ── Propositions en attente (avec retrait possible) ──────────────────── */}
      {pendingProposals.length > 0 && (
        <section className="rounded-xl border border-stone-200 bg-white p-5">
          <h2 className="mb-3 font-semibold text-stone-900">Mes propositions en attente ({pendingProposals.length})</h2>
          <ul className="flex flex-col gap-2">
            {pendingProposals.map((p) => {
              const req = requestsById[p.requestId]
              return (
                <li key={p.id} className="flex flex-col gap-2 rounded-lg border border-stone-100 bg-sand-50 p-3">
                  <div className="flex flex-wrap items-center justify-between gap-2">
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
                  </div>

                  {/* Retrait de proposition */}
                  {confirmWithdraw === p.id ? (
                    <ConfirmInline
                      message="Retirer cette proposition ? Le client ne pourra plus la voir."
                      confirmLabel="Retirer la proposition"
                      loading={actionLoading}
                      onConfirm={() => retirerProposition(p.id, p.requestId)}
                      onCancel={() => setConfirmWithdraw(null)}
                    />
                  ) : (
                    <button
                      onClick={() => setConfirmWithdraw(p.id)}
                      className="self-start rounded-lg border border-red-200 px-3 py-1 text-xs font-medium text-red-500 hover:bg-red-50"
                    >
                      Retirer la proposition
                    </button>
                  )}
                </li>
              )
            })}
          </ul>
        </section>
      )}

      {/* ── Propositions acceptées ───────────────────────────────────────────── */}
      {acceptedProposals.length > 0 && (
        <section className="rounded-xl border border-green-100 bg-white p-5">
          <h2 className="mb-3 font-semibold text-stone-900">Propositions acceptées ({acceptedProposals.length})</h2>
          <ul className="flex flex-col gap-2">
            {acceptedProposals.map((p) => {
              const req = requestsById[p.requestId]
              const mission = myMissions.find((m) => m.proposalId === p.id)
              return (
                <li key={p.id} className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-green-100 bg-green-50 p-3">
                  <div>
                    <p className="text-sm font-medium text-stone-800">{req?.metier ?? ''} — {req?.adresse ?? req?.ville ?? ''}</p>
                    <p className="text-xs text-stone-500">{formatPrice(p.price)} · {formatDuration(p.estimatedDurationMinutes)}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="rounded-full bg-green-100 px-2 py-0.5 text-xs font-medium text-green-700">Sélectionné</span>
                    {mission?.status === 'PENDING' && (
                      <button onClick={() => demarrerMission(mission)} className="rounded-lg bg-primary-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-primary-700">
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

      {/* ── Mes avis reçus ───────────────────────────────────────────────────── */}
      {myRatings.length > 0 && (
        <section className="rounded-xl border border-stone-200 bg-white p-5">
          <h2 className="mb-3 font-semibold text-stone-900">
            Mes avis reçus
            <span className="ml-2 text-sm font-normal text-stone-400">({myRatings.length} avis)</span>
          </h2>
          <ul className="flex flex-col gap-3">
            {myRatings.map((r) => (
              <li key={r.id} className="rounded-lg border border-stone-100 bg-sand-50 p-3">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-1.5">
                    {'★'.repeat(r.rating).split('').map((_, i) => (
                      <span key={i} className="text-amber-400">★</span>
                    ))}
                    {'☆'.repeat(5 - r.rating).split('').map((_, i) => (
                      <span key={i} className="text-stone-300">☆</span>
                    ))}
                    <span className="ml-1 text-xs font-semibold text-stone-700">{r.rating}/5</span>
                  </div>
                  <span className="text-xs text-stone-400">{new Date(r.createdAt).toLocaleDateString('fr-FR')}</span>
                </div>
                {r.comment && <p className="mt-2 text-sm italic text-stone-600">"{r.comment}"</p>}
              </li>
            ))}
          </ul>
        </section>
      )}

    </div>
  )
}
