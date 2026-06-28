export default function Stars({ note = 0, size = 'text-base' }) {
  const full = Math.round(note)
  return (
    <span className={`${size} text-amber-500`} aria-label={`Note ${note} sur 5`}>
      {'★'.repeat(full)}
      <span className="text-stone-300">{'★'.repeat(5 - full)}</span>
    </span>
  )
}
