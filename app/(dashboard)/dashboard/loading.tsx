export default function Loading() {
  return (
    <div className="space-y-6">
      <div className="space-y-3">
        <div className="h-8 w-56 rounded-md bg-muted" />
        <div className="h-5 w-full max-w-2xl rounded-md bg-muted/70" />
      </div>

      <div className="grid gap-3 md:grid-cols-3">
        {Array.from({ length: 3 }).map((_, index) => (
          <div key={index} className="rounded-lg border bg-white p-4">
            <div className="mb-4 flex items-center justify-between">
              <div className="h-4 w-28 rounded-md bg-muted/80" />
              <div className="h-4 w-4 rounded-full bg-muted/80" />
            </div>
            <div className="h-8 w-20 rounded-md bg-muted" />
            <div className="mt-3 h-3 w-32 rounded-md bg-muted/70" />
          </div>
        ))}
      </div>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1.35fr)_minmax(280px,0.85fr)]">
        <div className="space-y-3">
          <div className="h-6 w-40 rounded-md bg-muted" />
          <div className="space-y-3 rounded-lg border bg-white p-4">
            {Array.from({ length: 4 }).map((_, index) => (
              <div key={index} className="grid gap-3 rounded-md border border-dashed p-3 sm:grid-cols-[72px_minmax(0,1fr)_auto] sm:items-center">
                <div className="h-12 rounded-md bg-muted/80" />
                <div className="space-y-2">
                  <div className="h-4 w-44 rounded-md bg-muted/80" />
                  <div className="h-3 w-full max-w-xl rounded-md bg-muted/60" />
                </div>
                <div className="h-9 w-24 rounded-md bg-muted/80" />
              </div>
            ))}
          </div>
        </div>

        <div className="space-y-3">
          <div className="h-6 w-44 rounded-md bg-muted" />
          <div className="space-y-3 rounded-lg border bg-white p-4">
            {Array.from({ length: 3 }).map((_, index) => (
              <div key={index} className="rounded-lg border bg-background p-3">
                <div className="h-4 w-40 rounded-md bg-muted/80" />
                <div className="mt-2 h-3 w-full rounded-md bg-muted/60" />
                <div className="mt-4 h-3 w-24 rounded-md bg-muted/60" />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
