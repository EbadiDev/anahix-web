import { Heart, Loader2 } from 'lucide-react'
import type React from 'react'
import { useState } from 'react'
import { api } from '../../services/api'
import { useNotification } from './NotificationContext'

interface LikeButtonProps {
  slug: string
  initialCount?: number
  className?: string
}

function toPersianDigits(n: number | string): string {
  const f = ['۰', '۱', '۲', '۳', '۴', '۵', '۶', '۷', '۸', '۹']
  return String(n).replace(/\d/g, (d) => f[Number(d)])
}

export const LikeButton: React.FC<LikeButtonProps> = ({
  slug,
  initialCount = 0,
  className = '',
}) => {
  const { error, success } = useNotification()
  const [likes, setLikes] = useState<number>(initialCount)
  const [isLiked, setIsLiked] = useState<boolean>(false)
  const [loading, setLoading] = useState<boolean>(false)

  const handleLike = async (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()

    if (isLiked || loading) return

    // 1. Optimistic UI Update
    const prevLikes = likes
    setLikes((prev) => prev + 1)
    setIsLiked(true)
    setLoading(true)

    try {
      // 2. Persist in database via backend API
      const newCount = await api.likeArticle(slug)
      if (newCount > 0) {
        setLikes(newCount)
      }
      success('پسندیده شد', 'نظر و پسند شما با موفقیت در سامانه ثبت گردید.')
    } catch (err: any) {
      // 3. Rollback on failure & alert user
      setLikes(prevLikes)
      setIsLiked(false)
      error(
        'خطا در ثبت پسندیدن',
        err.message ||
          'ارتباط با سرور برقرار نشد. لطفاً وضعیت اینترنت خود را بررسی نمایید.',
      )
    } finally {
      setLoading(false)
    }
  }

  return (
    <button
      type="button"
      onClick={handleLike}
      disabled={isLiked || loading}
      className={`group relative inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border transition-all duration-200 cursor-pointer ${
        isLiked
          ? 'border-rose-500/40 bg-rose-500/10 text-rose-500 font-bold scale-[1.05]'
          : 'border-border bg-card/80 text-muted-foreground hover:text-rose-500 hover:border-rose-500/30 hover:bg-rose-500/5'
      } ${className}`}
      style={{ boxShadow: 'var(--depth-surface)' }}
      title={isLiked ? 'پسندیده شده' : 'پسندیدن مقاله'}
      aria-label="پسندیدن مقاله"
    >
      {loading ? (
        <Loader2 className="h-4 w-4 animate-spin text-rose-500" />
      ) : (
        <Heart
          className={`h-4 w-4 transition-transform duration-200 group-hover:scale-125 ${
            isLiked ? 'fill-rose-500 text-rose-500 animate-bounce' : ''
          }`}
        />
      )}
      <span className="font-latin text-xs font-bold font-sans">
        {toPersianDigits(likes)}
      </span>
    </button>
  )
}
