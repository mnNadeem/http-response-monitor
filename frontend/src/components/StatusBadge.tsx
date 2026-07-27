export default function StatusBadge({
  success,
  statusCode,
}: {
  success: boolean;
  statusCode: number | null;
}) {
  const label = statusCode ?? 'ERR';
  const classes = success
    ? 'bg-success-muted text-success'
    : 'bg-danger-muted text-danger';
  return (
    <span
      className={`inline-block whitespace-nowrap rounded-md px-2 py-0.5 text-xs font-semibold tabular-nums ${classes}`}
    >
      {success ? '● ' : '▲ '}
      {label}
    </span>
  );
}
