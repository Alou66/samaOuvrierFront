import { useEffect, useRef, useState } from 'react'
import { useAuth } from '../context/AuthContext'
import api from '../services/api'
import { villeService } from '../services/ville.service'
import { metierService } from '../services/metier.service'
import VilleSelect from '../components/VilleSelect'

const LANGUAGES_OPTIONS = ['Wolof', 'Français', 'Anglais', 'Pulaar', 'Sérère', 'Mandingue', 'Diola']

export default function Account() {
  const { user, updateUser } = useAuth()

  const photoInputRef              = useRef(null)
  const [photoLoading, setPhotoLoading] = useState(false)
  const [editing, setEditing]      = useState(false)
  const [saving, setSaving]        = useState(false)
  const [success, setSuccess]      = useState(false)
  const [error, setError]          = useState(null)

  // Formulaire initialisé avec les données actuelles
  const [form, setForm] = useState({
    nom:               user?.nom               ?? '',
    email:             user?.email             ?? '',
    telephone:         user?.telephone         ?? '',
    ville:             user?.ville             ?? '',
    // champs ouvrier
    metier:            user?.workerProfile?.metier            ?? '',
    description:       user?.workerProfile?.description       ?? '',
    yearsOfExperience: user?.workerProfile?.yearsOfExperience ?? '',
    languages:         user?.workerProfile?.languages         ?? [],
  })

  const [villes,  setVilles]  = useState([])
  const [metiers, setMetiers] = useState([])
  useEffect(() => {
    api.get('/api/account/me')
      .then(({ data }) => {
        updateUser(data)
        setForm({
          nom:               data.nom               ?? '',
          email:             data.email             ?? '',
          telephone:         data.telephone         ?? '',
          ville:             data.ville             ?? '',
          metier:            data.workerProfile?.metier            ?? '',
          description:       data.workerProfile?.description       ?? '',
          yearsOfExperience: data.workerProfile?.yearsOfExperience ?? '',
          languages:         data.workerProfile?.languages         ?? [],
        })
      })
      .catch(console.error)
    villeService.getAllVilles()
      .then((data) => setVilles(data.map((v) => v.name)))
      .catch(console.error)
    metierService.getAllMetiers()
      .then((data) => setMetiers(data.map((m) => m.name)))
      .catch(console.error)
  }, [])

  if (!user) return null

  const set = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }))

  const toggleLanguage = (lang) => {
    setForm((f) => ({
      ...f,
      languages: f.languages.includes(lang)
        ? f.languages.filter((l) => l !== lang)
        : [...f.languages, lang],
    }))
  }

  const handleSave = async (e) => {
    e.preventDefault()
    setSaving(true)
    setError(null)
    setSuccess(false)

    const patch = {
      nom:       form.nom.trim(),
      email:     form.email.trim(),
      telephone: form.telephone.trim(),
      ville:     form.ville.trim(),
    }

    if (user.role === 'WORKER') {
      patch.metier            = form.metier
      patch.description       = form.description.trim()
      patch.yearsOfExperience = form.yearsOfExperience ? Number(form.yearsOfExperience) : null
      patch.languages         = form.languages
    }

    try {
      const { data: updated } = await api.put('/api/account/me', patch)
      updateUser(updated)
      setSuccess(true)
      setEditing(false)
    } catch (err) {
      console.error('[Account] Erreur sauvegarde:', err)
      setError('Une erreur est survenue. Réessayez.')
    } finally {
      setSaving(false)
    }
  }

  const handleCancel = () => {
    setForm({
      nom:               user.nom               ?? '',
      email:             user.email             ?? '',
      telephone:         user.telephone         ?? '',
      ville:             user.ville             ?? '',
      metier:            user.workerProfile?.metier            ?? '',
      description:       user.workerProfile?.description       ?? '',
      yearsOfExperience: user.workerProfile?.yearsOfExperience ?? '',
      languages:         user.workerProfile?.languages         ?? [],
    })
    setError(null)
    setEditing(false)
  }

  const handlePhotoChange = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    setPhotoLoading(true)
    try {
      const fd = new FormData()
      fd.append('file', file)
      const { data } = await api.patch('/api/account/me/photo', fd, {
        headers: { 'Content-Type': 'multipart/form-data' },
      })
      updateUser(data)
    } catch (err) {
      console.error('[Account] Erreur changement de photo:', err)
    } finally {
      setPhotoLoading(false)
      if (photoInputRef.current) photoInputRef.current.value = ''
    }
  }

  const ROLE_LABEL = { CLIENT: 'Client', WORKER: 'Ouvrier', ADMIN: 'Administrateur' }
  const ROLE_BADGE = {
    CLIENT: 'bg-primary-100 text-primary-700',
    WORKER: 'bg-amber-100 text-amber-700',
    ADMIN:  'bg-red-100 text-red-700',
  }

  return (
    <div className="mx-auto w-full max-w-lg">

      {/* En-tête */}
      <div className="mb-5 flex items-center gap-4">
        <div className="relative shrink-0">
          <div className="flex h-14 w-14 items-center justify-center overflow-hidden rounded-full bg-primary-100 text-xl font-bold text-primary-700">
            {user.photoProfilUrl
              ? <img src={user.photoProfilUrl} alt={user.nom} className="h-full w-full object-cover" />
              : user.nom?.charAt(0).toUpperCase()
            }
          </div>
          <button
            type="button"
            onClick={() => photoInputRef.current?.click()}
            disabled={photoLoading}
            className="absolute -bottom-0.5 -right-0.5 flex h-6 w-6 items-center justify-center rounded-full bg-primary-600 text-[10px] text-white shadow hover:bg-primary-700 disabled:opacity-50"
            title="Changer la photo de profil"
          >
            {photoLoading ? '…' : '✎'}
          </button>
          <input
            ref={photoInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handlePhotoChange}
          />
        </div>
        <div>
          <h1 className="text-lg font-bold text-stone-900">{user.nom}</h1>
          <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${ROLE_BADGE[user.role]}`}>
            {ROLE_LABEL[user.role]}
          </span>
        </div>
      </div>

      {/* Feedback succès */}
      {success && (
        <div className="mb-4 rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-sm font-medium text-green-800">
          Informations mises à jour avec succès.
        </div>
      )}

      {/* Formulaire */}
      <form onSubmit={handleSave} className="rounded-xl border border-stone-200 bg-white">

        {/* Informations personnelles */}
        <div className="border-b border-stone-100 p-5">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="font-semibold text-stone-900">Informations personnelles</h2>
            {!editing && (
              <button
                type="button"
                onClick={() => { setSuccess(false); setEditing(true) }}
                className="rounded-lg border border-stone-300 px-3 py-1.5 text-sm font-medium text-stone-700 hover:bg-stone-50"
              >
                Modifier
              </button>
            )}
          </div>

          <div className="flex flex-col gap-4">
            {/* Nom */}
            <Field label="Nom complet" required>
              {editing ? (
                <input
                  value={form.nom}
                  onChange={set('nom')}
                  required
                  className={INPUT}
                  placeholder="Votre nom"
                />
              ) : (
                <Value>{user.nom}</Value>
              )}
            </Field>

            {/* Email */}
            <Field label="Adresse e-mail" required>
              {editing ? (
                <input
                  type="email"
                  value={form.email}
                  onChange={set('email')}
                  required
                  className={INPUT}
                  placeholder="votre@email.com"
                />
              ) : (
                <Value>{user.email}</Value>
              )}
            </Field>

            {/* Téléphone */}
            <Field label="Téléphone">
              {editing ? (
                <input
                  value={form.telephone}
                  onChange={set('telephone')}
                  className={INPUT}
                  placeholder="7X XXX XX XX"
                />
              ) : (
                <Value>{user.telephone || '—'}</Value>
              )}
            </Field>

            {/* Ville */}
            <Field label="Ville">
              {editing ? (
                <VilleSelect
                  value={form.ville}
                  onChange={(v) => setForm((f) => ({ ...f, ville: v }))}
                  villes={villes}
                />
              ) : (
                <Value>{user.ville || '—'}</Value>
              )}
            </Field>
          </div>
        </div>

        {/* Champs spécifiques WORKER */}
        {user.role === 'WORKER' && (
          <div className="border-b border-stone-100 p-5">
            <h2 className="mb-4 font-semibold text-stone-900">Profil professionnel</h2>
            <div className="flex flex-col gap-4">

              {/* Métier */}
              <Field label="Métier">
                {editing ? (
                  <select value={form.metier} onChange={set('metier')} className={INPUT}>
                    <option value="">Choisir…</option>
                    {metiers.map((m) => <option key={m} value={m}>{m}</option>)}
                  </select>
                ) : (
                  <Value>{user.workerProfile?.metier || '—'}</Value>
                )}
              </Field>

              {/* Expérience */}
              <Field label="Années d'expérience">
                {editing ? (
                  <input
                    type="number"
                    min="0"
                    max="60"
                    value={form.yearsOfExperience}
                    onChange={set('yearsOfExperience')}
                    className={INPUT}
                    placeholder="5"
                  />
                ) : (
                  <Value>{user.workerProfile?.yearsOfExperience ? `${user.workerProfile.yearsOfExperience} ans` : '—'}</Value>
                )}
              </Field>

              {/* Description */}
              <Field label="Description">
                {editing ? (
                  <textarea
                    value={form.description}
                    onChange={set('description')}
                    rows={3}
                    className={INPUT}
                    placeholder="Décrivez vos compétences et votre expérience…"
                  />
                ) : (
                  <Value>{user.workerProfile?.description || '—'}</Value>
                )}
              </Field>

              {/* Langues */}
              <Field label="Langues parlées">
                {editing ? (
                  <div className="flex flex-wrap gap-2">
                    {LANGUAGES_OPTIONS.map((lang) => (
                      <button
                        key={lang}
                        type="button"
                        onClick={() => toggleLanguage(lang)}
                        className={`rounded-full border px-3 py-1 text-xs font-medium transition ${
                          form.languages.includes(lang)
                            ? 'border-primary-400 bg-primary-50 text-primary-700'
                            : 'border-stone-200 text-stone-600 hover:border-stone-300'
                        }`}
                      >
                        {lang}
                      </button>
                    ))}
                  </div>
                ) : (
                  <Value>{user.workerProfile?.languages?.length ? user.workerProfile.languages.join(', ') : '—'}</Value>
                )}
              </Field>
            </div>
          </div>
        )}

        {/* Boutons d'action */}
        {editing && (
          <div className="flex gap-3 p-5">
            {error && <p className="mb-0 flex-1 text-sm text-red-600">{error}</p>}
            <button
              type="button"
              onClick={handleCancel}
              className="flex-1 rounded-xl border border-stone-300 py-2.5 text-sm font-medium text-stone-700 hover:bg-stone-50"
            >
              Annuler
            </button>
            <button
              type="submit"
              disabled={saving}
              className="flex-1 rounded-xl bg-primary-600 py-2.5 text-sm font-semibold text-white hover:bg-primary-700 disabled:opacity-50"
            >
              {saving ? 'Enregistrement…' : 'Enregistrer'}
            </button>
          </div>
        )}
      </form>
    </div>
  )
}

// ── Composants utilitaires ────────────────────────────────────────────────────

const INPUT = 'w-full rounded-lg border border-stone-200 px-3 py-2 text-sm focus:border-primary-400 focus:outline-none'

function Field({ label, required, children }) {
  return (
    <div className="grid grid-cols-[120px_1fr] items-start gap-3 sm:grid-cols-[140px_1fr]">
      <label className="pt-2 text-sm font-medium text-stone-500">
        {label}{required && <span className="ml-0.5 text-red-400">*</span>}
      </label>
      <div>{children}</div>
    </div>
  )
}

function Value({ children }) {
  return <p className="py-2 text-sm text-stone-900">{children}</p>
}
