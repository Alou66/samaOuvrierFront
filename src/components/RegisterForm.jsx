import { useEffect, useRef, useState } from 'react'
import { villeService } from '../services/ville.service'
import { metierService } from '../services/metier.service'
import { useAuth } from '../context/AuthContext'
import VilleSelect from './VilleSelect'
import {
  isValidEmail,
  isValidSenegalPhone,
  isValidPassword,
  normalizePhone,
  VALIDATION_MESSAGES,
} from '../utils/validation'

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
  const [workerPending, setWorkerPending] = useState(false)
  const [pendingNom, setPendingNom] = useState('')
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
    if (!form.nom.trim()) {
      setError('Le nom est obligatoire.')
      return false
    }
    if (!isValidEmail(form.email)) {
      setError(VALIDATION_MESSAGES.email)
      return false
    }
    if (!isValidSenegalPhone(form.telephone)) {
      setError(VALIDATION_MESSAGES.phone)
      return false
    }
    if (!isValidPassword(form.password)) {
      setError(VALIDATION_MESSAGES.password)
      return false
    }
    if (form.password !== form.confirmPassword) {
      setError('Les mots de passe ne correspondent pas.')
      return false
    }
    if (role === 'WORKER') {
      if (!form.metier) {
        setError('Le métier est obligatoire.')
        return false
      }
      if (!form.villeWorker) {
        setError("La ville d'activité est obligatoire.")
        return false
      }
      if (!form.description.trim()) {
        setError('La description est obligatoire.')
        return false
      }
      if (form.yearsOfExperience === '' || Number(form.yearsOfExperience) < 0) {
        setError("Les années d'expérience sont obligatoires.")
        return false
      }
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
      const telephone = normalizePhone(form.telephone)
      const payload =
        role === 'CLIENT'
          ? {
              nom:       form.nom.trim(),
              email:     form.email.trim(),
              telephone,
              password:  form.password,
              ville:     form.ville,
            }
          : {
              nom:               form.nom.trim(),
              email:             form.email.trim(),
              telephone,
              password:          form.password,
              metier:            form.metier,
              ville:             form.villeWorker,
              description:       form.description,
              yearsOfExperience: form.yearsOfExperience ? Number(form.yearsOfExperience) : null,
              photoProfil:        files.photoProfil,
              pieceIdentiteRecto: files.pieceIdentiteRecto,
              pieceIdentiteVerso: files.pieceIdentiteVerso,
              certificat:         files.certificat,
            }

      const result = await register(payload, role)
      if (result?.error) {
        setError(result.message ?? "Une erreur s'est produite. Veuillez réessayer.")
        return
      }
      if (result?.pending) {
        // Worker en attente de validation — ne pas rediriger
        setPendingNom(form.nom)
        setWorkerPending(true)
      } else {
        onSuccess?.(role)
      }
    } catch (err) {
      console.error('[RegisterForm] Erreur inscription:', err)
      setError("Une erreur s'est produite. Veuillez réessayer.")
    } finally {
      setSubmitting(false)
    }
  }

  // ─── Écran confirmation dossier ouvrier ─────────────────────────────────────

  if (workerPending) {
    return (
      <div className="flex flex-col items-center gap-5 py-4 text-center">
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-green-100">
          <span className="text-3xl">✓</span>
        </div>
        <div>
          <h2 className="text-lg font-bold text-stone-900">
            Dossier soumis avec succès !
          </h2>
          <p className="mt-1 text-sm text-stone-500">
            Merci <span className="font-semibold text-stone-700">{pendingNom.split(' ')[0]}</span>.
            Votre dossier est en cours d'examen par notre équipe.
          </p>
        </div>
        <div className="w-full rounded-xl border border-yellow-200 bg-yellow-50 p-4 text-left">
          <p className="text-sm font-semibold text-yellow-800">Prochaines étapes</p>
          <ul className="mt-2 space-y-1 text-sm text-yellow-700">
            <li>• Notre équipe vérifie vos documents</li>
            <li>• Vous recevrez une confirmation par email</li>
            <li>• Une fois approuvé, vous pouvez vous connecter</li>
          </ul>
        </div>
        {onSwitchToLogin && (
          <button
            type="button"
            onClick={onSwitchToLogin}
            className="w-full rounded-xl bg-primary-600 py-2.5 text-sm font-semibold text-white hover:bg-primary-700"
          >
            Retour à la connexion
          </button>
        )}
      </div>
    )
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
          type="tel"
          inputMode="numeric"
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
            placeholder="8 car. min., lettres et chiffres"
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
          <VilleSelect
            value={form.ville}
            onChange={(v) => { setForm((f) => ({ ...f, ville: v })); setError('') }}
            villes={villes}
          />
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
                {metiers.map((m) => (
                  <option key={m} value={m}>{m}</option>
                ))}
              </select>
            </Field>

            <Field label="Ville d'activité" required>
              <VilleSelect
                value={form.villeWorker}
                onChange={(v) => { setForm((f) => ({ ...f, villeWorker: v })); setError('') }}
                villes={villes}
              />
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
