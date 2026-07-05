import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext'
import { TripProvider } from './context/TripContext'
import { NewRequestModalProvider } from './context/NewRequestModalContext'
import Layout from './components/Layout'
import NewRequestModal from './components/NewRequestModal'
import ProtectedRoute from './components/ProtectedRoute'
import Recherche from './pages/Recherche'
import WorkerProfile from './pages/WorkerProfile'
import RequestIntervention from './pages/RequestIntervention'
import Account from './pages/Account'
import Login from './pages/auth/Login'
import Register from './pages/auth/Register'
import ClientDashboard from './pages/client/ClientDashboard'
import ClientRequests from './pages/client/ClientRequests'
import NewRequest from './pages/client/NewRequest'
import WorkerDashboard from './pages/worker/WorkerDashboard'
import WorkerMissions from './pages/worker/WorkerMissions'
import AdminDashboard from './pages/admin/AdminDashboard'

export default function App() {
  return (
    <AuthProvider>
      <TripProvider>
        <BrowserRouter>
          <NewRequestModalProvider>
            <Routes>

              {/* ── Pages auth — sans sidebar ──────────────────────────────── */}
              <Route path="/connexion"  element={<Login />} />
              <Route path="/inscription" element={<Register />} />

              {/* ── Pages publiques sans sidebar ───────────────────────────── */}
              <Route path="/nouvelle-demande" element={<NewRequest />} />

              {/* ── Pages app — avec sidebar ───────────────────────────────── */}
              <Route element={<Layout />}>

                {/* CLIENT */}
                <Route
                  index
                  element={<ProtectedRoute allowedRoles={['CLIENT']}><ClientDashboard /></ProtectedRoute>}
                />
                <Route
                  path="demandes"
                  element={<ProtectedRoute allowedRoles={['CLIENT']}><ClientRequests /></ProtectedRoute>}
                />
                <Route
                  path="ouvrier/:id/demande"
                  element={<ProtectedRoute allowedRoles={['CLIENT']}><RequestIntervention /></ProtectedRoute>}
                />

                {/* WORKER */}
                <Route
                  path="ouvrier/dashboard"
                  element={<ProtectedRoute allowedRoles={['WORKER']}><WorkerDashboard /></ProtectedRoute>}
                />
                <Route
                  path="ouvrier/missions"
                  element={<ProtectedRoute allowedRoles={['WORKER']}><WorkerMissions /></ProtectedRoute>}
                />

                {/* ADMIN — /admin redirige vers la première section ; le sous-menu de la
                    sidebar et la barre d'onglets mobile naviguent vers /admin/:tab */}
                <Route
                  path="admin"
                  element={<ProtectedRoute allowedRoles={['ADMIN']}><Navigate to="/admin/ouvriers" replace /></ProtectedRoute>}
                />
                <Route
                  path="admin/:tab"
                  element={<ProtectedRoute allowedRoles={['ADMIN']}><AdminDashboard /></ProtectedRoute>}
                />

                {/* Commun */}
                <Route
                  path="compte"
                  element={<ProtectedRoute><Account /></ProtectedRoute>}
                />

                {/* Publiques */}
                <Route path="recherche" element={<Recherche />} />
                <Route path="ouvrier/:id" element={<WorkerProfile />} />

                {/* Toute route inconnue redirige vers l'accueil */}
                <Route path="*" element={<Navigate to="/" replace />} />

              </Route>
            </Routes>
            <NewRequestModal />
          </NewRequestModalProvider>
        </BrowserRouter>
      </TripProvider>
    </AuthProvider>
  )
}
