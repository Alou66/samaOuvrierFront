/**
 * Règles de validation des formulaires — cohérentes avec les contraintes
 * appliquées côté backend (voir samaOuvrier/.../validation/*.java).
 */

const EMAIL_REGEX = /^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/

// Numéro sénégalais : 9 chiffres commençant par 70, 75, 76, 77 ou 78.
const SENEGAL_PHONE_REGEX = /^(70|75|76|77|78)\d{7}$/

// Min 8 caractères, alphanumérique : au moins une lettre et un chiffre.
const PASSWORD_REGEX = /^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d]{8,}$/

/** Retire espaces, points et tirets pour ne garder que les chiffres. */
export function normalizePhone(value) {
  return (value ?? '').replace(/[\s.-]/g, '')
}

export function isValidEmail(email) {
  return EMAIL_REGEX.test((email ?? '').trim())
}

export function isValidSenegalPhone(phone) {
  return SENEGAL_PHONE_REGEX.test(normalizePhone(phone))
}

export function isValidPassword(password) {
  return PASSWORD_REGEX.test(password ?? '')
}

export const VALIDATION_MESSAGES = {
  email: "Le format de l'email est invalide.",
  phone: 'Le téléphone doit être un numéro sénégalais valide (ex. 77 123 45 67).',
  password: 'Le mot de passe doit contenir au moins 8 caractères, avec au moins une lettre et un chiffre.',
}
