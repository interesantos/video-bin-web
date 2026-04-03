import { cn } from '@/lib/utils'
import type { VideoStatus, RenderStatus } from '@/lib/types'

type BadgeVariant = 'default' | 'new' | 'rendering' | 'ready' | 'error' | 'info'

interface BadgeProps {
  variant?: BadgeVariant
  children: React.ReactNode
  className?: string
}

const variantClasses: Record<BadgeVariant, string> = {
  default: 'bg-gray-100 text-gray-700',
  new: 'bg-blue-100 text-blue-700',
  rendering: 'bg-yellow-100 text-yellow-700',
  ready: 'bg-green-100 text-green-700',
  error: 'bg-red-100 text-red-700',
  info: 'bg-indigo-100 text-indigo-700',
}

export function Badge({ variant = 'default', children, className }: BadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium',
        variantClasses[variant],
        className
      )}
    >
      {variant === 'rendering' && (
        <span className="w-1.5 h-1.5 rounded-full bg-yellow-500 animate-pulse" />
      )}
      {children}
    </span>
  )
}

export function VideoStatusBadge({ status }: { status: VideoStatus }) {
  const labels: Record<VideoStatus, string> = {
    new: 'New',
    rendering: 'Rendering',
    ready: 'Ready',
    error: 'Error',
  }
  return <Badge variant={status}>{labels[status]}</Badge>
}

export function RenderStatusBadge({ status }: { status: RenderStatus }) {
  const variantMap: Record<RenderStatus, BadgeVariant> = {
    queued: 'new',
    rendering: 'rendering',
    done: 'ready',
    failed: 'error',
  }
  const labels: Record<RenderStatus, string> = {
    queued: 'Queued',
    rendering: 'Rendering',
    done: 'Done',
    failed: 'Failed',
  }
  return <Badge variant={variantMap[status]}>{labels[status]}</Badge>
}
