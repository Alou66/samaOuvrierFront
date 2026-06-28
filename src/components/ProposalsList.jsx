import { useEffect, useState } from 'react'
import { proposalService } from '../services/proposal.service'
import { requestService } from '../services/request.service'
import { missionService } from '../services/mission.service'
import { formatDuration, formatPrice } from '../utils/format'
import Stars from './Stars'

// Statuts proposal : PENDING | ACCEPTED | REJECTED | EXPIRED
const BADGE = {
  PENDING:  'bg-yellow-100 text-yellow-700',
  ACCEPTED: 'bg-green-100 text-green-700',
  REJECTED: 'bg-stone-100 text-stone-400 line-through',
  EXPIRED:  'bg-stone-100 text-stone-400',
}

const LABEL = {
  PENDING:  'En attente',
  ACCEPTED: 'Acceptée',
  REJECTED: 'Refusée',
  EXPIRED:  'Expirée',
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

/**
 * @param {number}   requestId
 * @param {number}   clientId        — requis pour créer la Mission
 * @param {string}   requestStatus   — statut actuel de la Request
 * @param {Function} onProposalAccepted — callback après acceptation
 */
export default function ProposalsList({ requestId, clientId, requestStatus, onProposalAccepted }) {
  const [proposals, setProposals] = useState([])
  const [accepting, setAccepting] = useState(false)

  useEffect(() => {
    if (!requestId) return
    proposalService
      .getProposalsByRequest(requestId)
      .then(setProposals)
      .catch((err) => console.error('[ProposalsList] Erreur chargement:', err))
  }, [requestId])

  const handleAccept = async (proposal) => {
    if (accepting) return
    setAccepting(true)
    try {
      // 1. Accepter la proposition sélectionnée
      await proposalService.acceptProposal(proposal.id)

      // 2. Créer la Mission (statut PENDING — le worker la démarrera)
      await missionService.createMission({
        requestId,
        proposalId: proposal.id,
        clientId,
        workerId: proposal.workerId,
      })

      // 3. Passer la Request en SELECTED (mission créée, pas encore démarrée)
      await requestService.updateRequestStatus(requestId, 'SELECTED')

      // 4. Rejeter les autres propositions
      const autres = proposals.filter((p) => p.id !== proposal.id)
      await Promise.all(autres.map((p) => proposalService.rejectProposal(p.id)))

      setProposals((prev) =>
        prev.map((p) => ({
          ...p,
          status: p.id === proposal.id ? 'ACCEPTED' : 'REJECTED',
        }))
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
    <div className="mt-3 border-t border-stone-100 pt-3">
      <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-stone-400">
        {proposals.length} proposition{proposals.length > 1 ? 's' : ''} reçue
        {proposals.length > 1 ? 's' : ''}
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
              <p className="text-sm font-medium text-stone-800">{p.workerNom}</p>
              <span
                className={`shrink-0 rounded-full px-2 py-0.5 text-xs font-medium ${
                  BADGE[p.status] ?? 'bg-stone-100 text-stone-500'
                }`}
              >
                {LABEL[p.status] ?? p.status}
              </span>
            </div>

            {/* Métriques de comparaison */}
            <div className="mt-2 grid grid-cols-3 gap-2 text-center">
              <div className="rounded-md bg-white px-2 py-1.5 shadow-sm">
                <p className="text-xs text-stone-400">Prix</p>
                <p className="text-sm font-semibold text-stone-900">{formatPrice(p.price)}</p>
              </div>
              <div className="rounded-md bg-white px-2 py-1.5 shadow-sm">
                <p className="text-xs text-stone-400">Durée</p>
                <p className="text-sm font-semibold text-stone-900">
                  {formatDuration(p.estimatedDurationMinutes)}
                </p>
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
  )
}
