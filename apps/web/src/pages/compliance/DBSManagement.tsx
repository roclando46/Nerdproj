import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { format } from 'date-fns';
import { Dialog } from '@headlessui/react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { PlusIcon, XMarkIcon } from '@heroicons/react/24/outline';
import { apiClient } from '../../lib/api-client.js';

// ─── Types ────────────────────────────────────────────────────────────────────

type DBSStatus = 'NOT_REQUIRED' | 'PENDING' | 'VALID' | 'EXPIRED' | 'FLAGGED';

interface MemberOption {
  id: string;
  firstName: string;
  lastName: string;
  membershipNumber: string | null;
}

interface DBSRecord {
  id: string;
  memberId: string;
  member: {
    firstName: string;
    lastName: string;
    email: string | null;
    membershipNumber: string | null;
  };
  certificateNumber: string | null;
  checkDate: string;
  expiryDate: string | null;
  status: DBSStatus;
  checkType: 'BASIC' | 'STANDARD' | 'ENHANCED';
  issuedBy: string | null;
  isSuperseded: boolean;
}

interface PagedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

// ─── Form schema ──────────────────────────────────────────────────────────────

const formSchema = z.object({
  memberId: z.string().min(1, 'Select a member'),
  certificateNumber: z.string().max(30).optional(),
  checkDate: z.string().min(1, 'Check date is required'),
  expiryDate: z.string().optional(),
  checkType: z.enum(['BASIC', 'STANDARD', 'ENHANCED']),
  status: z.enum(['NOT_REQUIRED', 'PENDING', 'VALID', 'EXPIRED', 'FLAGGED']),
  issuedBy: z.string().max(200).optional(),
  notes: z.string().max(2000).optional(),
});

type FormValues = z.infer<typeof formSchema>;

// ─── Helpers ──────────────────────────────────────────────────────────────────

const STATUS_STYLES: Record<DBSStatus, string> = {
  VALID: 'bg-emerald-100 text-emerald-800',
  PENDING: 'bg-amber-100 text-amber-800',
  EXPIRED: 'bg-red-100 text-red-800',
  FLAGGED: 'bg-red-100 text-red-800',
  NOT_REQUIRED: 'bg-neutral-100 text-neutral-600',
};

function StatusBadge({ status }: { status: DBSStatus }) {
  return (
    <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${STATUS_STYLES[status]}`}>
      {status.replace('_', ' ')}
    </span>
  );
}

function toISOLocal(dateStr: string) {
  // Convert YYYY-MM-DD from <input type="date"> to full ISO string
  return dateStr ? `${dateStr}T00:00:00.000Z` : undefined;
}

// ─── Add Modal ────────────────────────────────────────────────────────────────

function AddDBSModal({
  open,
  onClose,
  members,
}: {
  open: boolean;
  onClose: () => void;
  members: MemberOption[];
}) {
  const qc = useQueryClient();
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: { checkType: 'ENHANCED', status: 'VALID' },
  });

  const mutation = useMutation({
    mutationFn: (values: FormValues) =>
      apiClient.post('/compliance/dbs', {
        ...values,
        checkDate: toISOLocal(values.checkDate)!,
        expiryDate: values.expiryDate ? toISOLocal(values.expiryDate) : undefined,
      }),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['compliance'] });
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
            <Dialog.Title className="font-semibold text-neutral-900">Add DBS Record</Dialog.Title>
            <button onClick={onClose} className="text-neutral-400 hover:text-neutral-600">
              <XMarkIcon className="h-5 w-5" />
            </button>
          </div>

          <form onSubmit={handleSubmit((v) => mutation.mutate(v))} className="px-6 py-4 space-y-4">
            <div>
              <label className="label">Member</label>
              <select className="input" {...register('memberId')}>
                <option value="">Select member…</option>
                {members.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.firstName} {m.lastName}
                    {m.membershipNumber ? ` (${m.membershipNumber})` : ''}
                  </option>
                ))}
              </select>
              {errors.memberId && (
                <p className="text-xs text-red-600 mt-1">{errors.memberId.message}</p>
              )}
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="label">Check Date</label>
                <input type="date" className="input" {...register('checkDate')} />
                {errors.checkDate && (
                  <p className="text-xs text-red-600 mt-1">{errors.checkDate.message}</p>
                )}
              </div>
              <div>
                <label className="label">Expiry Date</label>
                <input type="date" className="input" {...register('expiryDate')} />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="label">Check Type</label>
                <select className="input" {...register('checkType')}>
                  <option value="ENHANCED">Enhanced</option>
                  <option value="STANDARD">Standard</option>
                  <option value="BASIC">Basic</option>
                </select>
              </div>
              <div>
                <label className="label">Status</label>
                <select className="input" {...register('status')}>
                  <option value="VALID">Valid</option>
                  <option value="PENDING">Pending</option>
                  <option value="EXPIRED">Expired</option>
                  <option value="FLAGGED">Flagged</option>
                  <option value="NOT_REQUIRED">Not Required</option>
                </select>
              </div>
            </div>

            <div>
              <label className="label">Certificate Number</label>
              <input
                type="text"
                className="input"
                placeholder="e.g. 001234567890"
                {...register('certificateNumber')}
              />
              <p className="text-xs text-neutral-400 mt-0.5">
                Stored encrypted. Leave blank if unknown.
              </p>
            </div>

            <div>
              <label className="label">Issued By</label>
              <input
                type="text"
                className="input"
                placeholder="e.g. DBS Update Service"
                {...register('issuedBy')}
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
                {mutation.isPending ? 'Saving…' : 'Save Record'}
              </button>
            </div>
          </form>
        </Dialog.Panel>
      </div>
    </Dialog>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export function DBSManagement(): JSX.Element {
  const [modalOpen, setModalOpen] = useState(false);

  const { data, isLoading, error } = useQuery<PagedResponse<DBSRecord>>({
    queryKey: ['compliance', 'dbs'],
    queryFn: () => apiClient.get<PagedResponse<DBSRecord>>('/compliance/dbs').then((r) => r.data),
  });

  const { data: members = [] } = useQuery<MemberOption[]>({
    queryKey: ['compliance', 'members'],
    queryFn: () => apiClient.get<MemberOption[]>('/compliance/members').then((r) => r.data),
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-neutral-900">DBS Management</h1>
          <p className="text-sm text-neutral-500 mt-0.5">Manage DBS checks for all club members.</p>
        </div>
        <button
          className="btn-primary flex items-center gap-1.5"
          onClick={() => setModalOpen(true)}
        >
          <PlusIcon className="h-4 w-4" />
          Add DBS Record
        </button>
      </div>

      <div className="card overflow-hidden">
        {isLoading ? (
          <div className="flex items-center justify-center h-40">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary-600" />
          </div>
        ) : error ? (
          <div className="p-6 text-sm text-red-600">Failed to load DBS records.</div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-xs text-neutral-500 uppercase tracking-wide bg-neutral-50 border-b border-neutral-200">
                <th className="px-4 py-3 font-medium">Member</th>
                <th className="px-4 py-3 font-medium">Check Date</th>
                <th className="px-4 py-3 font-medium">Expiry Date</th>
                <th className="px-4 py-3 font-medium">Type</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 font-medium">Issued By</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100">
              {data?.data.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-neutral-400">
                    No DBS records yet. Add one to get started.
                  </td>
                </tr>
              )}
              {data?.data.map((record) => (
                <tr key={record.id} className="hover:bg-neutral-50">
                  <td className="px-4 py-3">
                    <p className="font-medium text-neutral-900">
                      {record.member.firstName} {record.member.lastName}
                    </p>
                    <p className="text-xs text-neutral-400">{record.member.membershipNumber}</p>
                  </td>
                  <td className="px-4 py-3 text-neutral-700">
                    {format(new Date(record.checkDate), 'dd MMM yyyy')}
                  </td>
                  <td className="px-4 py-3 text-neutral-700">
                    {record.expiryDate ? format(new Date(record.expiryDate), 'dd MMM yyyy') : '—'}
                  </td>
                  <td className="px-4 py-3 text-neutral-600">{record.checkType}</td>
                  <td className="px-4 py-3">
                    <StatusBadge status={record.status} />
                  </td>
                  <td className="px-4 py-3 text-neutral-600">{record.issuedBy ?? '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <AddDBSModal open={modalOpen} onClose={() => setModalOpen(false)} members={members} />
    </div>
  );
}
