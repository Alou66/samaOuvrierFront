import Modal from './Modal'
import NewRequestForm from './NewRequestForm'
import { useNewRequestModal } from '../context/NewRequestModalContext'

export default function NewRequestModal() {
  const { isOpen, closeNewRequestModal } = useNewRequestModal()

  return (
    <Modal open={isOpen} onClose={closeNewRequestModal} widthClass="max-w-2xl">
      <div className="mb-2 flex justify-end">
        <button
          type="button"
          onClick={closeNewRequestModal}
          className="flex h-8 w-8 items-center justify-center rounded-full text-stone-400 hover:bg-stone-100 hover:text-stone-600"
          aria-label="Fermer"
        >
          ✕
        </button>
      </div>
      <NewRequestForm onClose={closeNewRequestModal} />
    </Modal>
  )
}
