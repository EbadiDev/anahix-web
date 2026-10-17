import {
  BookOpen,
  Check,
  ChevronLeft,
  Clock,
  Copy,
  Eye,
  HelpCircle,
  ListOrdered,
  MessageSquare,
  Send,
  Share2,
  ShoppingCart,
  Tag,
  Zap,
} from 'lucide-react'
import type React from 'react'
import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { AuthModal } from '../components/AuthModal'
import { CartDrawer } from '../components/CartDrawer'
import { MarkdownRenderer } from '../components/content/MarkdownRenderer'
import { Header } from '../components/Header'
import { LikeButton } from '../components/vibefarsi/LikeButton'
import { useNotification } from '../components/vibefarsi/NotificationContext'
import { api } from '../services/api'
import type { ArticleDetail } from '../types'

export const BlogDetailPage: React.FC = () => {
  const { slug } = useParams<{ slug: string }>()
  const navigate = useNavigate()
  const [article, setArticle] = useState<ArticleDetail | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isCopied, setIsCopied] = useState(false)
  const [isCartOpen, setIsCartOpen] = useState(false)
  const [isAuthOpen, setIsAuthOpen] = useState(false)
  const { warning } = useNotification()

  // Comment submission form
  const [commentName, setCommentName] = useState('')
  const [commentEmail, setCommentEmail] = useState('')
  const [commentText, setCommentText] = useState('')
  const [commentSubmitting, setCommentSubmitting] = useState(false)
  const [commentSuccess, setCommentSuccess] = useState(false)

  useEffect(() => {
    if (!slug) return
    setIsLoading(true)
    api
      .getArticleDetail(slug)
      .then((data) => {
        setArticle(data)
        // Set SEO Meta Title and Description
        document.title = data.meta_title || `${data.title} | آناهیکس`
      })
      .catch((err) => {
        console.error(err)
        navigate('/blog')
      })
      .finally(() => setIsLoading(false))
  }, [slug, navigate])

  const handleCopyLink = () => {
    navigator.clipboard.writeText(window.location.href)
    setIsCopied(true)
    setTimeout(() => setIsCopied(false), 2500)
  }

  const handleCommentSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!slug || !commentName.trim() || !commentText.trim()) return

    if (!api.isCustomerLoggedIn()) {
      warning(
        'نیاز به ورود به حساب کاربری',
        'برای ارسال دیدگاه یا پرسش درباره این مقاله، لطفاً ابتدا وارد حساب کاربری خود شوید یا ثبت‌نام کنید.',
      )
      setIsAuthOpen(true)
      return
    }

    setCommentSubmitting(true)
    try {
      await api.submitArticleComment(slug, {
        author_name: commentName.trim(),
        email: commentEmail.trim() || undefined,
        content: commentText.trim(),
      })
      setCommentSuccess(true)
      setCommentText('')
      setTimeout(() => setCommentSuccess(false), 6000)
    } catch (err) {
      console.error(err)
    } finally {
      setCommentSubmitting(false)
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background text-foreground flex flex-col font-sans dir-rtl">
        <Header onOpenCart={() => setIsCartOpen(true)} />
        <div className="max-w-4xl mx-auto px-4 py-16 w-full space-y-6 animate-pulse">
          <div className="h-6 bg-muted rounded-md w-1/4" />
          <div className="h-10 bg-muted rounded-md w-3/4" />
          <div className="h-72 bg-muted rounded-2xl" />
          <div className="space-y-3">
            <div className="h-4 bg-muted rounded w-full" />
            <div className="h-4 bg-muted rounded w-5/6" />
            <div className="h-4 bg-muted rounded w-4/6" />
          </div>
        </div>
      </div>
    )
  }

  if (!article) return null

  const shareUrl = encodeURIComponent(window.location.href)
  const shareTitle = encodeURIComponent(article.title)

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col font-sans dir-rtl">
      <Header onOpenCart={() => setIsCartOpen(true)} />
      <CartDrawer isOpen={isCartOpen} onClose={() => setIsCartOpen(false)} />

      <main className="flex-1 pb-20">
        {/* Framed Article Container (Breadcrumb + Header + Content) */}
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 space-y-6">
          {/* Vibe Farsi Breadcrumb Navigation */}
          <nav
            aria-label="Breadcrumb"
            className="border-b border-border/40 pb-3 text-xs text-muted-foreground flex items-center gap-2 flex-wrap"
          >
            <Link to="/" className="hover:text-primary transition-colors">
              خانه
            </Link>
            <ChevronLeft className="h-3 w-3" />
            <Link to="/blog" className="hover:text-primary transition-colors">
              وبلاگ
            </Link>
            <ChevronLeft className="h-3 w-3" />
            <Link
              to={`/blog?category=${article.category_slug}`}
              className="hover:text-primary transition-colors"
            >
              {article.category_name}
            </Link>
            <ChevronLeft className="h-3 w-3" />
            <span className="text-foreground font-medium truncate max-w-xs">
              {article.title}
            </span>
          </nav>

          <div className="space-y-4">
            <div className="flex flex-wrap items-center gap-2 text-xs">
              <span className="px-3 py-1 rounded-control bg-primary/10 text-primary font-bold">
                {article.category_name}
              </span>
              <span className="flex items-center gap-1 text-muted-foreground">
                <Clock className="h-3.5 w-3.5 text-brand" />
                <span>
                  زمان تخمینی مطالعه: {article.reading_time_minutes} دقیقه
                </span>
              </span>
              <span className="text-muted-foreground">•</span>
              <span className="flex items-center gap-1 text-muted-foreground">
                <Eye className="h-3.5 w-3.5" />
                <span>{article.view_count.toLocaleString()} بازدید</span>
              </span>
            </div>

            <h1 className="text-2xl sm:text-3xl md:text-4xl font-extrabold text-foreground leading-tight tracking-tight">
              {article.title}
            </h1>

            {article.excerpt && (
              <p className="text-sm md:text-base text-muted-foreground leading-relaxed bg-muted/20 p-4 rounded-control border border-border/40">
                {article.excerpt}
              </p>
            )}

            {/* Author & Share Bar (Clean without harsh border-y) */}
            <div className="flex flex-wrap items-center justify-between gap-4 py-2">
              <div className="flex items-center gap-3">
                {article.author_avatar ? (
                  <img
                    src={article.author_avatar}
                    alt={article.author_name}
                    className="w-10 h-10 rounded-full object-cover border border-border shadow-xs"
                  />
                ) : (
                  <div className="w-10 h-10 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-sm">
                    {article.author_name[0]}
                  </div>
                )}
                <div>
                  <span className="text-xs sm:text-sm font-bold text-foreground block">
                    {article.author_name}
                  </span>
                  <span className="text-[11px] text-muted-foreground block">
                    {article.author_role}
                  </span>
                </div>
              </div>

              {/* Share & Like buttons in Header */}
              <div className="flex items-center gap-2">
                <LikeButton
                  slug={article.slug}
                  initialCount={article.like_count || 0}
                />
                <a
                  href={`https://t.me/share/url?url=${shareUrl}&text=${shareTitle}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-2 rounded-xl border border-border bg-card hover:bg-muted text-muted-foreground hover:text-blue-500 transition-colors"
                  title="اشتراک‌گذاری در تلگرام"
                >
                  <Share2 className="h-4 w-4" />
                </a>
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
                      <span>کپی لینک</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>

          {/* Featured Cover Image */}
          {article.cover_image && (
            <div className="rounded-3xl overflow-hidden border border-border shadow-md max-h-[460px] bg-muted">
              <img
                src={article.cover_image}
                alt={article.title}
                className="w-full h-full object-cover"
              />
            </div>
          )}
        </div>

        {/* Content Layout with Sticky TOC Sidebar */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-4">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            {/* Main Article Body */}
            <div className="lg:col-span-8 space-y-6">
              {/* Table of Contents for Mobile View */}
              {article.table_of_contents &&
                article.table_of_contents.length > 0 && (
                  <div className="lg:hidden bg-card border border-border/60 rounded-control p-4 shadow-control space-y-2">
                    <h3 className="font-bold text-xs text-foreground flex items-center gap-2">
                      <ListOrdered className="h-4 w-4 text-primary" />
                      فهرست دسترسی سریع به بخش‌ها
                    </h3>
                    <ul className="space-y-1.5 pr-2">
                      {article.table_of_contents.map((item) => (
                        <li key={item.id}>
                          <a
                            href={`#${item.id}`}
                            className={`text-xs text-muted-foreground hover:text-primary transition-colors block ${
                              item.level === 3
                                ? 'pr-3 opacity-80'
                                : 'font-medium'
                            }`}
                          >
                            {item.text}
                          </a>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

              {/* Rich Markdown Render - Clean Graphite Container Without Awkward Top Margin */}
              <div className="bg-card border border-border/60 rounded-surface p-5 sm:p-7 shadow-surface">
                <MarkdownRenderer content={article.content} />
              </div>

              {/* Tags Section */}
              {article.tags && article.tags.length > 0 && (
                <div className="bg-card border border-border rounded-2xl p-4 flex flex-wrap items-center gap-2">
                  <span className="text-xs font-semibold text-muted-foreground flex items-center gap-1.5 pl-2">
                    <Tag className="h-3.5 w-3.5 text-primary" />
                    برچسب‌ها:
                  </span>
                  {article.tags.map((t) => (
                    <Link
                      key={`article-tag-${t}`}
                      to={`/blog?tag=${encodeURIComponent(t)}`}
                      className="px-3 py-1 rounded-xl bg-muted hover:bg-muted/80 text-xs font-medium text-foreground transition-colors border border-border/60"
                    >
                      #{t}
                    </Link>
                  ))}
                </div>
              )}

              {/* Interactive Like & Rating Box at end of article */}
              <div className="rounded-surface border border-border/40 bg-card p-5 sm:p-6 shadow-surface flex flex-col sm:flex-row items-center justify-between gap-4 text-right">
                <div className="space-y-1">
                  <h4 className="text-sm font-black text-foreground">
                    آیا این مقاله و آموزش برای شما مفید بود؟
                  </h4>
                  <p className="text-xs text-muted-foreground">
                    با پسندیدن این مطلب به ارتقای محتوای آموزشی آناهیکس کمک
                    می‌کنید.
                  </p>
                </div>
                <div className="flex items-center gap-3 shrink-0">
                  <LikeButton
                    slug={article.slug}
                    initialCount={article.like_count || 0}
                  />
                </div>
              </div>

              {/* Store Integration CTA Box (Related Product) */}
              {article.related_product_title && (
                <div className="rounded-3xl border border-blue-500/30 bg-gradient-to-r from-blue-50 to-indigo-50/50 dark:from-blue-950/30 dark:to-indigo-950/20 p-6 sm:p-8 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-6">
                  <div className="space-y-2 text-right">
                    <div className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full bg-blue-600 text-white text-[11px] font-bold">
                      <Zap className="h-3 w-3" />
                      <span>سرویس مرتبط با این مقاله</span>
                    </div>
                    <h3 className="text-lg sm:text-xl font-bold text-foreground">
                      {article.related_product_title}
                    </h3>
                    <p className="text-xs text-muted-foreground leading-relaxed">
                      تحویل آنی اکانت قانونی، گارانتی تعویض تا آخرین روز اشتراک
                      و پشتیبانی اختصاصی در آناهیکس.
                    </p>
                    {article.related_product_price &&
                      article.related_product_price > 0 && (
                        <div className="text-sm font-bold text-primary pt-1">
                          قیمت: {article.related_product_price.toLocaleString()}{' '}
                          تومان
                        </div>
                      )}
                  </div>

                  <div className="shrink-0 flex items-center gap-2">
                    <Link
                      to={
                        article.related_product_slug
                          ? `/products/${article.related_product_slug}`
                          : '/'
                      }
                      className="px-5 py-2.5 rounded-xl bg-primary text-primary-foreground font-bold text-xs hover:opacity-90 transition-opacity shadow-sm flex items-center gap-1.5"
                    >
                      <ShoppingCart className="h-4 w-4" />
                      <span>مشاهده و خرید آنی</span>
                    </Link>
                  </div>
                </div>
              )}

              {/* Comments Section */}
              <div className="bg-card border border-border rounded-3xl p-6 sm:p-8 shadow-xs space-y-6">
                <div className="flex items-center justify-between border-b border-border pb-4">
                  <h3 className="font-bold text-base text-foreground flex items-center gap-2">
                    <MessageSquare className="h-5 w-5 text-primary" />
                    <span>دیدگاه‌ها و پرسش‌های کاربران</span>
                    <span className="text-xs font-normal text-muted-foreground">
                      ({article.comments?.length || 0})
                    </span>
                  </h3>
                </div>

                {/* Submit Comment Form */}
                <form onSubmit={handleCommentSubmit} className="space-y-4">
                  <h4 className="text-xs font-bold text-foreground">
                    دیدگاه یا پرسش خود را ثبت کنید:
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <input
                      type="text"
                      required
                      value={commentName}
                      onChange={(e) => setCommentName(e.target.value)}
                      placeholder="نام و نام خانوادگی شما *"
                      className="rounded-xl border border-border bg-background px-3.5 py-2.5 text-xs focus:outline-hidden focus:ring-1 focus:ring-primary"
                    />
                    <input
                      type="email"
                      value={commentEmail}
                      onChange={(e) => setCommentEmail(e.target.value)}
                      placeholder="ایمیل شما (اختیاری - منتشر نمی‌شود)"
                      className="rounded-xl border border-border bg-background px-3.5 py-2.5 text-xs focus:outline-hidden focus:ring-1 focus:ring-primary"
                    />
                  </div>
                  <textarea
                    rows={3}
                    required
                    value={commentText}
                    onChange={(e) => setCommentText(e.target.value)}
                    placeholder="دیدگاه، پرسش یا تجربه شما درباره این موضوع..."
                    className="w-full rounded-xl border border-border bg-background p-3 text-xs focus:outline-hidden focus:ring-1 focus:ring-primary leading-relaxed"
                  />
                  <div className="flex items-center justify-between">
                    {commentSuccess && (
                      <span className="text-xs text-emerald-400 font-semibold flex items-center gap-1">
                        <Check className="h-4 w-4" />
                        دیدگاه شما با موفقیت ثبت شد و پس از بررسی و تایید مدیر
                        منتشر خواهد شد.
                      </span>
                    )}
                    <button
                      type="submit"
                      disabled={commentSubmitting}
                      className="mr-auto px-5 py-2 rounded-xl bg-primary text-primary-foreground font-semibold text-xs hover:opacity-90 transition-opacity flex items-center gap-1.5 shadow-xs"
                    >
                      <Send className="h-3.5 w-3.5" />
                      <span>
                        {commentSubmitting ? 'در حال ارسال...' : 'ارسال دیدگاه'}
                      </span>
                    </button>
                  </div>
                </form>

                {/* Comments List - Only approved comments */}
                {article.comments &&
                  article.comments.filter(
                    (c) => c.status === 'approved' || !c.status,
                  ).length > 0 && (
                    <div className="space-y-4 pt-6 border-t border-border">
                      {article.comments
                        .filter((c) => c.status === 'approved' || !c.status)
                        .map((c) => (
                          <div
                            key={c.id}
                            className="p-4 rounded-2xl bg-muted/30 border border-border/60 space-y-2 text-xs"
                          >
                            <div className="flex items-center justify-between text-muted-foreground">
                              <strong className="text-foreground font-semibold">
                                {c.author_name}
                              </strong>
                              <span>
                                {new Date(c.created_at).toLocaleDateString(
                                  'fa-IR',
                                )}
                              </span>
                            </div>
                            <p className="text-slate-700 dark:text-slate-300 leading-relaxed">
                              {c.content}
                            </p>
                            {c.admin_reply && (
                              <div className="mr-3 p-3 rounded-xl bg-blue-50/60 dark:bg-blue-950/30 border-r-2 border-primary mt-2">
                                <span className="font-bold text-primary block mb-0.5">
                                  پاسخ تحریریه آناهیکس:
                                </span>
                                <p className="text-slate-600 dark:text-slate-300">
                                  {c.admin_reply}
                                </p>
                              </div>
                            )}
                          </div>
                        ))}
                    </div>
                  )}
              </div>
            </div>

            {/* Sidebar (Desktop Sticky TOC + Related Articles) */}
            <div className="lg:col-span-4 space-y-6 lg:sticky lg:top-20">
              {/* Table of Contents */}
              {article.table_of_contents &&
                article.table_of_contents.length > 0 && (
                  <div className="bg-card border border-border rounded-3xl p-6 shadow-xs space-y-4">
                    <h3 className="font-bold text-sm text-foreground flex items-center gap-2 border-b border-border pb-3">
                      <ListOrdered className="h-4 w-4 text-primary" />
                      <span>فهرست سرفصل‌های این مقاله</span>
                    </h3>
                    <nav className="space-y-1.5 max-h-[420px] overflow-y-auto scrollbar-thin pr-1 text-xs">
                      {article.table_of_contents.map((item) => (
                        <a
                          key={item.id}
                          href={`#${item.id}`}
                          className={`block py-1 text-muted-foreground hover:text-primary transition-colors leading-snug ${
                            item.level === 3
                              ? 'pr-3 border-r border-border text-[11px] opacity-80'
                              : 'font-medium'
                          }`}
                        >
                          {item.text}
                        </a>
                      ))}
                    </nav>
                  </div>
                )}

              {/* Related Articles Widget */}
              {article.related_articles &&
                article.related_articles.length > 0 && (
                  <div className="bg-card border border-border rounded-3xl p-6 shadow-xs space-y-4">
                    <h3 className="font-bold text-sm text-foreground flex items-center gap-2 border-b border-border pb-3">
                      <BookOpen className="h-4 w-4 text-primary" />
                      <span>مقالات مرتبط و پیشنهادی</span>
                    </h3>
                    <div className="space-y-4">
                      {article.related_articles.map((rel) => (
                        <Link
                          key={rel.id}
                          to={`/blog/${rel.slug}`}
                          className="group flex items-start gap-3"
                        >
                          <img
                            src={rel.cover_image}
                            alt={rel.title}
                            className="w-16 h-14 rounded-xl object-cover shrink-0 border border-border"
                          />
                          <div className="space-y-1">
                            <h4 className="text-xs font-bold text-foreground group-hover:text-primary transition-colors line-clamp-2 leading-snug">
                              {rel.title}
                            </h4>
                            <span className="text-[10px] text-muted-foreground flex items-center gap-1">
                              <Clock className="h-3 w-3 text-blue-500" />
                              <span>
                                {rel.reading_time_minutes} دقیقه مطالعه
                              </span>
                            </span>
                          </div>
                        </Link>
                      ))}
                    </div>
                  </div>
                )}

              {/* Quick Support Widget */}
              <div className="bg-muted/40 border border-border rounded-3xl p-5 text-center space-y-3">
                <HelpCircle className="h-8 w-8 text-primary mx-auto opacity-80" />
                <h4 className="font-bold text-xs text-foreground">
                  سوالی درباره این مقاله دارید؟
                </h4>
                <p className="text-[11px] text-muted-foreground leading-relaxed">
                  کارشناسان پشتیبانی آناهیکس ۲۴ ساعته در تلگرام پاسخگوی شما
                  هستند.
                </p>
                <a
                  href="https://t.me/AnahixSupport"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block w-full py-2 rounded-xl bg-card border border-border text-xs font-semibold hover:bg-background transition-colors text-blue-600"
                >
                  ارتباط با پشتیبان تلگرام
                </a>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Customer Auth Modal for Gated Comment Action */}
      <AuthModal
        isOpen={isAuthOpen}
        initialMode="login"
        onClose={() => setIsAuthOpen(false)}
        onSuccess={() => setIsAuthOpen(false)}
      />
    </div>
  )
}
