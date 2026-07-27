export default function LoadingResults() {
  return (
    <div className="state-empty" aria-busy="true">
      <div>
        <div className="mx-auto mb-3 h-1.5 w-24 overflow-hidden rounded-full bg-line">
          <div className="h-full w-1/2 animate-pulse-slow rounded-full bg-primary" />
        </div>
        <p className="text-sm text-muted">Loading results…</p>
      </div>
    </div>
  );
}
