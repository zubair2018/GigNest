import { BrowserRouter, Navigate, Route, Routes, useLocation } from 'react-router-dom'

import { AuthProvider, useAuth } from './context/AuthContext'
import { SavedListingsProvider } from './context/SavedListingsContext'
import Navbar from './components/Navbar'
import AuthPage from './pages/AuthPage'
import VerifyEmail from './pages/VerifyEmail'

import Home from './pages/Home'
import PostJob from './pages/PostJob'
import PostSkill from './pages/PostSkill'
import EditJob from './pages/Editjob'
import EditSkill from './pages/EditSkill'
import JobDetail from './pages/JobDetail'
import MyJobs from './pages/MyJobs'
import MySkills from './pages/MySkills'
import SavedJobs from './pages/SavedJobs'
import Messages from './pages/Messages'
import Chat from './pages/Chat'

import './gigspot.css'

export default function App() {
  return (
    <AuthProvider>
      <SavedListingsProvider>
        <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
          <Navbar />

          <Routes>
            <Route path="/" element={<Home />} />

            <Route path="/signin" element={<AuthPage mode="signin" />} />
            <Route path="/signup" element={<AuthPage mode="signup" />} />
            <Route path="/forgot-password" element={<AuthPage mode="reset" />} />
            <Route path="/verify-email" element={<VerifyEmail />} />

            <Route path="/post-job" element={<RequireUser verified><PostJob /></RequireUser>} />
            <Route path="/post-skill" element={<RequireUser verified><PostSkill /></RequireUser>} />

            <Route path="/edit/:id" element={<RequireUser verified><EditJob /></RequireUser>} />
            <Route path="/edit-skill/:id" element={<RequireUser verified><EditSkill /></RequireUser>} />

            <Route path="/job/:id" element={<JobDetail />} />

            <Route path="/my-jobs" element={<RequireUser><MyJobs /></RequireUser>} />
            <Route path="/my-skills" element={<RequireUser><MySkills /></RequireUser>} />

            <Route path="/saved" element={<RequireUser><SavedJobs /></RequireUser>} />
            <Route path="/messages" element={<RequireUser><Messages /></RequireUser>} />
            <Route path="/chat/:chatId" element={<RequireUser verified><Chat /></RequireUser>} />

            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </BrowserRouter>
      </SavedListingsProvider>
    </AuthProvider>
  )
}

function RequireUser({ children, verified = false }) {
  const { user } = useAuth()
  const location = useLocation()
  const returnTo = `${location.pathname}${location.search}${location.hash}`

  if (!user) {
    return (
      <Navigate
        to={`/signin?returnTo=${encodeURIComponent(returnTo)}`}
        replace
      />
    )
  }

  if (verified && !user.emailVerified) {
    return (
      <Navigate
        to={`/verify-email?returnTo=${encodeURIComponent(returnTo)}`}
        replace
      />
    )
  }

  return children
}