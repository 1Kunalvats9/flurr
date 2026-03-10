import axios from 'axios';
import { useMemo } from 'react';
import { BACKEND_BASE_API_URL } from '@/constants/config';
import { getSessionToken } from '@/utils/auth-token';

export function useApi() {
  const client = useMemo(() => {
    const nextClient = axios.create({
      baseURL: BACKEND_BASE_API_URL,
    });

    nextClient.interceptors.request.use((config) => {
      const token = getSessionToken();

      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }

      return config;
    });

    return nextClient;
  }, []);

  return client;
}
