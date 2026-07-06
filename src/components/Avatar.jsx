import { useState } from 'react'

/**
 * Affiche la photo de profil d'un utilisateur, ou à défaut (photo absente ou
 * en erreur de chargement) la première lettre de son nom. `className` porte
 * la taille, la police et les couleurs de repli (ex. "h-12 w-12 text-xl
 * bg-primary-100 text-primary-600"), pour s'adapter à chaque contexte d'appel.
 */
export default function Avatar({ src, name, className = '', imgClassName = '' }) {
  const [failed, setFailed] = useState(false)
  const initial = name?.trim()?.charAt(0)?.toUpperCase() || '?'
  const showImage = Boolean(src) && !failed

  return (
    <div className={`flex shrink-0 items-center justify-center overflow-hidden rounded-full font-bold ${className}`}>
      {showImage ? (
        <img
          src={src}
          alt={name || 'Photo de profil'}
          className={`h-full w-full object-cover ${imgClassName}`}
          onError={() => setFailed(true)}
        />
      ) : (
        initial
      )}
    </div>
  )
}
