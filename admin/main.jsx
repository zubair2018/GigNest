import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter, Route, Routes } from 'react-router-dom'
import { AuthProvider } from '../src/context/AuthContext'
import AuthPage from '../src/pages/AuthPage'
import Admin from '../src/pages/Admin'
import VerifyEmail from '../src/pages/VerifyEmail'
import FirebaseConfigError from '../src/components/FirebaseConfigError'
import { firebaseConfigError } from '../src/firebase/config'
import '../src/index.css'
import '../src/gigspot.css'

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    {firebaseConfigError ? <FirebaseConfigError message={firebaseConfigError} /> : (
      <AuthProvider>
        <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
          <Routes>
            <Route path="/signin" element={<AuthPage mode="signin" internalOnly />} />
            <Route path="/verify-email" element={<VerifyEmail />} />
            <Route path="*" element={<Admin />} />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    )}
  </React.StrictMode>
)
