import { Headphones, LifeBuoy, MessageSquare } from 'lucide-react'
import type React from 'react'
import { useState } from 'react'
import type { AdminReviewStats } from '../../types'
import { AdminHeaderBanner } from './AdminHeaderBanner'
import { AdminReviewsView } from './AdminReviewsView'
import { AdminTicketsView } from './AdminTicketsView'

interface AdminSupportAndReviewsViewProps {
  adminUser?: any
  initialTab?: 'tickets' | 'reviews'
  onTicketsCountUpdated?: (count: number) => void
  onReviewsStatsUpdated?: (stats: AdminReviewStats) => void
}

export const AdminSupportAndReviewsView: React.FC<
  AdminSupportAndReviewsViewProps
> = ({
  adminUser,
  initialTab = 'tickets',
  onTicketsCountUpdated,
  onReviewsStatsUpdated,
}) => {
  const [activeTab, setActiveTab] = useState<'tickets' | 'reviews'>(initialTab)
  const [ticketsPending, setTicketsPending] = useState<number>(0)
  const [reviewsPending, setReviewsPending] = useState<number>(0)

  const handleTicketsCount = (count: number) => {
    setTicketsPending(count)
    if (onTicketsCountUpdated) onTicketsCountUpdated(count)
  }

  const handleReviewsStats = (stats: AdminReviewStats) => {
    setReviewsPending(stats.pending_reviews)
    if (onReviewsStatsUpdated) onReviewsStatsUpdated(stats)
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-300 pb-12" dir="rtl">
      {/* Top Header Banner */}
      <AdminHeaderBanner
        icon={Headphones}
        title="مرکز پشتیبانی، تیکت‌ها و نظرات خریداران"
        subtitle="میز کار متمرکز پاسخگویی به درخواست‌های پشتیبانی کاربران، پیگیری مکاتبات آنلاین و بررسی و انتشار نظرات و امتیازات محصولات"
        badgeText="پشتیبانی و ارتباط با مشتریان"
      />

      {/* Modern Subtabs Navigation */}
      <div className="flex items-center gap-1.5 p-1 bg-muted/40 rounded-surface border border-border/60 overflow-x-auto scrollbar-none">
        <button
          type="button"
          onClick={() => setActiveTab('tickets')}
          className={`flex items-center gap-2 px-4 py-2 rounded-control text-xs font-bold transition-all whitespace-nowrap cursor-pointer duration-motion active:scale-[0.98] ${
            activeTab === 'tickets'
              ? 'bg-primary text-primary-foreground shadow-control'
              : 'text-muted-foreground hover:text-foreground hover:bg-muted/60'
          }`}
        >
          <LifeBuoy className="w-4 h-4 shrink-0" />
          <span>میز تیکت‌ها و درخواست‌های پشتیبانی</span>
          {ticketsPending > 0 && (
            <span
              className={`px-1.5 py-0.2 rounded-control text-[10px] font-mono font-latin ${
                activeTab === 'tickets'
                  ? 'bg-primary-foreground/20 text-primary-foreground'
                  : 'bg-rose-500/10 text-rose-500 border border-rose-500/30'
              }`}
            >
              {ticketsPending} جدید
            </span>
          )}
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('reviews')}
          className={`flex items-center gap-2 px-4 py-2 rounded-control text-xs font-bold transition-all whitespace-nowrap cursor-pointer duration-motion active:scale-[0.98] ${
            activeTab === 'reviews'
              ? 'bg-primary text-primary-foreground shadow-control'
              : 'text-muted-foreground hover:text-foreground hover:bg-muted/60'
          }`}
        >
          <MessageSquare className="w-4 h-4 shrink-0" />
          <span>مدیریت نظرات و بازخورد خریداران</span>
          {reviewsPending > 0 && (
            <span
              className={`px-1.5 py-0.2 rounded-control text-[10px] font-mono font-latin ${
                activeTab === 'reviews'
                  ? 'bg-primary-foreground/20 text-primary-foreground'
                  : 'bg-amber-500/10 text-amber-500 border border-amber-500/30'
              }`}
            >
              {reviewsPending} جدید
            </span>
          )}
        </button>
      </div>

      {/* Subtab Content */}
      {activeTab === 'tickets' && (
        <AdminTicketsView
          adminUser={adminUser}
          onUpdatePendingCount={handleTicketsCount}
        />
      )}

      {activeTab === 'reviews' && (
        <AdminReviewsView onStatsUpdated={handleReviewsStats} />
      )}
    </div>
  )
}
