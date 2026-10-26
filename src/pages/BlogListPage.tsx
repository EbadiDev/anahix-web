import {
  ArrowLeft,
  BookOpen,
  Clock,
  Eye,
  Flame,
  Sparkles,
  Tag,
} from 'lucide-react'
import type React from 'react'
import { useEffect, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { CartDrawer } from '../components/CartDrawer'
import { Header } from '../components/Header'
import { LikeButton } from '../components/vibefarsi/LikeButton'
import { SearchInput } from '../components/vibefarsi/SearchInput'
import { api } from '../services/api'
import type { ArticleListItem, ContentCategory } from '../types'

function toPersianDigits(n: number | string): string {
  const f = ['۰', '۱', '۲', '۳', '۴', '۵', '۶', '۷', '۸', '۹']
  return String(n).replace(/\d/g, (d) => f[Number(d)])
}

export const BlogListPage: React.FC = () => {
  const [searchParams] = useSearchParams()
  const initialCategory = searchParams.get('category') || ''
  const initialTag = searchParams.get('tag') || ''
  const initialSearch = searchParams.get('search') || ''

  const [articles, setArticles] = useState<ArticleListItem[]>([])
  const [categories, setCategories] = useState<ContentCategory[]>([])
  const [selectedCategory, setSelectedCategory] =
    useState<string>(initialCategory)
  const [selectedTag, setSelectedTag] = useState<string>(initialTag)
  const [searchQuery, setSearchQuery] = useState<string>(initialSearch)
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [totalCount, setTotalCount] = useState(0)
  const [isLoading, setIsLoading] = useState(true)
  const [isCartOpen, setIsCartOpen] = useState(false)
  const [siteLogoUrl, setSiteLogoUrl] = useState<string>('')

  // Load Categories & Theme Settings on mount
  useEffect(() => {
    api
      .getContentCategories('blog')
      .then((data) => setCategories(data))
      .catch((err) => console.error(err))

    api
      .getThemeSettings()
      .then((st) => {
        if (st?.site_logo_url) setSiteLogoUrl(st.site_logo_url)
      })
      .catch(() => {})
  }, [])

  // Fetch articles on filter change
  useEffect(() => {
    setIsLoading(true)
    api
      .getArticles({
        page,
        page_size: 9,
        category: selectedCategory || undefined,
        tag: selectedTag || undefined,
        search: searchQuery || undefined,
      })
      .then((res) => {
        setArticles(res.items || [])
        setTotalPages(res.total_pages || 1)
        setTotalCount(res.total || 0)
      })
      .catch((err) => console.error(err))
      .finally(() => setIsLoading(false))
  }, [page, selectedCategory, selectedTag, searchQuery])

  const handleCategorySelect = (slug: string) => {
    setSelectedCategory(slug === selectedCategory ? '' : slug)
    setPage(1)
  }

  const featuredArticle = articles.find((a) => a.is_featured) || articles[0]

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col font-sans dir-rtl">
      <Header onOpenCart={() => setIsCartOpen(true)} />

      {/* Cart Drawer */}
      <CartDrawer isOpen={isCartOpen} onClose={() => setIsCartOpen(false)} />

      {/* Main Content */}
      <main className="flex-1 pb-16">
        {/* Hero Section */}
        <div className="relative overflow-hidden border-b border-border bg-gradient-to-b from-blue-50/50 via-background to-background dark:from-blue-950/20 dark:via-background dark:to-background py-12 md:py-16">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 text-center space-y-4">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-600 dark:text-blue-400 text-xs font-semibold">
              <Sparkles className="h-3.5 w-3.5" />
              <span>وبلاگ تخصصی و پایگاه سئو آناهیکس</span>
            </div>
            <h1 className="text-3xl sm:text-4xl md:text-5xl font-black tracking-tight text-foreground">
              آموزش‌ها، بنچمارک‌ها و تازه‌های{' '}
              <span className="text-primary bg-clip-text">هوش مصنوعی</span>
            </h1>
            <p className="text-sm md:text-base text-muted-foreground max-w-2xl mx-auto leading-relaxed">
              راهنماهای اختصاصی خرید و فعال‌سازی مدل‌های Gemini، Claude و ChatGPT،
              مقایسه تخصصی هوش‌های مصنوعی و ترفندهای رفع محدودیت‌ها و تحریم‌ها.
            </p>

            {/* Search Bar with Debounce & Action Buttons */}
            <div className="max-w-xl mx-auto mt-6">
              <SearchInput
                value={searchQuery}
                onChange={setSearchQuery}
                placeholder="جستجو در بین مقالات، آموزش‌ها، ارورها و مدل‌ها..."
                debounceMs={300}
              />
            </div>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 space-y-10">
          {/* Categories Pill Bar */}
          <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
            <button
              type="button"
              onClick={() => {
                setSelectedCategory('')
                setSelectedTag('')
                setPage(1)
              }}
              className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all shrink-0 ${
                !selectedCategory && !selectedTag
                  ? 'bg-primary text-primary-foreground shadow-sm'
                  : 'bg-card border border-border text-muted-foreground hover:text-foreground hover:bg-muted'
              }`}
            >
              همه مقالات ({totalCount})
            </button>
            {categories.map((cat) => (
              <button
                key={cat.id}
                type="button"
                onClick={() => handleCategorySelect(cat.slug)}
                className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all shrink-0 ${
                  selectedCategory === cat.slug
                    ? 'bg-primary text-primary-foreground shadow-sm'
                    : 'bg-card border border-border text-muted-foreground hover:text-foreground hover:bg-muted'
                }`}
              >
                {cat.name}
              </button>
            ))}
          </div>

          {/* Active Tag Filter Tag */}
          {selectedTag && (
            <div className="flex items-center gap-2 text-xs text-muted-foreground bg-muted/50 p-2.5 rounded-xl border border-border/60">
              <Tag className="h-3.5 w-3.5 text-blue-600" />
              <span>فیلتر بر اساس برچسب:</span>
              <strong className="text-foreground">{selectedTag}</strong>
              <button
                type="button"
                onClick={() => setSelectedTag('')}
                className="text-xs text-rose-500 hover:underline mr-auto"
              >
                حذف فیلتر
              </button>
            </div>
          )}

          {/* Featured Article Card */}
          {featuredArticle &&
            !selectedCategory &&
            !searchQuery &&
            page === 1 && (
              <div className="relative group rounded-surface border border-border/80 bg-card overflow-hidden shadow-surface duration-motion ease-motion transition-all">
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-0">
                  <div className="lg:col-span-7 relative h-64 sm:h-80 lg:h-auto overflow-hidden bg-muted">
                    <img
                      src={featuredArticle.cover_image}
                      alt={featuredArticle.title}
                      className="w-full h-full object-cover group-hover:scale-105 duration-motion ease-motion transition-transform"
                    />
                    <div className="absolute top-4 right-4 bg-slate-950/85 backdrop-blur-md text-amber-300 border border-amber-400/30 text-xs font-black px-3 py-1 rounded-control shadow-control flex items-center gap-1.5">
                      <Flame className="h-3.5 w-3.5 text-amber-400" />
                      <span>مقاله ویژه سردبیر</span>
                    </div>
                  </div>

                  <div className="lg:col-span-5 p-6 sm:p-8 flex flex-col justify-between space-y-4 text-right">
                    <div className="space-y-3">
                      <div className="flex items-center gap-2 flex-wrap">
                        {featuredArticle.category_name && (
                          <span className="px-2.5 py-1 rounded-control bg-slate-950/85 backdrop-blur-md text-white border border-white/20 text-[11px] font-black shadow-control flex items-center gap-1.5">
                            <span className="w-1.5 h-1.5 rounded-full bg-brand" />
                            <span>{featuredArticle.category_name}</span>
                          </span>
                        )}
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-control bg-muted/40 border border-border/60 text-[11px] font-bold text-muted-foreground">
                          <Clock className="h-3.5 w-3.5 text-brand" />
                          <span>
                            {Number(
                              featuredArticle.reading_time_minutes || 5,
                            ).toLocaleString('fa-IR')}{' '}
                            دقیقه مطالعه
                          </span>
                        </span>
                      </div>

                      <Link to={`/blog/${featuredArticle.slug}`}>
                        <h2 className="text-xl sm:text-2xl font-black text-foreground group-hover:text-primary transition-colors leading-snug">
                          {featuredArticle.title}
                        </h2>
                      </Link>

                      <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed line-clamp-3">
                        {featuredArticle.excerpt}
                      </p>
                    </div>

                    <div className="pt-4 border-t border-border/60 flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2.5">
                        {featuredArticle.author_avatar ? (
                          <img
                            src={featuredArticle.author_avatar}
                            alt={featuredArticle.author_name}
                            className="w-8 h-8 rounded-control object-cover border border-border/60"
                          />
                        ) : siteLogoUrl ? (
                          <img
                            src={siteLogoUrl}
                            alt="لوگوی آناهیکس"
                            className="w-8 h-8 rounded-control object-contain p-0.5 border border-border/60 bg-muted/20"
                          />
                        ) : (
                          <div className="w-8 h-8 rounded-control bg-secondary text-brand border border-border/60 flex items-center justify-center font-black text-xs">
                            {featuredArticle.author_name[0]}
                          </div>
                        )}
                        <div>
                          <span className="text-xs font-bold text-foreground block">
                            {featuredArticle.author_name}
                          </span>
                          <span className="text-[10px] text-muted-foreground block">
                            {featuredArticle.author_role}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        <Link
                          to={`/blog/${featuredArticle.slug}`}
                          className="h-9 px-4 rounded-control bg-primary hover:bg-primary-hover text-primary-foreground font-black text-xs duration-motion ease-motion active:scale-[0.98] shadow-control flex items-center justify-center gap-2 transition-all"
                        >
                          <span>مطالعه مقاله</span>
                          <ArrowLeft className="h-3.5 w-3.5" />
                        </Link>
                        <LikeButton
                          slug={featuredArticle.slug}
                          initialCount={featuredArticle.like_count || 0}
                          className="h-9 shrink-0"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

          {/* Regular Articles Grid */}
          <div>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-bold text-foreground flex items-center gap-2">
                <BookOpen className="h-5 w-5 text-primary" />
                <span>تازه‌ترین مقالات و آموزش‌ها</span>
              </h2>
              <span className="text-xs text-muted-foreground">
                نمایش {articles.length} از {totalCount} مقاله
              </span>
            </div>

            {isLoading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {[1, 2, 3, 4, 5, 6].map((i) => (
                  <div
                    key={i}
                    className="rounded-2xl border border-border bg-card p-4 space-y-4 animate-pulse"
                  >
                    <div className="h-44 bg-muted rounded-xl" />
                    <div className="h-4 bg-muted rounded-md w-3/4" />
                    <div className="h-3 bg-muted rounded-md w-full" />
                    <div className="h-3 bg-muted rounded-md w-1/2" />
                  </div>
                ))}
              </div>
            ) : articles.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {articles.map((art) => (
                  <article
                    key={art.id}
                    className="group rounded-2xl border border-border bg-card overflow-hidden shadow-xs hover:shadow-md hover:border-primary/40 transition-all flex flex-col justify-between"
                  >
                    <div>
                      {/* Image */}
                      <Link
                        to={`/blog/${art.slug}`}
                        className="block relative h-48 overflow-hidden bg-muted"
                      >
                        <img
                          src={art.cover_image}
                          alt={art.title}
                          loading="lazy"
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                        />
                        <div className="absolute top-3 right-3 bg-slate-950/85 backdrop-blur-md px-2.5 py-1 rounded-control text-[11px] font-black text-white border border-white/20 shadow-control flex items-center gap-1.5">
                          <span className="w-1.5 h-1.5 rounded-full bg-brand" />
                          <span>{art.category_name || 'آموزش'}</span>
                        </div>
                      </Link>

                      {/* Content */}
                      <div className="p-5 space-y-2.5">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-control bg-muted/40 border border-border/60 text-[11px] font-bold text-muted-foreground">
                            <Clock className="h-3.5 w-3.5 text-brand" />
                            <span>
                              {toPersianDigits(art.reading_time_minutes || 5)}{' '}
                              دقیقه مطالعه
                            </span>
                          </span>
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-control bg-muted/40 border border-border/60 text-[11px] font-bold text-muted-foreground">
                            <Eye className="h-3.5 w-3.5 text-muted-foreground" />
                            <span className="font-latin">
                              {Number(art.view_count || 0).toLocaleString(
                                'fa-IR',
                              )}{' '}
                              بازدید
                            </span>
                          </span>
                        </div>

                        <Link to={`/blog/${art.slug}`}>
                          <h3 className="font-black text-sm sm:text-base text-foreground group-hover:text-primary transition-colors line-clamp-2 leading-snug">
                            {art.title}
                          </h3>
                        </Link>

                        <p className="text-xs text-muted-foreground leading-relaxed line-clamp-2">
                          {art.excerpt}
                        </p>
                      </div>
                    </div>

                    {/* Footer: Action Button & Interactive Like Button */}
                    <div className="p-5 pt-0 flex items-center gap-2 mt-1">
                      <Link
                        to={`/blog/${art.slug}`}
                        className="flex-1 h-9 rounded-control bg-primary hover:bg-primary-hover text-primary-foreground font-black text-xs duration-motion ease-motion active:scale-[0.98] shadow-control flex items-center justify-center gap-2 transition-all"
                      >
                        <span>مطالعه مقاله</span>
                        <ArrowLeft className="h-3.5 w-3.5" />
                      </Link>
                      <LikeButton
                        slug={art.slug}
                        initialCount={art.like_count || 0}
                        className="h-9 shrink-0"
                      />
                    </div>
                  </article>
                ))}
              </div>
            ) : (
              <div className="text-center py-16 bg-card border border-border rounded-2xl p-8 space-y-3">
                <BookOpen className="h-10 w-10 text-muted-foreground/40 mx-auto" />
                <h3 className="font-bold text-base text-foreground">
                  مقاله‌ای با این مشخصات یافت نشد
                </h3>
                <p className="text-xs text-muted-foreground">
                  لطفاً کلمات کلیدی دیگری را جستجو کرده یا فیلتر دسته‌بندی را پاک
                  کنید.
                </p>
              </div>
            )}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-2 pt-6">
              {Array.from({ length: totalPages }).map((_, idx) => {
                const pageNum = idx + 1
                return (
                  <button
                    key={pageNum}
                    type="button"
                    onClick={() => setPage(pageNum)}
                    className={`w-9 h-9 rounded-xl text-xs font-semibold transition-all ${
                      page === pageNum
                        ? 'bg-primary text-primary-foreground shadow-sm'
                        : 'bg-card border border-border text-muted-foreground hover:bg-muted'
                    }`}
                  >
                    {pageNum}
                  </button>
                )
              })}
            </div>
          )}
        </div>
      </main>
    </div>
  )
}
