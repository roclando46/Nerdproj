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

type TrainingType =
  | 'SAFE_HANDS'
  | 'WELFARE_OFFICER'
  | 'FIRST_AID'
  | 'COACHING_LEVEL_1'
  | 'COACHING_LEVEL_2'
  | 'DBS_AWARENESS'
  | 'CUSTOM';

interface MemberOption {
  id: string;
  firstName: string;
  lastName: string;
  membershipNumber: string | null;
}

interface TrainingRecord {
  id: string;
  memberId: string;
  member: { firstName: string; lastName: string; membershipNumber: string | null };
  trainingType: TrainingType;
  customTypeName: string | null;
  completedAt: string;
  expiryDate: string | null;
  provider: string | null;
  certificateRef: string | null;
  isValid: boolean;
}

interface PagedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

// ─── Form schema ──────────────────────────────────────────────────────────────

const TRAINING_TYPES: TrainingType[] = [
  'SAFE_HANDS',
  'WELFARE_OFFICER',
  'FIRST_AID',
  'COACHING_LEVEL_1',
  'COACHING_LEVEL_2',
  'DBS_AWARENESS',
  'CUSTOM',
];

const TRAINING_LABELS: Record<TrainingType, string> = {
  SAFE_HANDS: 'ECB Safe Hands',
  WELFARE_OFFICER: 'Welfare Officer',
  FIRST_AID: 'First Aid',
  COACHING_LEVEL_1: 'Coaching Level 1',
  COACHING_LEVEL_2: 'Coaching Level 2',
  DBS_AWARENESS: 'DBS Awareness',
  CUSTOM: 'Custom',
};

const formSchema = z.object({
  memberId: z.string().min(1, 'Select a member'),
  trainingType: z.enum([
    'SAFE_HANDS',
    'WELFARE_OFFICER',
    'FIRST_AID',
    'COACHING_LEVEL_1',
    'COACHING_LEVEL_2',
    'DBS_AWARENESS',
    'CUSTOM',
  ] as const),
  customTypeName: z.string().max(100).optional(),
  completedAt: z.string().min(1, 'Completion date is required'),
  expiryDate: z.string().optional(),
  provider: z.string().max(200).optional(),
  certificateRef: z.string().max(100).optional(),
});

type FormValues = z.infer<typeof formSchema>;

function toISOLocal(dateStr: string) {
  return dateStr ? `${dateStr}T00:00:00.000Z` : undefined;
}

// ─── Add Modal ────────────────────────────────────────────────────────────────

function AddTrainingModal({
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
    watch,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: { trainingType: 'SAFE_HANDS' },
  });

  const trainingType = watch('trainingType');

  const mutation = useMutation({
    mutationFn: (values: FormValues) =>
      apiClient.post('/compliance/training', {
        ...values,
        completedAt: toISOLocal(values.completedAt)!,
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
            <Dialog.Title className="font-semibold text-neutral-900">
              Add Training Record
            </Dialog.Title>
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

            <div>
              <label className="label">Training Type</label>
              <select className="input" {...register('trainingType')}>
                {TRAINING_TYPES.map((t) => (
                  <option key={t} value={t}>
                    {TRAINING_LABELS[t]}
                  </option>
                ))}
              </select>
            </div>

            {trainingType === 'CUSTOM' && (
              <div>
                <label className="label">Custom Training Name</label>
                <input type="text" className="input" {...register('customTypeName')} />
              </div>
            )}

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="label">Completed Date</label>
                <input type="date" className="input" {...register('completedAt')} />
                {errors.completedAt && (
                  <p className="text-xs text-red-600 mt-1">{errors.completedAt.message}</p>
                )}
              </div>
              <div>
                <label className="label">Expiry Date</label>
                <input type="date" className="input" {...register('expiryDate')} />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="label">Provider</label>
                <input
                  type="text"
                  className="input"
                  placeholder="e.g. ECB"
                  {...register('provider')}
                />
              </div>
              <div>
                <label className="label">Certificate Ref</label>
                <input
                  type="text"
                  className="input"
                  placeholder="e.g. SH-2024-00123"
                  {...register('certificateRef')}
                />
              </div>
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

export function TrainingTracker(): JSX.Element {
  const [modalOpen, setModalOpen] = useState(false);

  const { data, isLoading, error } = useQuery<PagedResponse<TrainingRecord>>({
    queryKey: ['compliance', 'training'],
    queryFn: () =>
      apiClient.get<PagedResponse<TrainingRecord>>('/compliance/training').then((r) => r.data),
  });

  const { data: members = [] } = useQuery<MemberOption[]>({
    queryKey: ['compliance', 'members'],
    queryFn: () => apiClient.get<MemberOption[]>('/compliance/members').then((r) => r.data),
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-neutral-900">Training Records</h1>
          <p className="text-sm text-neutral-500 mt-0.5">
            Track ECB Safe Hands, First Aid, and other required training.
          </p>
        </div>
        <button
          className="btn-primary flex items-center gap-1.5"
          onClick={() => setModalOpen(true)}
        >
          <PlusIcon className="h-4 w-4" />
          Add Training Record
        </button>
      </div>

      <div className="card overflow-hidden">
        {isLoading ? (
          <div className="flex items-center justify-center h-40">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary-600" />
          </div>
        ) : error ? (
          <div className="p-6 text-sm text-red-600">Failed to load training records.</div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-xs text-neutral-500 uppercase tracking-wide bg-neutral-50 border-b border-neutral-200">
                <th className="px-4 py-3 font-medium">Member</th>
                <th className="px-4 py-3 font-medium">Training</th>
                <th className="px-4 py-3 font-medium">Completed</th>
                <th className="px-4 py-3 font-medium">Expiry</th>
                <th className="px-4 py-3 font-medium">Provider</th>
                <th className="px-4 py-3 font-medium">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100">
              {data?.data.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-neutral-400">
                    No training records yet. Add one to get started.
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
                    {record.trainingType === 'CUSTOM' && record.customTypeName
                      ? record.customTypeName
                      : TRAINING_LABELS[record.trainingType]}
                  </td>
                  <td className="px-4 py-3 text-neutral-700">
                    {format(new Date(record.completedAt), 'dd MMM yyyy')}
                  </td>
                  <td className="px-4 py-3 text-neutral-700">
                    {record.expiryDate ? format(new Date(record.expiryDate), 'dd MMM yyyy') : '—'}
                  </td>
                  <td className="px-4 py-3 text-neutral-600">{record.provider ?? '—'}</td>
                  <td className="px-4 py-3">
                    {record.isValid ? (
                      <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                        Valid
                      </span>
                    ) : (
                      <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-red-100 text-red-800">
                        Expired
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <AddTrainingModal open={modalOpen} onClose={() => setModalOpen(false)} members={members} />
    </div>
  );
}
