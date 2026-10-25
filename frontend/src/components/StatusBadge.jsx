import { Badge } from "@/components/ui/badge";

// Maps a project status or priority to a coloured badge.
const statusVariant = {
  Planned: "muted",
  Ongoing: "info",
  "On Hold": "warning",
  Completed: "success",
  Low: "muted",
  Medium: "info",
  High: "warning",
  Urgent: "danger",
};
export function StatusBadge({ value }) {
  return <Badge variant={statusVariant[value] ?? "muted"}>{value}</Badge>;
}
