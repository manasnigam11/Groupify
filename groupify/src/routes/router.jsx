import { createBrowserRouter, Navigate } from 'react-router-dom';
import AppLayout from '../layouts/AppLayout';
import LandingPage from '../pages/LandingPage/LandingPage'; 
import LoginScreen from '../pages/LoginScreen/LoginScreen';
import SignupScreen from '../pages/SignupScreen/SignupScreen';
import OnboardingFlow from '../pages/OnboardingFlow/OnboardingFlow';
import Dashboard from '../pages/Dashboard/Dashboard';
import FindTeammates from '../pages/FindTeammates/FindTeammates';
import MatchResults from '../pages/MatchResults/MatchResults';
import ProfileScreen from '../pages/ProfileScreen/ProfileScreen';

export const router = createBrowserRouter([
  {
    path: '/',
    element: <LandingPage />, 
  },
  {
    path: '/login',
    element: <LoginScreen />,
  },
  {
    path: '/signup',
    element: <SignupScreen />,
  },
  {
    path: '/onboarding',
    element: <OnboardingFlow />,
  },
  {
    element: <AppLayout />,
    children: [
      {
        path: '/dashboard',
        element: <Dashboard />,
      },
      {
        path: '/find',
        element: <FindTeammates />,
      },
      {
        path: '/results/:matchId',
        element: <MatchResults />,
      },
      {
        path: '/profile',
        element: <ProfileScreen />,
      },
    ],
  },
  {
    path: '*',
    element: <Navigate to="/" replace />,
  },
]);