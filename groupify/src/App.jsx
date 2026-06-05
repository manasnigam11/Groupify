import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import AppLayout from './layouts/AppLayout';
import LandingPage from './pages/LandingPage/LandingPage';
import SplashScreen from './pages/SplashScreen/SplashScreen';
import LoginScreen from './pages/LoginScreen/LoginScreen';
import SignupScreen from './pages/SignupScreen/SignupScreen';
import OnboardingFlow from './pages/OnboardingFlow/OnboardingFlow';
import Dashboard from './pages/Dashboard/Dashboard';
import FindTeammates from './pages/FindTeammates/FindTeammates';
import ProfileScreen from './pages/ProfileScreen/ProfileScreen';
import EditProfile from './pages/EditProfile/EditProfile';
import MyTeamScreen from './pages/MyTeamScreen/MyTeamScreen';
import ChatsScreen from './pages/ChatsScreen/ChatsScreen';
import CreateProject from './pages/CreateProject/CreateProject';

export default function App() {
  const { loading, user } = useAuth();

  // Jab tak user verify ho raha hai, tab tak background me wait karega
  if (loading) {
    return (
      <div style={{ display: 'flex', height: '100vh', justifyContent: 'center', alignItems: 'center', backgroundColor: 'var(--bg-dark)', color: 'white' }}>
        <h2>Loading Groupify...</h2>
      </div>
    );
  }

  return (
    <Routes>
      {/* Public Routes */}
      <Route path="/" element={user ? <Navigate to="/dashboard" replace /> : <LandingPage />} />
      <Route path="/splash" element={<SplashScreen />} />
      <Route path="/login" element={user ? <Navigate to="/dashboard" replace /> : <LoginScreen />} />
      <Route path="/signup" element={user ? <Navigate to="/dashboard" replace /> : <SignupScreen />} />
      
      {/* Onboarding */}
      <Route path="/onboarding" element={user ? <OnboardingFlow /> : <Navigate to="/login" replace />} />

      {/* Protected Routes (AppLayout ke andar) */}
      <Route element={<AppLayout />}>
        <Route path="/dashboard" element={user ? <Dashboard /> : <Navigate to="/login" replace />} />
        <Route path="/find" element={user ? <FindTeammates /> : <Navigate to="/login" replace />} />
        <Route path="/profile" element={user ? <ProfileScreen /> : <Navigate to="/login" replace />} />
        <Route path="/profile/:userId" element={user ? <ProfileScreen /> : <Navigate to="/login" replace />} />
        <Route path="/edit-profile" element={user ? <EditProfile /> : <Navigate to="/login" replace />} />
        <Route path="/team" element={user ? <MyTeamScreen /> : <Navigate to="/login" replace />} />
        <Route path="/projects/create" element={user ? <CreateProject /> : <Navigate to="/login" replace />} />
        <Route path="/projects/:id/edit" element={user ? <CreateProject /> : <Navigate to="/login" replace />} />
        <Route path="/chats" element={user ? <ChatsScreen /> : <Navigate to="/login" replace />} />
      </Route>

      {/* Catch-all: Agar route match na ho, toh homepage pe bhejo */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}