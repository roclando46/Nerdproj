import { Outlet } from 'react-router-dom';
import { Sidebar } from './Sidebar.js';
import { TopBar } from './TopBar.js';

export function AppShell(): JSX.Element {
  return (
    <div className="flex h-screen bg-neutral-50">
      <Sidebar />
      <div className="flex flex-col flex-1 overflow-hidden">
        <TopBar />
        <main className="flex-1 overflow-y-auto p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
