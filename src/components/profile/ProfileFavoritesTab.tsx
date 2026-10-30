import {
  ArrowLeft,
  BookOpen,
  ChevronLeft,
  ChevronRight,
  ExternalLink,
  Heart,
  HelpCircle,
  Trash2,
} from 'lucide-react'
import type React from 'react'
import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { apiService } from '../../services/api'
import {
  formatNumber,
  formatToman,
  toPersianDigits,
} from '../../utils/formatters'
import {
  getLocalWishlist,
  toggleItemFavorite,
  type WishlistItem,
} from '../../utils/wishlist'
import { useNotification } from '../vibefarsi/NotificationContext'

export const ProfileFavoritesTab: React.FC = () => {
  const { success: notifySuccess } = useNotification()
  const [items, setItems] = useState<WishlistItem[]>([])
  const [filterType, setFilterType] = useState<'all' | 'article' | 'guide'>(
    'all',
  )
  const [page, setPage] = useState<number>(1)
  const pageSize = 6

  const loadData = () => {
    setItems(getLocalWishlist())
  }

  useEffect(() => {
    loadData()
    const handleSync = () => loadData()
    window.addEventListener('anahix:wishlist:updated', handleSync)
    return () =>
      window.removeEventListener('anahix:wishlist:updated', handleSync)
  }, [])

  const filtered = useMemo(() => {
    if (filterType === 'all') return items
    return items.filter((it) => it.target_type === filterType)
  }, [items, filterType])

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize))
  const pagedItems = useMemo(() => {
    const start = (page - 1) * pageSize
    return filtered.slice(start, start + pageSize)
  }, [filtered, page, pageSize])

  const handleFilterChange = (type: 'all' | 'article' | 'guide') => {
    setFilterType(type)
    setPage(1)
  }

  const handleRemove = async (it: WishlistItem) => {
    await toggleItemFavorite(it, apiService.isCustomerLoggedIn())
    notifySuccess('حذف شد', 'آیتم از لیست علاقه‌مندی‌ها حذف گردید.')
    loadData()
  }

  const getItemLink = (it: WishlistItem) => {
    if (it.target_type === 'article') return `/blog/${it.target_id}`
    return `/help/${it.target_id}`
  }

  const getTypeBadge = (type: string) => {
    switch (type) {
      case 'article':
        return {
          label: 'مقاله وبلاگ',
          badgeClass:
            'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
          icon: <BookOpen className="w-3.5 h-3.5" />,
        }
      case 'guide':
        return {
          label: 'آموزش و راهنما',
          badgeClass: 'bg-amber-500/10 text-amber-500 border-amber-500/20',
          icon: <HelpCircle className="w-3.5 h-3.5" />,
        }
      default:
        return {
          label: 'آموزش',
          badgeClass: 'bg-secondary text-foreground',
          icon: <Heart className="w-3.5 h-3.5" />,
        }
    }
  }

  return (
    <div
      className="space-y-6 text-right select-none animate-in fade-in duration-200"
      dir="rtl"
    >
      {/* Top Header Card */}
      <div className="bg-card p-5 sm:p-6 rounded-surface border border-border/80 shadow-surface space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-border/60 pb-4">
          <div>
            <h3 className="text-base font-black text-foreground flex items-center gap-2">
              <Heart className="w-5 h-5 text-rose-500 fill-rose-500" />
              <span>
                علاقه‌مندی‌ها و مقالات نشان‌شده ({toPersianDigits(items.length)})
              </span>
            </h3>
            <p className="text-xs text-muted-foreground mt-0.5">
              مدیریت و دسترسی سریع به مقالات، آموزش‌ها و راهنماهای منتخب شما
            </p>
          </div>

          <div className="flex items-center gap-1.5 p-1 bg-muted/40 rounded-surface border border-border/60 overflow-x-auto scrollbar-none">
            {[
              { id: 'all', label: `همه (${toPersianDigits(items.length)})` },
              {
                id: 'article',
                label: `مقالات وبلاگ (${toPersianDigits(
                  items.filter((i) => i.target_type === 'article').length,
                )})`,
              },
              {
                id: 'guide',
                label: `آموزش‌ها و راهنماها (${toPersianDigits(
                  items.filter((i) => i.target_type === 'guide').length,
                )})`,
              },
            ].map((btn) => (
              <button
                key={btn.id}
                type="button"
                onClick={() => handleFilterChange(btn.id as any)}
                className={`px-3 py-1.5 rounded-control text-xs font-bold transition-all whitespace-nowrap cursor-pointer duration-motion active:scale-[0.98] ${
                  filterType === btn.id
                    ? 'bg-primary text-primary-foreground font-black shadow-control'
                    : 'text-muted-foreground hover:bg-muted/60 hover:text-foreground'
                }`}
              >
                {btn.label}
              </button>
            ))}
          </div>
        </div>

        {filtered.length === 0 ? (
          <div className="py-16 text-center text-muted-foreground bg-muted/10 rounded-surface border border-dashed border-border/60 space-y-3">
            <div className="w-12 h-12 rounded-full bg-rose-500/10 text-rose-500 border border-rose-500/20 flex items-center justify-center mx-auto shadow-xs">
              <Heart className="w-6 h-6" />
            </div>
            <h4 className="font-bold text-sm text-foreground">
              هیچ مقاله یا آموزشی نشان نشده است
            </h4>
            <p className="text-xs text-muted-foreground max-w-sm mx-auto leading-relaxed">
              با زدن دکمه «افزودن به علاقه‌مندی‌ها» در مقالات وبلاگ و راهنماها،
              آن‌ها را برای مطالعه مجدد به این لیست اضافه فرمایید.
            </p>
            <div className="pt-2 flex items-center justify-center gap-3">
              <Link
                to="/blog"
                className="h-9 px-4 rounded-control bg-primary hover:bg-primary-hover text-primary-foreground text-xs font-black flex items-center gap-1.5 shadow-control transition-all"
              >
                <span>مطالعه مقالات وبلاگ</span>
                <ArrowLeft className="w-3.5 h-3.5" />
              </Link>
              <Link
                to="/help"
                className="h-9 px-4 rounded-control border border-border/60 bg-secondary hover:bg-muted text-foreground text-xs font-bold flex items-center gap-1.5 transition-all"
              >
                <span>پایگاه دانش و راهنما</span>
              </Link>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {pagedItems.map((it) => {
                const b = getTypeBadge(it.target_type)
                return (
                  <div
                    key={`${it.target_type}-${it.target_id}`}
                    className="bg-card rounded-surface border border-border/80 shadow-surface overflow-hidden flex flex-col justify-between hover:border-brand/40 duration-motion ease-motion transition-all group"
                  >
                    {/* Optional Thumbnail Image */}
                    {it.image_url && (
                      <div className="relative h-36 w-full overflow-hidden bg-zinc-950 border-b border-border/60">
                        <img
                          src={it.image_url}
                          alt={it.title}
                          className="w-full h-full object-cover group-hover:scale-105 duration-motion ease-motion transition-transform"
                        />
                        <div className="absolute top-2.5 right-2.5">
                          <span
                            className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-control text-[10px] font-black border backdrop-blur-md shadow-xs ${b.badgeClass}`}
                          >
                            {b.icon}
                            <span>{b.label}</span>
                          </span>
                        </div>
                      </div>
                    )}

                    <div className="p-4 space-y-3 flex-1 flex flex-col justify-between">
                      <div className="space-y-2">
                        {!it.image_url && (
                          <div className="flex items-center justify-between">
                            <span
                              className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-control text-[10px] font-bold border ${b.badgeClass}`}
                            >
                              {b.icon}
                              <span>{b.label}</span>
                            </span>
                          </div>
                        )}

                        <h4 className="font-bold text-xs sm:text-sm text-foreground line-clamp-2 leading-snug">
                          {it.title}
                        </h4>

                        {it.price_toman && it.price_toman > 0 && (
                          <div className="text-sm font-black text-brand font-sans pt-1">
                            {formatToman(it.price_toman)}{' '}
                            <span className="text-[10px] font-normal text-muted-foreground font-sans">
                              تومان
                            </span>
                          </div>
                        )}
                      </div>

                      <div className="pt-3 border-t border-border/40 flex items-center justify-between gap-2 mt-auto">
                        <button
                          type="button"
                          onClick={() => handleRemove(it)}
                          className="h-8 px-2.5 rounded-control text-muted-foreground hover:text-rose-500 hover:bg-rose-500/10 text-xs font-bold transition-colors flex items-center gap-1 cursor-pointer"
                          title="حذف از علاقه‌مندی‌ها"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          <span>حذف</span>
                        </button>

                        <Link
                          to={getItemLink(it)}
                          className="h-8 px-3.5 rounded-control bg-secondary hover:bg-muted text-foreground text-xs font-bold transition flex items-center gap-1.5 shadow-xs duration-motion active:scale-[0.98]"
                        >
                          <span>مشاهده</span>
                          <ExternalLink className="w-3 h-3 text-muted-foreground" />
                        </Link>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>

            {/* Pagination Controls */}
            {totalPages > 1 && (
              <div className="p-3.5 rounded-surface border border-border/60 bg-muted/20 flex items-center justify-between text-xs text-muted-foreground font-sans">
                <span>
                  صفحه {toPersianDigits(page)} از {toPersianDigits(totalPages)}{' '}
                  (مجموع {formatNumber(filtered.length)} مورد)
                </span>

                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    disabled={page <= 1}
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    className="p-1.5 rounded-control border border-border/60 bg-card hover:bg-muted text-foreground disabled:opacity-40 cursor-pointer transition-colors"
                    title="صفحه قبل"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>

                  <div className="flex items-center gap-1">
                    {Array.from({ length: totalPages }, (_, i) => i + 1).map(
                      (num) => (
                        <button
                          key={num}
                          type="button"
                          onClick={() => setPage(num)}
                          className={`w-7 h-7 rounded-control text-xs font-bold transition-all cursor-pointer ${
                            page === num
                              ? 'bg-primary text-primary-foreground shadow-control font-black'
                              : 'border border-border/60 bg-card hover:bg-muted text-muted-foreground hover:text-foreground'
                          }`}
                        >
                          {toPersianDigits(num)}
                        </button>
                      ),
                    )}
                  </div>

                  <button
                    type="button"
                    disabled={page >= totalPages}
                    onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                    className="p-1.5 rounded-control border border-border/60 bg-card hover:bg-muted text-foreground disabled:opacity-40 cursor-pointer transition-colors"
                    title="صفحه بعد"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
