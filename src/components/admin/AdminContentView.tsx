import {
  AlertTriangle,
  ArrowRight,
  BookOpen,
  Check,
  CheckCircle2,
  Clock,
  Edit2,
  ExternalLink,
  Eye,
  FileText,
  HelpCircle,
  Layers,
  MessageSquare,
  Plus,
  RefreshCw,
  Search,
  Sparkles,
  Tag,
  ThumbsDown,
  ThumbsUp,
  Trash2,
  X,
} from 'lucide-react'
import type React from 'react'
import { useEffect, useState } from 'react'
import { api } from '../../services/api'
import type {
  ArticleComment,
  ArticleListItem,
  ContentCategory,
  ContentTemplate,
  CreateArticlePayload,
  CreateHelpGuidePayload,
  HelpGuideListItem,
  Product,
  ServiceTarget,
} from '../../types'
import { RichContentEditor } from '../content/RichContentEditor'

type ContentSubTab =
  | 'articles'
  | 'guides'
  | 'categories'
  | 'templates'
  | 'comments'

export const AdminContentView: React.FC = () => {
  const [activeSubTab, setActiveSubTab] = useState<ContentSubTab>('articles')
  const [categories, setCategories] = useState<ContentCategory[]>([])
  const [services, setServices] = useState<ServiceTarget[]>([])
  const [templates, setTemplates] = useState<ContentTemplate[]>([])
  const [products, setProducts] = useState<Product[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [actionMessage, setActionMessage] = useState<{
    text: string
    type: 'success' | 'error'
  } | null>(null)

  // Articles state
  const [articles, setArticles] = useState<ArticleListItem[]>([])
  const [articleSearch, setArticleSearch] = useState('')
  const [articleCategory, setArticleCategory] = useState('')
  const [isEditingArticle, setIsEditingArticle] = useState(false)
  const [editingArticleId, setEditingArticleId] = useState<string | null>(null)
  const [articleForm, setArticleForm] = useState<CreateArticlePayload>({
    title: '',
    slug: '',
    excerpt: '',
    content: '',
    cover_image: '',
    category_slug: 'tutorials',
    category_name: 'آموزش و ترفندها',
    tags: [],
    author_name: 'تحریریه آناهیکس',
    author_role: 'کارشناس هوش مصنوعی و امنیت',
    author_avatar: '',
    reading_time_minutes: 5,
    is_featured: false,
    is_published: true,
    related_product_id: '',
    related_product_title: '',
    related_product_slug: '',
    related_product_price: 0,
    meta_title: '',
    meta_description: '',
    meta_keywords: '',
    canonical_url: '',
  })
  const [tagInput, setTagInput] = useState('')

  // Guides state
  const [guides, setGuides] = useState<HelpGuideListItem[]>([])
  const [guideSearch, setGuideSearch] = useState('')
  const [guideCategory, setGuideCategory] = useState('')
  const [guideServiceTarget, setGuideServiceTarget] = useState('')
  const [isEditingGuide, setIsEditingGuide] = useState(false)
  const [editingGuideId, setEditingGuideId] = useState<string | null>(null)
  const [guideForm, setGuideForm] = useState<CreateHelpGuidePayload>({
    title: '',
    slug: '',
    excerpt: '',
    content: '',
    category_slug: 'troubleshooting',
    category_name: 'رفع ارورها و خطاهای تحریم',
    icon: 'AlertTriangle',
    difficulty: 'ساده',
    service_target: 'general',
    reading_time_minutes: 3,
    sort_order: 1,
    is_featured: false,
    is_published: true,
    related_product_id: '',
    related_product_title: '',
    related_product_slug: '',
    related_product_price: 0,
    meta_title: '',
    meta_description: '',
    meta_keywords: '',
  })

  // Comments state
  const [comments, setComments] = useState<ArticleComment[]>([])
  const [commentReplyMap, setCommentReplyMap] = useState<
    Record<string, string>
  >({})

  // Category Modal state
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false)
  const [categoryForm, setCategoryForm] = useState({
    id: '',
    name: '',
    slug: '',
    type: 'blog' as 'blog' | 'help' | 'product',
    icon: 'BookOpen',
    description: '',
    sort_order: 1,
  })

  // Template Modal state
  const [isTemplateModalOpen, setIsTemplateModalOpen] = useState(false)
  const [templateForm, setTemplateForm] = useState({
    id: '',
    title: '',
    slug: '',
    type: 'all' as 'all' | 'blog' | 'help',
    icon: 'FileText',
    description: '',
    template_content: '',
    sort_order: 1,
  })

  const showToast = (text: string, type: 'success' | 'error' = 'success') => {
    setActionMessage({ text, type })
    setTimeout(() => setActionMessage(null), 4000)
  }

  // Load Categories & Products on mount
  useEffect(() => {
    loadCategories()
    loadProducts()
    loadServices()
    loadTemplates()
  }, [])

  // Load active tab data
  useEffect(() => {
    if (activeSubTab === 'articles') {
      loadArticles()
    } else if (activeSubTab === 'guides') {
      loadGuides()
    } else if (activeSubTab === 'categories') {
      loadCategories()
    } else if (activeSubTab === 'templates') {
      loadTemplates()
    } else if (activeSubTab === 'comments') {
      loadComments()
    }
  }, [activeSubTab, articleCategory, guideCategory, guideServiceTarget])

  const loadServices = async () => {
    try {
      const data = await api.getContentServices()
      setServices(data)
    } catch (e: any) {
      console.error(e)
    }
  }

  const loadTemplates = async () => {
    try {
      const data = await api.getAdminContentTemplates()
      setTemplates(data)
    } catch (e: any) {
      console.error(e)
    }
  }

  const loadCategories = async () => {
    try {
      const data = await api.getAdminContentCategories()
      setCategories(data)
    } catch (e: any) {
      console.error(e)
    }
  }

  const loadProducts = async () => {
    try {
      const data = await api.getProducts()
      setProducts(data)
    } catch (e: any) {
      console.error(e)
    }
  }

  const loadArticles = async () => {
    setIsLoading(true)
    try {
      const res = await api.getAdminArticles({
        search: articleSearch,
        category: articleCategory,
        page_size: 50,
      })
      setArticles(res.items || [])
    } catch (e: any) {
      showToast(e.message || 'خطا در بارگذاری مقالات', 'error')
    } finally {
      setIsLoading(false)
    }
  }

  const loadGuides = async () => {
    setIsLoading(true)
    try {
      const res = await api.getAdminHelpGuides({
        search: guideSearch,
        category: guideCategory,
        service_target: guideServiceTarget,
        page_size: 50,
      })
      setGuides(res.items || [])
    } catch (e: any) {
      showToast(e.message || 'خطا در بارگذاری راهنماها', 'error')
    } finally {
      setIsLoading(false)
    }
  }

  const loadComments = async () => {
    setIsLoading(true)
    try {
      const data = await api.getAdminArticleComments()
      setComments(data)
    } catch (e: any) {
      showToast(e.message || 'خطا در بارگذاری نظرات', 'error')
    } finally {
      setIsLoading(false)
    }
  }

  // Handle article form
  const handleOpenNewArticle = () => {
    setEditingArticleId(null)
    setArticleForm({
      title: '',
      slug: '',
      excerpt: '',
      content: '',
      cover_image:
        'https://images.unsplash.com/photo-1677442136019-21780ecad995?auto=format&fit=crop&w=1200&q=80',
      category_slug: categories[0]?.slug || 'tutorials',
      category_name: categories[0]?.name || 'آموزش و ترفندها',
      tags: ['هوش مصنوعی', 'آموزش'],
      author_name: 'تحریریه آناهیکس',
      author_role: 'کارشناس هوش مصنوعی و امنیت',
      author_avatar: '',
      reading_time_minutes: 5,
      is_featured: false,
      is_published: true,
      related_product_id: '',
      related_product_title: '',
      related_product_slug: '',
      related_product_price: 0,
      meta_title: '',
      meta_description: '',
      meta_keywords: '',
      canonical_url: '',
    })
    setIsEditingArticle(true)
  }

  const handleEditArticle = async (id: string) => {
    try {
      setIsLoading(true)
      const detail = await api.getAdminArticle(id)
      setEditingArticleId(id)
      setArticleForm({
        title: detail.title,
        slug: detail.slug,
        excerpt: detail.excerpt,
        content: detail.content,
        cover_image: detail.cover_image,
        category_slug: detail.category_slug,
        category_name: detail.category_name,
        tags: detail.tags || [],
        author_name: detail.author_name,
        author_role: detail.author_role,
        author_avatar: detail.author_avatar,
        reading_time_minutes: detail.reading_time_minutes,
        is_featured: detail.is_featured,
        is_published: detail.is_published,
        related_product_id: detail.related_product_id || '',
        related_product_title: detail.related_product_title || '',
        related_product_slug: detail.related_product_slug || '',
        related_product_price: detail.related_product_price || 0,
        meta_title: detail.meta_title || '',
        meta_description: detail.meta_description || '',
        meta_keywords: detail.meta_keywords || '',
        canonical_url: detail.canonical_url || '',
      })
      setIsEditingArticle(true)
    } catch (e: any) {
      showToast(e.message || 'خطا در دریافت مشخصات مقاله', 'error')
    } finally {
      setIsLoading(false)
    }
  }

  const handleSaveArticle = async () => {
    if (!articleForm.title || !articleForm.content) {
      showToast('عنوان و متن مقاله الزامی است', 'error')
      return
    }

    try {
      setIsLoading(true)
      if (editingArticleId) {
        await api.updateAdminArticle(editingArticleId, articleForm)
        showToast('مقاله با موفقیت به‌روزرسانی شد')
      } else {
        await api.createAdminArticle(articleForm)
        showToast('مقاله جدید با موفقیت ایجاد و منتشر شد')
      }
      setIsEditingArticle(false)
      loadArticles()
    } catch (e: any) {
      showToast(e.message || 'خطا در ذخیره مقاله', 'error')
    } finally {
      setIsLoading(false)
    }
  }

  const handleDeleteArticle = async (id: string) => {
    if (!window.confirm('آیا از حذف این مقاله اطمینان دارید؟')) return
    try {
      await api.deleteAdminArticle(id)
      showToast('مقاله با موفقیت حذف شد')
      loadArticles()
    } catch (e: any) {
      showToast(e.message || 'خطا در حذف مقاله', 'error')
    }
  }

  // Handle Guide form
  const handleOpenNewGuide = () => {
    setEditingGuideId(null)
    setGuideForm({
      title: '',
      slug: '',
      excerpt: '',
      content: '',
      category_slug: 'troubleshooting',
      category_name: 'رفع ارورها و خطاهای تحریم',
      icon: 'AlertTriangle',
      difficulty: 'ساده',
      service_target: 'general',
      reading_time_minutes: 3,
      sort_order: 1,
      is_featured: false,
      is_published: true,
      related_product_id: '',
      related_product_title: '',
      related_product_slug: '',
      related_product_price: 0,
      meta_title: '',
      meta_description: '',
      meta_keywords: '',
    })
    setIsEditingGuide(true)
  }

  const handleEditGuide = async (id: string) => {
    try {
      setIsLoading(true)
      const detail = await api.getAdminHelpGuide(id)
      setEditingGuideId(id)
      setGuideForm({
        title: detail.title,
        slug: detail.slug,
        excerpt: detail.excerpt,
        content: detail.content,
        category_slug: detail.category_slug,
        category_name: detail.category_name,
        icon: detail.icon,
        difficulty: detail.difficulty,
        service_target: detail.service_target,
        reading_time_minutes: detail.reading_time_minutes,
        sort_order: (detail as any).sort_order || 1,
        is_featured: detail.is_featured,
        is_published: detail.is_published,
        related_product_id: detail.related_product_id || '',
        related_product_title: detail.related_product_title || '',
        related_product_slug: detail.related_product_slug || '',
        related_product_price: detail.related_product_price || 0,
        meta_title: detail.meta_title || '',
        meta_description: detail.meta_description || '',
        meta_keywords: detail.meta_keywords || '',
      })
      setIsEditingGuide(true)
    } catch (e: any) {
      showToast(e.message || 'خطا در دریافت اطلاعات راهنما', 'error')
    } finally {
      setIsLoading(false)
    }
  }

  const handleSaveGuide = async () => {
    if (!guideForm.title || !guideForm.content) {
      showToast('عنوان و متن راهنما الزامی است', 'error')
      return
    }

    try {
      setIsLoading(true)
      if (editingGuideId) {
        await api.updateAdminHelpGuide(editingGuideId, guideForm)
        showToast('راهنما با موفقیت ویرایش شد')
      } else {
        await api.createAdminHelpGuide(guideForm)
        showToast('راهنمای جدید ایجاد و منتشر شد')
      }
      setIsEditingGuide(false)
      loadGuides()
    } catch (e: any) {
      showToast(e.message || 'خطا در ذخیره راهنما', 'error')
    } finally {
      setIsLoading(false)
    }
  }

  const handleDeleteGuide = async (id: string) => {
    if (!window.confirm('آیا از حذف این راهنما اطمینان دارید؟')) return
    try {
      await api.deleteAdminHelpGuide(id)
      showToast('راهنما با موفقیت حذف شد')
      loadGuides()
    } catch (e: any) {
      showToast(e.message || 'خطا در حذف راهنما', 'error')
    }
  }

  // Handle Comments
  const handleUpdateCommentStatus = async (
    id: string,
    status: string,
    reply?: string,
  ) => {
    try {
      await api.updateAdminCommentStatus(id, status, reply)
      showToast('وضعیت دیدگاه به‌روزرسانی شد')
      loadComments()
    } catch (e: any) {
      showToast(e.message || 'خطا در به‌روزرسانی دیدگاه', 'error')
    }
  }

  const handleDeleteComment = async (id: string) => {
    if (!window.confirm('دیدگاه حذف شود؟')) return
    try {
      await api.deleteAdminComment(id)
      showToast('دیدگاه با موفقیت حذف شد')
      loadComments()
    } catch (e: any) {
      showToast(e.message || 'خطا در حذف دیدگاه', 'error')
    }
  }

  // Handle Categories
  const handleSaveCategory = async () => {
    if (!categoryForm.name || !categoryForm.slug) {
      showToast('نام و شناسه یکتا الزامی است', 'error')
      return
    }
    try {
      if (categoryForm.id) {
        await api.updateAdminContentCategory(categoryForm.id, categoryForm)
        showToast('دسته‌بندی با موفقیت ویرایش شد')
      } else {
        await api.createAdminContentCategory(categoryForm)
        showToast('دسته‌بندی جدید با موفقیت اضافه شد')
      }
      setIsCategoryModalOpen(false)
      loadCategories()
    } catch (e: any) {
      showToast(e.message || 'خطا در ثبت دسته', 'error')
    }
  }

  const handleDeleteCategory = async (id: string) => {
    if (!window.confirm('آیا از حذف این دسته‌بندی اطمینان دارید؟')) return
    try {
      await api.deleteAdminContentCategory(id)
      showToast('دسته‌بندی با موفقیت حذف شد')
      loadCategories()
    } catch (e: any) {
      showToast(e.message || 'خطا در حذف دسته', 'error')
    }
  }

  // Handle Templates
  const handleSaveTemplate = async () => {
    if (!templateForm.title || !templateForm.template_content) {
      showToast('عنوان و محتوای قالب الزامی است', 'error')
      return
    }
    try {
      if (templateForm.id) {
        await api.updateAdminContentTemplate(templateForm.id, templateForm)
        showToast('قالب با موفقیت ویرایش شد')
      } else {
        await api.createAdminContentTemplate(templateForm)
        showToast('قالب جدید به دیتابیس اضافه شد')
      }
      setIsTemplateModalOpen(false)
      loadTemplates()
    } catch (e: any) {
      showToast(e.message || 'خطا در ثبت قالب', 'error')
    }
  }

  const handleDeleteTemplate = async (id: string) => {
    if (!window.confirm('آیا از حذف این قالب اطمینان دارید؟')) return
    try {
      await api.deleteAdminContentTemplate(id)
      showToast('قالب با موفقیت حذف شد')
      loadTemplates()
    } catch (e: any) {
      showToast(e.message || 'خطا در حذف قالب', 'error')
    }
  }

  return (
    <div className="space-y-6 text-right dir-rtl">
      {/* Toast alert */}
      {actionMessage && (
        <div
          className={`p-4 rounded-xl border flex items-center justify-between transition-all ${
            actionMessage.type === 'success'
              ? 'bg-emerald-50/80 border-emerald-500/40 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-200'
              : 'bg-rose-50/80 border-rose-500/40 text-rose-800 dark:bg-rose-950/40 dark:text-rose-200'
          }`}
        >
          <div className="flex items-center gap-2">
            {actionMessage.type === 'success' ? (
              <CheckCircle2 className="h-5 w-5 text-emerald-600" />
            ) : (
              <AlertTriangle className="h-5 w-5 text-rose-600" />
            )}
            <span className="text-sm font-semibold">{actionMessage.text}</span>
          </div>
          <button
            type="button"
            onClick={() => setActionMessage(null)}
            className="text-xs opacity-70 hover:opacity-100"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* Top Header Card */}
      <div className="bg-card border border-border rounded-2xl p-6 shadow-sm relative overflow-hidden">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2.5 mb-1.5">
              <span className="p-2 rounded-xl bg-blue-500/10 text-primary">
                <BookOpen className="h-6 w-6" />
              </span>
              <h1 className="text-xl font-bold text-foreground">
                وبلاگ و پایگاه دانش (SEO & Knowledge Base Engine)
              </h1>
            </div>
            <p className="text-xs text-muted-foreground leading-relaxed max-w-2xl">
              تولید و مدیریت مقالات سئو محور، مقایسه تخصصی مدل‌ها (GPT-4o vs
              o3/o1)، راهنماهای رفع ارورهای تحریم و خطای ۴۰۳، و ارتباط مستقیم با
              محصولات فروشگاه جهت افزایش نرخ تبدیل.
            </p>
          </div>

          <div className="flex items-center gap-2">
            {activeSubTab === 'articles' && !isEditingArticle && (
              <button
                type="button"
                onClick={handleOpenNewArticle}
                className="flex items-center gap-1.5 px-4 py-2 bg-primary text-primary-foreground text-xs font-semibold rounded-xl hover:opacity-90 transition-opacity shadow-sm"
              >
                <Plus className="h-4 w-4" />
                <span>مقاله جدید</span>
              </button>
            )}

            {activeSubTab === 'guides' && !isEditingGuide && (
              <button
                type="button"
                onClick={handleOpenNewGuide}
                className="flex items-center gap-1.5 px-4 py-2 bg-primary text-primary-foreground text-xs font-semibold rounded-xl hover:opacity-90 transition-opacity shadow-sm"
              >
                <Plus className="h-4 w-4" />
                <span>راهنمای جدید</span>
              </button>
            )}

            {activeSubTab === 'categories' && (
              <button
                type="button"
                onClick={() => {
                  setCategoryForm({
                    id: '',
                    name: '',
                    slug: '',
                    type: 'blog',
                    icon: 'BookOpen',
                    description: '',
                    sort_order: categories.length + 1,
                  })
                  setIsCategoryModalOpen(true)
                }}
                className="flex items-center gap-1.5 px-4 py-2 bg-primary text-primary-foreground text-xs font-semibold rounded-xl hover:opacity-90 transition-opacity shadow-sm"
              >
                <Plus className="h-4 w-4" />
                <span>دسته جدید</span>
              </button>
            )}

            {activeSubTab === 'templates' && (
              <button
                type="button"
                onClick={() => {
                  setTemplateForm({
                    id: '',
                    title: '',
                    slug: '',
                    type: 'all',
                    icon: 'FileText',
                    description: '',
                    template_content: '',
                    sort_order: templates.length + 1,
                  })
                  setIsTemplateModalOpen(true)
                }}
                className="flex items-center gap-1.5 px-4 py-2 bg-primary text-primary-foreground text-xs font-semibold rounded-xl hover:opacity-90 transition-opacity shadow-sm"
              >
                <Plus className="h-4 w-4" />
                <span>قالب نگارش جدید</span>
              </button>
            )}
          </div>
        </div>

        {/* Sub-Navigation Tabs */}
        <div className="flex items-center gap-2 mt-6 border-b border-border/80 pb-2 overflow-x-auto scrollbar-none">
          <button
            type="button"
            onClick={() => {
              setActiveSubTab('articles')
              setIsEditingArticle(false)
            }}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all shrink-0 ${
              activeSubTab === 'articles'
                ? 'bg-primary text-primary-foreground shadow-xs'
                : 'text-muted-foreground hover:bg-muted hover:text-foreground'
            }`}
          >
            <FileText className="h-4 w-4" />
            <span>مقالات وبلاگ و اخبار</span>
            <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-background/20">
              {articles.length}
            </span>
          </button>

          <button
            type="button"
            onClick={() => {
              setActiveSubTab('guides')
              setIsEditingGuide(false)
            }}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all shrink-0 ${
              activeSubTab === 'guides'
                ? 'bg-primary text-primary-foreground shadow-xs'
                : 'text-muted-foreground hover:bg-muted hover:text-foreground'
            }`}
          >
            <HelpCircle className="h-4 w-4" />
            <span>پایگاه دانش و رفع ارورها</span>
            <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-background/20">
              {guides.length}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveSubTab('categories')}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all shrink-0 ${
              activeSubTab === 'categories'
                ? 'bg-primary text-primary-foreground shadow-xs'
                : 'text-muted-foreground hover:bg-muted hover:text-foreground'
            }`}
          >
            <Layers className="h-4 w-4" />
            <span>دسته‌بندی‌ها و سرفصل‌ها</span>
            <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-background/20">
              {categories.length}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveSubTab('templates')}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all shrink-0 ${
              activeSubTab === 'templates'
                ? 'bg-primary text-primary-foreground shadow-xs'
                : 'text-muted-foreground hover:bg-muted hover:text-foreground'
            }`}
          >
            <Sparkles className="h-4 w-4" />
            <span>قالب‌های آماده نگارش (دیتابیس)</span>
            <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-background/20">
              {templates.length}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveSubTab('comments')}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all shrink-0 ${
              activeSubTab === 'comments'
                ? 'bg-primary text-primary-foreground shadow-xs'
                : 'text-muted-foreground hover:bg-muted hover:text-foreground'
            }`}
          >
            <MessageSquare className="h-4 w-4" />
            <span>دیدگاه‌های خوانندگان</span>
            <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-background/20">
              {comments.length}
            </span>
          </button>
        </div>
      </div>

      {/* ----------------- SUB-TAB 1: BLOG ARTICLES ----------------- */}
      {activeSubTab === 'articles' && (
        <div className="space-y-4">
          {/* Article Editor Mode */}
          {isEditingArticle ? (
            <div className="bg-card border border-border rounded-2xl p-6 shadow-sm space-y-6">
              <div className="flex items-center justify-between border-b border-border pb-4">
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setIsEditingArticle(false)}
                    className="p-1.5 hover:bg-muted rounded-lg text-muted-foreground transition-colors"
                  >
                    <ArrowRight className="h-5 w-5" />
                  </button>
                  <h2 className="text-base font-bold text-foreground">
                    {editingArticleId ? 'ویرایش مقاله' : 'نگارش مقاله جدید'}
                  </h2>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setIsEditingArticle(false)}
                    className="px-3.5 py-1.5 text-xs text-muted-foreground hover:bg-muted rounded-xl transition-colors"
                  >
                    انصراف
                  </button>
                  <button
                    type="button"
                    onClick={handleSaveArticle}
                    disabled={isLoading}
                    className="px-5 py-2 bg-primary text-primary-foreground text-xs font-semibold rounded-xl hover:opacity-90 disabled:opacity-50 transition-opacity flex items-center gap-1.5 shadow-sm"
                  >
                    <Check className="h-4 w-4" />
                    <span>
                      {editingArticleId ? 'ذخیره تغییرات' : 'انتشار مقاله'}
                    </span>
                  </button>
                </div>
              </div>

              {/* Basic Fields */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-foreground block">
                    عنوان مقاله (H1) *
                  </label>
                  <input
                    type="text"
                    value={articleForm.title}
                    onChange={(e) =>
                      setArticleForm({ ...articleForm, title: e.target.value })
                    }
                    placeholder="مثلاً: راهنمای خرید جمینای ادونسد در ایران بدون ریسک"
                    className="w-full rounded-xl border border-border bg-background px-3.5 py-2.5 text-sm focus:outline-hidden focus:ring-2 focus:ring-primary/40 font-medium"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-foreground block">
                    پیوند یکتا (Slug برای URL سئو) *
                  </label>
                  <input
                    type="text"
                    value={articleForm.slug}
                    onChange={(e) =>
                      setArticleForm({ ...articleForm, slug: e.target.value })
                    }
                    placeholder="how-to-buy-gemini-advanced"
                    dir="ltr"
                    className="w-full rounded-xl border border-border bg-background px-3.5 py-2.5 text-sm focus:outline-hidden focus:ring-2 focus:ring-primary/40 text-left font-mono"
                  />
                </div>
              </div>

              {/* Excerpt */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-foreground block">
                  خلاصه مقاله (برای کارت‌ها و متا دیسکریپشن گوگل)
                </label>
                <textarea
                  rows={2}
                  value={articleForm.excerpt}
                  onChange={(e) =>
                    setArticleForm({ ...articleForm, excerpt: e.target.value })
                  }
                  placeholder="توضیح دو یا سه جمله‌ای ترغیب‌کننده برای سرچ گوگل..."
                  className="w-full rounded-xl border border-border bg-background p-3 text-sm focus:outline-hidden focus:ring-2 focus:ring-primary/40 leading-relaxed"
                />
              </div>

              {/* Rich Content Editor */}
              <div className="space-y-2">
                <RichContentEditor
                  value={articleForm.content}
                  onChange={(val) =>
                    setArticleForm({ ...articleForm, content: val })
                  }
                  onReadingTimeChange={(rt) =>
                    setArticleForm({
                      ...articleForm,
                      reading_time_minutes: rt,
                    })
                  }
                  contentType="blog"
                  label="محتوای متنی مقاله (Markdown حرفه‌ای)"
                  minHeight="480px"
                />
              </div>

              {/* Meta & Configuration Grid */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4 border-t border-border">
                {/* Category Selection */}
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-foreground block">
                    دسته‌بندی مقاله
                  </label>
                  <select
                    value={articleForm.category_slug}
                    onChange={(e) => {
                      const sel = categories.find(
                        (c) => c.slug === e.target.value,
                      )
                      setArticleForm({
                        ...articleForm,
                        category_slug: e.target.value,
                        category_name: sel?.name || '',
                      })
                    }}
                    className="w-full rounded-xl border border-border bg-background px-3 py-2 text-xs focus:outline-hidden focus:ring-2 focus:ring-primary/40"
                  >
                    {categories
                      .filter((c) => c.type === 'blog')
                      .map((c) => (
                        <option key={c.id} value={c.slug}>
                          {c.name}
                        </option>
                      ))}
                  </select>
                </div>

                {/* Cover Image URL */}
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-foreground block">
                    آدرس تصویر شاخص (Cover Image)
                  </label>
                  <input
                    type="text"
                    value={articleForm.cover_image}
                    onChange={(e) =>
                      setArticleForm({
                        ...articleForm,
                        cover_image: e.target.value,
                      })
                    }
                    placeholder="https://..."
                    dir="ltr"
                    className="w-full rounded-xl border border-border bg-background px-3 py-2 text-xs focus:outline-hidden focus:ring-2 focus:ring-primary/40 font-mono text-left"
                  />
                </div>

                {/* Related Product CTA Integration */}
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-foreground flex items-center justify-between">
                    <span>محصول مرتبط جهت خرید (CTA)</span>
                    <Sparkles className="h-3 w-3 text-blue-600" />
                  </label>
                  <select
                    value={articleForm.related_product_id}
                    onChange={(e) => {
                      const p = products.find(
                        (prod) => String(prod.id) === e.target.value,
                      )
                      setArticleForm({
                        ...articleForm,
                        related_product_id: e.target.value,
                        related_product_title: p?.title_fa || '',
                        related_product_slug: p?.slug || '',
                        related_product_price: p?.price_toman || 0,
                      })
                    }}
                    className="w-full rounded-xl border border-border bg-background px-3 py-2 text-xs focus:outline-hidden focus:ring-2 focus:ring-primary/40"
                  >
                    <option value="">بدون اتصال به محصول</option>
                    {products.map((p) => (
                      <option key={p.id} value={String(p.id)}>
                        {p.title_fa} - {p.price_toman.toLocaleString()} تومان
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Tags Management */}
              <div className="space-y-2 pt-2">
                <label className="text-xs font-semibold text-foreground block">
                  برچسب‌ها و کلمات کلیدی (Tags)
                </label>
                <div className="flex flex-wrap items-center gap-2">
                  {articleForm.tags.map((t) => (
                    <span
                      key={`tag-item-${t}`}
                      className="flex items-center gap-1 text-xs bg-muted text-foreground px-2.5 py-1 rounded-lg border border-border/80"
                    >
                      <Tag className="h-3 w-3 text-blue-600" />
                      <span>{t}</span>
                      <button
                        type="button"
                        onClick={() =>
                          setArticleForm({
                            ...articleForm,
                            tags: articleForm.tags.filter(
                              (tagItem) => tagItem !== t,
                            ),
                          })
                        }
                        className="text-muted-foreground hover:text-rose-500 mr-1"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </span>
                  ))}
                  <div className="flex items-center gap-1.5">
                    <input
                      type="text"
                      value={tagInput}
                      onChange={(e) => setTagInput(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault()
                          if (tagInput.trim()) {
                            setArticleForm({
                              ...articleForm,
                              tags: [...articleForm.tags, tagInput.trim()],
                            })
                            setTagInput('')
                          }
                        }
                      }}
                      placeholder="برچسب جدید (اینتر بزنید)..."
                      className="rounded-lg border border-border bg-background px-2.5 py-1 text-xs focus:outline-hidden focus:ring-1 focus:ring-primary"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        if (tagInput.trim()) {
                          setArticleForm({
                            ...articleForm,
                            tags: [...articleForm.tags, tagInput.trim()],
                          })
                          setTagInput('')
                        }
                      }}
                      className="px-2.5 py-1 text-xs bg-muted hover:bg-muted/80 rounded-lg text-foreground font-medium"
                    >
                      افزودن
                    </button>
                  </div>
                </div>
              </div>

              {/* Visibility & Featured Toggles */}
              <div className="flex items-center gap-6 pt-3 border-t border-border">
                <label className="flex items-center gap-2 text-xs font-medium cursor-pointer">
                  <input
                    type="checkbox"
                    checked={articleForm.is_published}
                    onChange={(e) =>
                      setArticleForm({
                        ...articleForm,
                        is_published: e.target.checked,
                      })
                    }
                    className="rounded border-border text-primary focus:ring-primary h-4 w-4"
                  />
                  <span>انتشار عمومی (در دسترس کاربران و موتورهای جستجو)</span>
                </label>

                <label className="flex items-center gap-2 text-xs font-medium cursor-pointer">
                  <input
                    type="checkbox"
                    checked={articleForm.is_featured}
                    onChange={(e) =>
                      setArticleForm({
                        ...articleForm,
                        is_featured: e.target.checked,
                      })
                    }
                    className="rounded border-border text-primary focus:ring-primary h-4 w-4"
                  />
                  <span>پین کردن به عنوان مقاله ویژه صفحه اصلی وبلاگ</span>
                </label>
              </div>
            </div>
          ) : (
            /* Articles List View */
            <div className="space-y-4">
              {/* Filter bar */}
              <div className="bg-card border border-border rounded-xl p-3 flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-2 flex-1 min-w-[240px]">
                  <div className="relative flex-1">
                    <Search className="h-4 w-4 absolute right-3 top-2.5 text-muted-foreground" />
                    <input
                      type="text"
                      value={articleSearch}
                      onChange={(e) => setArticleSearch(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && loadArticles()}
                      placeholder="جستجو در عنوان، محتوا یا اسلاگ مقالات..."
                      className="w-full pl-3 pr-9 py-1.5 text-xs rounded-lg border border-border bg-background focus:outline-hidden focus:ring-1 focus:ring-primary"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={loadArticles}
                    className="px-3 py-1.5 bg-muted text-foreground text-xs font-semibold rounded-lg hover:bg-muted/80 transition-colors"
                  >
                    جستجو
                  </button>
                </div>

                <div className="flex items-center gap-2">
                  <select
                    value={articleCategory}
                    onChange={(e) => setArticleCategory(e.target.value)}
                    className="rounded-lg border border-border bg-background px-3 py-1.5 text-xs focus:outline-hidden"
                  >
                    <option value="">همه دسته‌ها</option>
                    {categories
                      .filter((c) => c.type === 'blog')
                      .map((c) => (
                        <option key={c.id} value={c.slug}>
                          {c.name}
                        </option>
                      ))}
                  </select>

                  <button
                    type="button"
                    onClick={loadArticles}
                    className="p-1.5 text-muted-foreground hover:text-foreground rounded-lg hover:bg-muted transition-colors"
                    title="تازه‌سازی"
                  >
                    <RefreshCw className="h-4 w-4" />
                  </button>
                </div>
              </div>

              {/* Table */}
              <div className="bg-card border border-border rounded-2xl overflow-hidden shadow-sm">
                <div className="overflow-x-auto">
                  <table className="w-full text-right text-xs">
                    <thead>
                      <tr className="border-b border-border bg-muted/40 text-muted-foreground font-semibold">
                        <th className="p-3.5">تصویر و عنوان مقاله</th>
                        <th className="p-3.5">دسته‌بندی</th>
                        <th className="p-3.5">زمان مطالعه</th>
                        <th className="p-3.5">بازدید</th>
                        <th className="p-3.5">وضعیت</th>
                        <th className="p-3.5 text-left">عملیات</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border/60">
                      {articles.map((art) => (
                        <tr
                          key={art.id}
                          className="hover:bg-muted/30 transition-colors"
                        >
                          <td className="p-3.5">
                            <div className="flex items-center gap-3">
                              <img
                                src={
                                  art.cover_image ||
                                  'https://images.unsplash.com/photo-1677442136019-21780ecad995?auto=format&fit=crop&w=120&q=80'
                                }
                                alt={art.title}
                                className="w-12 h-10 object-cover rounded-lg border border-border shrink-0"
                              />
                              <div className="space-y-0.5">
                                <div className="font-bold text-foreground line-clamp-1 flex items-center gap-1.5">
                                  <span>{art.title}</span>
                                  {art.is_featured && (
                                    <span className="text-[10px] bg-amber-500/10 text-amber-600 dark:text-amber-400 px-1.5 py-0.2 rounded-full font-semibold">
                                      ویژه
                                    </span>
                                  )}
                                </div>
                                <span className="text-[11px] text-muted-foreground font-mono block dir-ltr text-right">
                                  /blog/{art.slug}
                                </span>
                              </div>
                            </div>
                          </td>
                          <td className="p-3.5">
                            <span className="bg-blue-500/10 text-blue-600 dark:text-blue-400 px-2 py-0.5 rounded-md font-medium text-[11px]">
                              {art.category_name}
                            </span>
                          </td>
                          <td className="p-3.5">
                            <span className="flex items-center gap-1 text-muted-foreground">
                              <Clock className="h-3 w-3 text-blue-500" />
                              <span>{art.reading_time_minutes} دقیقه</span>
                            </span>
                          </td>
                          <td className="p-3.5">
                            <span className="flex items-center gap-1 text-muted-foreground font-medium">
                              <Eye className="h-3 w-3" />
                              <span>{art.view_count.toLocaleString()}</span>
                            </span>
                          </td>
                          <td className="p-3.5">
                            {art.is_published ? (
                              <span className="inline-flex items-center gap-1 text-emerald-600 dark:text-emerald-400 font-semibold text-[11px]">
                                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                                منتشر شده
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 text-muted-foreground font-medium text-[11px]">
                                <span className="h-1.5 w-1.5 rounded-full bg-slate-400" />
                                پیش‌نویس
                              </span>
                            )}
                          </td>
                          <td className="p-3.5 text-left">
                            <div className="flex items-center justify-end gap-1.5">
                              <a
                                href={`/blog/${art.slug}`}
                                target="_blank"
                                rel="noreferrer"
                                className="p-1.5 text-muted-foreground hover:text-blue-600 rounded-lg hover:bg-muted transition-colors"
                                title="مشاهده عمومی"
                              >
                                <ExternalLink className="h-4 w-4" />
                              </a>
                              <button
                                type="button"
                                onClick={() => handleEditArticle(art.id)}
                                className="p-1.5 text-muted-foreground hover:text-foreground rounded-lg hover:bg-muted transition-colors"
                                title="ویرایش مقاله"
                              >
                                <Edit2 className="h-4 w-4" />
                              </button>
                              <button
                                type="button"
                                onClick={() => handleDeleteArticle(art.id)}
                                className="p-1.5 text-muted-foreground hover:text-rose-500 rounded-lg hover:bg-muted transition-colors"
                                title="حذف مقاله"
                              >
                                <Trash2 className="h-4 w-4" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}

                      {articles.length === 0 && !isLoading && (
                        <tr>
                          <td
                            colSpan={6}
                            className="p-8 text-center text-muted-foreground"
                          >
                            هیچ مقاله‌ای یافت نشد. برای شروع اولین مقاله را ثبت
                            کنید.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ----------------- SUB-TAB 2: HELP GUIDES ----------------- */}
      {activeSubTab === 'guides' && (
        <div className="space-y-4">
          {/* Guide Editor */}
          {isEditingGuide ? (
            <div className="bg-card border border-border rounded-2xl p-6 shadow-sm space-y-6">
              <div className="flex items-center justify-between border-b border-border pb-4">
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setIsEditingGuide(false)}
                    className="p-1.5 hover:bg-muted rounded-lg text-muted-foreground transition-colors"
                  >
                    <ArrowRight className="h-5 w-5" />
                  </button>
                  <h2 className="text-base font-bold text-foreground">
                    {editingGuideId
                      ? 'ویرایش راهنما'
                      : 'ثبت راهنمای جدید پایگاه دانش'}
                  </h2>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setIsEditingGuide(false)}
                    className="px-3.5 py-1.5 text-xs text-muted-foreground hover:bg-muted rounded-xl transition-colors"
                  >
                    انصراف
                  </button>
                  <button
                    type="button"
                    onClick={handleSaveGuide}
                    disabled={isLoading}
                    className="px-5 py-2 bg-primary text-primary-foreground text-xs font-semibold rounded-xl hover:opacity-90 disabled:opacity-50 transition-opacity flex items-center gap-1.5 shadow-sm"
                  >
                    <Check className="h-4 w-4" />
                    <span>
                      {editingGuideId ? 'ذخیره تغییرات' : 'انتشار راهنما'}
                    </span>
                  </button>
                </div>
              </div>

              {/* Basic Fields */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-foreground block">
                    عنوان راهنما *
                  </label>
                  <input
                    type="text"
                    value={guideForm.title}
                    onChange={(e) =>
                      setGuideForm({ ...guideForm, title: e.target.value })
                    }
                    placeholder="مثلاً: حل مشکل عدم دریافت پیامک در شماره‌های ۵SIM"
                    className="w-full rounded-xl border border-border bg-background px-3.5 py-2.5 text-sm focus:outline-hidden focus:ring-2 focus:ring-primary/40 font-medium"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-foreground block">
                    پیوند یکتا (Slug) *
                  </label>
                  <input
                    type="text"
                    value={guideForm.slug}
                    onChange={(e) =>
                      setGuideForm({ ...guideForm, slug: e.target.value })
                    }
                    placeholder="fix-5sim-sms-delivery"
                    dir="ltr"
                    className="w-full rounded-xl border border-border bg-background px-3.5 py-2.5 text-sm focus:outline-hidden focus:ring-2 focus:ring-primary/40 font-mono text-left"
                  />
                </div>
              </div>

              {/* Excerpt */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-foreground block">
                  خلاصه راهنما
                </label>
                <textarea
                  rows={2}
                  value={guideForm.excerpt}
                  onChange={(e) =>
                    setGuideForm({ ...guideForm, excerpt: e.target.value })
                  }
                  placeholder="توضیح کوتاه درباره این راهنما..."
                  className="w-full rounded-xl border border-border bg-background p-3 text-sm focus:outline-hidden focus:ring-2 focus:ring-primary/40"
                />
              </div>

              {/* Content Editor */}
              <div className="space-y-2">
                <RichContentEditor
                  value={guideForm.content}
                  onChange={(val) =>
                    setGuideForm({ ...guideForm, content: val })
                  }
                  onReadingTimeChange={(rt) =>
                    setGuideForm({ ...guideForm, reading_time_minutes: rt })
                  }
                  contentType="help"
                  label="محتوای متنی راهنما و راه‌حل گام‌به‌گام"
                  minHeight="480px"
                />
              </div>

              {/* Service & Category Configurations */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 pt-4 border-t border-border">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-foreground block">
                    دسته‌بندی راهنما
                  </label>
                  <select
                    value={guideForm.category_slug}
                    onChange={(e) => {
                      const sel = categories.find(
                        (c) => c.slug === e.target.value,
                      )
                      setGuideForm({
                        ...guideForm,
                        category_slug: e.target.value,
                        category_name: sel?.name || '',
                      })
                    }}
                    className="w-full rounded-xl border border-border bg-background px-3 py-2 text-xs focus:outline-hidden"
                  >
                    {categories
                      .filter((c) => c.type === 'help')
                      .map((c) => (
                        <option key={c.id} value={c.slug}>
                          {c.name}
                        </option>
                      ))}
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-foreground block">
                    سرویس مقصد (Target)
                  </label>
                  <select
                    value={guideForm.service_target}
                    onChange={(e) =>
                      setGuideForm({
                        ...guideForm,
                        service_target: e.target.value,
                      })
                    }
                    className="w-full rounded-xl border border-border bg-background px-3 py-2 text-xs focus:outline-hidden"
                  >
                    {services.map((s) => (
                      <option key={s.id} value={s.key}>
                        {s.label}
                      </option>
                    ))}
                    {services.length === 0 && (
                      <option value="general">عمومی (کلیه سرویس‌ها)</option>
                    )}
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-foreground block">
                    سطح دشواری
                  </label>
                  <select
                    value={guideForm.difficulty}
                    onChange={(e) =>
                      setGuideForm({
                        ...guideForm,
                        difficulty: e.target.value,
                      })
                    }
                    className="w-full rounded-xl border border-border bg-background px-3 py-2 text-xs focus:outline-hidden"
                  >
                    <option value="ساده">ساده (مبتدی)</option>
                    <option value="متوسط">متوسط</option>
                    <option value="پیشرفته">پیشرفته (تخصصی)</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-foreground block">
                    محصول مرتبط فروشگاه (CTA)
                  </label>
                  <select
                    value={guideForm.related_product_id}
                    onChange={(e) => {
                      const p = products.find(
                        (prod) => String(prod.id) === e.target.value,
                      )
                      setGuideForm({
                        ...guideForm,
                        related_product_id: e.target.value,
                        related_product_title: p?.title_fa || '',
                        related_product_slug: p?.slug || '',
                        related_product_price: p?.price_toman || 0,
                      })
                    }}
                    className="w-full rounded-xl border border-border bg-background px-3 py-2 text-xs focus:outline-hidden"
                  >
                    <option value="">بدون اتصال به محصول</option>
                    {products.map((p) => (
                      <option key={p.id} value={String(p.id)}>
                        {p.title_fa}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
          ) : (
            /* Guides List View */
            <div className="space-y-4">
              <div className="bg-card border border-border rounded-xl p-3 flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-2 flex-1 min-w-[240px]">
                  <div className="relative flex-1">
                    <Search className="h-4 w-4 absolute right-3 top-2.5 text-muted-foreground" />
                    <input
                      type="text"
                      value={guideSearch}
                      onChange={(e) => setGuideSearch(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && loadGuides()}
                      placeholder="جستجو در راهنماها، ارورها و راه‌حل‌ها..."
                      className="w-full pl-3 pr-9 py-1.5 text-xs rounded-lg border border-border bg-background focus:outline-hidden focus:ring-1 focus:ring-primary"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={loadGuides}
                    className="px-3 py-1.5 bg-muted text-foreground text-xs font-semibold rounded-lg hover:bg-muted/80 transition-colors"
                  >
                    جستجو
                  </button>
                </div>

                <div className="flex items-center gap-2">
                  <select
                    value={guideCategory}
                    onChange={(e) => setGuideCategory(e.target.value)}
                    className="rounded-lg border border-border bg-background px-3 py-1.5 text-xs focus:outline-hidden"
                  >
                    <option value="">همه دسته‌ها</option>
                    {categories
                      .filter((c) => c.type === 'help')
                      .map((c) => (
                        <option key={c.id} value={c.slug}>
                          {c.name}
                        </option>
                      ))}
                  </select>

                  <select
                    value={guideServiceTarget}
                    onChange={(e) => setGuideServiceTarget(e.target.value)}
                    className="rounded-lg border border-border bg-background px-3 py-1.5 text-xs focus:outline-hidden"
                  >
                    <option value="">همه سرویس‌ها</option>
                    {services.map((s) => (
                      <option key={s.id} value={s.key}>
                        {s.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Table */}
              <div className="bg-card border border-border rounded-2xl overflow-hidden shadow-sm">
                <div className="overflow-x-auto">
                  <table className="w-full text-right text-xs">
                    <thead>
                      <tr className="border-b border-border bg-muted/40 text-muted-foreground font-semibold">
                        <th className="p-3.5">عنوان راهنما</th>
                        <th className="p-3.5">سرویس هدف</th>
                        <th className="p-3.5">دشواری</th>
                        <th className="p-3.5">بازخورد مفید (👍 / 👎)</th>
                        <th className="p-3.5">بازدید</th>
                        <th className="p-3.5 text-left">عملیات</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border/60">
                      {guides.map((g) => (
                        <tr
                          key={g.id}
                          className="hover:bg-muted/30 transition-colors"
                        >
                          <td className="p-3.5">
                            <div className="space-y-0.5">
                              <span className="font-bold text-foreground block">
                                {g.title}
                              </span>
                              <span className="text-[11px] text-muted-foreground font-mono dir-ltr text-right block">
                                /help/{g.slug}
                              </span>
                            </div>
                          </td>
                          <td className="p-3.5">
                            <span className="bg-muted px-2 py-0.5 rounded-md text-[11px] font-semibold text-foreground">
                              {g.service_target.toUpperCase()}
                            </span>
                          </td>
                          <td className="p-3.5">
                            <span className="text-muted-foreground">
                              {g.difficulty}
                            </span>
                          </td>
                          <td className="p-3.5">
                            <div className="flex items-center gap-3 text-[11px]">
                              <span className="text-emerald-600 font-semibold flex items-center gap-1">
                                <ThumbsUp className="h-3 w-3" />
                                {g.helpful_yes}
                              </span>
                              <span className="text-rose-500 font-semibold flex items-center gap-1">
                                <ThumbsDown className="h-3 w-3" />
                                {g.helpful_no}
                              </span>
                            </div>
                          </td>
                          <td className="p-3.5">
                            <span className="text-muted-foreground">
                              {g.view_count.toLocaleString()}
                            </span>
                          </td>
                          <td className="p-3.5 text-left">
                            <div className="flex items-center justify-end gap-1.5">
                              <a
                                href={`/help/${g.slug}`}
                                target="_blank"
                                rel="noreferrer"
                                className="p-1.5 text-muted-foreground hover:text-blue-600 rounded-lg hover:bg-muted"
                                title="مشاهده"
                              >
                                <ExternalLink className="h-4 w-4" />
                              </a>
                              <button
                                type="button"
                                onClick={() => handleEditGuide(g.id)}
                                className="p-1.5 text-muted-foreground hover:text-foreground rounded-lg hover:bg-muted"
                                title="ویرایش"
                              >
                                <Edit2 className="h-4 w-4" />
                              </button>
                              <button
                                type="button"
                                onClick={() => handleDeleteGuide(g.id)}
                                className="p-1.5 text-muted-foreground hover:text-rose-500 rounded-lg hover:bg-muted"
                                title="حذف"
                              >
                                <Trash2 className="h-4 w-4" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ----------------- SUB-TAB 3: CATEGORIES ----------------- */}
      {activeSubTab === 'categories' && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {categories.map((cat) => (
              <div
                key={cat.id}
                className="bg-card border border-border rounded-xl p-4 shadow-xs flex items-start justify-between gap-3"
              >
                <div className="flex items-start gap-3">
                  <div className="p-2.5 rounded-xl bg-blue-500/10 text-primary mt-0.5">
                    <BookOpen className="h-5 w-5" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="font-bold text-sm text-foreground">
                        {cat.name}
                      </h3>
                      <span className="text-[10px] bg-muted px-2 py-0.5 rounded-full text-muted-foreground">
                        {cat.type === 'blog' ? 'وبلاگ' : 'پایگاه دانش'}
                      </span>
                    </div>
                    <span className="text-xs text-muted-foreground font-mono block dir-ltr text-right mt-0.5">
                      {cat.slug}
                    </span>
                    {cat.description && (
                      <p className="text-xs text-muted-foreground mt-1.5 line-clamp-2">
                        {cat.description}
                      </p>
                    )}
                    <div className="flex items-center gap-3 text-[11px] text-muted-foreground mt-2">
                      <span>ترتیب: {cat.sort_order}</span>
                      <span>•</span>
                      <span>مقالات موجود: {cat.article_count || 0} مورد</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => {
                      setCategoryForm({
                        id: cat.id,
                        name: cat.name,
                        slug: cat.slug,
                        type: cat.type,
                        icon: cat.icon || 'BookOpen',
                        description: cat.description || '',
                        sort_order: cat.sort_order,
                      })
                      setIsCategoryModalOpen(true)
                    }}
                    className="p-1.5 text-muted-foreground hover:text-foreground rounded-lg hover:bg-muted"
                  >
                    <Edit2 className="h-4 w-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDeleteCategory(cat.id)}
                    className="p-1.5 text-muted-foreground hover:text-rose-500 rounded-lg hover:bg-muted"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ----------------- SUB-TAB 4: COMMENTS ----------------- */}
      {activeSubTab === 'comments' && (
        <div className="space-y-4">
          <div className="bg-card border border-border rounded-2xl overflow-hidden shadow-sm">
            <div className="divide-y divide-border/60">
              {comments.map((c) => (
                <div key={c.id} className="p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-sm text-foreground">
                        {c.author_name}
                      </span>
                      <span
                        className={`text-[10px] px-2 py-0.5 rounded-full font-semibold ${
                          c.status === 'approved'
                            ? 'bg-emerald-500/10 text-emerald-600'
                            : c.status === 'rejected'
                              ? 'bg-rose-500/10 text-rose-500'
                              : 'bg-amber-500/10 text-amber-600'
                        }`}
                      >
                        {c.status === 'approved'
                          ? 'تایید شده'
                          : c.status === 'rejected'
                            ? 'رد شده'
                            : 'در انتظار بررسی'}
                      </span>
                    </div>
                    <span className="text-xs text-muted-foreground">
                      {new Date(c.created_at).toLocaleDateString('fa-IR')}
                    </span>
                  </div>

                  <p className="text-xs md:text-sm text-slate-700 dark:text-slate-300 leading-relaxed bg-muted/30 p-3 rounded-xl border border-border/50">
                    {c.content}
                  </p>

                  {/* Admin Reply Section */}
                  {c.admin_reply && (
                    <div className="mr-4 p-3 rounded-xl bg-blue-50/50 dark:bg-blue-950/20 border-r-2 border-primary text-xs space-y-1">
                      <span className="font-semibold text-primary block">
                        پاسخ مدیریت:
                      </span>
                      <p className="text-slate-600 dark:text-slate-300">
                        {c.admin_reply}
                      </p>
                    </div>
                  )}

                  {/* Comment Action Buttons */}
                  <div className="flex items-center justify-between gap-2 pt-1">
                    <div className="flex items-center gap-1.5">
                      {c.status !== 'approved' && (
                        <button
                          type="button"
                          onClick={() =>
                            handleUpdateCommentStatus(c.id, 'approved')
                          }
                          className="px-3 py-1 bg-emerald-600 text-white rounded-lg text-xs font-medium hover:bg-emerald-700"
                        >
                          تایید دیدگاه
                        </button>
                      )}
                      {c.status !== 'rejected' && (
                        <button
                          type="button"
                          onClick={() =>
                            handleUpdateCommentStatus(c.id, 'rejected')
                          }
                          className="px-3 py-1 bg-muted hover:bg-rose-500 hover:text-white rounded-lg text-xs font-medium transition-colors"
                        >
                          رد دیدگاه
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={() => handleDeleteComment(c.id)}
                        className="px-3 py-1 text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/30 rounded-lg text-xs font-medium"
                      >
                        حذف
                      </button>
                    </div>

                    {/* Inline Reply Input */}
                    <div className="flex items-center gap-1.5 flex-1 max-w-md">
                      <input
                        type="text"
                        value={commentReplyMap[c.id] || ''}
                        onChange={(e) =>
                          setCommentReplyMap({
                            ...commentReplyMap,
                            [c.id]: e.target.value,
                          })
                        }
                        placeholder="ثبت پاسخ به این نظر..."
                        className="flex-1 rounded-lg border border-border bg-background px-2.5 py-1 text-xs focus:outline-hidden"
                      />
                      <button
                        type="button"
                        onClick={() => {
                          if (commentReplyMap[c.id]) {
                            handleUpdateCommentStatus(
                              c.id,
                              'approved',
                              commentReplyMap[c.id],
                            )
                            setCommentReplyMap({
                              ...commentReplyMap,
                              [c.id]: '',
                            })
                          }
                        }}
                        className="px-3 py-1 bg-primary text-primary-foreground text-xs font-semibold rounded-lg hover:opacity-90"
                      >
                        ارسال پاسخ
                      </button>
                    </div>
                  </div>
                </div>
              ))}

              {comments.length === 0 && (
                <div className="p-8 text-center text-muted-foreground text-xs">
                  دیدگاهی برای نمایش وجود ندارد.
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ----------------- SUB-TAB 5: DYNAMIC TEMPLATES ----------------- */}
      {activeSubTab === 'templates' && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {templates.map((tmpl) => (
              <div
                key={tmpl.id}
                className="bg-card border border-border rounded-2xl p-5 shadow-xs flex flex-col justify-between space-y-3"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-3">
                    <div className="p-2.5 rounded-xl bg-blue-500/10 text-primary shrink-0 mt-0.5">
                      <Sparkles className="h-5 w-5" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="font-bold text-sm text-foreground">
                          {tmpl.title}
                        </h3>
                        <span className="text-[10px] bg-muted px-2 py-0.5 rounded-full text-muted-foreground font-semibold">
                          {tmpl.type === 'help'
                            ? 'پایگاه دانش'
                            : tmpl.type === 'blog'
                              ? 'وبلاگ'
                              : 'عمومی'}
                        </span>
                      </div>
                      <span className="text-xs text-muted-foreground font-mono block dir-ltr text-right mt-0.5">
                        {tmpl.slug}
                      </span>
                      {tmpl.description && (
                        <p className="text-xs text-muted-foreground mt-1 line-clamp-2 leading-relaxed">
                          {tmpl.description}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      type="button"
                      onClick={() => {
                        setTemplateForm({
                          id: tmpl.id,
                          title: tmpl.title,
                          slug: tmpl.slug,
                          type: tmpl.type,
                          icon: tmpl.icon || 'FileText',
                          description: tmpl.description || '',
                          template_content: tmpl.template_content,
                          sort_order: tmpl.sort_order,
                        })
                        setIsTemplateModalOpen(true)
                      }}
                      className="p-1.5 text-muted-foreground hover:text-foreground rounded-lg hover:bg-muted"
                      title="ویرایش قالب"
                    >
                      <Edit2 className="h-4 w-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDeleteTemplate(tmpl.id)}
                      className="p-1.5 text-muted-foreground hover:text-rose-500 rounded-lg hover:bg-muted"
                      title="حذف قالب"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>

                <div className="bg-muted/30 border border-border/50 rounded-xl p-3 text-xs font-mono text-muted-foreground dir-ltr text-left line-clamp-3 overflow-hidden">
                  {tmpl.template_content.slice(0, 160)}...
                </div>
              </div>
            ))}

            {templates.length === 0 && (
              <div className="col-span-2 p-8 text-center text-muted-foreground text-xs bg-card border border-border rounded-2xl">
                هیچ قالب نگارشی در دیتابیس ثبت نشده است. روی دکمه «قالب نگارش
                جدید» کلیک کنید.
              </div>
            )}
          </div>
        </div>
      )}

      {/* ----------------- CATEGORY CREATE/EDIT MODAL ----------------- */}
      {isCategoryModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4">
          <div className="w-full max-w-md bg-card border border-border rounded-2xl p-6 shadow-xl text-right dir-rtl space-y-4">
            <h3 className="font-bold text-base text-foreground">
              {categoryForm.id ? 'ویرایش دسته‌بندی' : 'افزودن دسته‌بندی جدید'}
            </h3>
            <div className="space-y-3">
              <div>
                <label className="text-xs font-medium text-muted-foreground block mb-1">
                  نام دسته *
                </label>
                <input
                  type="text"
                  value={categoryForm.name}
                  onChange={(e) =>
                    setCategoryForm({ ...categoryForm, name: e.target.value })
                  }
                  placeholder="مثلاً: اخبار و رویدادهای AI"
                  className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm focus:outline-hidden"
                />
              </div>

              <div>
                <label className="text-xs font-medium text-muted-foreground block mb-1">
                  پیوند یکتا (Slug) *
                </label>
                <input
                  type="text"
                  value={categoryForm.slug}
                  onChange={(e) =>
                    setCategoryForm({ ...categoryForm, slug: e.target.value })
                  }
                  placeholder="ai-news"
                  dir="ltr"
                  className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm font-mono text-left focus:outline-hidden"
                />
              </div>

              <div>
                <label className="text-xs font-medium text-muted-foreground block mb-1">
                  نوع دسته
                </label>
                <select
                  value={categoryForm.type}
                  onChange={(e) =>
                    setCategoryForm({
                      ...categoryForm,
                      type: e.target.value as any,
                    })
                  }
                  className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm focus:outline-hidden"
                >
                  <option value="blog">وبلاگ و اخبار</option>
                  <option value="help">پایگاه دانش و راهنماها</option>
                  <option value="product">
                    محصولات فروشگاه (Product Catalog)
                  </option>
                </select>
              </div>

              <div>
                <label className="text-xs font-medium text-muted-foreground block mb-1">
                  توضیحات کوتاه
                </label>
                <textarea
                  rows={2}
                  value={categoryForm.description}
                  onChange={(e) =>
                    setCategoryForm({
                      ...categoryForm,
                      description: e.target.value,
                    })
                  }
                  placeholder="توضیح کوتاه درباره این بخش..."
                  className="w-full rounded-xl border border-border bg-background p-2.5 text-sm focus:outline-hidden"
                />
              </div>

              <div>
                <label className="text-xs font-medium text-muted-foreground block mb-1">
                  ترتیب نمایش (Sort Order)
                </label>
                <input
                  type="number"
                  value={categoryForm.sort_order}
                  onChange={(e) =>
                    setCategoryForm({
                      ...categoryForm,
                      sort_order: Number(e.target.value),
                    })
                  }
                  className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm focus:outline-hidden"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-border">
              <button
                type="button"
                onClick={() => setIsCategoryModalOpen(false)}
                className="px-4 py-2 rounded-xl text-xs font-medium text-muted-foreground hover:bg-muted"
              >
                انصراف
              </button>
              <button
                type="button"
                onClick={handleSaveCategory}
                className="px-5 py-2 bg-primary text-primary-foreground text-xs font-semibold rounded-xl hover:opacity-90"
              >
                ذخیره دسته‌بندی
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ----------------- TEMPLATE CREATE/EDIT MODAL ----------------- */}
      {isTemplateModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4">
          <div className="w-full max-w-2xl bg-card border border-border rounded-2xl p-6 shadow-xl text-right dir-rtl space-y-4 max-h-[90vh] overflow-y-auto">
            <h3 className="font-bold text-base text-foreground">
              {templateForm.id
                ? 'ویرایش قالب آماده نگارش'
                : 'افزودن قالب آماده جدید به دیتابیس'}
            </h3>
            <div className="space-y-3">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-medium text-muted-foreground block mb-1">
                    عنوان قالب *
                  </label>
                  <input
                    type="text"
                    value={templateForm.title}
                    onChange={(e) =>
                      setTemplateForm({
                        ...templateForm,
                        title: e.target.value,
                      })
                    }
                    placeholder="مثلاً: قالب آموزش گام‌به‌گام"
                    className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm focus:outline-hidden"
                  />
                </div>

                <div>
                  <label className="text-xs font-medium text-muted-foreground block mb-1">
                    پیوند یکتا (Slug) *
                  </label>
                  <input
                    type="text"
                    value={templateForm.slug}
                    onChange={(e) =>
                      setTemplateForm({ ...templateForm, slug: e.target.value })
                    }
                    placeholder="tutorial-template"
                    dir="ltr"
                    className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm font-mono text-left focus:outline-hidden"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-medium text-muted-foreground block mb-1">
                    بخش مورد استفاده
                  </label>
                  <select
                    value={templateForm.type}
                    onChange={(e) =>
                      setTemplateForm({
                        ...templateForm,
                        type: e.target.value as any,
                      })
                    }
                    className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm focus:outline-hidden"
                  >
                    <option value="all">
                      عمومی (هم وبلاگ و هم پایگاه دانش)
                    </option>
                    <option value="blog">مخصوص مقالات وبلاگ</option>
                    <option value="help">مخصوص راهنماهای پایگاه دانش</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs font-medium text-muted-foreground block mb-1">
                    ترتیب نمایش
                  </label>
                  <input
                    type="number"
                    value={templateForm.sort_order}
                    onChange={(e) =>
                      setTemplateForm({
                        ...templateForm,
                        sort_order: Number(e.target.value),
                      })
                    }
                    className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm focus:outline-hidden"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-medium text-muted-foreground block mb-1">
                  توضیحات کوتاه
                </label>
                <input
                  type="text"
                  value={templateForm.description}
                  onChange={(e) =>
                    setTemplateForm({
                      ...templateForm,
                      description: e.target.value,
                    })
                  }
                  placeholder="توضیح کوتاه درباره هدف این قالب..."
                  className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm focus:outline-hidden"
                />
              </div>

              <div>
                <label className="text-xs font-medium text-muted-foreground block mb-1">
                  متن و ساختار قالب (Markdown استاندارد) *
                </label>
                <textarea
                  rows={8}
                  value={templateForm.template_content}
                  onChange={(e) =>
                    setTemplateForm({
                      ...templateForm,
                      template_content: e.target.value,
                    })
                  }
                  placeholder="## عنوان بخش اول&#10;&#10;متن پیش‌فرض قالب..."
                  className="w-full rounded-xl border border-border bg-background p-3 font-mono text-xs focus:outline-hidden leading-relaxed"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-border">
              <button
                type="button"
                onClick={() => setIsTemplateModalOpen(false)}
                className="px-4 py-2 rounded-xl text-xs font-medium text-muted-foreground hover:bg-muted"
              >
                انصراف
              </button>
              <button
                type="button"
                onClick={handleSaveTemplate}
                className="px-5 py-2 bg-primary text-primary-foreground text-xs font-semibold rounded-xl hover:opacity-90"
              >
                ذخیره قالب
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
