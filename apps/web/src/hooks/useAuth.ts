import { useAuth0 } from '@auth0/auth0-react';
import { useEffect } from 'react';
import { configureApiAuth } from '../lib/api-client.js';

export function useAuth() {
  const { isAuthenticated, isLoading, user, loginWithRedirect, logout, getAccessTokenSilently } =
    useAuth0();

  // Wire up the API client with the token getter on first authenticated render
  useEffect(() => {
    if (isAuthenticated) {
      configureApiAuth(() =>
        getAccessTokenSilently({
          authorizationParams: {
            audience: import.meta.env['VITE_AUTH0_AUDIENCE'] as string,
          },
        }),
      );
    }
  }, [isAuthenticated, getAccessTokenSilently]);

  return {
    isAuthenticated,
    isLoading,
    user,
    login: () => loginWithRedirect(),
    logout: () => logout({ logoutParams: { returnTo: window.location.origin } }),
  };
}
