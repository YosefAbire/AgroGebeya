import { type LucideIcon } from 'lucide-react'

interface StatsCardProps {
  icon: LucideIcon
  label: string
  value: string | number
  trend?: {
    value: number
    isPositive: boolean
  }
  color?: 'primary' | 'accent' | 'secondary'
}

export default function StatsCard({
  icon: Icon,
  label,
  value,
  trend,
  color = 'primary',
}: StatsCardProps) {
  const colorClasses = {
    primary: 'bg-primary/10 text-primary',
    accent: 'bg-accent/10 text-accent',
    secondary: 'bg-secondary/10 text-secondary',
  }

  return (
    <div className="rounded-lg border border-border bg-card p-6">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm text-muted-foreground">{label}</p>
          <p className="mt-2 text-2xl font-bold text-foreground">{value}</p>
          {trend && (
            <p className={`mt-1 text-xs font-medium ${trend.isPositive ? 'text-green-600' : 'text-red-600'}`}>
              {trend.isPositive ? '+' : '-'}{Math.abs(trend.value)}% from last month
            </p>
          )}
        </div>
        <div className={`rounded-lg p-3 ${colorClasses[color]}`}>
          <Icon className="h-6 w-6" />
        </div>
      </div>
    </div>
  )
}
