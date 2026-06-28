import { useNavigate } from 'react-router-dom'
import { useTrip } from '../context/TripContext'
import { useAuth } from '../context/AuthContext'
import LocationMap from '../components/LocationMap'
import TripStatusSheet from '../components/TripStatusSheet'
import { SearchIcon } from '../components/Icons'

export default function Home() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const { trip } = useTrip()

  const ouvrirRecherche = () => {
    if (!user) {
      navigate('/connexion?redirect=/recherche')
      return
    }
    navigate('/recherche')
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-3">
      {/* Barre de recherche visible uniquement sans mission active */}
      {!trip && (
        <button
          onClick={ouvrirRecherche}
          className="flex w-full shrink-0 items-center gap-3 rounded-full border border-stone-200 bg-white px-4 py-3 text-left shadow-sm hover:border-primary-300"
        >
          <SearchIcon className="text-stone-400" />
          <span className="text-sm text-stone-500">De quoi avez-vous besoin aujourd'hui ?</span>
        </button>
      )}

      <div className="relative min-h-0 flex-1">
        <LocationMap />
        <TripStatusSheet />
      </div>
    </div>
  )
}
