import { useRef, useState } from 'react'
import { METIERS, VILLES } from '../constants/referenceData'
import { useAuth } from '../context/AuthContext'

// ─── Composant sélecteur de fichier ──────────────────────────────────────────

function FileInput({ label, required, accept, value, onChange, hint }) {
  const inputRef = useRef(null)

  const isImage =
    value?.type?.startsWith('image/') || /\.(jpg|jpeg|png|webp)$/i.test(value?.name ?? '')
  const preview = value && isImage ? URL.createObjectURL(value) : null

  const retirer = (e) => {
    e.stopPropagation()
    onChange(null)
    if (inputRef.current) inputRef.current.value = ''
  }

  return (
    <div>
      <label className="mb-1 block text-sm font-medium text-stone-700">
        {label}
        {required ? (
          <span className="ml-1 text-red-500">*</span>
        ) : (
          <span className="ml-1 text-xs font-normal text-stone-400">(optionnel)</span>
        )}
      </label>

      <input
        ref={inputRef}
        type="file"
        accept={accept}
        className="hidden"
        onChange={(e) => onChange(e.target.files?.[0] ?? null)}
      />

      <div
        role="button"
        tabIndex={0}
        onClick={() => inputRef.current?.click()}
        onKeyDown={(e) => e.key === 'Enter' && inputRef.current?.click()}
        className={`flex cursor-pointer select-none items-center gap-3 rounded-lg border-2 border-dashed px-3 py-2.5 transition hover:border-primary-400 ${
          value ? 'border-primary-300 bg-primary-50' : 'border-stone-200 bg-white'
        }`}
      >
        {/* Aperçu image */}
        {preview ? (
          <img
            src={preview}
            alt=""
            className="h-10 w-10 shrink-0 rounded object-cover"
          />
        ) : (
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded bg-stone-100 text-stone-400 text-lg">
            {value ? '✓' : '+'}
          </div>
        )}

        <div className="flex-1 overflow-hidden">
          {value ? (
            <p className="truncate text-sm font-medium text-primary-700">{value.name}</p>
          ) : (
            <>
              <p className="text-sm text-stone-500">Cliquer pour sélectionner</p>
              {hint && <p className="text-xs text-stone-400">{hint}</p>}
            </>
          )}
        </div>

        {value ? (
          <button
            type="button"
            onClick={retirer}
            className="shrink-0 rounded-full px-1.5 py-0.5 text-xs text-stone-400 hover:bg-red-50 hover:text-red-500"
          >
            Retirer
          </button>
        ) : (
          <span className="shrink-0 rounded-md bg-stone-100 px-2 py-1 text-xs text-stone-600">
            Parcourir
          </span>
        )}
      </div>
    </div>
  )
}

// ─── Séparateur de section ───────────────────────────────────────────────────

function Section({ title }) {
  return (
    <div className="flex items-center gap-3 pt-2">
      <span className="text-xs font-semibold uppercase tracking-wide text-stone-400">{title}</span>
      <div className="flex-1 border-t border-stone-100" />
    </div>
  )
}

// ─── Champ texte générique ────────────────────────────────────────────────────

function Field({ label, required, children }) {
  return (
    <div>
      <label className="mb-1 block text-sm font-medium text-stone-700">
        {label}
        {required ? (
          <span className="ml-1 text-red-500">*</span>
        ) : (
          <span className="ml-1 text-xs font-normal text-stone-400">(optionnel)</span>
        )}
      </label>
      {children}
    </div>
  )
}

const INPUT = 'w-full rounded-lg border border-stone-200 px-3 py-2 text-sm focus:border-primary-400 focus:outline-none'

// ─── Formulaire principal ─────────────────────────────────────────────────────

export default function RegisterForm({ onSuccess, onSwitchToLogin, lockedRole = null }) {
  const { register } = useAuth()

  const [role, setRole] = useState(lockedRole ?? 'CLIENT')
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  // Champs texte communs
  const [form, setForm] = useState({
    nom: '',
    email: '',
    telephone: '',
    password: '',
    confirmPassword: '',
    // CLIENT
    ville: '',
    // WORKER
    metier: '',
    villeWorker: '',
    description: '',
    yearsOfExperience: '',
  })

  // Fichiers (WORKER uniquement)
  const [files, setFiles] = useState({
    photoProfil: null,
    pieceIdentiteRecto: null,
    pieceIdentiteVerso: null,
    certificat: null,
  })

  const update = (field) => (e) => {
    setForm((f) => ({ ...f, [field]: e.target.value }))
    setError('')
  }

  const setFile = (field) => (file) => setFiles((f) => ({ ...f, [field]: file }))

  // ─── Validation ─────────────────────────────────────────────────────────────

  const validate = () => {
    if (form.password !== form.confirmPassword) {
      setError('Les mots de passe ne correspondent pas.')
      return false
    }
    if (form.password.length < 6) {
      setError('Le mot de passe doit contenir au moins 6 caractères.')
      return false
    }
    if (role === 'WORKER') {
      if (!files.pieceIdentiteRecto) {
        setError("La photo recto de votre pièce d'identité est obligatoire.")
        return false
      }
      if (!files.pieceIdentiteVerso) {
        setError("La photo verso de votre pièce d'identité est obligatoire.")
        return false
      }
    }
    return true
  }

  // ─── Soumission ─────────────────────────────────────────────────────────────

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    if (!validate()) return

    setSubmitting(true)
    try {
      // Construire un chemin simulé pour chaque fichier
      // (en production Spring Boot, ce seront de vrais uploads multipart)
      const ts = Date.now()
      const filePath = (file) =>
        file ? `/uploads/workers/${ts}/${file.name}` : null

      const payload =
        role === 'CLIENT'
          ? {
              nom: form.nom,
              email: form.email,
              telephone: form.telephone,
              password: form.password,
              ville: form.ville,
            }
          : {
              nom: form.nom,
              email: form.email,
              telephone: form.telephone,
              password: form.password,
              metier: form.metier,
              ville: form.villeWorker,
              description: form.description,
              yearsOfExperience: form.yearsOfExperience ? Number(form.yearsOfExperience) : null,
              photoProfil: filePath(files.photoProfil),
              pieceIdentiteRecto: filePath(files.pieceIdentiteRecto),
              pieceIdentiteVerso: filePath(files.pieceIdentiteVerso),
              certificat: filePath(files.certificat),
            }

      await register(payload, role)
      onSuccess?.(role)
    } catch (err) {
      console.error('[RegisterForm] Erreur inscription:', err)
      setError("Une erreur s'est produite. Veuillez réessayer.")
    } finally {
      setSubmitting(false)
    }
  }

  // ─── Rendu ──────────────────────────────────────────────────────────────────

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4" noValidate>

      {/* Choix du rôle — masqué si lockedRole */}
      {!lockedRole && <div className="grid grid-cols-2 gap-2">
        {[
          { v: 'CLIENT', l: 'Je suis client' },
          { v: 'WORKER', l: 'Je suis ouvrier' },
        ].map((r) => (
          <button
            type="button"
            key={r.v}
            onClick={() => { setRole(r.v); setError('') }}
            className={`rounded-lg border px-3 py-2 text-sm font-medium transition ${
              role === r.v
                ? 'border-primary-600 bg-primary-50 text-primary-700'
                : 'border-stone-200 text-stone-600 hover:border-stone-300'
            }`}
          >
            {r.l}
          </button>
        ))}
      </div>}

      {/* ── Section : Informations de compte ──────────────────────────────── */}
      <Section title="Informations de compte" />

      <Field label="Nom complet" required>
        <input
          value={form.nom}
          onChange={update('nom')}
          required
          placeholder="Moussa Diop"
          className={INPUT}
        />
      </Field>

      <Field label="Email" required>
        <input
          type="email"
          value={form.email}
          onChange={update('email')}
          required
          placeholder="vous@exemple.com"
          className={INPUT}
        />
      </Field>

      <Field label="Téléphone" required>
        <input
          value={form.telephone}
          onChange={update('telephone')}
          required
          placeholder="77 000 00 00"
          className={INPUT}
        />
      </Field>

      <div className="grid grid-cols-2 gap-3">
        <Field label="Mot de passe" required>
          <input
            type="password"
            value={form.password}
            onChange={update('password')}
            required
            placeholder="6 caractères min."
            className={INPUT}
          />
        </Field>
        <Field label="Confirmer" required>
          <input
            type="password"
            value={form.confirmPassword}
            onChange={update('confirmPassword')}
            required
            placeholder="Répéter"
            className={INPUT}
          />
        </Field>
      </div>

      {/* Ville uniquement pour CLIENT */}
      {role === 'CLIENT' && (
        <Field label="Ville">
          <select value={form.ville} onChange={update('ville')} className={INPUT}>
            <option value="">Choisir...</option>
            {VILLES.map((v) => (
              <option key={v} value={v}>{v}</option>
            ))}
          </select>
        </Field>
      )}

      {/* ── Sections WORKER ───────────────────────────────────────────────── */}
      {role === 'WORKER' && (
        <>
          <Section title="Profil professionnel" />

          <div className="grid grid-cols-2 gap-3">
            <Field label="Métier" required>
              <select
                value={form.metier}
                onChange={update('metier')}
                required
                className={INPUT}
              >
                <option value="">Choisir...</option>
                {METIERS.map((m) => (
                  <option key={m} value={m}>{m}</option>
                ))}
              </select>
            </Field>

            <Field label="Ville d'activité" required>
              <select
                value={form.villeWorker}
                onChange={update('villeWorker')}
                required
                className={INPUT}
              >
                <option value="">Choisir...</option>
                {VILLES.map((v) => (
                  <option key={v} value={v}>{v}</option>
                ))}
              </select>
            </Field>
          </div>

          <Field label="Années d'expérience" required>
            <input
              type="number"
              value={form.yearsOfExperience}
              onChange={update('yearsOfExperience')}
              required
              min="0"
              max="60"
              placeholder="ex. 5"
              className={INPUT}
            />
          </Field>

          <Field label="Description" required>
            <textarea
              value={form.description}
              onChange={update('description')}
              required
              rows={3}
              placeholder="Décrivez votre expérience, vos spécialités, votre zone d'intervention..."
              className={INPUT}
            />
          </Field>

          {/* ── Documents ─────────────────────────────────────────────────── */}
          <Section title="Documents d'identité" />

          <p className="text-xs text-stone-500">
            Votre compte sera vérifié par notre équipe après dépôt des documents.
            Votre profil sera visible une fois approuvé.
          </p>

          <FileInput
            label="Photo de profil"
            required={false}
            accept="image/*"
            value={files.photoProfil}
            onChange={setFile('photoProfil')}
            hint="JPG, PNG — max 5 Mo"
          />

          <FileInput
            label="Pièce d'identité — recto"
            required
            accept="image/*"
            value={files.pieceIdentiteRecto}
            onChange={setFile('pieceIdentiteRecto')}
            hint="CNI, passeport ou permis de conduire (face avant)"
          />

          <FileInput
            label="Pièce d'identité — verso"
            required
            accept="image/*"
            value={files.pieceIdentiteVerso}
            onChange={setFile('pieceIdentiteVerso')}
            hint="Face arrière de votre document"
          />

          <FileInput
            label="Certificat ou diplôme"
            required={false}
            accept="image/*,.pdf"
            value={files.certificat}
            onChange={setFile('certificat')}
            hint="PDF ou image — attestation de compétence"
          />
        </>
      )}

      {/* Message d'erreur */}
      {error && (
        <p className="rounded-lg bg-red-50 px-3 py-2 text-sm font-medium text-red-700">
          {error}
        </p>
      )}

      {/* Bouton de soumission */}
      <button
        type="submit"
        disabled={submitting}
        className="rounded-lg bg-primary-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-primary-700 disabled:opacity-60"
      >
        {submitting ? 'Création en cours…' : 'Créer mon compte'}
      </button>

      {onSwitchToLogin && (
        <p className="text-center text-sm text-stone-500">
          Déjà inscrit ?{' '}
          <button
            type="button"
            onClick={onSwitchToLogin}
            className="font-medium text-primary-600 hover:underline"
          >
            Connectez-vous
          </button>
        </p>
      )}
    </form>
  )
}
