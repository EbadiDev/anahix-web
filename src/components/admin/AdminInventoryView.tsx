import {
  AlertCircle,
  Calendar,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Coins,
  Copy,
  Download,
  Edit2,
  ExternalLink,
  Flame,
  Globe,
  GripVertical,
  HelpCircle,
  Key,
  Loader2,
  Package,
  Plus,
  RefreshCw,
  Search,
  Sparkles,
  Table,
  Trash2,
  Upload,
} from 'lucide-react'
import type React from 'react'
import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import { apiService } from '../../services/api'
import type {
  AdminProduct,
  InventoryItem,
  InventoryStats,
  ProductPlan,
} from '../../types'
import { RichContentEditor } from '../content/RichContentEditor'
import { ConfirmModal } from '../vibefarsi/ConfirmModal'
import { ModalCloseButton } from '../vibefarsi/ModalCloseButton'
import { SearchInput } from '../vibefarsi/SearchInput'
import { ToggleSwitch } from '../vibefarsi/ToggleSwitch'
import { AdminHeaderBanner } from './AdminHeaderBanner'

export const AdminInventoryView: React.FC = () => {
  const [activeSubtab, setActiveSubtab] = useState<'catalog' | 'inventory'>(
    'catalog',
  )
  const [stats, setStats] = useState<InventoryStats | null>(null)
  const [items, setItems] = useState<InventoryItem[]>([])
  const [adminProducts, setAdminProducts] = useState<AdminProduct[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedProduct, setSelectedProduct] = useState<string>('all')
  const [selectedStatus, setSelectedStatus] = useState<string>('all')
  const [searchQuery, setSearchQuery] = useState('')

  // Catalog search & filter state
  const [catalogSearch, setCatalogSearch] = useState('')
  const [catalogGroupFilter, setCatalogGroupFilter] = useState('all')
  const [catalogCategoryFilter, setCatalogCategoryFilter] = useState('all')

  // Product Modal (Create / Edit) state
  const [isProductModalOpen, setIsProductModalOpen] = useState(false)
  const [editingProduct, setEditingProduct] = useState<AdminProduct | null>(
    null,
  )
  const [productSubmitting, setProductSubmitting] = useState(false)
  const [productFormError, setProductFormError] = useState('')

  // Product Form fields
  const [productModalTab, setProductModalTab] = useState<
    'general' | 'seo' | 'plans' | 'comparison' | 'guide' | 'faq'
  >('general')
  const [pTitleFA, setPTitleFA] = useState('')
  const [pTitleEN, setPTitleEN] = useState('')
  const [pSlug, setPSlug] = useState('')
  const [pCategory, setPCategory] = useState('ai_chat')
  const [pDeliveryType, setPDeliveryType] = useState<
    'instant' | 'manual_timed'
  >('instant')
  const [pGroupTag, setPGroupTag] = useState('general')
  const [pGroupTitleFA, setPGroupTitleFA] = useState('')
  const [pPriceToman, setPPriceToman] = useState<number>(500000)
  const [pBaseCostUSD, setPBaseCostUSD] = useState<number>(0)
  const [pSLAMin, setPSLAMin] = useState<number>(10)
  const [pSLAMax, setPSLAMax] = useState<number>(30)
  const [pSLAText, setPSLAText] = useState('تحویل ۱۰ الی ۳۰ دقیقه')
  const [pOperatingHours, setPOperatingHours] = useState('۹:۰۰ تا ۲۴:۰۰')
  const [pDescription, setPDescription] = useState('')
  const [pInstructions, setPInstructions] = useState('')
  const [pIsActive, setPIsActive] = useState(true)
  const [pDeliveryStrategy, setPDeliveryStrategy] = useState('manual_operator')

  // Product Image & Merchandising Enhancements
  const [pImageURL, setPImageURL] = useState('')
  const [pIconURL, setPIconURL] = useState('')
  const [uploadingProductIcon, setUploadingProductIcon] = useState(false)
  const [pIsFlashSale, setPIsFlashSale] = useState(false)
  const [pFlashSalePriceToman, setPFlashSalePriceToman] = useState<number>(0)
  const [pFlashSaleStock, setPFlashSaleStock] = useState<number>(50)
  const [pFlashSaleSold, setPFlashSaleSold] = useState<number>(0)
  const [pFlashSaleEndAt, setPFlashSaleEndAt] = useState<string>('')
  const [pBadgesText, setPBadgesText] = useState<string>('')
  const [pRatingAverage, setPRatingAverage] = useState<number>(5.0)
  const [pShowRating, setPShowRating] = useState<boolean>(true)
  const [pIsBestSeller, setPIsBestSeller] = useState(false)
  const [pIsFeatured, setPIsFeatured] = useState(false)
  const [uploadingProductImage, setUploadingProductImage] = useState(false)

  // PDP specific form fields
  const [pMetaTitle, setPMetaTitle] = useState('')
  const [pMetaDescription, setPMetaDescription] = useState('')
  const [pOgImageURL, setPOgImageURL] = useState('')
  const [pPlans, setPPlans] = useState<ProductPlan[]>([])
  const [pPlansJSON, setPPlansJSON] = useState('')
  const [pComparisonJSON, setPComparisonJSON] = useState('')
  const [pGuideJSON, setPGuideJSON] = useState('')
  const [pFaqJSON, setPFaqJSON] = useState('')
  const [pFeaturesText, setPFeaturesText] = useState('')

  // Delete Confirmation Modal state
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false)
  const [productToDelete, setProductToDelete] = useState<AdminProduct | null>(
    null,
  )
  const [deleteLoading, setDeleteLoading] = useState(false)
  const [draggedPlanIdx, setDraggedPlanIdx] = useState<number | null>(null)

  // Export Modal state
  const [isExportOpen, setIsExportOpen] = useState(false)
  const [exportedKeys, setExportedKeys] = useState<string[]>([])
  const [exportLoading, setExportLoading] = useState(false)
  const [copiedExport, setCopiedExport] = useState(false)

  // Replace Key Modal state
  const [isReplaceOpen, setIsReplaceOpen] = useState(false)
  const [replaceOrderId, setReplaceOrderId] = useState('')
  const [replaceOldItemId, setReplaceOldItemId] = useState('')
  const [replaceReason, setReplaceReason] = useState('گارانتی تعویض اکانت')
  const [replaceLoading, setReplaceLoading] = useState(false)
  const [replaceSuccessMsg, setReplaceSuccessMsg] = useState('')
  const [replaceErrorMsg, setReplaceErrorMsg] = useState('')

  // Initial fetch
  const loadData = async () => {
    setLoading(true)
    try {
      const [statsData, adminProdsData] = await Promise.all([
        apiService.getInventoryStats().catch(() => null),
        apiService.adminListProducts().catch(() => []),
      ])
      if (statsData) setStats(statsData)
      setAdminProducts(adminProdsData)

      // Fetch items
      const itemsRes = await apiService
        .listInventory(
          selectedProduct === 'all' ? undefined : selectedProduct,
          selectedStatus === 'all' ? undefined : selectedStatus,
        )
        .catch(() => ({ items: [], total: 0, page: 1, limit: 50 }))
      setItems(itemsRes.items || [])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [])

  // Refetch items when filters change
  useEffect(() => {
    if (activeSubtab === 'inventory') {
      apiService
        .listInventory(
          selectedProduct === 'all' ? undefined : selectedProduct,
          selectedStatus === 'all' ? undefined : selectedStatus,
        )
        .then((res) => setItems(res.items || []))
        .catch(() => setItems([]))
    }
  }, [selectedProduct, selectedStatus, activeSubtab])

  const openCreateProductModal = () => {
    setEditingProduct(null)
    setProductModalTab('general')
    setPTitleFA('')
    setPTitleEN('')
    setPSlug('')
    setPCategory('ai_chat')
    setPDeliveryType('instant')
    setPGroupTag('general')
    setPGroupTitleFA('')
    setPPriceToman(500000)
    setPBaseCostUSD(0)
    setPSLAMin(10)
    setPSLAMax(30)
    setPSLAText('تحویل ۱۰ الی ۳۰ دقیقه')
    setPOperatingHours('۹:۰۰ تا ۲۴:۰۰')
    setPDescription('')
    setPInstructions('')
    setPIsActive(true)
    setPDeliveryStrategy('manual_operator')
    setPMetaTitle('')
    setPMetaDescription('')
    setPOgImageURL('')
    setPPlans([])
    setPPlansJSON('')
    setPComparisonJSON('')
    setPGuideJSON('')
    setPFaqJSON('')
    setPFeaturesText('')
    setPImageURL('')
    setPIconURL('')
    setPIsFlashSale(false)
    setPFlashSalePriceToman(0)
    setPFlashSaleStock(50)
    setPFlashSaleSold(0)
    setPFlashSaleEndAt('')
    setPBadgesText('')
    setPRatingAverage(5.0)
    setPShowRating(true)
    setPIsBestSeller(false)
    setPIsFeatured(false)
    setProductFormError('')
    setIsProductModalOpen(true)
  }

  const openEditProductModal = (p: AdminProduct) => {
    setEditingProduct(p)
    setProductModalTab('general')
    setPTitleFA(p.title_fa || '')
    setPTitleEN(p.title || '')
    setPSlug(p.slug || '')
    setPCategory(p.category || 'ai_chat')
    setPDeliveryType(p.delivery_type || 'instant')
    setPGroupTag(p.group_tag || 'general')
    setPGroupTitleFA(p.group_title_fa || '')
    setPPriceToman(p.price_toman || 0)
    setPBaseCostUSD(p.base_cost_usd || 0)
    setPSLAMin(p.sla_min_minutes || 10)
    setPSLAMax(p.sla_max_minutes || 30)
    setPSLAText(p.sla_display_text || '')
    setPOperatingHours(p.operating_hours || '')
    setPDescription(p.description || '')
    setPInstructions(p.instructions || '')
    setPIsActive(p.is_active !== false)
    setPDeliveryStrategy(p.delivery_strategy || 'manual_operator')
    setPImageURL(p.image_url || '')
    setPIconURL(p.icon_url || '')
    setPIsFlashSale(p.is_flash_sale || false)
    setPFlashSalePriceToman(p.flash_sale_price_toman || 0)
    setPFlashSaleStock(p.flash_sale_stock || 50)
    setPFlashSaleSold(p.flash_sale_sold || 0)
    setPFlashSaleEndAt(
      p.flash_sale_end_at ? p.flash_sale_end_at.substring(0, 16) : '',
    )
    if (p.badges_json) {
      try {
        const arr = JSON.parse(p.badges_json)
        if (Array.isArray(arr)) setPBadgesText(arr.join('\n'))
        else setPBadgesText('')
      } catch {
        setPBadgesText('')
      }
    } else {
      setPBadgesText('')
    }
    const r = p.rating_average !== undefined ? Number(p.rating_average) : 5.0
    setPRatingAverage(r > 0 ? r : 5.0)
    setPShowRating(r > 0)
    setPIsBestSeller(p.is_best_seller || false)
    setPIsFeatured(p.is_featured || false)
    setPMetaTitle(p.meta_title || '')
    setPMetaDescription(p.meta_description || '')
    setPOgImageURL(p.og_image_url || '')
    setPPlansJSON(p.plans_json || '')
    setPComparisonJSON(p.comparison_json || '')
    setPGuideJSON(p.guide_json || '')
    setPFaqJSON(p.faq_json || '')

    if (p.plans_json) {
      try {
        const arr = JSON.parse(p.plans_json)
        if (Array.isArray(arr)) setPPlans(arr)
        else setPPlans([])
      } catch {
        setPPlans([])
      }
    } else {
      setPPlans([])
    }

    if (p.features_json) {
      try {
        const arr = JSON.parse(p.features_json)
        if (Array.isArray(arr)) setPFeaturesText(arr.join('\n'))
        else setPFeaturesText('')
      } catch {
        setPFeaturesText('')
      }
    } else {
      setPFeaturesText('')
    }

    setProductFormError('')
    setIsProductModalOpen(true)

    // Background fetch to guarantee full JSON fields
    apiService
      .adminGetProduct(p.id)
      .then((full) => {
        if (full) {
          if (full.meta_title) setPMetaTitle(full.meta_title)
          if (full.meta_description) setPMetaDescription(full.meta_description)
          if (full.og_image_url) setPOgImageURL(full.og_image_url)
          if (full.plans_json) {
            setPPlansJSON(full.plans_json)
            try {
              const arr = JSON.parse(full.plans_json)
              if (Array.isArray(arr)) setPPlans(arr)
            } catch {}
          }
          if (full.comparison_json) setPComparisonJSON(full.comparison_json)
          if (full.guide_json) setPGuideJSON(full.guide_json)
          if (full.faq_json) setPFaqJSON(full.faq_json)
          if (full.features_json) {
            try {
              const arr = JSON.parse(full.features_json)
              if (Array.isArray(arr)) setPFeaturesText(arr.join('\n'))
            } catch {}
          }
        }
      })
      .catch(() => {})
  }

  const handleUploadProductImage = async (
    e: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const file = e.target.files?.[0]
    if (!file) return
    setUploadingProductImage(true)
    try {
      const resp = await apiService.uploadMedia(file)
      setPImageURL(resp.file_url)
    } catch (err: any) {
      setProductFormError(err.message || 'خطا در بارگذاری عکس محصول')
    } finally {
      setUploadingProductImage(false)
    }
  }

  const handleUploadProductIcon = async (
    e: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const file = e.target.files?.[0]
    if (!file) return
    setUploadingProductIcon(true)
    try {
      const resp = await apiService.uploadMedia(file)
      setPIconURL(resp.file_url)
    } catch (err: any) {
      setProductFormError(err.message || 'خطا در بارگذاری آیکون محصول')
    } finally {
      setUploadingProductIcon(false)
    }
  }

  const handleProductSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!pTitleFA.trim()) {
      setProductFormError('لطفاً عنوان فارسی محصول را وارد کنید')
      return
    }
    if (!pTitleEN.trim()) {
      setProductFormError('لطفاً عنوان انگلیسی محصول را وارد کنید')
      return
    }
    if (pPriceToman <= 0) {
      setProductFormError('قیمت فروش محصول به تومان باید بیشتر از صفر باشد')
      return
    }

    const slugFinal = pSlug.trim()
      ? pSlug.trim().toLowerCase().replace(/\s+/g, '-')
      : pTitleEN
          .trim()
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, '-')
          .replace(/(^-|-$)/g, '') || `prod-${Date.now()}`

    setProductSubmitting(true)
    setProductFormError('')

    const featuresList = pFeaturesText
      .split('\n')
      .map((s) => s.trim())
      .filter(Boolean)

    let finalPlansJSON = pPlansJSON.trim()
    if (!finalPlansJSON && pPlans.length > 0) {
      finalPlansJSON = JSON.stringify(pPlans, null, 2)
    }

    const payload: Partial<AdminProduct> = {
      title_fa: pTitleFA.trim(),
      title: pTitleEN.trim(),
      slug: slugFinal,
      category: pCategory,
      delivery_type: pDeliveryType,
      group_tag: pGroupTag,
      group_title_fa: pGroupTitleFA.trim() || undefined,
      price_toman: Number(pPriceToman),
      base_cost_usd: Number(pBaseCostUSD) || 0,
      sla_min_minutes: Number(pSLAMin) || 10,
      sla_max_minutes: Number(pSLAMax) || 30,
      sla_display_text: pSLAText.trim(),
      operating_hours: pOperatingHours.trim(),
      description: pDescription.trim(),
      instructions: pInstructions.trim(),
      is_active: pIsActive,
      delivery_strategy: pDeliveryStrategy,
      meta_title: pMetaTitle.trim() || undefined,
      meta_description: pMetaDescription.trim() || undefined,
      og_image_url: pOgImageURL.trim() || undefined,
      image_url: pImageURL.trim() || undefined,
      icon_url: pIconURL.trim() || undefined,
      is_flash_sale: pIsFlashSale,
      flash_sale_price_toman: Number(pFlashSalePriceToman) || 0,
      flash_sale_stock: Number(pFlashSaleStock) || 0,
      flash_sale_sold: Number(pFlashSaleSold) || 0,
      flash_sale_end_at: pFlashSaleEndAt
        ? new Date(pFlashSaleEndAt).toISOString()
        : undefined,
      badges_json: pBadgesText.trim()
        ? JSON.stringify(
            pBadgesText
              .split('\n')
              .map((b) => b.trim())
              .filter(Boolean),
          )
        : undefined,
      rating_average: pShowRating ? Number(pRatingAverage) || 5.0 : 0,
      is_best_seller: pIsBestSeller,
      is_featured: pIsFeatured,
      plans_json: finalPlansJSON || undefined,
      comparison_json: pComparisonJSON.trim() || undefined,
      guide_json: pGuideJSON.trim() || undefined,
      faq_json: pFaqJSON.trim() || undefined,
      features_json:
        featuresList.length > 0 ? JSON.stringify(featuresList) : undefined,
    }

    try {
      if (editingProduct) {
        await apiService.adminUpdateProduct(editingProduct.id, payload)
      } else {
        await apiService.adminCreateProduct(payload)
      }
      setIsProductModalOpen(false)
      loadData()
    } catch (err: any) {
      setProductFormError(err.message || 'خطا در ثبت اطلاعات محصول')
    } finally {
      setProductSubmitting(false)
    }
  }

  const handleGenerateDefaultPlans = () => {
    const basePrice = pPriceToman > 0 ? pPriceToman : 1500000
    const originalBase = Math.round((basePrice * 1.18) / 10000) * 10000
    const threeMonth = Math.round((basePrice * 2.8) / 10000) * 10000
    const threeMonthOrig = Math.round((basePrice * 3.4) / 10000) * 10000
    const oneYear = Math.round((basePrice * 9.5) / 10000) * 10000
    const oneYearOrig = Math.round((basePrice * 12.0) / 10000) * 10000

    const defaultPlans: ProductPlan[] = [
      {
        id: 'plan-1m',
        title: 'اشتراک ۱ ماهه اختصاصی',
        duration_days: 30,
        duration_text: '۱ ماهه',
        price_toman: basePrice,
        original_price_toman: originalBase,
        base_cost_usd: pBaseCostUSD || 20,
        badge: 'محبوب‌ترین',
        is_default: true,
        delivery_type: pDeliveryType,
        features: [
          'دسترسی کامل به تمامی امکانات نسخه پرو',
          'گارانتی ۳۰ روزه تعویض و عدم قطعی',
          'پشتیبانی ۲۴ ساعته تلگرام',
        ],
      },
      {
        id: 'plan-3m',
        title: 'اشتراک ۳ ماهه اقتصادی',
        duration_days: 90,
        duration_text: '۳ ماهه',
        price_toman: threeMonth,
        original_price_toman: threeMonthOrig,
        base_cost_usd: (pBaseCostUSD || 20) * 2.8,
        badge: 'تخفیف ویژه',
        is_default: false,
        delivery_type: pDeliveryType,
        features: [
          'صرفه‌جویی قابل توجه در هزینه نسبت به ماهانه',
          'گارانتی کامل ۹۰ روزه اختصاصی',
          'اولویت بالا در صف پردازش سفارشات',
        ],
      },
      {
        id: 'plan-1y',
        title: 'اشتراک ۱ ساله ویژه',
        duration_days: 365,
        duration_text: '۱ ساله',
        price_toman: oneYear,
        original_price_toman: oneYearOrig,
        base_cost_usd: (pBaseCostUSD || 20) * 9.5,
        badge: 'بیشترین تخفیف',
        is_default: false,
        delivery_type: pDeliveryType,
        features: [
          'بیشترین صرفه‌جویی و راحتی بدون نیاز به تمدید ماهانه',
          'پشتیبانی VIP و گارانتی ۳۶۵ روزه',
          'دسترسی زودهنگام به مدل‌ها و قابلیت‌های جدید',
        ],
      },
    ]

    setPPlans(defaultPlans)
    setPPlansJSON(JSON.stringify(defaultPlans, null, 2))
  }

  const handleGenerateDefaultSEO = () => {
    const title = pTitleFA.trim() || 'سرویس هوش مصنوعی'
    setPMetaTitle(`خرید ${title} | تحویل آنی و قانونی - آناهیکس`)
    setPMetaDescription(
      pDescription.trim() ||
        `خرید اشتراک قانونی ${title} با تحویل فوری، گارانتی عدم قطعی ۳۰ روزه، پرداخت شتابی و پشتیبانی ۲۴ ساعته در آناهیکس.`,
    )
    setPOgImageURL('/assets/hero.png')
  }

  const handleGenerateDefaultComparison = () => {
    const brand = `${pGroupTag} ${pTitleEN}`.toLowerCase()
    if (brand.includes('chatgpt')) {
      setPComparisonJSON(
        JSON.stringify(
          {
            columns: [
              {
                key: 'free',
                title: 'نسخه رایگان (Free)',
                subtitle: 'کاربری عمومی روزمره',
                highlight: false,
              },
              {
                key: 'plus',
                title: 'نسخه پلاس (ChatGPT Plus)',
                subtitle: 'ارائه شده توسط آناهیکس',
                badge: 'پیشنهاد ما',
                highlight: true,
              },
              {
                key: 'team',
                title: 'نسخه تیمی (Team Plan)',
                subtitle: 'سازمان‌ها و گروه‌ها',
                highlight: false,
              },
            ],
            features: [
              {
                name: 'دسترسی به قدرتمندترین مدل‌ها (GPT-4o و o1)',
                category: 'مدل‌های پردازشی',
                values: {
                  free: 'بسیار محدود',
                  plus: 'نامحدود و کامل',
                  team: 'نامحدود و با سقف دوبرابر',
                },
              },
              {
                name: 'سقف ارسال پیام در هر ۳ ساعت',
                category: 'محدودیت استفاده',
                values: {
                  free: '۱۰ پیام در روز',
                  plus: '۸۰ پیام در هر ۳ ساعت',
                  team: '۱۰۰+ پیام در هر ۳ ساعت',
                },
              },
              {
                name: 'دستیار صوتی زنده (Advanced Voice Mode)',
                category: 'امکانات نسل جدید',
                values: {
                  free: 'غیرفعال',
                  plus: 'فعال با مکالمه آنی و طبیعی',
                  team: 'فعال با پهنای باند اختصاصی',
                },
              },
              {
                name: 'ساخت و شخصی‌سازی GPT اختصاصی (Custom GPTs)',
                category: 'ابزارهای سفارشی',
                values: {
                  free: 'فقط مشاهده',
                  plus: 'ساخت نامحدود + انتشار عمومی',
                  team: 'اشتراک‌گذاری درون‌سازمانی',
                },
              },
              {
                name: 'تحلیل پیشرفته داده‌ها، جداول و کد پایتون',
                category: 'تحلیل و پردازش',
                values: {
                  free: 'محدود به فایل‌های سبک',
                  plus: 'کاملاً نامحدود برای فایل‌های سنگین',
                  team: 'نامحدود با امنیت محرمانه',
                },
              },
              {
                name: 'ضمانت عدم قطعی و پشتیبانی مستقیم ریالی',
                category: 'گارانتی آناهیکس',
                values: {
                  free: 'ندارد',
                  plus: 'ضمانت ۳۰ روزه بازگشت وجه',
                  team: 'پشتیبانی قرارداد تجاری',
                },
              },
            ],
          },
          null,
          2,
        ),
      )
    } else if (brand.includes('gemini')) {
      setPComparisonJSON(
        JSON.stringify(
          {
            columns: [
              {
                key: 'free',
                title: 'گوگل جمینای استاندارد',
                subtitle: 'حساب رایگان گوگل',
                highlight: false,
              },
              {
                key: 'advanced',
                title: 'جمینای ادونس (Gemini Advanced)',
                subtitle: 'لایسنس ۱۸ ماهه آناهیکس',
                badge: 'ارزش خرید بالا',
                highlight: true,
              },
            ],
            features: [
              {
                name: 'مدل هوش مصنوعی',
                category: 'مدل و هوش',
                values: {
                  free: 'Gemini 1.5 Flash',
                  advanced: 'Gemini 1.5 Pro با عمیق‌ترین استدلال',
                },
              },
              {
                name: 'حجم کانتکست (پنجره متنی)',
                category: 'حافظه متنی',
                values: {
                  free: '۳۲ هزار توکن',
                  advanced: '۱ تا ۲ میلیون توکن (تحلیل کتاب و ویدیو)',
                },
              },
              {
                name: 'فضای ذخیره‌سازی ابری Google One',
                category: 'سرویس‌های ابری',
                values: {
                  free: '۱۵ گیگابایت اشتراکی',
                  advanced: '۲ ترابایت (۲,۰۰۰ گیگابایت) ابری گوگل',
                },
              },
              {
                name: 'یکپارچگی هوشمند با Google Docs و Gmail',
                category: 'بهره‌وری Workspace',
                values: {
                  free: 'غیرفعال',
                  advanced: 'دستیار نگارش و خلاصه‌سازی مستقیم در جیمیل',
                },
              },
              {
                name: 'شیوه تحویل و فعال‌سازی',
                category: 'نحوه دریافت',
                values: {
                  free: 'رایگان',
                  advanced: 'تحویل آنی لینک بدون نیاز به پسورد',
                },
              },
            ],
          },
          null,
          2,
        ),
      )
    } else {
      setPComparisonJSON(
        JSON.stringify(
          {
            columns: [
              {
                key: 'standard',
                title: 'پلن پایه / رایگان',
                subtitle: 'امکانات محدود',
                highlight: false,
              },
              {
                key: 'premium',
                title: pTitleFA || 'پلن پریمیوم آناهیکس',
                subtitle: 'ارائه اختصاصی',
                badge: 'بهترین انتخاب',
                highlight: true,
              },
            ],
            features: [
              {
                name: 'دسترسی نامحدود و بدون فیلتر',
                category: 'دسترسی',
                values: {
                  standard: 'با محدودیت و وقفه',
                  premium: 'دسترسی کامل بدون افت کیفیت',
                },
              },
              {
                name: 'سرعت پردازش و اولویت سرور',
                category: 'سرعت',
                values: {
                  standard: 'عادی',
                  premium: 'حداکثر سرعت و بدون صف انتظار',
                },
              },
              {
                name: 'امنیت پرداخت و حساب کاربری',
                category: 'امنیت',
                values: {
                  standard: 'نامشخص',
                  premium: '۱۰۰٪ قانونی با ضمانت عدم مسدودی',
                },
              },
              {
                name: 'پشتیبانی و گارانتی بازگشت وجه',
                category: 'پشتیبانی',
                values: {
                  standard: 'ندارد',
                  premium: 'گارانتی طلایی آناهیکس',
                },
              },
            ],
          },
          null,
          2,
        ),
      )
    }
  }

  const handleGenerateDefaultGuide = () => {
    if (pDeliveryType === 'instant') {
      setPGuideJSON(
        JSON.stringify(
          [
            {
              step_number: 1,
              title: 'انتخاب پلن و پرداخت ریالی',
              description:
                'مدت زمان مد نظر خود را انتخاب کرده و هزینه را از طریق درگاه‌های امن شتابی یا تتر پرداخت فرمایید.',
              icon: 'credit-card',
              tip: 'پس از پرداخت موفق، فوراً به صفحه پیگیری سفارش هدایت می‌شوید.',
            },
            {
              step_number: 2,
              title: 'دریافت آنی لینک یا اطلاعات حساب',
              description:
                'در کسری از ثانیه لینک فعال‌سازی اختصاصی یا مشخصات اکانت در پنل شما قرار می‌گیرد.',
              icon: 'key',
              tip: 'یک نسخه از اطلاعات سفارش نیز از طریق پیامک برای شما ارسال می‌گردد.',
            },
            {
              step_number: 3,
              title: 'تنظیم DNS یا رفع تحریم اولیه',
              description:
                'برای ورود بدون دردسر، اطمینان حاصل فرمایید از اینترنت پایدار و در صورت لزوم DNSهای رفع تحریم نظیر شکن یا الکترو استفاده می‌کنید.',
              icon: 'globe',
              tip: 'دی ان اس پیشنهادی شکن: 178.22.122.100 و 185.51.200.2',
            },
            {
              step_number: 4,
              title: 'ورود و استفاده نامحدود',
              description:
                'روی لینک کلیک کرده یا مشخصات را در وب‌سایت مرجع وارد کنید و بلافاصله از تمامی امکانات پریمیوم لذت ببرید.',
              icon: 'sparkles',
              tip: 'در صورت داشتن هرگونه سوال، تیم فنی آناهیکس آماده پشتیبانی است.',
            },
          ],
          null,
          2,
        ),
      )
    } else {
      setPGuideJSON(
        JSON.stringify(
          [
            {
              step_number: 1,
              title: 'ثبت مشخصات اکانت و پرداخت',
              description:
                'پلن مورد نظر را انتخاب و ایمیل و پسورد اکانت خود را در کادرهای امن ثبت سفارش وارد کنید.',
              icon: 'credit-card',
              tip: 'اطلاعات شما با الگوریتم AES-256 رمزنگاری شده و غیرقابل نفوذ است.',
            },
            {
              step_number: 2,
              title: 'آغاز فعال‌سازی توسط اپراتور',
              description:
                'سفارش شما وارد میز کار اپراتور شده و فرآیند پرداخت ارزی قانونی با کارت معتبر بین‌المللی شروع می‌شود.',
              icon: 'user-check',
              tip: 'زمان معمول انجام این مرحله بین ۱۵ الی ۳۰ دقیقه در ساعات کاری است.',
            },
            {
              step_number: 3,
              title: 'تبادل زنده کد دو مرحله‌ای (2FA)',
              description:
                'در صورت فعال بودن کد تایید دو مرحله‌ای، نوتیفیکیشن لایو در صفحه پیگیری به شما نمایش داده می‌شود تا کد پیامک شده را درج کنید.',
              icon: 'shield-check',
              tip: 'این تبادل بدون نیاز به تماس تلفنی و کاملاً اتوماتیک در مرورگر شما انجام می‌گیرد.',
            },
            {
              step_number: 4,
              title: 'اتمام کار و پاکسازی کامل رمزها (Zeroize)',
              description:
                'اشتراک شما ارتقا یافته و رمز عبور وارد شده بلافاصله برای همیشه از سیستم امحا می‌شود.',
              icon: 'sparkles',
              tip: 'اکانت شخصی شما اکنون آماده استفاده با دسترسی‌های حرفه‌ای است.',
            },
          ],
          null,
          2,
        ),
      )
    }
  }

  const handleGenerateDefaultFaqs = () => {
    setPFaqJSON(
      JSON.stringify(
        [
          {
            question: 'ضمانت این محصول به چه صورت است؟',
            answer:
              'تمامی محصولات ارائه شده در آناهیکس دارای ضمانت کامل اصالت و سلامت در طول کل مدت اشتراک هستند و در صورت بروز هرگونه اختلال، پشتیبانی سریعاً تعویض یا رفع اشکال می‌نماید.',
          },
          {
            question: 'تحویل سفارش چقدر زمان می‌برد؟',
            answer:
              'محصولات با برچسب تحویل آنی ظرف ۰ ثانیه تحویل می‌شوند. سفارشات نیازمند مداخله اپراتور معمولاً بین ۱۵ تا ۳۰ دقیقه در ساعات کاری فعال می‌گردند.',
          },
          {
            question: 'برای ورود به این سرویس چه DNS یا تنظیماتی نیاز است؟',
            answer:
              'به منظور عبور از تحریم‌های منطقه‌ای علیه کاربران ایرانی، پیشنهاد می‌کنیم از دی‌ان‌اس شکن (178.22.122.100) یا نرم‌افزار الکترو استفاده فرمایید.',
          },
          {
            question: 'آیا پس از اتمام دوره امکان تمدید مجدد وجود دارد؟',
            answer:
              'بله، شما می‌توانید پیش از اتمام مهلت اشتراک، سفارش تمدید خود را در سایت ثبت نمایید تا سرویس بدون قطعی ادامه یابد.',
          },
        ],
        null,
        2,
      ),
    )
  }

  const handleToggleProductActive = async (p: AdminProduct) => {
    try {
      const updated = await apiService.adminUpdateProduct(p.id, {
        is_active: !p.is_active,
      })
      setAdminProducts((prev) =>
        prev.map((item) =>
          item.id === p.id ? { ...item, is_active: updated.is_active } : item,
        ),
      )
    } catch (err: any) {
      console.error('Error toggling product active status:', err)
    }
  }

  const openDeleteModal = (p: AdminProduct) => {
    setProductToDelete(p)
    setIsDeleteModalOpen(true)
  }

  // Plans Drag & Drop Handlers
  const handlePlanDragStart = (e: React.DragEvent, idx: number) => {
    setDraggedPlanIdx(idx)
    e.dataTransfer.effectAllowed = 'move'
    e.dataTransfer.setData('text/plain', String(idx))
  }

  const handlePlanDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    e.dataTransfer.dropEffect = 'move'
  }

  const handlePlanDrop = (e: React.DragEvent, targetIdx: number) => {
    e.preventDefault()
    if (draggedPlanIdx === null || draggedPlanIdx === targetIdx) {
      setDraggedPlanIdx(null)
      return
    }

    const updated = [...pPlans]
    const [moved] = updated.splice(draggedPlanIdx, 1)
    updated.splice(targetIdx, 0, moved)

    setPPlans(updated)
    setPPlansJSON(JSON.stringify(updated, null, 2))
    setDraggedPlanIdx(null)
  }

  const movePlan = (fromIdx: number, toIdx: number) => {
    if (toIdx < 0 || toIdx >= pPlans.length) return
    const updated = [...pPlans]
    const [moved] = updated.splice(fromIdx, 1)
    updated.splice(toIdx, 0, moved)
    setPPlans(updated)
    setPPlansJSON(JSON.stringify(updated, null, 2))
  }

  const handleDeleteProductSubmit = async () => {
    if (!productToDelete) return
    setDeleteLoading(true)
    try {
      await apiService.adminDeleteProduct(productToDelete.id)
      setIsDeleteModalOpen(false)
      setProductToDelete(null)
      loadData()
    } catch {
    } finally {
      setDeleteLoading(false)
    }
  }

  const handleExport = async () => {
    setExportLoading(true)
    setIsExportOpen(true)
    try {
      const keys = await apiService.exportInventoryKeys(
        selectedProduct === 'all' ? undefined : selectedProduct,
        selectedStatus === 'all' ? undefined : selectedStatus,
      )
      setExportedKeys(keys)
    } catch {
      setExportedKeys([])
    } finally {
      setExportLoading(false)
    }
  }

  const handleCopyExport = () => {
    navigator.clipboard.writeText(exportedKeys.join('\n'))
    setCopiedExport(true)
    setTimeout(() => setCopiedExport(false), 2000)
  }

  const handleReplaceKeySubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setReplaceLoading(true)
    setReplaceSuccessMsg('')
    setReplaceErrorMsg('')
    try {
      const res = await apiService.replaceInventoryKey(
        replaceOrderId,
        replaceOldItemId,
        replaceReason,
      )
      setReplaceSuccessMsg(
        `کلید جدید با شناسه #${res.new_inventory_item_id} با موفقیت جایگزین شد.`,
      )
      setTimeout(() => {
        setIsReplaceOpen(false)
        setReplaceSuccessMsg('')
        setReplaceOrderId('')
        setReplaceOldItemId('')
        loadData()
      }, 2000)
    } catch (err: any) {
      setReplaceErrorMsg(err.message || 'خطا در تعویض کلید')
    } finally {
      setReplaceLoading(false)
    }
  }

  const filteredAdminProducts = adminProducts.filter((p) => {
    const q = catalogSearch.toLowerCase().trim()
    const matchesSearch =
      !q ||
      p.title_fa?.toLowerCase().includes(q) ||
      p.title?.toLowerCase().includes(q) ||
      p.slug?.toLowerCase().includes(q) ||
      p.group_tag?.toLowerCase().includes(q)

    const matchesGroup =
      catalogGroupFilter === 'all' || p.group_tag === catalogGroupFilter
    const matchesCategory =
      catalogCategoryFilter === 'all' || p.category === catalogCategoryFilter

    return matchesSearch && matchesGroup && matchesCategory
  })

  const filteredItems = items.filter((it) => {
    if (!searchQuery.trim()) return true
    const q = searchQuery.toLowerCase()
    return (
      it.product_title?.toLowerCase().includes(q) ||
      it.payload_preview?.toLowerCase().includes(q) ||
      it.batch_tag?.toLowerCase().includes(q)
    )
  })

  return (
    <div className="space-y-6">
      {/* Top Header & Subtabs */}
      <AdminHeaderBanner
        icon={Package}
        title="محصولات و انبار لایسنس‌ها"
        subtitle="کاتالوگ، موجودی انبار لایسنس‌ها و قیمت‌گذاری محصولات"
        badgeText="کاتالوگ و انبارداری"
      />

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border/80 pb-4">
        <div className="flex items-center gap-1.5 bg-muted/40 p-1 rounded-surface border border-border/60 overflow-x-auto scrollbar-none">
          <button
            type="button"
            onClick={() => setActiveSubtab('catalog')}
            className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-control text-xs duration-motion ease-motion transition-all cursor-pointer ${
              activeSubtab === 'catalog'
                ? 'bg-primary text-primary-foreground font-black shadow-control'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            <Package className="h-3.5 w-3.5" />
            <span>کاتالوگ محصولات ({adminProducts.length})</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveSubtab('inventory')}
            className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-control text-xs duration-motion ease-motion transition-all cursor-pointer ${
              activeSubtab === 'inventory'
                ? 'bg-primary text-primary-foreground font-black shadow-control'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            <Key className="h-3.5 w-3.5" />
            <span>موجودی لایسنس و کلیدها</span>
          </button>
        </div>
      </div>

      {/* Metrics Row for Catalog */}
      {activeSubtab === 'catalog' && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-right">
          <div className="rounded-2xl border border-border bg-card p-4 shadow-sm">
            <span className="text-[11px] font-medium text-muted-foreground block">
              کل محصولات کاتالوگ
            </span>
            <span className="text-xl font-black text-foreground mt-1 block font-mono">
              {adminProducts.length.toLocaleString('fa-IR')}
            </span>
          </div>
          <div className="rounded-2xl border border-emerald-500/20 bg-emerald-500/5 p-4 shadow-sm">
            <span className="text-[11px] font-medium text-emerald-600 dark:text-emerald-400 block">
              فعال در ویترین فروشگاه
            </span>
            <span className="text-xl font-black text-emerald-600 dark:text-emerald-400 mt-1 block font-mono">
              {adminProducts
                .filter((p) => p.is_active)
                .length.toLocaleString('fa-IR')}
            </span>
          </div>
          <div className="rounded-2xl border border-blue-500/20 bg-blue-500/5 p-4 shadow-sm">
            <span className="text-[11px] font-medium text-blue-600 dark:text-blue-400 block">
              تحویل آنی کلید / وب‌هوک
            </span>
            <span className="text-xl font-black text-blue-600 dark:text-blue-400 mt-1 block font-mono">
              {adminProducts
                .filter((p) => p.delivery_type === 'instant')
                .length.toLocaleString('fa-IR')}
            </span>
          </div>
          <div className="rounded-2xl border border-purple-500/20 bg-purple-500/5 p-4 shadow-sm">
            <span className="text-[11px] font-medium text-purple-600 dark:text-purple-400 block">
              ارتقای دستی / اپراتور (Mode C)
            </span>
            <span className="text-xl font-black text-purple-600 dark:text-purple-400 mt-1 block font-mono">
              {adminProducts
                .filter((p) => p.delivery_type === 'manual_timed')
                .length.toLocaleString('fa-IR')}
            </span>
          </div>
        </div>
      )}

      {/* Metrics Row for Inventory */}
      {activeSubtab === 'inventory' && stats && (
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 text-right">
          <div className="rounded-2xl border border-border bg-card p-4 shadow-sm">
            <span className="text-[11px] font-medium text-muted-foreground block">
              کل موجودی انبار
            </span>
            <span className="text-xl font-black text-foreground mt-1 block font-mono">
              {stats.total_count.toLocaleString('fa-IR')}
            </span>
          </div>
          <div className="rounded-2xl border border-emerald-500/20 bg-emerald-500/5 p-4 shadow-sm">
            <span className="text-[11px] font-medium text-emerald-600 dark:text-emerald-400 block">
              موجود و آماده تحویل
            </span>
            <span className="text-xl font-black text-emerald-600 dark:text-emerald-400 mt-1 block font-mono">
              {stats.available_count.toLocaleString('fa-IR')}
            </span>
          </div>
          <div className="rounded-2xl border border-amber-500/20 bg-amber-500/5 p-4 shadow-sm">
            <span className="text-[11px] font-medium text-amber-600 dark:text-amber-400 block">
              رزرو شده موقت
            </span>
            <span className="text-xl font-black text-amber-600 dark:text-amber-400 mt-1 block font-mono">
              {stats.reserved_count.toLocaleString('fa-IR')}
            </span>
          </div>
          <div className="rounded-2xl border border-blue-500/20 bg-blue-500/5 p-4 shadow-sm">
            <span className="text-[11px] font-medium text-blue-600 dark:text-blue-400 block">
              فروخته و تحویل شده
            </span>
            <span className="text-xl font-black text-blue-600 dark:text-blue-400 mt-1 block font-mono">
              {stats.sold_delivered_count.toLocaleString('fa-IR')}
            </span>
          </div>
          <div className="rounded-2xl border border-rose-500/20 bg-rose-500/5 p-4 shadow-sm col-span-2 sm:col-span-1">
            <span className="text-[11px] font-medium text-rose-600 dark:text-rose-400 block">
              سوخته یا ابطال شده
            </span>
            <span className="text-xl font-black text-rose-600 dark:text-rose-400 mt-1 block font-mono">
              {stats.void_count.toLocaleString('fa-IR')}
            </span>
          </div>
        </div>
      )}

      {/* SUBTAB 0: PRODUCT CATALOG MANAGEMENT */}
      {activeSubtab === 'catalog' && (
        <div className="space-y-4">
          {/* Action & Filter Toolbar */}
          <div className="rounded-2xl border border-border bg-card p-4 flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-2">
              {/* Category Filter */}
              <select
                aria-label="فیلتر دسته‌بندی"
                value={catalogCategoryFilter}
                onChange={(e) => setCatalogCategoryFilter(e.target.value)}
                className="h-9 px-3 rounded-xl border border-border bg-background text-xs font-medium focus:outline-none focus:ring-1 focus:ring-blue-500"
              >
                <option value="all">همه دسته‌بندی‌ها</option>
                <option value="ai_chat">هوش مصنوعی و چت‌بات</option>
                <option value="coding_ai">دستیار کدنویسی</option>
                <option value="ai_account">اکانت اختصاصی</option>
                <option value="personal_upgrade">ارتقای اکانت شخصی</option>
                <option value="vpn">فیلترشکن و شبکه</option>
                <option value="api_key">کلید API</option>
              </select>

              {/* Group Tag Filter */}
              <select
                aria-label="فیلتر برند و گروه"
                value={catalogGroupFilter}
                onChange={(e) => setCatalogGroupFilter(e.target.value)}
                className="h-9 px-3 rounded-xl border border-border bg-background text-xs font-medium focus:outline-none focus:ring-1 focus:ring-blue-500"
              >
                <option value="all">همه گروه‌ها و برندها</option>
                <option value="chatgpt">ChatGPT / OpenAI</option>
                <option value="claude">Claude / Anthropic</option>
                <option value="gemini">Gemini / Google</option>
                <option value="cursor">Cursor AI</option>
                <option value="vpn">VPN / شبکه</option>
                <option value="general">عمومی (General)</option>
              </select>

              {/* Search Box with Debounce & Clear */}
              <div className="w-56">
                <SearchInput
                  value={catalogSearch}
                  onChange={setCatalogSearch}
                  placeholder="جستجو در عنوان، اسلاگ..."
                  debounceMs={250}
                />
              </div>

              <button
                type="button"
                onClick={() => loadData()}
                className="h-9 w-9 flex items-center justify-center rounded-xl border border-border hover:bg-muted text-muted-foreground hover:text-foreground transition"
                title="تازه‌سازی لیست"
              >
                <RefreshCw
                  className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`}
                />
              </button>
            </div>

            {/* Create Product Button: Graphite technical minimal - Primary white button */}
            <button
              type="button"
              onClick={openCreateProductModal}
              className="h-9 px-4 rounded-control bg-primary hover:bg-primary-hover text-primary-foreground text-xs font-black duration-motion ease-motion active:scale-[0.98] shadow-control transition-all flex items-center gap-1.5 cursor-pointer"
            >
              <Plus className="h-4 w-4" />
              <span>ایجاد محصول جدید</span>
            </button>
          </div>

          {/* Products Table */}
          <div className="rounded-2xl border border-border bg-card overflow-hidden shadow-sm">
            {loading ? (
              <div className="py-20 flex flex-col items-center justify-center text-muted-foreground gap-3">
                <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
                <span className="text-xs">
                  در حال بارگذاری کاتالوگ محصولات...
                </span>
              </div>
            ) : filteredAdminProducts.length === 0 ? (
              <div className="py-16 text-center text-muted-foreground space-y-3">
                <Package className="h-12 w-12 mx-auto text-muted-foreground/40 stroke-1" />
                <div className="text-sm font-semibold">
                  محصولی در کاتالوگ یافت نشد
                </div>
                <p className="text-xs max-w-sm mx-auto text-muted-foreground/70">
                  محصولات پیش‌فرض هاردکد با موفقیت حذف شدند. اکنون می‌توانید اولین
                  محصول فروشگاه را با مشخصات دلخواه ایجاد کنید.
                </p>
                <button
                  type="button"
                  onClick={openCreateProductModal}
                  className="mt-2 inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition"
                >
                  <Plus className="h-4 w-4" />
                  <span>ایجاد اولین محصول</span>
                </button>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-center text-xs">
                  <thead className="bg-muted/40 text-muted-foreground border-b border-border text-[11px] font-semibold select-none">
                    <tr>
                      <th className="p-3.5 text-right pr-6">
                        محصول، تصویر و عنوان
                      </th>
                      <th className="p-3.5 text-center">
                        دسته‌بندی و شیوه تحویل
                      </th>
                      <th className="p-3.5 text-center">قیمت فروش</th>
                      <th className="p-3.5 text-center">قیمت تمام‌شده</th>
                      <th className="p-3.5 text-center">موجودی / SLA</th>
                      <th className="p-3.5 text-center">وضعیت</th>
                      <th className="p-3.5 text-center">عملیات</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {filteredAdminProducts.map((p) => (
                      <tr key={p.id} className="hover:bg-muted/30 transition">
                        <td className="p-3.5 text-right pr-6">
                          <div className="flex items-center gap-3">
                            <div className="relative w-12 h-12 rounded-control bg-secondary border border-border/60 overflow-hidden shrink-0 flex items-center justify-center">
                              {p.image_url ? (
                                <img
                                  src={p.image_url}
                                  alt={p.title_fa}
                                  className="w-full h-full object-cover"
                                />
                              ) : (
                                <Package className="w-6 h-6 text-muted-foreground/50" />
                              )}
                              {p.icon_url && (
                                <img
                                  src={p.icon_url}
                                  alt="آیکون"
                                  className="absolute bottom-0.5 right-0.5 w-4 h-4 rounded-full bg-card p-0.5 border border-border/60 shadow-xs"
                                />
                              )}
                            </div>
                            <div>
                              <div className="font-bold text-foreground flex items-center gap-2">
                                <span>{p.title_fa}</span>
                                {p.group_tag && (
                                  <span className="text-[10px] px-2 py-0.5 rounded-control bg-brand/10 text-brand font-mono font-latin">
                                    {p.group_tag}
                                  </span>
                                )}
                              </div>
                              <div className="text-[11px] text-muted-foreground mt-0.5 flex items-center gap-1.5 font-latin">
                                <span>{p.title}</span>
                                <span className="text-[10px] text-muted-foreground/70">
                                  ({p.slug})
                                </span>
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="p-3.5 text-center">
                          <div className="flex flex-col gap-1 items-center justify-center">
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-secondary text-secondary-foreground">
                              {p.category === 'ai_chat'
                                ? 'هوش مصنوعی'
                                : p.category === 'coding_ai'
                                  ? 'دستیار کد'
                                  : p.category === 'personal_upgrade'
                                    ? 'ارتقای اکانت'
                                    : p.category === 'vpn'
                                      ? 'شبکه و VPN'
                                      : p.category}
                            </span>
                            <span
                              className={`text-[10px] font-semibold flex items-center gap-1 ${
                                p.delivery_type === 'instant'
                                  ? 'text-emerald-500'
                                  : 'text-amber-500'
                              }`}
                            >
                              {p.delivery_type === 'instant'
                                ? '⚡ تحویل آنی خودکار'
                                : '👤 دستی اپراتور (Mode C)'}
                            </span>
                          </div>
                        </td>
                        <td className="p-3.5 font-bold font-mono text-foreground text-center font-latin">
                          {p.price_toman.toLocaleString('fa-IR')}{' '}
                          <span className="text-[10px] font-normal text-muted-foreground font-sans">
                            تومان
                          </span>
                        </td>
                        <td className="p-3.5 font-mono text-muted-foreground text-center font-latin">
                          {p.base_cost_usd > 0 ? (
                            <div className="group/cost relative inline-block cursor-help">
                              <span className="border-b border-dashed border-border/80 hover:text-foreground transition-colors font-bold">
                                ${p.base_cost_usd.toFixed(2)}
                              </span>
                              {/* Hover Tooltip showing Toman equivalent */}
                              <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 hidden group-hover/cost:flex flex-col items-center z-[130] pointer-events-none whitespace-nowrap animate-in fade-in zoom-in-95">
                                <div className="bg-popover text-popover-foreground border border-border px-3 py-1.5 rounded-control shadow-xl text-xs text-right font-sans">
                                  <div className="font-bold text-foreground flex items-center gap-1">
                                    <Coins className="w-3.5 h-3.5 text-emerald-500" />
                                    <span>قیمت تمام‌شده به تومان:</span>
                                  </div>
                                  <div className="font-mono font-latin text-emerald-500 font-bold text-sm mt-0.5">
                                    {Math.round(
                                      p.base_cost_usd * 98500,
                                    ).toLocaleString('fa-IR')}{' '}
                                    تومان
                                  </div>
                                  <div className="text-[10px] text-muted-foreground mt-0.5">
                                    بر مبنای نرخ حواله دلار / تتر (۹۸,۵۰۰ تومان)
                                  </div>
                                </div>
                                <div className="w-2 h-2 bg-popover border-b border-r border-border rotate-45 -mt-1" />
                              </div>
                            </div>
                          ) : (
                            <span className="text-muted-foreground/40">-</span>
                          )}
                        </td>
                        <td className="p-3.5 text-center">
                          {p.delivery_type === 'instant' ? (
                            <div className="flex items-center justify-center gap-1.5 font-mono font-latin">
                              <span
                                className={`h-2 w-2 rounded-full ${
                                  (p.available_stock ?? 0) > 0
                                    ? 'bg-emerald-500'
                                    : 'bg-rose-500'
                                }`}
                              />
                              <span className="font-mono font-bold">
                                {(p.available_stock ?? 0).toLocaleString(
                                  'fa-IR',
                                )}
                              </span>
                              <span className="text-[10px] text-muted-foreground font-sans">
                                کلید موجود
                              </span>
                            </div>
                          ) : (
                            <div className="text-[11px] text-muted-foreground text-center">
                              {p.sla_display_text ||
                                `${p.sla_min_minutes} الی ${p.sla_max_minutes} دقیقه`}
                            </div>
                          )}
                        </td>
                        <td className="p-3.5 text-center">
                          <button
                            type="button"
                            onClick={() => handleToggleProductActive(p)}
                            className={`px-2.5 py-1 rounded-control text-[10px] font-bold transition flex items-center justify-center gap-1 mx-auto cursor-pointer border ${
                              p.is_active
                                ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/30'
                                : 'bg-muted text-muted-foreground border-border/60 hover:bg-muted/80'
                            }`}
                            title="کلیک برای تغییر وضعیت"
                          >
                            <span
                              className={`h-1.5 w-1.5 rounded-full ${p.is_active ? 'bg-emerald-500' : 'bg-muted-foreground'}`}
                            />
                            <span>
                              {p.is_active ? 'فعال در فروشگاه' : 'غیرفعال'}
                            </span>
                          </button>
                        </td>
                        <td className="p-3.5 text-center">
                          <div className="flex items-center justify-center gap-1.5">
                            <a
                              href={`/products/${p.slug}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="h-8 w-8 rounded-control border border-border/60 bg-secondary flex items-center justify-center text-muted-foreground hover:text-emerald-500 hover:bg-muted transition shadow-xs"
                              title="مشاهده صفحه اختصاصی محصول در فروشگاه (PDP)"
                            >
                              <ExternalLink className="h-3.5 w-3.5" />
                            </a>
                            <button
                              type="button"
                              onClick={() => openEditProductModal(p)}
                              className="h-8 w-8 rounded-control border border-border/60 bg-secondary flex items-center justify-center text-muted-foreground hover:text-brand hover:bg-muted transition shadow-xs cursor-pointer"
                              title="ویرایش محصول"
                            >
                              <Edit2 className="h-3.5 w-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() => openDeleteModal(p)}
                              className="h-8 w-8 rounded-control border border-destructive/20 bg-secondary flex items-center justify-center text-destructive hover:bg-destructive/10 transition shadow-xs cursor-pointer"
                              title="حذف محصول"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* SUBTAB 1: INVENTORY & KEYS */}
      {activeSubtab === 'inventory' && (
        <div className="space-y-4">
          {/* Action & Filter Toolbar */}
          <div className="rounded-2xl border border-border bg-card p-4 flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-2">
              {/* Product Select */}
              <select
                aria-label="فیلتر بر اساس محصول"
                value={selectedProduct}
                onChange={(e) => setSelectedProduct(e.target.value)}
                className="h-9 px-3 rounded-xl border border-border bg-background text-xs font-medium focus:outline-none focus:ring-1 focus:ring-blue-500"
              >
                <option value="all">همه محصولات</option>
                {adminProducts.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.title_fa}
                  </option>
                ))}
              </select>

              {/* Status Select */}
              <select
                aria-label="فیلتر بر اساس وضعیت"
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value)}
                className="h-9 px-3 rounded-xl border border-border bg-background text-xs font-medium focus:outline-none focus:ring-1 focus:ring-blue-500"
              >
                <option value="all">همه وضعیت‌ها</option>
                <option value="available">موجود (Available)</option>
                <option value="reserved">رزرو شده (Reserved)</option>
                <option value="sold">فروخته شده (Sold)</option>
                <option value="void">سوخته/باطل (Void)</option>
              </select>

              {/* Search Box with Debounce & Clear */}
              <div className="w-56">
                <SearchInput
                  value={searchQuery}
                  onChange={setSearchQuery}
                  placeholder="جستجو در کلیدها، عنوان، برچسب..."
                  debounceMs={250}
                />
              </div>

              <button
                type="button"
                onClick={() => loadData()}
                className="h-9 w-9 flex items-center justify-center rounded-xl border border-border hover:bg-muted text-muted-foreground hover:text-foreground transition"
                title="تازه‌سازی"
              >
                <RefreshCw
                  className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`}
                />
              </button>
            </div>

            {/* Export & Replace Buttons */}
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setIsReplaceOpen(true)}
                className="h-9 px-3 rounded-xl border border-border hover:bg-muted text-foreground text-xs font-medium transition flex items-center gap-1.5"
              >
                <RefreshCw className="h-3.5 w-3.5 text-blue-600" />
                <span>تعویض کلید سفارش (گارانتی)</span>
              </button>
              <button
                type="button"
                onClick={handleExport}
                className="h-9 px-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition flex items-center gap-1.5 shadow-sm hover:shadow-blue-500/20"
              >
                <Download className="h-3.5 w-3.5" />
                <span>خروجی گرفتن از کلیدها (Export)</span>
              </button>
            </div>
          </div>

          {/* Inventory Table */}
          <div className="rounded-2xl border border-border bg-card overflow-hidden shadow-sm">
            {loading ? (
              <div className="py-20 flex flex-col items-center justify-center text-muted-foreground gap-3">
                <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
                <span className="text-xs">در حال بارگذاری لیست انبار...</span>
              </div>
            ) : filteredItems.length === 0 ? (
              <div className="py-16 text-center text-muted-foreground space-y-2">
                <Key className="h-10 w-10 mx-auto text-muted-foreground/50 stroke-1" />
                <div className="text-xs font-medium">
                  کلیدی با این مشخصات یافت نشد
                </div>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-center text-xs">
                  <thead className="bg-muted/40 text-muted-foreground border-b border-border text-[11px] font-semibold select-none">
                    <tr>
                      <th className="p-3.5 text-center">شناسه</th>
                      <th className="p-3.5 text-center">محصول متصل</th>
                      <th className="p-3.5 text-center">
                        پیش‌نمایش کلید / محتوا
                      </th>
                      <th className="p-3.5 text-center">وضعیت</th>
                      <th className="p-3.5 text-center">برچسب پارت</th>
                      <th className="p-3.5 text-center">سفارش متصل</th>
                      <th className="p-3.5 text-center">تاریخ ثبت</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {filteredItems.map((it) => (
                      <tr key={it.id} className="hover:bg-muted/30 transition">
                        <td className="p-3.5 font-mono text-muted-foreground text-center font-latin">
                          #{it.id}
                        </td>
                        <td className="p-3.5 font-medium text-foreground text-center">
                          {it.product_title || 'سرویس نامشخص'}
                        </td>
                        <td className="p-3.5 font-mono text-[11px] text-muted-foreground/90 max-w-[220px] truncate text-center font-latin mx-auto">
                          {it.payload_preview}
                        </td>
                        <td className="p-3.5 text-center">
                          <span
                            className={`px-2.5 py-0.5 rounded-control text-[10px] font-bold border ${
                              it.status === 'available'
                                ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/30'
                                : it.status === 'reserved'
                                  ? 'bg-amber-500/10 text-amber-500 border-amber-500/30'
                                  : it.status === 'sold'
                                    ? 'bg-brand/10 text-brand border-brand/30'
                                    : 'bg-rose-500/10 text-rose-500 border-rose-500/30'
                            }`}
                          >
                            {it.status === 'available'
                              ? 'موجود'
                              : it.status === 'reserved'
                                ? 'رزرو شده'
                                : it.status === 'sold'
                                  ? 'فروخته شده'
                                  : 'سوخته/باطل'}
                          </span>
                        </td>
                        <td className="p-3.5 font-mono text-[11px] text-muted-foreground text-center font-latin">
                          {it.batch_tag || '-'}
                        </td>
                        <td className="p-3.5 font-mono text-muted-foreground text-center font-latin">
                          {it.reserved_order_id ? (
                            <span className="text-brand font-bold">
                              #{it.reserved_order_id.slice(0, 8)}...
                            </span>
                          ) : (
                            '-'
                          )}
                        </td>
                        <td className="p-3.5 text-muted-foreground text-[11px] text-center font-mono font-latin">
                          {it.created_at
                            ? new Date(it.created_at).toLocaleDateString(
                                'fa-IR',
                              )
                            : '-'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* CREATE / EDIT PRODUCT MODAL (ENHANCED WITH PDP & SEO CAPABILITIES) */}
      {isProductModalOpen &&
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
              <div className="max-w-4xl w-full bg-card rounded-surface border border-border/80 shadow-overlay overflow-hidden my-auto animate-in zoom-in-95 duration-200 text-foreground">
                {/* Modal Header */}
                <div className="p-5 border-b border-border bg-muted/30">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2.5">
                      <div className="h-9 w-9 rounded-xl bg-blue-600/10 text-blue-600 flex items-center justify-center">
                        <Package className="h-5 w-5" />
                      </div>
                      <div>
                        <h3 className="text-sm font-black text-foreground">
                          {editingProduct
                            ? `ویرایش محصول: ${pTitleFA || editingProduct.title_fa}`
                            : 'ایجاد محصول جدید در کاتالوگ فروشگاه'}
                        </h3>
                        <p className="text-[11px] text-muted-foreground">
                          مدیریت کامل اطلاعات، سئو، پلن‌های زمانی، جدول مقایسه و
                          راهنمای فعال‌سازی
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {editingProduct && pSlug && (
                        <a
                          href={`/products/${pSlug}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="px-2.5 py-1 rounded-lg border border-border bg-background text-[11px] font-semibold text-muted-foreground hover:text-foreground flex items-center gap-1.5 transition"
                        >
                          <ExternalLink className="h-3 w-3" />
                          <span>مشاهده در فروشگاه</span>
                        </a>
                      )}
                      <ModalCloseButton
                        onClick={() => setIsProductModalOpen(false)}
                        size="sm"
                      />
                    </div>
                  </div>

                  {/* Navigation Tabs for PDP Configuration */}
                  <div className="flex items-center gap-1.5 p-1 bg-muted/40 rounded-surface border border-border/60 overflow-x-auto pt-1 scrollbar-none">
                    <button
                      type="button"
                      onClick={() => setProductModalTab('general')}
                      className={`px-3.5 py-1.5 rounded-control text-xs font-bold transition flex items-center gap-1.5 whitespace-nowrap cursor-pointer duration-motion active:scale-[0.98] ${
                        productModalTab === 'general'
                          ? 'bg-primary text-primary-foreground font-black shadow-control'
                          : 'text-muted-foreground hover:text-foreground hover:bg-muted/60'
                      }`}
                    >
                      <Package className="h-3.5 w-3.5" />
                      <span>مشخصات پایه و فروش</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setProductModalTab('seo')}
                      className={`px-3.5 py-1.5 rounded-control text-xs font-bold transition flex items-center gap-1.5 whitespace-nowrap cursor-pointer duration-motion active:scale-[0.98] ${
                        productModalTab === 'seo'
                          ? 'bg-primary text-primary-foreground font-black shadow-control'
                          : 'text-muted-foreground hover:text-foreground hover:bg-muted/60'
                      }`}
                    >
                      <Globe className="h-3.5 w-3.5" />
                      <span>سئو و شبکه‌های اجتماعی</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setProductModalTab('plans')}
                      className={`px-3.5 py-1.5 rounded-control text-xs font-bold transition flex items-center gap-1.5 whitespace-nowrap cursor-pointer duration-motion active:scale-[0.98] ${
                        productModalTab === 'plans'
                          ? 'bg-primary text-primary-foreground font-black shadow-control'
                          : 'text-muted-foreground hover:text-foreground hover:bg-muted/60'
                      }`}
                    >
                      <Calendar className="h-3.5 w-3.5" />
                      <span>پلن‌ها و دوره‌ها ({pPlans.length || 'پیش‌فرض'})</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setProductModalTab('comparison')}
                      className={`px-3.5 py-1.5 rounded-control text-xs font-bold transition flex items-center gap-1.5 whitespace-nowrap cursor-pointer duration-motion active:scale-[0.98] ${
                        productModalTab === 'comparison'
                          ? 'bg-primary text-primary-foreground font-black shadow-control'
                          : 'text-muted-foreground hover:text-foreground hover:bg-muted/60'
                      }`}
                    >
                      <Table className="h-3.5 w-3.5" />
                      <span>جدول مقایسه</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setProductModalTab('guide')}
                      className={`px-3.5 py-1.5 rounded-control text-xs font-bold transition flex items-center gap-1.5 whitespace-nowrap cursor-pointer duration-motion active:scale-[0.98] ${
                        productModalTab === 'guide'
                          ? 'bg-primary text-primary-foreground font-black shadow-control'
                          : 'text-muted-foreground hover:text-foreground hover:bg-muted/60'
                      }`}
                    >
                      <Sparkles className="h-3.5 w-3.5" />
                      <span>راهنمای فعال‌سازی</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setProductModalTab('faq')}
                      className={`px-3.5 py-1.5 rounded-control text-xs font-bold transition flex items-center gap-1.5 whitespace-nowrap cursor-pointer duration-motion active:scale-[0.98] ${
                        productModalTab === 'faq'
                          ? 'bg-primary text-primary-foreground font-black shadow-control'
                          : 'text-muted-foreground hover:text-foreground hover:bg-muted/60'
                      }`}
                    >
                      <HelpCircle className="h-3.5 w-3.5" />
                      <span>سوالات متداول (FAQ)</span>
                    </button>
                  </div>
                </div>

                <form
                  onSubmit={handleProductSubmit}
                  className="p-5 space-y-4 max-h-[72vh] overflow-y-auto text-xs"
                >
                  {productFormError && (
                    <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-600 dark:text-rose-400 flex items-center gap-2">
                      <AlertCircle className="h-4 w-4 shrink-0" />
                      <span>{productFormError}</span>
                    </div>
                  )}

                  {/* TAB 1: GENERAL SETTINGS */}
                  {productModalTab === 'general' && (
                    <div className="space-y-4">
                      {/* Persian & English Titles */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div>
                          <label
                            htmlFor="p-title-fa"
                            className="font-bold text-foreground block mb-1"
                          >
                            عنوان فارسی محصول{' '}
                            <span className="text-rose-500">*</span>
                          </label>
                          <input
                            id="p-title-fa"
                            type="text"
                            required
                            placeholder="مثال: اکانت چت‌جی‌پی‌تی پلاس ۱ ماهه"
                            value={pTitleFA}
                            onChange={(e) => setPTitleFA(e.target.value)}
                            className="w-full h-9 px-3 rounded-xl border border-border bg-background focus:outline-none focus:ring-1 focus:ring-blue-500"
                          />
                        </div>
                        <div>
                          <label
                            htmlFor="p-title-en"
                            className="font-bold text-foreground block mb-1"
                          >
                            عنوان انگلیسی محصول{' '}
                            <span className="text-rose-500">*</span>
                          </label>
                          <input
                            id="p-title-en"
                            type="text"
                            required
                            placeholder="مثال: ChatGPT Plus 1 Month"
                            value={pTitleEN}
                            onChange={(e) => setPTitleEN(e.target.value)}
                            className="w-full h-9 px-3 rounded-xl border border-border bg-background focus:outline-none focus:ring-1 focus:ring-blue-500 font-mono"
                          />
                        </div>
                      </div>

                      {/* Slug & Group Tag */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div>
                          <label
                            htmlFor="p-slug"
                            className="font-bold text-foreground block mb-1"
                          >
                            اسلاگ یکتا URL (Slug)
                          </label>
                          <input
                            id="p-slug"
                            type="text"
                            placeholder="مثال: chatgpt-plus-personal (خالی = خودکار)"
                            value={pSlug}
                            onChange={(e) => setPSlug(e.target.value)}
                            className="w-full h-9 px-3 rounded-xl border border-border bg-background focus:outline-none focus:ring-1 focus:ring-blue-500 font-mono"
                          />
                          <span className="text-[10px] text-muted-foreground mt-0.5 block font-mono">
                            آدرس روت اختصاصی: /products/{pSlug || '...'}
                          </span>
                        </div>
                        <div>
                          <label
                            htmlFor="p-group-tag"
                            className="font-bold text-foreground block mb-1"
                          >
                            گروه برند (Group Tag)
                          </label>
                          <select
                            id="p-group-tag"
                            value={pGroupTag}
                            onChange={(e) => setPGroupTag(e.target.value)}
                            className="w-full h-9 px-3 rounded-xl border border-border bg-background focus:outline-none focus:ring-1 focus:ring-blue-500"
                          >
                            <option value="general">عمومی (General)</option>
                            <option value="chatgpt">ChatGPT / OpenAI</option>
                            <option value="claude">Claude / Anthropic</option>
                            <option value="gemini">Gemini / Google</option>
                            <option value="cursor">Cursor AI</option>
                            <option value="vpn">سرویس‌های VPN</option>
                          </select>
                        </div>
                      </div>

                      {/* Category & Delivery Type */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div>
                          <label
                            htmlFor="p-category"
                            className="font-bold text-foreground block mb-1"
                          >
                            دسته‌بندی فروشگاه
                          </label>
                          <select
                            id="p-category"
                            value={pCategory}
                            onChange={(e) => setPCategory(e.target.value)}
                            className="w-full h-9 px-3 rounded-xl border border-border bg-background focus:outline-none focus:ring-1 focus:ring-blue-500"
                          >
                            <option value="ai_chat">
                              هوش مصنوعی و چت‌بات (ai_chat)
                            </option>
                            <option value="coding_ai">
                              دستیار کدنویسی (coding_ai)
                            </option>
                            <option value="personal_upgrade">
                              ارتقای اکانت شخصی (personal_upgrade)
                            </option>
                            <option value="ai_account">
                              اکانت اختصاصی آماده (ai_account)
                            </option>
                            <option value="vpn">
                              فیلترشکن و دور زدن تحریم (vpn)
                            </option>
                            <option value="api_key">
                              کلید API و توسعه‌دهنده (api_key)
                            </option>
                            <option value="digital_code">
                              کد دیجیتال و گیفت‌کارت (digital_code)
                            </option>
                          </select>
                        </div>
                        <div>
                          <label
                            htmlFor="p-delivery-type"
                            className="font-bold text-foreground block mb-1"
                          >
                            شیوه تحویل محصول
                          </label>
                          <select
                            id="p-delivery-type"
                            value={pDeliveryType}
                            onChange={(e) =>
                              setPDeliveryType(e.target.value as any)
                            }
                            className="w-full h-9 px-3 rounded-xl border border-border bg-background focus:outline-none focus:ring-1 focus:ring-blue-500"
                          >
                            <option value="instant">
                              تحویل آنی خودکار (تخصیص کلید از انبار یا وب‌هوک)
                            </option>
                            <option value="manual_timed">
                              تحویل دستی اپراتور (صف کاری / تبادل کد ۲FA)
                            </option>
                          </select>
                        </div>
                      </div>

                      {/* Prices: Toman & USD */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div>
                          <label
                            htmlFor="p-price-toman"
                            className="font-bold text-foreground block mb-1"
                          >
                            قیمت پیش‌فرض فروش (تومان){' '}
                            <span className="text-rose-500">*</span>
                          </label>
                          <input
                            id="p-price-toman"
                            type="number"
                            min={1000}
                            step={1000}
                            required
                            value={pPriceToman}
                            onChange={(e) =>
                              setPPriceToman(Number(e.target.value))
                            }
                            className="w-full h-9 px-3 rounded-xl border border-border bg-background focus:outline-none focus:ring-1 focus:ring-blue-500 font-mono"
                          />
                          <span className="text-[10px] text-muted-foreground mt-0.5 block">
                            {pPriceToman > 0
                              ? `${Number(pPriceToman).toLocaleString('fa-IR')} تومان`
                              : ''}
                          </span>
                        </div>
                        <div>
                          <label
                            htmlFor="p-base-usd"
                            className="font-bold text-foreground block mb-1"
                          >
                            قیمت تمام‌شده دلاری (USD)
                          </label>
                          <input
                            id="p-base-usd"
                            type="number"
                            min={0}
                            step={0.01}
                            value={pBaseCostUSD}
                            onChange={(e) =>
                              setPBaseCostUSD(Number(e.target.value))
                            }
                            className="w-full h-9 px-3 rounded-xl border border-border bg-background focus:outline-none focus:ring-1 focus:ring-blue-500 font-mono"
                          />
                          <span className="text-[10px] text-muted-foreground mt-0.5 block">
                            هزینه خرید یا تأمین از پرووایدر
                          </span>
                        </div>
                      </div>

                      {/* SLA Min/Max & SLA Text */}
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                        <div>
                          <label
                            htmlFor="p-sla-min"
                            className="font-bold text-foreground block mb-1"
                          >
                            حداقل زمان SLA (دقیقه)
                          </label>
                          <input
                            id="p-sla-min"
                            type="number"
                            min={1}
                            value={pSLAMin}
                            onChange={(e) => setPSLAMin(Number(e.target.value))}
                            className="w-full h-9 px-3 rounded-xl border border-border bg-background focus:outline-none focus:ring-1 focus:ring-blue-500 font-mono"
                          />
                        </div>
                        <div>
                          <label
                            htmlFor="p-sla-max"
                            className="font-bold text-foreground block mb-1"
                          >
                            حداکثر زمان SLA (دقیقه)
                          </label>
                          <input
                            id="p-sla-max"
                            type="number"
                            min={1}
                            value={pSLAMax}
                            onChange={(e) => setPSLAMax(Number(e.target.value))}
                            className="w-full h-9 px-3 rounded-xl border border-border bg-background focus:outline-none focus:ring-1 focus:ring-blue-500 font-mono"
                          />
                        </div>
                        <div>
                          <label
                            htmlFor="p-sla-text"
                            className="font-bold text-foreground block mb-1"
                          >
                            متن نمایشی زمان تحویل
                          </label>
                          <input
                            id="p-sla-text"
                            type="text"
                            placeholder="مثال: ۱۰ الی ۳۰ دقیقه"
                            value={pSLAText}
                            onChange={(e) => setPSLAText(e.target.value)}
                            className="w-full h-9 px-3 rounded-xl border border-border bg-background focus:outline-none focus:ring-1 focus:ring-blue-500"
                          />
                        </div>
                      </div>

                      {/* Operating Hours & Delivery Strategy */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div>
                          <label
                            htmlFor="p-operating-hours"
                            className="font-bold text-foreground block mb-1"
                          >
                            ساعات کاری اپراتور
                          </label>
                          <input
                            id="p-operating-hours"
                            type="text"
                            placeholder="مثال: ۹:۰۰ تا ۲۴:۰۰"
                            value={pOperatingHours}
                            onChange={(e) => setPOperatingHours(e.target.value)}
                            className="w-full h-9 px-3 rounded-xl border border-border bg-background focus:outline-none focus:ring-1 focus:ring-blue-500"
                          />
                        </div>
                        <div>
                          <label
                            htmlFor="p-strategy"
                            className="font-bold text-foreground block mb-1"
                          >
                            استراتژی تأمین سفارش
                          </label>
                          <select
                            id="p-strategy"
                            value={pDeliveryStrategy}
                            onChange={(e) =>
                              setPDeliveryStrategy(e.target.value)
                            }
                            className="w-full h-9 px-3 rounded-xl border border-border bg-background focus:outline-none focus:ring-1 focus:ring-blue-500"
                          >
                            <option value="manual_operator">
                              میز کار اپراتور انسانی (Desk)
                            </option>
                            <option value="third_party_instant">
                              تأمین آنی از InsightX Store
                            </option>
                          </select>
                        </div>
                      </div>

                      {/* Features List */}
                      <div>
                        <label
                          htmlFor="p-features-text"
                          className="font-bold text-foreground block mb-1"
                        >
                          ویژگی‌های برجسته محصول (هر ویژگی در یک سطر)
                        </label>
                        <textarea
                          id="p-features-text"
                          rows={3}
                          placeholder="دسترسی نامحدود به GPT-4o&#10;ضمانت ۳۰ روزه عدم قطعی&#10;فعال‌سازی قانونی با کارت بین‌المللی"
                          value={pFeaturesText}
                          onChange={(e) => setPFeaturesText(e.target.value)}
                          className="w-full p-3 rounded-xl border border-border bg-background focus:outline-none focus:ring-1 focus:ring-blue-500 leading-relaxed font-mono text-xs resize-none"
                        />
                      </div>

                      {/* Description & Instructions */}
                      <div>
                        <label
                          htmlFor="p-desc"
                          className="font-bold text-foreground block mb-1"
                        >
                          توضیحات و معرفی محصول
                        </label>
                        <textarea
                          id="p-desc"
                          rows={2}
                          placeholder="توضیحات تکمیلی محصول که در صفحه فروشگاه نمایش داده می‌شود..."
                          value={pDescription}
                          onChange={(e) => setPDescription(e.target.value)}
                          className="w-full p-3 rounded-xl border border-border bg-background focus:outline-none focus:ring-1 focus:ring-blue-500 resize-none"
                        />
                      </div>

                      <div>
                        <label
                          htmlFor="p-instructions"
                          className="font-bold text-foreground block mb-1"
                        >
                          راهنمای تحویل برای خریدار
                        </label>
                        <textarea
                          id="p-instructions"
                          rows={2}
                          placeholder="راهنمای فعال‌سازی یا اتصال که پس از خرید به کاربر نشان داده می‌شود..."
                          value={pInstructions}
                          onChange={(e) => setPInstructions(e.target.value)}
                          className="w-full p-3 rounded-xl border border-border bg-background focus:outline-none focus:ring-1 focus:ring-blue-500 resize-none"
                        />
                      </div>

                      {/* Product Cover Image & Product Icon with Direct Upload */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {/* Cover Image Upload */}
                        <div className="space-y-1.5 p-3 rounded-2xl border border-border bg-muted/20">
                          <div className="flex items-center justify-between">
                            <label
                              htmlFor="p-image-url"
                              className="font-bold text-foreground text-xs block"
                            >
                              تصویر کاور محصول (کارت فروشگاه)
                            </label>
                            <label className="text-blue-500 hover:underline cursor-pointer flex items-center gap-1 text-xs font-bold">
                              <Upload className="h-3.5 w-3.5" />
                              <span>آپلود عکس</span>
                              <input
                                type="file"
                                accept="image/*"
                                onChange={handleUploadProductImage}
                                className="hidden"
                              />
                            </label>
                          </div>
                          <div className="flex items-center gap-2">
                            <input
                              id="p-image-url"
                              type="text"
                              dir="ltr"
                              placeholder="https://... یا آپلود از دکمه بالا"
                              value={pImageURL}
                              onChange={(e) => setPImageURL(e.target.value)}
                              className="flex-1 h-9 px-3 rounded-xl border border-border bg-background focus:outline-none focus:ring-1 focus:ring-primary font-mono text-xs"
                            />
                            {pImageURL && (
                              <div className="h-9 w-9 rounded-xl overflow-hidden border border-border shrink-0 bg-zinc-950">
                                <img
                                  src={pImageURL}
                                  alt="پیش‌نمایش عکس"
                                  className="h-full w-full object-cover"
                                />
                              </div>
                            )}
                          </div>
                          {uploadingProductImage && (
                            <p className="text-[11px] text-blue-500 flex items-center gap-1 pt-1">
                              <Loader2 className="h-3 w-3 animate-spin" />
                              <span>در حال بارگذاری عکس روی سرور...</span>
                            </p>
                          )}
                        </div>

                        {/* Product Icon Upload */}
                        <div className="space-y-1.5 p-3 rounded-2xl border border-border bg-muted/20">
                          <div className="flex items-center justify-between">
                            <label
                              htmlFor="p-icon-url"
                              className="font-bold text-foreground text-xs block"
                            >
                              آیکون اختصاصی محصول (لوگو یا SVG)
                            </label>
                            <label className="text-brand hover:underline cursor-pointer flex items-center gap-1 text-xs font-bold">
                              <Upload className="h-3.5 w-3.5" />
                              <span>آپلود آیکون</span>
                              <input
                                type="file"
                                accept="image/*,.svg"
                                onChange={handleUploadProductIcon}
                                className="hidden"
                              />
                            </label>
                          </div>
                          <div className="flex items-center gap-2">
                            <input
                              id="p-icon-url"
                              type="text"
                              dir="ltr"
                              placeholder="https://... یا نام آیکون / آپلود"
                              value={pIconURL}
                              onChange={(e) => setPIconURL(e.target.value)}
                              className="flex-1 h-9 px-3 rounded-xl border border-border bg-background focus:outline-none focus:ring-1 focus:ring-primary font-mono text-xs"
                            />
                            {pIconURL && (
                              <div className="h-9 w-9 rounded-xl overflow-hidden border border-border shrink-0 bg-zinc-900 flex items-center justify-center p-1.5">
                                <img
                                  src={pIconURL}
                                  alt="پیش‌نمایش آیکون"
                                  className="h-full w-full object-contain"
                                  onError={(e) => {
                                    ;(e.target as HTMLElement).style.display =
                                      'none'
                                  }}
                                />
                              </div>
                            )}
                          </div>
                          {uploadingProductIcon && (
                            <p className="text-[11px] text-brand flex items-center gap-1 pt-1">
                              <Loader2 className="h-3 w-3 animate-spin" />
                              <span>در حال بارگذاری آیکون...</span>
                            </p>
                          )}
                        </div>
                      </div>

                      {/* Flash Sale & Promotions Settings Card */}
                      <div className="p-3.5 rounded-2xl border border-rose-500/30 bg-rose-500/5 space-y-3">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <div className="p-1.5 rounded-xl bg-rose-500/10 text-rose-500">
                              <Flame className="h-4 w-4" />
                            </div>
                            <div>
                              <h4 className="text-xs font-bold text-foreground">
                                تخفیف شگفت‌انگیز زمان‌دار (Flash Sale)
                              </h4>
                              <p className="text-[10px] text-muted-foreground">
                                نمایش در سکشن شگفت‌انگیز با تایمر معکوس و نشان
                                آتشین
                              </p>
                            </div>
                          </div>
                          <ToggleSwitch
                            checked={pIsFlashSale}
                            onChange={setPIsFlashSale}
                            variant="primary"
                            size="sm"
                          />
                        </div>

                        {pIsFlashSale && (
                          <div className="space-y-3 pt-3 border-t border-rose-500/20">
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                              <div>
                                <label className="text-xs font-bold text-foreground block mb-1">
                                  قیمت جشنواره (تومان) *
                                </label>
                                <input
                                  type="number"
                                  min={1000}
                                  step={1000}
                                  value={pFlashSalePriceToman || ''}
                                  onChange={(e) =>
                                    setPFlashSalePriceToman(
                                      Number(e.target.value),
                                    )
                                  }
                                  placeholder="مثال: ۱۲۰۰۰۰۰"
                                  className="w-full h-9 px-3 rounded-control border border-border/60 bg-muted/20 text-xs font-mono font-latin outline-none focus:border-brand"
                                />
                              </div>
                              <div>
                                <label className="text-xs font-bold text-foreground block mb-1">
                                  تاریخ و زمان پایان مهلت تخفیف (تایمر معکوس)
                                </label>
                                <input
                                  type="datetime-local"
                                  value={pFlashSaleEndAt}
                                  onChange={(e) =>
                                    setPFlashSaleEndAt(e.target.value)
                                  }
                                  className="w-full h-9 px-3 rounded-control border border-border/60 bg-muted/20 text-xs font-mono font-latin outline-none focus:border-brand"
                                />
                              </div>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                              <div>
                                <label className="text-xs font-bold text-foreground block mb-1">
                                  سقف کل موجودی جشنواره
                                </label>
                                <input
                                  type="number"
                                  min={1}
                                  value={pFlashSaleStock || 50}
                                  onChange={(e) =>
                                    setPFlashSaleStock(Number(e.target.value))
                                  }
                                  className="w-full h-9 px-3 rounded-control border border-border/60 bg-muted/20 text-xs font-mono font-latin outline-none focus:border-brand"
                                />
                              </div>
                              <div>
                                <label className="text-xs font-bold text-foreground block mb-1">
                                  تعداد فروخته شده (نمایش در نوار پیشرفت)
                                </label>
                                <input
                                  type="number"
                                  min={0}
                                  value={pFlashSaleSold || 0}
                                  onChange={(e) =>
                                    setPFlashSaleSold(Number(e.target.value))
                                  }
                                  className="w-full h-9 px-3 rounded-control border border-border/60 bg-muted/20 text-xs font-mono font-latin outline-none focus:border-brand"
                                />
                              </div>
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Custom Badges & Tags Input Area */}
                      <div className="p-3.5 rounded-surface bg-muted/20 border border-border/60 space-y-2 text-right">
                        <label className="text-xs font-bold text-foreground block">
                          نشان‌ها و بج‌های دلخواه محصول (در هر سطر یک برچسب
                          بنویسید)
                        </label>
                        <textarea
                          rows={2}
                          value={pBadgesText}
                          onChange={(e) => setPBadgesText(e.target.value)}
                          placeholder="مثال:&#10;تحویل ۱ ثانیه‌ای&#10;گارانتی عدم قطعی"
                          className="w-full p-2.5 rounded-control border border-border/60 bg-card text-xs text-foreground outline-none focus:border-brand resize-none leading-relaxed"
                        />
                      </div>

                      {/* Star Rating Badge Configuration (Screenshot 4 Request) */}
                      <div className="flex items-center justify-between p-3.5 rounded-surface border border-border/60 bg-muted/20">
                        <div className="space-y-0.5 text-right">
                          <span className="text-xs font-bold text-foreground block">
                            نمایش امتیاز ستاره‌ای در کارت محصول
                          </span>
                          <span className="text-[11px] text-muted-foreground">
                            در صورت خاموش بودن یا مقدار ۰، نشان ستاره در کارت
                            محصول مخفی می‌شود.
                          </span>
                        </div>
                        <div className="flex items-center gap-3">
                          <input
                            type="number"
                            min={0}
                            max={5}
                            step={0.1}
                            disabled={!pShowRating}
                            value={pRatingAverage || ''}
                            onChange={(e) =>
                              setPRatingAverage(Number(e.target.value))
                            }
                            className="w-20 h-8 px-2 rounded-control border border-border/60 bg-card text-xs font-mono font-latin text-center outline-none focus:border-brand disabled:opacity-40"
                            placeholder="5.0"
                          />
                          <ToggleSwitch
                            checked={pShowRating}
                            onChange={setPShowRating}
                            variant="primary"
                            size="sm"
                          />
                        </div>
                      </div>

                      {/* Badges & Merchandising Options */}
                      <div className="grid grid-cols-2 gap-3 p-3 rounded-surface bg-muted/20 border border-border/60">
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-xs font-bold text-foreground">
                            محصول پرفروش‌ترین (Best Seller)
                          </span>
                          <ToggleSwitch
                            size="sm"
                            checked={pIsBestSeller}
                            onChange={setPIsBestSeller}
                          />
                        </div>

                        <div className="flex items-center justify-between gap-2">
                          <span className="text-xs font-bold text-foreground">
                            محصول ویژه ویترین (Featured)
                          </span>
                          <ToggleSwitch
                            size="sm"
                            checked={pIsFeatured}
                            onChange={setPIsFeatured}
                          />
                        </div>
                      </div>

                      {/* Active Toggle */}
                      <div className="flex items-center justify-between p-3.5 rounded-surface bg-muted/20 border border-border/60">
                        <div>
                          <span className="font-bold text-foreground block text-xs">
                            وضعیت انتشار: فعال در ویترین فروشگاه
                          </span>
                          <span className="text-[11px] text-muted-foreground mt-0.5 block">
                            در صورت غیرفعال بودن، مشتریان این محصول را در
                            کاتالوگ اصلی نخواهند دید.
                          </span>
                        </div>
                        <div className="flex items-center gap-2.5">
                          <span
                            className={`px-2.5 py-0.5 rounded-control text-[10px] font-bold border ${
                              pIsActive
                                ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/30'
                                : 'bg-rose-500/10 text-rose-500 border-rose-500/30'
                            }`}
                          >
                            {pIsActive ? 'فعال در فروشگاه' : 'غیرفعال'}
                          </span>
                          <ToggleSwitch
                            checked={pIsActive}
                            onChange={(checked) => setPIsActive(checked)}
                            ariaLabel="فعال در ویترین فروشگاه"
                          />
                        </div>
                      </div>
                    </div>
                  )}

                  {/* TAB 2: SEO & METADATA */}
                  {productModalTab === 'seo' && (
                    <div className="space-y-4">
                      <div className="flex items-center justify-between p-3 rounded-xl bg-blue-500/10 border border-blue-500/20 text-blue-600 dark:text-blue-400">
                        <div className="flex items-center gap-2">
                          <Globe className="h-4 w-4 shrink-0" />
                          <span className="text-xs">
                            تنظیمات متاتگ‌های سئو و اشتراک‌گذاری در شبکه‌های
                            اجتماعی (OpenGraph)
                          </span>
                        </div>
                        <button
                          type="button"
                          onClick={handleGenerateDefaultSEO}
                          className="px-3 py-1 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-[11px] font-bold flex items-center gap-1 shadow-sm"
                        >
                          <Sparkles className="h-3 w-3" />
                          <span>تولید خودکار سئو</span>
                        </button>
                      </div>

                      <div>
                        <div className="flex items-center justify-between mb-1">
                          <label
                            htmlFor="p-meta-title"
                            className="font-bold text-foreground block"
                          >
                            عنوان سئو (Meta Title)
                          </label>
                          <span
                            className={`text-[10px] font-mono ${
                              pMetaTitle.length > 60
                                ? 'text-amber-500'
                                : 'text-muted-foreground'
                            }`}
                          >
                            {pMetaTitle.length}/60 کاراکتر
                          </span>
                        </div>
                        <input
                          id="p-meta-title"
                          type="text"
                          placeholder="مثال: خرید اکانت قانونی ChatGPT Plus | تحویل فوری - آناهیکس"
                          value={pMetaTitle}
                          onChange={(e) => setPMetaTitle(e.target.value)}
                          className="w-full h-9 px-3 rounded-xl border border-border bg-background focus:outline-none focus:ring-1 focus:ring-blue-500"
                        />
                      </div>

                      <div>
                        <div className="flex items-center justify-between mb-1">
                          <label
                            htmlFor="p-meta-desc"
                            className="font-bold text-foreground block"
                          >
                            توضیحات متا (Meta Description)
                          </label>
                          <span
                            className={`text-[10px] font-mono ${
                              pMetaDescription.length > 160
                                ? 'text-amber-500'
                                : 'text-muted-foreground'
                            }`}
                          >
                            {pMetaDescription.length}/160 کاراکتر
                          </span>
                        </div>
                        <textarea
                          id="p-meta-desc"
                          rows={3}
                          placeholder="توضیحات جذاب سئو که در نتایج جستجوی گوگل نمایش داده می‌شود..."
                          value={pMetaDescription}
                          onChange={(e) => setPMetaDescription(e.target.value)}
                          className="w-full p-3 rounded-xl border border-border bg-background focus:outline-none focus:ring-1 focus:ring-blue-500 resize-none leading-relaxed"
                        />
                      </div>

                      <div>
                        <label
                          htmlFor="p-og-img"
                          className="font-bold text-foreground block mb-1"
                        >
                          تصویر اشتراک‌گذاری اجتماعی (OG Image URL)
                        </label>
                        <input
                          id="p-og-img"
                          type="text"
                          placeholder="/assets/hero.png یا آدرس کامل تصویر"
                          value={pOgImageURL}
                          onChange={(e) => setPOgImageURL(e.target.value)}
                          className="w-full h-9 px-3 rounded-xl border border-border bg-background focus:outline-none focus:ring-1 focus:ring-blue-500 font-mono"
                        />
                      </div>

                      {/* Live Google Search Preview */}
                      <div className="rounded-2xl border border-border bg-muted/20 p-4 space-y-2">
                        <span className="text-[11px] font-bold text-muted-foreground flex items-center gap-1.5">
                          <Search className="h-3.5 w-3.5" />
                          پیش‌نمایش نمایش در نتایج گوگل (SERP Simulation):
                        </span>
                        <div
                          className="p-3.5 rounded-xl border border-border/80 bg-card text-right space-y-1 max-w-xl"
                          dir="rtl"
                        >
                          <div className="flex items-center gap-2 text-[11px] text-muted-foreground">
                            <div className="h-4 w-4 rounded-full bg-blue-600 flex items-center justify-center text-[9px] text-white font-bold">
                              A
                            </div>
                            <span className="font-medium text-foreground">
                              آناهیکس (Anahix)
                            </span>
                            <span>›</span>
                            <span className="font-mono text-[10px]" dir="ltr">
                              https://anahix.ir/products/
                              {pSlug || 'product-slug'}
                            </span>
                          </div>
                          <h4 className="text-sm font-bold text-blue-600 hover:underline cursor-pointer leading-tight pt-1">
                            {pMetaTitle ||
                              (pTitleFA
                                ? `خرید ${pTitleFA} | آناهیکس`
                                : 'عنوان صفحه محصول در آناهیکس')}
                          </h4>
                          <p className="text-[11px] text-muted-foreground leading-relaxed line-clamp-2">
                            {pMetaDescription ||
                              pDescription ||
                              'خرید اشتراک و لایسنس قانونی با تحویل فوری، پرداخت امن شتابی و ضمانت کامل در آناهیکس.'}
                          </p>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* TAB 3: PLANS & DURATIONS */}
                  {productModalTab === 'plans' && (
                    <div className="space-y-4">
                      <div className="flex items-center justify-between p-3 rounded-xl bg-muted/40 border border-border">
                        <div>
                          <h4 className="font-bold text-foreground">
                            پلن‌های چندگانه زمانی (مدت زمان و قیمت‌های مختلف)
                          </h4>
                          <p className="text-[11px] text-muted-foreground">
                            مشتری روی صفحه محصول می‌تواند بین این پلن‌ها انتخاب
                            کند (مثلاً ۱ ماهه / ۳ ماهه / ۱ ساله).
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={handleGenerateDefaultPlans}
                            className="px-3 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold flex items-center gap-1.5 shadow-sm"
                          >
                            <Sparkles className="h-3.5 w-3.5" />
                            <span>تولید خودکار ۳ پلن زمانی</span>
                          </button>
                        </div>
                      </div>

                      {/* Visual Plans List with Drag & Drop */}
                      {pPlans.length > 0 ? (
                        <div className="space-y-3">
                          {pPlans.map((pl, idx) => (
                            <div
                              key={pl.id || `plan-${idx}`}
                              draggable
                              onDragStart={(e) => handlePlanDragStart(e, idx)}
                              onDragOver={handlePlanDragOver}
                              onDrop={(e) => handlePlanDrop(e, idx)}
                              className={`p-4 rounded-surface border bg-card space-y-3 relative group transition-all duration-200 ${
                                draggedPlanIdx === idx
                                  ? 'opacity-40 border-dashed border-brand'
                                  : 'border-border/80 shadow-surface hover:border-brand/40'
                              }`}
                            >
                              <div className="flex items-center justify-between border-b border-border/60 pb-2">
                                <div className="flex items-center gap-2">
                                  {/* Drag Grip Handle */}
                                  <div
                                    className="cursor-grab active:cursor-grabbing p-1 text-muted-foreground hover:text-foreground transition-colors"
                                    title="درگ و دراپ جهت جابجایی ردیف و اولویت پلن"
                                  >
                                    <GripVertical className="w-4 h-4" />
                                  </div>

                                  <span className="h-6 w-6 rounded-control bg-secondary text-brand font-black flex items-center justify-center text-xs font-latin border border-border/60">
                                    {idx + 1}
                                  </span>

                                  {/* Move Up / Down Buttons */}
                                  <div className="flex items-center gap-0.5">
                                    <button
                                      type="button"
                                      disabled={idx === 0}
                                      onClick={() => movePlan(idx, idx - 1)}
                                      className="p-1 text-muted-foreground hover:text-foreground disabled:opacity-20 cursor-pointer"
                                      title="انتقال به بالا"
                                    >
                                      <ChevronUp className="w-3.5 h-3.5" />
                                    </button>
                                    <button
                                      type="button"
                                      disabled={idx === pPlans.length - 1}
                                      onClick={() => movePlan(idx, idx + 1)}
                                      className="p-1 text-muted-foreground hover:text-foreground disabled:opacity-20 cursor-pointer"
                                      title="انتقال به پایین"
                                    >
                                      <ChevronDown className="w-3.5 h-3.5" />
                                    </button>
                                  </div>

                                  <input
                                    type="text"
                                    value={pl.title}
                                    onChange={(e) => {
                                      const updated = [...pPlans]
                                      updated[idx].title = e.target.value
                                      setPPlans(updated)
                                      setPPlansJSON(
                                        JSON.stringify(updated, null, 2),
                                      )
                                    }}
                                    placeholder="عنوان پلن"
                                    className="h-7 px-2 font-bold text-foreground bg-transparent border-b border-dashed border-border/80 focus:outline-none focus:border-brand text-xs w-60"
                                  />
                                  {pl.badge && (
                                    <span className="px-2 py-0.5 rounded-control text-[10px] bg-brand/10 text-brand border border-brand/20 font-bold">
                                      {pl.badge}
                                    </span>
                                  )}
                                </div>
                                <div className="flex items-center gap-3">
                                  <label className="flex items-center gap-1.5 cursor-pointer text-[11px] text-muted-foreground">
                                    <input
                                      type="radio"
                                      name="default-plan"
                                      checked={pl.is_default}
                                      onChange={() => {
                                        const updated = pPlans.map(
                                          (pItem, i) => ({
                                            ...pItem,
                                            is_default: i === idx,
                                          }),
                                        )
                                        setPPlans(updated)
                                        setPPlansJSON(
                                          JSON.stringify(updated, null, 2),
                                        )
                                      }}
                                      className="text-brand"
                                    />
                                    <span>پلن پیش‌فرض انتخاب</span>
                                  </label>
                                  <button
                                    type="button"
                                    onClick={() => {
                                      const updated = pPlans.filter(
                                        (_, i) => i !== idx,
                                      )
                                      setPPlans(updated)
                                      setPPlansJSON(
                                        JSON.stringify(updated, null, 2),
                                      )
                                    }}
                                    className="h-7 w-7 rounded-control text-destructive hover:bg-destructive/10 border border-destructive/20 flex items-center justify-center transition cursor-pointer"
                                    title="حذف این پلن"
                                  >
                                    <Trash2 className="h-3.5 w-3.5" />
                                  </button>
                                </div>
                              </div>

                              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                                <div>
                                  <span className="text-[10px] text-muted-foreground block mb-0.5">
                                    شناسه یکتا
                                  </span>
                                  <input
                                    type="text"
                                    value={pl.id}
                                    onChange={(e) => {
                                      const updated = [...pPlans]
                                      updated[idx].id = e.target.value
                                      setPPlans(updated)
                                      setPPlansJSON(
                                        JSON.stringify(updated, null, 2),
                                      )
                                    }}
                                    className="w-full h-8 px-2 rounded-lg border border-border bg-background text-[11px] font-mono"
                                  />
                                </div>
                                <div>
                                  <span className="text-[10px] text-muted-foreground block mb-0.5">
                                    متن دوره (مانند ۱ ماهه)
                                  </span>
                                  <input
                                    type="text"
                                    value={pl.duration_text}
                                    onChange={(e) => {
                                      const updated = [...pPlans]
                                      updated[idx].duration_text =
                                        e.target.value
                                      setPPlans(updated)
                                      setPPlansJSON(
                                        JSON.stringify(updated, null, 2),
                                      )
                                    }}
                                    className="w-full h-8 px-2 rounded-lg border border-border bg-background text-[11px]"
                                  />
                                </div>
                                <div>
                                  <span className="text-[10px] text-muted-foreground block mb-0.5">
                                    قیمت فروش (تومان)
                                  </span>
                                  <input
                                    type="number"
                                    step={1000}
                                    value={pl.price_toman}
                                    onChange={(e) => {
                                      const updated = [...pPlans]
                                      updated[idx].price_toman = Number(
                                        e.target.value,
                                      )
                                      setPPlans(updated)
                                      setPPlansJSON(
                                        JSON.stringify(updated, null, 2),
                                      )
                                    }}
                                    className="w-full h-8 px-2 rounded-lg border border-border bg-background text-[11px] font-mono"
                                  />
                                </div>
                                <div>
                                  <span className="text-[10px] text-muted-foreground block mb-0.5">
                                    قیمت خط‌خورده قبل تخفیف
                                  </span>
                                  <input
                                    type="number"
                                    step={1000}
                                    value={pl.original_price_toman || 0}
                                    onChange={(e) => {
                                      const updated = [...pPlans]
                                      updated[idx].original_price_toman =
                                        Number(e.target.value)
                                      setPPlans(updated)
                                      setPPlansJSON(
                                        JSON.stringify(updated, null, 2),
                                      )
                                    }}
                                    className="w-full h-8 px-2 rounded-lg border border-border bg-background text-[11px] font-mono"
                                  />
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="rounded-2xl border border-dashed border-border p-8 text-center text-muted-foreground space-y-2">
                          <Calendar className="h-8 w-8 mx-auto text-muted-foreground/50" />
                          <div className="font-bold text-xs text-foreground">
                            هنوز پلن اختصاصی تعریف نشده است
                          </div>
                          <p className="text-[11px]">
                            در صورت عدم ثبت پلن اختصاصی، سیستم به صورت خودکار
                            پلن‌های ۱ ماهه، ۳ ماهه و ۱ ساله را بر مبنای قیمت پایه
                            ارائه می‌کند.
                          </p>
                          <button
                            type="button"
                            onClick={handleGenerateDefaultPlans}
                            className="mt-2 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-sm"
                          >
                            <Plus className="h-3.5 w-3.5" />
                            <span>ایجاد ۳ پلن استاندارد اکنون</span>
                          </button>
                        </div>
                      )}

                      {/* Add Plan & Raw JSON Toggle */}
                      <div className="flex items-center justify-between pt-2">
                        <button
                          type="button"
                          onClick={() => {
                            const newPlan: ProductPlan = {
                              id: `plan-${Date.now()}`,
                              title: 'پلن اختصاصی جدید',
                              duration_days: 30,
                              duration_text: '۱ ماهه',
                              price_toman: pPriceToman,
                              original_price_toman: Math.round(
                                pPriceToman * 1.18,
                              ),
                              is_default: pPlans.length === 0,
                              delivery_type: pDeliveryType,
                            }
                            const updated = [...pPlans, newPlan]
                            setPPlans(updated)
                            setPPlansJSON(JSON.stringify(updated, null, 2))
                          }}
                          className="px-3 py-1.5 rounded-xl border border-border hover:bg-muted text-xs font-semibold flex items-center gap-1.5 transition"
                        >
                          <Plus className="h-3.5 w-3.5" />
                          <span>افزودن پلن جدید</span>
                        </button>
                      </div>
                    </div>
                  )}

                  {/* TAB 4: COMPARISON TABLE */}
                  {productModalTab === 'comparison' && (
                    <div className="space-y-4">
                      <div className="flex flex-wrap items-center justify-between p-3.5 rounded-surface bg-muted/20 border border-border/60 gap-2">
                        <div>
                          <h4 className="font-black text-foreground text-xs flex items-center gap-2">
                            <Table className="h-4 w-4 text-brand" />
                            <span>جدول مقایسه ویژگی‌ها (Comparison Matrix)</span>
                          </h4>
                          <p className="text-[11px] text-muted-foreground mt-0.5">
                            مقایسه قابلیت‌های نسخه رایگان با پلاس و تیمی روی صفحه
                            محصول (پشتیبانی از فرمت‌های متنی، مارک‌داون و
                            ساختاریافته)
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={handleGenerateDefaultComparison}
                            className="h-8 px-3 rounded-control bg-secondary text-brand hover:bg-muted text-xs font-bold flex items-center gap-1.5 border border-border/60 shadow-xs cursor-pointer duration-motion active:scale-[0.98]"
                          >
                            <Sparkles className="h-3.5 w-3.5" />
                            <span>بارگذاری قالب پیشنهادی</span>
                          </button>
                        </div>
                      </div>

                      <div className="space-y-1.5">
                        <label className="font-bold text-foreground block text-xs">
                          ویرایشگر متن و جدول مقایسه ویژگی‌های محصول:
                        </label>
                        <RichContentEditor
                          value={pComparisonJSON}
                          onChange={setPComparisonJSON}
                          placeholder="## جدول مقایسه ویژگی‌ها&#10;&#10;| ویژگی | پلن رایگان | پلن پلاس |&#10;| --- | --- | --- |&#10;| دسترسی نامحدود | ✕ | ✓ |"
                          minHeight="320px"
                          label="محتوای جدول مقایسه"
                        />
                        <span className="text-[10px] text-muted-foreground mt-1 block">
                          نکته: در صورت خالی بودن، سیستم بر مبنای نوع سرویس جدول
                          استاندارد را نمایش می‌دهد.
                        </span>
                      </div>
                    </div>
                  )}

                  {/* TAB 5: ACTIVATION GUIDE */}
                  {productModalTab === 'guide' && (
                    <div className="space-y-4">
                      <div className="flex flex-wrap items-center justify-between p-3.5 rounded-surface bg-muted/20 border border-border/60 gap-2">
                        <div>
                          <h4 className="font-black text-foreground text-xs flex items-center gap-2">
                            <Sparkles className="h-4 w-4 text-brand" />
                            <span>راهنمای گام‌به‌گام فعال‌سازی و رفع تحریم</span>
                          </h4>
                          <p className="text-[11px] text-muted-foreground mt-0.5">
                            مراحل مصور تحویل، لینک، لاگین و آموزش تنظیم DNS
                            ضدتحریم (شکن / الکترو)
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={handleGenerateDefaultGuide}
                            className="h-8 px-3 rounded-control bg-secondary text-brand hover:bg-muted text-xs font-bold flex items-center gap-1.5 border border-border/60 shadow-xs cursor-pointer duration-motion active:scale-[0.98]"
                          >
                            <Sparkles className="h-3.5 w-3.5" />
                            <span>بارگذاری راهنمای پیشنهادی</span>
                          </button>
                        </div>
                      </div>

                      <div className="space-y-1.5">
                        <label className="font-bold text-foreground block text-xs">
                          ویرایشگر مراحل فعال‌سازی و آموزش استفاده:
                        </label>
                        <RichContentEditor
                          value={pGuideJSON}
                          onChange={setPGuideJSON}
                          placeholder="### مرحله اول: پرداخت و دریافت لایسنس&#10;پس از پرداخت، اطلاعات اشتراک صادر می‌شود...&#10;&#10;### تنظیمات DNS شکن:&#10;178.22.122.100"
                          minHeight="320px"
                          label="راهنمای فعال‌سازی"
                        />
                      </div>
                    </div>
                  )}

                  {/* TAB 6: FAQS */}
                  {productModalTab === 'faq' && (
                    <div className="space-y-4">
                      <div className="flex flex-wrap items-center justify-between p-3 rounded-xl bg-muted/40 border border-border gap-2">
                        <div>
                          <h4 className="font-bold text-foreground">
                            سوالات متداول، رفع تحریم و نکات امنیتی (FAQ)
                          </h4>
                          <p className="text-[11px] text-muted-foreground">
                            پاسخ به ابهامات متداول مشتریان در خصوص گارانتی،
                            قطعی، حفظ چت‌ها و پروتکل Zeroize
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={handleGenerateDefaultFaqs}
                            className="px-3 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold flex items-center gap-1.5 shadow-sm"
                          >
                            <Sparkles className="h-3.5 w-3.5" />
                            <span>بارگذاری سوالات پیشنهادی</span>
                          </button>
                        </div>
                      </div>

                      <div>
                        <label
                          htmlFor="p-faq-json"
                          className="font-bold text-foreground block mb-1"
                        >
                          لیست سوال و جواب‌ها (JSON)
                        </label>
                        <textarea
                          id="p-faq-json"
                          rows={12}
                          placeholder='[\n  {\n    "question": "آیا اکانت قطعی دارد؟",\n    "answer": "خیر، پرداخت ۱۰۰٪ قانونی است..."\n  }\n]'
                          value={pFaqJSON}
                          onChange={(e) => setPFaqJSON(e.target.value)}
                          className="w-full p-3 rounded-xl border border-border bg-background focus:outline-none focus:ring-1 focus:ring-blue-500 font-mono text-xs leading-relaxed"
                        />
                      </div>
                    </div>
                  )}

                  {/* Form Submit Button: Full-width Graphite primary button without cancel button per user instruction */}
                  <div className="pt-3 border-t border-border/60">
                    <button
                      type="submit"
                      disabled={productSubmitting}
                      className="w-full h-11 rounded-control bg-primary hover:bg-primary-hover text-primary-foreground text-xs font-black duration-motion ease-motion active:scale-[0.98] shadow-control flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer"
                    >
                      {productSubmitting && (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      )}
                      <span>
                        {editingProduct
                          ? 'ذخیره تمام تغییرات و انتشار'
                          : 'ثبت و انتشار محصول در فروشگاه'}
                      </span>
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>,
          document.body,
        )}

      {/* DELETE PRODUCT MODAL */}
      <ConfirmModal
        isOpen={isDeleteModalOpen && Boolean(productToDelete)}
        onClose={() => {
          setIsDeleteModalOpen(false)
          setProductToDelete(null)
        }}
        onConfirm={handleDeleteProductSubmit}
        title="حذف محصول از کاتالوگ"
        description={`آیا از حذف محصول «${productToDelete?.title_fa || ''}» از کاتالوگ فروشگاه اطمینان دارید؟ این عملیات غیرقابل بازگشت است.`}
        confirmText="بله، محصول حذف شود"
        cancelText="انصراف"
        loading={deleteLoading}
        variant="danger"
      />

      {/* EXPORT MODAL */}
      {isExportOpen &&
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
              <div className="max-w-md w-full my-auto bg-card rounded-surface border border-border/80 shadow-overlay p-6 space-y-4 animate-in zoom-in-95 text-foreground">
                <div className="flex items-center justify-between border-b border-border pb-3">
                  <div className="flex items-center gap-2">
                    <Download className="h-4 w-4 text-blue-600" />
                    <h3 className="text-sm font-bold text-foreground">
                      خروجی کلیدهای انبار
                    </h3>
                  </div>
                  <ModalCloseButton
                    onClick={() => setIsExportOpen(false)}
                    size="sm"
                  />
                </div>

                {exportLoading ? (
                  <div className="py-8 flex flex-col items-center justify-center text-muted-foreground gap-2">
                    <Loader2 className="h-6 w-6 animate-spin text-blue-600" />
                    <span className="text-xs">در حال دریافت داده‌ها...</span>
                  </div>
                ) : exportedKeys.length === 0 ? (
                  <p className="text-xs text-muted-foreground text-center py-6">
                    هیچ کلیدی برای خروجی یافت نشد.
                  </p>
                ) : (
                  <div className="space-y-3">
                    <p className="text-xs text-muted-foreground">
                      تعداد کلیدهای استخراج شده:{' '}
                      <span className="font-bold text-foreground">
                        {exportedKeys.length}
                      </span>
                    </p>
                    <textarea
                      readOnly
                      rows={8}
                      value={exportedKeys.join('\n')}
                      className="w-full p-3 rounded-xl border border-border bg-background font-mono text-[11px] select-all focus:outline-none"
                    />
                    <button
                      type="button"
                      onClick={handleCopyExport}
                      className="w-full h-11 rounded-control bg-primary hover:bg-primary-hover text-primary-foreground text-xs font-black transition flex items-center justify-center gap-2 shadow-control cursor-pointer duration-motion active:scale-[0.98]"
                    >
                      {copiedExport ? (
                        <>
                          <CheckCircle2 className="h-4 w-4" />
                          <span>در کلیپ‌بورد کپی شد!</span>
                        </>
                      ) : (
                        <>
                          <Copy className="h-4 w-4" />
                          <span>کپی همه کلیدها</span>
                        </>
                      )}
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>,
          document.body,
        )}

      {/* REPLACE KEY MODAL */}
      {isReplaceOpen &&
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
              <form
                onSubmit={handleReplaceKeySubmit}
                className="max-w-md w-full my-auto bg-card rounded-surface border border-border/80 shadow-overlay p-6 space-y-4 animate-in zoom-in-95 text-foreground"
              >
                <div className="flex items-center justify-between border-b border-border pb-3">
                  <div className="flex items-center gap-2">
                    <RefreshCw className="h-4 w-4 text-blue-600" />
                    <h3 className="text-sm font-bold text-foreground">
                      تعویض کلید سفارش (گارانتی)
                    </h3>
                  </div>
                  <ModalCloseButton
                    onClick={() => setIsReplaceOpen(false)}
                    size="sm"
                  />
                </div>

                {replaceSuccessMsg && (
                  <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-xs flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 shrink-0" />
                    <span>{replaceSuccessMsg}</span>
                  </div>
                )}

                {replaceErrorMsg && (
                  <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-600 dark:text-rose-400 text-xs flex items-center gap-2">
                    <AlertCircle className="h-4 w-4 shrink-0" />
                    <span>{replaceErrorMsg}</span>
                  </div>
                )}

                <div className="space-y-3 text-xs">
                  <div>
                    <label
                      htmlFor="replace-order-id"
                      className="font-bold text-foreground block mb-1"
                    >
                      شناسه سفارش (Order UUID)
                    </label>
                    <input
                      id="replace-order-id"
                      type="text"
                      required
                      placeholder="مثال: a1b2c3d4-..."
                      value={replaceOrderId}
                      onChange={(e) => setReplaceOrderId(e.target.value)}
                      className="w-full h-9 px-3 rounded-xl border border-border bg-background font-mono focus:outline-none focus:ring-1 focus:ring-blue-500"
                    />
                  </div>

                  <div>
                    <label
                      htmlFor="replace-old-item"
                      className="font-bold text-foreground block mb-1"
                    >
                      شناسه کلید قدیمی معیوب (اختیاری)
                    </label>
                    <input
                      id="replace-old-item"
                      type="text"
                      placeholder="در صورت خالی بودن، خودکار تشخیص داده می‌شود"
                      value={replaceOldItemId}
                      onChange={(e) => setReplaceOldItemId(e.target.value)}
                      className="w-full h-9 px-3 rounded-xl border border-border bg-background font-mono focus:outline-none focus:ring-1 focus:ring-blue-500"
                    />
                  </div>

                  <div>
                    <label
                      htmlFor="replace-reason"
                      className="font-bold text-foreground block mb-1"
                    >
                      دلیل تعویض
                    </label>
                    <input
                      id="replace-reason"
                      type="text"
                      required
                      value={replaceReason}
                      onChange={(e) => setReplaceReason(e.target.value)}
                      className="w-full h-9 px-3 rounded-xl border border-border bg-background focus:outline-none focus:ring-1 focus:ring-blue-500"
                    />
                  </div>
                </div>

                <div className="flex items-center justify-end gap-2 pt-2 border-t border-border/60">
                  <button
                    type="button"
                    onClick={() => setIsReplaceOpen(false)}
                    className="h-10 px-4 rounded-control border border-border/60 bg-secondary hover:bg-muted text-foreground text-xs font-bold transition shadow-xs cursor-pointer duration-motion active:scale-[0.98]"
                  >
                    انصراف
                  </button>
                  <button
                    type="submit"
                    disabled={replaceLoading}
                    className="h-10 px-6 rounded-control bg-primary hover:bg-primary-hover text-primary-foreground text-xs font-black transition flex items-center justify-center gap-2 disabled:opacity-50 shadow-control cursor-pointer duration-motion active:scale-[0.98]"
                  >
                    {replaceLoading && (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    )}
                    <span>جایگزینی کلید جدید</span>
                  </button>
                </div>
              </form>
            </div>
          </div>,
          document.body,
        )}
    </div>
  )
}
