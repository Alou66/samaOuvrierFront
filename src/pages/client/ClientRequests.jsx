import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { requestService } from '../../services/request.service'
import { missionService } from '../../services/mission.service'
import { workerService } from '../../services/worker.service'
import { ratingService } from '../../services/rating.service'
import { useAuth } from '../../context/AuthContext'
import { useNewRequestModal } from '../../context/NewRequestModalContext'
import { useTrip } from '../../context/TripContext'
import ProposalsList from '../../components/ProposalsList'
import RatingModal from '../../components/RatingModal'

// Workflow : OPEN → PROPOSALS_SENT → SELECTED → IN_PROGRESS → CLOSED | CANCELLED
const STATUS_CONFIG = {
  OPEN:           { texte: 'Ouverte',             classe: 'bg-yellow-100 text-yellow-700',   step: 1 },
  PROPOSALS_SENT: { texte: 'Propositions reçues', classe: 'bg-blue-100 text-blue-700',       step: 2 },
  SELECTED:       { texte: 'Ouvrier confirmé',    classe: 'bg-primary-100 text-primary-700', step: 3 },
  IN_PROGRESS:    { texte: 'En cours',            classe: 'bg-primary-100 text-primary-700', step: 3 },
  CLOSED:         { texte: 'Terminée',            classe: 'bg-green-100 text-green-700',     step: 4 },
  CANCELLED:      { texte: 'Annulée',             classe: 'bg-red-100 text-red-700',         step: null },
}

const STEPS = ['Ouverte', 'Propositions', 'En cours', 'Terminée']

const MISSION_STATUS = {
  PENDING:   { texte: 'Ouvrier en route bientôt', classe: 'text-stone-500' },
  STARTED:   { texte: 'Ouvrier en chemin',         classe: 'text-primary-700 font-medium' },
  COMPLETED: { texte: 'Mission terminée',          classe: 'text-green-700 font-medium' },
  CANCELLED: { texte: 'Mission annulée',           classe: 'text-red-600' },
}

const URGENCY_OPTIONS = [
  { value: 'HIGH',   label: 'Urgent' },
  { value: 'NORMAL', label: 'Normal' },
  { value: 'LOW',    label: 'Faible' },
]

// ─── Pipeline de statut ───────────────────────────────────────────────────────

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
            <div className={`flex h-5 w-5 items-center justify-center rounded-full text-xs font-semibold ${
              done   ? 'bg-primary-600 text-white'
              : active ? 'bg-primary-100 text-primary-700 ring-2 ring-primary-400'
              : 'bg-stone-100 text-stone-400'
            }`}>
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

// ─── Page principale ──────────────────────────────────────────────────────────

export default function ClientRequests() {
  const { user } = useAuth()
  const { demarrerMissionDirecte } = useTrip()
  const navigate = useNavigate()
  const { openNewRequestModal } = useNewRequestModal()

  const [demandes,        setDemandes]        = useState([])
  const [missionByRequest, setMissionByRequest] = useState({})
  const [workerByRequest,  setWorkerByRequest]  = useState({})
  const [ratingTarget,    setRatingTarget]    = useState(null)
  const [ratedMissions,   setRatedMissions]   = useState(new Set())

  // Annulation
  const [confirmCancel,  setConfirmCancel]  = useState(null) // requestId
  const [actionLoading,  setActionLoading]  = useState(false)

  // Suppression
  const [confirmDelete, setConfirmDelete] = useState(null) // requestId
  const [deleteError,   setDeleteError]   = useState(null)

  // Édition
  const [editingId,  setEditingId]  = useState(null)
  const [editForm,   setEditForm]   = useState({ description: '', budget: '', urgency: 'NORMAL' })
  const [editSaving, setEditSaving] = useState(false)
  const [editError,  setEditError]  = useState(null)

  const charger = () => {
    if (!user?.id) return
    Promise.all([
      requestService.getMyRequests(),
      missionService.getMissionsByClient(),
      ratingService.getMyRatings(),
    ])
      .then(async ([requests, missions, ratings]) => {
        setDemandes(requests)
        const byReq = {}
        missions.forEach((m) => { byReq[m.requestId] = m })
        setMissionByRequest(byReq)
        setRatedMissions(new Set(ratings.map((r) => r.missionId)))

        const workerIds = [...new Set(missions.map((m) => m.workerId).filter(Boolean))]
        const workers = await Promise.all(workerIds.map((id) => workerService.getWorkerById(id)))
        const byWorker = Object.fromEntries(workers.map((w) => [w.id, w]))
        const workerByReq = {}
        missions.forEach((m) => { if (byWorker[m.workerId]) workerByReq[m.requestId] = byWorker[m.workerId] })
        setWorkerByRequest(workerByReq)
      })
      .catch((err) => console.error('[ClientRequests] Erreur chargement:', err))
  }

  useEffect(() => { charger() }, [user?.id])

  const handleProposalAccepted = (demandeId) => {
    setDemandes((prev) => prev.map((d) => (d.id === demandeId ? { ...d, status: 'SELECTED' } : d)))
    missionService
      .getMissionsByClient()
      .then((missions) => {
        const byReq = {}
        missions.forEach((m) => (byReq[m.requestId] = m))
        setMissionByRequest(byReq)
      })
      .catch(console.error)
  }

  // ─── Annuler une demande ─────────────────────────────────────────────────

  const handleCancelRequest = async (id) => {
    setActionLoading(true)
    try {
      await requestService.cancelRequest(id)
      setDemandes((prev) => prev.map((d) => d.id === id ? { ...d, status: 'CANCELLED' } : d))
    } catch (err) {
      console.error('[ClientRequests] Erreur annulation:', err)
    } finally {
      setActionLoading(false)
      setConfirmCancel(null)
    }
  }

  // ─── Supprimer une demande ────────────────────────────────────────────────

  const handleDeleteRequest = async (id) => {
    setActionLoading(true)
    setDeleteError(null)
    try {
      await requestService.deleteRequest(id)
      // La demande n'existe plus côté backend : on la retire de la liste
      // affichée sans recharger l'ensemble (pas d'appel réseau superflu).
      setDemandes((prev) => prev.filter((d) => d.id !== id))
      setConfirmDelete(null)
    } catch (err) {
      console.error('[ClientRequests] Erreur suppression:', err)
      setDeleteError(err.response?.data?.message ?? 'Impossible de supprimer cette demande.')
    } finally {
      setActionLoading(false)
    }
  }

  // ─── Ouvrir le formulaire d'édition ──────────────────────────────────────

  const ouvrirEdition = (d) => {
    setEditingId(d.id)
    setEditForm({ description: d.description ?? '', budget: d.budget ?? '', urgency: d.urgency ?? 'NORMAL' })
    setEditError(null)
  }

  const annulerEdition = () => {
    setEditingId(null)
    setEditError(null)
  }

  const handleSaveEdit = async (id) => {
    setEditSaving(true)
    setEditError(null)
    try {
      const patch = {
        description: editForm.description.trim(),
        budget:      editForm.budget ? Number(editForm.budget) : null,
        urgency:     editForm.urgency,
        updatedAt:   new Date().toISOString(),
      }
      await requestService.updateRequest(id, patch)
      setDemandes((prev) => prev.map((d) => d.id === id ? { ...d, ...patch } : d))
      setEditingId(null)
    } catch (err) {
      console.error('[ClientRequests] Erreur modification:', err)
      setEditError('Une erreur est survenue. Réessayez.')
    } finally {
      setEditSaving(false)
    }
  }

  // ─── Suivre / noter ───────────────────────────────────────────────────────

  const suivreMission = (mission, worker) => {
    demarrerMissionDirecte({
      worker: {
        id: mission.workerId,
        nom: worker?.nom ?? 'Ouvrier',
        metier: worker?.metier ?? '',
        photoProfil: worker?.photoProfil,
      },
      metier: worker?.metier ?? '',
      ville:  worker?.ville ?? '',
      missionId: mission.id,
      clientId:  user?.id,
    })
    navigate('/')
  }

  const ouvrirNotation = (mission, workerNom) => {
    setRatingTarget({ missionId: mission.id, workerId: mission.workerId, workerNom })
  }

  const soumettreNotation = async ({ note, commentaire }) => {
    if (!ratingTarget) return
    try {
      await ratingService.saveRating({
        missionId: ratingTarget.missionId,
        clientId:  user?.id,
        workerId:  ratingTarget.workerId,
        rating:    note,
        comment:   commentaire,
        createdAt: new Date().toISOString(),
      })
      setRatedMissions((prev) => new Set(prev).add(ratingTarget.missionId))
      setRatingTarget(null)
    } catch (err) {
      console.error('[ClientRequests] Erreur notation:', err)
    }
  }

  // ─── Rendu ────────────────────────────────────────────────────────────────

  return (
    <div className="mx-auto w-full max-w-2xl lg:max-w-none">
      <div className="mb-4 flex items-center justify-between">
        <h1 className="text-lg font-bold text-stone-900">Mes demandes</h1>
        <button
          onClick={openNewRequestModal}
          className="rounded-xl bg-primary-600 px-4 py-2 text-sm font-semibold text-white hover:bg-primary-700"
        >
          + Nouvelle demande
        </button>
      </div>

      {demandes.length === 0 && (
        <div className="rounded-xl border border-dashed border-stone-300 p-10 text-center text-stone-500">
          <p className="font-medium">Aucune demande pour le moment.</p>
          <p className="mt-1 text-sm">
            <button onClick={openNewRequestModal} className="font-semibold text-primary-600 hover:underline">
              Faites votre première demande
            </button>{' '}
            et recevez des propositions d'ouvriers qualifiés.
          </p>
        </div>
      )}

      <ul className="flex flex-col gap-3 lg:grid lg:grid-cols-2 lg:gap-4 xl:grid-cols-3">
        {demandes.map((d) => {
          const config      = STATUS_CONFIG[d.status] ?? { texte: d.status, classe: 'bg-stone-100 text-stone-500' }
          const mission     = missionByRequest[d.id] ?? null
          const missionInfo = mission ? MISSION_STATUS[mission.status] : null
          const dejaNote    = ratedMissions.has(mission?.id)
          const peutAnnuler = d.status === 'OPEN' || d.status === 'PROPOSALS_SENT'
          const peutModifier = d.status === 'OPEN'
          // Miroir de la règle backend (RequestService.deleteRequest) : seule une
          // demande OPEN ou CANCELLED peut être supprimée.
          const peutSupprimer = d.status === 'OPEN' || d.status === 'CANCELLED'

          return (
            <li key={d.id} className="rounded-xl border border-stone-200 bg-white p-4">
              {/* En-tête */}
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div className="min-w-0 flex-1">
                  <p className="font-medium text-stone-900">{d.metier}</p>
                  <p className="text-sm text-stone-500">{d.adresse ?? d.ville}</p>
                  {d.description && editingId !== d.id && (
                    <p className="mt-1 text-xs italic text-stone-400 line-clamp-2">{d.description}</p>
                  )}
                  {d.photos?.[0] && editingId !== d.id && (
                    <a href={d.photos[0]} target="_blank" rel="noopener noreferrer" className="mt-2 block">
                      <img
                        src={d.photos[0]}
                        alt="Photo jointe"
                        className="max-h-28 rounded-lg border border-stone-100 object-cover hover:opacity-90 transition"
                      />
                    </a>
                  )}
                </div>
                <span className={`shrink-0 rounded-full px-2 py-0.5 text-xs font-medium ${config.classe}`}>
                  {config.texte}
                </span>
              </div>

              {/* Pipeline */}
              <StatusPipeline status={d.status} />

              {/* ── Formulaire d'édition ────────────────────────────────── */}
              {editingId === d.id && (
                <div className="mt-3 flex flex-col gap-3 rounded-lg border border-primary-200 bg-primary-50 p-3">
                  <p className="text-xs font-semibold uppercase tracking-wide text-primary-600">Modifier la demande</p>

                  <div>
                    <label className="mb-1 block text-xs font-medium text-stone-600">Description</label>
                    <textarea
                      value={editForm.description}
                      onChange={(e) => setEditForm((f) => ({ ...f, description: e.target.value }))}
                      rows={2}
                      className="w-full rounded-lg border border-stone-200 px-3 py-2 text-sm focus:border-primary-400 focus:outline-none"
                      placeholder="Décrivez le problème…"
                    />
                  </div>

                  <div className="flex gap-2">
                    <div className="flex-1">
                      <label className="mb-1 block text-xs font-medium text-stone-600">Budget (FCFA)</label>
                      <input
                        type="number"
                        min="0"
                        value={editForm.budget}
                        onChange={(e) => setEditForm((f) => ({ ...f, budget: e.target.value }))}
                        className="w-full rounded-lg border border-stone-200 px-3 py-2 text-sm focus:border-primary-400 focus:outline-none"
                        placeholder="Ex : 10000"
                      />
                    </div>
                    <div className="flex-1">
                      <label className="mb-1 block text-xs font-medium text-stone-600">Urgence</label>
                      <select
                        value={editForm.urgency}
                        onChange={(e) => setEditForm((f) => ({ ...f, urgency: e.target.value }))}
                        className="w-full rounded-lg border border-stone-200 px-3 py-2 text-sm focus:border-primary-400 focus:outline-none"
                      >
                        {URGENCY_OPTIONS.map((o) => (
                          <option key={o.value} value={o.value}>{o.label}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {editError && <p className="text-xs text-red-600">{editError}</p>}

                  <div className="flex gap-2">
                    <button
                      onClick={() => handleSaveEdit(d.id)}
                      disabled={editSaving}
                      className="rounded-lg bg-primary-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-primary-700 disabled:opacity-50"
                    >
                      {editSaving ? 'Enregistrement…' : 'Enregistrer'}
                    </button>
                    <button
                      onClick={annulerEdition}
                      className="rounded-lg border border-stone-300 px-3 py-1.5 text-xs font-medium text-stone-600"
                    >
                      Annuler
                    </button>
                  </div>
                </div>
              )}

              {/* Propositions */}
              <ProposalsList
                requestId={d.id}
                clientId={user?.id}
                requestStatus={d.status}
                requestMetier={d.metier}
                requestVille={d.ville}
                onProposalAccepted={() => handleProposalAccepted(d.id)}
              />

              {/* Statut mission */}
              {mission && (
                <div className="mt-3 rounded-lg border border-stone-100 bg-sand-50 p-3">
                  <div className="flex items-center justify-between gap-2">
                    <p className={`text-sm ${missionInfo?.classe ?? 'text-stone-500'}`}>
                      {missionInfo?.texte ?? mission.status}
                    </p>
                    {mission.status === 'STARTED' && (
                      <button
                        onClick={() => suivreMission(mission, workerByRequest[d.id] ?? { nom: 'Ouvrier', metier: d.metier, ville: d.ville })}
                        className="shrink-0 rounded-lg bg-primary-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-primary-700"
                      >
                        Suivre sur la carte
                      </button>
                    )}
                  </div>
                  {mission.status === 'COMPLETED' && !dejaNote && (
                    <button
                      onClick={() => ouvrirNotation(mission, workerByRequest[d.id]?.nom ?? d.metier)}
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

              {/* ── Actions : Modifier / Annuler / Supprimer ──────────── */}
              {(peutModifier || peutAnnuler || peutSupprimer) && editingId !== d.id && (
                <div className="mt-3 border-t border-stone-100 pt-3">
                  {confirmCancel === d.id ? (
                    <ConfirmInline
                      message={
                        d.status === 'PROPOSALS_SENT'
                          ? 'Annuler cette demande ? Les propositions reçues seront également supprimées.'
                          : 'Annuler cette demande ?'
                      }
                      confirmLabel="Confirmer l'annulation"
                      loading={actionLoading}
                      onConfirm={() => handleCancelRequest(d.id)}
                      onCancel={() => setConfirmCancel(null)}
                    />
                  ) : confirmDelete === d.id ? (
                    <div className="flex flex-col gap-2">
                      {deleteError && <p className="text-xs text-red-600">{deleteError}</p>}
                      <ConfirmInline
                        message="Supprimer définitivement cette demande ? Cette action est irréversible."
                        confirmLabel="Confirmer la suppression"
                        loading={actionLoading}
                        onConfirm={() => handleDeleteRequest(d.id)}
                        onCancel={() => { setConfirmDelete(null); setDeleteError(null) }}
                      />
                    </div>
                  ) : (
                    <div className="flex flex-wrap gap-2">
                      {peutModifier && (
                        <button
                          onClick={() => ouvrirEdition(d)}
                          className="rounded-lg border border-stone-300 px-3 py-1.5 text-xs font-medium text-stone-600 hover:bg-stone-50"
                        >
                          Modifier
                        </button>
                      )}
                      {peutAnnuler && (
                        <button
                          onClick={() => setConfirmCancel(d.id)}
                          className="rounded-lg border border-red-200 px-3 py-1.5 text-xs font-medium text-red-500 hover:bg-red-50"
                        >
                          Annuler la demande
                        </button>
                      )}
                      {peutSupprimer && (
                        <button
                          onClick={() => setConfirmDelete(d.id)}
                          className="rounded-lg border border-red-300 px-3 py-1.5 text-xs font-medium text-red-600 hover:bg-red-50"
                        >
                          Supprimer
                        </button>
                      )}
                    </div>
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
