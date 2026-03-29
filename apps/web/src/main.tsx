import React from 'react';
import ReactDOM from 'react-dom/client';
import { Auth0Provider } from '@auth0/auth0-react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { BrowserRouter } from 'react-router-dom';
import { AppRouter } from './router/index.js';
import './styles/globals.css';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes
      retry: 1,
    },
  },
});

const auth0Domain = (import.meta.env['VITE_AUTH0_DOMAIN'] as string | undefined) ?? '';
const auth0ClientId = (import.meta.env['VITE_AUTH0_CLIENT_ID'] as string | undefined) ?? '';
const auth0Audience = (import.meta.env['VITE_AUTH0_AUDIENCE'] as string | undefined) ?? '';

const auth0Configured =
  auth0Domain &&
  auth0Domain !== 'your-tenant.uk.auth0.com' &&
  auth0ClientId &&
  auth0ClientId !== 'CHANGE_ME_AUTH0_CLIENT_ID';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <Auth0Provider
      domain={auth0Configured ? auth0Domain : 'placeholder.auth0.com'}
      clientId={auth0Configured ? auth0ClientId : 'placeholder'}
      authorizationParams={{
        redirect_uri: `${window.location.origin}/callback`,
        audience: auth0Audience,
        scope: 'openid profile email',
      }}
    >
      <QueryClientProvider client={queryClient}>
        <BrowserRouter>
          <AppRouter />
        </BrowserRouter>
        {import.meta.env.DEV && <ReactQueryDevtools initialIsOpen={false} />}
      </QueryClientProvider>
    </Auth0Provider>
  </React.StrictMode>,
);
