export type DeadlineInput = { dueAt: string; now: string };
export type DeadlineStatus = "overdue" | "due-soon" | "on-track";

export function deadlineStatus({ dueAt, now }: DeadlineInput): DeadlineStatus {
  const hours = (Date.parse(dueAt) - Date.parse(now)) / 3_600_000;
  if (hours < 0) return "overdue";
  if (hours <= 48) return "due-soon";
  return "on-track";
}
