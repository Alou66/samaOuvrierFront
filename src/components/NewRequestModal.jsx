import { useState } from 'react'
import Modal from './Modal'
import { METIERS, VILLES } from '../constants/referenceData'

export default function NewRequestModal({ open, onClose, onCreate }) {
  const [metier, setMetier] = useState('')
  const [ville, setVille] = useState('')
  const [date, setDate] = useState('')
  const [description, setDescription] = useState('')

  const reset = () => {
    setMetier('')
    setVille('')
    setDate('')
    setDescription('')
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    onCreate({ metier, ville, date, description })
    reset()
  }

  const handleClose = () => {
    reset()
    onClose()
  }

  return (
    <Modal open={open} onClose={handleClose}>
      <h2 className="mb-4 text-center text-lg font-bold text-stone-900">Nouvelle demande</h2>
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <div>
          <label className="mb-1 block text-sm font-medium text-stone-700">Métier recherché</label>
          <select
            value={metier}
            onChange={(e) => setMetier(e.target.value)}
            required
            className="w-full rounded-lg border border-stone-200 px-3 py-2 text-sm"
          >
            <option value="">Choisir un métier</option>
            {METIERS.map((m) => (
              <option key={m} value={m}>
                {m}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium text-stone-700">Ville</label>
          <select
            value={ville}
            onChange={(e) => setVille(e.target.value)}
            required
            className="w-full rounded-lg border border-stone-200 px-3 py-2 text-sm"
          >
            <option value="">Choisir une ville</option>
            {VILLES.map((v) => (
              <option key={v} value={v}>
                {v}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium text-stone-700">Date souhaitée</label>
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            required
            className="w-full rounded-lg border border-stone-200 px-3 py-2 text-sm"
          />
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium text-stone-700">Décrivez votre besoin</label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            required
            rows={3}
            placeholder="Ex. Fuite d'eau sous l'évier de la cuisine..."
            className="w-full rounded-lg border border-stone-200 px-3 py-2 text-sm"
          />
        </div>

        <div className="flex gap-2">
          <button
            type="button"
            onClick={handleClose}
            className="flex-1 rounded-lg border border-stone-300 px-4 py-2 text-sm font-medium text-stone-600"
          >
            Annuler
          </button>
          <button
            type="submit"
            className="flex-1 rounded-lg bg-primary-600 px-4 py-2 text-sm font-medium text-white hover:bg-primary-700"
          >
            Envoyer la demande
          </button>
        </div>
      </form>
    </Modal>
  )
}
