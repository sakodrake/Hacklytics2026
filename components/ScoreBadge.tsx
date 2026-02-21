export default function ScoreBadge({
  label,
  value,
  subtitle
}: {
  label: string
  value?: number
  subtitle?: string
}) {
  const getColor = (score: number) => {
    if (score >= 70) return 'bg-green-100 text-green-800 border border-green-300'
    if (score >= 50) return 'bg-yellow-100 text-yellow-800 border border-yellow-300'
    return 'bg-red-100 text-red-800 border border-red-300'
  }

  const bgColor = typeof value === 'number' ? getColor(value) : 'bg-slate-100 text-slate-800'

  return (
    <div className={`inline-flex items-center gap-2 px-3 py-1 rounded font-medium text-sm ${bgColor}`}>
      <span>{label}</span>
      {typeof value === 'number' && (
        <span className="font-bold">{value}</span>
      )}
      {subtitle && <span className="text-xs opacity-75">{subtitle}</span>}
    </div>
  )
}
