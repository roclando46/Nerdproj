import { useAuth } from '../../hooks/useAuth.js';
import { ShieldCheckIcon } from '@heroicons/react/24/outline';

const auth0Configured =
  import.meta.env['VITE_AUTH0_CLIENT_ID'] &&
  import.meta.env['VITE_AUTH0_CLIENT_ID'] !== 'CHANGE_ME_AUTH0_CLIENT_ID';

export function LoginPage(): JSX.Element {
  const { login } = useAuth();

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-neutral-50 px-4">
      <div className="card p-8 w-full max-w-sm text-center">
        <div className="flex justify-center mb-4">
          <ShieldCheckIcon className="h-12 w-12 text-primary-600" />
        </div>
        <h1 className="text-xl font-semibold text-neutral-900 mb-1">Digital Club Secretary</h1>
        <p className="text-sm text-neutral-500 mb-6">Compliance, grants & fixtures for UK clubs</p>

        {auth0Configured ? (
          <button onClick={login} className="btn-primary w-full">
            Sign in
          </button>
        ) : (
          <div className="rounded-lg bg-amber-50 border border-amber-200 p-3 text-left">
            <p className="text-sm font-medium text-amber-800">Auth0 not configured</p>
            <p className="text-xs text-amber-700 mt-1">
              Add your Auth0 credentials to{' '}
              <code className="font-mono bg-amber-100 px-1 rounded">apps/web/.env</code> to enable
              login.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
