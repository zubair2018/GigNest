import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext'
import Navbar from './components/Navbar'
import Home from './pages/Home'
import PostJob from './pages/PostJob'
import EditJob from './pages/EditJob'
import JobDetail from './pages/JobDetail'
import MyJobs from './pages/MyJobs'
import SavedJobs from './pages/SavedJobs'

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Navbar />
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/post" element={<PostJob />} />
          <Route path="/edit/:id" element={<EditJob />} />
          <Route path="/job/:id" element={<JobDetail />} />
          <Route path="/my-jobs" element={<MyJobs />} />
          <Route path="/saved" element={<SavedJobs />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  )
}
