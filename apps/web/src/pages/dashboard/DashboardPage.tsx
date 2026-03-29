import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { format } from 'date-fns';
import {
  ShieldCheckIcon,
  DocumentTextIcon,
  CalendarDaysIcon,
  ArrowRightIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
} from '@heroicons/react/24/outline';
import { apiClient } from '../../lib/api-client.js';

// ─── Types ────────────────────────────────────────────────────────────────────

interface ComplianceDashboard {
  stats: {
    totalMembers: number;
    compliant: number;
    nonCompliant: number;
    pending: number;
  };
  expiringDbs: unknown[];
  overdueTraining: unknown[];
}

interface Application {
  id: string;
  status: string;
  grant: {
    name: string;
    funderName: string;
    closeDate: string | null;
  };
}

interface PagedApplications {
  data: Application[];
  total: number;
}

interface Fixture {
  id: string;
  fixtureDate: string;
  kickoffTime: string | null;
  homeTeamName: string;
  awayTeamName: string;
  isHomeFixture: boolean;
  status: string;
  _count: { volunteerAssignments: number };
}

interface UpcomingFixtures {
  data: Fixture[];
}

// ─── Skeleton ─────────────────────────────────────────────────────────────────

function Skeleton() {
  return (
    <div className="space-y-2 animate-pulse">
      <div className="h-8 w-24 bg-neutral-200 rounded" />
      <div className="h-4 w-40 bg-neutral-100 rounded" />
      <div className="h-4 w-32 bg-neutral-100 rounded" />
    </div>
  );
}

// ─── Cards ────────────────────────────────────────────────────────────────────

function ComplianceCard() {
  const { data, isLoading, isError } = useQuery<ComplianceDashboard>({
    queryKey: ['dashboard', 'compliance'],
    queryFn: () => apiClient.get<ComplianceDashboard>('/compliance/dashboard').then((r) => r.data),
  });

  const expiring = data?.expiringDbs.length ?? 0;

  return (
    <div className="card p-6 flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="rounded-full p-2 bg-emerald-100">
            <ShieldCheckIcon className="h-5 w-5 text-emerald-600" />
          </div>
          <span className="font-semibold text-neutral-800">Compliance</span>
        </div>
        <Link to="/compliance" className="text-neutral-400 hover:text-neutral-600">
          <ArrowRightIcon className="h-4 w-4" />
        </Link>
      </div>

      {isLoading ? (
        <Skeleton />
      ) : isError || !data ? (
        <p className="text-sm text-neutral-400">Could not load data</p>
      ) : (
        <>
          <div>
            <p className="text-3xl font-bold text-neutral-900">
              {data.stats.compliant}
              <span className="text-lg font-normal text-neutral-400">
                /{data.stats.totalMembers}
              </span>
            </p>
            <p className="text-sm text-neutral-500">members compliant</p>
          </div>
          <p className="text-xs text-neutral-400">
            {data.stats.nonCompliant} non-compliant · {data.stats.pending} pending
          </p>
          <div className="border-t border-neutral-100 pt-3">
            {expiring > 0 ? (
              <span className="flex items-center gap-1.5 text-xs text-amber-700">
                <ExclamationTriangleIcon className="h-3.5 w-3.5" />
                {expiring} DBS expiring within 90 days
              </span>
            ) : (
              <span className="flex items-center gap-1.5 text-xs text-emerald-600">
                <CheckCircleIcon className="h-3.5 w-3.5" />
                All DBS up to date
              </span>
            )}
          </div>
        </>
      )}
    </div>
  );
}

function GrantWriterCard() {
  const { data, isLoading, isError } = useQuery<PagedApplications>({
    queryKey: ['dashboard', 'grants'],
    queryFn: () =>
      apiClient.get<PagedApplications>('/grants/applications?limit=100').then((r) => r.data),
  });

  const applications = data?.data ?? [];
  const inProgress = applications.filter((a) => a.status === 'IN_PROGRESS').length;
  const submitted = applications.filter((a) => a.status === 'SUBMITTED').length;
  const awarded = applications.filter((a) => a.status === 'AWARDED').length;

  const soonest = applications
    .filter((a) => a.status === 'IN_PROGRESS' && a.grant.closeDate)
    .sort(
      (a, b) => new Date(a.grant.closeDate!).getTime() - new Date(b.grant.closeDate!).getTime(),
    )[0];

  return (
    <div className="card p-6 flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="rounded-full p-2 bg-blue-100">
            <DocumentTextIcon className="h-5 w-5 text-blue-600" />
          </div>
          <span className="font-semibold text-neutral-800">Grant Writer</span>
        </div>
        <Link to="/grants" className="text-neutral-400 hover:text-neutral-600">
          <ArrowRightIcon className="h-4 w-4" />
        </Link>
      </div>

      {isLoading ? (
        <Skeleton />
      ) : isError || !data ? (
        <p className="text-sm text-neutral-400">Could not load data</p>
      ) : (
        <>
          <div>
            <p className="text-3xl font-bold text-neutral-900">{data.total}</p>
            <p className="text-sm text-neutral-500">applications</p>
          </div>
          <p className="text-xs text-neutral-400">
            {inProgress} in progress · {submitted} submitted · {awarded} awarded
          </p>
          <div className="border-t border-neutral-100 pt-3">
            {soonest ? (
              <span className="text-xs text-neutral-500">
                Next deadline:{' '}
                <span className="font-medium text-neutral-700">
                  {format(new Date(soonest.grant.closeDate!), 'dd MMM yyyy')}
                </span>
              </span>
            ) : (
              <span className="text-xs text-neutral-400">No active deadlines</span>
            )}
          </div>
        </>
      )}
    </div>
  );
}

function FixturesCard() {
  const { data, isLoading, isError } = useQuery<UpcomingFixtures>({
    queryKey: ['dashboard', 'fixtures'],
    queryFn: () => apiClient.get<UpcomingFixtures>('/fixtures/upcoming').then((r) => r.data),
  });

  const upcoming = data?.data ?? [];
  const next = upcoming[0];
  const needVolunteers = upcoming.filter((f) => f._count.volunteerAssignments === 0).length;

  return (
    <div className="card p-6 flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="rounded-full p-2 bg-purple-100">
            <CalendarDaysIcon className="h-5 w-5 text-purple-600" />
          </div>
          <span className="font-semibold text-neutral-800">Fixtures</span>
        </div>
        <Link to="/fixtures" className="text-neutral-400 hover:text-neutral-600">
          <ArrowRightIcon className="h-4 w-4" />
        </Link>
      </div>

      {isLoading ? (
        <Skeleton />
      ) : isError || !data ? (
        <p className="text-sm text-neutral-400">Could not load data</p>
      ) : (
        <>
          <div>
            <p className="text-3xl font-bold text-neutral-900">{upcoming.length}</p>
            <p className="text-sm text-neutral-500">upcoming fixtures</p>
          </div>
          <p className="text-xs text-neutral-400 truncate">
            {next
              ? `${next.homeTeamName} vs ${next.awayTeamName} · ${format(new Date(next.fixtureDate), 'dd MMM')}`
              : 'No upcoming fixtures'}
          </p>
          <div className="border-t border-neutral-100 pt-3">
            {needVolunteers > 0 ? (
              <span className="flex items-center gap-1.5 text-xs text-amber-700">
                <ExclamationTriangleIcon className="h-3.5 w-3.5" />
                {needVolunteers} fixture{needVolunteers > 1 ? 's' : ''} need volunteers
              </span>
            ) : (
              <span className="flex items-center gap-1.5 text-xs text-emerald-600">
                <CheckCircleIcon className="h-3.5 w-3.5" />
                All fixtures have volunteers
              </span>
            )}
          </div>
        </>
      )}
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export function DashboardPage(): JSX.Element {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-neutral-900">Dashboard</h1>
        <p className="text-sm text-neutral-500 mt-0.5">
          Welcome back. Here's your club at a glance.
        </p>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <ComplianceCard />
        <GrantWriterCard />
        <FixturesCard />
      </div>
    </div>
  );
}
