import {
  AlertCircle,
  Check,
  ChevronLeft,
  ChevronRight,
  Clock,
  FolderTree,
  Loader2,
  Pencil,
  Plus,
  RefreshCw,
  Tag,
  Trash2,
  Zap,
} from 'lucide-react'
import type React from 'react'
import { useEffect, useMemo, useState } from 'react'
import { createPortal } from 'react-dom'
import { apiService } from '../../services/api'
import type { ProductGroup, StoreCategory } from '../../types'
import { toPersianDigits } from '../../utils/formatters'
import { ConfirmModal } from '../vibefarsi/ConfirmModal'
import { LoadingState } from '../vibefarsi/LoadingState'
import { ModalCloseButton } from '../vibefarsi/ModalCloseButton'
import { useNotification } from '../vibefarsi/NotificationContext'
import { SearchInput } from '../vibefarsi/SearchInput'
import { ToggleSwitch } from '../vibefarsi/ToggleSwitch'

export const AdminCategoriesView: React.FC = () => {
  const { success: notifySuccess, error: notifyError } = useNotification()
  const [categories, setCategories] = useState<StoreCategory[]>([])
  const [productGroups, setProductGroups] = useState<ProductGroup[]>([])
  const [activeSection, setActiveSection] = useState<'categories' | 'groups'>(
    'categories',
  )
  const [loading, setLoading] = useState(false)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<
    'all' | 'active' | 'inactive'
  >('all')
  const [currentPage, setCurrentPage] = useState<number>(1)
  const pageSize = 5

  // Group Modal State
  const [isGroupModalOpen, setIsGroupModalOpen] = useState(false)
  const [groupTagInput, setGroupTagInput] = useState('')
  const [groupTitleInput, setGroupTitleInput] = useState('')
  const [groupStrategyInput, setGroupStrategyInput] = useState<
    'manual_operator' | 'third_party_instant'
  >('third_party_instant')
  const [savingGroup, setSavingGroup] = useState(false)

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingCat, setEditingCat] = useState<StoreCategory | null>(null)
  const [parentID, setParentID] = useState<string>('')
  const [titleFA, setTitleFA] = useState('')
  const [titleEN, setTitleEN] = useState('')
  const [slug, setSlug] = useState('')
  const [description, setDescription] = useState('')
  const [iconURL, setIconURL] = useState('')
  const [sortOrder, setSortOrder] = useState(0)
  const [isActive, setIsActive] = useState(true)
  const [saving, setSaving] = useState(false)

  // Delete Confirm State
  const [deleteConfirm, setDeleteConfirm] = useState<{
    isOpen: boolean
    id: string | null
    title: string
    loading: boolean
  }>({
    isOpen: false,
    id: null,
    title: '',
    loading: false,
  })

  // Delete Group Confirm State
  const [deleteGroupConfirm, setDeleteGroupConfirm] = useState<{
    isOpen: boolean
    groupTag: string
    title: string
    loading: boolean
  }>({
    isOpen: false,
    groupTag: '',
    title: '',
    loading: false,
  })

  const [selectedGroupCategoryFilter, setSelectedGroupCategoryFilter] =
    useState<string>('all')

  const loadCategories = async () => {
    setLoading(true)
    try {
      const [catsData, groupsData] = await Promise.all([
        apiService.adminGetStoreCategories().catch(() => []),
        apiService.getProductGroups().catch(() => []),
      ])
      setCategories(catsData)
      setProductGroups(groupsData)
    } catch (err: any) {
      notifyError('خطا در دریافت داده‌ها', err.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadCategories()
  }, [])

  const handleOpenCreate = (prefilledParentId = '') => {
    setEditingCat(null)
    setParentID(prefilledParentId)
    setTitleFA('')
    setTitleEN('')
    setSlug('')
    setDescription('')
    setIconURL('')
    setSortOrder(0)
    setIsActive(true)
    setIsModalOpen(true)
  }

  const handleOpenEdit = (cat: StoreCategory) => {
    setEditingCat(cat)
    setParentID(cat.parent_id || '')
    setTitleFA(cat.title_fa)
    setTitleEN(cat.title_en || '')
    setSlug(cat.slug)
    setDescription(cat.description || '')
    setIconURL(cat.icon_url || '')
    setSortOrder(cat.sort_order || 0)
    setIsActive(cat.is_active)
    setIsModalOpen(true)
  }

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    try {
      const payload = {
        parent_id: parentID ? parentID : undefined,
        title_fa: titleFA.trim(),
        title_en: titleEN.trim(),
        slug: slug.trim(),
        description: description.trim(),
        icon_url: iconURL.trim(),
        sort_order: Number(sortOrder),
        is_active: isActive,
      }

      if (editingCat) {
        await apiService.adminUpdateStoreCategory(editingCat.id, payload)
        notifySuccess(
          'دسته‌بندی به‌روزرسانی شد',
          `تغییرات «${titleFA}» ثبت گردید.`,
        )
      } else {
        await apiService.adminCreateStoreCategory(payload)
        notifySuccess(
          'دسته‌بندی ایجاد شد',
          `دسته‌بندی «${titleFA}» با موفقیت اضافه گردید.`,
        )
      }

      setIsModalOpen(false)
      loadCategories()
    } catch (err: any) {
      notifyError('خطا در ذخیره دسته‌بندی', err.message)
    } finally {
      setSaving(false)
    }
  }

  const handleSaveGroup = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!groupTagInput.trim() || !groupTitleInput.trim()) return

    setSavingGroup(true)
    try {
      await apiService.updateGroupDeliveryStrategy(
        groupTagInput.trim(),
        groupStrategyInput,
      )
      notifySuccess(
        'گروه برند ذخیره شد',
        `گروه ${groupTitleInput} با موفقیت ثبت و استراتژی آن اعمال شد.`,
      )
      setIsGroupModalOpen(false)
      loadCategories()
    } catch (err: any) {
      notifyError('خطا در ذخیره گروه', err.message)
    } finally {
      setSavingGroup(false)
    }
  }

  const handleToggleGroupStrategy = async (
    groupTag: string,
    newStrategy: 'manual_operator' | 'third_party_instant',
  ) => {
    try {
      await apiService.updateGroupDeliveryStrategy(groupTag, newStrategy)
      setProductGroups((prev) =>
        prev.map((g) =>
          g.group_tag === groupTag
            ? { ...g, delivery_strategy: newStrategy }
            : g,
        ),
      )
      notifySuccess('استراتژی تغییر یافت', 'استراتژی تحویل گروه به‌روزرسانی شد.')
    } catch (err: any) {
      notifyError('خطا در تغییر استراتژی', err.message)
    }
  }

  const handleDeleteConfirm = async () => {
    if (!deleteConfirm.id) return
    setDeleteConfirm((prev) => ({ ...prev, loading: true }))
    try {
      await apiService.adminDeleteStoreCategory(deleteConfirm.id)
      notifySuccess(
        'دسته‌بندی حذف شد',
        `دسته‌بندی «${deleteConfirm.title}» حذف گردید.`,
      )
      setDeleteConfirm({ isOpen: false, id: null, title: '', loading: false })
      loadCategories()
    } catch (err: any) {
      notifyError('خطا در حذف دسته‌بندی', err.message)
      setDeleteConfirm((prev) => ({ ...prev, loading: false }))
    }
  }

  const handleDeleteGroupConfirm = async () => {
    if (!deleteGroupConfirm.groupTag) return
    setDeleteGroupConfirm((prev) => ({ ...prev, loading: true }))
    try {
      await apiService.deleteProductGroup(deleteGroupConfirm.groupTag)
      notifySuccess(
        'گروه برند حذف شد',
        `گروه «${deleteGroupConfirm.title}» حذف و محصولات آن به دسته عمومی ارجاع داده شدند.`,
      )
      setDeleteGroupConfirm({
        isOpen: false,
        groupTag: '',
        title: '',
        loading: false,
      })
      loadCategories()
    } catch (err: any) {
      notifyError('خطا در حذف گروه', err.message)
      setDeleteGroupConfirm((prev) => ({ ...prev, loading: false }))
    }
  }

  const filteredGroups = useMemo(() => {
    if (selectedGroupCategoryFilter === 'all') return productGroups
    return productGroups.filter((g) => {
      const matchTag = g.group_tag
        .toLowerCase()
        .includes(selectedGroupCategoryFilter.toLowerCase())
      const matchTitle = g.group_title_fa
        .toLowerCase()
        .includes(selectedGroupCategoryFilter.toLowerCase())
      return matchTag || matchTitle
    })
  }, [productGroups, selectedGroupCategoryFilter])

  // Filter & Pagination for categories
  const filteredCategories = useMemo(() => {
    return categories.filter((c) => {
      if (statusFilter === 'active' && !c.is_active) return false
      if (statusFilter === 'inactive' && c.is_active) return false
      if (!search.trim()) return true
      const q = search.toLowerCase()
      const matchesParent =
        c.title_fa.toLowerCase().includes(q) ||
        (c.title_en || '').toLowerCase().includes(q) ||
        c.slug.toLowerCase().includes(q)
      const matchesChild = c.children?.some(
        (sub) =>
          sub.title_fa.toLowerCase().includes(q) ||
          (sub.title_en || '').toLowerCase().includes(q) ||
          sub.slug.toLowerCase().includes(q),
      )
      return matchesParent || matchesChild
    })
  }, [categories, statusFilter, search])

  const totalPages = Math.ceil(filteredCategories.length / pageSize) || 1
  const paginatedCategories = useMemo(() => {
    const start = (currentPage - 1) * pageSize
    return filteredCategories.slice(start, start + pageSize)
  }, [filteredCategories, currentPage, pageSize])

  return (
    <div className="space-y-6 text-foreground text-right" dir="rtl">
      {/* Section Switcher: Categories vs Brand Groups */}
      <div className="flex items-center gap-1.5 p-1 bg-muted/40 rounded-surface border border-border/60 w-fit">
        <button
          type="button"
          onClick={() => setActiveSection('categories')}
          className={`flex items-center gap-2 px-3.5 py-1.5 rounded-control text-xs font-bold transition-all cursor-pointer ${
            activeSection === 'categories'
              ? 'bg-primary text-primary-foreground font-black shadow-control'
              : 'text-muted-foreground hover:text-foreground'
          }`}
        >
          <FolderTree className="w-3.5 h-3.5" />
          <span>دسته‌بندی‌های سلسله‌مراتبی فروشگاه</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveSection('groups')}
          className={`flex items-center gap-2 px-3.5 py-1.5 rounded-control text-xs font-bold transition-all cursor-pointer ${
            activeSection === 'groups'
              ? 'bg-primary text-primary-foreground font-black shadow-control'
              : 'text-muted-foreground hover:text-foreground'
          }`}
        >
          <Tag className="w-3.5 h-3.5" />
          <span>گروه‌های برند و تامین‌کنندگان ({productGroups.length})</span>
        </button>
      </div>

      {/* Top Action Bar for Categories */}
      {activeSection === 'categories' && (
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-card p-4 sm:p-5 rounded-surface border border-border/80 shadow-surface">
          <div>
            <h4 className="text-sm sm:text-base font-black text-foreground flex items-center gap-2">
              <FolderTree className="w-4 h-4 text-brand" />
              مدیریت دسته‌بندی‌های تو در تو و زیرگروه‌های فروشگاه
            </h4>
            <p className="text-xs text-muted-foreground mt-0.5">
              ایجاد ساختار سلسله‌مراتبی (مثال: هوش مصنوعی &gt; چت‌بات‌ها &gt; گوگل
              جمینای) جهت سازماندهی محصولات
            </p>
          </div>

          <div className="flex items-center gap-2.5 flex-wrap">
            <select
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value as any)
                setCurrentPage(1)
              }}
              className="h-9 px-3 rounded-control border border-border/60 bg-secondary text-xs font-bold text-foreground outline-none cursor-pointer"
            >
              <option value="all">همه وضعیت‌ها</option>
              <option value="active">فقط فعال‌ها</option>
              <option value="inactive">فقط غیرفعال‌ها</option>
            </select>

            <div className="w-56">
              <SearchInput
                value={search}
                onChange={(val) => {
                  setSearch(val)
                  setCurrentPage(1)
                }}
                placeholder="جستجوی دسته‌بندی..."
                debounceMs={250}
              />
            </div>

            <button
              type="button"
              onClick={loadCategories}
              disabled={loading}
              className="h-9 px-3 rounded-control border border-border/60 bg-secondary text-secondary-foreground text-xs font-bold hover:bg-muted flex items-center gap-1.5 cursor-pointer shadow-control"
              title="به‌روزرسانی دسته‌بندی‌ها"
            >
              <RefreshCw
                className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-brand' : ''}`}
              />
            </button>

            <button
              type="button"
              onClick={() => handleOpenCreate()}
              className="h-9 px-4 rounded-control bg-primary hover:bg-primary-hover text-primary-foreground text-xs font-black shadow-control flex items-center gap-1.5 cursor-pointer duration-motion active:scale-[0.98]"
            >
              <Plus className="w-4 h-4" />
              <span>دسته‌بندی اصلی جدید</span>
            </button>
          </div>
        </div>
      )}

      {/* Brand Groups View */}
      {activeSection === 'groups' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-card p-4 sm:p-5 rounded-surface border border-border/80 shadow-surface">
            <div>
              <h4 className="text-sm sm:text-base font-black text-foreground flex items-center gap-2">
                <Tag className="w-4 h-4 text-brand" />
                مدیریت گروه‌های برند و تامین‌کنندگان (Brand Groups / Group Tags)
              </h4>
              <p className="text-xs text-muted-foreground mt-0.5">
                شناسه‌های گروه برند (مانند gemini, chatgpt, vpn) که در کاتالوگ
                فروشگاه به صورت زنده استعلام می‌شوند
              </p>
            </div>

            <button
              type="button"
              onClick={() => {
                setGroupTagInput('')
                setGroupTitleInput('')
                setGroupStrategyInput('third_party_instant')
                setIsGroupModalOpen(true)
              }}
              className="h-9 px-4 rounded-control bg-primary hover:bg-primary-hover text-primary-foreground text-xs font-black shadow-control flex items-center gap-1.5 cursor-pointer duration-motion active:scale-[0.98]"
            >
              <Plus className="w-4 h-4" />
              <span>ایجاد گروه برند جدید</span>
            </button>
          </div>

          {/* Category Tabs for Groups */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
            <button
              type="button"
              onClick={() => setSelectedGroupCategoryFilter('all')}
              className={`px-3 py-1.5 rounded-control text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                selectedGroupCategoryFilter === 'all'
                  ? 'bg-primary text-primary-foreground font-black shadow-xs'
                  : 'bg-card text-muted-foreground hover:text-foreground border border-border/60'
              }`}
            >
              همه دسته‌بندی‌ها ({productGroups.length} گروه)
            </button>
            {categories.map((cat) => (
              <button
                key={cat.id}
                type="button"
                onClick={() => setSelectedGroupCategoryFilter(cat.slug)}
                className={`px-3 py-1.5 rounded-control text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                  selectedGroupCategoryFilter === cat.slug
                    ? 'bg-primary text-primary-foreground font-black shadow-xs'
                    : 'bg-card text-muted-foreground hover:text-foreground border border-border/60'
                }`}
              >
                {cat.title_fa}
              </button>
            ))}
          </div>

          <div className="bg-card rounded-surface border border-border/80 shadow-surface overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-center text-xs">
                <thead>
                  <tr className="border-b border-border/60 bg-muted/30 text-muted-foreground font-bold">
                    <th className="py-3 px-4 text-center">
                      شناسه گروه (Group Tag)
                    </th>
                    <th className="py-3 px-4 text-center">
                      عنوان نمایشی فارسی
                    </th>
                    <th className="py-3 px-4 text-center">شیوه تحویل پیش‌فرض</th>
                    <th className="py-3 px-4 text-center">تعداد محصولات</th>
                    <th className="py-3 px-4 text-center">عملیات</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/60">
                  {filteredGroups.map((grp) => (
                    <tr
                      key={grp.group_tag}
                      className="hover:bg-muted/20 transition-colors"
                    >
                      <td className="py-3.5 px-4 font-mono font-latin font-bold text-center">
                        #{grp.group_tag}
                      </td>
                      <td className="py-3.5 px-4 font-bold text-foreground text-center">
                        {grp.group_title_fa}
                      </td>
                      <td className="py-3.5 px-4 text-center">
                        <button
                          type="button"
                          onClick={() =>
                            handleToggleGroupStrategy(
                              grp.group_tag,
                              grp.delivery_strategy === 'third_party_instant'
                                ? 'manual_operator'
                                : 'third_party_instant',
                            )
                          }
                          className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-control text-[11px] font-bold cursor-pointer transition-all ${
                            grp.delivery_strategy === 'third_party_instant'
                              ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                              : 'bg-amber-500/10 text-amber-500 border border-amber-500/20'
                          }`}
                        >
                          {grp.delivery_strategy === 'third_party_instant' ? (
                            <>
                              <Zap className="w-3 h-3" />
                              <span>⚡ تحویل آنی خودکار</span>
                            </>
                          ) : (
                            <>
                              <Clock className="w-3 h-3" />
                              <span>🔷 دستی اپراتور</span>
                            </>
                          )}
                        </button>
                      </td>
                      <td className="py-3.5 px-4 font-mono font-latin text-center">
                        {grp.products_count} محصول
                      </td>
                      <td className="py-3.5 px-4 text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => {
                              setGroupTagInput(grp.group_tag)
                              setGroupTitleInput(grp.group_title_fa)
                              setGroupStrategyInput(grp.delivery_strategy)
                              setIsGroupModalOpen(true)
                            }}
                            className="p-1.5 rounded-control border border-border/60 hover:bg-muted text-muted-foreground hover:text-foreground cursor-pointer transition-colors"
                            title="ویرایش مشخصات گروه"
                          >
                            <Pencil className="w-3.5 h-3.5" />
                          </button>
                          {grp.group_tag !== 'general' && (
                            <button
                              type="button"
                              onClick={() =>
                                setDeleteGroupConfirm({
                                  isOpen: true,
                                  groupTag: grp.group_tag,
                                  title: grp.group_title_fa,
                                  loading: false,
                                })
                              }
                              className="p-1.5 rounded-control border border-destructive/30 hover:bg-destructive/10 text-destructive cursor-pointer transition-colors"
                              title="حذف گروه برند"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
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

      {/* Categories Tree Grid */}
      {activeSection === 'categories' && (
        <>
          {loading ? (
            <div className="bg-card rounded-surface border border-border/80 shadow-surface">
              <LoadingState message="در حال بارگذاری دسته‌بندی‌های فروشگاه..." />
            </div>
          ) : filteredCategories.length === 0 ? (
            <div className="p-10 text-center text-muted-foreground bg-card rounded-surface border border-border/60 space-y-2">
              <AlertCircle className="w-6 h-6 text-amber-500 mx-auto" />
              <p className="text-xs font-bold text-foreground">
                دسته‌بندی یافت نشد.
              </p>
              <p className="text-[11px] text-muted-foreground">
                روی «دسته‌بندی اصلی جدید» کلیک کنید تا ساختار دسته‌های فروشگاه را
                ایجاد فرمایید.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {paginatedCategories.map((root) => (
                <div
                  key={root.id}
                  className="bg-card rounded-surface border border-border/80 shadow-surface overflow-hidden"
                >
                  {/* Root Category Header */}
                  <div className="p-4 bg-muted/20 border-b border-border/60 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-control bg-primary/10 text-primary border border-primary/20 flex items-center justify-center font-bold shrink-0">
                        <Tag className="w-4 h-4" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-black text-sm text-foreground">
                            {root.title_fa}
                          </span>
                          {root.title_en && (
                            <span className="text-xs text-muted-foreground font-mono font-latin">
                              ({root.title_en})
                            </span>
                          )}
                          <span className="text-[10px] px-2 py-0.5 rounded-control bg-secondary text-secondary-foreground font-mono font-latin">
                            /{root.slug}
                          </span>
                          <span
                            className={`text-[10px] px-2 py-0.5 rounded-control font-bold ${
                              root.is_active
                                ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                                : 'bg-muted text-muted-foreground'
                            }`}
                          >
                            {root.is_active ? 'فعال' : 'غیرفعال'}
                          </span>
                        </div>
                        {root.description && (
                          <p className="text-[11px] text-muted-foreground mt-0.5 line-clamp-1">
                            {root.description}
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5 self-end sm:self-auto">
                      <button
                        type="button"
                        onClick={() => handleOpenCreate(root.id)}
                        className="h-8 px-2.5 rounded-control border border-border/60 bg-secondary hover:bg-muted text-foreground text-xs font-bold flex items-center gap-1 cursor-pointer transition-colors shadow-xs"
                        title="افزودن زیردسته به این دسته اصلی"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>افزودن زیردسته</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => handleOpenEdit(root)}
                        className="p-1.5 rounded-control border border-border/60 hover:bg-muted text-muted-foreground hover:text-foreground cursor-pointer transition-colors"
                        title="ویرایش دسته‌بندی"
                      >
                        <Pencil className="w-3.5 h-3.5" />
                      </button>

                      <button
                        type="button"
                        onClick={() =>
                          setDeleteConfirm({
                            isOpen: true,
                            id: root.id,
                            title: root.title_fa,
                            loading: false,
                          })
                        }
                        className="p-1.5 rounded-control border border-rose-500/30 text-rose-500 hover:bg-rose-500/10 cursor-pointer transition-colors"
                        title="حذف دسته‌بندی"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* Subcategories Children List */}
                  {root.children && root.children.length > 0 ? (
                    <div className="p-4 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 bg-muted/10">
                      {root.children.map((sub) => (
                        <div
                          key={sub.id}
                          className="p-3 rounded-control border border-border/60 bg-card flex items-center justify-between gap-2 hover:border-brand/40 transition-colors shadow-xs"
                        >
                          <div className="min-w-0">
                            <div className="flex items-center gap-1.5">
                              <span className="text-muted-foreground font-mono">
                                ↳
                              </span>
                              <span className="font-bold text-xs text-foreground truncate">
                                {sub.title_fa}
                              </span>
                            </div>
                            <div className="text-[10px] text-muted-foreground font-mono font-latin truncate mr-3">
                              /{sub.slug}
                            </div>
                          </div>

                          <div className="flex items-center gap-1 shrink-0">
                            <button
                              type="button"
                              onClick={() => handleOpenEdit(sub)}
                              className="p-1 rounded-control hover:bg-muted text-muted-foreground hover:text-foreground cursor-pointer transition-colors"
                              title="ویرایش زیردسته"
                            >
                              <Pencil className="w-3 h-3" />
                            </button>
                            <button
                              type="button"
                              onClick={() =>
                                setDeleteConfirm({
                                  isOpen: true,
                                  id: sub.id,
                                  title: sub.title_fa,
                                  loading: false,
                                })
                              }
                              className="p-1 rounded-control text-rose-500 hover:bg-rose-500/10 cursor-pointer transition-colors"
                              title="حذف زیردسته"
                            >
                              <Trash2 className="w-3 h-3" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="p-3 text-[11px] text-muted-foreground bg-muted/5 flex items-center justify-between">
                      <span>این دسته اصلی هنوز زیردسته‌ای ندارد.</span>
                      <button
                        type="button"
                        onClick={() => handleOpenCreate(root.id)}
                        className="text-brand font-bold hover:underline cursor-pointer"
                      >
                        + افزودن اولین زیردسته
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* Pagination Controls */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between p-3.5 bg-card rounded-surface border border-border/80 shadow-surface text-xs">
              <span className="text-muted-foreground">
                صفحه {toPersianDigits(currentPage)} از{' '}
                {toPersianDigits(totalPages)} (مجموع{' '}
                {toPersianDigits(filteredCategories.length)} دسته‌بندی اصلی)
              </span>
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  disabled={currentPage <= 1}
                  onClick={() => setCurrentPage((p) => p - 1)}
                  className="p-1.5 rounded-control border border-border/60 hover:bg-muted text-muted-foreground hover:text-foreground disabled:opacity-30 cursor-pointer"
                  title="صفحه قبلی"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
                {Array.from({ length: totalPages }, (_, i) => i + 1).map(
                  (pNum) => (
                    <button
                      key={`cat-page-${pNum}`}
                      type="button"
                      onClick={() => setCurrentPage(pNum)}
                      className={`w-7 h-7 rounded-control font-bold font-latin cursor-pointer transition-colors ${
                        currentPage === pNum
                          ? 'bg-primary text-primary-foreground font-black'
                          : 'hover:bg-muted text-muted-foreground'
                      }`}
                    >
                      {toPersianDigits(pNum)}
                    </button>
                  ),
                )}
                <button
                  type="button"
                  disabled={currentPage >= totalPages}
                  onClick={() => setCurrentPage((p) => p + 1)}
                  className="p-1.5 rounded-control border border-border/60 hover:bg-muted text-muted-foreground hover:text-foreground disabled:opacity-30 cursor-pointer"
                  title="صفحه بعدی"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
        </>
      )}

      {/* Add / Edit Category Modal */}
      {isModalOpen &&
        createPortal(
          <div className="fixed inset-0 z-[250] w-screen h-screen min-h-screen flex items-center justify-center p-3 sm:p-5 overflow-y-auto bg-background/85 backdrop-blur-md animate-in fade-in duration-200">
            <div
              dir="rtl"
              className="relative w-full max-w-lg bg-card rounded-surface border border-border/80 shadow-surface overflow-hidden flex flex-col my-auto text-foreground animate-in zoom-in-95 duration-200"
            >
              <div className="p-4 sm:p-5 border-b border-border/60 flex items-center justify-between bg-muted/20">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-control bg-primary text-primary-foreground flex items-center justify-center font-bold">
                    <Tag className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="text-sm font-black text-foreground">
                      {editingCat
                        ? `ویرایش دسته‌بندی ${editingCat.title_fa}`
                        : 'ایجاد دسته‌بندی جدید'}
                    </h4>
                    <p className="text-[11px] text-muted-foreground">
                      تعیین مشخصات و موقعیت در درخت دسته‌بندی‌های فروشگاه
                    </p>
                  </div>
                </div>

                <ModalCloseButton onClick={() => setIsModalOpen(false)} />
              </div>

              <form
                onSubmit={handleSave}
                className="p-4 sm:p-6 space-y-4 text-right text-xs"
              >
                {/* Parent Category Selector */}
                <div className="space-y-1.5">
                  <label className="font-bold text-foreground block">
                    دسته والد (در صورت انتخاب، به زیردسته تبدیل می‌شود):
                  </label>
                  <select
                    value={parentID}
                    onChange={(e) => setParentID(e.target.value)}
                    className="w-full h-10 px-3 rounded-control border border-border/60 bg-card text-foreground outline-none focus:border-brand cursor-pointer"
                  >
                    <option value="">-- دسته اصلی (Root Category) --</option>
                    {categories
                      .filter((c) => !editingCat || c.id !== editingCat.id)
                      .map((c) => (
                        <option key={c.id} value={c.id}>
                          📁 {c.title_fa} ({c.title_en || c.slug})
                        </option>
                      ))}
                  </select>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <label className="font-bold text-foreground block">
                      عنوان فارسی دسته‌بندی{' '}
                      <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={titleFA}
                      onChange={(e) => setTitleFA(e.target.value)}
                      placeholder="مثال: هوش مصنوعی"
                      className="w-full h-10 px-3 rounded-field border border-border/60 bg-muted/20 text-foreground outline-none focus:border-brand"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="font-bold text-foreground block">
                      عنوان انگلیسی:
                    </label>
                    <input
                      type="text"
                      value={titleEN}
                      onChange={(e) => setTitleEN(e.target.value)}
                      placeholder="Artificial Intelligence"
                      className="w-full h-10 px-3 rounded-field border border-border/60 bg-muted/20 text-foreground font-mono font-latin outline-none focus:border-brand"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <label className="font-bold text-foreground block">
                      شناسه URL (اسلاگ) <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={slug}
                      onChange={(e) => setSlug(e.target.value)}
                      placeholder="ai-tools"
                      className="w-full h-10 px-3 rounded-field border border-border/60 bg-muted/20 text-foreground font-mono font-latin outline-none focus:border-brand"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="font-bold text-foreground block">
                      ترتیب نمایش (Sort Order):
                    </label>
                    <input
                      type="number"
                      value={sortOrder}
                      onChange={(e) => setSortOrder(Number(e.target.value))}
                      className="w-full h-10 px-3 rounded-field border border-border/60 bg-muted/20 text-foreground font-mono font-latin outline-none focus:border-brand"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="font-bold text-foreground block">
                    توضیحات کوتاه:
                  </label>
                  <textarea
                    rows={2}
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="توضیحات دسته‌بندی برای سئو و راهنمای کاربران..."
                    className="w-full p-2.5 rounded-field border border-border/60 bg-muted/20 text-foreground outline-none focus:border-brand resize-none"
                  />
                </div>

                <div className="flex items-center justify-between p-3 bg-muted/20 rounded-control border border-border/60">
                  <span className="font-bold text-foreground">
                    وضعیت نمایش دسته‌بندی:
                  </span>
                  <ToggleSwitch
                    checked={isActive}
                    onChange={setIsActive}
                    size="md"
                  />
                </div>

                <div className="pt-2">
                  <button
                    type="submit"
                    disabled={saving}
                    className="w-full h-11 rounded-control bg-primary hover:bg-primary-hover text-primary-foreground font-black text-xs shadow-control flex items-center justify-center gap-2 cursor-pointer duration-motion active:scale-[0.98] disabled:opacity-50"
                  >
                    {saving ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span>در حال ذخیره...</span>
                      </>
                    ) : (
                      <>
                        <Check className="w-4 h-4" />
                        <span>
                          {editingCat ? 'ذخیره تغییرات' : 'افزودن دسته‌بندی'}
                        </span>
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>,
          document.body,
        )}

      {/* Add / Edit Brand Group Modal */}
      {isGroupModalOpen &&
        createPortal(
          <div className="fixed inset-0 z-[250] w-screen h-screen min-h-screen flex items-center justify-center p-3 sm:p-5 overflow-y-auto bg-background/85 backdrop-blur-md animate-in fade-in duration-200">
            <div
              dir="rtl"
              className="relative w-full max-w-lg bg-card rounded-surface border border-border/80 shadow-surface overflow-hidden flex flex-col my-auto text-foreground animate-in zoom-in-95 duration-200"
            >
              <div className="p-4 sm:p-5 border-b border-border/60 flex items-center justify-between bg-muted/20">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-control bg-primary text-primary-foreground flex items-center justify-center font-bold">
                    <Tag className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="text-sm font-black text-foreground">
                      تعریف و ویرایش گروه برند (Brand Group)
                    </h4>
                    <p className="text-[11px] text-muted-foreground">
                      تعیین شناسه گروه جهت دسته‌بندی محصولات و استراتژی تحویل
                    </p>
                  </div>
                </div>

                <ModalCloseButton onClick={() => setIsGroupModalOpen(false)} />
              </div>

              <form
                onSubmit={handleSaveGroup}
                className="p-4 sm:p-6 space-y-4 text-right text-xs"
              >
                <div className="space-y-1.5">
                  <label className="font-bold text-foreground block">
                    شناسه انگلیسی گروه (Group Tag){' '}
                    <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={groupTagInput}
                    onChange={(e) => setGroupTagInput(e.target.value)}
                    placeholder="مثال: gemini یا chatgpt یا vpn"
                    className="w-full h-10 px-3 rounded-field border border-border/60 bg-muted/20 text-foreground font-mono font-latin outline-none focus:border-brand"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="font-bold text-foreground block">
                    عنوان نمایشی فارسی (Group Title FA){' '}
                    <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={groupTitleInput}
                    onChange={(e) => setGroupTitleInput(e.target.value)}
                    placeholder="مثال: گوگل جمینای"
                    className="w-full h-10 px-3 rounded-field border border-border/60 bg-muted/20 text-foreground outline-none focus:border-brand"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="font-bold text-foreground block">
                    شیوه تحویل پیش‌فرض گروه:
                  </label>
                  <select
                    value={groupStrategyInput}
                    onChange={(e) =>
                      setGroupStrategyInput(e.target.value as any)
                    }
                    className="w-full h-10 px-3 rounded-control border border-border/60 bg-card text-foreground outline-none cursor-pointer"
                  >
                    <option value="third_party_instant">
                      ⚡ تحویل آنی خودکار از ربات
                    </option>
                    <option value="manual_operator">
                      🔷 تحویل دستی در صف اپراتور
                    </option>
                  </select>
                </div>

                <div className="pt-2">
                  <button
                    type="submit"
                    disabled={savingGroup}
                    className="w-full h-11 rounded-control bg-primary hover:bg-primary-hover text-primary-foreground font-black text-xs shadow-control flex items-center justify-center gap-2 cursor-pointer duration-motion active:scale-[0.98] disabled:opacity-50"
                  >
                    {savingGroup ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span>در حال ذخیره...</span>
                      </>
                    ) : (
                      <>
                        <Check className="w-4 h-4" />
                        <span>ذخیره مشخصات گروه برند</span>
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>,
          document.body,
        )}

      {/* Delete Confirmation Modal */}
      <ConfirmModal
        isOpen={deleteConfirm.isOpen}
        title="حذف دسته‌بندی فروشگاه"
        message={`آیا از حذف دسته‌بندی «${deleteConfirm.title}» اطمینان دارید؟ در صورت داشتن زیردسته، زیردسته‌های آن نیز حذف خواهند شد.`}
        confirmText="بله، حذف شود"
        cancelText="انصراف"
        loading={deleteConfirm.loading}
        onConfirm={handleDeleteConfirm}
        onClose={() =>
          setDeleteConfirm({
            isOpen: false,
            id: null,
            title: '',
            loading: false,
          })
        }
      />

      {/* Delete Group Confirmation Modal */}
      <ConfirmModal
        isOpen={deleteGroupConfirm.isOpen}
        title="حذف گروه برند"
        message={`آیا از حذف گروه برند «${deleteGroupConfirm.title}» اطمینان دارید؟ محصولات مرتبط به دسته عمومی ارجاع داده خواهند شد.`}
        confirmText="بله، حذف شود"
        cancelText="انصراف"
        loading={deleteGroupConfirm.loading}
        onConfirm={handleDeleteGroupConfirm}
        onClose={() =>
          setDeleteGroupConfirm({
            isOpen: false,
            groupTag: '',
            title: '',
            loading: false,
          })
        }
      />
    </div>
  )
}
