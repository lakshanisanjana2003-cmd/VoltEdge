export function StatCard({ label, value, icon: Icon, note }) {
  return (
    <div className="shadow-card rounded-lg border bg-card p-5">
      <div className="flex items-center justify-between gap-3">
        <p className="whitespace-nowrap text-sm text-muted-foreground">{label}</p>
        <Icon className="h-6 w-6 text-primary" />
      </div>
      <p className="mt-3 font-mono text-3xl font-medium">{value}</p>
      {note && <p className="mt-1 text-xs text-muted-foreground">{note}</p>}
    </div>
  );
}
export function Panel({ title, children }) {
  return (
    <section className="shadow-card rounded-lg border bg-card">
      <h2 className="border-b px-5 py-3 text-sm font-semibold">{title}</h2>
      <div className="p-5">{children}</div>
    </section>
  );
}
