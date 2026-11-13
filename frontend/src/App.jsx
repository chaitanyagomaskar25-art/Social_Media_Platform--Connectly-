import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider } from './context/ThemeContext';
import { AuthProvider } from './context/AuthContext';
import { SocketProvider } from './context/SocketContext';
import { ToastProvider } from './context/ToastContext';
import ProtectedRoute from './components/common/ProtectedRoute';
import PublicRoute from './components/common/PublicRoute';
import AppLayout from './components/layout/AppLayout';

// Pages
import LandingPage from './pages/LandingPage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import FeedPage from './pages/FeedPage';
import ExplorePage from './pages/ExplorePage';
import ProfilePage from './pages/ProfilePage';
import PostDetailPage from './pages/PostDetailPage';
import NotFoundPage from './pages/NotFoundPage';
import Notifications from './pages/Notification';
import SavedPage from './pages/SavedPage';
import SettingsPage from './pages/SettingsPage';
import AdminPage from './pages/AdminPage';
import StoriesPage from './pages/StoriesPage';
import AnalyticsPage from './pages/AnalyticsPage';
import MessagesPage from './pages/MessagesPage';

export default function App() {
  return (
    <ThemeProvider>
      <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
        <ToastProvider>
          <AuthProvider>
            <SocketProvider>
              <Routes>
              {/* Landing page accessible to all */}
              <Route path="/" element={<LandingPage />} />

              {/* Public-only routes: redirect to /feed if already logged in */}
              <Route element={<PublicRoute />}>
                <Route path="/login" element={<LoginPage />} />
                <Route path="/register" element={<RegisterPage />} />
              </Route>

              {/* Authenticated application routes */}
              <Route element={<ProtectedRoute />}>
                <Route element={<AppLayout />}>
                  <Route path="/feed" element={<FeedPage />} />
                  <Route path="/explore" element={<ExplorePage />} />
                  <Route path="/profile/:id" element={<ProfilePage />} />
                  <Route path="/profile" element={<ProfilePage />} />
                  <Route path="/posts/:id" element={<PostDetailPage />} />
                  <Route path="/notifications" element={<Notifications />} />
                  <Route path="/messages" element={<MessagesPage />} />
                  <Route path="/saved" element={<SavedPage />} />
                  <Route path="/collections/:collectionId" element={<SavedPage />} />
                  <Route path="/settings" element={<SettingsPage />} />
                  <Route path="/stories" element={<StoriesPage />} />
                  <Route path="/analytics" element={<AnalyticsPage />} />
                  <Route path="/admin" element={<AdminPage />} />
                </Route>
              </Route>

              {/* 404 Fallback */}
              <Route path="/404" element={<NotFoundPage />} />
              <Route path="*" element={<Navigate to="/404" replace />} />
            </Routes>
          </SocketProvider>
        </AuthProvider>
      </ToastProvider>
    </BrowserRouter>
  </ThemeProvider>
  );
}
