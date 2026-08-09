import { EPermission } from "@/store/admin/permission/types";

/** Mirrors AdminJobStatus in the backend, which serialises it as a string. */
export enum EAdminJobStatus {
  Idle = "Idle",
  Running = "Running",
  Completed = "Completed",
  Failed = "Failed",
  Cancelled = "Cancelled",
  Interrupted = "Interrupted",
}

export interface AdminJobProgress {
  current: number;
  /** Zero when the job cannot know the total up front. */
  total: number;
  message: string | null;
}

export interface AdminJob {
  key: string;
  name: string;
  description: string;
  requiredPermission: EPermission;
  /** The admin has to type the job's name before it will run. */
  requiresConfirmation: boolean;

  status: EAdminJobStatus;
  progress: AdminJobProgress;
  startedAt: string | null;
  finishedAt: string | null;
  /** Time actually worked, excluding any spell the job spent stopped. */
  durationMs: number | null;
  itemsProcessed: number;
  triggeredBy: string | null;
  runCount: number;
  error: string | null;
  /** A resume point exists, so starting again continues rather than restarts. */
  hasCheckpoint: boolean;
}

/** Statuses from which a stopped job would carry on rather than begin again. */
const RESUMABLE = [EAdminJobStatus.Failed, EAdminJobStatus.Cancelled, EAdminJobStatus.Interrupted];

export const isRunning = (job: AdminJob): boolean => job.status === EAdminJobStatus.Running;

export const canResume = (job: AdminJob): boolean => job.hasCheckpoint && RESUMABLE.includes(job.status);

/** A finished job needs `force` before it will run again. */
export const needsForce = (job: AdminJob): boolean => job.status === EAdminJobStatus.Completed;
