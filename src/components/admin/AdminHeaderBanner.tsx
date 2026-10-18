import type React from 'react'

interface AdminHeaderBannerProps {
  icon: React.ElementType
  title: string
  subtitle: string
  badgeText?: string
  badgeVariant?: 'brand' | 'success' | 'warning'
  actions?: React.ReactNode
}

export const AdminHeaderBanner: React.FC<AdminHeaderBannerProps> = ({
  icon: Icon,
  title,
  subtitle,
  badgeText,
  badgeVariant = 'brand',
  actions,
}) => {
  return (
    <div className="rounded-surface border border-border/80 bg-card p-5 sm:p-6 shadow-surface flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 select-none duration-motion">
      <div className="flex items-start sm:items-center gap-3.5 min-w-0">
        <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-control bg-secondary text-brand border border-border/60 flex items-center justify-center shrink-0 shadow-control">
          <Icon className="w-5 h-5 text-brand" />
        </div>
        <div className="min-w-0 space-y-1">
          <div className="flex items-center gap-2 flex-wrap">
            <h1 className="text-base sm:text-lg font-black text-foreground tracking-tight">
              {title}
            </h1>
            {badgeText && (
              <span
                className={`text-[10px] font-bold px-2 py-0.5 rounded-control border ${
                  badgeVariant === 'success'
                    ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                    : badgeVariant === 'warning'
                      ? 'bg-amber-500/10 text-amber-500 border-amber-500/20'
                      : 'bg-brand/10 text-brand border border-brand/20'
                }`}
              >
                {badgeText}
              </span>
            )}
          </div>
          <p className="text-xs text-muted-foreground leading-relaxed">
            {subtitle}
          </p>
        </div>
      </div>

      {actions && (
        <div className="flex items-center gap-2 shrink-0 self-end sm:self-auto flex-wrap">
          {actions}
        </div>
      )}
    </div>
  )
}
