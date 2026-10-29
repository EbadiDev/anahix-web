import {
  BookOpen,
  ExternalLink,
  Heart,
  HelpCircle,
  Package,
  Trash2,
} from 'lucide-react'
import type React from 'react'
import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { apiService } from '../../services/api'
import { formatToman, toPersianDigits } from '../../utils/formatters'
import {
  getLocalWishlist,
  toggleItemFavorite,
  type WishlistItem,
} from '../../utils/wishlist'
import { useNotification } from '../vibefarsi/NotificationContext'

export const ProfileFavoritesTab: React.FC = () => {
  const { success: notifySuccess } = useNotification()
  const [items, setItems] = useState<WishlistItem[]>([])
  const [filterType, setFilterType] = useState<
    'all' | 'product' | 'article' | 'guide'
  >('all')

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

  const filtered = items.filter((it) => {
    if (filterType === 'all') return true
    return it.target_type === filterType
  })

  const handleRemove = async (it: WishlistItem) => {
    await toggleItemFavorite(it, apiService.isCustomerLoggedIn())
    notifySuccess('حذف شد', 'آیتم از لیست علاقه‌مندی‌ها حذف گردید.')
    loadData()
  }

  const getItemLink = (it: WishlistItem) => {
    if (it.target_type === 'product') return `/products/${it.target_id}`
    if (it.target_type === 'article') return `/blog/${it.target_id}`
    return `/help/${it.target_id}`
  }

  const getTypeBadge = (type: string) => {
    switch (type) {
      case 'product':
        return {
          label: 'محصول',
          badgeClass: 'bg-primary/10 text-primary border-primary/20',
          icon: <Package className="w-3.5 h-3.5" />,
        }
      case 'article':
        return {
          label: 'مقاله وبلاگ',
          badgeClass:
            'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
          icon: <BookOpen className="w-3.5 h-3.5" />,
        }
      case 'guide':
        return {
          label: 'آموزش',
          badgeClass: 'bg-amber-500/10 text-amber-500 border-amber-500/20',
          icon: <HelpCircle className="w-3.5 h-3.5" />,
        }
      default:
        return {
          label: type,
          badgeClass: 'bg-secondary text-foreground',
          icon: <Heart className="w-3.5 h-3.5" />,
        }
    }
  }

  return (
    <div className="space-y-6 text-right" dir="rtl">
      {/* Top Bar with Filter Pills */}
      <div className="bg-card p-4 sm:p-5 rounded-surface border border-border/80 shadow-surface flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h3 className="text-sm sm:text-base font-black text-foreground flex items-center gap-2">
            <Heart className="w-4 h-4 text-rose-500 fill-rose-500" />
            <span>
              علاقه‌مندی‌ها و نشان‌شده‌های شما ({toPersianDigits(items.length)})
            </span>
          </h3>
          <p className="text-xs text-muted-foreground mt-0.5">
            دسترسی سریع به محصولات، مقالات و آموزش‌های نشان‌شده
          </p>
        </div>

        <div className="flex items-center gap-1.5 flex-wrap">
          {[
            { id: 'all', label: `همه (${toPersianDigits(items.length)})` },
            {
              id: 'product',
              label: `محصولات (${toPersianDigits(
                items.filter((i) => i.target_type === 'product').length,
              )})`,
            },
            {
              id: 'article',
              label: `مقالات (${toPersianDigits(
                items.filter((i) => i.target_type === 'article').length,
              )})`,
            },
            {
              id: 'guide',
              label: `آموزش‌ها (${toPersianDigits(
                items.filter((i) => i.target_type === 'guide').length,
              )})`,
            },
          ].map((btn) => (
            <button
              key={btn.id}
              type="button"
              onClick={() => setFilterType(btn.id as any)}
              className={`px-3 py-1.5 rounded-control text-xs font-bold transition-all cursor-pointer ${
                filterType === btn.id
                  ? 'bg-primary text-primary-foreground font-black shadow-control'
                  : 'bg-muted/30 text-muted-foreground hover:text-foreground border border-border/60'
              }`}
            >
              {btn.label}
            </button>
          ))}
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="p-12 text-center text-muted-foreground bg-card rounded-surface border border-border/80 shadow-surface space-y-3">
          <div className="w-12 h-12 rounded-full bg-rose-500/10 text-rose-500 border border-rose-500/20 flex items-center justify-center mx-auto shadow-xs">
            <Heart className="w-6 h-6" />
          </div>
          <h4 className="font-bold text-sm text-foreground">
            لیست علاقه‌مندی‌ها خالی است
          </h4>
          <p className="text-xs text-muted-foreground">
            با کلیک روی آیکون قلب در صفحات محصولات یا مقالات، آن‌ها را به این
            لیست اضافه فرمایید.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
          {filtered.map((it) => {
            const b = getTypeBadge(it.target_type)
            return (
              <div
                key={`${it.target_type}-${it.target_id}`}
                className="bg-card rounded-surface border border-border/80 shadow-surface p-4 space-y-3 flex flex-col justify-between hover:border-brand/40 transition-colors"
              >
                <div className="space-y-2.5">
                  <div className="flex items-center justify-between">
                    <span
                      className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-control text-[10px] font-bold border ${b.badgeClass}`}
                    >
                      {b.icon}
                      <span>{b.label}</span>
                    </span>
                    <button
                      type="button"
                      onClick={() => handleRemove(it)}
                      className="p-1 text-muted-foreground hover:text-rose-500 cursor-pointer transition-colors"
                      title="حذف از نشان‌شده‌ها"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  <h4 className="font-bold text-xs sm:text-sm text-foreground line-clamp-2">
                    {it.title}
                  </h4>

                  {it.price_toman && it.price_toman > 0 && (
                    <div className="text-xs font-black text-brand font-latin">
                      {formatToman(it.price_toman)} تومان
                    </div>
                  )}
                </div>

                <div className="pt-2 border-t border-border/40 flex justify-end">
                  <Link
                    to={getItemLink(it)}
                    className="h-8 px-3 rounded-control bg-secondary hover:bg-muted text-foreground text-xs font-bold transition flex items-center gap-1.5 shadow-xs"
                  >
                    <span>مشاهده و جزئیات</span>
                    <ExternalLink className="w-3 h-3 text-muted-foreground" />
                  </Link>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
