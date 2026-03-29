import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { format } from 'date-fns';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Dialog } from '@headlessui/react';
import {
  PlusIcon,
  XMarkIcon,
  ExclamationTriangleIcon,
  CalendarDaysIcon,
  SparklesIcon,
} from '@heroicons/react/24/outline';
import { apiClient } from '../../lib/api-client.js';

// ─── Types ────────────────────────────────────────────────────────────────────

type FixtureStatus = 'SCHEDULED' | 'CONFIRMED' | 'CANCELLED' | 'POSTPONED' | 'COMPLETED';
type VolunteerRole =
  | 'SCORER'
  | 'UMPIRE'
  | 'FIRST_AIDER'
  | 'TRANSPORT'
  | 'TEA_DUTY'
  | 'GROUNDSPERSON'
  | 'SAFEGUARDING_OFFICER'
  | 'CUSTOM';

interface DbsInfo {
  dbsStatus: string;
  dbsExpiryDate: string | null;
}

interface VolunteerMember {
  id: string;
  firstName: string;
  lastName: string;
  membershipNumber: string | null;
  complianceRecord: DbsInfo;
}

interface VolunteerProfile {
  id: string;
  memberId: string;
  availableRoles: VolunteerRole[];
  isAvailableGeneral: boolean;
  member: VolunteerMember;
}

interface Assignment {
  id: string;
  role: VolunteerRole;
  customRoleName: string | null;
  confirmedAt: string | null;
  declinedAt: string | null;
  notes: string | null;
  volunteer: VolunteerProfile;
}

interface Fixture {
  id: string;
  sport: string;
  fixtureDate: string;
  kickoffTime: string | null;
  homeTeamName: string;
  awayTeamName: string;
  isHomeFixture: boolean;
  venue: string | null;
  status: FixtureStatus;
  ageGroup: string | null;
  competition: string | null;
  _count: { volunteerAssignments: number };
}

interface FixtureDetail extends Fixture {
  volunteerAssignments: Assignment[];
}

interface PagedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

const STATUS_STYLES: Record<FixtureStatus, string> = {
  SCHEDULED: 'bg-blue-100 text-blue-700',
  CONFIRMED: 'bg-emerald-100 text-emerald-800',
  CANCELLED: 'bg-red-100 text-red-700',
  POSTPONED: 'bg-amber-100 text-amber-800',
  COMPLETED: 'bg-neutral-100 text-neutral-600',
};

const VOLUNTEER_ROLES: VolunteerRole[] = [
  'SCORER',
  'UMPIRE',
  'FIRST_AIDER',
  'TRANSPORT',
  'TEA_DUTY',
  'GROUNDSPERSON',
  'SAFEGUARDING_OFFICER',
  'CUSTOM',
];

function StatusBadge({ status }: { status: FixtureStatus }) {
  return (
    <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${STATUS_STYLES[status]}`}>
      {status}
    </span>
  );
}

function DbsBadge({ dbsStatus }: { dbsStatus: string }) {
  if (dbsStatus === 'VALID') return null;
  return (
    <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 flex items-center gap-1">
      <ExclamationTriangleIcon className="h-3 w-3" />
      DBS: {dbsStatus.replace('_', ' ')}
    </span>
  );
}

// ─── Add Fixture Modal ────────────────────────────────────────────────────────

const addFixtureSchema = z.object({
  sport: z.enum(['CRICKET', 'RUGBY', 'BOTH']),
  fixtureDate: z.string().min(1, 'Date is required'),
  kickoffTime: z.string().optional(),
  homeTeamName: z.string().min(1, 'Home team is required'),
  awayTeamName: z.string().min(1, 'Away team is required'),
  isHomeFixture: z.coerce.boolean(),
  venue: z.string().optional(),
  ageGroup: z.string().optional(),
  competition: z.string().optional(),
});

type AddFixtureValues = z.infer<typeof addFixtureSchema>;

function AddFixtureModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const qc = useQueryClient();
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<AddFixtureValues>({
    resolver: zodResolver(addFixtureSchema),
    defaultValues: { sport: 'CRICKET', isHomeFixture: true },
  });

  const mutation = useMutation({
    mutationFn: (values: AddFixtureValues) =>
      apiClient.post('/fixtures', {
        ...values,
        fixtureDate: `${values.fixtureDate}T00:00:00.000Z`,
        kickoffTime: values.kickoffTime || undefined,
        venue: values.venue || undefined,
        ageGroup: values.ageGroup || undefined,
        competition: values.competition || undefined,
      }),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['fixtures'] });
      reset();
      onClose();
    },
  });

  return (
    <Dialog open={open} onClose={onClose} className="relative z-50">
      <div className="fixed inset-0 bg-black/30" aria-hidden="true" />
      <div className="fixed inset-0 flex items-center justify-center p-4">
        <Dialog.Panel className="bg-white rounded-xl shadow-xl w-full max-w-lg">
          <div className="flex items-center justify-between px-6 py-4 border-b border-neutral-100">
            <Dialog.Title className="font-semibold text-neutral-900">Add Fixture</Dialog.Title>
            <button onClick={onClose} className="text-neutral-400 hover:text-neutral-600">
              <XMarkIcon className="h-5 w-5" />
            </button>
          </div>

          <form onSubmit={handleSubmit((v) => mutation.mutate(v))} className="px-6 py-4 space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="label">Sport</label>
                <select className="input" {...register('sport')}>
                  <option value="CRICKET">Cricket</option>
                  <option value="RUGBY">Rugby</option>
                  <option value="BOTH">Both</option>
                </select>
              </div>
              <div>
                <label className="label">Home/Away</label>
                <select className="input" {...register('isHomeFixture')}>
                  <option value="true">Home</option>
                  <option value="false">Away</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="label">Date</label>
                <input type="date" className="input" {...register('fixtureDate')} />
                {errors.fixtureDate && (
                  <p className="text-xs text-red-600 mt-1">{errors.fixtureDate.message}</p>
                )}
              </div>
              <div>
                <label className="label">Kickoff Time</label>
                <input type="time" className="input" {...register('kickoffTime')} />
              </div>
            </div>

            <div>
              <label className="label">Home Team</label>
              <input
                type="text"
                className="input"
                placeholder="e.g. Durham Cricket CC"
                {...register('homeTeamName')}
              />
              {errors.homeTeamName && (
                <p className="text-xs text-red-600 mt-1">{errors.homeTeamName.message}</p>
              )}
            </div>

            <div>
              <label className="label">Away Team</label>
              <input
                type="text"
                className="input"
                placeholder="e.g. Sunderland CC"
                {...register('awayTeamName')}
              />
              {errors.awayTeamName && (
                <p className="text-xs text-red-600 mt-1">{errors.awayTeamName.message}</p>
              )}
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="label">Venue</label>
                <input
                  type="text"
                  className="input"
                  placeholder="Ground name"
                  {...register('venue')}
                />
              </div>
              <div>
                <label className="label">Age Group</label>
                <input
                  type="text"
                  className="input"
                  placeholder="e.g. 1st XI"
                  {...register('ageGroup')}
                />
              </div>
            </div>

            <div>
              <label className="label">Competition</label>
              <input
                type="text"
                className="input"
                placeholder="e.g. Durham Saturday League Div 2"
                {...register('competition')}
              />
            </div>

            {mutation.error && (
              <p className="text-sm text-red-600">
                {mutation.error instanceof Error ? mutation.error.message : 'Something went wrong'}
              </p>
            )}

            <div className="flex justify-end gap-2 pt-2">
              <button type="button" className="btn-secondary" onClick={onClose}>
                Cancel
              </button>
              <button
                type="submit"
                className="btn-primary"
                disabled={isSubmitting || mutation.isPending}
              >
                {mutation.isPending ? 'Saving…' : 'Add Fixture'}
              </button>
            </div>
          </form>
        </Dialog.Panel>
      </div>
    </Dialog>
  );
}

// ─── Volunteer Assignment Panel ───────────────────────────────────────────────

function VolunteerPanel({ fixtureId }: { fixtureId: string }) {
  const qc = useQueryClient();
  const [selectedVolunteerId, setSelectedVolunteerId] = useState('');
  const [selectedRole, setSelectedRole] = useState<VolunteerRole>('SCORER');
  const [customRoleName, setCustomRoleName] = useState('');
  const [autoSuggestRole, setAutoSuggestRole] = useState<VolunteerRole>('SCORER');
  const [suggestions, setSuggestions] = useState<
    (VolunteerProfile & { assignmentCount: number })[]
  >([]);

  const { data: fixture } = useQuery<FixtureDetail>({
    queryKey: ['fixtures', fixtureId, 'detail'],
    queryFn: () => apiClient.get<FixtureDetail>(`/fixtures/${fixtureId}`).then((r) => r.data),
  });

  const { data: profiles = [] } = useQuery<VolunteerProfile[]>({
    queryKey: ['fixtures', 'volunteers'],
    queryFn: () => apiClient.get<VolunteerProfile[]>('/fixtures/volunteers').then((r) => r.data),
  });

  const assignMutation = useMutation({
    mutationFn: () =>
      apiClient.post(`/fixtures/${fixtureId}/assignments`, {
        volunteerId: selectedVolunteerId,
        role: selectedRole,
        customRoleName: selectedRole === 'CUSTOM' ? customRoleName : undefined,
      }),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['fixtures', fixtureId, 'detail'] });
      void qc.invalidateQueries({ queryKey: ['fixtures', 'list'] });
      setSelectedVolunteerId('');
    },
  });

  const removeMutation = useMutation({
    mutationFn: (assignmentId: string) =>
      apiClient.delete(`/fixtures/${fixtureId}/assignments/${assignmentId}`),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['fixtures', fixtureId, 'detail'] });
      void qc.invalidateQueries({ queryKey: ['fixtures', 'list'] });
    },
  });

  const autoSuggestMutation = useMutation({
    mutationFn: (role: VolunteerRole) =>
      apiClient
        .post<
          (VolunteerProfile & { assignmentCount: number })[]
        >(`/fixtures/${fixtureId}/assignments/auto-suggest`, { role })
        .then((r) => r.data),
    onSuccess: (data) => setSuggestions(data),
  });

  const selectedVolunteer = profiles.find((p) => p.id === selectedVolunteerId);
  const dbsWarning =
    selectedVolunteer && selectedVolunteer.member.complianceRecord.dbsStatus !== 'VALID';

  if (!fixture) {
    return (
      <div className="flex items-center justify-center h-20">
        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-primary-600" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Current assignments */}
      {fixture.volunteerAssignments.length > 0 ? (
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-xs text-neutral-500 uppercase tracking-wide">
              <th className="py-1.5 font-medium">Volunteer</th>
              <th className="py-1.5 font-medium">Role</th>
              <th className="py-1.5 font-medium">DBS</th>
              <th className="py-1.5 font-medium">Status</th>
              <th className="py-1.5 font-medium"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-neutral-100">
            {fixture.volunteerAssignments.map((a) => (
              <tr key={a.id}>
                <td className="py-2 font-medium text-neutral-900">
                  {a.volunteer.member.firstName} {a.volunteer.member.lastName}
                </td>
                <td className="py-2 text-neutral-700">
                  {a.role === 'CUSTOM' && a.customRoleName
                    ? a.customRoleName
                    : a.role.replace('_', ' ')}
                </td>
                <td className="py-2">
                  <DbsBadge dbsStatus={a.volunteer.member.complianceRecord.dbsStatus} />
                </td>
                <td className="py-2">
                  {a.confirmedAt ? (
                    <span className="text-xs text-emerald-600 font-medium">Confirmed</span>
                  ) : a.declinedAt ? (
                    <span className="text-xs text-red-600 font-medium">Declined</span>
                  ) : (
                    <span className="text-xs text-neutral-400">Pending</span>
                  )}
                </td>
                <td className="py-2">
                  <button
                    className="text-xs text-red-600 hover:text-red-800"
                    onClick={() => removeMutation.mutate(a.id)}
                    disabled={removeMutation.isPending}
                  >
                    Remove
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      ) : (
        <p className="text-sm text-neutral-400">No volunteers assigned yet.</p>
      )}

      {/* Add volunteer form */}
      <div className="border-t border-neutral-100 pt-4 space-y-3">
        <p className="text-xs font-semibold text-neutral-500 uppercase tracking-wide">
          Assign Volunteer
        </p>
        <div className="grid grid-cols-2 gap-2">
          <select
            className="input text-sm"
            value={selectedVolunteerId}
            onChange={(e) => setSelectedVolunteerId(e.target.value)}
          >
            <option value="">Select volunteer…</option>
            {profiles.map((p) => (
              <option key={p.id} value={p.id}>
                {p.member.firstName} {p.member.lastName}
                {p.member.complianceRecord.dbsStatus !== 'VALID'
                  ? ` ⚠ DBS: ${p.member.complianceRecord.dbsStatus}`
                  : ''}
              </option>
            ))}
          </select>
          <select
            className="input text-sm"
            value={selectedRole}
            onChange={(e) => setSelectedRole(e.target.value as VolunteerRole)}
          >
            {VOLUNTEER_ROLES.map((r) => (
              <option key={r} value={r}>
                {r.replace('_', ' ')}
              </option>
            ))}
          </select>
        </div>

        {selectedRole === 'CUSTOM' && (
          <input
            type="text"
            className="input text-sm"
            placeholder="Custom role name"
            value={customRoleName}
            onChange={(e) => setCustomRoleName(e.target.value)}
          />
        )}

        {dbsWarning && selectedVolunteer && (
          <div className="flex items-start gap-2 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2 text-sm text-amber-800">
            <ExclamationTriangleIcon className="h-4 w-4 mt-0.5 flex-shrink-0" />
            <span>
              <strong>
                {selectedVolunteer.member.firstName} {selectedVolunteer.member.lastName}
              </strong>
              's DBS is{' '}
              <strong>
                {selectedVolunteer.member.complianceRecord.dbsStatus.replace('_', ' ')}
              </strong>
              . You can still assign them, but this should be resolved before the fixture.
            </span>
          </div>
        )}

        {assignMutation.error && (
          <p className="text-xs text-red-600">
            {assignMutation.error instanceof Error
              ? assignMutation.error.message
              : 'Assignment failed'}
          </p>
        )}

        <button
          className="btn-primary text-sm py-1.5"
          onClick={() => assignMutation.mutate()}
          disabled={!selectedVolunteerId || assignMutation.isPending}
        >
          {assignMutation.isPending ? 'Assigning…' : 'Assign'}
        </button>
      </div>

      {/* Auto-suggest */}
      <div className="border-t border-neutral-100 pt-4 space-y-3">
        <p className="text-xs font-semibold text-neutral-500 uppercase tracking-wide">
          Auto-Suggest
        </p>
        <div className="flex gap-2">
          <select
            className="input text-sm flex-1"
            value={autoSuggestRole}
            onChange={(e) => setAutoSuggestRole(e.target.value as VolunteerRole)}
          >
            {VOLUNTEER_ROLES.filter((r) => r !== 'CUSTOM').map((r) => (
              <option key={r} value={r}>
                {r.replace('_', ' ')}
              </option>
            ))}
          </select>
          <button
            className="btn-secondary text-sm flex items-center gap-1"
            onClick={() => autoSuggestMutation.mutate(autoSuggestRole)}
            disabled={autoSuggestMutation.isPending}
          >
            <SparklesIcon className="h-4 w-4" />
            Suggest
          </button>
        </div>

        {suggestions.length > 0 && (
          <div className="space-y-2">
            {suggestions.map((s) => (
              <div
                key={s.id}
                className="flex items-center justify-between bg-neutral-50 rounded-lg px-3 py-2 text-sm"
              >
                <div>
                  <span className="font-medium text-neutral-900">
                    {s.member.firstName} {s.member.lastName}
                  </span>
                  <span className="text-neutral-500 ml-2">
                    — DBS: {s.member.complianceRecord.dbsStatus} — {s.assignmentCount} assignments
                  </span>
                </div>
                <button
                  className="btn-primary text-xs py-1"
                  onClick={() => {
                    setSelectedVolunteerId(s.id);
                    setSelectedRole(autoSuggestRole);
                    setSuggestions([]);
                  }}
                >
                  Assign
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export function FixturesDashboard(): JSX.Element {
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedFixtureId, setSelectedFixtureId] = useState<string | null>(null);

  const { data: upcoming } = useQuery<{ data: Fixture[] }>({
    queryKey: ['fixtures', 'upcoming'],
    queryFn: () => apiClient.get<{ data: Fixture[] }>('/fixtures/upcoming').then((r) => r.data),
  });

  const { data, isLoading, error } = useQuery<PagedResponse<Fixture>>({
    queryKey: ['fixtures', 'list'],
    queryFn: () => apiClient.get<PagedResponse<Fixture>>('/fixtures?limit=50').then((r) => r.data),
  });

  function fixtureTitle(f: Fixture) {
    return f.isHomeFixture
      ? `${f.homeTeamName} vs ${f.awayTeamName}`
      : `${f.homeTeamName} vs ${f.awayTeamName} (Away)`;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-neutral-900">Fixture & Volunteer Manager</h1>
          <p className="text-sm text-neutral-500 mt-0.5">
            Schedule fixtures and assign volunteers.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <a
            href="/api/v1/fixtures/calendar"
            download="fixtures.ics"
            className="btn-secondary flex items-center gap-1.5 text-sm"
          >
            <CalendarDaysIcon className="h-4 w-4" />
            Download iCal
          </a>
          <button
            className="btn-primary flex items-center gap-1.5"
            onClick={() => setModalOpen(true)}
          >
            <PlusIcon className="h-4 w-4" />
            Add Fixture
          </button>
        </div>
      </div>

      {/* Upcoming strip */}
      {upcoming && upcoming.data.length > 0 && (
        <div className="overflow-x-auto">
          <div className="flex gap-3 pb-2" style={{ minWidth: 'max-content' }}>
            {upcoming.data.map((f) => (
              <button
                key={f.id}
                className={`flex-shrink-0 w-52 card p-3 text-left hover:shadow-md transition-shadow ${selectedFixtureId === f.id ? 'ring-2 ring-primary-500' : ''}`}
                onClick={() => setSelectedFixtureId(selectedFixtureId === f.id ? null : f.id)}
              >
                <p className="text-xs text-neutral-500">
                  {format(new Date(f.fixtureDate), 'EEE dd MMM')}
                  {f.kickoffTime ? ` · ${f.kickoffTime}` : ''}
                </p>
                <p className="font-medium text-neutral-900 text-sm mt-0.5 truncate">
                  {f.isHomeFixture ? f.awayTeamName : f.homeTeamName}
                </p>
                <p className="text-xs text-neutral-500 mt-0.5">
                  {f.isHomeFixture ? 'Home' : 'Away'}
                  {f.ageGroup ? ` · ${f.ageGroup}` : ''}
                </p>
                <div className="flex items-center justify-between mt-2">
                  <StatusBadge status={f.status} />
                  <span className="text-xs text-neutral-400">
                    {f._count.volunteerAssignments} vol.
                  </span>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* All fixtures table */}
      <div className="card overflow-hidden">
        {isLoading ? (
          <div className="flex items-center justify-center h-40">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary-600" />
          </div>
        ) : error ? (
          <div className="p-6 text-sm text-red-600">Failed to load fixtures.</div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-xs text-neutral-500 uppercase tracking-wide bg-neutral-50 border-b border-neutral-200">
                <th className="px-4 py-3 font-medium">Fixture</th>
                <th className="px-4 py-3 font-medium">Date</th>
                <th className="px-4 py-3 font-medium">Competition</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 font-medium">Volunteers</th>
              </tr>
            </thead>
            <tbody>
              {data?.data.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-4 py-8 text-center text-neutral-400">
                    No fixtures yet. Add one to get started.
                  </td>
                </tr>
              )}
              {data?.data.map((fixture) => (
                <>
                  <tr
                    key={fixture.id}
                    className={`border-b border-neutral-100 cursor-pointer hover:bg-neutral-50 ${selectedFixtureId === fixture.id ? 'bg-neutral-50' : ''}`}
                    onClick={() =>
                      setSelectedFixtureId(selectedFixtureId === fixture.id ? null : fixture.id)
                    }
                  >
                    <td className="px-4 py-3">
                      <p className="font-medium text-neutral-900">{fixtureTitle(fixture)}</p>
                      {fixture.venue && <p className="text-xs text-neutral-400">{fixture.venue}</p>}
                    </td>
                    <td className="px-4 py-3 text-neutral-700">
                      <p>{format(new Date(fixture.fixtureDate), 'dd MMM yyyy')}</p>
                      {fixture.kickoffTime && (
                        <p className="text-xs text-neutral-400">{fixture.kickoffTime}</p>
                      )}
                    </td>
                    <td className="px-4 py-3 text-neutral-600">{fixture.competition ?? '—'}</td>
                    <td className="px-4 py-3">
                      <StatusBadge status={fixture.status} />
                    </td>
                    <td className="px-4 py-3 text-neutral-600">
                      {fixture._count.volunteerAssignments}
                    </td>
                  </tr>
                  {selectedFixtureId === fixture.id && (
                    <tr
                      key={`${fixture.id}-panel`}
                      className="bg-neutral-50 border-b border-neutral-200"
                    >
                      <td colSpan={5} className="px-6 py-4">
                        <VolunteerPanel fixtureId={fixture.id} />
                      </td>
                    </tr>
                  )}
                </>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <AddFixtureModal open={modalOpen} onClose={() => setModalOpen(false)} />
    </div>
  );
}
