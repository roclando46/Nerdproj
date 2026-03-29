import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { format, differenceInDays } from 'date-fns';
import {
  ShieldCheckIcon,
  ExclamationTriangleIcon,
  ClockIcon,
  UserGroupIcon,
} from '@heroicons/react/24/outline';
import { apiClient } from '../../lib/api-client.js';

// ─── Types ────────────────────────────────────────────────────────────────────

interface MemberInfo {
  id: string;
  firstName: string;
  lastName: string;
  email: string | null;
  membershipNumber: string | null;
}

interface DashboardData {
  stats: { totalMembers: number; compliant: number; nonCompliant: number; pending: number };
  expiringDbs: Array<{ id: string; expiryDate: string; member: MemberInfo }>;
  overdueTraining: Array<{
    id: string;
    trainingType: string;
    expiryDate: string | null;
    member: MemberInfo;
  }>;
}

const TRAINING_LABELS: Record<string, string> = {
  SAFE_HANDS: 'ECB Safe Hands',
  WELFARE_OFFICER: 'Welfare Officer',
  FIRST_AID: 'First Aid',
  COACHING_LEVEL_1: 'Coaching L1',
  COACHING_LEVEL_2: 'Coaching L2',
  DBS_AWARENESS: 'DBS Awareness',
  CUSTOM: 'Custom',
};

function memberName(m: MemberInfo) {
  return `${m.firstName} ${m.lastName}`;
}

function StatCard({
  label,
  value,
  icon: Icon,
  bg,
}: {
  label: string;
  value: number;
  icon: React.ElementType;
  bg: string;
}) {
  return (
    <div className="card p-5 flex items-center gap-4">
      <div className={`rounded-full p-3 ${bg}`}>
        <Icon className="h-6 w-6 text-white" />
      </div>
      <div>
        <p className="text-2xl font-bold text-neutral-900">{value}</p>
        <p className="text-sm text-neutral-500">{label}</p>
      </div>
    </div>
  );
}

export function ComplianceDashboard(): JSX.Element {
  const { data, isLoading, error } = useQuery<DashboardData>({
    queryKey: ['compliance', 'dashboard'],
    queryFn: () => apiClient.get<DashboardData>('/compliance/dashboard').then((r) => r.data),
    refetchInterval: 60_000,
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600" />
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="rounded-lg bg-red-50 border border-red-200 p-4 text-red-700 text-sm">
        Failed to load compliance dashboard. Check the API is running.
      </div>
    );
  }

  const { stats, expiringDbs, overdueTraining } = data;
  const now = new Date();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-neutral-900">Compliance Overview</h1>
        <Link to="/compliance/dbs" className="btn-primary text-sm">
          Manage DBS Records
        </Link>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          label="Members tracked"
          value={stats.totalMembers}
          icon={UserGroupIcon}
          bg="bg-neutral-400"
        />
        <StatCard
          label="Compliant"
          value={stats.compliant}
          icon={ShieldCheckIcon}
          bg="bg-emerald-500"
        />
        <StatCard label="Pending" value={stats.pending} icon={ClockIcon} bg="bg-amber-500" />
        <StatCard
          label="Non-compliant"
          value={stats.nonCompliant}
          icon={ExclamationTriangleIcon}
          bg="bg-red-500"
        />
      </div>

      {/* DBS expiring soon */}
      {expiringDbs.length > 0 && (
        <div className="card overflow-hidden">
          <div className="px-4 py-3 border-b border-neutral-100 flex items-center justify-between bg-amber-50">
            <h2 className="font-medium text-neutral-900">DBS Records Expiring Within 90 Days</h2>
            <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-amber-100 text-amber-800">
              {expiringDbs.length}
            </span>
          </div>
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-xs text-neutral-500 uppercase tracking-wide border-b border-neutral-100">
                <th className="px-4 py-2 font-medium">Member</th>
                <th className="px-4 py-2 font-medium">Expiry Date</th>
                <th className="px-4 py-2 font-medium">Days Left</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-50">
              {expiringDbs.map((r) => {
                const expiry = new Date(r.expiryDate);
                const daysLeft = differenceInDays(expiry, now);
                return (
                  <tr key={r.id} className="hover:bg-neutral-50">
                    <td className="px-4 py-2.5">
                      <p className="font-medium text-neutral-900">{memberName(r.member)}</p>
                      <p className="text-xs text-neutral-400">{r.member.membershipNumber}</p>
                    </td>
                    <td className="px-4 py-2.5 text-neutral-700">
                      {format(expiry, 'dd MMM yyyy')}
                    </td>
                    <td className="px-4 py-2.5">
                      <span
                        className={`font-semibold ${daysLeft <= 30 ? 'text-red-600' : 'text-amber-600'}`}
                      >
                        {daysLeft}d
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          <div className="px-4 py-2.5 border-t border-neutral-100 bg-neutral-50">
            <Link to="/compliance/dbs" className="text-xs text-primary-600 hover:underline">
              View all DBS records →
            </Link>
          </div>
        </div>
      )}

      {/* Overdue training */}
      {overdueTraining.length > 0 && (
        <div className="card overflow-hidden">
          <div className="px-4 py-3 border-b border-neutral-100 flex items-center justify-between bg-red-50">
            <h2 className="font-medium text-neutral-900">Overdue Training</h2>
            <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-red-100 text-red-800">
              {overdueTraining.length}
            </span>
          </div>
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-xs text-neutral-500 uppercase tracking-wide border-b border-neutral-100">
                <th className="px-4 py-2 font-medium">Member</th>
                <th className="px-4 py-2 font-medium">Training</th>
                <th className="px-4 py-2 font-medium">Expired</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-50">
              {overdueTraining.map((r) => (
                <tr key={r.id} className="hover:bg-neutral-50">
                  <td className="px-4 py-2.5 font-medium text-neutral-900">
                    {memberName(r.member)}
                  </td>
                  <td className="px-4 py-2.5 text-neutral-700">
                    {TRAINING_LABELS[r.trainingType] ?? r.trainingType}
                  </td>
                  <td className="px-4 py-2.5 text-red-600 font-medium">
                    {r.expiryDate ? format(new Date(r.expiryDate), 'dd MMM yyyy') : '—'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <div className="px-4 py-2.5 border-t border-neutral-100 bg-neutral-50">
            <Link to="/compliance/training" className="text-xs text-primary-600 hover:underline">
              View all training records →
            </Link>
          </div>
        </div>
      )}

      {expiringDbs.length === 0 && overdueTraining.length === 0 && stats.totalMembers > 0 && (
        <div className="card p-10 text-center">
          <ShieldCheckIcon className="h-12 w-12 text-emerald-500 mx-auto mb-3" />
          <p className="font-semibold text-neutral-900">All clear</p>
          <p className="text-sm text-neutral-500 mt-1">
            No expiring DBS records or overdue training.
          </p>
        </div>
      )}

      {stats.totalMembers === 0 && (
        <div className="card p-10 text-center text-neutral-400">
          <p className="font-medium">No compliance records yet</p>
          <p className="text-sm mt-1">
            Add members and their DBS and training records to get started.
          </p>
        </div>
      )}
    </div>
  );
}
