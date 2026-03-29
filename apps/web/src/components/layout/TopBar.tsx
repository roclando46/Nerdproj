import { useAuth } from '../../hooks/useAuth.js';

export function TopBar(): JSX.Element {
  const { user, logout } = useAuth();

  return (
    <header className="h-16 flex items-center justify-between px-6 bg-white border-b border-neutral-200 shrink-0">
      <div />

      <div className="flex items-center gap-3">
        {user && (
          <>
            <span className="text-sm text-neutral-600">{user.name ?? user.email}</span>
            <button
              onClick={logout}
              className="text-sm text-neutral-500 hover:text-neutral-900 transition-colors"
            >
              Sign out
            </button>
          </>
        )}
      </div>
    </header>
  );
}
