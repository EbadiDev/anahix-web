import {
  Check,
  Clock,
  Copy,
  Eye,
  LifeBuoy,
  ListOrdered,
  ShoppingCart,
  ThumbsDown,
  ThumbsUp,
  Zap,
} from 'lucide-react'
import type React from 'react'
import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { CartDrawer } from '../components/CartDrawer'
import { MarkdownRenderer } from '../components/content/MarkdownRenderer'
import { Header } from '../components/Header'
import { api } from '../services/api'
import type { HelpGuideDetail } from '../types'
import { formatToman, toPersianDigits } from '../utils/formatters'

export const HelpDetailPage: React.FC = () => {
  const { slug } = useParams<{ slug: string }>()
  const navigate = useNavigate()
  const [guide, setGuide] = useState<HelpGuideDetail | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isCopied, setIsCopied] = useState(false)
  const [isCartOpen, setIsCartOpen] = useState(false)

  // Feedback State (Tracked with live DB counts & Toggle)
  const [userVote, setUserVote] = useState<'yes' | 'no' | null>(() => {
    try {
      return (
        (localStorage.getItem(`anahix_guide_vote_${slug}`) as 'yes' | 'no') ||
        null
      )
    } catch {
      return null
    }
  })
  const [feedbackMsg, setFeedbackMsg] = useState('')
  const [voting, setVoting] = useState(false)
  const [siteLogoUrl, setSiteLogoUrl] = useState<string>('')

  useEffect(() => {
    api
      .getThemeSettings()
      .then((st) => {
        if (st?.site_logo_url) setSiteLogoUrl(st.site_logo_url)
      })
      .catch(() => {})
  }, [])

  useEffect(() => {
    if (!slug) return
    try {
      const saved = localStorage.getItem(`anahix_guide_vote_${slug}`) as
        | 'yes'
        | 'no'
      setUserVote(saved || null)
    } catch {}
  }, [slug])

  useEffect(() => {
    if (!slug) return
    setIsLoading(true)
    api
      .getHelpGuideDetail(slug)
      .then((data) => {
        setGuide(data)
        document.title =
          data.meta_title || `${data.title} | مرکز راهنمای آناهیکس`
      })
      .catch((err) => {
        console.error(err)
        navigate('/help')
      })
      .finally(() => setIsLoading(false))
  }, [slug, navigate])

  const handleCopyLink = () => {
    navigator.clipboard.writeText(window.location.href)
    setIsCopied(true)
    setTimeout(() => setIsCopied(false), 2500)
  }

  const handleTOCClick = (e: React.MouseEvent, id: string) => {
    e.preventDefault()
    const target = document.getElementById(id)
    if (target) {
      const headerOffset = 95
      const elementPosition = target.getBoundingClientRect().top
      const offsetPosition = elementPosition + window.pageYOffset - headerOffset
      window.scrollTo({
        top: offsetPosition,
        behavior: 'smooth',
      })
    }
  }

  const handleVote = async (isHelpful: boolean) => {
    if (!slug || voting) return
    setVoting(true)
    try {
      const res = await api.voteHelpGuide(slug, isHelpful)
      if (res.status === 'cancelled') {
        setUserVote(null)
        try {
          localStorage.removeItem(`anahix_guide_vote_${slug}`)
        } catch {}
        setFeedbackMsg('بازخورد قبلی شما با موفقیت لغو گردید.')
      } else {
        const voteVal = isHelpful ? 'yes' : 'no'
        setUserVote(voteVal)
        try {
          localStorage.setItem(`anahix_guide_vote_${slug}`, voteVal)
        } catch {}
        setFeedbackMsg(
          isHelpful
            ? 'با تشکر! بازخورد شما به عنوان حل مشکل ثبت گردید.'
            : 'بازخورد شما ثبت شد. تلاش می‌کنیم این راهنما را بهبود دهیم.',
        )
      }
      if (guide) {
        setGuide({
          ...guide,
          helpful_yes: res.helpful_yes,
          helpful_no: res.helpful_no,
        })
      }
      setTimeout(() => setFeedbackMsg(''), 4000)
    } catch (err: any) {
      setFeedbackMsg(err.message || 'خطا در ثبت بازخورد')
      setTimeout(() => setFeedbackMsg(''), 4000)
    } finally {
      setVoting(false)
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background text-foreground flex flex-col font-sans dir-rtl">
        <Header onOpenCart={() => setIsCartOpen(true)} />
        <div className="max-w-4xl mx-auto px-4 py-16 w-full space-y-6 animate-pulse">
          <div className="h-6 bg-muted rounded-md w-1/4" />
          <div className="h-10 bg-muted rounded-md w-3/4" />
          <div className="h-44 bg-muted rounded-2xl" />
          <div className="space-y-3">
            <div className="h-4 bg-muted rounded w-full" />
            <div className="h-4 bg-muted rounded w-5/6" />
          </div>
        </div>
      </div>
    )
  }

  if (!guide) return null

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col font-sans dir-rtl">
      <Header onOpenCart={() => setIsCartOpen(true)} />
      <CartDrawer isOpen={isCartOpen} onClose={() => setIsCartOpen(false)} />

      <main className="flex-1 pb-20">
        {/* Guide Header Banner with In-Container Breadcrumbs matching BlogDetailPage */}
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 sm:pt-8 space-y-4 sm:space-y-5">
          {/* In-Container Breadcrumb Navigation */}
          <nav
            aria-label="Breadcrumb"
            className="text-xs text-muted-foreground flex items-center gap-2 flex-wrap"
          >
            <Link to="/" className="hover:text-foreground transition-colors">
              خانه
            </Link>
            <span className="opacity-40">/</span>
            <Link
              to="/help"
              className="hover:text-foreground transition-colors"
            >
              پایگاه دانش
            </Link>
            <span className="opacity-40">/</span>
            <Link
              to={`/help?category=${guide.category_slug}`}
              className="hover:text-foreground transition-colors"
            >
              {guide.category_name}
            </Link>
            <span className="opacity-40">/</span>
            <span className="text-brand font-bold truncate max-w-xs sm:max-w-md">
              {guide.title}
            </span>
          </nav>

          <div className="flex flex-wrap items-center gap-3 text-xs">
            <span className="px-3 py-1 rounded-control bg-brand/10 text-brand font-bold">
              {guide.category_name}
            </span>
            <span className="bg-muted px-2.5 py-0.5 rounded-control font-medium text-foreground text-[11px]">
              سطح: {guide.difficulty}
            </span>
            <div className="flex items-center gap-2 pr-1 border-r border-border/60">
              {guide.author_avatar ? (
                <img
                  src={guide.author_avatar}
                  alt={guide.author_name || 'نویسنده'}
                  className="w-6 h-6 rounded-full object-cover border border-border/80"
                />
              ) : siteLogoUrl ? (
                <img
                  src={siteLogoUrl}
                  alt="لوگوی آناهیکس"
                  className="w-6 h-6 rounded-full object-contain p-0.5 border border-border/80 bg-muted/20"
                />
              ) : (
                <div className="w-6 h-6 rounded-full bg-primary/10 text-primary flex items-center justify-center text-[10px] font-bold">
                  {(guide.author_name || 'ت')[0]}
                </div>
              )}
              <span className="font-bold text-foreground text-xs">
                {guide.author_name || 'تیم پشتیبانی و فنی آناهیکس'}
              </span>
            </div>
            <span className="flex items-center gap-1 text-muted-foreground">
              <Clock className="h-3.5 w-3.5 text-brand" />
              <span>
                زمان مطالعه: {toPersianDigits(guide.reading_time_minutes)} دقیقه
              </span>
            </span>
            <span className="text-muted-foreground">•</span>
            <span className="flex items-center gap-1 text-muted-foreground font-latin">
              <Eye className="h-3.5 w-3.5" />
              <span>
                {toPersianDigits(guide.view_count.toLocaleString())} بازدید
              </span>
            </span>
          </div>

          <h1 className="text-xl sm:text-2xl md:text-3xl font-black text-foreground leading-tight tracking-tight">
            {guide.title}
          </h1>

          {guide.excerpt && (
            <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed bg-muted/20 p-4 rounded-surface border border-border/60">
              {guide.excerpt}
            </p>
          )}

          {/* Share & Feedback Status Bar */}
          <div className="flex items-center justify-between gap-4 py-3 border-y border-border/60 text-xs">
            <div className="flex items-center gap-3 text-muted-foreground">
              <span className="flex items-center gap-1 text-emerald-400 font-bold font-latin">
                <ThumbsUp className="h-3.5 w-3.5" />
                <span>
                  {toPersianDigits(guide.helpful_yes)} نفر تایید کرده‌اند
                </span>
              </span>
              {guide.helpful_no > 0 && (
                <>
                  <span>•</span>
                  <span className="flex items-center gap-1 text-destructive font-bold font-latin">
                    <ThumbsDown className="h-3.5 w-3.5 text-destructive" />
                    <span>
                      {toPersianDigits(guide.helpful_no)} نفر تایید نکرده‌اند
                    </span>
                  </span>
                </>
              )}
            </div>

            <button
              type="button"
              onClick={handleCopyLink}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-control border border-border/60 bg-card hover:bg-muted text-xs font-semibold text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
            >
              {isCopied ? (
                <>
                  <Check className="h-3.5 w-3.5 text-emerald-400" />
                  <span className="text-emerald-400">کپی شد</span>
                </>
              ) : (
                <>
                  <Copy className="h-3.5 w-3.5" />
                  <span>اشتراک‌گذاری لینک</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Content Layout with Sidebar */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            {/* Main Content Area */}
            <div className="lg:col-span-8 space-y-8">
              {/* Mobile TOC */}
              {guide.table_of_contents &&
                guide.table_of_contents.length > 0 && (
                  <div className="lg:hidden bg-card border border-border rounded-2xl p-4 shadow-xs space-y-2">
                    <h3 className="font-bold text-xs text-foreground flex items-center gap-2">
                      <ListOrdered className="h-4 w-4 text-primary" />
                      فهرست مراحل و سرفصل‌ها
                    </h3>
                    <ul className="space-y-1.5 pr-2">
                      {guide.table_of_contents.map((item) => (
                        <li key={item.id}>
                          <a
                            href={`#${item.id}`}
                            onClick={(e) => handleTOCClick(e, item.id)}
                            className="text-xs text-muted-foreground hover:text-brand transition-colors block cursor-pointer"
                          >
                            {item.text}
                          </a>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

              {/* Guide Content */}
              <div className="bg-card border border-border rounded-3xl p-6 sm:p-8 shadow-xs">
                <MarkdownRenderer content={guide.content} />
              </div>

              {/* Feedback Widget: Was this helpful? - Live DB counts & Toggle */}
              <div className="bg-card border border-border/60 rounded-surface p-6 sm:p-8 shadow-surface text-center space-y-4">
                <div className="space-y-1">
                  <h3 className="text-base font-black text-foreground">
                    آیا این راهنما مشکل شما را برطرف کرد؟
                  </h3>
                  <p className="text-xs text-muted-foreground">
                    بازخورد شما در بهبود کیفیت پاسخ‌ها و راهنماها موثر است و در
                    سیستم ثبت می‌شود.
                  </p>
                </div>

                {feedbackMsg && (
                  <div className="inline-flex items-center gap-2 px-4 py-2 rounded-control bg-secondary border border-border text-foreground text-xs font-bold animate-in fade-in">
                    <Check className="h-4 w-4 text-brand" />
                    <span>{feedbackMsg}</span>
                  </div>
                )}

                <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
                  <button
                    type="button"
                    disabled={voting}
                    onClick={() => handleVote(true)}
                    className={`flex items-center gap-2 px-5 py-2.5 rounded-control text-xs font-bold transition-all duration-motion ease-motion active:scale-[0.98] cursor-pointer ${
                      userVote === 'yes'
                        ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 shadow-control ring-1 ring-emerald-500/30'
                        : 'border border-border/60 bg-muted/20 hover:bg-muted/40 text-muted-foreground hover:text-foreground'
                    }`}
                  >
                    <ThumbsUp
                      className={`h-4 w-4 ${
                        userVote === 'yes'
                          ? 'fill-emerald-400 text-emerald-400'
                          : ''
                      }`}
                    />
                    <span>بله، مشکلم حل شد</span>
                    <span className="text-[11px] font-mono font-latin px-2 py-0.5 rounded-control bg-card/60">
                      ({toPersianDigits(guide.helpful_yes)} نفر)
                    </span>
                  </button>

                  <button
                    type="button"
                    disabled={voting}
                    onClick={() => handleVote(false)}
                    className={`flex items-center gap-2 px-5 py-2.5 rounded-control text-xs font-bold transition-all duration-motion ease-motion active:scale-[0.98] cursor-pointer ${
                      userVote === 'no'
                        ? 'bg-destructive/20 text-destructive border border-destructive/40 shadow-control ring-1 ring-destructive/30'
                        : 'border border-border/60 bg-muted/20 hover:bg-muted/40 text-muted-foreground hover:text-foreground'
                    }`}
                  >
                    <ThumbsDown
                      className={`h-4 w-4 ${
                        userVote === 'no'
                          ? 'fill-destructive text-destructive'
                          : ''
                      }`}
                    />
                    <span>خیر، هنوز مشکل دارم</span>
                    <span className="text-[11px] font-mono font-latin px-2 py-0.5 rounded-control bg-card/60">
                      ({toPersianDigits(guide.helpful_no)} نفر)
                    </span>
                  </button>
                </div>
              </div>

              {/* Related Store Product CTA - Graphite Standard */}
              {guide.related_product_title && (
                <div className="rounded-surface border border-border/60 bg-card p-6 sm:p-7 shadow-surface flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6 relative overflow-hidden">
                  <div className="space-y-2 text-right flex-1 min-w-0">
                    <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-control bg-brand/10 text-brand border border-brand/20 text-[11px] font-bold">
                      <Zap className="h-3.5 w-3.5" />
                      <span>اکانت بدون ارور و تضمین شده</span>
                    </div>
                    <h3 className="text-base sm:text-xl font-black text-foreground">
                      {guide.related_product_title}
                    </h3>
                    <p className="text-xs text-muted-foreground leading-relaxed">
                      اکانت‌های قانونی آناهیکس همراه با گارانتی تعویض و سرورهای
                      اختصاصی بدون ریسک بلاک شدن تحویل داده می‌شوند.
                    </p>
                    {guide.related_product_price &&
                      guide.related_product_price > 0 && (
                        <div className="text-sm font-black text-foreground font-sans pt-1">
                          قیمت: {formatToman(guide.related_product_price)}{' '}
                          <span className="text-xs font-normal text-muted-foreground font-sans">
                            تومان
                          </span>
                        </div>
                      )}
                  </div>

                  <div className="shrink-0 flex items-center gap-2">
                    <Link
                      to={
                        guide.related_product_slug
                          ? `/products/${guide.related_product_slug}`
                          : '/'
                      }
                      className="h-10 px-5 rounded-control bg-primary hover:bg-primary-hover text-primary-foreground font-black text-xs duration-motion ease-motion active:scale-[0.98] shadow-control flex items-center gap-2 cursor-pointer"
                    >
                      <ShoppingCart className="h-4 w-4" />
                      <span>خرید اکانت قانونی</span>
                    </Link>
                  </div>
                </div>
              )}

              {/* Related Guides Card in Main Column (matching BlogDetailPage) */}
              {guide.related_guides && guide.related_guides.length > 0 && (
                <div className="rounded-surface border border-border/60 bg-card p-6 shadow-surface space-y-4">
                  <h3 className="font-black text-sm text-foreground flex items-center gap-2 border-b border-border/40 pb-3">
                    <LifeBuoy className="h-4 w-4 text-brand" />
                    <span>راهنماها و آموزش‌های مرتبط</span>
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {guide.related_guides.map((rel) => (
                      <Link
                        key={rel.id}
                        to={`/help/${rel.slug}`}
                        className="group block p-3.5 rounded-control bg-muted/20 border border-border/40 hover:border-brand/40 transition-all space-y-2"
                      >
                        <h4 className="text-xs font-bold text-foreground group-hover:text-brand transition-colors line-clamp-2 leading-snug">
                          {rel.title}
                        </h4>
                        <div className="flex items-center justify-between text-[10px] text-muted-foreground pt-1 border-t border-border/30">
                          <span className="font-medium">
                            {rel.category_name}
                          </span>
                          <span className="flex items-center gap-1 text-emerald-400 font-bold font-latin">
                            <ThumbsUp className="h-3 w-3" />
                            <span>
                              {toPersianDigits(rel.helpful_yes)} تایید
                            </span>
                          </span>
                        </div>
                      </Link>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Sticky Sidebar */}
            <div className="lg:col-span-4 space-y-6 lg:sticky lg:top-20">
              {/* Table of Contents */}
              {guide.table_of_contents &&
                guide.table_of_contents.length > 0 && (
                  <div className="bg-card border border-border rounded-3xl p-6 shadow-xs space-y-4">
                    <h3 className="font-bold text-sm text-foreground flex items-center gap-2 border-b border-border pb-3">
                      <ListOrdered className="h-4 w-4 text-primary" />
                      <span>سرفصل‌ها و مراحل راهنما</span>
                    </h3>
                    <nav className="space-y-2 max-h-[380px] overflow-y-auto scrollbar-thin pr-1 text-xs">
                      {guide.table_of_contents.map((item) => (
                        <a
                          key={item.id}
                          href={`#${item.id}`}
                          onClick={(e) => handleTOCClick(e, item.id)}
                          className="block text-muted-foreground hover:text-brand transition-colors leading-snug py-0.5 cursor-pointer"
                        >
                          {item.text}
                        </a>
                      ))}
                    </nav>
                  </div>
                )}

              {/* Related Guides */}
              {guide.related_guides && guide.related_guides.length > 0 && (
                <div className="bg-card border border-border rounded-3xl p-6 shadow-xs space-y-4">
                  <h3 className="font-bold text-sm text-foreground flex items-center gap-2 border-b border-border pb-3">
                    <LifeBuoy className="h-4 w-4 text-primary" />
                    <span>راهنماهای مرتبط</span>
                  </h3>
                  <div className="space-y-3">
                    {guide.related_guides.map((rel) => (
                      <Link
                        key={rel.id}
                        to={`/help/${rel.slug}`}
                        className="group block p-3 rounded-2xl bg-muted/30 border border-border/60 hover:border-primary/40 transition-all space-y-1"
                      >
                        <h4 className="text-xs font-bold text-foreground group-hover:text-primary transition-colors line-clamp-2 leading-snug">
                          {rel.title}
                        </h4>
                        <div className="flex items-center justify-between text-[10px] text-muted-foreground pt-1">
                          <span>{rel.category_name}</span>
                          <span className="flex items-center gap-0.5 text-emerald-600 font-semibold">
                            <ThumbsUp className="h-2.5 w-2.5" />
                            {rel.helpful_yes}
                          </span>
                        </div>
                      </Link>
                    ))}
                  </div>
                </div>
              )}

              {/* Direct Telegram Support Box */}
              <div className="bg-muted/40 border border-border rounded-3xl p-5 text-center space-y-3">
                <LifeBuoy className="h-8 w-8 text-primary mx-auto opacity-80" />
                <h4 className="font-bold text-xs text-foreground">
                  هنوز موفق به حل مشکل نشده‌اید؟
                </h4>
                <p className="text-[11px] text-muted-foreground leading-relaxed">
                  اپراتورهای پشتیبانی فنی آناهیکس آماده‌اند خطای شما را به صورت
                  دستی و اختصاصی بررسی نمایند.
                </p>
                <div className="space-y-2 pt-1">
                  <Link
                    to="/profile"
                    className="block w-full py-2 rounded-xl bg-card border border-border text-xs font-semibold hover:bg-background transition-colors text-foreground"
                  >
                    ارسال تیکت به پشتیبانی
                  </Link>
                  <a
                    href="https://t.me/AnahixSupport"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block w-full py-2 rounded-xl bg-primary text-primary-foreground text-xs font-semibold hover:opacity-90 transition-opacity"
                  >
                    گفتگوی فوری در تلگرام
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
