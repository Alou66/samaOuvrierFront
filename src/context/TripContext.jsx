import { createContext, useContext, useEffect, useRef, useState } from 'react'

/**
 * TripContext — suivi temps réel d'une mission en cours.
 *
 * Déclenché par WorkerDashboard (worker démarre une mission)
 * ou par ClientRequests (client clique "Suivre l'ouvrier").
 *
 * Toute la logique de recherche instantanée simulée a été supprimée.
 * Le workflow réel passe par : Request → Proposal → Mission.
 */

const TripContext = createContext(null)

// 1 min de trajet simulée ≈ 6 s réelles (démo)
const SECONDES_REELLES_PAR_MINUTE = 6

function etaAleatoire() {
  return Math.floor(Math.random() * 8) + 5 // 5–12 min
}

export function TripProvider({ children }) {
  const [trip, setTrip] = useState(null)
  const intervalRef = useRef(null)

  useEffect(() => () => clearInterval(intervalRef.current), [])

  const demarrerSuiviTrajet = () => {
    clearInterval(intervalRef.current)
    intervalRef.current = setInterval(() => {
      setTrip((prev) => {
        if (!prev || prev.statut !== 'en_route') return prev
        const dureeMs = prev.etaInitial * SECONDES_REELLES_PAR_MINUTE * 1000
        const ecoule = Date.now() - prev.debutTrajet
        const progress = Math.min(1, ecoule / dureeMs)
        if (progress >= 1) {
          clearInterval(intervalRef.current)
          return { ...prev, statut: 'arrive', etaMin: 0, progress: 1 }
        }
        const etaMin = Math.max(1, Math.ceil(prev.etaInitial * (1 - progress)))
        return { ...prev, etaMin, progress }
      })
    }, 1000)
  }

  /**
   * Démarre le suivi d'une mission réelle.
   *
   * @param {object} params
   * @param {object} params.worker      - objet worker (id, nom, metier)
   * @param {string} params.metier
   * @param {string} params.ville
   * @param {string} [params.description]
   * @param {number} [params.missionId] - id de la Mission dans l'API
   * @param {number} [params.workerId]  - utilisé pour le rating
   * @param {number} [params.clientId]  - utilisé pour le rating
   */
  const demarrerMissionDirecte = ({
    worker,
    metier,
    ville,
    description = '',
    missionId = null,
    clientId = null,
  }) => {
    clearInterval(intervalRef.current)
    const etaInitial = etaAleatoire()
    setTrip({
      statut: 'en_route',
      metier,
      ville,
      description,
      worker,
      missionId,
      clientId,
      etaInitial,
      etaMin: etaInitial,
      progress: 0,
      debutTrajet: Date.now(),
    })
    demarrerSuiviTrajet()
  }

  const marquerArrive = () => {
    clearInterval(intervalRef.current)
    setTrip((prev) => (prev ? { ...prev, statut: 'arrive', progress: 1, etaMin: 0 } : prev))
  }

  const terminerTrajet = () => {
    clearInterval(intervalRef.current)
    setTrip(null)
  }

  return (
    <TripContext.Provider value={{ trip, demarrerMissionDirecte, marquerArrive, terminerTrajet }}>
      {children}
    </TripContext.Provider>
  )
}

export function useTrip() {
  return useContext(TripContext)
}
