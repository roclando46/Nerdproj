import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { format } from 'date-fns';
import { Dialog } from '@headlessui/react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  PlusIcon,
  XMarkIcon,
  DocumentTextIcon,
  ClockIcon,
  CheckCircleIcon,
  TrophyIcon,
} from '@heroicons/react/24/outline';
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
  funderUrl: string | null;
  description: string | null;
  maxAmount: string | null;
  closeDate: string | null;
  status: GrantStatus;
  isRecurring: boolean;
  _count: { applications: number };
}

interface Application {
  id: string;
  status: GrantStatus;
}

interface PagedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
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

// ─── Add Grant Modal ──────────────────────────────────────────────────────────

const addGrantSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  funderName: z.string().min(1, 'Funder name is required'),
  funderUrl: z.string().url('Must be a valid URL').optional().or(z.literal('')),
  description: z.string().optional(),
  closeDate: z.string().optional(),
  maxAmount: z.coerce.number().positive().optional(),
  eligibilityCriteria: z.string().optional(),
});

type AddGrantValues = z.infer<typeof addGrantSchema>;

function toISOLocal(dateStr: string) {
  return dateStr ? `${dateStr}T00:00:00.000Z` : undefined;
}

function AddGrantModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const qc = useQueryClient();
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<AddGrantValues>({ resolver: zodResolver(addGrantSchema) });

  const mutation = useMutation({
    mutationFn: (values: AddGrantValues) =>
      apiClient.post('/grants', {
        ...values,
        funderUrl: values.funderUrl || undefined,
        closeDate: values.closeDate ? toISOLocal(values.closeDate) : undefined,
      }),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['grants'] });
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
            <Dialog.Title className="font-semibold text-neutral-900">
              Add Grant Opportunity
            </Dialog.Title>
            <button onClick={onClose} className="text-neutral-400 hover:text-neutral-600">
              <XMarkIcon className="h-5 w-5" />
            </button>
          </div>

          <form onSubmit={handleSubmit((v) => mutation.mutate(v))} className="px-6 py-4 space-y-4">
            <div>
              <label className="label">Grant Name</label>
              <input
                type="text"
                className="input"
                placeholder="e.g. Sport England Small Grants"
                {...register('name')}
              />
              {errors.name && <p className="text-xs text-red-600 mt-1">{errors.name.message}</p>}
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="label">Funder Name</label>
                <input
                  type="text"
                  className="input"
                  placeholder="e.g. Sport England"
                  {...register('funderName')}
                />
                {errors.funderName && (
                  <p className="text-xs text-red-600 mt-1">{errors.funderName.message}</p>
                )}
              </div>
              <div>
                <label className="label">Funder URL</label>
                <input
                  type="url"
                  className="input"
                  placeholder="https://..."
                  {...register('funderUrl')}
                />
                {errors.funderUrl && (
                  <p className="text-xs text-red-600 mt-1">{errors.funderUrl.message}</p>
                )}
              </div>
            </div>

            <div>
              <label className="label">Description</label>
              <textarea className="input" rows={3} {...register('description')} />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="label">Close Date</label>
                <input type="date" className="input" {...register('closeDate')} />
              </div>
              <div>
                <label className="label">Max Amount (£)</label>
                <input
                  type="number"
                  className="input"
                  step="1"
                  min="0"
                  {...register('maxAmount')}
                />
              </div>
            </div>

            <div>
              <label className="label">Eligibility Criteria</label>
              <textarea
                className="input"
                rows={2}
                placeholder="Who can apply?"
                {...register('eligibilityCriteria')}
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
                {mutation.isPending ? 'Saving…' : 'Add Grant'}
              </button>
            </div>
          </form>
        </Dialog.Panel>
      </div>
    </Dialog>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export function GrantsDashboard(): JSX.Element {
  const [modalOpen, setModalOpen] = useState(false);
  const navigate = useNavigate();
  const qc = useQueryClient();

  const {
    data: grantsData,
    isLoading: grantsLoading,
    error: grantsError,
  } = useQuery<PagedResponse<Grant>>({
    queryKey: ['grants', 'list'],
    queryFn: () => apiClient.get<PagedResponse<Grant>>('/grants?limit=100').then((r) => r.data),
  });

  const { data: applicationsData } = useQuery<PagedResponse<Application>>({
    queryKey: ['grants', 'applications', 'all'],
    queryFn: () =>
      apiClient
        .get<PagedResponse<Application>>('/grants/applications?limit=100')
        .then((r) => r.data),
  });

  const startApplicationMutation = useMutation({
    mutationFn: (grantId: string) =>
      apiClient.post<{ id: string }>('/grants/applications', { grantId }),
    onSuccess: (res) => {
      void qc.invalidateQueries({ queryKey: ['grants'] });
      void navigate(`/grants/applications?applicationId=${res.data.id}`);
    },
  });

  const applications = applicationsData?.data ?? [];
  const inProgress = applications.filter((a) => a.status === 'IN_PROGRESS').length;
  const submitted = applications.filter((a) => a.status === 'SUBMITTED').length;
  const awarded = applications.filter((a) => a.status === 'AWARDED').length;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-neutral-900">AI Grant Writer</h1>
          <p className="text-sm text-neutral-500 mt-0.5">
            Discover grant opportunities and generate AI-powered proposals.
          </p>
        </div>
        <button
          className="btn-primary flex items-center gap-1.5"
          onClick={() => setModalOpen(true)}
        >
          <PlusIcon className="h-4 w-4" />
          Add Grant
        </button>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="card p-5 flex items-center gap-4">
          <div className="rounded-full p-3 bg-neutral-400">
            <DocumentTextIcon className="h-6 w-6 text-white" />
          </div>
          <div>
            <p className="text-2xl font-bold text-neutral-900">{applications.length}</p>
            <p className="text-sm text-neutral-500">Total Applications</p>
          </div>
        </div>
        <div className="card p-5 flex items-center gap-4">
          <div className="rounded-full p-3 bg-amber-500">
            <ClockIcon className="h-6 w-6 text-white" />
          </div>
          <div>
            <p className="text-2xl font-bold text-neutral-900">{inProgress}</p>
            <p className="text-sm text-neutral-500">In Progress</p>
          </div>
        </div>
        <div className="card p-5 flex items-center gap-4">
          <div className="rounded-full p-3 bg-purple-500">
            <CheckCircleIcon className="h-6 w-6 text-white" />
          </div>
          <div>
            <p className="text-2xl font-bold text-neutral-900">{submitted}</p>
            <p className="text-sm text-neutral-500">Submitted</p>
          </div>
        </div>
        <div className="card p-5 flex items-center gap-4">
          <div className="rounded-full p-3 bg-emerald-500">
            <TrophyIcon className="h-6 w-6 text-white" />
          </div>
          <div>
            <p className="text-2xl font-bold text-neutral-900">{awarded}</p>
            <p className="text-sm text-neutral-500">Awarded</p>
          </div>
        </div>
      </div>

      {/* Grant opportunities table */}
      <div className="card overflow-hidden">
        <div className="px-4 py-3 border-b border-neutral-100">
          <h2 className="font-medium text-neutral-900">Grant Opportunities</h2>
        </div>
        {grantsLoading ? (
          <div className="flex items-center justify-center h-40">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary-600" />
          </div>
        ) : grantsError ? (
          <div className="p-6 text-sm text-red-600">Failed to load grants.</div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-xs text-neutral-500 uppercase tracking-wide bg-neutral-50 border-b border-neutral-200">
                <th className="px-4 py-3 font-medium">Grant</th>
                <th className="px-4 py-3 font-medium">Funder</th>
                <th className="px-4 py-3 font-medium">Deadline</th>
                <th className="px-4 py-3 font-medium">Max Amount</th>
                <th className="px-4 py-3 font-medium">Applications</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 font-medium"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100">
              {grantsData?.data.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-4 py-8 text-center text-neutral-400">
                    No grants yet. Add one to get started.
                  </td>
                </tr>
              )}
              {grantsData?.data.map((grant) => (
                <tr key={grant.id} className="hover:bg-neutral-50">
                  <td className="px-4 py-3">
                    <p className="font-medium text-neutral-900">{grant.name}</p>
                    {grant.isRecurring && <p className="text-xs text-neutral-400">Recurring</p>}
                  </td>
                  <td className="px-4 py-3 text-neutral-700">{grant.funderName}</td>
                  <td className="px-4 py-3 text-neutral-700">
                    {grant.closeDate ? format(new Date(grant.closeDate), 'dd MMM yyyy') : '—'}
                  </td>
                  <td className="px-4 py-3 text-neutral-700">{formatGBP(grant.maxAmount)}</td>
                  <td className="px-4 py-3 text-neutral-600">{grant._count.applications}</td>
                  <td className="px-4 py-3">
                    <StatusBadge status={grant.status} />
                  </td>
                  <td className="px-4 py-3">
                    <button
                      className="btn-secondary text-xs py-1"
                      onClick={() => startApplicationMutation.mutate(grant.id)}
                      disabled={startApplicationMutation.isPending}
                    >
                      Start Application
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <AddGrantModal open={modalOpen} onClose={() => setModalOpen(false)} />
    </div>
  );
}
