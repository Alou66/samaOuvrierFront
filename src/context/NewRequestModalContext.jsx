import { createContext, useContext, useState } from 'react'

const NewRequestModalContext = createContext(null)

export function NewRequestModalProvider({ children }) {
  const [isOpen, setIsOpen] = useState(false)

  return (
    <NewRequestModalContext.Provider
      value={{
        isOpen,
        openNewRequestModal: () => setIsOpen(true),
        closeNewRequestModal: () => setIsOpen(false),
      }}
    >
      {children}
    </NewRequestModalContext.Provider>
  )
}

export function useNewRequestModal() {
  const ctx = useContext(NewRequestModalContext)
  if (!ctx) throw new Error('useNewRequestModal doit être utilisé dans NewRequestModalProvider')
  return ctx
}
