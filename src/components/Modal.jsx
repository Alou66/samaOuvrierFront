export default function Modal({ open, onClose, children, widthClass = 'max-w-md' }) {
  if (!open) return null

  return (
    <div
      className="fixed inset-0 z-[2000] flex items-center justify-center bg-black/40 p-4"
      onClick={onClose}
    >
      <div
        className={`max-h-[90vh] w-full ${widthClass} overflow-y-auto rounded-xl bg-white p-6`}
        onClick={(e) => e.stopPropagation()}
      >
        {children}
      </div>
    </div>
  )
}
