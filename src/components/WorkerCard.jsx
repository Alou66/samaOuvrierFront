import { Link } from 'react-router-dom'
import Stars from './Stars'
import Avatar from './Avatar'

export default function WorkerCard({ worker }) {
  return (
    <Link
      to={`/ouvrier/${worker.id}`}
      className="flex flex-col gap-3 rounded-xl border border-stone-200 bg-white p-4 shadow-sm transition hover:shadow-md sm:flex-row sm:items-center"
    >
      <Avatar
        src={worker.photoProfil}
        name={worker.nom}
        className="h-14 w-14 bg-primary-100 text-2xl text-primary-600"
      />

      <div className="flex-1 text-left">
        <div className="flex items-center justify-between gap-2">
          <h3 className="font-semibold text-stone-900">{worker.nom}</h3>
          <span
            className={`shrink-0 rounded-full px-2 py-0.5 text-xs font-medium ${
              worker.isAvailable ? 'bg-green-100 text-green-700' : 'bg-stone-100 text-stone-500'
            }`}
          >
            {worker.isAvailable ? 'Disponible' : 'Indisponible'}
          </span>
        </div>
        <p className="text-sm text-stone-500">
          {worker.metier} · {worker.ville}
        </p>
        <div className="mt-1 flex items-center gap-1.5 text-sm">
          <Stars note={worker.note} />
          <span className="text-stone-500">
            {worker.note} ({worker.avis} avis)
          </span>
        </div>
      </div>
    </Link>
  )
}
