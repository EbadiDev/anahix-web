import { Heart, Loader2 } from 'lucide-react'
import type React from 'react'
import { useEffect, useState } from 'react'
import { LIKED_ARTICLES_KEY } from '../../constants/theme'
import { api } from '../../services/api'
import { toPersianDigits } from '../../utils/formatters'
import { AuthModal } from '../AuthModal'
import { useNotification } from './NotificationContext'

interface LikeButtonProps {
  slug: string
  initialCount?: number
  className?: string
}

function getLikedArticles(): string[] {
  try {
    const raw = localStorage.getItem(LIKED_ARTICLES_KEY)
    if (raw) {
      const parsed = JSON.parse(raw)
      if (Array.isArray(parsed)) return parsed
    }
  } catch {}
  return []
}

function saveLikedArticle(slug: string) {
  try {
    const list = getLikedArticles()
    if (!list.includes(slug)) {
      list.push(slug)
      localStorage.setItem(LIKED_ARTICLES_KEY, JSON.stringify(list))
    }
  } catch {}
}

function removeLikedArticle(slug: string) {
  try {
    const list = getLikedArticles().filter((s) => s !== slug)
    localStorage.setItem(LIKED_ARTICLES_KEY, JSON.stringify(list))
  } catch {}
}

export const LikeButton: React.FC<LikeButtonProps> = ({
  slug,
  initialCount = 0,
  className = '',
}) => {
  const { error, success, info, warning } = useNotification()
  const [likes, setLikes] = useState<number>(initialCount)
  const [isLiked, setIsLiked] = useState<boolean>(false)
  const [loading, setLoading] = useState<boolean>(false)
  const [isAuthOpen, setIsAuthOpen] = useState<boolean>(false)

  // Sync initial liked state from localStorage on mount or slug change
  useEffect(() => {
    const list = getLikedArticles()
    setIsLiked(list.includes(slug))

    const handleSync = (e: any) => {
      if (e.detail?.slug === slug) {
        if (typeof e.detail.isLiked === 'boolean') {
          setIsLiked(e.detail.isLiked)
        }
        if (typeof e.detail.likes === 'number') {
          setLikes(e.detail.likes)
        }
      }
    }

    window.addEventListener('anahix:article:liked', handleSync)
    return () => window.removeEventListener('anahix:article:liked', handleSync)
  }, [slug])

  // Sync initialCount if it updates from API
  useEffect(() => {
    if (initialCount > 0) {
      setLikes(initialCount)
    }
  }, [initialCount])

  const handleLike = async (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()

    if (!api.isCustomerLoggedIn()) {
      warning(
        'نیاز به ورود به حساب کاربری',
        'برای پسندیدن این آموزش، لطفاً ابتدا وارد حساب کاربری خود شوید یا ثبت‌نام کنید.',
      )
      setIsAuthOpen(true)
      return
    }

    if (loading) return

    setLoading(true)
    try {
      // Toggle like in backend database per user/IP
      const res = await api.likeArticle(slug)
      const nextLiked = res.is_liked
      const nextCount = res.like_count

      setLikes(nextCount)
      setIsLiked(nextLiked)

      if (nextLiked) {
        saveLikedArticle(slug)
        success(
          'دیدگاه مثبت شما ثبت شد',
          'از اینکه نظر ارزشمند خود را با ما به اشتراک گذاشتید سپاسگزاریم.',
        )
      } else {
        removeLikedArticle(slug)
        info('پسندیدن لغو شد', 'پسند شما برای این مقاله برداشته شد.')
      }

      // Broadcast sync to other like button instances on the same page
      window.dispatchEvent(
        new CustomEvent('anahix:article:liked', {
          detail: { slug, likes: nextCount, isLiked: nextLiked },
        }),
      )
    } catch (err: any) {
      error(
        'خطا در برقراری ارتباط با سرور',
        err.message ||
          'ثبت بازخورد با خطا مواجه شد. لطفاً اتصال اینترنت خود را بررسی نمایید.',
      )
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <button
        type="button"
        onClick={handleLike}
        className={`group relative inline-flex items-center gap-1.5 px-3 py-1.5 rounded-control border transition-all duration-motion ease-motion active:scale-[0.98] cursor-pointer shadow-control ${
          isLiked
            ? 'border-rose-500/50 bg-rose-500/10 text-rose-500 font-bold'
            : 'border-border/60 bg-card hover:bg-muted text-muted-foreground hover:text-rose-500 hover:border-rose-500/40'
        } ${className}`}
        title={isLiked ? 'شما این مقاله را پسندیده‌اید' : 'پسندیدن مقاله'}
        aria-label="پسندیدن مقاله"
      >
        {loading ? (
          <Loader2 className="h-4 w-4 animate-spin text-rose-500" />
        ) : (
          <Heart
            className={`h-4 w-4 transition-transform duration-200 group-hover:scale-115 ${
              isLiked ? 'fill-rose-500 text-rose-500' : ''
            }`}
          />
        )}
        <span className="font-latin text-xs font-bold">
          {toPersianDigits(likes)}
        </span>
      </button>

      {/* Customer Auth Modal for Gated Like Action */}
      <AuthModal
        isOpen={isAuthOpen}
        initialMode="login"
        onClose={() => setIsAuthOpen(false)}
        onSuccess={() => setIsAuthOpen(false)}
      />
    </>
  )
}
