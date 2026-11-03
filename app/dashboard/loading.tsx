export default function DashboardLoading() {
  return (
    <div className="space-y-6" aria-busy="true">
      <div className="h-7 w-40 animate-pulse rounded bg-foreground/10" />
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }, (_, i) => (
          <div key={i} className="h-24 animate-pulse rounded-xl bg-foreground/10" />
        ))}
      </div>
      <div className="h-64 animate-pulse rounded-xl bg-foreground/10" />
    </div>
  );
}
