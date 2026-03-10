import * as SecureStore from 'expo-secure-store';

let sessionToken: string | null = null;
const SESSION_TOKEN_KEY = 'flurr_session_token';

async function persistSessionToken(token: string | null) {
  try {
    if (token) {
      await SecureStore.setItemAsync(SESSION_TOKEN_KEY, token);
      return;
    }

    await SecureStore.deleteItemAsync(SESSION_TOKEN_KEY);
  } catch (error) {
    // Non-blocking by design; token stays in memory for the current session.
  }
}

export function setSessionToken(token: string | null) {
  sessionToken = token;
  void persistSessionToken(token);
}

export function getSessionToken() {
  return sessionToken;
}

export async function loadSessionToken() {
  if (sessionToken) {
    return sessionToken;
  }

  try {
    sessionToken = await SecureStore.getItemAsync(SESSION_TOKEN_KEY);
    return sessionToken;
  } catch (error) {
    return null;
  }
}
