import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext'
import { TripProvider } from './context/TripContext'
import Layout from './components/Layout'
import ProtectedRoute from './components/ProtectedRoute'
import ClientDashboard from './pages/client/ClientDashboard'
import Recherche from './pages/Recherche'
import WorkerProfile from './pages/WorkerProfile'
import RequestIntervention from './pages/RequestIntervention'
import Account from './pages/Account'
import Login from './pages/auth/Login'
import Register from './pages/auth/Register'
import ClientRequests from './pages/client/ClientRequests'
import NewRequest from './pages/client/NewRequest'
import WorkerDashboard from './pages/worker/WorkerDashboard'
import AdminDashboard from './pages/admin/AdminDashboard'

export default function App() {
  return (
    <AuthProvider>
      <TripProvider>
        <BrowserRouter>
          <Routes>

            {/* ── Pages auth — sans sidebar ──────────────────────────────── */}
            <Route path="/connexion" element={<Login />} />
            <Route path="/inscription" element={<Register />} />

            {/* ── Pages app — avec sidebar ───────────────────────────────── */}
            <Route element={<Layout />}>

              {/* Protégées : redirigent vers /connexion si non connecté */}
              <Route
                index
                element={<ProtectedRoute><ClientDashboard /></ProtectedRoute>}
              />
              <Route
                path="demandes"
                element={<ProtectedRoute><ClientRequests /></ProtectedRoute>}
              />
              <Route path="nouvelle-demande" element={<NewRequest />} />
              <Route
                path="ouvrier/:id/demande"
                element={<ProtectedRoute><RequestIntervention /></ProtectedRoute>}
              />
              <Route
                path="ouvrier/dashboard"
                element={<ProtectedRoute><WorkerDashboard /></ProtectedRoute>}
              />
              <Route
                path="admin"
                element={<ProtectedRoute><AdminDashboard /></ProtectedRoute>}
              />
              <Route
                path="compte"
                element={<ProtectedRoute><Account /></ProtectedRoute>}
              />

              {/* Publiques : accessibles sans compte */}
              <Route path="recherche" element={<Recherche />} />
              <Route path="ouvrier/:id" element={<WorkerProfile />} />

            </Route>
          </Routes>
        </BrowserRouter>
      </TripProvider>
    </AuthProvider>
  )
}
