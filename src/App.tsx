import { Route, Routes } from 'react-router-dom'
import { SiteLayout } from './components/SiteLayout'
import { ScrollToTop } from './components/ScrollToTop'
import { ProtectedRoute, AdminRoute } from './components/ProtectedRoute'
import { AuthProvider } from './context/AuthContext'
import { SiteProvider } from './context/SiteContext'
import { ToastProvider } from './context/ToastContext'
import { AboutPage } from './pages/AboutPage'
import { AdminComments } from './pages/admin/AdminComments'
import { AdminDashboard } from './pages/admin/AdminDashboard'
import { AdminLayout } from './pages/admin/AdminLayout'
import { AdminPosts } from './pages/admin/AdminPosts'
import { AdminSettings } from './pages/admin/AdminSettings'
import { AdminUsers } from './pages/admin/AdminUsers'
import { AuthPage } from './pages/AuthPage'
import { AuthorPage } from './pages/AuthorPage'
import { DashboardPage } from './pages/DashboardPage'
import { ExplorePage } from './pages/ExplorePage'
import { HomePage } from './pages/HomePage'
import { NotFoundPage } from './pages/NotFoundPage'
import { PostPage } from './pages/PostPage'
import { SettingsPage } from './pages/SettingsPage'
import { WritePage } from './pages/WritePage'

export default function App() {
  return (
    <ToastProvider>
      <AuthProvider>
        <SiteProvider>
          <ScrollToTop />
          <Routes>
            <Route path="/login" element={<AuthPage mode="login" />} />
            <Route path="/register" element={<AuthPage mode="register" />} />

            <Route element={<ProtectedRoute />}>
              <Route path="/write" element={<WritePage />} />
              <Route path="/write/:id" element={<WritePage />} />
            </Route>

            <Route path="/" element={<SiteLayout />}>
              <Route index element={<HomePage />} />
              <Route path="explore" element={<ExplorePage />} />
              <Route path="post/:slug" element={<PostPage />} />
              <Route path="u/:username" element={<AuthorPage />} />
              <Route path="about" element={<AboutPage />} />
              <Route element={<ProtectedRoute />}>
                <Route path="dashboard" element={<DashboardPage />} />
                <Route path="settings" element={<SettingsPage />} />
              </Route>
              <Route path="*" element={<NotFoundPage />} />
            </Route>

            <Route element={<AdminRoute />}>
              <Route path="/admin" element={<AdminLayout />}>
                <Route index element={<AdminDashboard />} />
                <Route path="posts" element={<AdminPosts />} />
                <Route path="comments" element={<AdminComments />} />
                <Route path="users" element={<AdminUsers />} />
                <Route path="settings" element={<AdminSettings />} />
                <Route path="*" element={<NotFoundPage />} />
              </Route>
            </Route>
          </Routes>
        </SiteProvider>
      </AuthProvider>
    </ToastProvider>
  )
}
