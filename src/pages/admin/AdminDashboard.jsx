import { useEffect, useState } from 'react'
import { workerService } from '../../services/worker.service'
import { clientService } from '../../services/client.service'
import { requestService } from '../../services/request.service'
import api from '../../services/api'

// ─── Badges partagés ──────────────────────────────────────────────────────────

const VERIFICATION_BADGE = {
  APPROVED: 'bg-green-100 text-green-700',
  PENDING:  'bg-yellow-100 text-yellow-700',
  REJECTED: 'bg-red-100 text-red-700',
}
const VERIFICATION_LABEL = {
  APPROVED: 'Approuvé',
  PENDING:  'En attente',
  REJECTED: 'Rejeté',
}

// ─── Composant réutilisable : formulaire de motif ─────────────────────────────

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
    <div
      className="fixed inset-0 z-[2000] flex items-end justify-center bg-black/50 p-4 sm:items-center"
      onClick={onClose}
    >
      <div
        className="flex max-h-[90vh] w-full max-w-md flex-col overflow-y-auto rounded-2xl bg-white"
        onClick={(e) => e.stopPropagation()}
      >
        {/* En-tête */}
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
          <button onClick={onClose} className="rounded-full p-1 text-stone-400 hover:bg-stone-100">
            ✕
          </button>
        </div>

        {/* Corps */}
        <div className="flex flex-col gap-4 p-5">

          {/* Statut */}
          <div className="flex flex-wrap gap-2">
            {client.isSuspended ? (
              <span className="rounded-full bg-red-100 px-2.5 py-1 text-xs font-semibold text-red-700">
                Compte suspendu
              </span>
            ) : (
              <span className="rounded-full bg-green-100 px-2.5 py-1 text-xs font-semibold text-green-700">
                Compte actif
              </span>
            )}
          </div>

          {/* Coordonnées */}
          <div className="rounded-lg border border-stone-100 bg-stone-50 p-3 text-sm">
            <p className="text-stone-700">{client.email}</p>
            {client.telephone && <p className="text-stone-500">{client.telephone}</p>}
            {client.ville && <p className="text-stone-400 text-xs mt-0.5">{client.ville}</p>}
          </div>

          {/* Motif de suspension actuel */}
          {client.isSuspended && client.suspensionReason && (
            <div className="rounded-lg border border-red-100 bg-red-50 p-3">
              <p className="text-xs font-semibold text-red-600">Motif de suspension</p>
              <p className="mt-1 text-sm text-red-700">{client.suspensionReason}</p>
              <p className="mt-2 text-xs text-red-400 italic">
                Ce message est affiché au client lors de sa tentative de connexion.
              </p>
            </div>
          )}

          {/* Actions */}
          <div className="border-t border-stone-100 pt-4">
            <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-stone-400">
              Actions administrateur
            </p>

            {/* Formulaire suspension */}
            {showSuspendForm && (
              <ReasonForm
                label="Motif de la suspension (visible par le client)"
                placeholder="Ex : Comportement inapproprié envers un ouvrier, signalement frauduleux…"
                loading={loading}
                onConfirm={handleSuspend}
                onCancel={() => setShowSuspendForm(false)}
              />
            )}

            {/* Boutons */}
            {!showSuspendForm && (
              <div className="flex flex-wrap gap-2">
                {!client.isSuspended ? (
                  <button
                    onClick={() => setShowSuspendForm(true)}
                    className="rounded-lg border border-red-300 px-4 py-2 text-sm font-medium text-red-600 hover:bg-red-50"
                  >
                    Suspendre le compte
                  </button>
                ) : (
                  <button
                    onClick={handleUnsuspend}
                    disabled={loading}
                    className="rounded-lg bg-primary-600 px-4 py-2 text-sm font-medium text-white hover:bg-primary-700 disabled:opacity-50"
                  >
                    {loading ? 'Réactivation…' : 'Lever la suspension'}
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

// ─── Modal fiche ouvrier ──────────────────────────────────────────────────────

function WorkerModal({ worker, onClose, onUpdate }) {
  const [action, setAction] = useState(null)
  const [loading, setLoading] = useState(false)

  const execute = async (fn, optimisticPatch) => {
    setLoading(true)
    try {
      await fn()
      onUpdate({ ...worker, ...optimisticPatch })
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
    <div
      className="fixed inset-0 z-[2000] flex items-end justify-center bg-black/50 p-4 sm:items-center"
      onClick={onClose}
    >
      <div
        className="flex max-h-[90vh] w-full max-w-lg flex-col overflow-y-auto rounded-2xl bg-white"
        onClick={(e) => e.stopPropagation()}
      >
        {/* En-tête */}
        <div className="flex items-center justify-between border-b border-stone-100 p-5">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-primary-100 text-xl font-bold text-primary-600">
              {worker.nom.charAt(0)}
            </div>
            <div>
              <h2 className="font-bold text-stone-900">{worker.nom}</h2>
              <p className="text-sm text-stone-500">
                {worker.metier} · {worker.ville}
                {worker.yearsOfExperience ? ` · ${worker.yearsOfExperience} ans d'exp.` : ''}
              </p>
            </div>
          </div>
          <button onClick={onClose} className="rounded-full p-1 text-stone-400 hover:bg-stone-100">✕</button>
        </div>

        {/* Corps */}
        <div className="flex flex-col gap-5 p-5">
          {/* Statuts */}
          <div className="flex flex-wrap gap-2">
            <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${VERIFICATION_BADGE[worker.verificationStatus] ?? 'bg-stone-100 text-stone-500'}`}>
              {VERIFICATION_LABEL[worker.verificationStatus] ?? worker.verificationStatus}
            </span>
            {worker.isSuspended && (
              <span className="rounded-full bg-red-100 px-2.5 py-1 text-xs font-semibold text-red-700">Suspendu</span>
            )}
            {worker.isAvailable && !worker.isSuspended && (
              <span className="rounded-full bg-green-100 px-2.5 py-1 text-xs font-semibold text-green-700">Disponible</span>
            )}
            {worker.note > 0 && (
              <span className="rounded-full bg-amber-50 px-2.5 py-1 text-xs font-semibold text-amber-700">
                ★ {worker.note} ({worker.avis} avis)
              </span>
            )}
          </div>

          {/* Contact */}
          <div className="rounded-lg border border-stone-100 bg-stone-50 p-3 text-sm">
            <p className="text-stone-600">{worker.email}</p>
            <p className="text-stone-600">{worker.telephone}</p>
            {worker.languages?.length > 0 && (
              <p className="mt-1 text-xs text-stone-400">{worker.languages.join(' · ')}</p>
            )}
          </div>

          {/* Description */}
          {worker.description && (
            <div>
              <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-stone-400">Description</p>
              <p className="text-sm text-stone-700">{worker.description}</p>
            </div>
          )}

          {/* Documents */}
          <div>
            <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-stone-400">Documents</p>
            <div className="grid grid-cols-2 gap-2">
              {[
                { label: 'Photo de profil',  key: 'photoProfil',        optional: true },
                { label: 'CNI recto',        key: 'pieceIdentiteRecto', optional: false },
                { label: 'CNI verso',        key: 'pieceIdentiteVerso', optional: false },
                { label: 'Certificat',       key: 'certificat',         optional: true },
              ].map(({ label, key, optional }) => (
                <div key={key} className={`rounded-lg border p-2 text-xs ${
                  worker[key] ? 'border-green-200 bg-green-50'
                  : optional ? 'border-stone-100 bg-stone-50 text-stone-400'
                  : 'border-red-100 bg-red-50 text-red-500'
                }`}>
                  <p className="font-medium">{label}</p>
                  <p className="mt-0.5 truncate text-stone-500">
                    {worker[key] ? worker[key].split('/').pop() : optional ? 'Non fourni' : 'Manquant'}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* Motif admin existant */}
          {(worker.rejectionReason || worker.suspensionReason) && (
            <div className="rounded-lg border border-red-100 bg-red-50 p-3">
              <p className="text-xs font-semibold text-red-600">
                {worker.isSuspended ? 'Motif de suspension' : 'Motif de rejet'}
              </p>
              <p className="mt-1 text-sm text-red-700">
                {worker.suspensionReason ?? worker.rejectionReason}
              </p>
            </div>
          )}

          {/* Actions */}
          <div className="border-t border-stone-100 pt-4">
            <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-stone-400">
              Actions administrateur
            </p>

            {action && (
              <ReasonForm
                label={action === 'reject'
                  ? "Motif du rejet (visible par l'ouvrier)"
                  : "Motif de la suspension (visible par l'ouvrier)"}
                placeholder={action === 'reject'
                  ? "Ex : Documents non conformes, pièce d'identité illisible…"
                  : "Ex : Signalement client, comportement inapproprié…"}
                loading={loading}
                onConfirm={action === 'reject' ? handleReject : handleSuspend}
                onCancel={() => setAction(null)}
              />
            )}

            {!action && (
              <div className="flex flex-wrap gap-2">
                {(worker.verificationStatus === 'PENDING' || worker.verificationStatus === 'REJECTED') && (
                  <button onClick={handleApprove} disabled={loading}
                    className="rounded-lg bg-green-600 px-4 py-2 text-sm font-medium text-white hover:bg-green-700 disabled:opacity-50">
                    Approuver le dossier
                  </button>
                )}
                {worker.verificationStatus === 'PENDING' && (
                  <button onClick={() => setAction('reject')}
                    className="rounded-lg border border-red-300 px-4 py-2 text-sm font-medium text-red-600 hover:bg-red-50">
                    Rejeter le dossier
                  </button>
                )}
                {worker.verificationStatus === 'APPROVED' && !worker.isSuspended && (
                  <button onClick={() => setAction('suspend')}
                    className="rounded-lg border border-red-300 px-4 py-2 text-sm font-medium text-red-600 hover:bg-red-50">
                    Suspendre le compte
                  </button>
                )}
                {worker.isSuspended && (
                  <button onClick={handleUnsuspend} disabled={loading}
                    className="rounded-lg bg-primary-600 px-4 py-2 text-sm font-medium text-white hover:bg-primary-700 disabled:opacity-50">
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

// ─── Dashboard principal ──────────────────────────────────────────────────────

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

const MAIN_TABS = [
  { key: 'ouvriers', label: 'Ouvriers' },
  { key: 'clients',  label: 'Clients' },
  { key: 'demandes', label: 'Demandes' },
]

export default function AdminDashboard() {
  const [workers, setWorkers]   = useState([])
  const [clients, setClients]   = useState([])
  const [requests, setRequests] = useState([])

  const [selectedWorker, setSelectedWorker] = useState(null)
  const [selectedClient, setSelectedClient] = useState(null)

  const [mainTab, setMainTab]       = useState('ouvriers')
  const [workerTab, setWorkerTab]   = useState('all')
  const [clientTab, setClientTab]   = useState('all')

  useEffect(() => {
    workerService.getAllWorkers().then(setWorkers).catch(console.error)
    clientService.getAllClients().then(setClients).catch(console.error)
    requestService.getAllRequests().then(setRequests).catch(console.error)
  }, [])

  const handleWorkerUpdate = (updated) => {
    setWorkers((prev) => prev.map((w) => (w.id === updated.id ? updated : w)))
    setSelectedWorker(updated)
  }

  const handleClientUpdate = (updated) => {
    setClients((prev) => prev.map((c) => (c.id === updated.id ? updated : c)))
    setSelectedClient(updated)
  }

  const pendingWorkers  = workers.filter((w) => w.verificationStatus === 'PENDING')
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

  const stats = [
    { label: 'Clients actifs',   value: clients.filter((c) => !c.isSuspended).length,  alert: false },
    { label: 'Ouvriers actifs',  value: workers.filter((w) => !w.isSuspended && w.verificationStatus === 'APPROVED').length, alert: false },
    { label: 'Dossiers en attente', value: pendingWorkers.length,   alert: pendingWorkers.length > 0 },
    { label: 'Missions en cours', value: requests.filter((r) => r.status === 'IN_PROGRESS' || r.status === 'SELECTED').length, alert: false },
  ]

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-lg font-bold text-stone-900">Tableau de bord administrateur</h1>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        {stats.map((s) => (
          <div key={s.label} className="rounded-xl border border-stone-200 bg-white p-4 text-center">
            <p className={`text-2xl font-bold ${s.alert ? 'text-yellow-600' : 'text-primary-600'}`}>
              {s.value}
            </p>
            <p className="text-xs text-stone-500">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Alertes prioritaires */}
      {(pendingWorkers.length > 0 || suspendedClients.length > 0) && (
        <div className="flex flex-col gap-3">
          {/* Dossiers ouvriers en attente */}
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
        </div>
      )}

      {/* Navigation principale */}
      <div className="flex gap-1 rounded-xl border border-stone-200 bg-stone-50 p-1">
        {MAIN_TABS.map((tab) => {
          const badge =
            tab.key === 'ouvriers' ? pendingWorkers.length
            : tab.key === 'clients' ? suspendedClients.length
            : 0
          return (
            <button
              key={tab.key}
              onClick={() => setMainTab(tab.key)}
              className={`flex flex-1 items-center justify-center gap-1.5 rounded-lg py-2.5 text-sm font-semibold transition ${
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

      {/* ── Onglet OUVRIERS ──────────────────────────────────────────────────── */}
      {mainTab === 'ouvriers' && (
        <section className="rounded-xl border border-stone-200 bg-white p-5">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <h2 className="font-semibold text-stone-900">Ouvriers ({filteredWorkers.length})</h2>
            <div className="flex flex-wrap gap-1">
              {WORKER_TABS.map((tab) => {
                const count =
                  tab.key === 'all'       ? workers.length
                  : tab.key === 'suspended' ? workers.filter((w) => w.isSuspended).length
                  : workers.filter((w) => w.verificationStatus === tab.key).length
                return (
                  <button key={tab.key} onClick={() => setWorkerTab(tab.key)}
                    className={`rounded-full px-3 py-1 text-xs font-medium transition ${
                      workerTab === tab.key ? 'bg-primary-600 text-white' : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
                    }`}>
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
                        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary-100 text-sm font-bold text-primary-700">
                          {w.nom.charAt(0)}
                        </div>
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
                      <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                        w.isSuspended ? 'bg-red-100 text-red-700' : w.isAvailable ? 'bg-green-100 text-green-700' : 'bg-stone-100 text-stone-500'
                      }`}>
                        {w.isSuspended ? 'Suspendu' : w.isAvailable ? 'Disponible' : 'Indisponible'}
                      </span>
                    </td>
                    <td className="py-3 pr-4 text-stone-600">
                      {w.note > 0 ? `★ ${w.note}` : '—'}
                      {w.avis > 0 && <span className="ml-1 text-xs text-stone-400">({w.avis})</span>}
                    </td>
                    <td className="py-3">
                      <button onClick={() => setSelectedWorker(w)}
                        className="rounded-lg border border-stone-300 px-3 py-1 text-xs font-medium text-stone-700 hover:border-primary-400 hover:text-primary-700">
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

      {/* ── Onglet CLIENTS ───────────────────────────────────────────────────── */}
      {mainTab === 'clients' && (
        <section className="rounded-xl border border-stone-200 bg-white p-5">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <h2 className="font-semibold text-stone-900">Clients ({filteredClients.length})</h2>
            <div className="flex gap-1">
              {CLIENT_TABS.map((tab) => {
                const count = tab.key === 'all' ? clients.length : suspendedClients.length
                return (
                  <button key={tab.key} onClick={() => setClientTab(tab.key)}
                    className={`rounded-full px-3 py-1 text-xs font-medium transition ${
                      clientTab === tab.key ? 'bg-primary-600 text-white' : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
                    }`}>
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
                        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary-100 text-sm font-bold text-primary-700">
                          {c.nom.charAt(0)}
                        </div>
                        <div>
                          <p className="font-medium text-stone-900">{c.nom}</p>
                          <p className="text-xs text-stone-400">{c.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="py-3 pr-4 text-stone-500">{c.ville ?? '—'}</td>
                    <td className="py-3 pr-4">
                      <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                        c.isSuspended ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'
                      }`}>
                        {c.isSuspended ? 'Suspendu' : 'Actif'}
                      </span>
                    </td>
                    <td className="py-3 pr-4 text-xs text-stone-400">
                      {c.createdAt ? new Date(c.createdAt).toLocaleDateString('fr-FR') : '—'}
                    </td>
                    <td className="py-3">
                      <button onClick={() => setSelectedClient(c)}
                        className="rounded-lg border border-stone-300 px-3 py-1 text-xs font-medium text-stone-700 hover:border-primary-400 hover:text-primary-700">
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

      {/* ── Onglet DEMANDES ──────────────────────────────────────────────────── */}
      {mainTab === 'demandes' && (
        <section className="rounded-xl border border-stone-200 bg-white p-5">
          <h2 className="mb-3 font-semibold text-stone-900">
            Demandes récentes ({requests.length})
          </h2>
          {requests.length === 0 && <p className="text-sm text-stone-400">Aucune demande.</p>}
          <ul className="flex flex-col gap-2">
            {requests.slice(0, 20).map((r) => (
              <li key={r.id} className="flex items-center justify-between rounded-lg bg-stone-50 px-3 py-2 text-sm">
                <span className="text-stone-700">{r.metier} · {r.ville}</span>
                <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                  r.status === 'IN_PROGRESS' || r.status === 'SELECTED' ? 'bg-primary-100 text-primary-700'
                  : r.status === 'CLOSED'   ? 'bg-green-100 text-green-700'
                  : r.status === 'OPEN'     ? 'bg-yellow-100 text-yellow-700'
                  : 'bg-stone-100 text-stone-500'
                }`}>
                  {r.status}
                </span>
              </li>
            ))}
          </ul>
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
