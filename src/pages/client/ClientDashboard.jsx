import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { requestService } from '../../services/request.service'
import { missionService } from '../../services/mission.service'
import api from '../../services/api'

const STATUS_LABEL = {
  OPEN:           { texte: 'Ouverte',             classe: 'bg-yellow-100 text-yellow-700' },
  PROPOSALS_SENT: { texte: 'Propositions reçues', classe: 'bg-blue-100 text-blue-700' },
  SELECTED:       { texte: 'Ouvrier confirmé',    classe: 'bg-primary-100 text-primary-700' },
  IN_PROGRESS:    { texte: 'En cours',            classe: 'bg-primary-100 text-primary-700' },
  CLOSED:         { texte: 'Terminée',            classe: 'bg-green-100 text-green-700' },
  CANCELLED:      { texte: 'Annulée',             classe: 'bg-red-100 text-red-700' },
}

const ACTIVE_STATUSES = ['OPEN', 'PROPOSALS_SENT', 'SELECTED', 'IN_PROGRESS']

export default function ClientDashboard() {
  const { user } = useAuth()
  const navigate = useNavigate()

  const [requests, setRequests]   = useState([])
  const [missions, setMissions]   = useState([])
  const [proposals, setProposals] = useState([])
  const [loading, setLoading]     = useState(true)

  useEffect(() => {
    if (!user?.id) return
    Promise.all([
      requestService.getRequestsByClient(user.id),
      missionService.getMissionsByClient(user.id),
      api.get('/proposals').then((r) => r.data),
    ])
      .then(([reqs, ms, props]) => {
        setRequests(reqs)
        setMissions(ms)
        // Garder uniquement les propositions liées aux demandes du client
        const reqIds = new Set(reqs.map((r) => r.id))
        setProposals(props.filter((p) => reqIds.has(p.requestId) && p.status === 'PENDING'))
      })
      .catch((err) => console.error('[ClientDashboard]', err))
      .finally(() => setLoading(false))
  }, [user?.id])

  // ── Statistiques ──────────────────────────────────────────────────────────
  const total      = requests.length
  const actives    = requests.filter((r) => ACTIVE_STATUSES.includes(r.status)).length
  const terminees  = requests.filter((r) => r.status === 'CLOSED').length
  const propositionsEnAttente = proposals.length

  const stats = [
    { label: 'Demandes totales',     value: total,                  color: 'text-stone-800',    bg: 'bg-stone-50' },
    { label: 'En cours',             value: actives,                color: 'text-primary-700',  bg: 'bg-primary-50' },
    { label: 'Propositions reçues',  value: propositionsEnAttente,  color: 'text-blue-700',     bg: 'bg-blue-50' },
    { label: 'Terminées',            value: terminees,              color: 'text-green-700',    bg: 'bg-green-50' },
  ]

  // ── Demandes récentes (5 dernières) ──────────────────────────────────────
  const recent = [...requests]
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
    .slice(0, 5)

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
          onClick={() => navigate('/nouvelle-demande')}
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
              onClick={() => navigate('/nouvelle-demande')}
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
      {terminees > 0 && (
        <section className="rounded-xl border border-stone-200 bg-white p-5">
          <h2 className="mb-1 font-semibold text-stone-900">Missions terminées</h2>
          <p className="text-sm text-stone-500">
            {terminees} mission{terminees > 1 ? 's' : ''} complétée{terminees > 1 ? 's' : ''} avec succès.
          </p>
        </section>
      )}
    </div>
  )
}
