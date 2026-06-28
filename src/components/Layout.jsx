import { useState } from 'react'
import { NavLink, Outlet, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import {
  HomeIcon, ListIcon, UserIcon, SearchIcon,
  PlusIcon, DashboardIcon, LogOutIcon, ShieldIcon,
} from './Icons'

// ─── Config navigation par rôle ───────────────────────────────────────────────

const NAV = {
  CLIENT: [
    { to: '/',                 label: 'Tableau de bord', shortLabel: 'Accueil',  Icon: HomeIcon,  end: true },
    { to: '/demandes',         label: 'Mes demandes',    shortLabel: 'Demandes', Icon: ListIcon },
    { to: '/nouvelle-demande', label: 'Nouvelle demande',shortLabel: 'Nouveau',  Icon: PlusIcon,  cta: true },
    { to: '/compte',           label: 'Mon compte',      shortLabel: 'Compte',   Icon: UserIcon },
  ],
  WORKER: [
    { to: '/ouvrier/dashboard', label: 'Mon tableau de bord', shortLabel: 'Dashboard', Icon: DashboardIcon },
    { to: '/compte',            label: 'Mon compte',           shortLabel: 'Compte',    Icon: UserIcon },
  ],
  ADMIN: [
    { to: '/admin',  label: 'Tableau de bord', shortLabel: 'Dashboard', Icon: ShieldIcon },
    { to: '/compte', label: 'Mon compte',       shortLabel: 'Compte',    Icon: UserIcon },
  ],
  GUEST: [
    { to: '/',          label: 'Accueil',    shortLabel: 'Accueil',  Icon: HomeIcon,   end: true },
    { to: '/recherche', label: 'Rechercher', shortLabel: 'Chercher', Icon: SearchIcon },
  ],
}

const ROLE_META = {
  CLIENT: { label: 'Client',         badge: 'bg-primary-100 text-primary-700' },
  WORKER: { label: 'Ouvrier',        badge: 'bg-amber-100 text-amber-700' },
  ADMIN:  { label: 'Administrateur', badge: 'bg-red-100 text-red-700' },
}

function getNav(role) {
  return NAV[role] ?? NAV.GUEST
}

// ─── Sidebar desktop ──────────────────────────────────────────────────────────

function Sidebar({ user, navItems, onLogout, onLogin, onRegister }) {
  const meta = user ? ROLE_META[user.role] : null

  return (
    <aside className="hidden md:flex fixed top-0 left-0 h-full w-[230px] flex-col border-r border-stone-200 bg-white z-40">

      {/* Logo */}
      <div className="flex items-center gap-2.5 border-b border-stone-100 px-5 py-[18px]">
        <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary-600 text-white text-xs font-bold">
          S
        </span>
        <span className="text-base font-bold text-stone-900">SamaOuvrier</span>
      </div>

      {/* Badge rôle */}
      {meta && (
        <div className="px-5 pt-4 pb-1">
          <span className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-semibold ${meta.badge}`}>
            {meta.label}
          </span>
        </div>
      )}

      {/* Navigation */}
      <nav className="flex flex-1 flex-col gap-0.5 overflow-y-auto px-3 py-3">
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.end ?? false}
            className={({ isActive }) =>
              `flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors ${
                item.cta
                  ? isActive
                    ? 'bg-primary-600 text-white shadow-sm'
                    : 'bg-primary-50 text-primary-700 hover:bg-primary-100'
                  : isActive
                    ? 'bg-stone-100 text-stone-900'
                    : 'text-stone-600 hover:bg-stone-50 hover:text-stone-900'
              }`
            }
          >
            <item.Icon />
            <span>{item.label}</span>
          </NavLink>
        ))}

        {/* Boutons guest */}
        {!user && (
          <div className="mt-3 flex flex-col gap-2 border-t border-stone-100 pt-3">
            <button
              onClick={onLogin}
              className="w-full rounded-xl border border-stone-300 px-3 py-2.5 text-sm font-medium text-stone-700 hover:bg-stone-50"
            >
              Se connecter
            </button>
            <button
              onClick={onRegister}
              className="w-full rounded-xl bg-primary-600 px-3 py-2.5 text-sm font-medium text-white hover:bg-primary-700"
            >
              Créer un compte
            </button>
          </div>
        )}
      </nav>

      {/* User info + déconnexion */}
      {user && (
        <div className="border-t border-stone-100 p-4">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary-100 text-sm font-bold text-primary-700">
              {user.nom?.charAt(0) ?? '?'}
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold text-stone-900">{user.nom}</p>
              <p className="truncate text-xs text-stone-400">{user.email}</p>
            </div>
          </div>
          <button
            onClick={onLogout}
            className="mt-3 flex w-full items-center gap-2 rounded-lg px-2 py-1.5 text-sm text-stone-500 hover:bg-stone-100 hover:text-red-600 transition-colors"
          >
            <LogOutIcon />
            Déconnexion
          </button>
        </div>
      )}
    </aside>
  )
}

// ─── Header mobile ───────────────────────────────────────────────────────────

function MobileHeader({ user, onLogin, onRegister }) {
  const meta = user ? ROLE_META[user.role] : null

  return (
    <header className="md:hidden sticky top-0 z-30 flex items-center justify-between border-b border-stone-100 bg-white px-4 py-3">
      <div className="flex items-center gap-2">
        <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary-600 text-white text-xs font-bold">
          S
        </span>
        <span className="font-bold text-stone-900">SamaOuvrier</span>
        {meta && (
          <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${meta.badge}`}>
            {meta.label}
          </span>
        )}
      </div>

      {user ? (
        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary-100 text-sm font-bold text-primary-700">
          {user.nom?.charAt(0) ?? '?'}
        </div>
      ) : (
        <div className="flex items-center gap-2">
          <button onClick={onLogin} className="text-sm font-medium text-stone-700">
            Connexion
          </button>
          <button
            onClick={onRegister}
            className="rounded-lg bg-primary-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-primary-700"
          >
            S'inscrire
          </button>
        </div>
      )}
    </header>
  )
}

// ─── Bottom nav mobile ────────────────────────────────────────────────────────

function MobileBottomNav({ navItems }) {
  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-30 flex border-t border-stone-100 bg-white">
      {navItems.map((item) => (
        <NavLink
          key={item.to}
          to={item.to}
          end={item.end ?? false}
          className={({ isActive }) =>
            `flex flex-1 flex-col items-center justify-center gap-0.5 py-2 text-[10px] font-medium leading-tight transition-colors ${
              isActive ? 'text-primary-700' : item.cta ? 'text-primary-600' : 'text-stone-500'
            }`
          }
        >
          {({ isActive }) => (
            <>
              {item.cta ? (
                <span
                  className={`-mt-3 flex h-10 w-10 items-center justify-center rounded-full shadow-md transition-colors ${
                    isActive ? 'bg-primary-700' : 'bg-primary-600'
                  }`}
                >
                  <item.Icon stroke="white" className="text-white" />
                </span>
              ) : (
                <item.Icon />
              )}
              <span>{item.shortLabel}</span>
            </>
          )}
        </NavLink>
      ))}
    </nav>
  )
}

// ─── Modal confirmation déconnexion ──────────────────────────────────────────

function LogoutConfirmModal({ onConfirm, onCancel }) {
  return (
    <div
      className="fixed inset-0 z-[3000] flex items-center justify-center bg-black/40 px-4"
      onClick={onCancel}
    >
      <div
        className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="text-base font-bold text-stone-900">Se déconnecter ?</h2>
        <p className="mt-1 text-sm text-stone-500">
          Vous devrez vous reconnecter pour accéder à votre compte.
        </p>
        <div className="mt-5 flex gap-3">
          <button
            onClick={onCancel}
            className="flex-1 rounded-xl border border-stone-300 py-2.5 text-sm font-medium text-stone-700 hover:bg-stone-50"
          >
            Annuler
          </button>
          <button
            onClick={onConfirm}
            className="flex-1 rounded-xl bg-red-600 py-2.5 text-sm font-medium text-white hover:bg-red-700"
          >
            Se déconnecter
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── Layout principal ─────────────────────────────────────────────────────────

export default function Layout() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const [confirmLogout, setConfirmLogout] = useState(false)

  const navItems = getNav(user?.role)

  const handleLogout = () => {
    logout()
    navigate('/connexion')
  }

  return (
    <div className="min-h-screen bg-sand-50">

      {/* Modal confirmation */}
      {confirmLogout && (
        <LogoutConfirmModal
          onConfirm={handleLogout}
          onCancel={() => setConfirmLogout(false)}
        />
      )}

      {/* Sidebar desktop */}
      <Sidebar
        user={user}
        navItems={navItems}
        onLogout={() => setConfirmLogout(true)}
        onLogin={() => navigate('/connexion')}
        onRegister={() => navigate('/inscription')}
      />

      {/* Header mobile */}
      <MobileHeader
        user={user}
        onLogin={() => navigate('/connexion')}
        onRegister={() => navigate('/inscription')}
      />

      {/* Contenu principal */}
      <main className="md:ml-[230px]">
        <div className="mx-auto w-full max-w-5xl px-4 py-5 pb-24 md:pb-8">
          <Outlet />
        </div>
      </main>

      {/* Bottom nav mobile */}
      <MobileBottomNav navItems={navItems} />
    </div>
  )
}
