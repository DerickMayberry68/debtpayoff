import { money0, monthLabel } from '../lib/format'

export function ProjectionChart({ series }: { series: number[] }) {
  if (series.length < 2) return <div className="empty">Nothing to project.</div>
  const W = 900, H = 220, L = 64, R = 16, T = 12, B = 30
  const max = Math.max(...series)
  const n = series.length - 1
  const step = max > 10000 ? 5000 : max > 4000 ? 2000 : 1000
  const top = Math.ceil(max / step) * step || step
  const x = (i: number) => L + ((W - L - R) * i) / n
  const y = (v: number) => T + (H - T - B) * (1 - v / top)
  const ticks: number[] = []
  for (let v = 0; v <= top; v += step) ticks.push(v)
  const every = n > 18 ? Math.ceil(n / 6) : n > 8 ? 3 : 1
  const months: number[] = []
  for (let i = 0; i <= n; i += every) months.push(i)
  const pts = series.map((v, i) => `${x(i).toFixed(1)},${y(v).toFixed(1)}`).join(' ')
  const area = `${x(0)},${y(0)} ${pts} ${x(n)},${y(0)}`

  return (
    <div className="scroll-x">
      <svg viewBox={`0 0 ${W} ${H}`} width="100%" className="chart" role="img"
        aria-label={`Projected total balance falling to zero over ${n} months`}>
        {ticks.map(v => (
          <g key={v}>
            <line x1={L} x2={W - R} y1={y(v)} y2={y(v)} stroke="var(--line)" />
            <text x={L - 8} y={y(v) + 4} textAnchor="end">{money0(v)}</text>
          </g>
        ))}
        {months.map(i => (
          <text key={i} x={x(i)} y={H - 8} textAnchor="middle">{monthLabel(i)}</text>
        ))}
        <polygon points={area} fill="var(--accent-soft)" />
        <polyline points={pts} fill="none" stroke="var(--accent)" strokeWidth={2.5} strokeLinejoin="round" />
        <circle cx={x(0)} cy={y(series[0])} r={4} fill="var(--accent)" />
        <circle cx={x(n)} cy={y(0)} r={5} fill="var(--surface)" stroke="var(--accent)" strokeWidth={2.5} />
      </svg>
    </div>
  )
}
