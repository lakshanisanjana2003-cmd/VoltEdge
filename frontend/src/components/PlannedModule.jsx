import { Construction } from "lucide-react";
import { PageHeader } from "./PageHeader";

// Shown for pages that are not built yet.
export function PlannedModule({ title, items }) {
  return (
    <div>
      <PageHeader title={title} subtitle="Not built yet" />
      <div className="rounded-lg border border-dashed bg-card p-8">
        <div className="flex items-center gap-3">
          <Construction className="h-5 w-5 text-warning" />
          <p className="font-medium">This module is not built yet.</p>
        </div>
        <p className="mt-2 text-sm text-muted-foreground">It will record:</p>
        <ul className="mt-2 grid gap-1 text-sm sm:grid-cols-2">
          {items.map((item) => (
            <li key={item} className="before:mr-2 before:text-muted-foreground before:content-['—']">
              {item}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
