import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth0 } from '@auth0/auth0-react';

export function CallbackPage(): JSX.Element {
  const { isAuthenticated, isLoading, error } = useAuth0();
  const navigate = useNavigate();

  useEffect(() => {
    if (!isLoading && isAuthenticated) {
      navigate('/dashboard', { replace: true });
    }
  }, [isAuthenticated, isLoading, navigate]);

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-neutral-50">
        <div className="card p-6 text-center">
          <p className="text-red-600 font-medium">Authentication failed</p>
          <p className="text-sm text-neutral-500 mt-1">{error.message}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-neutral-50">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600" />
    </div>
  );
}
