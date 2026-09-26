export function StatusChip({ paid, target, idle = 'Minimum' }: { paid: boolean; target: boolean; idle?: string }) {
  if (paid) return <span className="chip paid">Paid off</span>
  if (target) return <span className="chip target">Target</span>
  return <span className="chip queued">{idle}</span>
}
