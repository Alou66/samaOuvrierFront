import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { workerService } from '../../services/worker.service'
import { clientService } from '../../services/client.service'
import { requestService } from '../../services/request.service'
import { missionService } from '../../services/mission.service'
import { ratingService } from '../../services/rating.service'
import { villeService } from '../../services/ville.service'
import { metierService } from '../../services/metier.service'
import { fetchAllPages } from '../../services/pagination'

// ─── Badges ───────────────────────────────────────────────────────────────────

const VERIFICATION_BADGE = {
  APPROVED: 'bg-green-100 text-green-700',
  PENDING:  'bg-yellow-100 text-yellow-700',
  REJECTED: 'bg-red-100 text-red-700',
}
const VERIFICATION_LABEL = { APPROVED: 'Approuvé', PENDING: 'En attente', REJECTED: 'Rejeté' }

const REQUEST_BADGE = {
  OPEN:            'bg-yellow-100 text-yellow-700',
  PROPOSALS_SENT:  'bg-blue-100 text-blue-700',
  SELECTED:        'bg-primary-100 text-primary-700',
  IN_PROGRESS:     'bg-primary-100 text-primary-700',
  CLOSED:          'bg-green-100 text-green-700',
  CANCELLED:       'bg-red-100 text-red-700',
}
const REQUEST_LABEL = {
  OPEN: 'Ouverte', PROPOSALS_SENT: 'Propositions reçues', SELECTED: 'Ouvrier confirmé',
  IN_PROGRESS: 'En cours', CLOSED: 'Terminée', CANCELLED: 'Annulée',
}

const MISSION_BADGE = {
  PENDING:   'bg-yellow-100 text-yellow-700',
  STARTED:   'bg-primary-100 text-primary-700',
  COMPLETED: 'bg-green-100 text-green-700',
  CANCELLED: 'bg-red-100 text-red-700',
}
const MISSION_LABEL = {
  PENDING: 'En attente', STARTED: 'En cours', COMPLETED: 'Terminée', CANCELLED: 'Annulée',
}

// ─── Composant : formulaire de motif ─────────────────────────────────────────

function ReasonForm({ label, placeholder, loading, onConfirm, onCancel }) {
  const [reason, setReason] = useState('')
  return (
    <div className="flex flex-col gap-2 rounded-lg border border-stone-200 bg-stone-50 p-3">
      <label className="text-sm font-medium text-stone-700">
        {label} <span className="text-red-500">*</span>
      </label>
      <textarea
        value={reason}
        onChange={(e) => setReason(e.target.value)}
        rows={3}
        placeholder={placeholder}
        className="w-full rounded-lg border border-stone-200 px-3 py-2 text-sm focus:border-primary-400 focus:outline-none"
      />
      <div className="flex gap-2">
        <button
          onClick={() => reason.trim() && onConfirm(reason.trim())}
          disabled={!reason.trim() || loading}
          className="rounded-lg bg-red-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-red-700 disabled:opacity-50"
        >
          {loading ? 'Envoi…' : 'Confirmer'}
        </button>
        <button
          onClick={onCancel}
          className="rounded-lg border border-stone-300 px-3 py-1.5 text-sm font-medium text-stone-600"
        >
          Annuler
        </button>
      </div>
    </div>
  )
}

// ─── Composant : confirmation simple ─────────────────────────────────────────

function ConfirmInline({ message, confirmLabel = 'Confirmer', loading, onConfirm, onCancel }) {
  return (
    <div className="flex items-center gap-3 rounded-lg border border-red-200 bg-red-50 p-3">
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

// ─── Modal fiche ouvrier ──────────────────────────────────────────────────────

function WorkerModal({ worker, onClose, onUpdate }) {
  const [action, setAction] = useState(null)
  const [loading, setLoading] = useState(false)

  const execute = async (fn, patch) => {
    setLoading(true)
    try {
      await fn()
      onUpdate({ ...worker, ...patch })
      setAction(null)
    } catch (err) {
      console.error('[AdminDashboard] Erreur ouvrier:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleApprove = () =>
    execute(
      () => workerService.approveWorker(worker.id),
      { verificationStatus: 'APPROVED', isVerified: true, rejectionReason: null }
    )

  const handleReject = (reason) =>
    execute(
      () => workerService.rejectWorker(worker.id, reason),
      { verificationStatus: 'REJECTED', isVerified: false, isAvailable: false, rejectionReason: reason }
    )

  const handleSuspend = (reason) =>
    execute(
      () => workerService.suspendWorker(worker.id, reason),
      { isSuspended: true, isAvailable: false, suspensionReason: reason }
    )

  const handleUnsuspend = () =>
    execute(
      () => workerService.unsuspendWorker(worker.id),
      { isSuspended: false, suspensionReason: null }
    )

  return (
    <div className="fixed inset-0 z-[2000] flex items-end justify-center bg-black/50 p-4 sm:items-center" onClick={onClose}>
      <div className="flex max-h-[90vh] w-full max-w-lg flex-col overflow-y-auto rounded-2xl bg-white" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between border-b border-stone-100 p-5">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-primary-100 text-xl font-bold text-primary-600">
              {worker.nom.charAt(0)}
            </div>
            <div>
              <h2 className="font-bold text-stone-900">{worker.nom}</h2>
              <p className="text-sm text-stone-500">
                {worker.metier} · {worker.ville}
                {worker.yearsOfExperience ? ` · ${worker.yearsOfExperience} ans` : ''}
              </p>
            </div>
          </div>
          <button onClick={onClose} className="rounded-full p-1 text-stone-400 hover:bg-stone-100">✕</button>
        </div>

        <div className="flex flex-col gap-5 p-5">
          <div className="flex flex-wrap gap-2">
            <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${VERIFICATION_BADGE[worker.verificationStatus] ?? 'bg-stone-100 text-stone-500'}`}>
              {VERIFICATION_LABEL[worker.verificationStatus] ?? worker.verificationStatus}
            </span>
            {worker.isSuspended && <span className="rounded-full bg-red-100 px-2.5 py-1 text-xs font-semibold text-red-700">Suspendu</span>}
            {worker.isAvailable && !worker.isSuspended && <span className="rounded-full bg-green-100 px-2.5 py-1 text-xs font-semibold text-green-700">Disponible</span>}
            {worker.note > 0 && <span className="rounded-full bg-amber-50 px-2.5 py-1 text-xs font-semibold text-amber-700">★ {worker.note} ({worker.avis} avis)</span>}
          </div>

          <div className="rounded-lg border border-stone-100 bg-stone-50 p-3 text-sm">
            <p className="text-stone-600">{worker.email}</p>
            <p className="text-stone-600">{worker.telephone}</p>
            {worker.languages?.length > 0 && <p className="mt-1 text-xs text-stone-400">{worker.languages.join(' · ')}</p>}
          </div>

          {worker.description && (
            <div>
              <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-stone-400">Description</p>
              <p className="text-sm text-stone-700">{worker.description}</p>
            </div>
          )}

          <div>
            <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-stone-400">Documents</p>
            <div className="grid grid-cols-2 gap-2">
              {[
                { label: 'Photo de profil',  key: 'photoProfil',        optional: true },
                { label: 'CNI recto',        key: 'pieceIdentiteRecto', optional: false },
                { label: 'CNI verso',        key: 'pieceIdentiteVerso', optional: false },
                { label: 'Certificat',       key: 'certificat',         optional: true },
              ].map(({ label, key, optional }) => {
                const url = worker[key]
                const Wrapper = url ? 'a' : 'div'
                return (
                  <Wrapper
                    key={key}
                    {...(url ? { href: url, target: '_blank', rel: 'noopener noreferrer' } : {})}
                    className={`flex flex-col gap-1.5 rounded-lg border p-2 text-xs ${
                      url
                        ? 'border-green-200 bg-green-50 transition hover:border-primary-400 hover:shadow-sm'
                        : optional
                          ? 'border-stone-100 bg-stone-50 text-stone-400'
                          : 'border-red-100 bg-red-50 text-red-500'
                    }`}
                  >
                    {url && (
                      // Aperçu miniature (image) — pas d'effet visible pour un PDF, mais le
                      // lien "Voir le document" reste fonctionnel dans tous les cas.
                      <img
                        src={url}
                        alt={label}
                        className="h-16 w-full rounded object-cover"
                        onError={(e) => { e.currentTarget.style.display = 'none' }}
                      />
                    )}
                    <div>
                      <p className="font-medium">{label}</p>
                      <p className="mt-0.5 truncate text-stone-500">
                        {url ? 'Voir le document ↗' : optional ? 'Non fourni' : 'Manquant'}
                      </p>
                    </div>
                  </Wrapper>
                )
              })}
            </div>
          </div>

          {(worker.rejectionReason || worker.suspensionReason) && (
            <div className="rounded-lg border border-red-100 bg-red-50 p-3">
              <p className="text-xs font-semibold text-red-600">{worker.isSuspended ? 'Motif de suspension' : 'Motif de rejet'}</p>
              <p className="mt-1 text-sm text-red-700">{worker.suspensionReason ?? worker.rejectionReason}</p>
            </div>
          )}

          <div className="border-t border-stone-100 pt-4">
            <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-stone-400">Actions administrateur</p>
            {action && (
              <ReasonForm
                label={action === 'reject' ? "Motif du rejet (visible par l'ouvrier)" : "Motif de la suspension (visible par l'ouvrier)"}
                placeholder={action === 'reject' ? "Ex : Documents non conformes…" : "Ex : Signalement client…"}
                loading={loading}
                onConfirm={action === 'reject' ? handleReject : handleSuspend}
                onCancel={() => setAction(null)}
              />
            )}
            {!action && (
              <div className="flex flex-wrap gap-2">
                {(worker.verificationStatus === 'PENDING' || worker.verificationStatus === 'REJECTED') && (
                  <button onClick={handleApprove} disabled={loading} className="rounded-lg bg-green-600 px-4 py-2 text-sm font-medium text-white hover:bg-green-700 disabled:opacity-50">
                    Approuver le dossier
                  </button>
                )}
                {worker.verificationStatus === 'PENDING' && (
                  <button onClick={() => setAction('reject')} className="rounded-lg border border-red-300 px-4 py-2 text-sm font-medium text-red-600 hover:bg-red-50">
                    Rejeter le dossier
                  </button>
                )}
                {worker.verificationStatus === 'APPROVED' && !worker.isSuspended && (
                  <button onClick={() => setAction('suspend')} className="rounded-lg border border-red-300 px-4 py-2 text-sm font-medium text-red-600 hover:bg-red-50">
                    Suspendre le compte
                  </button>
                )}
                {worker.isSuspended && (
                  <button onClick={handleUnsuspend} disabled={loading} className="rounded-lg bg-primary-600 px-4 py-2 text-sm font-medium text-white hover:bg-primary-700 disabled:opacity-50">
                    Lever la suspension
                  </button>
                )}
                {worker.verificationStatus === 'APPROVED' && !worker.isSuspended && (
                  <span className="text-xs text-stone-400">Compte actif</span>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

// ─── Modal fiche client ───────────────────────────────────────────────────────

function ClientModal({ client, onClose, onUpdate }) {
  const [showSuspendForm, setShowSuspendForm] = useState(false)
  const [loading, setLoading] = useState(false)

  const execute = async (fn, patch) => {
    setLoading(true)
    try {
      await fn()
      onUpdate({ ...client, ...patch })
      setShowSuspendForm(false)
    } catch (err) {
      console.error('[AdminDashboard] Erreur client:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleSuspend = (reason) =>
    execute(
      () => clientService.suspendClient(client.id, reason),
      { isSuspended: true, suspensionReason: reason }
    )

  const handleUnsuspend = () =>
    execute(
      () => clientService.unsuspendClient(client.id),
      { isSuspended: false, suspensionReason: null }
    )

  return (
    <div className="fixed inset-0 z-[2000] flex items-end justify-center bg-black/50 p-4 sm:items-center" onClick={onClose}>
      <div className="flex max-h-[90vh] w-full max-w-md flex-col overflow-y-auto rounded-2xl bg-white" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between border-b border-stone-100 p-5">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-primary-100 text-lg font-bold text-primary-600">
              {client.nom.charAt(0)}
            </div>
            <div>
              <h2 className="font-bold text-stone-900">{client.nom}</h2>
              <p className="text-sm text-stone-500">Client · {client.ville ?? '—'}</p>
            </div>
          </div>
          <button onClick={onClose} className="rounded-full p-1 text-stone-400 hover:bg-stone-100">✕</button>
        </div>

        <div className="flex flex-col gap-4 p-5">
          <div className="flex flex-wrap gap-2">
            {client.isSuspended
              ? <span className="rounded-full bg-red-100 px-2.5 py-1 text-xs font-semibold text-red-700">Compte suspendu</span>
              : <span className="rounded-full bg-green-100 px-2.5 py-1 text-xs font-semibold text-green-700">Compte actif</span>
            }
          </div>

          <div className="rounded-lg border border-stone-100 bg-stone-50 p-3 text-sm">
            <p className="text-stone-700">{client.email}</p>
            {client.telephone && <p className="text-stone-500">{client.telephone}</p>}
            {client.ville && <p className="mt-0.5 text-xs text-stone-400">{client.ville}</p>}
          </div>

          {client.isSuspended && client.suspensionReason && (
            <div className="rounded-lg border border-red-100 bg-red-50 p-3">
              <p className="text-xs font-semibold text-red-600">Motif de suspension</p>
              <p className="mt-1 text-sm text-red-700">{client.suspensionReason}</p>
            </div>
          )}

          <div className="border-t border-stone-100 pt-4">
            <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-stone-400">Actions administrateur</p>
            {showSuspendForm && (
              <ReasonForm
                label="Motif de la suspension (visible par le client)"
                placeholder="Ex : Comportement inapproprié envers un ouvrier…"
                loading={loading}
                onConfirm={handleSuspend}
                onCancel={() => setShowSuspendForm(false)}
              />
            )}
            {!showSuspendForm && (
              <div className="flex flex-wrap gap-2">
                {!client.isSuspended
                  ? <button onClick={() => setShowSuspendForm(true)} className="rounded-lg border border-red-300 px-4 py-2 text-sm font-medium text-red-600 hover:bg-red-50">Suspendre le compte</button>
                  : <button onClick={handleUnsuspend} disabled={loading} className="rounded-lg bg-primary-600 px-4 py-2 text-sm font-medium text-white hover:bg-primary-700 disabled:opacity-50">
                      {loading ? 'Réactivation…' : 'Lever la suspension'}
                    </button>
                }
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

// ─── Onglets config ───────────────────────────────────────────────────────────

const WORKER_TABS = [
  { key: 'all',       label: 'Tous' },
  { key: 'PENDING',   label: 'En attente' },
  { key: 'APPROVED',  label: 'Approuvés' },
  { key: 'REJECTED',  label: 'Rejetés' },
  { key: 'suspended', label: 'Suspendus' },
]

const CLIENT_TABS = [
  { key: 'all',       label: 'Tous' },
  { key: 'suspended', label: 'Suspendus' },
]

const REQUEST_TABS = [
  { key: 'all',        label: 'Toutes' },
  { key: 'OPEN',       label: 'Ouvertes' },
  { key: 'IN_PROGRESS',label: 'En cours' },
  { key: 'CLOSED',     label: 'Terminées' },
  { key: 'CANCELLED',  label: 'Annulées' },
]

const MISSION_TABS = [
  { key: 'all',       label: 'Toutes' },
  { key: 'PENDING',   label: 'En attente' },
  { key: 'STARTED',   label: 'En cours' },
  { key: 'COMPLETED', label: 'Terminées' },
  { key: 'CANCELLED', label: 'Annulées' },
]

const MAIN_TABS = [
  { key: 'ouvriers', label: 'Ouvriers' },
  { key: 'clients',  label: 'Clients' },
  { key: 'demandes', label: 'Demandes' },
  { key: 'missions', label: 'Missions' },
  { key: 'avis',     label: 'Avis' },
  { key: 'villes',   label: 'Villes' },
  { key: 'metiers',  label: 'Métiers' },
]

// ─── Dashboard principal ──────────────────────────────────────────────────────

export default function AdminDashboard() {
  const [workers,  setWorkers]  = useState([])
  const [clients,  setClients]  = useState([])
  const [requests, setRequests] = useState([])
  const [missions, setMissions] = useState([])
  const [ratings,  setRatings]  = useState([])
  const [villes,   setVilles]   = useState([])

  // Gestion villes
  const [newVille,      setNewVille]      = useState('')
  const [villeLoading,  setVilleLoading]  = useState(false)
  const [confirmDelVille, setConfirmDelVille] = useState(null) // id ville à supprimer

  // Gestion métiers
  const [metiers,          setMetiers]          = useState([])
  const [newMetier,        setNewMetier]        = useState('')
  const [metierLoading,    setMetierLoading]    = useState(false)
  const [confirmDelMetier, setConfirmDelMetier] = useState(null) // id métier à supprimer
  const [editingMetier,    setEditingMetier]    = useState(null) // { id, name } en cours de renommage

  const [selectedWorker, setSelectedWorker] = useState(null)
  const [selectedClient, setSelectedClient] = useState(null)

  // La section affichée est pilotée par l'URL (/admin/:tab) pour pouvoir y
  // accéder depuis le sous-menu de la sidebar (desktop). Sur mobile, la barre
  // d'onglets ci-dessous reste visible et navigue via la même URL.
  const { tab: tabParam } = useParams()
  const navigate = useNavigate()
  const mainTab = MAIN_TABS.some((t) => t.key === tabParam) ? tabParam : 'ouvriers'
  const setMainTab = (key) => navigate(`/admin/${key}`)

  const [workerTab,  setWorkerTab]  = useState('all')
  const [clientTab,  setClientTab]  = useState('all')
  const [requestTab, setRequestTab] = useState('all')
  const [missionTab, setMissionTab] = useState('all')

  // Confirmation inline pour actions destructives
  const [confirmRequest, setConfirmRequest] = useState(null) // { id, action: 'cancel'|'delete' }
  const [confirmMission, setConfirmMission] = useState(null) // id
  const [confirmRating,  setConfirmRating]  = useState(null) // id
  const [actionLoading,  setActionLoading]  = useState(false)

  useEffect(() => {
    // Endpoints admin : réponses paginées (PageResponse). Les onglets de cette page
    // filtrent côté client sur la collection complète, donc on parcourt toutes les
    // pages via fetchAllPages plutôt que de ne garder que la première.
    fetchAllPages((page, size) => workerService.getAllWorkersAdmin({ page, size })).then(setWorkers).catch(console.error)
    fetchAllPages((page, size) => clientService.getAllClients({ page, size })).then(setClients).catch(console.error)
    fetchAllPages((page, size) => requestService.getAllRequests({ page, size })).then(setRequests).catch(console.error)
    fetchAllPages((page, size) => missionService.getAllMissions({ page, size })).then(setMissions).catch(console.error)
    fetchAllPages((page, size) => ratingService.getAllRatings({ page, size })).then(setRatings).catch(console.error)
    villeService.getAllVilles().then(setVilles).catch(console.error)
    metierService.getAllMetiers().then(setMetiers).catch(console.error)
  }, [])

  // ── Index de lookup (id → objet) ─────────────────────────────────────────
  const workersById  = Object.fromEntries(workers.map((w) => [w.id, w]))
  const clientsById  = Object.fromEntries(clients.map((c) => [c.id, c]))
  const requestsById = Object.fromEntries(requests.map((r) => [r.id, r]))

  // ── Handlers ouvriers ─────────────────────────────────────────────────────
  const handleWorkerUpdate = (updated) => {
    setWorkers((prev) => prev.map((w) => (w.id === updated.id ? updated : w)))
    setSelectedWorker(updated)
  }

  // ── Handlers clients ──────────────────────────────────────────────────────
  const handleClientUpdate = (updated) => {
    setClients((prev) => prev.map((c) => (c.id === updated.id ? updated : c)))
    setSelectedClient(updated)
  }

  // ── Handlers demandes ─────────────────────────────────────────────────────
  const handleCancelRequest = async (id) => {
    setActionLoading(true)
    try {
      await requestService.cancelRequest(id)
      setRequests((prev) => prev.map((r) => r.id === id ? { ...r, status: 'CANCELLED' } : r))
    } catch (err) {
      console.error('[AdminDashboard] Erreur annulation demande:', err)
    } finally {
      setActionLoading(false)
      setConfirmRequest(null)
    }
  }

  const handleDeleteRequest = async (id) => {
    setActionLoading(true)
    try {
      await requestService.deleteRequest(id)
      setRequests((prev) => prev.filter((r) => r.id !== id))
    } catch (err) {
      console.error('[AdminDashboard] Erreur suppression demande:', err)
    } finally {
      setActionLoading(false)
      setConfirmRequest(null)
    }
  }

  // ── Handlers missions ─────────────────────────────────────────────────────
  const handleCancelMission = async (id) => {
    setActionLoading(true)
    try {
      await missionService.cancelMission(id)
      setMissions((prev) => prev.map((m) => m.id === id ? { ...m, status: 'CANCELLED' } : m))
      // Repasser la demande en OPEN si la mission est annulée
      const mission = missions.find((m) => m.id === id)
      if (mission) {
        await requestService.cancelRequest(mission.requestId)
        setRequests((prev) => prev.map((r) => r.id === mission.requestId ? { ...r, status: 'CANCELLED' } : r))
      }
    } catch (err) {
      console.error('[AdminDashboard] Erreur annulation mission:', err)
    } finally {
      setActionLoading(false)
      setConfirmMission(null)
    }
  }

  // ── Handlers avis ─────────────────────────────────────────────────────────
  const handleDeleteRating = async (id) => {
    setActionLoading(true)
    try {
      await ratingService.deleteRating(id)
      setRatings((prev) => prev.filter((r) => r.id !== id))
    } catch (err) {
      console.error('[AdminDashboard] Erreur suppression avis:', err)
    } finally {
      setActionLoading(false)
      setConfirmRating(null)
    }
  }

  // ── Données filtrées ──────────────────────────────────────────────────────
  const pendingWorkers   = workers.filter((w) => w.verificationStatus === 'PENDING')
  const suspendedClients = clients.filter((c) => c.isSuspended)

  const filteredWorkers = workers.filter((w) => {
    if (workerTab === 'all')       return true
    if (workerTab === 'suspended') return w.isSuspended
    return w.verificationStatus === workerTab
  })

  const filteredClients = clients.filter((c) => {
    if (clientTab === 'all')       return true
    if (clientTab === 'suspended') return c.isSuspended
    return true
  })

  const filteredRequests = requests.filter((r) => {
    if (requestTab === 'all') return true
    return r.status === requestTab
  })

  const filteredMissions = missions.filter((m) => {
    if (missionTab === 'all') return true
    return m.status === missionTab
  })

  const activeMissions = missions.filter((m) => m.status === 'STARTED' || m.status === 'PENDING')

  // ── Stats ─────────────────────────────────────────────────────────────────
  const stats = [
    { label: 'Clients actifs',       value: clients.filter((c) => !c.isSuspended).length,                            alert: false },
    { label: 'Ouvriers actifs',      value: workers.filter((w) => !w.isSuspended && w.verificationStatus === 'APPROVED').length, alert: false },
    { label: 'Dossiers en attente',  value: pendingWorkers.length,                                                    alert: pendingWorkers.length > 0 },
    { label: 'Missions en cours',    value: activeMissions.length,                                                    alert: false },
  ]

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-lg font-bold text-stone-900">Tableau de bord administrateur</h1>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        {stats.map((s) => (
          <div key={s.label} className="rounded-xl border border-stone-200 bg-white p-4 text-center">
            <p className={`text-2xl font-bold ${s.alert ? 'text-yellow-600' : 'text-primary-600'}`}>{s.value}</p>
            <p className="text-xs text-stone-500">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Alertes prioritaires */}
      {pendingWorkers.length > 0 && (
        <section className="rounded-xl border-2 border-yellow-200 bg-yellow-50 p-4">
          <h2 className="mb-3 flex items-center gap-2 font-semibold text-yellow-800">
            <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-yellow-400 text-xs font-bold text-white">
              {pendingWorkers.length}
            </span>
            Dossiers ouvriers en attente de validation
          </h2>
          <ul className="flex flex-col gap-2">
            {pendingWorkers.map((w) => (
              <li key={w.id} className="flex flex-wrap items-center justify-between gap-3 rounded-lg bg-white p-3 shadow-sm">
                <div className="flex items-center gap-3">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-yellow-100 text-sm font-bold text-yellow-700">
                    {w.nom.charAt(0)}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-stone-900">{w.nom}</p>
                    <p className="text-xs text-stone-500">{w.metier} · {w.ville}</p>
                  </div>
                </div>
                <button
                  onClick={() => { setMainTab('ouvriers'); setSelectedWorker(w) }}
                  className="rounded-lg bg-yellow-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-yellow-700"
                >
                  Examiner le dossier
                </button>
              </li>
            ))}
          </ul>
        </section>
      )}

      {/* Navigation principale — mobile uniquement : sur desktop elle vit dans la sidebar */}
      <div className="flex gap-1 overflow-x-auto rounded-xl border border-stone-200 bg-stone-50 p-1 md:hidden">
        {MAIN_TABS.map((tab) => {
          const badge =
            tab.key === 'ouvriers' ? pendingWorkers.length
            : tab.key === 'clients'  ? suspendedClients.length
            : 0
          return (
            <button
              key={tab.key}
              onClick={() => setMainTab(tab.key)}
              className={`flex flex-1 items-center justify-center gap-1.5 whitespace-nowrap rounded-lg px-3 py-2.5 text-sm font-semibold transition ${
                mainTab === tab.key ? 'bg-white text-stone-900 shadow-sm' : 'text-stone-500 hover:text-stone-700'
              }`}
            >
              {tab.label}
              {badge > 0 && (
                <span className="inline-flex h-4 w-4 items-center justify-center rounded-full bg-yellow-400 text-[10px] font-bold text-white">
                  {badge}
                </span>
              )}
            </button>
          )
        })}
      </div>

      {/* ── OUVRIERS ─────────────────────────────────────────────────────────── */}
      {mainTab === 'ouvriers' && (
        <section className="rounded-xl border border-stone-200 bg-white p-5">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <h2 className="font-semibold text-stone-900">Ouvriers ({filteredWorkers.length})</h2>
            <div className="flex flex-wrap gap-1">
              {WORKER_TABS.map((tab) => {
                const count = tab.key === 'all' ? workers.length : tab.key === 'suspended' ? workers.filter((w) => w.isSuspended).length : workers.filter((w) => w.verificationStatus === tab.key).length
                return (
                  <button key={tab.key} onClick={() => setWorkerTab(tab.key)}
                    className={`rounded-full px-3 py-1 text-xs font-medium transition ${workerTab === tab.key ? 'bg-primary-600 text-white' : 'bg-stone-100 text-stone-600 hover:bg-stone-200'}`}>
                    {tab.label}{count > 0 && <span className="ml-1 opacity-70">({count})</span>}
                  </button>
                )
              })}
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-stone-100 text-xs uppercase tracking-wide text-stone-400">
                  <th className="pb-2 pr-4">Ouvrier</th>
                  <th className="pb-2 pr-4">Métier · Ville</th>
                  <th className="pb-2 pr-4">Dossier</th>
                  <th className="pb-2 pr-4">Statut</th>
                  <th className="pb-2 pr-4">Note</th>
                  <th className="pb-2"></th>
                </tr>
              </thead>
              <tbody>
                {filteredWorkers.length === 0 && (
                  <tr><td colSpan={6} className="py-6 text-center text-sm text-stone-400">Aucun ouvrier.</td></tr>
                )}
                {filteredWorkers.map((w) => (
                  <tr key={w.id} className="border-b border-stone-50 hover:bg-stone-50">
                    <td className="py-3 pr-4">
                      <div className="flex items-center gap-2">
                        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary-100 text-sm font-bold text-primary-700">{w.nom.charAt(0)}</div>
                        <div>
                          <p className="font-medium text-stone-900">{w.nom}</p>
                          <p className="text-xs text-stone-400">{w.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="py-3 pr-4 text-stone-600">{w.metier}<br /><span className="text-xs text-stone-400">{w.ville}</span></td>
                    <td className="py-3 pr-4">
                      <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${VERIFICATION_BADGE[w.verificationStatus] ?? 'bg-stone-100 text-stone-500'}`}>
                        {VERIFICATION_LABEL[w.verificationStatus] ?? w.verificationStatus}
                      </span>
                    </td>
                    <td className="py-3 pr-4">
                      <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${w.isSuspended ? 'bg-red-100 text-red-700' : w.isAvailable ? 'bg-green-100 text-green-700' : 'bg-stone-100 text-stone-500'}`}>
                        {w.isSuspended ? 'Suspendu' : w.isAvailable ? 'Disponible' : 'Indisponible'}
                      </span>
                    </td>
                    <td className="py-3 pr-4 text-stone-600">{w.note > 0 ? `★ ${w.note}` : '—'}</td>
                    <td className="py-3">
                      <button onClick={() => setSelectedWorker(w)} className="rounded-lg border border-stone-300 px-3 py-1 text-xs font-medium text-stone-700 hover:border-primary-400 hover:text-primary-700">
                        Voir le profil
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {/* ── CLIENTS ──────────────────────────────────────────────────────────── */}
      {mainTab === 'clients' && (
        <section className="rounded-xl border border-stone-200 bg-white p-5">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <h2 className="font-semibold text-stone-900">Clients ({filteredClients.length})</h2>
            <div className="flex gap-1">
              {CLIENT_TABS.map((tab) => {
                const count = tab.key === 'all' ? clients.length : suspendedClients.length
                return (
                  <button key={tab.key} onClick={() => setClientTab(tab.key)}
                    className={`rounded-full px-3 py-1 text-xs font-medium transition ${clientTab === tab.key ? 'bg-primary-600 text-white' : 'bg-stone-100 text-stone-600 hover:bg-stone-200'}`}>
                    {tab.label}{count > 0 && <span className="ml-1 opacity-70">({count})</span>}
                  </button>
                )
              })}
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-stone-100 text-xs uppercase tracking-wide text-stone-400">
                  <th className="pb-2 pr-4">Client</th>
                  <th className="pb-2 pr-4">Ville</th>
                  <th className="pb-2 pr-4">Statut</th>
                  <th className="pb-2 pr-4">Inscription</th>
                  <th className="pb-2"></th>
                </tr>
              </thead>
              <tbody>
                {filteredClients.length === 0 && (
                  <tr><td colSpan={5} className="py-6 text-center text-sm text-stone-400">Aucun client.</td></tr>
                )}
                {filteredClients.map((c) => (
                  <tr key={c.id} className="border-b border-stone-50 hover:bg-stone-50">
                    <td className="py-3 pr-4">
                      <div className="flex items-center gap-2">
                        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary-100 text-sm font-bold text-primary-700">{c.nom.charAt(0)}</div>
                        <div>
                          <p className="font-medium text-stone-900">{c.nom}</p>
                          <p className="text-xs text-stone-400">{c.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="py-3 pr-4 text-stone-500">{c.ville ?? '—'}</td>
                    <td className="py-3 pr-4">
                      <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${c.isSuspended ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'}`}>
                        {c.isSuspended ? 'Suspendu' : 'Actif'}
                      </span>
                    </td>
                    <td className="py-3 pr-4 text-xs text-stone-400">
                      {c.createdAt ? new Date(c.createdAt).toLocaleDateString('fr-FR') : '—'}
                    </td>
                    <td className="py-3">
                      <button onClick={() => setSelectedClient(c)} className="rounded-lg border border-stone-300 px-3 py-1 text-xs font-medium text-stone-700 hover:border-primary-400 hover:text-primary-700">
                        Gérer
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {/* ── DEMANDES ─────────────────────────────────────────────────────────── */}
      {mainTab === 'demandes' && (
        <section className="rounded-xl border border-stone-200 bg-white p-5">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <h2 className="font-semibold text-stone-900">Demandes ({filteredRequests.length})</h2>
            <div className="flex flex-wrap gap-1">
              {REQUEST_TABS.map((tab) => {
                const count = tab.key === 'all' ? requests.length : requests.filter((r) => r.status === tab.key).length
                return (
                  <button key={tab.key} onClick={() => setRequestTab(tab.key)}
                    className={`rounded-full px-3 py-1 text-xs font-medium transition ${requestTab === tab.key ? 'bg-primary-600 text-white' : 'bg-stone-100 text-stone-600 hover:bg-stone-200'}`}>
                    {tab.label}{count > 0 && <span className="ml-1 opacity-70">({count})</span>}
                  </button>
                )
              })}
            </div>
          </div>
          <div className="flex flex-col gap-2">
            {filteredRequests.length === 0 && <p className="py-6 text-center text-sm text-stone-400">Aucune demande.</p>}
            {filteredRequests.map((r) => (
              <div key={r.id} className="flex flex-col gap-2 rounded-lg border border-stone-100 p-3">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="font-medium text-stone-900">{r.metier} · {r.ville}</p>
                    <p className="text-xs text-stone-400">
                      Client : {clientsById[r.clientId]?.nom ?? `#${r.clientId}`} ·{' '}
                      {new Date(r.createdAt).toLocaleDateString('fr-FR')}
                    </p>
                    {r.description && <p className="mt-1 line-clamp-1 text-xs italic text-stone-400">{r.description}</p>}
                  </div>
                  <span className={`shrink-0 rounded-full px-2 py-0.5 text-xs font-medium ${REQUEST_BADGE[r.status] ?? 'bg-stone-100 text-stone-500'}`}>
                    {REQUEST_LABEL[r.status] ?? r.status}
                  </span>
                </div>

                {/* Confirmation inline */}
                {confirmRequest?.id === r.id ? (
                  <ConfirmInline
                    message={confirmRequest.action === 'cancel' ? 'Annuler définitivement cette demande ?' : 'Supprimer cette demande ? Action irréversible.'}
                    confirmLabel={confirmRequest.action === 'cancel' ? 'Annuler la demande' : 'Supprimer'}
                    loading={actionLoading}
                    onConfirm={() => confirmRequest.action === 'cancel' ? handleCancelRequest(r.id) : handleDeleteRequest(r.id)}
                    onCancel={() => setConfirmRequest(null)}
                  />
                ) : (
                  r.status !== 'CANCELLED' && r.status !== 'CLOSED' && (
                    <div className="flex gap-2">
                      <button
                        onClick={() => setConfirmRequest({ id: r.id, action: 'cancel' })}
                        className="rounded-lg border border-orange-300 px-3 py-1 text-xs font-medium text-orange-600 hover:bg-orange-50"
                      >
                        Annuler la demande
                      </button>
                      <button
                        onClick={() => setConfirmRequest({ id: r.id, action: 'delete' })}
                        className="rounded-lg border border-red-300 px-3 py-1 text-xs font-medium text-red-600 hover:bg-red-50"
                      >
                        Supprimer
                      </button>
                    </div>
                  )
                )}
              </div>
            ))}
          </div>
        </section>
      )}

      {/* ── MISSIONS ─────────────────────────────────────────────────────────── */}
      {mainTab === 'missions' && (
        <section className="rounded-xl border border-stone-200 bg-white p-5">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <h2 className="font-semibold text-stone-900">Missions ({filteredMissions.length})</h2>
            <div className="flex flex-wrap gap-1">
              {MISSION_TABS.map((tab) => {
                const count = tab.key === 'all' ? missions.length : missions.filter((m) => m.status === tab.key).length
                return (
                  <button key={tab.key} onClick={() => setMissionTab(tab.key)}
                    className={`rounded-full px-3 py-1 text-xs font-medium transition ${missionTab === tab.key ? 'bg-primary-600 text-white' : 'bg-stone-100 text-stone-600 hover:bg-stone-200'}`}>
                    {tab.label}{count > 0 && <span className="ml-1 opacity-70">({count})</span>}
                  </button>
                )
              })}
            </div>
          </div>
          <div className="flex flex-col gap-2">
            {filteredMissions.length === 0 && <p className="py-6 text-center text-sm text-stone-400">Aucune mission.</p>}
            {filteredMissions.map((m) => {
              const req    = requestsById[m.requestId]
              const worker = workersById[m.workerId]
              const client = clientsById[m.clientId]
              return (
                <div key={m.id} className="flex flex-col gap-2 rounded-lg border border-stone-100 p-3">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="font-medium text-stone-900">
                        {req?.metier ?? '—'} · {req?.ville ?? '—'}
                      </p>
                      <p className="text-xs text-stone-400">
                        Ouvrier : <span className="text-stone-600">{worker?.nom ?? `#${m.workerId}`}</span>
                        {' · '}Client : <span className="text-stone-600">{client?.nom ?? `#${m.clientId}`}</span>
                      </p>
                      {m.acceptedAt && (
                        <p className="text-xs text-stone-400">
                          Acceptée le {new Date(m.acceptedAt).toLocaleDateString('fr-FR')}
                          {m.completedAt && ` · Terminée le ${new Date(m.completedAt).toLocaleDateString('fr-FR')}`}
                        </p>
                      )}
                    </div>
                    <span className={`shrink-0 rounded-full px-2 py-0.5 text-xs font-medium ${MISSION_BADGE[m.status] ?? 'bg-stone-100 text-stone-500'}`}>
                      {MISSION_LABEL[m.status] ?? m.status}
                    </span>
                  </div>

                  {/* Confirmation annulation mission */}
                  {confirmMission === m.id ? (
                    <ConfirmInline
                      message="Annuler cette mission ? La demande associée sera également annulée."
                      confirmLabel="Annuler la mission"
                      loading={actionLoading}
                      onConfirm={() => handleCancelMission(m.id)}
                      onCancel={() => setConfirmMission(null)}
                    />
                  ) : (
                    (m.status === 'PENDING' || m.status === 'STARTED') && (
                      <div>
                        <button
                          onClick={() => setConfirmMission(m.id)}
                          className="rounded-lg border border-red-300 px-3 py-1 text-xs font-medium text-red-600 hover:bg-red-50"
                        >
                          Annuler la mission
                        </button>
                      </div>
                    )
                  )}
                </div>
              )
            })}
          </div>
        </section>
      )}

      {/* ── AVIS ─────────────────────────────────────────────────────────────── */}
      {mainTab === 'avis' && (
        <section className="rounded-xl border border-stone-200 bg-white p-5">
          <h2 className="mb-4 font-semibold text-stone-900">Avis clients ({ratings.length})</h2>
          <div className="flex flex-col gap-2">
            {ratings.length === 0 && <p className="py-6 text-center text-sm text-stone-400">Aucun avis.</p>}
            {ratings.map((r) => {
              const worker = workersById[r.workerId]
              const client = clientsById[r.clientId]
              return (
                <div key={r.id} className="flex flex-col gap-2 rounded-lg border border-stone-100 p-3">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-semibold text-amber-500">{'★'.repeat(r.rating)}{'☆'.repeat(5 - r.rating)}</span>
                        <span className="text-xs text-stone-400">{r.rating}/5</span>
                      </div>
                      <p className="mt-0.5 text-xs text-stone-500">
                        Par <span className="text-stone-700">{client?.nom ?? `#${r.clientId}`}</span>
                        {' '}pour <span className="text-stone-700">{worker?.nom ?? `#${r.workerId}`}</span>
                        {' · '}{new Date(r.createdAt).toLocaleDateString('fr-FR')}
                      </p>
                      {r.comment && <p className="mt-1 text-sm text-stone-600 italic">"{r.comment}"</p>}
                    </div>
                    {confirmRating !== r.id && (
                      <button
                        onClick={() => setConfirmRating(r.id)}
                        className="shrink-0 rounded-lg border border-red-200 px-3 py-1 text-xs font-medium text-red-500 hover:bg-red-50"
                      >
                        Supprimer
                      </button>
                    )}
                  </div>
                  {confirmRating === r.id && (
                    <ConfirmInline
                      message="Supprimer cet avis ? Cette action est irréversible."
                      confirmLabel="Supprimer l'avis"
                      loading={actionLoading}
                      onConfirm={() => handleDeleteRating(r.id)}
                      onCancel={() => setConfirmRating(null)}
                    />
                  )}
                </div>
              )
            })}
          </div>
        </section>
      )}

      {/* ── VILLES ───────────────────────────────────────────────────────────── */}
      {mainTab === 'villes' && (
        <section className="rounded-xl border border-stone-200 bg-white p-5">
          <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="font-semibold text-stone-900">Villes disponibles</h2>
              <p className="text-xs text-stone-400 mt-0.5">
                Ces villes sont proposées aux clients et ouvriers lors de l'inscription et des demandes.
              </p>
            </div>
            <span className="rounded-full bg-stone-100 px-3 py-1 text-xs font-medium text-stone-600">
              {villes.length} ville{villes.length > 1 ? 's' : ''}
            </span>
          </div>

          {/* Formulaire d'ajout */}
          <form
            onSubmit={async (e) => {
              e.preventDefault()
              const nom = newVille.trim()
              if (!nom) return
              if (villes.some((v) => v.name.toLowerCase() === nom.toLowerCase())) return
              setVilleLoading(true)
              try {
                const created = await villeService.addVille(nom)
                setVilles((prev) => [...prev, created])
                setNewVille('')
              } catch (err) {
                console.error('[AdminDashboard] Erreur ajout ville:', err)
              } finally {
                setVilleLoading(false)
              }
            }}
            className="mb-5 flex gap-2"
          >
            <input
              value={newVille}
              onChange={(e) => setNewVille(e.target.value)}
              placeholder="Nom de la ville…"
              className="flex-1 rounded-xl border border-stone-200 px-3 py-2.5 text-sm focus:border-primary-400 focus:outline-none"
            />
            <button
              type="submit"
              disabled={villeLoading || !newVille.trim()}
              className="rounded-xl bg-primary-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-primary-700 disabled:opacity-50"
            >
              {villeLoading ? '…' : '+ Ajouter'}
            </button>
          </form>

          {/* Liste des villes */}
          {villes.length === 0 ? (
            <p className="text-sm text-stone-400">Aucune ville enregistrée.</p>
          ) : (
            <div className="flex flex-wrap gap-2">
              {[...villes].sort((a, b) => a.name.localeCompare(b.name)).map((v) => (
                <div key={v.id} className="flex items-center gap-1.5 rounded-full border border-stone-200 bg-stone-50 pl-3 pr-1.5 py-1">
                  <span className="text-sm text-stone-700">{v.name}</span>
                  {confirmDelVille === v.id ? (
                    <>
                      <button
                        onClick={async () => {
                          setVilleLoading(true)
                          try {
                            await villeService.deleteVille(v.id)
                            setVilles((prev) => prev.filter((x) => x.id !== v.id))
                          } catch (err) {
                            console.error('[AdminDashboard] Erreur suppression ville:', err)
                          } finally {
                            setVilleLoading(false)
                            setConfirmDelVille(null)
                          }
                        }}
                        className="rounded-full bg-red-100 px-2 py-0.5 text-[10px] font-semibold text-red-600 hover:bg-red-200"
                      >
                        Confirmer
                      </button>
                      <button
                        onClick={() => setConfirmDelVille(null)}
                        className="rounded-full bg-stone-100 px-2 py-0.5 text-[10px] font-medium text-stone-500 hover:bg-stone-200"
                      >
                        Non
                      </button>
                    </>
                  ) : (
                    <button
                      onClick={() => setConfirmDelVille(v.id)}
                      className="flex h-5 w-5 items-center justify-center rounded-full text-stone-300 hover:bg-red-50 hover:text-red-500"
                      title="Supprimer"
                    >
                      ✕
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}
        </section>
      )}

      {/* ── MÉTIERS ──────────────────────────────────────────────────────────── */}
      {mainTab === 'metiers' && (
        <section className="rounded-xl border border-stone-200 bg-white p-5">
          <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="font-semibold text-stone-900">Métiers disponibles</h2>
              <p className="text-xs text-stone-400 mt-0.5">
                Ces métiers sont proposés aux ouvriers lors de l'inscription et aux clients lors d'une demande.
              </p>
            </div>
            <span className="rounded-full bg-stone-100 px-3 py-1 text-xs font-medium text-stone-600">
              {metiers.length} métier{metiers.length > 1 ? 's' : ''}
            </span>
          </div>

          {/* Formulaire d'ajout */}
          <form
            onSubmit={async (e) => {
              e.preventDefault()
              const nom = newMetier.trim()
              if (!nom) return
              if (metiers.some((m) => m.name.toLowerCase() === nom.toLowerCase())) return
              setMetierLoading(true)
              try {
                const created = await metierService.addMetier(nom)
                setMetiers((prev) => [...prev, created].sort((a, b) => a.name.localeCompare(b.name)))
                setNewMetier('')
              } catch (err) {
                console.error('[AdminDashboard] Erreur ajout métier:', err)
              } finally {
                setMetierLoading(false)
              }
            }}
            className="mb-5 flex gap-2"
          >
            <input
              value={newMetier}
              onChange={(e) => setNewMetier(e.target.value)}
              placeholder="Nom du métier…"
              className="flex-1 rounded-xl border border-stone-200 px-3 py-2.5 text-sm focus:border-primary-400 focus:outline-none"
            />
            <button
              type="submit"
              disabled={metierLoading || !newMetier.trim()}
              className="rounded-xl bg-primary-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-primary-700 disabled:opacity-50"
            >
              {metierLoading ? '…' : '+ Ajouter'}
            </button>
          </form>

          {/* Liste des métiers */}
          {metiers.length === 0 ? (
            <p className="text-sm text-stone-400">Aucun métier enregistré.</p>
          ) : (
            <div className="flex flex-wrap gap-2">
              {metiers.map((m) => {
                const isEditing   = editingMetier?.id === m.id
                const isConfirming = confirmDelMetier === m.id

                if (isEditing) {
                  return (
                    <div key={m.id} className="flex items-center gap-1.5 rounded-full border border-primary-300 bg-primary-50 pl-2 pr-1.5 py-1">
                      <input
                        autoFocus
                        value={editingMetier.name}
                        onChange={(e) => setEditingMetier({ ...editingMetier, name: e.target.value })}
                        onKeyDown={(e) => e.key === 'Escape' && setEditingMetier(null)}
                        className="w-32 rounded bg-white px-2 py-0.5 text-sm text-stone-800 border border-primary-200 focus:outline-none"
                      />
                      <button
                        onClick={async () => {
                          const name = editingMetier.name.trim()
                          if (!name || name === m.name) { setEditingMetier(null); return }
                          setMetierLoading(true)
                          try {
                            const updated = await metierService.updateMetier(m.id, name)
                            setMetiers((prev) =>
                              prev.map((x) => (x.id === m.id ? updated : x))
                                  .sort((a, b) => a.name.localeCompare(b.name))
                            )
                            setEditingMetier(null)
                          } catch (err) {
                            console.error('[AdminDashboard] Erreur renommage métier:', err)
                          } finally {
                            setMetierLoading(false)
                          }
                        }}
                        disabled={!editingMetier.name.trim()}
                        className="rounded-full bg-primary-600 px-2 py-0.5 text-[10px] font-semibold text-white hover:bg-primary-700 disabled:opacity-50"
                      >
                        ✓
                      </button>
                      <button
                        onClick={() => setEditingMetier(null)}
                        className="rounded-full bg-stone-100 px-2 py-0.5 text-[10px] font-medium text-stone-500 hover:bg-stone-200"
                      >
                        ✗
                      </button>
                    </div>
                  )
                }

                if (isConfirming) {
                  return (
                    <div key={m.id} className="flex items-center gap-1.5 rounded-full border border-red-200 bg-red-50 pl-3 pr-1.5 py-1">
                      <span className="text-sm text-red-700 font-medium">{m.name}</span>
                      <button
                        onClick={async () => {
                          setMetierLoading(true)
                          try {
                            await metierService.deleteMetier(m.id)
                            setMetiers((prev) => prev.filter((x) => x.id !== m.id))
                          } catch (err) {
                            console.error('[AdminDashboard] Erreur suppression métier:', err)
                          } finally {
                            setMetierLoading(false)
                            setConfirmDelMetier(null)
                          }
                        }}
                        className="rounded-full bg-red-100 px-2 py-0.5 text-[10px] font-semibold text-red-600 hover:bg-red-200"
                      >
                        Confirmer
                      </button>
                      <button
                        onClick={() => setConfirmDelMetier(null)}
                        className="rounded-full bg-stone-100 px-2 py-0.5 text-[10px] font-medium text-stone-500 hover:bg-stone-200"
                      >
                        Non
                      </button>
                    </div>
                  )
                }

                return (
                  <div key={m.id} className="flex items-center gap-1 rounded-full border border-stone-200 bg-stone-50 pl-3 pr-1.5 py-1">
                    <span className="text-sm text-stone-700">{m.name}</span>
                    <button
                      onClick={() => { setConfirmDelMetier(null); setEditingMetier({ id: m.id, name: m.name }) }}
                      className="flex h-5 w-5 items-center justify-center rounded-full text-stone-300 hover:bg-primary-50 hover:text-primary-500"
                      title="Renommer"
                    >
                      ✎
                    </button>
                    <button
                      onClick={() => { setEditingMetier(null); setConfirmDelMetier(m.id) }}
                      className="flex h-5 w-5 items-center justify-center rounded-full text-stone-300 hover:bg-red-50 hover:text-red-500"
                      title="Supprimer"
                    >
                      ✕
                    </button>
                  </div>
                )
              })}
            </div>
          )}
        </section>
      )}

      {/* Modales */}
      {selectedWorker && (
        <WorkerModal
          worker={selectedWorker}
          onClose={() => setSelectedWorker(null)}
          onUpdate={handleWorkerUpdate}
        />
      )}
      {selectedClient && (
        <ClientModal
          client={selectedClient}
          onClose={() => setSelectedClient(null)}
          onUpdate={handleClientUpdate}
        />
      )}
    </div>
  )
}
