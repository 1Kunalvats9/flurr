import { Redirect } from 'expo-router';
import { useUser } from '@/context/UserContext';
import HomeScreen from '@/screens/HomeScreen';

export default function HomeRoute() {
  const { isAuthReady, hasHydratedUser, isAuthenticated, profile } = useUser();

  if (!isAuthReady || !hasHydratedUser) {
    return null;
  }

  if (!isAuthenticated) {
    return <Redirect href="/" />;
  }

  if (!profile.onboarding_complete) {
    return <Redirect href="/onboarding/profile-details" />;
  }

  return <HomeScreen />;
}
