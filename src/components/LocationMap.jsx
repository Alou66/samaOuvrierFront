import { useEffect, useMemo, useState } from 'react'
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap } from 'react-leaflet'
import L from 'leaflet'
import { useTrip } from '../context/TripContext'
import { QUARTIERS_DAKAR, VILLE_COORDS } from '../constants/mapData'

const SENEGAL_CENTER = [14.4974, -14.4524]
const DAKAR_CENTER = VILLE_COORDS.Dakar

function distanceKm([lat1, lon1], [lat2, lon2]) {
  const R = 6371
  const dLat = ((lat2 - lat1) * Math.PI) / 180
  const dLon = ((lon2 - lon1) * Math.PI) / 180
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLon / 2) ** 2
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
}

function quartierLePlusProche(point) {
  return QUARTIERS_DAKAR.reduce((meilleur, q) => (distanceKm(q, point) < distanceKm(meilleur, point) ? q : meilleur))
}

const positionIcon = L.divIcon({
  className: '',
  html: '<span class="relative flex h-4 w-4"><span class="absolute inline-flex h-full w-full animate-ping rounded-full bg-primary-400 opacity-60"></span><span class="relative inline-flex h-4 w-4 rounded-full border-2 border-white bg-primary-600"></span></span>',
  iconSize: [16, 16],
  iconAnchor: [8, 8],
})

const workerIcon = L.divIcon({
  className: '',
  html: '<span class="inline-flex h-3 w-3 rounded-full border-2 border-white bg-primary-700 shadow"></span>',
  iconSize: [12, 12],
  iconAnchor: [6, 6],
})

function bezier(p0, p1, p2, t) {
  const a = (1 - t) * (1 - t)
  const b = 2 * (1 - t) * t
  const c = t * t
  return [a * p0[0] + b * p1[0] + c * p2[0], a * p0[1] + b * p1[1] + c * p2[1]]
}

function VueCarte({ position }) {
  const map = useMap()
  useEffect(() => {
    if (position) map.flyTo(position, 14)
  }, [position, map])
  return null
}

function VueItineraire({ courbe, actif }) {
  const map = useMap()
  useEffect(() => {
    if (actif) map.fitBounds(courbe, { padding: [50, 50] })
  }, [actif, map, courbe])
  return null
}

export default function LocationMap() {
  const { trip } = useTrip()
  const [position, setPosition] = useState(null)
  const [erreur, setErreur] = useState('')

  const localiser = () => {
    setErreur('')
    if (!navigator.geolocation) {
      setErreur('Géolocalisation non disponible sur cet appareil.')
      return
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => setPosition([pos.coords.latitude, pos.coords.longitude]),
      () => setErreur('Impossible de récupérer votre position.'),
      { enableHighAccuracy: true, timeout: 8000 }
    )
  }

  useEffect(() => {
    localiser()
  }, [])

  const trajetActif = trip?.statut === 'en_route' || trip?.statut === 'arrive'
  const clientPos = position ?? DAKAR_CENTER

  const workerStart = useMemo(() => {
    if (trip?.ville === 'Dakar') return quartierLePlusProche(clientPos)
    const base = VILLE_COORDS[trip?.ville] ?? clientPos
    return [base[0] + 0.02, base[1] - 0.02]
  }, [trip?.worker?.id, trip?.ville, clientPos])

  const controle = useMemo(() => {
    const milieu = [(workerStart[0] + clientPos[0]) / 2, (workerStart[1] + clientPos[1]) / 2]
    const dx = clientPos[0] - workerStart[0]
    const dy = clientPos[1] - workerStart[1]
    return [milieu[0] + dy * 0.25, milieu[1] - dx * 0.25]
  }, [workerStart, clientPos])

  const courbe = useMemo(
    () => Array.from({ length: 24 }, (_, i) => bezier(workerStart, controle, clientPos, i / 23)),
    [workerStart, controle, clientPos]
  )

  const workerPos = trajetActif ? bezier(workerStart, controle, clientPos, trip.progress ?? 0) : null

  return (
    <div className="absolute inset-0 overflow-hidden rounded-2xl border border-primary-100">
      <MapContainer center={SENEGAL_CENTER} zoom={7} scrollWheelZoom={false} className="h-full w-full">
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        {position && !trajetActif && (
          <>
            <Marker position={position} icon={positionIcon}>
              <Popup>Votre position actuelle</Popup>
            </Marker>
            <VueCarte position={position} />
          </>
        )}

        {trajetActif && (
          <>
            <Polyline positions={courbe} pathOptions={{ color: '#16803c', weight: 3, opacity: 0.7, lineCap: 'round' }} />
            <Marker position={clientPos} icon={positionIcon}>
              <Popup>Votre position actuelle</Popup>
            </Marker>
            <Marker position={workerPos} icon={workerIcon}>
              <Popup>{trip.worker?.nom}</Popup>
            </Marker>
            <VueItineraire courbe={courbe} actif={trip.statut === 'en_route' && trip.progress < 0.1} />
          </>
        )}
      </MapContainer>

      <button
        onClick={localiser}
        className="absolute left-1/2 top-3 z-[400] -translate-x-1/2 rounded-md bg-white px-3 py-1.5 text-xs font-medium text-primary-700 shadow-sm"
      >
        {position ? 'Votre position actuelle' : 'Me localiser'}
      </button>

      {erreur && (
        <p className="absolute bottom-3 left-1/2 z-[400] -translate-x-1/2 rounded-md bg-white px-3 py-1 text-xs font-medium text-red-600 shadow-sm">
          {erreur}
        </p>
      )}
    </div>
  )
}
