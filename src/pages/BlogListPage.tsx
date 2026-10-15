import {
  ArrowLeft,
  BookOpen,
  ChevronLeft,
  Clock,
  Eye,
  Flame,
  Search,
  Sparkles,
  Tag,
  Zap,
} from 'lucide-react'
import type React from 'react'
import { useEffect, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { CartDrawer } from '../components/CartDrawer'
import { Header } from '../components/Header'
import { api } from '../services/api'
import type { ArticleListItem, ContentCategory } from '../types'

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

  // Load Categories on mount
  useEffect(() => {
    api
      .getContentCategories('blog')
      .then((data) => setCategories(data))
      .catch((err) => console.error(err))
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

            {/* Search Bar */}
            <div className="max-w-xl mx-auto mt-6 relative">
              <Search className="h-5 w-5 absolute right-4 top-3.5 text-muted-foreground" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="جستجو در بین مقالات، آموزش‌ها، ارورها و مدل‌ها..."
                className="w-full rounded-2xl border border-border bg-card/90 backdrop-blur-md pl-4 pr-12 py-3 text-sm shadow-sm focus:outline-hidden focus:ring-2 focus:ring-primary/40 text-foreground placeholder:text-muted-foreground/60 transition-all"
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
              <div className="relative group rounded-3xl border border-border bg-card overflow-hidden shadow-sm hover:shadow-md transition-all">
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-0">
                  <div className="lg:col-span-7 relative h-64 sm:h-80 lg:h-auto overflow-hidden">
                    <img
                      src={featuredArticle.cover_image}
                      alt={featuredArticle.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                    <div className="absolute top-4 right-4 bg-primary text-primary-foreground text-xs font-bold px-3 py-1 rounded-full shadow-md flex items-center gap-1.5">
                      <Flame className="h-3.5 w-3.5" />
                      <span>مقاله ویژه سردبیر</span>
                    </div>
                  </div>

                  <div className="lg:col-span-5 p-6 sm:p-8 flex flex-col justify-between space-y-4">
                    <div className="space-y-3">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-semibold px-2.5 py-0.5 rounded-md bg-blue-500/10 text-primary">
                          {featuredArticle.category_name}
                        </span>
                        <span className="flex items-center gap-1 text-xs text-muted-foreground">
                          <Clock className="h-3.5 w-3.5 text-blue-500" />
                          <span>
                            {featuredArticle.reading_time_minutes} دقیقه مطالعه
                          </span>
                        </span>
                      </div>

                      <Link to={`/blog/${featuredArticle.slug}`}>
                        <h2 className="text-xl sm:text-2xl font-bold text-foreground group-hover:text-primary transition-colors leading-snug">
                          {featuredArticle.title}
                        </h2>
                      </Link>

                      <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed line-clamp-3">
                        {featuredArticle.excerpt}
                      </p>
                    </div>

                    <div className="pt-4 border-t border-border flex items-center justify-between">
                      <div className="flex items-center gap-2.5">
                        {featuredArticle.author_avatar ? (
                          <img
                            src={featuredArticle.author_avatar}
                            alt={featuredArticle.author_name}
                            className="w-8 h-8 rounded-full object-cover border border-border"
                          />
                        ) : (
                          <div className="w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-xs">
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

                      <Link
                        to={`/blog/${featuredArticle.slug}`}
                        className="inline-flex items-center gap-1.5 text-xs font-semibold text-primary hover:underline"
                      >
                        <span>مطالعه کامل</span>
                        <ArrowLeft className="h-3.5 w-3.5" />
                      </Link>
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
                        <div className="absolute top-3 right-3 bg-background/90 backdrop-blur-md px-2.5 py-0.5 rounded-lg text-[11px] font-semibold text-foreground border border-border/80">
                          {art.category_name}
                        </div>
                      </Link>

                      {/* Content */}
                      <div className="p-5 space-y-2.5">
                        <div className="flex items-center gap-3 text-[11px] text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <Clock className="h-3 w-3 text-blue-500" />
                            <span>{art.reading_time_minutes} دقیقه</span>
                          </span>
                          <span>•</span>
                          <span className="flex items-center gap-1">
                            <Eye className="h-3 w-3" />
                            <span>{art.view_count.toLocaleString()}</span>
                          </span>
                        </div>

                        <Link to={`/blog/${art.slug}`}>
                          <h3 className="font-bold text-sm sm:text-base text-foreground group-hover:text-primary transition-colors line-clamp-2 leading-snug">
                            {art.title}
                          </h3>
                        </Link>

                        <p className="text-xs text-muted-foreground leading-relaxed line-clamp-2">
                          {art.excerpt}
                        </p>
                      </div>
                    </div>

                    {/* Footer */}
                    <div className="px-5 pb-5 pt-2 border-t border-border/60 flex items-center justify-between text-xs">
                      <span className="text-[11px] text-muted-foreground font-medium">
                        {art.author_name}
                      </span>
                      <Link
                        to={`/blog/${art.slug}`}
                        className="inline-flex items-center gap-1 font-semibold text-primary group-hover:underline text-xs"
                      >
                        <span>مطالعه</span>
                        <ChevronLeft className="h-3.5 w-3.5" />
                      </Link>
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

          {/* CTA Banner to Storefront */}
          <div className="relative rounded-3xl bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-700 text-white p-8 shadow-xl overflow-hidden mt-12 flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="space-y-2 text-right z-10">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/20 backdrop-blur-md text-xs font-semibold">
                <Zap className="h-3.5 w-3.5" />
                <span>تحویل آنی اکانت‌های هوش مصنوعی</span>
              </span>
              <h2 className="text-xl sm:text-2xl font-bold">
                نیاز به اشتراک اختصاصی Gemini، ChatGPT یا Claude دارید؟
              </h2>
              <p className="text-xs sm:text-sm text-blue-100 max-w-xl leading-relaxed">
                تمامی اکانت‌ها با تحویل آنی صفر ثانیه، گارانتی تعویض تا آخرین روز
                اشتراک و پرداخت امن از طریق کارت‌های شتاب عرضه می‌شوند.
              </p>
            </div>
            <Link
              to="/"
              className="px-6 py-3 rounded-2xl bg-white text-blue-700 font-bold text-xs hover:bg-blue-50 transition-colors shadow-lg shrink-0 z-10"
            >
              مشاهده فروشگاه و خرید آنی
            </Link>
          </div>
        </div>
      </main>
    </div>
  )
}
