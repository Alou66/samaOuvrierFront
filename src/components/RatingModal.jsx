import { useState } from 'react'
import Modal from './Modal'

export default function RatingModal({ open, workerName, onSubmit, onSkip }) {
  const [note, setNote] = useState(5)
  const [commentaire, setCommentaire] = useState('')

  const handleSubmit = (e) => {
    e.preventDefault()
    onSubmit({ note, commentaire })
    setNote(5)
    setCommentaire('')
  }

  return (
    <Modal open={open} onClose={onSkip}>
      <h2 className="mb-1 text-center text-lg font-bold text-stone-900">Comment s'est passée l'intervention ?</h2>
      <p className="mb-4 text-center text-sm text-stone-500">Votre avis sur {workerName} aide les futurs clients.</p>

      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <div className="flex justify-center gap-1 text-3xl">
          {[1, 2, 3, 4, 5].map((n) => (
            <button
              type="button"
              key={n}
              onClick={() => setNote(n)}
              className={n <= note ? 'text-amber-500' : 'text-stone-300'}
            >
              ★
            </button>
          ))}
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium text-stone-700">
            Commentaire <span className="text-stone-400">(optionnel)</span>
          </label>
          <textarea
            value={commentaire}
            onChange={(e) => setCommentaire(e.target.value)}
            rows={3}
            className="w-full rounded-lg border border-stone-200 px-3 py-2 text-sm"
            placeholder="Votre avis aide les futurs clients..."
          />
        </div>

        <div className="flex gap-2">
          <button
            type="button"
            onClick={onSkip}
            className="flex-1 rounded-lg border border-stone-300 px-4 py-2 text-sm font-medium text-stone-600"
          >
            Passer
          </button>
          <button
            type="submit"
            className="flex-1 rounded-lg bg-primary-600 px-4 py-2 text-sm font-medium text-white hover:bg-primary-700"
          >
            Envoyer
          </button>
        </div>
      </form>
    </Modal>
  )
}
