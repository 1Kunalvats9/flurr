import { router } from 'expo-router';
import { createContext, type ReactNode, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { isAxiosError } from 'axios';
import { getSessionToken, loadSessionToken, setSessionToken } from '@/utils/auth-token';
import { useApi } from '@/utils/api';

type ProfileState = {
  name: string;
  pronouns: string;
  email: string;
  avatar_url: string | null;
  era: number;
  onboarding_complete: boolean;
};

interface OnboardingState {
  name: string;
  pronouns: string;
  email: string;
  intentions: string[];
  match_types: string[];
  era: number;
  is_bipoc: boolean | null;
  presentation: string;
  presentation_preferences: string[];
  archetype: string;
  archetype_preferences: string[];
}

export type MatchRecord = {
  id: string;
  clerk_id: string;
  name: string | null;
  pronouns: string | null;
  email: string | null;
  avatar_url: string | null;
  era: number | null;
  intentions: string[];
  match_types: string[];
  presentation?: string | null;
  archetype?: string | null;
  compatibility_score: number;
  compatibility_raw?: number;
};

type ActionResult = {
  ok: boolean;
  error?: string;
  redirectTo?: 'signup' | 'login';
  onboardingComplete?: boolean;
};

type UserContextValue = {
  sessionToken: string | null;
  isAuthReady: boolean;
  hasHydratedUser: boolean;
  isAuthenticated: boolean;
  isAuthLoading: boolean;
  authError: string | null;
  profile: ProfileState;
  onboarding: OnboardingState;
  intentions: string[];
  matchTypes: string[];
  isBipoc: boolean | null;
  presentation: string;
  presentationPreferences: string[];
  archetype: string;
  archetypePreferences: string[];
  matches: MatchRecord[];
  isHydratingUser: boolean;
  isRefreshingMatches: boolean;
  isCompletingOnboarding: boolean;
  onboardingError: string | null;
  signUp: (email: string, password: string) => Promise<ActionResult>;
  signIn: (email: string, password: string) => Promise<ActionResult>;
  signOut: () => void;
  setName: (name: string) => void;
  setPronouns: (pronouns: string | string[]) => void;
  setEmail: (email: string) => void;
  setEra: (era: number) => void;
  setIntentions: (intentions: string[]) => void;
  setMatchTypes: (matchTypes: string[]) => void;
  setIsBipoc: (value: boolean | null) => void;
  setPresentation: (value: string) => void;
  setPresentationPreferences: (value: string[]) => void;
  setArchetype: (value: string) => void;
  setArchetypePreferences: (value: string[]) => void;
  hydrateUser: () => Promise<void>;
  refreshMatches: () => Promise<void>;
  completeOnboarding: (eraOverride?: number) => Promise<ActionResult>;
};

const DEFAULT_PROFILE: ProfileState = {
  name: '',
  pronouns: '',
  email: '',
  avatar_url: null,
  era: 50,
  onboarding_complete: false,
};

const DEFAULT_ONBOARDING_STATE: OnboardingState = {
  name: '',
  pronouns: '',
  email: '',
  intentions: [],
  match_types: [],
  era: 50,
  is_bipoc: null,
  presentation: '',
  presentation_preferences: [],
  archetype: '',
  archetype_preferences: [],
};

const UserContext = createContext<UserContextValue | undefined>(undefined);

function normalizeStringArray(value: unknown): string[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value.filter((item): item is string => typeof item === 'string').map((item) => item.trim()).filter(Boolean);
}

function normalizeString(value: unknown): string {
  return typeof value === 'string' ? value.trim() : '';
}

function normalizePronouns(pronouns: string | string[]) {
  if (Array.isArray(pronouns)) {
    return pronouns.map((item) => item.trim()).filter(Boolean).join(' / ');
  }

  return pronouns.trim();
}

function isValidEmail(email: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function getErrorMessage(error: unknown, fallback = 'Something went wrong. Please try again.') {
  if (isAxiosError(error)) {
    const serverMessage = error.response?.data?.error;
    if (typeof serverMessage === 'string' && serverMessage.trim().length > 0) {
      return serverMessage;
    }

    if (typeof error.message === 'string' && error.message.trim().length > 0) {
      return error.message;
    }
  }

  return fallback;
}

type MeResponse = {
  exists: boolean;
  profile?: Partial<ProfileState>;
  preferences?: {
    intentions?: string[];
    match_types?: string[];
    is_bipoc?: boolean | null;
    presentation?: string | null;
    presentation_preferences?: string[];
    archetype?: string | null;
    archetype_preferences?: string[];
  } | null;
};

export function UserProvider({ children }: { children: ReactNode }) {
  const api = useApi();
  const [sessionTokenState, setSessionTokenState] = useState<string | null>(null);
  const [isAuthReady, setIsAuthReady] = useState(false);
  const [hasHydratedUser, setHasHydratedUser] = useState(false);
  const [isAuthLoading, setIsAuthLoading] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);
  const [profile, setProfile] = useState<ProfileState>(DEFAULT_PROFILE);
  const [onboarding, setOnboarding] = useState<OnboardingState>(DEFAULT_ONBOARDING_STATE);
  const [matches, setMatches] = useState<MatchRecord[]>([]);
  const [isHydratingUser, setIsHydratingUser] = useState(false);
  const [isRefreshingMatches, setIsRefreshingMatches] = useState(false);
  const [isCompletingOnboarding, setIsCompletingOnboarding] = useState(false);
  const [onboardingError, setOnboardingError] = useState<string | null>(null);
  const isRefreshingMatchesRef = useRef(false);

  const setToken = useCallback((token: string | null) => {
    setSessionTokenState(token);
    setHasHydratedUser(!token);
    setSessionToken(token);
  }, []);

  const resetUserState = useCallback(() => {
    setAuthError(null);
    setOnboardingError(null);
    setProfile(DEFAULT_PROFILE);
    setOnboarding(DEFAULT_ONBOARDING_STATE);
    setMatches([]);
  }, []);

  const clearSession = useCallback(() => {
    isRefreshingMatchesRef.current = false;
    setIsHydratingUser(false);
    setIsRefreshingMatches(false);
    setIsCompletingOnboarding(false);
    setToken(null);
    setHasHydratedUser(true);
    resetUserState();
  }, [resetUserState, setToken]);

  const applyHydratedUser = useCallback((data: MeResponse) => {
    if (!(data?.exists && data.profile)) {
      return false;
    }

    const hydratedProfile = data.profile;
    const preferences = data.preferences;

    setProfile((prev) => ({
      ...prev,
      name: normalizeString(hydratedProfile.name) || prev.name,
      pronouns: normalizeString(hydratedProfile.pronouns) || prev.pronouns,
      email: normalizeString(hydratedProfile.email) || prev.email,
      avatar_url:
        typeof hydratedProfile.avatar_url === 'string' || hydratedProfile.avatar_url === null
          ? hydratedProfile.avatar_url
          : prev.avatar_url,
      era: Number(hydratedProfile.era ?? prev.era),
      onboarding_complete: Boolean(hydratedProfile.onboarding_complete),
    }));

    setOnboarding((prev) => ({
      ...prev,
      name: normalizeString(hydratedProfile.name) || prev.name,
      pronouns: normalizeString(hydratedProfile.pronouns) || prev.pronouns,
      email: normalizeString(hydratedProfile.email) || prev.email,
      era: Number(hydratedProfile.era ?? prev.era),
      intentions: preferences ? normalizeStringArray(preferences.intentions) : prev.intentions,
      match_types: preferences ? normalizeStringArray(preferences.match_types) : prev.match_types,
      is_bipoc:
        preferences && ('is_bipoc' in preferences)
          ? typeof preferences.is_bipoc === 'boolean'
            ? preferences.is_bipoc
            : null
          : prev.is_bipoc,
      presentation: preferences ? normalizeString(preferences.presentation) : prev.presentation,
      presentation_preferences: preferences
        ? normalizeStringArray(preferences.presentation_preferences)
        : prev.presentation_preferences,
      archetype: preferences ? normalizeString(preferences.archetype) : prev.archetype,
      archetype_preferences: preferences
        ? normalizeStringArray(preferences.archetype_preferences)
        : prev.archetype_preferences,
    }));

    return Boolean(hydratedProfile.onboarding_complete);
  }, []);

  const hydrateUser = useCallback(async () => {
    if (!getSessionToken()) {
      setIsHydratingUser(false);
      setHasHydratedUser(true);
      return;
    }

    setIsHydratingUser(true);

    try {
      const { data } = await api.get<MeResponse>('/api/users/me');
      if (!data?.exists) {
        clearSession();
        return;
      }

      applyHydratedUser(data);
    } catch (error) {
      console.warn('Failed to hydrate user data', error);
      clearSession();
      return;
    } finally {
      setIsHydratingUser(false);
      setHasHydratedUser(true);
    }
  }, [api, applyHydratedUser, clearSession]);

  const refreshMatches = useCallback(async () => {
    if (!getSessionToken() || isRefreshingMatchesRef.current) {
      return;
    }

    isRefreshingMatchesRef.current = true;
    setIsRefreshingMatches(true);

    try {
      const { data } = await api.get<{ matches?: MatchRecord[] }>('/api/matches');
      const nextMatches = Array.isArray(data?.matches) ? data.matches : [];
      const sorted = [...nextMatches].sort((a, b) => (b.compatibility_score || 0) - (a.compatibility_score || 0));
      setMatches(sorted);
    } catch (error) {
      if (isAxiosError(error) && (error.response?.status === 401 || error.response?.status === 403)) {
        clearSession();
        return;
      }

      console.warn('Failed to refresh matches', error);
    } finally {
      isRefreshingMatchesRef.current = false;
      setIsRefreshingMatches(false);
    }
  }, [api, clearSession]);

  const signUp = useCallback(
    async (email: string, password: string): Promise<ActionResult> => {
      const normalizedEmail = email.trim().toLowerCase();

      if (!isValidEmail(normalizedEmail)) {
        const error = 'Enter a valid email address.';
        setAuthError(error);
        return { ok: false, error };
      }

      if (password.trim().length < 8) {
        const error = 'Password must be at least 8 characters.';
        setAuthError(error);
        return { ok: false, error };
      }

      setAuthError(null);
      setIsAuthLoading(true);

      try {
        const { data } = await api.post<{ token: string }>('/api/auth/signup', {
          email: normalizedEmail,
          password: password.trim(),
        });

        if (!data?.token) {
          throw new Error('Missing token in signup response');
        }

        setToken(data.token);
        setProfile((prev) => ({ ...prev, email: normalizedEmail }));
        setOnboarding((prev) => ({ ...prev, email: normalizedEmail }));
        setHasHydratedUser(true);
        return { ok: true };
      } catch (error) {
        if (isAxiosError(error) && error.response?.status === 409) {
          const message = 'Account already exists. Redirecting to login.';
          setAuthError(message);
          return { ok: false, error: message, redirectTo: 'login' };
        }

        const message = getErrorMessage(error, 'Could not create your account.');
        setAuthError(message);
        return { ok: false, error: message };
      } finally {
        setIsAuthLoading(false);
      }
    },
    [api, setToken]
  );

  const signIn = useCallback(
    async (email: string, password: string): Promise<ActionResult> => {
      const normalizedEmail = email.trim().toLowerCase();

      if (!isValidEmail(normalizedEmail)) {
        const error = 'Enter a valid email address.';
        setAuthError(error);
        return { ok: false, error };
      }

      if (password.trim().length < 8) {
        const error = 'Password must be at least 8 characters.';
        setAuthError(error);
        return { ok: false, error };
      }

      setAuthError(null);
      setIsAuthLoading(true);
      let hasStoredToken = false;

      try {
        const { data } = await api.post<{ token: string }>('/api/auth/login', {
          email: normalizedEmail,
          password: password.trim(),
        });

        if (!data?.token) {
          throw new Error('Missing token in login response');
        }

        setToken(data.token);
        hasStoredToken = true;
        const { data: meData } = await api.get<MeResponse>('/api/users/me');

        if (!meData?.exists) {
          clearSession();
          const message = 'This session is no longer valid. Please sign in again.';
          setAuthError(message);
          return { ok: false, error: message };
        }

        const onboardingComplete = applyHydratedUser(meData);
        await refreshMatches();
        setHasHydratedUser(true);
        return { ok: true, onboardingComplete };
      } catch (error) {
        if (hasStoredToken) {
          clearSession();
        }

        if (isAxiosError(error) && error.response?.status === 404) {
          const message = 'No account found. Redirecting to signup.';
          setAuthError(message);
          return { ok: false, error: message, redirectTo: 'signup' };
        }

        const message = getErrorMessage(error, 'Could not finish logging in. Please try again.');
        setAuthError(message);
        return { ok: false, error: message };
      } finally {
        setIsAuthLoading(false);
      }
    },
    [api, applyHydratedUser, clearSession, refreshMatches, setToken]
  );

  const signOut = useCallback(() => {
    clearSession();
  }, [clearSession]);

  const completeOnboarding = useCallback(
    async (eraOverride?: number): Promise<ActionResult> => {
      if (!getSessionToken()) {
        const error = 'Create an account first.';
        setOnboardingError(error);
        return { ok: false, error };
      }

      const name = onboarding.name.trim();
      const pronouns = onboarding.pronouns.trim();
      const email = onboarding.email.trim().toLowerCase();
      const resolvedEra = Number.isFinite(eraOverride) ? Number(eraOverride) : onboarding.era;

      if (name.length < 2) {
        const error = 'Name must be at least 2 characters.';
        setOnboardingError(error);
        return { ok: false, error };
      }

      if (pronouns.length < 2) {
        const error = 'Pronouns are required.';
        setOnboardingError(error);
        return { ok: false, error };
      }

      if (!isValidEmail(email)) {
        const error = 'Enter a valid email address.';
        setOnboardingError(error);
        return { ok: false, error };
      }

      if (onboarding.intentions.length === 0) {
        const error = 'Choose at least one intention.';
        setOnboardingError(error);
        return { ok: false, error };
      }

      if (onboarding.match_types.length === 0) {
        const error = 'Choose at least one match goal.';
        setOnboardingError(error);
        return { ok: false, error };
      }

      if (onboarding.is_bipoc === null) {
        const error = 'Choose how you identify.';
        setOnboardingError(error);
        return { ok: false, error };
      }

      if (onboarding.presentation.length === 0) {
        const error = 'Choose a presentation.';
        setOnboardingError(error);
        return { ok: false, error };
      }

      if (onboarding.presentation_preferences.length === 0) {
        const error = 'Choose at least one presentation preference.';
        setOnboardingError(error);
        return { ok: false, error };
      }

      if (onboarding.archetype.length === 0) {
        const error = 'Choose an archetype.';
        setOnboardingError(error);
        return { ok: false, error };
      }

      if (onboarding.archetype_preferences.length === 0) {
        const error = 'Choose at least one archetype preference.';
        setOnboardingError(error);
        return { ok: false, error };
      }

      setOnboardingError(null);
      setIsCompletingOnboarding(true);

      try {
        await api.post('/api/users/profile', {
          name,
          pronouns,
          email,
        });

        await api.post('/api/users/preferences', {
          intentions: onboarding.intentions,
          match_types: onboarding.match_types,
          era: resolvedEra,
          is_bipoc: onboarding.is_bipoc,
          presentation: onboarding.presentation,
          presentation_preferences: onboarding.presentation_preferences,
          archetype: onboarding.archetype,
          archetype_preferences: onboarding.archetype_preferences,
        });

        setProfile((prev) => ({
          ...prev,
          name,
          pronouns,
          email,
          era: resolvedEra,
          onboarding_complete: true,
        }));
        setOnboarding((prev) => ({ ...prev, era: resolvedEra }));
        await refreshMatches();
        router.replace('/home');

        return { ok: true };
      } catch (error) {
        const message = getErrorMessage(error, 'Could not complete onboarding.');
        setOnboardingError(message);
        return { ok: false, error: message };
      } finally {
        setIsCompletingOnboarding(false);
      }
    },
    [api, onboarding, refreshMatches]
  );

  useEffect(() => {
    let isMounted = true;

    const bootstrapSession = async () => {
      const storedToken = await loadSessionToken();

      if (!isMounted) {
        return;
      }

      setSessionTokenState(storedToken);
      setHasHydratedUser(!storedToken);
      setIsAuthReady(true);
    };

    void bootstrapSession();

    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    if (!isAuthReady) {
      return;
    }

    if (!sessionTokenState) {
      setIsHydratingUser(false);
      return;
    }

    void hydrateUser();
  }, [hydrateUser, isAuthReady, sessionTokenState]);

  const value = useMemo<UserContextValue>(
    () => ({
      sessionToken: sessionTokenState,
      isAuthReady,
      hasHydratedUser,
      isAuthenticated: Boolean(sessionTokenState),
      isAuthLoading,
      authError,
      profile,
      onboarding,
      intentions: onboarding.intentions,
      matchTypes: onboarding.match_types,
      isBipoc: onboarding.is_bipoc,
      presentation: onboarding.presentation,
      presentationPreferences: onboarding.presentation_preferences,
      archetype: onboarding.archetype,
      archetypePreferences: onboarding.archetype_preferences,
      matches,
      isHydratingUser,
      isRefreshingMatches,
      isCompletingOnboarding,
      onboardingError,
      signUp,
      signIn,
      signOut,
      setName: (name) => {
        setProfile((prev) => ({ ...prev, name }));
        setOnboarding((prev) => ({ ...prev, name }));
      },
      setPronouns: (pronouns) => {
        const normalized = normalizePronouns(pronouns);
        setProfile((prev) => ({ ...prev, pronouns: normalized }));
        setOnboarding((prev) => ({ ...prev, pronouns: normalized }));
      },
      setEmail: (email) => {
        setProfile((prev) => ({ ...prev, email }));
        setOnboarding((prev) => ({ ...prev, email }));
      },
      setEra: (era) => {
        setProfile((prev) => ({ ...prev, era }));
        setOnboarding((prev) => ({ ...prev, era }));
      },
      setIntentions: (intentions) => setOnboarding((prev) => ({ ...prev, intentions })),
      setMatchTypes: (matchTypes) => setOnboarding((prev) => ({ ...prev, match_types: matchTypes })),
      setIsBipoc: (value) => setOnboarding((prev) => ({ ...prev, is_bipoc: value })),
      setPresentation: (value) => setOnboarding((prev) => ({ ...prev, presentation: value })),
      setPresentationPreferences: (value) =>
        setOnboarding((prev) => ({ ...prev, presentation_preferences: value })),
      setArchetype: (value) => setOnboarding((prev) => ({ ...prev, archetype: value })),
      setArchetypePreferences: (value) => setOnboarding((prev) => ({ ...prev, archetype_preferences: value })),
      hydrateUser,
      refreshMatches,
      completeOnboarding,
    }),
    [
      sessionTokenState,
      isAuthReady,
      hasHydratedUser,
      isAuthLoading,
      authError,
      profile,
      onboarding,
      matches,
      isHydratingUser,
      isRefreshingMatches,
      isCompletingOnboarding,
      onboardingError,
      signUp,
      signIn,
      signOut,
      hydrateUser,
      refreshMatches,
      completeOnboarding,
    ]
  );

  return <UserContext.Provider value={value}>{children}</UserContext.Provider>;
}

export function useUser() {
  const context = useContext(UserContext);

  if (!context) {
    throw new Error('useUser must be used within a UserProvider');
  }

  return context;
}
