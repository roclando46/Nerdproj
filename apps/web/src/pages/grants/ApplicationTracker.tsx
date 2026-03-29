import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Link, useSearchParams } from 'react-router-dom';
import { format } from 'date-fns';
import { Dialog } from '@headlessui/react';
import { XMarkIcon, ArrowLeftIcon, SparklesIcon, CheckIcon } from '@heroicons/react/24/outline';
import { apiClient } from '../../lib/api-client.js';

// ─── Types ────────────────────────────────────────────────────────────────────

type GrantStatus =
  | 'IDENTIFIED'
  | 'RESEARCHING'
  | 'IN_PROGRESS'
  | 'SUBMITTED'
  | 'AWARDED'
  | 'REJECTED'
  | 'WITHDRAWN';

interface Grant {
  id: string;
  name: string;
  funderName: string;
  closeDate: string | null;
  maxAmount: string | null;
  description: string | null;
  eligibilityCriteria: string | null;
}

interface Proposal {
  id: string;
  applicationId: string;
  sectionTitle: string;
  aiDraftContent: string | null;
  finalContent: string | null;
  wordCount: number | null;
  version: number;
  isApproved: boolean;
}

interface Application {
  id: string;
  status: GrantStatus;
  amountRequested: string | null;
  amountAwarded: string | null;
  submittedAt: string | null;
  decisionAt: string | null;
  decisionNotes: string | null;
  internalNotes: string | null;
  grant: Grant;
  proposals: Proposal[];
  createdBy: { firstName: string; lastName: string };
}

interface ApplicationRow {
  id: string;
  status: GrantStatus;
  amountRequested: string | null;
  grant: { name: string; funderName: string; closeDate: string | null; maxAmount: string | null };
  createdBy: { firstName: string; lastName: string };
}

interface PagedResponse<T> {
  data: T[];
  total: number;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

const STATUS_STYLES: Record<GrantStatus, string> = {
  IDENTIFIED: 'bg-neutral-100 text-neutral-600',
  RESEARCHING: 'bg-blue-100 text-blue-700',
  IN_PROGRESS: 'bg-amber-100 text-amber-800',
  SUBMITTED: 'bg-purple-100 text-purple-800',
  AWARDED: 'bg-emerald-100 text-emerald-800',
  REJECTED: 'bg-red-100 text-red-800',
  WITHDRAWN: 'bg-neutral-100 text-neutral-500',
};

const ALL_STATUSES: GrantStatus[] = [
  'IN_PROGRESS',
  'SUBMITTED',
  'AWARDED',
  'REJECTED',
  'IDENTIFIED',
  'RESEARCHING',
  'WITHDRAWN',
];

function StatusBadge({ status }: { status: GrantStatus }) {
  return (
    <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${STATUS_STYLES[status]}`}>
      {status.replace('_', ' ')}
    </span>
  );
}

function formatGBP(val: string | null | undefined): string {
  if (!val) return '—';
  return Number(val).toLocaleString('en-GB', {
    style: 'currency',
    currency: 'GBP',
    maximumFractionDigits: 0,
  });
}

// ─── Proposal Card ────────────────────────────────────────────────────────────

function ProposalCard({ proposal, applicationId }: { proposal: Proposal; applicationId: string }) {
  const qc = useQueryClient();
  const [editContent, setEditContent] = useState(proposal.finalContent ?? '');
  const [contextInput, setContextInput] = useState('');
  const [showContext, setShowContext] = useState(false);

  const generateMutation = useMutation({
    mutationFn: (context?: string) =>
      apiClient
        .post<{
          aiDraftContent: string;
          promptUsed: string;
        }>(`/grants/applications/${applicationId}/proposals/${proposal.id}/generate`, { context: context || undefined })
        .then((r) => r.data),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['grants', 'application', applicationId] });
    },
  });

  const saveMutation = useMutation({
    mutationFn: (content: string) =>
      apiClient.patch(`/grants/applications/${applicationId}/proposals/${proposal.id}`, {
        finalContent: content,
      }),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['grants', 'application', applicationId] });
    },
  });

  const approveMutation = useMutation({
    mutationFn: (isApproved: boolean) =>
      apiClient.patch(`/grants/applications/${applicationId}/proposals/${proposal.id}`, {
        isApproved,
      }),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['grants', 'application', applicationId] });
    },
  });

  const wordCount = editContent.trim() ? editContent.trim().split(/\s+/).filter(Boolean).length : 0;

  return (
    <div
      className={`border rounded-lg p-4 space-y-3 ${proposal.isApproved ? 'border-emerald-300 bg-emerald-50/30' : 'border-neutral-200'}`}
    >
      <div className="flex items-center justify-between">
        <h3 className="font-medium text-neutral-900">{proposal.sectionTitle}</h3>
        <div className="flex items-center gap-2">
          {proposal.isApproved && (
            <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 flex items-center gap-1">
              <CheckIcon className="h-3 w-3" />
              Approved
            </span>
          )}
          <span className="text-xs text-neutral-400">v{proposal.version}</span>
        </div>
      </div>

      {/* AI generation */}
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <button
            className="btn-secondary text-xs py-1 flex items-center gap-1"
            onClick={() => generateMutation.mutate(contextInput || undefined)}
            disabled={generateMutation.isPending}
          >
            {generateMutation.isPending ? (
              <span className="animate-spin rounded-full h-3 w-3 border-b-2 border-current" />
            ) : (
              <SparklesIcon className="h-3 w-3" />
            )}
            {proposal.aiDraftContent ? 'Regenerate Draft' : 'Generate AI Draft'}
          </button>
          <button
            className="text-xs text-neutral-500 hover:text-neutral-700"
            onClick={() => setShowContext((v) => !v)}
          >
            {showContext ? 'Hide context' : 'Add context'}
          </button>
        </div>

        {showContext && (
          <textarea
            className="input text-xs"
            rows={2}
            placeholder="Optional extra context for the AI (e.g. specific project details, budget notes)…"
            value={contextInput}
            onChange={(e) => setContextInput(e.target.value)}
          />
        )}

        {generateMutation.error && (
          <p className="text-xs text-red-600">
            {generateMutation.error instanceof Error
              ? generateMutation.error.message
              : 'Generation failed'}
          </p>
        )}
      </div>

      {/* AI draft display */}
      {proposal.aiDraftContent && (
        <div className="space-y-2">
          <p className="text-xs font-medium text-amber-700">AI Draft</p>
          <textarea
            readOnly
            className="w-full bg-amber-50 border border-amber-200 rounded-md px-3 py-2 text-xs text-neutral-700 resize-none focus:outline-none"
            rows={6}
            value={proposal.aiDraftContent}
          />
          <button
            className="btn-secondary text-xs py-1"
            onClick={() => setEditContent(proposal.aiDraftContent!)}
          >
            Use Draft
          </button>
        </div>
      )}

      {/* Final content editor */}
      <div className="space-y-1">
        <div className="flex items-center justify-between">
          <p className="text-xs font-medium text-neutral-600">Final Content</p>
          <span className="text-xs text-neutral-400">{wordCount} words</span>
        </div>
        <textarea
          className="input text-sm"
          rows={6}
          value={editContent}
          onChange={(e) => setEditContent(e.target.value)}
          placeholder="Write or paste your final content here…"
        />
      </div>

      <div className="flex items-center justify-between">
        <label className="flex items-center gap-2 text-sm text-neutral-700 cursor-pointer">
          <input
            type="checkbox"
            checked={proposal.isApproved}
            onChange={(e) => approveMutation.mutate(e.target.checked)}
            className="rounded border-neutral-300"
          />
          Mark as approved
        </label>
        <button
          className="btn-primary text-xs py-1"
          onClick={() => saveMutation.mutate(editContent)}
          disabled={saveMutation.isPending}
        >
          {saveMutation.isPending ? 'Saving…' : 'Save'}
        </button>
      </div>
    </div>
  );
}

// ─── Application Dialog ───────────────────────────────────────────────────────

function ApplicationDialog({
  applicationId,
  onClose,
}: {
  applicationId: string;
  onClose: () => void;
}) {
  const qc = useQueryClient();
  const [newSectionTitle, setNewSectionTitle] = useState('');
  const [showAddSection, setShowAddSection] = useState(false);

  const { data: application, isLoading } = useQuery<Application>({
    queryKey: ['grants', 'application', applicationId],
    queryFn: () =>
      apiClient.get<Application>(`/grants/applications/${applicationId}`).then((r) => r.data),
    enabled: !!applicationId,
  });

  const statusMutation = useMutation({
    mutationFn: (status: string) =>
      apiClient.patch(`/grants/applications/${applicationId}`, { status }),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['grants'] });
    },
  });

  const addSectionMutation = useMutation({
    mutationFn: (sectionTitle: string) =>
      apiClient.post(`/grants/applications/${applicationId}/proposals`, { sectionTitle }),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['grants', 'application', applicationId] });
      setNewSectionTitle('');
      setShowAddSection(false);
    },
  });

  return (
    <Dialog open onClose={onClose} className="relative z-50">
      <div className="fixed inset-0 bg-black/30" aria-hidden="true" />
      <div className="fixed inset-0 flex items-start justify-center p-4 overflow-y-auto">
        <Dialog.Panel className="bg-white rounded-xl shadow-xl w-full max-w-2xl my-8">
          <div className="flex items-center justify-between px-6 py-4 border-b border-neutral-100">
            <Dialog.Title className="font-semibold text-neutral-900">
              {isLoading ? 'Loading…' : (application?.grant.name ?? 'Application')}
            </Dialog.Title>
            <button onClick={onClose} className="text-neutral-400 hover:text-neutral-600">
              <XMarkIcon className="h-5 w-5" />
            </button>
          </div>

          {isLoading ? (
            <div className="flex items-center justify-center h-40">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary-600" />
            </div>
          ) : application ? (
            <div className="px-6 py-4 space-y-6">
              {/* Application info */}
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-xs text-neutral-500">Funder</p>
                  <p className="font-medium text-neutral-900">{application.grant.funderName}</p>
                </div>
                <div>
                  <p className="text-xs text-neutral-500">Deadline</p>
                  <p className="font-medium text-neutral-900">
                    {application.grant.closeDate
                      ? format(new Date(application.grant.closeDate), 'dd MMM yyyy')
                      : '—'}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-neutral-500">Amount Requested</p>
                  <p className="font-medium text-neutral-900">
                    {formatGBP(application.amountRequested)}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-neutral-500">Status</p>
                  <select
                    className="input text-xs py-1 mt-0.5"
                    value={application.status}
                    onChange={(e) => statusMutation.mutate(e.target.value)}
                  >
                    {(
                      [
                        'IN_PROGRESS',
                        'SUBMITTED',
                        'AWARDED',
                        'REJECTED',
                        'WITHDRAWN',
                      ] as GrantStatus[]
                    ).map((s) => (
                      <option key={s} value={s}>
                        {s.replace('_', ' ')}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Proposals */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="font-medium text-neutral-900">Proposal Sections</h3>
                  <button
                    className="btn-secondary text-xs py-1"
                    onClick={() => setShowAddSection((v) => !v)}
                  >
                    + Add Section
                  </button>
                </div>

                {showAddSection && (
                  <div className="flex gap-2">
                    <input
                      type="text"
                      className="input flex-1 text-sm"
                      placeholder="Section title (e.g. Project Description)"
                      value={newSectionTitle}
                      onChange={(e) => setNewSectionTitle(e.target.value)}
                    />
                    <button
                      className="btn-primary text-sm"
                      onClick={() => newSectionTitle && addSectionMutation.mutate(newSectionTitle)}
                      disabled={!newSectionTitle || addSectionMutation.isPending}
                    >
                      Add
                    </button>
                  </div>
                )}

                {application.proposals.length === 0 ? (
                  <p className="text-sm text-neutral-400 py-4 text-center">
                    No sections yet. Add one to start writing your proposal.
                  </p>
                ) : (
                  application.proposals.map((p) => (
                    <ProposalCard key={p.id} proposal={p} applicationId={applicationId} />
                  ))
                )}
              </div>
            </div>
          ) : null}
        </Dialog.Panel>
      </div>
    </Dialog>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export function ApplicationTracker(): JSX.Element {
  const [searchParams, setSearchParams] = useSearchParams();
  const [statusFilter, setStatusFilter] = useState<GrantStatus | 'ALL'>('ALL');
  const [selectedApplicationId, setSelectedApplicationId] = useState<string | null>(null);

  // Auto-open application from URL param
  useEffect(() => {
    const id = searchParams.get('applicationId');
    if (id) {
      setSelectedApplicationId(id);
      setSearchParams({});
    }
  }, [searchParams, setSearchParams]);

  const { data, isLoading, error } = useQuery<PagedResponse<ApplicationRow>>({
    queryKey: ['grants', 'applications', statusFilter],
    queryFn: () => {
      const params = statusFilter !== 'ALL' ? `?status=${statusFilter}&limit=100` : '?limit=100';
      return apiClient
        .get<PagedResponse<ApplicationRow>>(`/grants/applications${params}`)
        .then((r) => r.data);
    },
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link to="/grants" className="text-neutral-400 hover:text-neutral-600">
            <ArrowLeftIcon className="h-5 w-5" />
          </Link>
          <div>
            <h1 className="text-2xl font-semibold text-neutral-900">Application Tracker</h1>
            <p className="text-sm text-neutral-500 mt-0.5">
              Track all grant applications and outcomes.
            </p>
          </div>
        </div>
      </div>

      {/* Status filter chips */}
      <div className="flex flex-wrap gap-2">
        <button
          className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${statusFilter === 'ALL' ? 'bg-neutral-900 text-white' : 'bg-neutral-100 text-neutral-600 hover:bg-neutral-200'}`}
          onClick={() => setStatusFilter('ALL')}
        >
          All
        </button>
        {ALL_STATUSES.map((s) => (
          <button
            key={s}
            className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${statusFilter === s ? 'bg-neutral-900 text-white' : 'bg-neutral-100 text-neutral-600 hover:bg-neutral-200'}`}
            onClick={() => setStatusFilter(s)}
          >
            {s.replace('_', ' ')}
          </button>
        ))}
      </div>

      <div className="card overflow-hidden">
        {isLoading ? (
          <div className="flex items-center justify-center h-40">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary-600" />
          </div>
        ) : error ? (
          <div className="p-6 text-sm text-red-600">Failed to load applications.</div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-xs text-neutral-500 uppercase tracking-wide bg-neutral-50 border-b border-neutral-200">
                <th className="px-4 py-3 font-medium">Grant</th>
                <th className="px-4 py-3 font-medium">Funder</th>
                <th className="px-4 py-3 font-medium">Amount</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 font-medium">Deadline</th>
                <th className="px-4 py-3 font-medium"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100">
              {data?.data.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-neutral-400">
                    No applications yet. Start one from the{' '}
                    <Link to="/grants" className="text-primary-600 hover:underline">
                      grants page
                    </Link>
                    .
                  </td>
                </tr>
              )}
              {data?.data.map((app) => (
                <tr
                  key={app.id}
                  className="hover:bg-neutral-50 cursor-pointer"
                  onClick={() => setSelectedApplicationId(app.id)}
                >
                  <td className="px-4 py-3 font-medium text-neutral-900">{app.grant.name}</td>
                  <td className="px-4 py-3 text-neutral-700">{app.grant.funderName}</td>
                  <td className="px-4 py-3 text-neutral-700">{formatGBP(app.amountRequested)}</td>
                  <td className="px-4 py-3">
                    <StatusBadge status={app.status} />
                  </td>
                  <td className="px-4 py-3 text-neutral-600">
                    {app.grant.closeDate
                      ? format(new Date(app.grant.closeDate), 'dd MMM yyyy')
                      : '—'}
                  </td>
                  <td className="px-4 py-3">
                    <button
                      className="btn-secondary text-xs py-1"
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedApplicationId(app.id);
                      }}
                    >
                      View
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {selectedApplicationId && (
        <ApplicationDialog
          applicationId={selectedApplicationId}
          onClose={() => setSelectedApplicationId(null)}
        />
      )}
    </div>
  );
}
