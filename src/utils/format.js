/**
 * Convertit une durée en minutes en texte lisible.
 * 45 → "45 min" | 120 → "2h" | 90 → "1h 30min"
 */
export function formatDuration(minutes) {
  if (!minutes || minutes <= 0) return '—'
  const h = Math.floor(minutes / 60)
  const m = minutes % 60
  if (h === 0) return `${m} min`
  if (m === 0) return `${h}h`
  return `${h}h ${m}min`
}

/**
 * Formate un montant en FCFA.
 * 8000 → "8 000 FCFA"
 */
export function formatPrice(amount) {
  if (!amount && amount !== 0) return '—'
  return `${Number(amount).toLocaleString('fr-FR')} FCFA`
}
