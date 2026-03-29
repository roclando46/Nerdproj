import axios, { type AxiosError } from 'axios';

export const apiClient = axios.create({
  baseURL: (import.meta.env['VITE_API_URL'] as string | undefined) ?? '/api/v1',
  headers: {
    'Content-Type': 'application/json',
  },
});

/**
 * Call this once Auth0 is initialised to inject the token getter.
 * The web app's main.tsx or useAuth hook calls this on mount.
 */
export function configureApiAuth(getAccessToken: () => Promise<string>): void {
  apiClient.interceptors.request.use(async (config) => {
    try {
      const token = await getAccessToken();
      config.headers['Authorization'] = `Bearer ${token}`;
    } catch {
      // Token fetch failed — request will proceed without auth and receive 401
    }
    return config;
  });
}

// Response error interceptor — standardises error handling
apiClient.interceptors.response.use(
  (response) => response,
  (error: AxiosError<{ message?: string; error?: string }>) => {
    const status = error.response?.status;
    const message = error.response?.data?.message ?? error.message;

    if (status === 401) {
      // Auth0 will handle re-login
      window.dispatchEvent(new CustomEvent('dcs:auth-error'));
    }

    return Promise.reject(new Error(message));
  },
);
