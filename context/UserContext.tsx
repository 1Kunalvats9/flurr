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
  compatibility_score: number;
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
  intentions: string[];
  matchTypes: string[];
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

const UserContext = createContext<UserContextValue | undefined>(undefined);

function normalizeStringArray(value: unknown): string[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value.filter((item): item is string => typeof item === 'string').map((item) => item.trim()).filter(Boolean);
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
  const [intentions, setIntentions] = useState<string[]>([]);
  const [matchTypes, setMatchTypes] = useState<string[]>([]);
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

  const applyHydratedUser = useCallback((data: MeResponse) => {
    if (!(data?.exists && data.profile)) {
      return false;
    }

    const hydratedProfile = data.profile;

    setProfile((prev) => ({
      ...prev,
      name: (hydratedProfile.name || prev.name) as string,
      pronouns: (hydratedProfile.pronouns || prev.pronouns) as string,
      email: (hydratedProfile.email || prev.email) as string,
      avatar_url:
        typeof hydratedProfile.avatar_url === 'string' || hydratedProfile.avatar_url === null
          ? hydratedProfile.avatar_url
          : prev.avatar_url,
      era: Number(hydratedProfile.era ?? prev.era),
      onboarding_complete: Boolean(hydratedProfile.onboarding_complete),
    }));

    if (data.preferences) {
      setIntentions(normalizeStringArray(data.preferences.intentions));
      setMatchTypes(normalizeStringArray(data.preferences.match_types));
    }

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
      applyHydratedUser(data);
    } catch (error) {
      console.warn('Failed to hydrate user data', error);
    } finally {
      setIsHydratingUser(false);
      setHasHydratedUser(true);
    }
  }, [api, applyHydratedUser]);

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
      console.warn('Failed to refresh matches', error);
    } finally {
      isRefreshingMatchesRef.current = false;
      setIsRefreshingMatches(false);
    }
  }, [api]);

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

      try {
        const { data } = await api.post<{ token: string }>('/api/auth/login', {
          email: normalizedEmail,
          password: password.trim(),
        });

        if (!data?.token) {
          throw new Error('Missing token in login response');
        }

        setToken(data.token);
        const { data: meData } = await api.get<MeResponse>('/api/users/me');
        const onboardingComplete = applyHydratedUser(meData);
        await refreshMatches();
        setHasHydratedUser(true);
        return { ok: true, onboardingComplete };
      } catch (error) {
        if (isAxiosError(error) && error.response?.status === 404) {
          const message = 'No account found. Redirecting to signup.';
          setAuthError(message);
          return { ok: false, error: message, redirectTo: 'signup' };
        }

        const message = getErrorMessage(error, 'Could not log in.');
        setAuthError(message);
        return { ok: false, error: message };
      } finally {
        setIsAuthLoading(false);
      }
    },
    [api, applyHydratedUser, refreshMatches, setToken]
  );

  const signOut = useCallback(() => {
    setToken(null);
    setHasHydratedUser(true);
    setAuthError(null);
    setOnboardingError(null);
    setProfile(DEFAULT_PROFILE);
    setIntentions([]);
    setMatchTypes([]);
    setMatches([]);
  }, [setToken]);

  const completeOnboarding = useCallback(
    async (eraOverride?: number): Promise<ActionResult> => {
      if (!getSessionToken()) {
        const error = 'Create an account first.';
        setOnboardingError(error);
        return { ok: false, error };
      }

      const name = profile.name.trim();
      const pronouns = profile.pronouns.trim();
      const email = profile.email.trim().toLowerCase();
      const resolvedEra = Number.isFinite(eraOverride) ? Number(eraOverride) : profile.era;

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

      if (intentions.length === 0) {
        const error = 'Choose at least one intention.';
        setOnboardingError(error);
        return { ok: false, error };
      }

      if (matchTypes.length === 0) {
        const error = 'Choose at least one match goal.';
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
          intentions,
          match_types: matchTypes,
          era: resolvedEra,
        });

        setProfile((prev) => ({ ...prev, era: resolvedEra, onboarding_complete: true }));
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
    [api, intentions, matchTypes, profile.email, profile.era, profile.name, profile.pronouns, refreshMatches]
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
      intentions,
      matchTypes,
      matches,
      isHydratingUser,
      isRefreshingMatches,
      isCompletingOnboarding,
      onboardingError,
      signUp,
      signIn,
      signOut,
      setName: (name) => setProfile((prev) => ({ ...prev, name })),
      setPronouns: (pronouns) => setProfile((prev) => ({ ...prev, pronouns: normalizePronouns(pronouns) })),
      setEmail: (email) => setProfile((prev) => ({ ...prev, email })),
      setEra: (era) => setProfile((prev) => ({ ...prev, era })),
      setIntentions,
      setMatchTypes,
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
      intentions,
      matchTypes,
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
