export function DashboardPage(): JSX.Element {
  return (
    <div>
      <h1 className="text-2xl font-semibold text-neutral-900 mb-6">Dashboard</h1>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {['Compliance', 'Grant Writer', 'Fixtures'].map((module) => (
          <div key={module} className="card p-6">
            <h2 className="font-medium text-neutral-700">{module}</h2>
            <p className="text-sm text-neutral-400 mt-1">Implementation coming soon</p>
          </div>
        ))}
      </div>
    </div>
  );
}
