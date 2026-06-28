import { Link } from 'react-router-dom'
import Stars from './Stars'

export default function WorkerCard({ worker }) {
  return (
    <Link
      to={`/ouvrier/${worker.id}`}
      className="flex flex-col gap-3 rounded-xl border border-stone-200 bg-white p-4 shadow-sm transition hover:shadow-md sm:flex-row sm:items-center"
    >
      <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-primary-100 text-2xl font-bold text-primary-600">
        {worker.nom.charAt(0)}
      </div>

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
