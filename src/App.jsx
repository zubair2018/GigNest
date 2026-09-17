import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext'
import Navbar from './components/Navbar'
import Home from './pages/Home'
import PostJob from './pages/PostJob'
import PostSkill from './pages/PostSkill'
import EditJob from './pages/EditJob'
import JobDetail from './pages/JobDetail'
import MyJobs from './pages/MyJobs'
import SavedJobs from './pages/SavedJobs'
import Messages from './pages/Messages'
import Chat from './pages/Chat'
import Admin from './pages/Admin'

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Navbar />
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/post-job" element={<PostJob />} />
          <Route path="/post-skill" element={<PostSkill />} />
          <Route path="/edit/:id" element={<EditJob />} />
          <Route path="/job/:id" element={<JobDetail />} />
          <Route path="/my-jobs" element={<MyJobs />} />
          <Route path="/saved" element={<SavedJobs />} />
          <Route path="/messages" element={<Messages />} />
          <Route path="/chat/:chatId" element={<Chat />} />
          <Route path="/admin" element={<Admin />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  )
}