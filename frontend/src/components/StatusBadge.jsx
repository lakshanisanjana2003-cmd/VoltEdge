import { Badge } from "@/components/ui/badge";

// Maps project status /priority to coloured badge.
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
