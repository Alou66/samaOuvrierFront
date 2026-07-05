import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { useNewRequestModal } from '../../context/NewRequestModalContext'
import { requestService } from '../../services/request.service'
import { missionService } from '../../services/mission.service'
import { formatPrice, formatDuration } from '../../utils/format'

const STATUS_LABEL = {
  OPEN:           { texte: 'Ouverte',             classe: 'bg-yellow-100 text-yellow-700' },
  PROPOSALS_SENT: { texte: 'Propositions reçues', classe: 'bg-blue-100 text-blue-700' },
  SELECTED:       { texte: 'Ouvrier confirmé',    classe: 'bg-primary-100 text-primary-700' },
  IN_PROGRESS:    { texte: 'En cours',            classe: 'bg-primary-100 text-primary-700' },
  CLOSED:         { texte: 'Terminée',            classe: 'bg-green-100 text-green-700' },
  CANCELLED:      { texte: 'Annulée',             classe: 'bg-red-100 text-red-700' },
}

const ACTIVE_STATUSES = ['OPEN', 'PROPOSALS_SENT', 'SELECTED', 'IN_PROGRESS']

// ── Ligne de détail mission ───────────────────────────────────────────────────

function DetailRow({ label, value }) {
  if (!value) return null
  return (
    <div className="flex items-baseline justify-between gap-4 py-1.5 text-sm">
      <span className="text-stone-400">{label}</span>
      <span className="text-right font-medium text-stone-900">{value}</span>
    </div>
  )
}

// ── Modal détail mission ──────────────────────────────────────────────────────

function MissionDetailModal({ mission, request, onClose }) {
  if (!mission) return null
  const fmt = (iso) => iso ? new Date(iso).toLocaleDateString('fr-FR') : null
  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 p-4 sm:items-center"
      onClick={onClose}
    >
      <div
        className="w-full max-w-sm rounded-2xl bg-white"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-stone-100 px-5 py-4">
          <h2 className="font-bold text-stone-900">Détail de la mission</h2>
          <button
            onClick={onClose}
            className="rounded-full p-1 text-stone-400 hover:bg-stone-100"
          >
            ✕
          </button>
        </div>
        <div className="divide-y divide-stone-50 px-5 py-3">
          {request && (
            <>
              <DetailRow label="Métier"  value={request.metier} />
              <DetailRow label="Ville"   value={request.ville}  />
              <DetailRow label="Adresse" value={request.adresse} />
            </>
          )}
          <DetailRow label="Ouvrier"    value={mission.workerNom} />
          <DetailRow label="Prix"       value={mission.price ? formatPrice(mission.price) : null} />
          <DetailRow label="Durée"      value={mission.estimatedDurationMinutes ? formatDuration(mission.estimatedDurationMinutes) : null} />
          <DetailRow label="Acceptée"   value={fmt(mission.acceptedAt)} />
          <DetailRow label="Démarrée"   value={fmt(mission.startedAt)} />
          <DetailRow label="Terminée"   value={fmt(mission.completedAt)} />
          {mission.cancelledAt && (
            <DetailRow label="Annulée"  value={fmt(mission.cancelledAt)} />
          )}
        </div>
        <div className="px-5 pb-5">
          <button
            onClick={onClose}
            className="w-full rounded-xl border border-stone-200 py-2.5 text-sm font-medium text-stone-700 hover:bg-stone-50"
          >
            Fermer
          </button>
        </div>
      </div>
    </div>
  )
}

// ── Dashboard principal ───────────────────────────────────────────────────────

export default function ClientDashboard() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const { openNewRequestModal } = useNewRequestModal()

  const [requests,      setRequests]      = useState([])
  const [missions,      setMissions]      = useState([])
  const [loading,       setLoading]       = useState(true)
  const [missionDetail, setMissionDetail] = useState(null)

  useEffect(() => {
    if (!user?.id) return
    Promise.all([
      requestService.getMyRequests(),
      missionService.getMissionsByClient(),
    ])
      .then(([reqs, ms]) => {
        setRequests(reqs)
        setMissions(ms)
      })
      .catch((err) => console.error('[ClientDashboard]', err))
      .finally(() => setLoading(false))
  }, [user?.id])

  // ── Statistiques ──────────────────────────────────────────────────────────
  const total                 = requests.length
  const actives               = requests.filter((r) => ACTIVE_STATUSES.includes(r.status)).length
  const terminees             = missions.filter((m) => m.status === 'COMPLETED').length
  const propositionsEnAttente = requests.filter((r) => r.status === 'PROPOSALS_SENT').length

  const stats = [
    { label: 'Demandes totales',    value: total,                 color: 'text-stone-800',   bg: 'bg-stone-50' },
    { label: 'En cours',            value: actives,               color: 'text-primary-700', bg: 'bg-primary-50' },
    { label: 'Propositions reçues', value: propositionsEnAttente, color: 'text-blue-700',    bg: 'bg-blue-50' },
    { label: 'Terminées',           value: terminees,             color: 'text-green-700',   bg: 'bg-green-50' },
  ]

  // ── Demandes récentes (5 dernières) ──────────────────────────────────────
  const recent = [...requests]
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
    .slice(0, 5)

  // ── Lookup rapide demande par id pour le modal mission ────────────────────
  const requestsById = Object.fromEntries(requests.map((r) => [r.id, r]))

  // ── Missions terminées ────────────────────────────────────────────────────
  const completedMissions = missions.filter((m) => m.status === 'COMPLETED')

  const handleMissionDetail = async (id) => {
    try {
      const detail = await missionService.getMissionById(id)
      setMissionDetail(detail)
    } catch (err) {
      console.error('[ClientDashboard] Erreur détail mission:', err)
    }
  }

  if (loading) {
    return (
      <div className="flex flex-col gap-4">
        <div className="h-7 w-48 animate-pulse rounded-lg bg-stone-200" />
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          {[0, 1, 2, 3].map((i) => (
            <div key={i} className="h-20 animate-pulse rounded-xl bg-stone-100" />
          ))}
        </div>
      </div>
    )
  }

  return (
    <>
      <div className="flex flex-col gap-6">

        {/* Salutation */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-xl font-bold text-stone-900">
              Bonjour, {user?.nom?.split(' ')[0]} 👋
            </h1>
            <p className="text-sm text-stone-500">Voici un résumé de votre activité.</p>
          </div>
          <button
            onClick={openNewRequestModal}
            className="rounded-xl bg-primary-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-primary-700"
          >
            + Nouvelle demande
          </button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {stats.map((s) => (
            <div
              key={s.label}
              className={`flex flex-col items-center justify-center rounded-xl border border-stone-200 p-4 text-center ${s.bg}`}
            >
              <p className={`text-3xl font-bold ${s.color}`}>{s.value}</p>
              <p className="mt-1 text-xs text-stone-500">{s.label}</p>
            </div>
          ))}
        </div>

        {/* Missions actives */}
        {actives > 0 && (
          <section className="rounded-xl border-2 border-primary-200 bg-primary-50 p-4">
            <h2 className="mb-2 font-semibold text-primary-900">
              {actives} demande{actives > 1 ? 's' : ''} en cours
            </h2>
            <p className="text-sm text-primary-700">
              {propositionsEnAttente > 0
                ? `Vous avez ${propositionsEnAttente} proposition${propositionsEnAttente > 1 ? 's' : ''} en attente de réponse.`
                : 'Consultez vos demandes pour voir l\'avancement.'}
            </p>
            <button
              onClick={() => navigate('/demandes')}
              className="mt-3 rounded-lg bg-primary-600 px-4 py-2 text-sm font-semibold text-white hover:bg-primary-700"
            >
              Voir mes demandes →
            </button>
          </section>
        )}

        {/* Demandes récentes */}
        <section className="rounded-xl border border-stone-200 bg-white p-5">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="font-semibold text-stone-900">Demandes récentes</h2>
            {requests.length > 5 && (
              <button
                onClick={() => navigate('/demandes')}
                className="text-sm font-medium text-primary-600 hover:underline"
              >
                Voir tout
              </button>
            )}
          </div>

          {recent.length === 0 ? (
            <div className="rounded-xl border border-dashed border-stone-200 py-10 text-center">
              <p className="text-sm text-stone-500">Aucune demande pour le moment.</p>
              <button
                onClick={openNewRequestModal}
                className="mt-3 rounded-lg bg-primary-600 px-4 py-2 text-sm font-semibold text-white hover:bg-primary-700"
              >
                Faire ma première demande
              </button>
            </div>
          ) : (
            <ul className="flex flex-col divide-y divide-stone-50">
              {recent.map((r) => {
                const cfg = STATUS_LABEL[r.status] ?? { texte: r.status, classe: 'bg-stone-100 text-stone-500' }
                return (
                  <li
                    key={r.id}
                    onClick={() => navigate('/demandes')}
                    className="flex cursor-pointer items-center justify-between gap-3 py-3 hover:opacity-75"
                  >
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium text-stone-900">{r.metier}</p>
                      <p className="truncate text-xs text-stone-400">
                        {r.adresse ?? r.ville} · {new Date(r.createdAt).toLocaleDateString('fr-FR')}
                      </p>
                    </div>
                    <span className={`shrink-0 rounded-full px-2.5 py-0.5 text-xs font-medium ${cfg.classe}`}>
                      {cfg.texte}
                    </span>
                  </li>
                )
              })}
            </ul>
          )}
        </section>

        {/* Missions terminées */}
        {completedMissions.length > 0 && (
          <section className="rounded-xl border border-stone-200 bg-white p-5">
            <h2 className="mb-3 font-semibold text-stone-900">
              Missions terminées ({completedMissions.length})
            </h2>
            <ul className="flex flex-col divide-y divide-stone-50">
              {completedMissions.map((m) => {
                const req = requestsById[m.requestId]
                return (
                  <li key={m.id} className="flex items-center justify-between gap-3 py-3">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium text-stone-900">
                        {req?.metier ?? '—'} · {req?.ville ?? '—'}
                      </p>
                      <p className="text-xs text-stone-400">
                        Ouvrier : {m.workerNom ?? '—'} ·{' '}
                        {m.completedAt ? new Date(m.completedAt).toLocaleDateString('fr-FR') : '—'}
                      </p>
                    </div>
                    <button
                      onClick={() => handleMissionDetail(m.id)}
                      className="shrink-0 rounded-lg border border-stone-200 px-3 py-1.5 text-xs font-medium text-stone-600 hover:border-primary-400 hover:text-primary-700"
                    >
                      Voir détail
                    </button>
                  </li>
                )
              })}
            </ul>
          </section>
        )}
      </div>

      {/* Modal détail mission */}
      {missionDetail && (
        <MissionDetailModal
          mission={missionDetail}
          request={requestsById[missionDetail.requestId]}
          onClose={() => setMissionDetail(null)}
        />
      )}
    </>
  )
}
