import { Routes, Route, Navigate } from 'react-router-dom';
import AppLayout from './layouts/AppLayout';
import SplashScreen from './pages/SplashScreen/SplashScreen';
import LoginScreen from './pages/LoginScreen/LoginScreen';
import SignupScreen from './pages/SignupScreen/SignupScreen';
import OnboardingFlow from './pages/OnboardingFlow/OnboardingFlow';
import Dashboard from './pages/Dashboard/Dashboard';
import FindTeammates from './pages/FindTeammates/FindTeammates';
import ProfileScreen from './pages/ProfileScreen/ProfileScreen';

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<SplashScreen />} />
      <Route path="/login" element={<LoginScreen />} />
      <Route path="/signup" element={<SignupScreen />} />
      <Route path="/onboarding" element={<OnboardingFlow />} />
      <Route element={<AppLayout />}>
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/find" element={<FindTeammates />} />
        <Route path="/profile" element={<ProfileScreen />} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
