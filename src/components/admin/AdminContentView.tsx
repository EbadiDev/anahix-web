import {
  ArrowRight,
  BookOpen,
  Check,
  Clock,
  Edit2,
  ExternalLink,
  Eye,
  FileText,
  Heart,
  HelpCircle,
  Layers,
  Loader2,
  MessageSquare,
  Plus,
  RefreshCw,
  Sparkles,
  Tag,
  ThumbsDown,
  ThumbsUp,
  Trash2,
  Upload,
  User,
  X,
} from 'lucide-react'
import type React from 'react'
import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
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
import { ConfirmModal } from '../vibefarsi/ConfirmModal'
import { ModalCloseButton } from '../vibefarsi/ModalCloseButton'
import { useNotification } from '../vibefarsi/NotificationContext'
import { SearchInput } from '../vibefarsi/SearchInput'
import { ToggleSwitch } from '../vibefarsi/ToggleSwitch'

type ContentSubTab =
  | 'articles'
  | 'guides'
  | 'categories'
  | 'templates'
  | 'comments'

export const AdminContentView: React.FC = () => {
  const {
    success: notifySuccess,
    error: notifyError,
    info: notifyInfo,
  } = useNotification()
  const [activeSubTab, setActiveSubTab] = useState<ContentSubTab>('articles')
  const [categories, setCategories] = useState<ContentCategory[]>([])
  const [services, setServices] = useState<ServiceTarget[]>([])
  const [templates, setTemplates] = useState<ContentTemplate[]>([])
  const [confirmModal, setConfirmModal] = useState<{
    isOpen: boolean
    title: string
    message: string
    loading: boolean
    onConfirm: () => Promise<void>
  }>({
    isOpen: false,
    title: '',
    message: '',
    loading: false,
    onConfirm: async () => {},
  })
  const [products, setProducts] = useState<Product[]>([])
  const [isLoading, setIsLoading] = useState(false)

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

  // Upload & Branding states
  const [siteLogoUrl, setSiteLogoUrl] = useState<string>('')
  const [isUploadingAuthorAvatar, setIsUploadingAuthorAvatar] = useState(false)
  const [isUploadingCoverImage, setIsUploadingCoverImage] = useState(false)
  const [isUploadingGuideAvatar, setIsUploadingGuideAvatar] = useState(false)

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
    author_name: 'تیم پشتیبانی و فنی آناهیکس',
    author_role: 'کارشناس رفع تحریم و شبکه',
    author_avatar: '',
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
  const [commentStatusFilter, setCommentStatusFilter] = useState('')
  const [commentArticleFilter, setCommentArticleFilter] = useState('')
  const [commentSearch, setCommentSearch] = useState('')

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
    if (type === 'success') {
      notifySuccess('عملیات موفق', text)
    } else {
      notifyError('خطا در عملیات', text)
    }
  }

  // Author & Cover Media Uploader
  const handleUploadAuthorAvatar = async (file: File, isGuide = false) => {
    if (isGuide) setIsUploadingGuideAvatar(true)
    else setIsUploadingAuthorAvatar(true)
    try {
      const resp = await api.uploadMedia(file)
      if (resp?.file_url) {
        if (isGuide) {
          setGuideForm((prev) => ({ ...prev, author_avatar: resp.file_url }))
        } else {
          setArticleForm((prev) => ({ ...prev, author_avatar: resp.file_url }))
        }
        notifySuccess('آپلود موفق تصویر', 'تصویر نویسنده با موفقیت بارگذاری شد')
      }
    } catch (err: any) {
      notifyError('خطا در آپلود تصویر', err.message || 'مشکل در ارتباط با سرور')
    } finally {
      if (isGuide) setIsUploadingGuideAvatar(false)
      else setIsUploadingAuthorAvatar(false)
    }
  }

  const handleUploadCoverImage = async (file: File) => {
    setIsUploadingCoverImage(true)
    try {
      const resp = await api.uploadMedia(file)
      if (resp?.file_url) {
        setArticleForm((prev) => ({ ...prev, cover_image: resp.file_url }))
        notifySuccess('آپلود موفق تصویر', 'تصویر شاخص با موفقیت بارگذاری شد')
      }
    } catch (err: any) {
      notifyError('خطا در آپلود تصویر', err.message || 'مشکل در ارتباط با سرور')
    } finally {
      setIsUploadingCoverImage(false)
    }
  }

  // Load Categories & Products on mount
  useEffect(() => {
    loadCategories()
    loadProducts()
    loadServices()
    loadTemplates()
    api
      .getThemeSettings()
      .then((st) => {
        if (st?.site_logo_url) setSiteLogoUrl(st.site_logo_url)
      })
      .catch(() => {})
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
  }, [
    activeSubTab,
    articleCategory,
    guideCategory,
    guideServiceTarget,
    commentStatusFilter,
    commentArticleFilter,
  ])

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
      const data = await api.getAdminArticleComments(
        commentArticleFilter || undefined,
        commentStatusFilter || undefined,
      )
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

  const handleDeleteArticle = (id: string) => {
    setConfirmModal({
      isOpen: true,
      title: 'حذف مقاله وبلاگ',
      message:
        'آیا از حذف این مقاله آموزشی و کلیه پیوندهای سئوی آن اطمینان دارید؟ این عملیات غیرقابل بازگشت است.',
      loading: false,
      onConfirm: async () => {
        setConfirmModal((prev) => ({ ...prev, loading: true }))
        try {
          await api.deleteAdminArticle(id)
          showToast('مقاله با موفقیت حذف شد')
          setConfirmModal((prev) => ({
            ...prev,
            isOpen: false,
            loading: false,
          }))
          loadArticles()
        } catch (e: any) {
          showToast(e.message || 'خطا در حذف مقاله', 'error')
          setConfirmModal((prev) => ({ ...prev, loading: false }))
        }
      },
    })
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
      author_name: 'تیم پشتیبانی و فنی آناهیکس',
      author_role: 'کارشناس رفع تحریم و شبکه',
      author_avatar: '',
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
        author_name: detail.author_name || 'تیم پشتیبانی و فنی آناهیکس',
        author_role: detail.author_role || 'کارشناس رفع تحریم و شبکه',
        author_avatar: detail.author_avatar || '',
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

  const handleDeleteGuide = (id: string) => {
    setConfirmModal({
      isOpen: true,
      title: 'حذف راهنمای پایگاه دانش',
      message:
        'آیا از حذف این راهنمای حل ارور و تحریم اطمینان دارید؟ این اقدام از پایگاه دانش حذف خواهد شد.',
      loading: false,
      onConfirm: async () => {
        setConfirmModal((prev) => ({ ...prev, loading: true }))
        try {
          await api.deleteAdminHelpGuide(id)
          showToast('راهنما با موفقیت حذف شد')
          setConfirmModal((prev) => ({
            ...prev,
            isOpen: false,
            loading: false,
          }))
          loadGuides()
        } catch (e: any) {
          showToast(e.message || 'خطا در حذف راهنما', 'error')
          setConfirmModal((prev) => ({ ...prev, loading: false }))
        }
      },
    })
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

  const handleDeleteComment = (id: string) => {
    setConfirmModal({
      isOpen: true,
      title: 'حذف دیدگاه کاربر',
      message: 'آیا از حذف کامل این دیدگاه و نظرات زیرمجموعه آن اطمینان دارید؟',
      loading: false,
      onConfirm: async () => {
        setConfirmModal((prev) => ({ ...prev, loading: true }))
        try {
          await api.deleteAdminComment(id)
          showToast('دیدگاه با موفقیت حذف شد')
          setConfirmModal((prev) => ({
            ...prev,
            isOpen: false,
            loading: false,
          }))
          loadComments()
        } catch (e: any) {
          showToast(e.message || 'خطا در حذف دیدگاه', 'error')
          setConfirmModal((prev) => ({ ...prev, loading: false }))
        }
      },
    })
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

  const handleDeleteCategory = (id: string) => {
    setConfirmModal({
      isOpen: true,
      title: 'حذف دسته‌بندی محتوا',
      message:
        'آیا از حذف این دسته‌بندی اطمینان دارید؟ مقالات مربوطه به دسته عمومی منتقل خواهند شد.',
      loading: false,
      onConfirm: async () => {
        setConfirmModal((prev) => ({ ...prev, loading: true }))
        try {
          await api.deleteAdminContentCategory(id)
          showToast('دسته‌بندی با موفقیت حذف شد')
          setConfirmModal((prev) => ({
            ...prev,
            isOpen: false,
            loading: false,
          }))
          loadCategories()
        } catch (e: any) {
          showToast(e.message || 'خطا در حذف دسته', 'error')
          setConfirmModal((prev) => ({ ...prev, loading: false }))
        }
      },
    })
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

  const handleDeleteTemplate = (id: string) => {
    setConfirmModal({
      isOpen: true,
      title: 'حذف قالب آماده',
      message: 'آیا از حذف این قالب متنی محتوا از دیتابیس اطمینان دارید؟',
      loading: false,
      onConfirm: async () => {
        setConfirmModal((prev) => ({ ...prev, loading: true }))
        try {
          await api.deleteAdminContentTemplate(id)
          showToast('قالب با موفقیت حذف شد')
          setConfirmModal((prev) => ({
            ...prev,
            isOpen: false,
            loading: false,
          }))
          loadTemplates()
        } catch (e: any) {
          showToast(e.message || 'خطا در حذف قالب', 'error')
          setConfirmModal((prev) => ({ ...prev, loading: false }))
        }
      },
    })
  }

  return (
    <div className="space-y-6 text-right dir-rtl">
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
                className="h-9 sm:h-10 px-4 sm:px-5 rounded-control bg-primary hover:bg-primary-hover text-primary-foreground font-black text-xs duration-motion active:scale-[0.98] shadow-control flex items-center justify-center gap-2 cursor-pointer"
              >
                <Plus className="h-4 w-4" />
                <span>مقاله جدید</span>
              </button>
            )}

            {activeSubTab === 'guides' && !isEditingGuide && (
              <button
                type="button"
                onClick={handleOpenNewGuide}
                className="h-9 sm:h-10 px-4 sm:px-5 rounded-control bg-primary hover:bg-primary-hover text-primary-foreground font-black text-xs duration-motion active:scale-[0.98] shadow-control flex items-center justify-center gap-2 cursor-pointer"
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
                className="h-9 sm:h-10 px-4 sm:px-5 rounded-control bg-primary hover:bg-primary-hover text-primary-foreground font-black text-xs duration-motion active:scale-[0.98] shadow-control flex items-center justify-center gap-2 cursor-pointer"
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
                className="h-9 sm:h-10 px-4 sm:px-5 rounded-control bg-primary hover:bg-primary-hover text-primary-foreground font-black text-xs duration-motion active:scale-[0.98] shadow-control flex items-center justify-center gap-2 cursor-pointer"
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
                    className="h-9 sm:h-10 px-3.5 sm:px-4 rounded-control border border-border/60 bg-secondary/80 hover:bg-muted text-foreground font-bold text-xs shadow-control duration-motion active:scale-[0.98] cursor-pointer flex items-center justify-center"
                  >
                    انصراف
                  </button>
                  <button
                    type="button"
                    onClick={handleSaveArticle}
                    disabled={isLoading}
                    className="h-9 sm:h-10 px-4 sm:px-5 rounded-control bg-primary hover:bg-primary-hover text-primary-foreground font-black text-xs duration-motion active:scale-[0.98] shadow-control flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
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
                  <label className="text-xs font-bold text-foreground block">
                    عنوان مقاله (H1) *
                  </label>
                  <input
                    type="text"
                    value={articleForm.title}
                    onChange={(e) =>
                      setArticleForm((prev) => ({
                        ...prev,
                        title: e.target.value,
                      }))
                    }
                    placeholder="مثلاً: راهنمای خرید جمینای ادونسد در ایران بدون ریسک"
                    className="w-full h-10 px-3.5 rounded-field bg-muted/20 border border-border/60 text-foreground text-xs outline-none focus:border-brand focus:ring-1 focus:ring-brand/30 transition-all font-sans font-medium"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-foreground block">
                    پیوند یکتا (Slug برای URL سئو) *
                  </label>
                  <input
                    type="text"
                    value={articleForm.slug}
                    onChange={(e) =>
                      setArticleForm((prev) => ({
                        ...prev,
                        slug: e.target.value,
                      }))
                    }
                    placeholder="how-to-buy-gemini-advanced"
                    dir="ltr"
                    className="w-full h-10 px-3.5 rounded-field bg-muted/20 border border-border/60 text-foreground text-xs outline-none focus:border-brand focus:ring-1 focus:ring-brand/30 transition-all text-left font-mono font-latin"
                  />
                </div>
              </div>

              {/* Excerpt */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-foreground block">
                  خلاصه مقاله (برای کارت‌ها و متا دیسکریپشن گوگل)
                </label>
                <textarea
                  rows={2}
                  value={articleForm.excerpt}
                  onChange={(e) =>
                    setArticleForm((prev) => ({
                      ...prev,
                      excerpt: e.target.value,
                    }))
                  }
                  placeholder="توضیح دو یا سه جمله‌ای ترغیب‌کننده برای سرچ گوگل..."
                  className="w-full p-3.5 rounded-field bg-muted/20 border border-border/60 text-foreground text-xs outline-none focus:border-brand focus:ring-1 focus:ring-brand/30 transition-all font-sans leading-relaxed"
                />
              </div>

              {/* Rich Content Editor */}
              <div className="space-y-2">
                <RichContentEditor
                  value={articleForm.content}
                  onChange={(val) =>
                    setArticleForm((prev) => ({ ...prev, content: val }))
                  }
                  onReadingTimeChange={(rt) =>
                    setArticleForm((prev) =>
                      prev.reading_time_minutes === rt
                        ? prev
                        : { ...prev, reading_time_minutes: rt },
                    )
                  }
                  contentType="blog"
                  label="محتوای متنی مقاله (Markdown حرفه‌ای)"
                  minHeight="520px"
                />
              </div>

              {/* Meta & Configuration Grid */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4 border-t border-border">
                {/* Category Selection */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-foreground block">
                    دسته‌بندی مقاله
                  </label>
                  <select
                    value={articleForm.category_slug}
                    onChange={(e) => {
                      const sel = categories.find(
                        (c) => c.slug === e.target.value,
                      )
                      setArticleForm((prev) => ({
                        ...prev,
                        category_slug: e.target.value,
                        category_name: sel?.name || '',
                      }))
                    }}
                    className="w-full h-10 px-3.5 rounded-field bg-muted/20 border border-border/60 text-foreground text-xs outline-none focus:border-brand focus:ring-1 focus:ring-brand/30 transition-all font-sans cursor-pointer"
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

                {/* Cover Image URL & Direct Upload with Live Preview */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-semibold text-foreground block">
                      تصویر شاخص مقاله (Cover Image)
                    </label>
                    <label className="text-[11px] font-bold text-brand hover:underline cursor-pointer flex items-center gap-1">
                      <Upload className="w-3 h-3" />
                      <span>
                        {isUploadingCoverImage
                          ? 'در حال آپلود...'
                          : 'آپلود مستقیم فایل'}
                      </span>
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        disabled={isUploadingCoverImage}
                        onChange={(e) => {
                          const f = e.target.files?.[0]
                          if (f) handleUploadCoverImage(f)
                        }}
                      />
                    </label>
                  </div>
                  <div className="flex items-center gap-2">
                    {articleForm.cover_image && (
                      <div className="relative w-12 h-10 rounded-xl overflow-hidden border border-border/80 bg-muted/40 shrink-0 shadow-xs group">
                        <img
                          src={articleForm.cover_image}
                          alt="تصویر شاخص"
                          className="w-full h-full object-cover"
                        />
                        <button
                          type="button"
                          onClick={() =>
                            setArticleForm({
                              ...articleForm,
                              cover_image: '',
                            })
                          }
                          className="absolute inset-0 bg-black/60 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                          title="حذف تصویر شاخص"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    )}
                    <input
                      type="text"
                      value={articleForm.cover_image}
                      onChange={(e) =>
                        setArticleForm({
                          ...articleForm,
                          cover_image: e.target.value,
                        })
                      }
                      placeholder="https://... یا آپلود مستقیم از دکمه بالا"
                      dir="ltr"
                      className="flex-1 rounded-xl border border-border bg-background px-3 py-2 text-xs focus:outline-hidden focus:ring-2 focus:ring-primary/40 font-mono text-left font-latin"
                    />
                  </div>
                </div>

                {/* Related Product CTA Integration */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-foreground flex items-center justify-between">
                    <span>محصول مرتبط جهت خرید (CTA)</span>
                    <Sparkles className="h-3 w-3 text-blue-500" />
                  </label>
                  <select
                    value={articleForm.related_product_id}
                    onChange={(e) => {
                      const p = products.find(
                        (prod) => String(prod.id) === e.target.value,
                      )
                      setArticleForm((prev) => ({
                        ...prev,
                        related_product_id: e.target.value,
                        related_product_title: p?.title_fa || '',
                        related_product_slug: p?.slug || '',
                        related_product_price: p?.price_toman || 0,
                      }))
                    }}
                    className="w-full h-10 px-3.5 rounded-field bg-muted/20 border border-border/60 text-foreground text-xs outline-none focus:border-brand focus:ring-1 focus:ring-brand/30 transition-all font-sans cursor-pointer"
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

              {/* Author Profile Information Card with Direct Upload & Site Logo Fallback */}
              <div className="rounded-2xl border border-border/80 bg-muted/20 p-4 sm:p-5 space-y-4">
                <div className="flex items-center justify-between border-b border-border/60 pb-3">
                  <div className="flex items-center gap-2">
                    <User className="h-4 w-4 text-brand" />
                    <span className="text-xs font-bold text-foreground">
                      مشخصات و تصویر نویسنده مقاله
                    </span>
                  </div>
                  <span className="text-[11px] text-muted-foreground font-medium">
                    {articleForm.author_avatar
                      ? 'تصویر اختصاصی تنظیم شده'
                      : 'پیش‌فرض: لوگوی سایت از تنظیمات ادمین'}
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-center">
                  {/* Author Avatar Preview & Upload Action */}
                  <div className="flex items-center gap-3">
                    <div className="relative w-14 h-14 rounded-full border-2 border-border/80 overflow-hidden bg-card flex items-center justify-center shrink-0 shadow-sm">
                      {articleForm.author_avatar ? (
                        <img
                          src={articleForm.author_avatar}
                          alt={articleForm.author_name}
                          className="w-full h-full object-cover"
                        />
                      ) : siteLogoUrl ? (
                        <img
                          src={siteLogoUrl}
                          alt="لوگوی پیش‌فرض سایت"
                          className="w-full h-full object-contain p-1.5"
                        />
                      ) : (
                        <div className="w-full h-full bg-brand/10 text-brand flex items-center justify-center font-bold text-base">
                          {articleForm.author_name?.[0] || 'A'}
                        </div>
                      )}
                      {isUploadingAuthorAvatar && (
                        <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                          <Loader2 className="w-5 h-5 animate-spin text-white" />
                        </div>
                      )}
                    </div>

                    <div className="space-y-1.5 flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <label className="h-8 px-3 rounded-xl bg-secondary hover:bg-muted border border-border/60 text-foreground font-bold text-xs flex items-center gap-1.5 cursor-pointer shadow-xs transition-all active:scale-[0.98]">
                          <Upload className="w-3.5 h-3.5 text-brand" />
                          <span>
                            {articleForm.author_avatar
                              ? 'تغییر تصویر'
                              : 'آپلود تصویر پروفایل'}
                          </span>
                          <input
                            type="file"
                            accept="image/*"
                            className="hidden"
                            disabled={isUploadingAuthorAvatar}
                            onChange={(e) => {
                              const f = e.target.files?.[0]
                              if (f) handleUploadAuthorAvatar(f, false)
                            }}
                          />
                        </label>

                        {articleForm.author_avatar && (
                          <button
                            type="button"
                            onClick={() =>
                              setArticleForm({
                                ...articleForm,
                                author_avatar: '',
                              })
                            }
                            className="h-8 px-2.5 rounded-xl text-xs font-bold text-destructive hover:bg-destructive/10 border border-destructive/20 cursor-pointer transition-all active:scale-[0.98]"
                            title="بازنشانی به لوگوی پیش‌فرض سایت"
                          >
                            لوگوی سایت
                          </button>
                        )}
                      </div>
                      <p className="text-[10px] text-muted-foreground truncate">
                        {articleForm.author_avatar
                          ? 'تصویر اختصاصی نویسنده فعال است'
                          : 'در صورت عدم آپلود، لوگوی سایت به عنوان پیش‌فرض قرار می‌گیرد'}
                      </p>
                    </div>
                  </div>

                  {/* Author Name */}
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-foreground block">
                      نام و نام‌خانوادگی نویسنده *
                    </label>
                    <input
                      type="text"
                      value={articleForm.author_name}
                      onChange={(e) =>
                        setArticleForm({
                          ...articleForm,
                          author_name: e.target.value,
                        })
                      }
                      placeholder="تحریریه آناهیکس"
                      className="w-full h-10 px-3 rounded-xl border border-border/60 bg-background text-foreground text-xs outline-none focus:border-brand"
                    />
                  </div>

                  {/* Author Role */}
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-foreground block">
                      سمت و تخصص نویسنده
                    </label>
                    <input
                      type="text"
                      value={articleForm.author_role}
                      onChange={(e) =>
                        setArticleForm({
                          ...articleForm,
                          author_role: e.target.value,
                        })
                      }
                      placeholder="کارشناس هوش مصنوعی و امنیت"
                      className="w-full h-10 px-3 rounded-xl border border-border/60 bg-background text-foreground text-xs outline-none focus:border-brand"
                    />
                  </div>
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
              <div className="flex flex-wrap items-center gap-6 pt-3 border-t border-border/60">
                <div className="flex items-center gap-2.5">
                  <ToggleSwitch
                    size="sm"
                    checked={Boolean(articleForm.is_published)}
                    onChange={(checked) => {
                      setArticleForm((prev) => ({
                        ...prev,
                        is_published: checked,
                      }))
                      if (checked) {
                        notifySuccess(
                          'وضعیت انتشار عمومی',
                          'مقاله در وضعیت انتشار عمومی تنظیم شد و پس از ذخیره برای کاربران و موتورهای جستجو در دسترس خواهد بود.',
                        )
                      } else {
                        notifyInfo(
                          'حالت پیش‌نویس',
                          'مقاله به حالت پیش‌نویس تغییر یافت و تنها در پنل مدیریت قابل مشاهده است.',
                        )
                      }
                    }}
                  />
                  <span className="text-xs font-bold text-foreground">
                    انتشار عمومی (در دسترس کاربران و موتورهای جستجو)
                  </span>
                </div>

                <div className="flex items-center gap-2.5">
                  <ToggleSwitch
                    size="sm"
                    checked={Boolean(articleForm.is_featured)}
                    onChange={(checked) => {
                      setArticleForm((prev) => ({
                        ...prev,
                        is_featured: checked,
                      }))
                      if (checked) {
                        notifySuccess(
                          'پین مقاله ویژه',
                          'مقاله با موفقیت به عنوان مقاله ویژه در صفحه اصلی وبلاگ پین شد.',
                        )
                      } else {
                        notifyInfo(
                          'حذف از مقالات ویژه',
                          'مقاله از حالت پین ویژه خارج گردید.',
                        )
                      }
                    }}
                  />
                  <span className="text-xs font-bold text-foreground">
                    پین کردن به عنوان مقاله ویژه صفحه اصلی وبلاگ
                  </span>
                </div>
              </div>
            </div>
          ) : (
            /* Articles List View */
            <div className="space-y-4">
              {/* Filter bar */}
              <div className="bg-card border border-border rounded-xl p-3 flex flex-wrap items-center justify-between gap-3">
                <div className="flex-1 min-w-[240px]">
                  <SearchInput
                    value={articleSearch}
                    onChange={setArticleSearch}
                    onSearch={() => loadArticles()}
                    placeholder="جستجو در عنوان، محتوا یا اسلاگ مقالات..."
                    debounceMs={300}
                  />
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
                  <table className="w-full text-center text-xs">
                    <thead>
                      <tr className="border-b border-border bg-muted/40 text-muted-foreground font-semibold select-none">
                        <th className="p-3.5 text-center whitespace-nowrap">
                          تصویر و عنوان مقاله
                        </th>
                        <th className="p-3.5 text-center whitespace-nowrap">
                          دسته‌بندی
                        </th>
                        <th className="p-3.5 text-center whitespace-nowrap">
                          نویسنده
                        </th>
                        <th className="p-3.5 text-center whitespace-nowrap">
                          آمار و تعامل
                        </th>
                        <th className="p-3.5 text-center whitespace-nowrap">
                          وضعیت
                        </th>
                        <th className="p-3.5 text-center whitespace-nowrap">
                          عملیات
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border/60">
                      {articles.map((art) => (
                        <tr
                          key={art.id}
                          className="hover:bg-muted/30 transition-colors"
                        >
                          <td className="p-3.5 text-center max-w-[340px]">
                            <div className="flex items-center justify-center gap-3">
                              <img
                                src={
                                  art.cover_image ||
                                  'https://images.unsplash.com/photo-1677442136019-21780ecad995?auto=format&fit=crop&w=120&q=80'
                                }
                                alt={art.title}
                                className="w-12 h-10 object-cover rounded-xl border border-border/80 shrink-0 shadow-xs"
                              />
                              <div className="space-y-0.5 min-w-0 text-right flex-1">
                                <div className="flex items-center gap-1.5">
                                  <span
                                    className="font-bold text-foreground text-xs sm:text-sm truncate block"
                                    title={art.title}
                                  >
                                    {art.title}
                                  </span>
                                  {art.is_featured && (
                                    <span className="text-[10px] bg-amber-500/10 text-amber-500 border border-amber-500/30 px-1.5 py-0.2 rounded-full font-bold shrink-0 whitespace-nowrap">
                                      ویژه
                                    </span>
                                  )}
                                </div>
                                <span className="text-[11px] text-muted-foreground font-mono font-latin block dir-ltr text-right truncate">
                                  /blog/{art.slug}
                                </span>
                              </div>
                            </div>
                          </td>
                          <td className="p-3.5 text-center whitespace-nowrap">
                            <span
                              className="bg-blue-500/10 text-blue-600 dark:text-blue-400 px-2.5 py-1 rounded-control font-bold text-[11px] whitespace-nowrap truncate max-w-[130px] inline-block shadow-xs"
                              title={art.category_name}
                            >
                              {art.category_name}
                            </span>
                          </td>
                          <td className="p-3.5 text-center whitespace-nowrap">
                            <div className="flex flex-col items-center justify-center gap-1.5 min-w-[70px]">
                              {art.author_avatar ? (
                                <img
                                  src={art.author_avatar}
                                  alt={art.author_name}
                                  className="w-9 h-9 rounded-full object-cover border-2 border-border/80 shadow-xs shrink-0"
                                />
                              ) : siteLogoUrl ? (
                                <img
                                  src={siteLogoUrl}
                                  alt="لوگو"
                                  className="w-9 h-9 rounded-full object-contain p-1 border-2 border-border/80 bg-muted/20 shadow-xs shrink-0"
                                />
                              ) : (
                                <div className="w-9 h-9 rounded-full bg-primary/10 text-primary flex items-center justify-center text-xs font-bold shrink-0">
                                  {art.author_name?.[0] || 'A'}
                                </div>
                              )}
                              <span
                                className="text-[11px] font-bold text-foreground truncate max-w-[85px] block whitespace-nowrap text-center"
                                title={art.author_name}
                              >
                                {art.author_name}
                              </span>
                            </div>
                          </td>
                          <td className="p-3.5 text-center whitespace-nowrap">
                            <div className="flex flex-col items-center justify-center gap-1 text-xs">
                              {/* Reading Time */}
                              <div
                                className="inline-flex items-center gap-1 text-muted-foreground text-[11px] whitespace-nowrap cursor-default"
                                title={`زمان تخمینی مطالعه: ${art.reading_time_minutes} دقیقه`}
                              >
                                <Clock className="h-3 w-3 text-blue-500 shrink-0" />
                                <span>{art.reading_time_minutes} دقیقه</span>
                              </div>

                              {/* Views */}
                              <div
                                className="inline-flex items-center gap-1.5 text-muted-foreground font-mono font-latin text-[11px] hover:text-foreground transition-colors cursor-default"
                                title={`تعداد کل بازدیدها: ${art.view_count.toLocaleString()} بار`}
                              >
                                <Eye className="h-3 w-3 text-slate-400 shrink-0" />
                                <span>{art.view_count.toLocaleString()}</span>
                                <span className="text-[10px] text-muted-foreground/80 font-sans">
                                  بازدید
                                </span>
                              </div>

                              {/* Likes */}
                              <div
                                className="inline-flex items-center gap-1.5 text-rose-500 font-mono font-latin text-[11px] hover:text-rose-600 transition-colors cursor-default"
                                title={`تعداد پسندیدن و لایک: ${(art.like_count || 0).toLocaleString()} کاربر`}
                              >
                                <Heart className="h-3 w-3 fill-rose-500 text-rose-500 shrink-0" />
                                <span>
                                  {(art.like_count || 0).toLocaleString()}
                                </span>
                                <span className="text-[10px] text-rose-500/80 font-sans">
                                  پسندیدن
                                </span>
                              </div>
                            </div>
                          </td>
                          <td className="p-3.5 text-center whitespace-nowrap">
                            {art.is_published ? (
                              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold bg-emerald-500/10 text-emerald-500 border border-emerald-500/30 whitespace-nowrap shadow-xs">
                                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                                منتشر شده
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-medium bg-muted text-muted-foreground border border-border/60 whitespace-nowrap shadow-xs">
                                <span className="h-1.5 w-1.5 rounded-full bg-slate-400" />
                                پیش‌نویس
                              </span>
                            )}
                          </td>
                          <td className="p-3.5 text-center whitespace-nowrap">
                            <div className="flex items-center justify-center gap-1.5">
                              <a
                                href={`/blog/${art.slug}`}
                                target="_blank"
                                rel="noreferrer"
                                className="p-1.5 rounded-control border border-border/60 bg-secondary hover:bg-muted text-foreground hover:text-blue-500 transition-colors cursor-pointer shadow-control"
                                title="مشاهده عمومی در سایت"
                              >
                                <ExternalLink className="w-3.5 h-3.5 text-blue-500" />
                              </a>
                              <button
                                type="button"
                                onClick={() => handleEditArticle(art.id)}
                                className="p-1.5 rounded-control border border-border/60 bg-secondary hover:bg-muted text-foreground hover:text-brand transition-colors cursor-pointer shadow-control"
                                title="ویرایش مقاله"
                              >
                                <Edit2 className="w-3.5 h-3.5 text-brand" />
                              </button>
                              <button
                                type="button"
                                onClick={() => handleDeleteArticle(art.id)}
                                className="p-1.5 rounded-control border border-destructive/20 text-destructive hover:bg-destructive/10 transition-colors cursor-pointer shadow-control"
                                title="حذف مقاله"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
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
                    className="h-9 sm:h-10 px-3.5 sm:px-4 rounded-control border border-border/60 bg-secondary/80 hover:bg-muted text-foreground font-bold text-xs shadow-control duration-motion active:scale-[0.98] cursor-pointer flex items-center justify-center"
                  >
                    انصراف
                  </button>
                  <button
                    type="button"
                    onClick={handleSaveGuide}
                    disabled={isLoading}
                    className="h-9 sm:h-10 px-4 sm:px-5 rounded-control bg-primary hover:bg-primary-hover text-primary-foreground font-black text-xs duration-motion active:scale-[0.98] shadow-control flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
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
                  <label className="text-xs font-bold text-foreground block">
                    عنوان راهنما *
                  </label>
                  <input
                    type="text"
                    value={guideForm.title}
                    onChange={(e) =>
                      setGuideForm((prev) => ({
                        ...prev,
                        title: e.target.value,
                      }))
                    }
                    placeholder="مثلاً: حل مشکل عدم دریافت پیامک در شماره‌های ۵SIM"
                    className="w-full h-10 px-3.5 rounded-field bg-muted/20 border border-border/60 text-foreground text-xs outline-none focus:border-brand focus:ring-1 focus:ring-brand/30 transition-all font-sans font-medium"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-foreground block">
                    پیوند یکتا (Slug) *
                  </label>
                  <input
                    type="text"
                    value={guideForm.slug}
                    onChange={(e) =>
                      setGuideForm((prev) => ({
                        ...prev,
                        slug: e.target.value,
                      }))
                    }
                    placeholder="fix-5sim-sms-delivery"
                    dir="ltr"
                    className="w-full h-10 px-3.5 rounded-field bg-muted/20 border border-border/60 text-foreground text-xs outline-none focus:border-brand focus:ring-1 focus:ring-brand/30 transition-all text-left font-mono font-latin"
                  />
                </div>
              </div>

              {/* Excerpt */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-foreground block">
                  خلاصه راهنما
                </label>
                <textarea
                  rows={2}
                  value={guideForm.excerpt}
                  onChange={(e) =>
                    setGuideForm((prev) => ({
                      ...prev,
                      excerpt: e.target.value,
                    }))
                  }
                  placeholder="توضیح کوتاه درباره این راهنما..."
                  className="w-full p-3.5 rounded-field bg-muted/20 border border-border/60 text-foreground text-xs outline-none focus:border-brand focus:ring-1 focus:ring-brand/30 transition-all font-sans leading-relaxed"
                />
              </div>

              {/* Content Editor */}
              <div className="space-y-2">
                <RichContentEditor
                  value={guideForm.content}
                  onChange={(val) =>
                    setGuideForm((prev) => ({ ...prev, content: val }))
                  }
                  onReadingTimeChange={(rt) =>
                    setGuideForm((prev) =>
                      prev.reading_time_minutes === rt
                        ? prev
                        : { ...prev, reading_time_minutes: rt },
                    )
                  }
                  contentType="help"
                  label="محتوای متنی راهنما و راه‌حل گام‌به‌گام"
                  minHeight="520px"
                />
              </div>

              {/* Service & Category Configurations */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 pt-4 border-t border-border/60">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-foreground block">
                    دسته‌بندی راهنما
                  </label>
                  <select
                    value={guideForm.category_slug}
                    onChange={(e) => {
                      const sel = categories.find(
                        (c) => c.slug === e.target.value,
                      )
                      setGuideForm((prev) => ({
                        ...prev,
                        category_slug: e.target.value,
                        category_name: sel?.name || '',
                      }))
                    }}
                    className="w-full h-10 px-3.5 rounded-field bg-muted/20 border border-border/60 text-foreground text-xs outline-none focus:border-brand focus:ring-1 focus:ring-brand/30 transition-all font-sans cursor-pointer"
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
                  <label className="text-xs font-bold text-foreground block">
                    سرویس مقصد (Target)
                  </label>
                  <select
                    value={guideForm.service_target}
                    onChange={(e) =>
                      setGuideForm((prev) => ({
                        ...prev,
                        service_target: e.target.value,
                      }))
                    }
                    className="w-full h-10 px-3.5 rounded-field bg-muted/20 border border-border/60 text-foreground text-xs outline-none focus:border-brand focus:ring-1 focus:ring-brand/30 transition-all font-sans cursor-pointer"
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
                  <label className="text-xs font-bold text-foreground block">
                    سطح دشواری
                  </label>
                  <select
                    value={guideForm.difficulty}
                    onChange={(e) =>
                      setGuideForm((prev) => ({
                        ...prev,
                        difficulty: e.target.value,
                      }))
                    }
                    className="w-full h-10 px-3.5 rounded-field bg-muted/20 border border-border/60 text-foreground text-xs outline-none focus:border-brand focus:ring-1 focus:ring-brand/30 transition-all font-sans cursor-pointer"
                  >
                    <option value="ساده">ساده (مبتدی)</option>
                    <option value="متوسط">متوسط</option>
                    <option value="پیشرفته">پیشرفته (تخصصی)</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-foreground block">
                    محصول مرتبط فروشگاه (CTA)
                  </label>
                  <select
                    value={guideForm.related_product_id}
                    onChange={(e) => {
                      const p = products.find(
                        (prod) => String(prod.id) === e.target.value,
                      )
                      setGuideForm((prev) => ({
                        ...prev,
                        related_product_id: e.target.value,
                        related_product_title: p?.title_fa || '',
                        related_product_slug: p?.slug || '',
                        related_product_price: p?.price_toman || 0,
                      }))
                    }}
                    className="w-full h-10 px-3.5 rounded-field bg-muted/20 border border-border/60 text-foreground text-xs outline-none focus:border-brand focus:ring-1 focus:ring-brand/30 transition-all font-sans cursor-pointer"
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

              {/* Author Profile Information Card with Direct Upload & Site Logo Fallback */}
              <div className="rounded-2xl border border-border/80 bg-muted/20 p-4 sm:p-5 space-y-4">
                <div className="flex items-center justify-between border-b border-border/60 pb-3">
                  <div className="flex items-center gap-2">
                    <User className="h-4 w-4 text-brand" />
                    <span className="text-xs font-bold text-foreground">
                      مشخصات و تصویر نویسنده راهنما
                    </span>
                  </div>
                  <span className="text-[11px] text-muted-foreground font-medium">
                    {guideForm.author_avatar
                      ? 'تصویر اختصاصی تنظیم شده'
                      : 'پیش‌فرض: لوگوی سایت از تنظیمات ادمین'}
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-center">
                  {/* Author Avatar Preview & Upload Action */}
                  <div className="flex items-center gap-3">
                    <div className="relative w-14 h-14 rounded-full border-2 border-border/80 overflow-hidden bg-card flex items-center justify-center shrink-0 shadow-sm">
                      {guideForm.author_avatar ? (
                        <img
                          src={guideForm.author_avatar}
                          alt={guideForm.author_name}
                          className="w-full h-full object-cover"
                        />
                      ) : siteLogoUrl ? (
                        <img
                          src={siteLogoUrl}
                          alt="لوگوی پیش‌فرض سایت"
                          className="w-full h-full object-contain p-1.5"
                        />
                      ) : (
                        <div className="w-full h-full bg-brand/10 text-brand flex items-center justify-center font-bold text-base">
                          {guideForm.author_name?.[0] || 'A'}
                        </div>
                      )}
                      {isUploadingGuideAvatar && (
                        <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                          <Loader2 className="w-5 h-5 animate-spin text-white" />
                        </div>
                      )}
                    </div>

                    <div className="space-y-1.5 flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <label className="h-8 px-3 rounded-xl bg-secondary hover:bg-muted border border-border/60 text-foreground font-bold text-xs flex items-center gap-1.5 cursor-pointer shadow-xs transition-all active:scale-[0.98]">
                          <Upload className="w-3.5 h-3.5 text-brand" />
                          <span>
                            {guideForm.author_avatar
                              ? 'تغییر تصویر'
                              : 'آپلود تصویر پروفایل'}
                          </span>
                          <input
                            type="file"
                            accept="image/*"
                            className="hidden"
                            disabled={isUploadingGuideAvatar}
                            onChange={(e) => {
                              const f = e.target.files?.[0]
                              if (f) handleUploadAuthorAvatar(f, true)
                            }}
                          />
                        </label>

                        {guideForm.author_avatar && (
                          <button
                            type="button"
                            onClick={() =>
                              setGuideForm({
                                ...guideForm,
                                author_avatar: '',
                              })
                            }
                            className="h-8 px-2.5 rounded-xl text-xs font-bold text-destructive hover:bg-destructive/10 border border-destructive/20 cursor-pointer transition-all active:scale-[0.98]"
                            title="بازنشانی به لوگوی پیش‌فرض سایت"
                          >
                            لوگوی سایت
                          </button>
                        )}
                      </div>
                      <p className="text-[10px] text-muted-foreground truncate">
                        {guideForm.author_avatar
                          ? 'تصویر اختصاصی نویسنده فعال است'
                          : 'در صورت عدم آپلود، لوگوی سایت به عنوان پیش‌فرض قرار می‌گیرد'}
                      </p>
                    </div>
                  </div>

                  {/* Author Name */}
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-foreground block">
                      نام نویسنده / تیم پشتیبان *
                    </label>
                    <input
                      type="text"
                      value={guideForm.author_name}
                      onChange={(e) =>
                        setGuideForm({
                          ...guideForm,
                          author_name: e.target.value,
                        })
                      }
                      placeholder="تیم پشتیبانی و فنی آناهیکس"
                      className="w-full h-10 px-3 rounded-xl border border-border/60 bg-background text-foreground text-xs outline-none focus:border-brand"
                    />
                  </div>

                  {/* Author Role */}
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-foreground block">
                      سمت یا دپارتمان پشتیبانی
                    </label>
                    <input
                      type="text"
                      value={guideForm.author_role}
                      onChange={(e) =>
                        setGuideForm((prev) => ({
                          ...prev,
                          author_role: e.target.value,
                        }))
                      }
                      placeholder="کارشناس رفع تحریم و شبکه"
                      className="w-full h-10 px-3 rounded-xl border border-border/60 bg-background text-foreground text-xs outline-none focus:border-brand"
                    />
                  </div>
                </div>
              </div>

              {/* Visibility & Featured Toggles */}
              <div className="flex flex-wrap items-center gap-6 pt-3 border-t border-border/60">
                <div className="flex items-center gap-2.5">
                  <ToggleSwitch
                    size="sm"
                    checked={Boolean(guideForm.is_published)}
                    onChange={(checked) => {
                      setGuideForm((prev) => ({
                        ...prev,
                        is_published: checked,
                      }))
                      if (checked) {
                        notifySuccess(
                          'وضعیت انتشار عمومی',
                          'راهنما در وضعیت انتشار عمومی تنظیم شد و برای تمامی کاربران قابل مشاهده خواهد بود.',
                        )
                      } else {
                        notifyInfo(
                          'حالت پیش‌نویس',
                          'راهنما به حالت پیش‌نویس تغییر یافت و از دید عموم مخفی شد.',
                        )
                      }
                    }}
                  />
                  <span className="text-xs font-bold text-foreground">
                    انتشار عمومی در پایگاه دانش
                  </span>
                </div>

                <div className="flex items-center gap-2.5">
                  <ToggleSwitch
                    size="sm"
                    checked={Boolean(guideForm.is_featured)}
                    onChange={(checked) => {
                      setGuideForm((prev) => ({
                        ...prev,
                        is_featured: checked,
                      }))
                      if (checked) {
                        notifySuccess(
                          'پین راهنمای ویژه',
                          'راهنما با موفقیت به عنوان راهنمای برگزیده پایگاه دانش پین شد.',
                        )
                      } else {
                        notifyInfo(
                          'حذف از برگزیده‌ها',
                          'راهنما از حالت برگزیده خارج گردید.',
                        )
                      }
                    }}
                  />
                  <span className="text-xs font-bold text-foreground">
                    پین کردن به عنوان راهنمای برگزیده صفحه اصلی پایگاه دانش
                  </span>
                </div>
              </div>
            </div>
          ) : (
            /* Guides List View */
            <div className="space-y-4">
              <div className="bg-card border border-border rounded-xl p-3 flex flex-wrap items-center justify-between gap-3">
                <div className="flex-1 min-w-[240px]">
                  <SearchInput
                    value={guideSearch}
                    onChange={setGuideSearch}
                    onSearch={() => loadGuides()}
                    placeholder="جستجو در راهنماها، ارورها و راه‌حل‌ها..."
                    debounceMs={300}
                  />
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
                  <table className="w-full text-center text-xs">
                    <thead>
                      <tr className="border-b border-border bg-muted/40 text-muted-foreground font-semibold select-none">
                        <th className="p-3.5 text-center whitespace-nowrap">
                          عنوان راهنما
                        </th>
                        <th className="p-3.5 text-center whitespace-nowrap">
                          سرویس هدف
                        </th>
                        <th className="p-3.5 text-center whitespace-nowrap">
                          دشواری
                        </th>
                        <th className="p-3.5 text-center whitespace-nowrap">
                          بازخورد مفید (👍 / 👎)
                        </th>
                        <th className="p-3.5 text-center whitespace-nowrap">
                          بازدید
                        </th>
                        <th className="p-3.5 text-center whitespace-nowrap">
                          عملیات
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border/60">
                      {guides.map((g) => (
                        <tr
                          key={g.id}
                          className="hover:bg-muted/30 transition-colors"
                        >
                          <td className="p-3.5 text-center max-w-[340px]">
                            <div className="space-y-0.5 min-w-0 text-center">
                              <span
                                className="font-bold text-foreground text-xs sm:text-sm truncate block text-center"
                                title={g.title}
                              >
                                {g.title}
                              </span>
                              <span className="text-[11px] text-muted-foreground font-mono font-latin dir-ltr text-center block truncate">
                                /help/{g.slug}
                              </span>
                            </div>
                          </td>
                          <td className="p-3.5 text-center whitespace-nowrap">
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-md text-[11px] font-bold text-foreground font-latin bg-secondary border border-border/60 shadow-xs">
                              {g.service_target.toUpperCase()}
                            </span>
                          </td>
                          <td className="p-3.5 text-center whitespace-nowrap">
                            <span
                              className={`inline-flex items-center px-2.5 py-0.5 rounded-md text-[11px] font-semibold whitespace-nowrap ${
                                g.difficulty === 'پیشرفته'
                                  ? 'bg-purple-500/10 text-purple-600 dark:text-purple-400 border border-purple-500/20'
                                  : g.difficulty === 'متوسط'
                                    ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20'
                                    : 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20'
                              }`}
                            >
                              {g.difficulty}
                            </span>
                          </td>
                          <td className="p-3.5 text-center font-mono font-latin whitespace-nowrap">
                            <div className="inline-flex items-center justify-center gap-3 text-xs">
                              <span
                                className="text-emerald-600 dark:text-emerald-400 font-bold flex items-center gap-1 cursor-default"
                                title={`تعداد کاربران راضی: ${g.helpful_yes.toLocaleString()} نفر`}
                              >
                                <ThumbsUp className="h-3.5 w-3.5" />
                                {g.helpful_yes.toLocaleString()}
                              </span>
                              <span
                                className="text-rose-500 font-bold flex items-center gap-1 cursor-default"
                                title={`تعداد کاربران ناراضی: ${g.helpful_no.toLocaleString()} نفر`}
                              >
                                <ThumbsDown className="h-3.5 w-3.5" />
                                {g.helpful_no.toLocaleString()}
                              </span>
                            </div>
                          </td>
                          <td className="p-3.5 text-center font-mono font-latin whitespace-nowrap">
                            <span
                              className="inline-flex items-center justify-center gap-1 text-muted-foreground font-medium text-xs cursor-default"
                              title={`تعداد کل بازدیدها: ${g.view_count.toLocaleString()} بار`}
                            >
                              <Eye className="h-3.5 w-3.5 text-muted-foreground/70" />
                              <span>{g.view_count.toLocaleString()}</span>
                            </span>
                          </td>
                          <td className="p-3.5 text-center whitespace-nowrap">
                            <div className="flex items-center justify-center gap-1.5">
                              <a
                                href={`/help/${g.slug}`}
                                target="_blank"
                                rel="noreferrer"
                                className="p-1.5 rounded-control border border-border/60 bg-secondary hover:bg-muted text-foreground hover:text-blue-500 transition-colors cursor-pointer shadow-control"
                                title="مشاهده زنده راهنما"
                              >
                                <ExternalLink className="w-3.5 h-3.5 text-blue-500" />
                              </a>
                              <button
                                type="button"
                                onClick={() => handleEditGuide(g.id)}
                                className="p-1.5 rounded-control border border-border/60 bg-secondary hover:bg-muted text-foreground hover:text-brand transition-colors cursor-pointer shadow-control"
                                title="ویرایش راهنما"
                              >
                                <Edit2 className="w-3.5 h-3.5 text-brand" />
                              </button>
                              <button
                                type="button"
                                onClick={() => handleDeleteGuide(g.id)}
                                className="p-1.5 rounded-control border border-destructive/20 text-destructive hover:bg-destructive/10 transition-colors cursor-pointer shadow-control"
                                title="حذف راهنما"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
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

                <div className="flex items-center gap-1.5 shrink-0">
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
                    className="p-1.5 rounded-control border border-border/60 bg-secondary hover:bg-muted text-foreground hover:text-brand transition-colors cursor-pointer shadow-control"
                    title="ویرایش دسته‌بندی"
                  >
                    <Edit2 className="w-3.5 h-3.5 text-brand" />
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDeleteCategory(cat.id)}
                    className="p-1.5 rounded-control border border-destructive/20 text-destructive hover:bg-destructive/10 transition-colors cursor-pointer shadow-control"
                    title="حذف دسته‌بندی"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
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
          {/* Comments Filter & Search Toolbar */}
          <div className="bg-card border border-border rounded-xl p-3 flex flex-wrap items-center justify-between gap-3 shadow-xs">
            <div className="flex-1 min-w-[240px]">
              <SearchInput
                value={commentSearch}
                onChange={setCommentSearch}
                onSearch={() => loadComments()}
                placeholder="جستجو در متن دیدگاه، نام یا ایمیل کاربر..."
                debounceMs={300}
              />
            </div>

            <div className="flex items-center gap-2">
              <select
                value={commentStatusFilter}
                onChange={(e) => setCommentStatusFilter(e.target.value)}
                className="h-10 px-3.5 rounded-field bg-muted/20 border border-border/60 text-foreground text-xs outline-none focus:border-brand focus:ring-1 focus:ring-brand/30 transition-all font-sans cursor-pointer"
              >
                <option value="">همه وضعیت‌ها</option>
                <option value="pending">در انتظار بررسی</option>
                <option value="approved">تایید شده</option>
                <option value="rejected">رد شده</option>
              </select>

              <select
                value={commentArticleFilter}
                onChange={(e) => setCommentArticleFilter(e.target.value)}
                className="h-10 px-3.5 rounded-field bg-muted/20 border border-border/60 text-foreground text-xs outline-none focus:border-brand focus:ring-1 focus:ring-brand/30 transition-all font-sans cursor-pointer max-w-[220px]"
              >
                <option value="">همه مقالات</option>
                {articles.map((art) => (
                  <option key={art.id} value={art.id}>
                    {art.title}
                  </option>
                ))}
              </select>

              <button
                type="button"
                onClick={loadComments}
                className="p-2 text-muted-foreground hover:text-foreground rounded-lg hover:bg-muted transition-colors cursor-pointer"
                title="تازه‌سازی دیدگاه‌ها"
              >
                <RefreshCw className="h-4 w-4" />
              </button>
            </div>
          </div>

          <div className="bg-card border border-border rounded-2xl overflow-hidden shadow-sm">
            <div className="divide-y divide-border/60">
              {comments
                .filter((c) => {
                  if (!commentSearch.trim()) return true
                  const q = commentSearch.trim().toLowerCase()
                  return (
                    c.content.toLowerCase().includes(q) ||
                    c.author_name.toLowerCase().includes(q) ||
                    Boolean(c.email?.toLowerCase().includes(q)) ||
                    Boolean(c.article_title?.toLowerCase().includes(q))
                  )
                })
                .map((c) => (
                  <div key={c.id} className="p-4 space-y-3">
                    <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border/60 pb-3">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-xs shrink-0">
                          {c.author_name?.[0] || 'U'}
                        </div>
                        <div>
                          <span className="font-bold text-xs sm:text-sm text-foreground block">
                            {c.author_name}
                          </span>
                          {c.email && (
                            <span className="text-[11px] text-muted-foreground font-mono font-latin dir-ltr block text-right">
                              {c.email}
                            </span>
                          )}
                        </div>
                        <span
                          className={`text-[10px] px-2.5 py-0.5 rounded-full font-bold ${
                            c.status === 'approved'
                              ? 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/30'
                              : c.status === 'rejected'
                                ? 'bg-rose-500/10 text-rose-500 border border-rose-500/30'
                                : 'bg-amber-500/10 text-amber-500 border border-amber-500/30'
                          }`}
                        >
                          {c.status === 'approved'
                            ? 'تایید شده'
                            : c.status === 'rejected'
                              ? 'رد شده'
                              : 'در انتظار بررسی'}
                        </span>
                      </div>

                      <div className="flex items-center gap-2">
                        {c.article_slug ? (
                          <a
                            href={`/blog/${c.article_slug}`}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-control bg-blue-500/10 text-blue-500 hover:text-blue-600 border border-blue-500/20 text-xs font-bold transition-all shadow-xs"
                            title="مشاهده مقاله در سایت"
                          >
                            <BookOpen className="w-3.5 h-3.5" />
                            <span className="truncate max-w-[180px] sm:max-w-[240px]">
                              {c.article_title || c.article_slug}
                            </span>
                            <ExternalLink className="w-3 h-3 opacity-70" />
                          </a>
                        ) : (
                          <span className="text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded-md">
                            مقاله وبلاگ
                          </span>
                        )}
                        <span className="text-xs text-muted-foreground font-mono font-latin">
                          {new Date(c.created_at).toLocaleDateString('fa-IR')}
                        </span>
                      </div>
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
                    <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
                      <div className="flex items-center gap-2">
                        {c.status !== 'approved' && (
                          <button
                            type="button"
                            onClick={() =>
                              handleUpdateCommentStatus(c.id, 'approved')
                            }
                            className="h-8 px-3 rounded-control bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-500 border border-emerald-500/30 text-xs font-bold transition-all cursor-pointer duration-motion active:scale-[0.98]"
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
                            className="h-8 px-3 rounded-control bg-amber-500/15 hover:bg-amber-500/25 text-amber-500 border border-amber-500/30 text-xs font-bold transition-all cursor-pointer duration-motion active:scale-[0.98]"
                          >
                            رد دیدگاه
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={() => handleDeleteComment(c.id)}
                          className="h-8 px-3 rounded-control text-destructive hover:bg-destructive/10 border border-destructive/20 text-xs font-bold transition-all cursor-pointer duration-motion active:scale-[0.98]"
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
                          className="flex-1 h-9 rounded-field border border-border/60 bg-background px-3 text-xs outline-none focus:border-brand"
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
                          className="h-9 px-4 rounded-control bg-primary hover:bg-primary-hover text-primary-foreground text-xs font-black shadow-control cursor-pointer duration-motion active:scale-[0.98]"
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

                  <div className="flex items-center gap-1.5 shrink-0">
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
                      className="p-1.5 rounded-control border border-border/60 bg-secondary hover:bg-muted text-foreground hover:text-brand transition-colors cursor-pointer shadow-control"
                      title="ویرایش قالب"
                    >
                      <Edit2 className="w-3.5 h-3.5 text-brand" />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDeleteTemplate(tmpl.id)}
                      className="p-1.5 rounded-control border border-destructive/20 text-destructive hover:bg-destructive/10 transition-colors cursor-pointer shadow-control"
                      title="حذف قالب"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
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
      {isCategoryModalOpen &&
        createPortal(
          <div
            className="fixed inset-0 overflow-y-auto bg-black/80 backdrop-blur-md p-3 sm:p-6 animate-in fade-in"
            style={{
              position: 'fixed',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              width: '100vw',
              height: '100vh',
              zIndex: 2147483600,
            }}
            dir="rtl"
          >
            <div className="min-h-full w-full flex items-start sm:items-center justify-center">
              <div className="w-full max-w-md my-auto bg-card border border-border/80 rounded-surface p-6 shadow-overlay text-right space-y-4 animate-in zoom-in-95 text-foreground">
                <div className="flex items-center justify-between pb-3 border-b border-border/60">
                  <h3 className="font-black text-base text-foreground">
                    {categoryForm.id
                      ? 'ویرایش دسته‌بندی'
                      : 'افزودن دسته‌بندی جدید'}
                  </h3>
                  <ModalCloseButton
                    onClick={() => setIsCategoryModalOpen(false)}
                    size="sm"
                  />
                </div>
                <div className="space-y-3">
                  <div>
                    <label className="text-xs font-bold text-foreground block mb-1">
                      نام دسته *
                    </label>
                    <input
                      type="text"
                      value={categoryForm.name}
                      onChange={(e) =>
                        setCategoryForm({
                          ...categoryForm,
                          name: e.target.value,
                        })
                      }
                      placeholder="مثلاً: اخبار و رویدادهای AI"
                      className="w-full h-10 px-3 rounded-field border border-border/60 bg-muted/20 text-foreground text-xs outline-none focus:border-brand"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-bold text-foreground block mb-1">
                      پیوند یکتا (Slug) *
                    </label>
                    <input
                      type="text"
                      value={categoryForm.slug}
                      onChange={(e) =>
                        setCategoryForm({
                          ...categoryForm,
                          slug: e.target.value,
                        })
                      }
                      placeholder="ai-news"
                      dir="ltr"
                      className="w-full h-10 px-3 rounded-field border border-border/60 bg-muted/20 text-foreground text-xs font-mono font-latin text-left outline-none focus:border-brand"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-bold text-foreground block mb-1">
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
                      className="w-full h-10 px-3 rounded-field border border-border/60 bg-muted/20 text-foreground text-xs outline-none focus:border-brand"
                    >
                      <option value="blog">وبلاگ و اخبار</option>
                      <option value="help">پایگاه دانش و راهنماها</option>
                      <option value="product">
                        محصولات فروشگاه (Product Catalog)
                      </option>
                    </select>
                  </div>

                  <div>
                    <label className="text-xs font-bold text-foreground block mb-1">
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
                      className="w-full p-2.5 rounded-field border border-border/60 bg-muted/20 text-foreground text-xs outline-none focus:border-brand leading-relaxed"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-bold text-foreground block mb-1">
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
                      className="w-full h-10 px-3 rounded-field border border-border/60 bg-muted/20 text-foreground text-xs outline-none focus:border-brand"
                    />
                  </div>
                </div>

                <div className="pt-3 border-t border-border/60">
                  <button
                    type="button"
                    onClick={handleSaveCategory}
                    className="h-11 w-full rounded-control bg-primary hover:bg-primary-hover text-primary-foreground text-xs font-black shadow-control cursor-pointer duration-motion active:scale-[0.98]"
                  >
                    ذخیره دسته‌بندی
                  </button>
                </div>
              </div>
            </div>
          </div>,
          document.body,
        )}

      {/* ----------------- TEMPLATE CREATE/EDIT MODAL ----------------- */}
      {isTemplateModalOpen &&
        createPortal(
          <div
            className="fixed inset-0 overflow-y-auto bg-black/80 backdrop-blur-md p-3 sm:p-6 animate-in fade-in"
            style={{
              position: 'fixed',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              width: '100vw',
              height: '100vh',
              zIndex: 2147483600,
            }}
            dir="rtl"
          >
            <div className="min-h-full w-full flex items-start sm:items-center justify-center">
              <div className="w-full max-w-4xl my-auto bg-card border border-border/80 rounded-surface p-6 shadow-overlay text-right space-y-4 animate-in zoom-in-95 text-foreground">
                <div className="flex items-center justify-between pb-3 border-b border-border/60">
                  <h3 className="font-black text-base text-foreground">
                    {templateForm.id
                      ? 'ویرایش قالب آماده نگارش'
                      : 'افزودن قالب آماده جدید به دیتابیس'}
                  </h3>
                  <ModalCloseButton
                    onClick={() => setIsTemplateModalOpen(false)}
                    size="sm"
                  />
                </div>

                <div className="space-y-3">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="text-xs font-bold text-foreground block mb-1">
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
                        className="w-full h-10 px-3 rounded-field border border-border/60 bg-muted/20 text-foreground text-xs outline-none focus:border-brand"
                      />
                    </div>

                    <div>
                      <label className="text-xs font-bold text-foreground block mb-1">
                        پیوند یکتا (Slug) *
                      </label>
                      <input
                        type="text"
                        value={templateForm.slug}
                        onChange={(e) =>
                          setTemplateForm({
                            ...templateForm,
                            slug: e.target.value,
                          })
                        }
                        placeholder="tutorial-template"
                        dir="ltr"
                        className="w-full h-10 px-3 rounded-field border border-border/60 bg-muted/20 text-foreground text-xs font-mono font-latin text-left outline-none focus:border-brand"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="text-xs font-bold text-foreground block mb-1">
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
                        className="w-full h-10 px-3 rounded-field border border-border/60 bg-muted/20 text-foreground text-xs outline-none focus:border-brand"
                      >
                        <option value="all">
                          عمومی (هم وبلاگ و هم پایگاه دانش)
                        </option>
                        <option value="blog">مخصوص مقالات وبلاگ</option>
                        <option value="help">
                          مخصوص راهنماهای پایگاه دانش
                        </option>
                      </select>
                    </div>

                    <div>
                      <label className="text-xs font-bold text-foreground block mb-1">
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
                        className="w-full h-10 px-3 rounded-field border border-border/60 bg-muted/20 text-foreground text-xs outline-none focus:border-brand"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="text-xs font-bold text-foreground block mb-1">
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
                      className="w-full h-10 px-3 rounded-field border border-border/60 bg-muted/20 text-foreground text-xs outline-none focus:border-brand"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-bold text-foreground block mb-2">
                      محتوا و ساختار قالب نگارش (ویرایشگر پیشرفته با پیش‌نمایش
                      زنده) *
                    </label>
                    <RichContentEditor
                      value={templateForm.template_content}
                      onChange={(val) =>
                        setTemplateForm({
                          ...templateForm,
                          template_content: val,
                        })
                      }
                      contentType={
                        templateForm.type === 'help' ? 'help' : 'blog'
                      }
                      label="ویرایشگر ساختار قالب"
                      minHeight="350px"
                    />
                  </div>
                </div>

                <div className="pt-3 border-t border-border/60">
                  <button
                    type="button"
                    onClick={handleSaveTemplate}
                    className="h-11 w-full rounded-control bg-primary hover:bg-primary-hover text-primary-foreground text-xs font-black shadow-control cursor-pointer duration-motion active:scale-[0.98]"
                  >
                    ذخیره قالب
                  </button>
                </div>
              </div>
            </div>
          </div>,
          document.body,
        )}

      {/* CONFIRM DELETE MODAL */}
      <ConfirmModal
        isOpen={confirmModal.isOpen}
        title={confirmModal.title}
        message={confirmModal.message}
        confirmText="بله، حذف شود"
        cancelText="انصراف"
        loading={confirmModal.loading}
        onConfirm={confirmModal.onConfirm}
        onClose={() => setConfirmModal((prev) => ({ ...prev, isOpen: false }))}
      />
    </div>
  )
}
