import { Redirect, Stack, useSegments } from 'expo-router';
import { useUser } from '@/context/UserContext';

export default function OnboardingLayout() {
  const segments = useSegments();
  const { isAuthReady, hasHydratedUser, isAuthenticated, profile } = useUser();
  const currentRoute = segments[segments.length - 1];
  const publicRoutes = new Set(['email', 'code']);
  const isPublicRoute = typeof currentRoute === 'string' && publicRoutes.has(currentRoute);

  if (!isAuthReady || (isAuthenticated && !hasHydratedUser)) {
    return null;
  }

  if (!isAuthenticated && !isPublicRoute) {
    return <Redirect href="/" />;
  }

  if (isAuthenticated && profile.onboarding_complete) {
    return <Redirect href="/home" />;
  }

  if (isAuthenticated && isPublicRoute) {
    return <Redirect href="/onboarding/profile-details" />;
  }

  return <Stack screenOptions={{ headerShown: false, animation: 'fade' }} />;
}
