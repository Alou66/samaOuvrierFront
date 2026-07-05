import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { requestService } from '../services/request.service'
import { villeService } from '../services/ville.service'
import { metierService } from '../services/metier.service'
import { CheckIcon } from './Icons'
import LoginForm from './LoginForm'
import RegisterForm from './RegisterForm'
import VilleSelect from './VilleSelect'

// ─── Constantes ───────────────────────────────────────────────────────────────

const INPUT = 'w-full rounded-xl border border-stone-200 bg-white px-4 py-3 text-sm text-stone-900 placeholder:text-stone-400 focus:border-primary-400 focus:outline-none focus:ring-2 focus:ring-primary-100 transition'

const URGENCY = [
  { value: 'LOW',    label: 'Pas urgent',  sublabel: 'Dans la semaine',    dot: 'bg-green-500',  color: 'border-green-200 bg-green-50 text-green-700',   active: 'border-green-500 bg-green-100 text-green-800 ring-2 ring-green-200' },
  { value: 'NORMAL', label: 'Normal',      sublabel: 'Dans 2-3 jours',     dot: 'bg-amber-500',  color: 'border-amber-200 bg-amber-50 text-amber-700',   active: 'border-amber-500 bg-amber-100 text-amber-800 ring-2 ring-amber-200' },
  { value: 'HIGH',   label: 'Urgent',      sublabel: "Aujourd'hui/demain", dot: 'bg-red-500',    color: 'border-red-200 bg-red-50 text-red-700',         active: 'border-red-500 bg-red-100 text-red-800 ring-2 ring-red-200' },
]

const URGENCY_LABEL = { LOW: 'Pas urgent', NORMAL: 'Normal', HIGH: 'Urgent' }

// ─── Sous-composants ──────────────────────────────────────────────────────────

function PhotoPicker({ value, onChange }) {
  const inputRef = useRef(null)
  const [previewUrl, setPreviewUrl] = useState(null)

  // `value` est le File brut (nécessaire pour l'upload multipart) ;
  // l'aperçu passe par une object URL générée localement.
  useEffect(() => {
    if (!value) { setPreviewUrl(null); return }
    const url = URL.createObjectURL(value)
    setPreviewUrl(url)
    return () => URL.revokeObjectURL(url)
  }, [value])

  const handleFile = (file) => onChange(file ?? null)

  return (
    <div>
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => handleFile(e.target.files?.[0] ?? null)}
      />

      {previewUrl ? (
        <div className="relative overflow-hidden rounded-xl border border-stone-200 bg-stone-50">
          <img src={previewUrl} alt="Aperçu" className="max-h-48 w-full object-contain" />
          <button
            type="button"
            onClick={() => { onChange(null); if (inputRef.current) inputRef.current.value = '' }}
            className="absolute right-2 top-2 flex h-7 w-7 items-center justify-center rounded-full bg-white/90 text-xs text-stone-500 shadow hover:bg-red-50 hover:text-red-600"
          >
            ✕
          </button>
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            className="absolute bottom-2 right-2 rounded-lg bg-white/90 px-2.5 py-1 text-xs font-medium text-stone-600 shadow hover:bg-white"
          >
            Changer
          </button>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          className="flex w-full flex-col items-center gap-2 rounded-xl border-2 border-dashed border-stone-200 py-6 text-stone-400 transition hover:border-primary-300 hover:bg-primary-50 hover:text-primary-500"
        >
          <svg className="h-8 w-8" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909M3 21h18M3.75 3h16.5M21 3.75v16.5M3 20.25V3.75" />
          </svg>
          <span className="text-sm">Cliquer pour ajouter une photo</span>
          <span className="text-xs opacity-70">JPG, PNG — max 2 Mo</span>
        </button>
      )}
    </div>
  )
}

function SectionTitle({ step, title, subtitle }) {
  return (
    <div className="flex items-start gap-3">
      <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary-600 text-xs font-bold text-white">
        {step}
      </div>
      <div>
        <p className="font-semibold text-stone-900">{title}</p>
        {subtitle && <p className="text-xs text-stone-500">{subtitle}</p>}
      </div>
    </div>
  )
}

function RequestRecap({ data }) {
  if (!data) return null
  return (
    <div className="mb-5 rounded-xl border border-primary-200 bg-primary-50 p-4">
      <p className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-primary-500">
        Votre demande
      </p>
      <div className="flex flex-wrap items-center gap-2 text-sm">
        <span className="font-semibold text-primary-800">{data.metier}</span>
        <span className="text-primary-400">·</span>
        <span className="text-primary-700">{data.ville}</span>
        <span className="text-primary-400">·</span>
        <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${
          data.urgency === 'HIGH' ? 'bg-red-100 text-red-700'
          : data.urgency === 'LOW' ? 'bg-green-100 text-green-700'
          : 'bg-amber-100 text-amber-700'
        }`}>
          {URGENCY_LABEL[data.urgency]}
        </span>
        {data.budget && (
          <span className="text-primary-600">{data.budget.toLocaleString()} FCFA</span>
        )}
      </div>
      <p className="mt-2 line-clamp-2 text-xs text-primary-700 italic">{data.description}</p>
    </div>
  )
}

// ─── Formulaire de nouvelle demande ───────────────────────────────────────────
// Contenu partagé entre la page standalone (/nouvelle-demande) et la modale
// ouvrable depuis n'importe quelle page. `onClose` est appelé uniquement à la
// fin du parcours (succès → "Voir mes demandes"), pour permettre à l'appelant
// de fermer la modale le cas échéant.

const STEP = { FORM: 'FORM', AUTH: 'AUTH', SUCCESS: 'SUCCESS' }

export default function NewRequestForm({ onClose }) {
  const { user } = useAuth()
  const navigate = useNavigate()

  const [step, setStep]           = useState(STEP.FORM)
  const [authMode, setAuthMode]   = useState('connexion') // 'connexion' | 'inscription'
  const [pendingData, setPendingData] = useState(null)    // données en attente d'auth
  const [error, setError]         = useState('')
  const [submitting, setSubmitting] = useState(false)

  const [form, setForm] = useState({
    metier: '', ville: '', adresse: '', description: '', budget: '', urgency: 'NORMAL',
  })
  const [photo,   setPhoto]   = useState(null) // File brut (upload multipart)
  const [villes,  setVilles]  = useState([])
  const [metiers, setMetiers] = useState([])

  useEffect(() => {
    villeService.getAllVilles()
      .then((data) => setVilles(data.map((v) => v.name)))
      .catch(console.error)
    metierService.getAllMetiers()
      .then((data) => setMetiers(data.map((m) => m.name)))
      .catch(console.error)
  }, [])

  // ── Auto-sauvegarde dès que l'utilisateur s'authentifie ───────────────────
  useEffect(() => {
    if (!user || step !== STEP.AUTH || !pendingData) return

    if (user.role !== 'CLIENT') {
      setError('Seuls les comptes clients peuvent publier des demandes.')
      setStep(STEP.FORM)
      setPendingData(null)
      return
    }

    doSave({ ...pendingData, clientId: user.id })
  }, [user]) // eslint-disable-line react-hooks/exhaustive-deps

  // ── Helpers ───────────────────────────────────────────────────────────────

  const update = (field) => (e) => {
    setForm((f) => ({ ...f, [field]: e.target.value }))
    setError('')
  }

  const validate = () => {
    if (!form.metier)            { setError('Veuillez choisir un métier.'); return false }
    if (!form.ville)             { setError('Veuillez choisir une ville.'); return false }
    if (!form.adresse.trim())    { setError("Veuillez indiquer l'adresse."); return false }
    if (!form.description.trim()){ setError('Veuillez décrire votre besoin.'); return false }
    return true
  }

  const buildData = () => ({
    metier:      form.metier,
    ville:       form.ville,
    adresse:     form.adresse.trim(),
    description: form.description.trim(),
    budget:      form.budget ? Number(form.budget) : null,
    urgency:     form.urgency,
    photo:       photo ?? null,
  })

  const doSave = async (requestData) => {
    setSubmitting(true)
    try {
      await requestService.createRequest(requestData)
      setPendingData(null)
      setStep(STEP.SUCCESS)
    } catch (err) {
      console.error('[NewRequestForm] Erreur sauvegarde:', err)
      setError("Une erreur s'est produite. Veuillez réessayer.")
      setStep(STEP.FORM)
    } finally {
      setSubmitting(false)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!validate()) return

    const data = buildData()

    if (user) {
      if (user.role !== 'CLIENT') {
        setError('Seuls les comptes clients peuvent publier des demandes.')
        return
      }
      doSave({ ...data, clientId: user.id })
    } else {
      // Pas connecté → enregistrer les données et demander l'auth
      setPendingData(data)
      setStep(STEP.AUTH)
    }
  }

  const resetForm = () => {
    setForm({ metier: '', ville: '', adresse: '', description: '', budget: '', urgency: 'NORMAL' })
    setPhoto(null)
    setError('')
    setPendingData(null)
    setStep(STEP.FORM)
  }

  // ════════════════════════════════════════════════════════════════════════════
  // ÉTAPE : SUCCÈS
  // ════════════════════════════════════════════════════════════════════════════
  if (step === STEP.SUCCESS) {
    return (
      <div className="flex w-full flex-col items-center gap-5 pt-2 text-center">
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-green-100">
          <CheckIcon className="h-8 w-8 text-green-600" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-stone-900">Demande publiée !</h1>
          <p className="mt-2 text-sm text-stone-600">
            Votre demande est en ligne. Les{' '}
            <span className="font-semibold text-primary-700">{form.metier}s</span> disponibles à{' '}
            <span className="font-semibold text-primary-700">{form.ville}</span> vont vous faire des
            propositions de prix.
          </p>
        </div>
        <div className="flex w-full flex-col gap-2">
          <button
            onClick={() => { navigate('/demandes'); onClose?.() }}
            className="w-full rounded-xl bg-primary-600 px-4 py-3 text-sm font-semibold text-white hover:bg-primary-700"
          >
            Voir mes demandes
          </button>
          <button
            onClick={resetForm}
            className="w-full rounded-xl border border-stone-300 px-4 py-3 text-sm font-medium text-stone-600 hover:bg-stone-50"
          >
            Faire une autre demande
          </button>
        </div>
      </div>
    )
  }

  // ════════════════════════════════════════════════════════════════════════════
  // ÉTAPE : AUTHENTIFICATION (demande prête, besoin de connexion)
  // ════════════════════════════════════════════════════════════════════════════
  if (step === STEP.AUTH) {
    return (
      <div className="w-full">

        {/* Retour au formulaire */}
        <button
          onClick={() => setStep(STEP.FORM)}
          className="mb-5 flex items-center gap-1 text-sm text-stone-500 hover:text-stone-700"
        >
          ← Modifier la demande
        </button>

        {/* Récapitulatif */}
        <RequestRecap data={pendingData} />

        {/* Carte auth */}
        <div className="rounded-2xl border border-stone-200 bg-white p-6">

          {/* En-tête */}
          <div className="mb-5 text-center">
            <div className="mx-auto mb-2 flex h-10 w-10 items-center justify-center rounded-full bg-green-100">
              <CheckIcon className="h-5 w-5 text-green-600" />
            </div>
            <p className="font-semibold text-stone-900">Votre demande est prête !</p>
            <p className="mt-1 text-sm text-stone-500">
              Connectez-vous ou créez un compte client pour la publier.
            </p>
          </div>

          {/* Toggle connexion / inscription */}
          <div className="mb-5 flex rounded-xl border border-stone-200 bg-stone-50 p-1">
            {[
              { key: 'connexion',  label: 'Connexion' },
              { key: 'inscription', label: 'Inscription' },
            ].map((tab) => (
              <button
                key={tab.key}
                onClick={() => setAuthMode(tab.key)}
                className={`flex-1 rounded-lg py-2 text-sm font-semibold transition ${
                  authMode === tab.key
                    ? 'bg-white text-primary-700 shadow-sm'
                    : 'text-stone-500 hover:text-stone-700'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Formulaire auth */}
          {authMode === 'connexion' ? (
            <LoginForm
              onSuccess={() => {}}
              onSwitchToRegister={() => setAuthMode('inscription')}
            />
          ) : (
            <RegisterForm
              onSuccess={() => {}}
              onSwitchToLogin={() => setAuthMode('connexion')}
              lockedRole="CLIENT"
            />
          )}
        </div>

        {error && (
          <div className="mt-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3">
            <p className="text-sm font-medium text-red-700">{error}</p>
          </div>
        )}
      </div>
    )
  }

  // ════════════════════════════════════════════════════════════════════════════
  // ÉTAPE : FORMULAIRE (accessible sans connexion)
  // ════════════════════════════════════════════════════════════════════════════
  return (
    <div className="w-full">

      <div className="mb-6">
        <h1 className="text-xl font-bold text-stone-900">Nouvelle demande d'intervention</h1>
        <p className="mt-1 text-sm text-stone-500">
          Décrivez votre besoin et recevez des propositions d'ouvriers qualifiés.
          {!user && (
            <span className="ml-1 text-primary-600">
              Vous pourrez vous connecter juste après.
            </span>
          )}
        </p>
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col gap-5" noValidate>

        {/* Section 1 — Type d'intervention */}
        <div className="flex flex-col gap-4 rounded-2xl border border-stone-200 bg-white p-5">
          <SectionTitle step="1" title="Type d'intervention" subtitle="Quel professionnel vous faut-il ?" />

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-stone-400">
                Métier <span className="text-red-500">*</span>
              </label>
              <select value={form.metier} onChange={update('metier')} className={INPUT}>
                <option value="">Choisir…</option>
                {metiers.map((m) => <option key={m} value={m}>{m}</option>)}
              </select>
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-stone-400">
                Ville <span className="text-red-500">*</span>
              </label>
              <VilleSelect
                value={form.ville}
                onChange={(v) => { setForm((f) => ({ ...f, ville: v })); setError('') }}
                villes={villes}
              />
            </div>
          </div>

          <div>
            <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-stone-400">
              Adresse d'intervention <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={form.adresse}
              onChange={update('adresse')}
              placeholder="Ex : Quartier Mermoz, Rue 10, Dakar"
              className={INPUT}
            />
          </div>
        </div>

        {/* Section 2 — Description */}
        <div className="flex flex-col gap-4 rounded-2xl border border-stone-200 bg-white p-5">
          <SectionTitle step="2" title="Description du besoin" subtitle="Plus vous êtes précis, meilleures seront les propositions" />

          <div>
            <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-stone-400">
              Décrivez votre problème <span className="text-red-500">*</span>
            </label>
            <textarea
              value={form.description}
              onChange={update('description')}
              rows={5}
              placeholder="Ex : Fuite d'eau sous l'évier de la cuisine depuis ce matin. L'eau s'écoule en permanence même robinet fermé…"
              className={INPUT + ' resize-none'}
            />
          </div>

          <div>
            <label className="mb-2 block text-xs font-semibold uppercase tracking-wide text-stone-400">
              Niveau d'urgence
            </label>
            <div className="grid grid-cols-3 gap-2">
              {URGENCY.map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => setForm((f) => ({ ...f, urgency: opt.value }))}
                  className={`flex flex-col items-center gap-1 rounded-xl border p-3 text-center transition ${
                    form.urgency === opt.value ? opt.active : opt.color
                  }`}
                >
                  <span className={`h-2.5 w-2.5 rounded-full ${opt.dot}`} />
                  <span className="text-sm font-semibold">{opt.label}</span>
                  <span className="text-xs opacity-80">{opt.sublabel}</span>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Section 3 — Photo optionnelle */}
        <div className="flex flex-col gap-4 rounded-2xl border border-stone-200 bg-white p-5">
          <SectionTitle
            step="3"
            title="Photo du problème"
            subtitle="Optionnel — une image vaut mieux qu'une longue description"
          />
          <PhotoPicker value={photo} onChange={setPhoto} />
        </div>

        {/* Section 4 — Budget */}
        <div className="flex flex-col gap-4 rounded-2xl border border-stone-200 bg-white p-5">
          <SectionTitle step="4" title="Budget indicatif" subtitle="Optionnel — aide les ouvriers à calibrer leur offre" />
          <div className="relative">
            <input
              type="number"
              value={form.budget}
              onChange={update('budget')}
              min="0"
              step="500"
              placeholder="Laisser vide si non défini"
              className={INPUT + ' pr-16'}
            />
            <span className="absolute right-4 top-1/2 -translate-y-1/2 text-sm font-medium text-stone-400">
              FCFA
            </span>
          </div>
        </div>

        {/* Récap + erreur */}
        {error && (
          <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3">
            <p className="text-sm font-medium text-red-700">{error}</p>
          </div>
        )}

        {form.metier && form.ville && (
          <div className="rounded-xl border border-primary-100 bg-primary-50 px-4 py-3 text-sm text-primary-800">
            Demande pour un{' '}
            <span className="font-semibold">{form.metier}</span> à{' '}
            <span className="font-semibold">{form.ville}</span>
            {form.urgency === 'HIGH' && (
              <span className="ml-2 rounded-full bg-red-100 px-2 py-0.5 text-xs font-medium text-red-700">
                Urgent
              </span>
            )}
          </div>
        )}

        {/* Bouton */}
        <button
          type="submit"
          disabled={submitting}
          className="w-full rounded-xl bg-primary-600 px-4 py-3.5 text-sm font-semibold text-white shadow-sm hover:bg-primary-700 disabled:opacity-60"
        >
          {submitting
            ? 'Publication en cours…'
            : user
              ? 'Publier la demande'
              : 'Continuer → Connexion / Inscription'}
        </button>
      </form>
    </div>
  )
}
