import {
  Check,
  ChevronLeft,
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

export const HelpDetailPage: React.FC = () => {
  const { slug } = useParams<{ slug: string }>()
  const navigate = useNavigate()
  const [guide, setGuide] = useState<HelpGuideDetail | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isCopied, setIsCopied] = useState(false)
  const [isCartOpen, setIsCartOpen] = useState(false)

  // Feedback State
  const [feedbackSubmitted, setFeedbackSubmitted] = useState(false)
  const [feedbackMsg, setFeedbackMsg] = useState('')

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

  const handleVote = async (isHelpful: boolean) => {
    if (!slug || feedbackSubmitted) return
    try {
      await api.voteHelpGuide(slug, isHelpful)
      setFeedbackSubmitted(true)
      setFeedbackMsg('با تشکر! بازخورد ارزشمند شما با موفقیت ثبت شد.')
      if (guide) {
        if (isHelpful) {
          setGuide({ ...guide, helpful_yes: guide.helpful_yes + 1 })
        } else {
          setGuide({ ...guide, helpful_no: guide.helpful_no + 1 })
        }
      }
    } catch (err: any) {
      setFeedbackSubmitted(true)
      setFeedbackMsg(err.message || 'بازخورد شما قبلاً ثبت شده است')
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
        {/* Breadcrumb */}
        <div className="border-b border-border bg-muted/20 py-3 text-xs text-muted-foreground">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center gap-2">
            <Link to="/" className="hover:text-primary transition-colors">
              خانه
            </Link>
            <ChevronLeft className="h-3 w-3" />
            <Link to="/help" className="hover:text-primary transition-colors">
              پایگاه دانش
            </Link>
            <ChevronLeft className="h-3 w-3" />
            <Link
              to={`/help?category=${guide.category_slug}`}
              className="hover:text-primary transition-colors"
            >
              {guide.category_name}
            </Link>
            <ChevronLeft className="h-3 w-3" />
            <span className="text-foreground font-medium truncate max-w-xs">
              {guide.title}
            </span>
          </div>
        </div>

        {/* Guide Header Banner */}
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 space-y-5">
          <div className="flex flex-wrap items-center gap-2 text-xs">
            <span className="px-3 py-1 rounded-full bg-blue-500/10 text-primary font-semibold">
              {guide.category_name}
            </span>
            <span className="bg-muted px-2.5 py-0.5 rounded-full font-medium text-foreground text-[11px]">
              سطح: {guide.difficulty}
            </span>
            <span className="flex items-center gap-1 text-muted-foreground">
              <Clock className="h-3.5 w-3.5 text-blue-500" />
              <span>زمان مطالعه: {guide.reading_time_minutes} دقیقه</span>
            </span>
            <span className="text-muted-foreground">•</span>
            <span className="flex items-center gap-1 text-muted-foreground">
              <Eye className="h-3.5 w-3.5" />
              <span>{guide.view_count.toLocaleString()} بازدید</span>
            </span>
          </div>

          <h1 className="text-2xl sm:text-3xl md:text-4xl font-extrabold text-foreground leading-tight tracking-tight">
            {guide.title}
          </h1>

          {guide.excerpt && (
            <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed bg-muted/30 p-4 rounded-2xl border border-border/60">
              {guide.excerpt}
            </p>
          )}

          {/* Share & Feedback Status Bar */}
          <div className="flex items-center justify-between gap-4 py-3 border-y border-border text-xs">
            <div className="flex items-center gap-4 text-muted-foreground">
              <span className="flex items-center gap-1 text-emerald-600 font-semibold">
                <ThumbsUp className="h-3.5 w-3.5" />
                <span>{guide.helpful_yes} نفر تایید کرده‌اند</span>
              </span>
            </div>

            <button
              type="button"
              onClick={handleCopyLink}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-border bg-card hover:bg-muted text-xs font-semibold text-muted-foreground hover:text-foreground transition-colors"
            >
              {isCopied ? (
                <>
                  <Check className="h-3.5 w-3.5 text-emerald-500" />
                  <span className="text-emerald-500">کپی شد</span>
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
                            className="text-xs text-muted-foreground hover:text-primary transition-colors block"
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

              {/* Feedback Widget: Was this helpful? */}
              <div className="bg-card border border-border rounded-3xl p-6 sm:p-8 shadow-xs text-center space-y-4">
                <div className="space-y-1">
                  <h3 className="text-base font-bold text-foreground">
                    آیا این راهنما مشکل شما را برطرف کرد؟
                  </h3>
                  <p className="text-xs text-muted-foreground">
                    بازخورد شما به ما در بهبود کیفیت پاسخ‌ها و راهنماها کمک
                    می‌کند.
                  </p>
                </div>

                {feedbackSubmitted ? (
                  <div className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-500/30 text-emerald-800 dark:text-emerald-200 text-xs font-semibold">
                    <Check className="h-4 w-4 text-emerald-600" />
                    <span>{feedbackMsg}</span>
                  </div>
                ) : (
                  <div className="flex items-center justify-center gap-3 pt-2">
                    <button
                      type="button"
                      onClick={() => handleVote(true)}
                      className="flex items-center gap-2 px-5 py-2.5 rounded-xl border border-emerald-500/30 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 font-semibold text-xs transition-colors"
                    >
                      <ThumbsUp className="h-4 w-4" />
                      <span>بله، مشکلم حل شد</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => handleVote(false)}
                      className="flex items-center gap-2 px-5 py-2.5 rounded-xl border border-rose-500/30 bg-rose-500/10 hover:bg-rose-500/20 text-rose-700 dark:text-rose-300 font-semibold text-xs transition-colors"
                    >
                      <ThumbsDown className="h-4 w-4" />
                      <span>خیر، هنوز مشکل دارم</span>
                    </button>
                  </div>
                )}
              </div>

              {/* Related Store Product CTA */}
              {guide.related_product_title && (
                <div className="rounded-3xl border border-blue-500/30 bg-gradient-to-r from-blue-50 to-indigo-50/50 dark:from-blue-950/30 dark:to-indigo-950/20 p-6 sm:p-8 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-6">
                  <div className="space-y-2 text-right">
                    <div className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full bg-blue-600 text-white text-[11px] font-bold">
                      <Zap className="h-3 w-3" />
                      <span>اکانت بدون ارور و تضمین شده</span>
                    </div>
                    <h3 className="text-lg font-bold text-foreground">
                      {guide.related_product_title}
                    </h3>
                    <p className="text-xs text-muted-foreground leading-relaxed">
                      اکانت‌های قانونی آناهیکس همراه با گارانتی تعویض و سرورهای
                      اختصاصی بدون ریسک بلاک شدن تحویل داده می‌شوند.
                    </p>
                  </div>

                  <Link
                    to={
                      guide.related_product_slug
                        ? `/products/${guide.related_product_slug}`
                        : '/'
                    }
                    className="px-5 py-2.5 rounded-xl bg-primary text-primary-foreground font-bold text-xs hover:opacity-90 transition-opacity shadow-sm flex items-center gap-1.5 shrink-0"
                  >
                    <ShoppingCart className="h-4 w-4" />
                    <span>خرید اکانت قانونی</span>
                  </Link>
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
                          className="block text-muted-foreground hover:text-primary transition-colors leading-snug py-0.5"
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
