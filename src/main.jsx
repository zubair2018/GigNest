import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import FirebaseConfigError from './components/FirebaseConfigError'
import { firebaseConfigError } from './firebase/config'
import './index.css'

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    {firebaseConfigError
      ? <FirebaseConfigError message={firebaseConfigError} />
      : <App />}
  </React.StrictMode>
)