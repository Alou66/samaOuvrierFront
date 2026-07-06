import { useEffect, useState } from 'react'
import { proposalService } from '../services/proposal.service'
import { requestService } from '../services/request.service'
import { workerService } from '../services/worker.service'
import { formatDuration, formatPrice } from '../utils/format'
import Stars from './Stars'
import Avatar from './Avatar'

const BADGE = {
  PENDING:   'bg-yellow-100 text-yellow-700',
  ACCEPTED:  'bg-green-100 text-green-700',
  REJECTED:  'bg-stone-100 text-stone-400 line-through',
  EXPIRED:   'bg-stone-100 text-stone-400',
  WITHDRAWN: 'bg-stone-100 text-stone-400 line-through',
}
const LABEL = {
  PENDING:   'En attente',
  ACCEPTED:  'Acceptée',
  REJECTED:  'Refusée',
  EXPIRED:   'Expirée',
  WITHDRAWN: 'Retirée',
}

function sortProposals(proposals) {
  return [...proposals].sort((a, b) => {
    if (a.status === 'ACCEPTED' && b.status !== 'ACCEPTED') return -1
    if (b.status === 'ACCEPTED' && a.status !== 'ACCEPTED') return 1
    if (a.status === 'REJECTED' && b.status !== 'REJECTED') return 1
    if (b.status === 'REJECTED' && a.status !== 'REJECTED') return -1
    const noteDiff = (b.workerNote ?? 0) - (a.workerNote ?? 0)
    if (noteDiff !== 0) return noteDiff
    return (a.price ?? 0) - (b.price ?? 0)
  })
}

// ─── Modal profil ouvrier ─────────────────────────────────────────────────────

function WorkerProfileModal({ worker, onClose }) {
  if (!worker) return null
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
            <Avatar
              src={worker.photoProfil}
              name={worker.nom}
              className="h-12 w-12 bg-primary-100 text-xl text-primary-600"
            />
            <div>
              <h2 className="font-bold text-stone-900">{worker.nom}</h2>
              <p className="text-sm text-stone-500">
                {worker.metier} · {worker.ville}
              </p>
            </div>
          </div>
          <button onClick={onClose} className="rounded-full p-1 text-stone-400 hover:bg-stone-100">✕</button>
        </div>

        <div className="flex flex-col gap-4 p-5">
          {/* Note */}
          {worker.note > 0 && (
            <div className="flex items-center gap-2">
              <Stars note={worker.note} size="text-base" />
              <span className="text-sm font-semibold text-stone-800">{worker.note}</span>
              <span className="text-sm text-stone-400">({worker.avis} avis)</span>
            </div>
          )}

          {/* Badges */}
          <div className="flex flex-wrap gap-2">
            {worker.yearsOfExperience && (
              <span className="rounded-full bg-stone-100 px-2.5 py-1 text-xs font-medium text-stone-600">
                {worker.yearsOfExperience} ans d'expérience
              </span>
            )}
            {worker.isAvailable && (
              <span className="rounded-full bg-green-100 px-2.5 py-1 text-xs font-medium text-green-700">
                Disponible
              </span>
            )}
            {worker.languages?.map((l) => (
              <span key={l} className="rounded-full bg-primary-50 px-2.5 py-1 text-xs font-medium text-primary-700">
                {l}
              </span>
            ))}
          </div>

          {/* Description */}
          {worker.description && (
            <div>
              <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-stone-400">À propos</p>
              <p className="text-sm text-stone-700">{worker.description}</p>
            </div>
          )}

          {/* Contact */}
          <div className="rounded-lg border border-stone-100 bg-stone-50 p-3 text-sm text-stone-600">
            <p>{worker.telephone}</p>
          </div>
        </div>
      </div>
    </div>
  )
}

// ─── Liste des propositions ───────────────────────────────────────────────────

export default function ProposalsList({ requestId, clientId, requestStatus, requestMetier, requestVille, onProposalAccepted }) {
  const [proposals,      setProposals]      = useState([])
  const [accepting,      setAccepting]      = useState(false)
  const [viewWorker,     setViewWorker]     = useState(null)  // objet worker complet
  const [loadingProfile, setLoadingProfile] = useState(null)  // workerId en cours de chargement

  useEffect(() => {
    if (!requestId) return
    proposalService
      .getProposalsByRequest(requestId)
      .then(setProposals)
      .catch((err) => console.error('[ProposalsList] Erreur chargement:', err))
  }, [requestId])

  const voirProfil = async (workerId) => {
    setLoadingProfile(workerId)
    try {
      const worker = await workerService.getWorkerById(workerId)
      setViewWorker(worker)
    } catch (err) {
      console.error('[ProposalsList] Erreur chargement profil:', err)
    } finally {
      setLoadingProfile(null)
    }
  }

  const handleAccept = async (proposal) => {
    if (accepting) return
    setAccepting(true)
    try {
      // acceptProposal crée la mission côté backend — pas d'appel supplémentaire nécessaire
      await proposalService.acceptProposal(proposal.id)
      const autres = proposals.filter((p) => p.id !== proposal.id)
      await Promise.all(autres.map((p) => proposalService.rejectProposal(p.id)))
      setProposals((prev) =>
        prev.map((p) => ({ ...p, status: p.id === proposal.id ? 'ACCEPTED' : 'REJECTED' }))
      )
      onProposalAccepted?.()
    } catch (err) {
      console.error('[ProposalsList] Erreur acceptation:', err)
    } finally {
      setAccepting(false)
    }
  }

  const handleReject = async (proposalId) => {
    try {
      await proposalService.rejectProposal(proposalId)
      setProposals((prev) =>
        prev.map((p) => (p.id === proposalId ? { ...p, status: 'REJECTED' } : p))
      )
    } catch (err) {
      console.error('[ProposalsList] Erreur refus:', err)
    }
  }

  if (proposals.length === 0) return null

  const peutRepondre = !['SELECTED', 'IN_PROGRESS', 'CLOSED', 'CANCELLED'].includes(requestStatus)
  const sorted = sortProposals(proposals)

  return (
    <>
      <div className="mt-3 border-t border-stone-100 pt-3">
        <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-stone-400">
          {proposals.length} proposition{proposals.length > 1 ? 's' : ''} reçue{proposals.length > 1 ? 's' : ''}
        </p>

        <ul className="flex flex-col gap-2">
          {sorted.map((p) => (
            <li
              key={p.id}
              className={`rounded-lg border p-3 ${
                p.status === 'ACCEPTED'
                  ? 'border-green-200 bg-green-50'
                  : p.status === 'REJECTED' || p.status === 'EXPIRED'
                    ? 'border-stone-100 bg-stone-50 opacity-60'
                    : 'border-stone-100 bg-sand-50'
              }`}
            >
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <p className="text-sm font-medium text-stone-800">{p.workerNom}</p>
                  {/* Lien "Voir le profil" */}
                  {p.workerId && (p.status === 'PENDING' || p.status === 'ACCEPTED') && (
                    <button
                      onClick={() => voirProfil(p.workerId)}
                      disabled={loadingProfile === p.workerId}
                      className="mt-0.5 text-xs text-primary-600 hover:underline disabled:opacity-50"
                    >
                      {loadingProfile === p.workerId ? 'Chargement…' : 'Voir le profil →'}
                    </button>
                  )}
                </div>
                <span className={`shrink-0 rounded-full px-2 py-0.5 text-xs font-medium ${BADGE[p.status] ?? 'bg-stone-100 text-stone-500'}`}>
                  {LABEL[p.status] ?? p.status}
                </span>
              </div>

              {/* Métriques */}
              <div className="mt-2 grid grid-cols-3 gap-2 text-center">
                <div className="rounded-md bg-white px-2 py-1.5 shadow-sm">
                  <p className="text-xs text-stone-400">Prix</p>
                  <p className="text-sm font-semibold text-stone-900">{formatPrice(p.price)}</p>
                </div>
                <div className="rounded-md bg-white px-2 py-1.5 shadow-sm">
                  <p className="text-xs text-stone-400">Durée</p>
                  <p className="text-sm font-semibold text-stone-900">{formatDuration(p.estimatedDurationMinutes)}</p>
                </div>
                <div className="rounded-md bg-white px-2 py-1.5 shadow-sm">
                  <p className="text-xs text-stone-400">Note</p>
                  {p.workerNote ? (
                    <div className="flex items-center justify-center gap-0.5">
                      <Stars note={p.workerNote} size="text-xs" />
                      <span className="text-xs font-medium text-stone-700">{p.workerNote}</span>
                    </div>
                  ) : (
                    <p className="text-xs text-stone-400">—</p>
                  )}
                </div>
              </div>

              {p.message && <p className="mt-2 text-sm text-stone-600">{p.message}</p>}

              {p.status === 'PENDING' && peutRepondre && (
                <div className="mt-2 flex gap-2">
                  <button
                    onClick={() => handleAccept(p)}
                    disabled={accepting}
                    className="rounded-lg bg-primary-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-primary-700 disabled:opacity-60"
                  >
                    Choisir cette proposition
                  </button>
                  <button
                    onClick={() => handleReject(p.id)}
                    disabled={accepting}
                    className="rounded-lg border border-stone-300 px-3 py-1.5 text-xs font-medium text-stone-600 hover:bg-white disabled:opacity-60"
                  >
                    Refuser
                  </button>
                </div>
              )}
            </li>
          ))}
        </ul>
      </div>

      {/* Modal profil ouvrier */}
      {viewWorker && (
        <WorkerProfileModal worker={viewWorker} onClose={() => setViewWorker(null)} />
      )}
    </>
  )
}
