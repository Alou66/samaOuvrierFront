import { useState } from 'react'
import { NavLink, Outlet, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import {
  HomeIcon, ListIcon, UserIcon, SearchIcon,
  PlusIcon, DashboardIcon, LogOutIcon, ShieldIcon,
} from './Icons'

// ─── Config navigation par rôle ──────────────────────────────────────────────

const NAV = {
  CLIENT: [
    { to: '/',                  label: 'Tableau de bord',  shortLabel: 'Accueil',  Icon: HomeIcon,      end: true },
    { to: '/demandes',          label: 'Mes demandes',     shortLabel: 'Demandes', Icon: ListIcon },
    { to: '/nouvelle-demande',  label: 'Nouvelle demande', shortLabel: 'Nouveau',  Icon: PlusIcon,      cta: true },
    { to: '/compte',            label: 'Mon compte',       shortLabel: 'Compte',   Icon: UserIcon },
  ],
  WORKER: [
    { to: '/ouvrier/dashboard', label: 'Tableau de bord', shortLabel: 'Dashboard', Icon: DashboardIcon },
    { to: '/ouvrier/missions',  label: 'Mes missions',    shortLabel: 'Missions',  Icon: ListIcon },
    { to: '/compte',            label: 'Mon compte',      shortLabel: 'Compte',    Icon: UserIcon },
  ],
  ADMIN: [
    {
      to: '/admin', label: 'Tableau de bord', shortLabel: 'Dashboard', Icon: ShieldIcon,
      children: [
        { to: '/admin/ouvriers', label: 'Ouvriers' },
        { to: '/admin/clients',  label: 'Clients' },
        { to: '/admin/demandes', label: 'Demandes' },
        { to: '/admin/missions', label: 'Missions' },
        { to: '/admin/avis',     label: 'Avis' },
        { to: '/admin/villes',   label: 'Villes' },
        { to: '/admin/metiers',  label: 'Métiers' },
      ],
    },
    { to: '/compte', label: 'Mon compte', shortLabel: 'Compte', Icon: UserIcon },
  ],
  GUEST: [
    { to: '/',          label: 'Accueil',    shortLabel: 'Accueil',  Icon: HomeIcon,   end: true },
    { to: '/recherche', label: 'Rechercher', shortLabel: 'Chercher', Icon: SearchIcon },
  ],
}

const ROLE_META = {
  CLIENT: { label: 'Client',         dot: 'bg-primary-500', badge: 'bg-primary-50 text-primary-700 ring-1 ring-primary-200' },
  WORKER: { label: 'Ouvrier',        dot: 'bg-amber-500',   badge: 'bg-amber-50 text-amber-700 ring-1 ring-amber-200' },
  ADMIN:  { label: 'Administrateur', dot: 'bg-red-500',     badge: 'bg-red-50 text-red-700 ring-1 ring-red-200' },
}

const AVATAR_BG = {
  CLIENT: 'bg-primary-100 text-primary-700',
  WORKER: 'bg-amber-100 text-amber-700',
  ADMIN:  'bg-red-100 text-red-700',
}

function getNav(role) { return NAV[role] ?? NAV.GUEST }

// ─── Modal confirmation déconnexion ──────────────────────────────────────────

function LogoutConfirmModal({ onConfirm, onCancel }) {
  return (
    <div
      className="fixed inset-0 z-[3000] flex items-center justify-center bg-black/50 px-4 backdrop-blur-sm"
      onClick={onCancel}
    >
      <div
        className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-full bg-red-100">
          <LogOutIcon className="text-red-600" />
        </div>
        <h2 className="text-base font-bold text-stone-900">Se déconnecter ?</h2>
        <p className="mt-1 text-sm text-stone-500">
          Vous devrez vous reconnecter pour accéder à votre espace.
        </p>
        <div className="mt-5 flex gap-3">
          <button
            onClick={onCancel}
            className="flex-1 rounded-xl border border-stone-200 py-2.5 text-sm font-medium text-stone-700 transition hover:bg-stone-50"
          >
            Annuler
          </button>
          <button
            onClick={onConfirm}
            className="flex-1 rounded-xl bg-red-600 py-2.5 text-sm font-medium text-white transition hover:bg-red-700"
          >
            Se déconnecter
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── Sidebar desktop ──────────────────────────────────────────────────────────

function Sidebar({ user, navItems, onLogout, onLogin, onRegister }) {
  const meta      = user ? ROLE_META[user.role] : null
  const avatarBg  = user ? (AVATAR_BG[user.role] ?? 'bg-stone-100 text-stone-700') : ''

  return (
    <aside className="fixed left-0 top-0 z-40 hidden h-full w-[240px] flex-col border-r border-stone-100 bg-white shadow-sm md:flex">

      {/* Logo */}
      <div className="flex items-center gap-3 px-5 py-5">
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-primary-600 shadow-sm">
          <span className="text-sm font-bold text-white">S</span>
        </div>
        <div>
          <span className="text-sm font-bold text-stone-900">Sama</span>
          <span className="text-sm font-bold text-primary-600">Ouvrier</span>
        </div>
      </div>

      {/* Profil utilisateur connecté */}
      {user && meta && (
        <div className="mx-3 mb-2 rounded-xl border border-stone-100 bg-stone-50 p-3">
          <div className="flex items-center gap-2.5">
            <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-sm font-bold ${avatarBg}`}>
              {user.nom?.charAt(0).toUpperCase() ?? '?'}
            </div>
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold text-stone-900">{user.nom}</p>
              <span className={`inline-block rounded-full px-2 py-0.5 text-[10px] font-semibold ${meta.badge}`}>
                {meta.label}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Navigation */}
      <nav className="flex flex-1 flex-col gap-0.5 overflow-y-auto px-3 py-2">
        {navItems.map((item) => (
          <div key={item.to}>
            <NavLink
              to={item.to}
              end={item.end ?? false}
              className={({ isActive }) =>
                `group relative flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all ${
                  item.cta
                    ? isActive
                      ? 'bg-primary-600 text-white shadow-sm'
                      : 'bg-primary-50 text-primary-700 hover:bg-primary-100'
                    : isActive
                      ? 'bg-primary-50 text-primary-700'
                      : 'text-stone-500 hover:bg-stone-50 hover:text-stone-800'
                }`
              }
            >
              {({ isActive }) => (
                <>
                  {/* Bordure active gauche */}
                  {!item.cta && isActive && (
                    <span className="absolute left-0 top-1/2 h-5 w-0.5 -translate-y-1/2 rounded-full bg-primary-600" />
                  )}
                  <item.Icon />
                  <span>{item.label}</span>
                </>
              )}
            </NavLink>

            {/* Sous-menu (ex. sections de l'admin sous "Tableau de bord") */}
            {item.children && (
              <div className="ml-[18px] mt-0.5 flex flex-col gap-0.5 border-l border-stone-100 pl-4">
                {item.children.map((child) => (
                  <NavLink
                    key={child.to}
                    to={child.to}
                    className={({ isActive }) =>
                      `rounded-lg px-2.5 py-1.5 text-[13px] font-medium transition-colors ${
                        isActive ? 'text-primary-700 bg-primary-50' : 'text-stone-500 hover:bg-stone-50 hover:text-stone-800'
                      }`
                    }
                  >
                    {child.label}
                  </NavLink>
                ))}
              </div>
            )}
          </div>
        ))}

        {/* Boutons guest */}
        {!user && (
          <div className="mt-4 flex flex-col gap-2 border-t border-stone-100 pt-4">
            <button
              onClick={onLogin}
              className="w-full rounded-xl border border-stone-200 px-3 py-2.5 text-sm font-medium text-stone-700 transition hover:bg-stone-50"
            >
              Se connecter
            </button>
            <button
              onClick={onRegister}
              className="w-full rounded-xl bg-primary-600 px-3 py-2.5 text-sm font-medium text-white transition hover:bg-primary-700"
            >
              Créer un compte
            </button>
          </div>
        )}
      </nav>

      {/* Déconnexion */}
      {user && (
        <div className="border-t border-stone-100 p-3">
          <button
            onClick={onLogout}
            className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2.5 text-sm font-medium text-stone-500 transition hover:bg-red-50 hover:text-red-600"
          >
            <LogOutIcon />
            <span>Déconnexion</span>
          </button>
        </div>
      )}
    </aside>
  )
}

// ─── Header mobile ────────────────────────────────────────────────────────────

function MobileHeader({ user, onLogin, onRegister, onAvatarClick }) {
  const meta     = user ? ROLE_META[user.role] : null
  const avatarBg = user ? (AVATAR_BG[user.role] ?? 'bg-stone-100 text-stone-700') : ''

  return (
    <header className="sticky top-0 z-30 flex items-center justify-between border-b border-stone-100 bg-white/95 px-4 py-3 backdrop-blur-sm md:hidden">
      {/* Logo */}
      <div className="flex items-center gap-2">
        <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary-600">
          <span className="text-xs font-bold text-white">S</span>
        </div>
        <div>
          <span className="text-sm font-bold text-stone-900">Sama</span>
          <span className="text-sm font-bold text-primary-600">Ouvrier</span>
        </div>
        {meta && (
          <span className={`ml-1 rounded-full px-2 py-0.5 text-[10px] font-semibold ${meta.badge}`}>
            {meta.label}
          </span>
        )}
      </div>

      {/* Avatar / Boutons guest */}
      {user ? (
        <button
          onClick={onAvatarClick}
          className={`flex h-8 w-8 items-center justify-center rounded-full text-sm font-bold ring-2 ring-stone-100 transition hover:ring-primary-300 ${avatarBg}`}
          title="Mon compte"
        >
          {user.nom?.charAt(0).toUpperCase() ?? '?'}
        </button>
      ) : (
        <div className="flex items-center gap-2">
          <button
            onClick={onLogin}
            className="text-sm font-medium text-stone-700 transition hover:text-primary-600"
          >
            Connexion
          </button>
          <button
            onClick={onRegister}
            className="rounded-lg bg-primary-600 px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-primary-700"
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
    <nav className="fixed bottom-0 left-0 right-0 z-30 flex border-t border-stone-100 bg-white/95 backdrop-blur-sm md:hidden">
      {navItems.map((item) => (
        <NavLink
          key={item.to}
          to={item.to}
          end={item.end ?? false}
          className={({ isActive }) =>
            `relative flex flex-1 flex-col items-center justify-center gap-1 py-2.5 text-[11px] font-semibold leading-none transition-colors ${
              item.cta
                ? 'text-primary-600'
                : isActive
                  ? 'text-primary-700'
                  : 'text-stone-400 hover:text-stone-600'
            }`
          }
        >
          {({ isActive }) => (
            <>
              {/* Barre active en haut */}
              {!item.cta && isActive && (
                <span className="absolute top-0 left-1/2 h-0.5 w-6 -translate-x-1/2 rounded-full bg-primary-600" />
              )}

              {item.cta ? (
                <span className={`-mt-4 flex h-12 w-12 items-center justify-center rounded-2xl shadow-lg transition-transform active:scale-95 ${
                  isActive ? 'bg-primary-700' : 'bg-primary-600'
                }`}>
                  <item.Icon stroke="white" />
                </span>
              ) : (
                <span className={`flex h-7 w-7 items-center justify-center rounded-xl transition-colors ${
                  isActive ? 'bg-primary-50' : ''
                }`}>
                  <item.Icon />
                </span>
              )}

              <span className={item.cta ? 'mt-1' : ''}>{item.shortLabel}</span>
            </>
          )}
        </NavLink>
      ))}
    </nav>
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
    <div className="min-h-screen bg-stone-50">

      {confirmLogout && (
        <LogoutConfirmModal
          onConfirm={handleLogout}
          onCancel={() => setConfirmLogout(false)}
        />
      )}

      <Sidebar
        user={user}
        navItems={navItems}
        onLogout={() => setConfirmLogout(true)}
        onLogin={() => navigate('/connexion')}
        onRegister={() => navigate('/inscription')}
      />

      <MobileHeader
        user={user}
        onLogin={() => navigate('/connexion')}
        onRegister={() => navigate('/inscription')}
        onAvatarClick={() => navigate('/compte')}
      />

      <main className="md:ml-[240px]">
        <div className="mx-auto w-full max-w-5xl px-4 py-5 pb-28 md:pb-8">
          <Outlet />
        </div>
      </main>

      <MobileBottomNav navItems={navItems} />
    </div>
  )
}
