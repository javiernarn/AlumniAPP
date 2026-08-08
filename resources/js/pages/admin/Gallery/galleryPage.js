"use client"
import { useState, useEffect, useCallback, useMemo, useRef } from "react"
import {
  Card,
  Row,
  Col,
  Button,
  Input,
  Select,
  Typography,
  Space,
  Modal,
  Form,
  Upload,
  message,
  Spin,
  Empty,
  Tooltip,
  Statistic,
  DatePicker,
  Image,
  Pagination,
  Tag,
  Dropdown,
  Menu,
  Checkbox,
  Carousel,
} from "antd"
import {
  PlusOutlined,
  SearchOutlined,
  DownloadOutlined,
  DeleteOutlined,
  EditOutlined,
  EyeOutlined,
  PictureOutlined,
  CalendarOutlined,
  CloudUploadOutlined,
  FilterOutlined,
  MoreOutlined,
  FileImageOutlined,
  ClockCircleOutlined,
  UserOutlined,
  ZoomInOutlined,
  ZoomOutOutlined,
  LeftOutlined,
  RightOutlined,
  CloseOutlined,
  CheckCircleOutlined,
  ExclamationCircleOutlined,
  SelectOutlined,
  CloseCircleOutlined,
  AppstoreOutlined,
  RotateLeftOutlined,
  RotateRightOutlined,
  SwapOutlined,
  UndoOutlined,
  WarningOutlined,
} from "@ant-design/icons"
import moment from "moment"
import dayjs from "dayjs"
import { Layout } from "~/components"
import axiosConfig from "~/utils/axiosConfig"
import secureLocalStorage from "react-secure-storage"
import logo from "~/assets/images/OCC_LOGO.png"
import "./galleryPage.css"

const { Title, Text, Paragraph } = Typography
const { Option } = Select
const { Dragger } = Upload

// Constants for image limits
const MAX_IMAGES_PER_UPLOAD = 50

// ===== Draft Auto-Save: storage keys & helpers (additive, non-breaking) =====
const GALLERY_UPLOAD_DRAFT_KEY = "alumni-gallery-upload-draft"
const GALLERY_EDIT_DRAFT_KEY = "alumni-gallery-edit-draft"

// Convert a File/Blob to a base64 data URL so staged images persist across reloads.
const fileToDataUrl = (file) =>
  new Promise((resolve) => {
    try {
      const reader = new FileReader()
      reader.onload = () => resolve(reader.result)
      reader.onerror = () => resolve(null)
      reader.readAsDataURL(file)
    } catch (e) {
      resolve(null)
    }
  })

// Convert a base64 data URL back into a File so it can be re-uploaded.
const dataUrlToFile = (dataUrl, filename, mime) => {
  try {
    const arr = dataUrl.split(",")
    const bstr = atob(arr[1])
    let n = bstr.length
    const u8 = new Uint8Array(n)
    while (n--) u8[n] = bstr.charCodeAt(n)
    return new File([u8], filename, { type: mime || arr[0].match(/:(.*?);/)?.[1] || "image/jpeg" })
  } catch (e) {
    return null
  }
}

const safeGetDraft = (key) => {
  try { return secureLocalStorage.getItem(key) || null } catch (e) { return null }
}
const safeSetDraft = (key, value) => {
  try { secureLocalStorage.setItem(key, value) } catch (e) { /* quota or serialize error */ }
}
const safeClearDraft = (key) => {
  try { secureLocalStorage.removeItem(key) } catch (e) { }
}


const GalleryPage = () => {
  // State management
  const [galleries, setGalleries] = useState([])
  const [loading, setLoading] = useState(true)
  const [uploading, setUploading] = useState(false)
  const [statistics, setStatistics] = useState({
    total_images: 0,
    total_size: "0 KB",
    this_month_uploads: 0,
  })

  // Modal states
  const [uploadModalVisible, setUploadModalVisible] = useState(false)
  const [editModalVisible, setEditModalVisible] = useState(false)
  const [deleteModalVisible, setDeleteModalVisible] = useState(false)
  const [previewVisible, setPreviewVisible] = useState(false)
  const [bulkDeleteModalVisible, setBulkDeleteModalVisible] = useState(false)

  // Selected items
  const [selectedGallery, setSelectedGallery] = useState(null)
  const [currentImageIndex, setCurrentImageIndex] = useState(0)

  // Selection mode for bulk download/delete
  const [selectionMode, setSelectionMode] = useState(false)
  const [selectedImages, setSelectedImages] = useState([])

  // NEW: indexes of existing gallery images marked for removal during edit
  const [removedExistingIndexes, setRemovedExistingIndexes] = useState([])

  // NEW: "view all" lightbox state (used by edit/delete +N badges)
  const [viewAllGallery, setViewAllGallery] = useState(null)
  const [viewAllVisible, setViewAllVisible] = useState(false)
  const [viewAllIndex, setViewAllIndex] = useState(0)

  // ===== Orientation tracking for the image-preview lightbox =====
  // rc-image (antd's Image.PreviewGroup) computes its initial "contain"
  // scale once, from the viewport size at the moment the preview mounts.
  // It does not reliably recompute that scale after a rotation, since
  // mobile browsers fire resize/orientationchange late or inconsistently.
  // Result: rotate to landscape while a portrait photo is open, and the
  // lightbox keeps the scale that fit the old (portrait) viewport, which
  // now overflows vertically — the photo looks zoomed in and cropped.
  // Fix: remount the PreviewGroup on orientation change (via `key` below)
  // so it recalculates fresh against the current viewport.
  const [previewOrientation, setPreviewOrientation] = useState(() =>
    typeof window !== "undefined" && window.matchMedia("(orientation: landscape)").matches
      ? "landscape"
      : "portrait"
  )

  useEffect(() => {
    const mql = window.matchMedia("(orientation: landscape)")
    const handleOrientationChange = () => setPreviewOrientation(mql.matches ? "landscape" : "portrait")
    if (mql.addEventListener) {
      mql.addEventListener("change", handleOrientationChange)
    } else {
      mql.addListener(handleOrientationChange)
    }
    return () => {
      if (mql.removeEventListener) {
        mql.removeEventListener("change", handleOrientationChange)
      } else {
        mql.removeListener(handleOrientationChange)
      }
    }
  }, [])

  // Filters
  const [searchText, setSearchText] = useState("")
  const [selectedYear, setSelectedYear] = useState(null)
  const [selectedMonth, setSelectedMonth] = useState(null)

  // Pagination
  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize, setPageSize] = useState(12)
  const [total, setTotal] = useState(0)

  // Form
  const [form] = Form.useForm()
  const [editForm] = Form.useForm()
  const [fileList, setFileList] = useState([])

  // Event Date can't be set in the future — only today or earlier is selectable
  const disableFutureDates = (current) => current && current > dayjs().endOf("day")

  // ===== Draft Auto-Save: internal flags =====
  // Suppress auto-save during programmatic restore so we don't immediately overwrite the loaded draft.
  const suppressAutoSaveRef = useRef(false)
  // Track whether we've already prompted the user to resume an unsaved draft this session.
  const resumeHandledRef = useRef(false)
  // Debounce timer for upload draft saving.
  const uploadSaveTimerRef = useRef(null)
  // Debounce timer for edit draft saving.
  const editSaveTimerRef = useRef(null)

  // User role
  const userRole = secureLocalStorage.getItem("userRole")
  const isAdmin = userRole === "admin"


  // Reveal animation flag (matches AboutPage / FaqPage pattern)
  const [revealed, setRevealed] = useState(false)

  useEffect(() => {
 
    const t = setTimeout(() => setRevealed(true), 60)
    return () => clearTimeout(t)
  }, [])

  // Fetch galleries - now handles multiple images per gallery
  const fetchGalleries = useCallback(async () => {
    setLoading(true)
    try {
      const params = {
        page: currentPage,
        per_page: pageSize,
      }
      if (searchText) params.search = searchText
      if (selectedYear) params.year = selectedYear
      if (selectedMonth) params.month = selectedMonth

      const response = await axiosConfig.get("/galleries", { params })
      if (response.data.success) {
        setGalleries(response.data.data.data || [])
        setTotal(response.data.data.total || 0)
      }
    } catch (error) {
      console.error("Error fetching galleries:", error)
      message.error("Failed to load gallery images")
    } finally {
      setLoading(false)
    }
  }, [currentPage, pageSize, searchText, selectedYear, selectedMonth])

  // Fetch statistics
  const fetchStatistics = useCallback(async () => {
    try {
      const response = await axiosConfig.get("/galleries/statistics")
      if (response.data.success) {
        setStatistics(response.data.data)
      }
    } catch (error) {
      console.error("Error fetching statistics:", error)
    }
  }, [])

  useEffect(() => {
    fetchGalleries()
    fetchStatistics()
  }, [fetchGalleries, fetchStatistics])

  // Helper function to get images array from gallery
  const getGalleryImages = (gallery) => {
    if (gallery.image_urls && Array.isArray(gallery.image_urls) && gallery.image_urls.length > 0) {
      return gallery.image_urls
    }
    if (gallery.image_url) {
      return [gallery.image_url]
    }
    return []
  }

  // Get image count for a gallery
  const getImageCount = (gallery) => {
    return getGalleryImages(gallery).length
  }

  // NEW: build object URL for a not-yet-uploaded file
  const getFileThumbUrl = (file) => {
    if (file.url) return file.url
    if (file.thumbUrl) return file.thumbUrl
    if (file.originFileObj) {
      try { return URL.createObjectURL(file.originFileObj) } catch (e) { return "" }
    }
    return ""
  }

  // NEW: open view-all lightbox for arbitrary image list
  const openViewAll = (gallery, imagesOverride = null, startIndex = 0) => {
    setViewAllGallery({ ...gallery, _filteredImages: imagesOverride || getGalleryImages(gallery) })
    setViewAllIndex(startIndex)
    setViewAllVisible(true)
  }

  // ===== Draft Auto-Save: serialize / restore for UPLOAD modal =====
  const buildFileListFromDraftFiles = (draftFiles) => {
    if (!Array.isArray(draftFiles)) return []
    return draftFiles
      .map((f, i) => {
        const file = dataUrlToFile(f.dataUrl, f.name || `image-${i + 1}.jpg`, f.type)
        if (!file) return null
        return {
          uid: f.uid || `restored-${i}-${Date.now()}`,
          name: f.name || file.name,
          status: "done",
          type: file.type,
          size: file.size,
          originFileObj: file,
          thumbUrl: f.dataUrl,
          url: f.dataUrl,
        }
      })
      .filter(Boolean)
  }

  const serializeFileList = async (list) => {
    const out = []
    for (const f of list) {
      const blob = f.originFileObj || (f.url && f.url.startsWith("data:") ? null : null)
      // Prefer existing data URL on the file entry (already restored items)
      if (f.url && typeof f.url === "string" && f.url.startsWith("data:")) {
        out.push({ uid: f.uid, name: f.name, type: f.type, dataUrl: f.url })
        continue
      }
      if (blob) {
        const dataUrl = await fileToDataUrl(blob)
        if (dataUrl) out.push({ uid: f.uid, name: f.name, type: blob.type, dataUrl })
      }
    }
    return out
  }

  const saveUploadDraft = useCallback(async () => {
    if (suppressAutoSaveRef.current) return
    try {
      const values = form.getFieldsValue()
      const title = (values.title || "").trim()
      const eventDate = values.event_date ? values.event_date.format("YYYY-MM-DD") : null
      const files = await serializeFileList(fileList)
      const hasContent = !!(title || eventDate || files.length > 0)
      if (!hasContent) {
        safeClearDraft(GALLERY_UPLOAD_DRAFT_KEY)
        return
      }
      safeSetDraft(GALLERY_UPLOAD_DRAFT_KEY, {
        mode: "create",
        title,
        event_date: eventDate,
        files,
        savedAt: new Date().toISOString(),
      })
    } catch (e) {
      // ignore
    }
  }, [form, fileList])

  const scheduleSaveUploadDraft = useCallback(() => {
    if (uploadSaveTimerRef.current) clearTimeout(uploadSaveTimerRef.current)
    uploadSaveTimerRef.current = setTimeout(() => { saveUploadDraft() }, 500)
  }, [saveUploadDraft])

  const restoreUploadDraft = (draft) => {
    suppressAutoSaveRef.current = true
    try {
      form.setFieldsValue({
        title: draft.title || "",
        event_date: draft.event_date ? dayjs(draft.event_date) : null,
      })
      const restored = buildFileListFromDraftFiles(draft.files || [])
      setFileList(restored)
    } finally {
      // Re-enable after a tick so the change events from setFieldsValue/setFileList don't immediately re-save
      setTimeout(() => { suppressAutoSaveRef.current = false }, 250)
    }
  }

  const hasUploadDirtyContent = () => {
    const values = form.getFieldsValue()
    const title = (values.title || "").trim()
    return !!(title || values.event_date || (fileList && fileList.length > 0))
  }

  // ===== Draft Auto-Save: serialize / restore for EDIT modal =====
  const saveEditDraft = useCallback(async () => {
    if (suppressAutoSaveRef.current) return
    if (!selectedGallery) return
    try {
      const values = editForm.getFieldsValue()
      const title = (values.title || "").trim()
      const eventDate = values.event_date ? values.event_date.format("YYYY-MM-DD") : null
      const files = await serializeFileList(fileList)
      const baseTitle = selectedGallery.title || ""
      const baseDate = selectedGallery.event_date
        ? dayjs(selectedGallery.event_date).format("YYYY-MM-DD")
        : null
      const dirty =
        title !== baseTitle ||
        eventDate !== baseDate ||
        files.length > 0 ||
        (removedExistingIndexes && removedExistingIndexes.length > 0)
      if (!dirty) {
        safeClearDraft(GALLERY_EDIT_DRAFT_KEY)
        return
      }
      safeSetDraft(GALLERY_EDIT_DRAFT_KEY, {
        mode: "edit",
        galleryId: selectedGallery.id,
        title,
        event_date: eventDate,
        files,
        removedExistingIndexes: removedExistingIndexes || [],
        savedAt: new Date().toISOString(),
      })
    } catch (e) {
      // ignore
    }
  }, [editForm, fileList, selectedGallery, removedExistingIndexes])

  const scheduleSaveEditDraft = useCallback(() => {
    if (editSaveTimerRef.current) clearTimeout(editSaveTimerRef.current)
    editSaveTimerRef.current = setTimeout(() => { saveEditDraft() }, 500)
  }, [saveEditDraft])

  const hasEditDirtyContent = () => {
    if (!selectedGallery) return false
    const values = editForm.getFieldsValue()
    const title = (values.title || "").trim()
    const eventDate = values.event_date ? values.event_date.format("YYYY-MM-DD") : null
    const baseTitle = selectedGallery.title || ""
    const baseDate = selectedGallery.event_date
      ? dayjs(selectedGallery.event_date).format("YYYY-MM-DD")
      : null
    return (
      title !== baseTitle ||
      eventDate !== baseDate ||
      (fileList && fileList.length > 0) ||
      (removedExistingIndexes && removedExistingIndexes.length > 0)
    )
  }

  // ===== Draft Auto-Save: auto-save when modal contents change =====
  useEffect(() => {
    if (!uploadModalVisible) return
    scheduleSaveUploadDraft()
    return () => {
      if (uploadSaveTimerRef.current) clearTimeout(uploadSaveTimerRef.current)
    }
  }, [uploadModalVisible, fileList, scheduleSaveUploadDraft])

  useEffect(() => {
    if (!editModalVisible) return
    scheduleSaveEditDraft()
    return () => {
      if (editSaveTimerRef.current) clearTimeout(editSaveTimerRef.current)
    }
  }, [editModalVisible, fileList, removedExistingIndexes, scheduleSaveEditDraft])

  // ===== Draft Auto-Save: on mount, prompt to resume if unsaved upload draft exists =====
  useEffect(() => {
    if (resumeHandledRef.current) return
    resumeHandledRef.current = true
    const draft = safeGetDraft(GALLERY_UPLOAD_DRAFT_KEY)
    if (!draft || draft.mode !== "create") return
    const hasAny =
      (draft.title && draft.title.length > 0) ||
      draft.event_date ||
      (Array.isArray(draft.files) && draft.files.length > 0)
    if (!hasAny) return

    Modal.confirm({
      title: "Resume your unsaved gallery?",
      icon: <ExclamationCircleOutlined />,
      content: (
        <div>
          <p>
            You have an unfinished gallery draft
            {draft.savedAt ? ` from ${dayjs(draft.savedAt).format("MMM D, YYYY h:mm A")}` : ""}.
          </p>
          <p style={{ marginBottom: 0 }}>
            <strong>Continue</strong> to restore your fields and images, or <strong>Discard</strong> to delete the draft.
          </p>
        </div>
      ),
      okText: "Continue",
      cancelText: "Discard",
      okButtonProps: { icon: <CheckCircleOutlined /> },
      cancelButtonProps: { danger: true, icon: <DeleteOutlined /> },
      onOk: () => {
        restoreUploadDraft(draft)
        setUploadModalVisible(true)
      },
      onCancel: () => {
        safeClearDraft(GALLERY_UPLOAD_DRAFT_KEY)
      },
    })
    // Run only once
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // ===== Draft Auto-Save: confirm-on-close handlers =====
  const requestCloseUploadModal = () => {
    if (!hasUploadDirtyContent()) {
      setUploadModalVisible(false)
      form.resetFields()
      setFileList([])
      safeClearDraft(GALLERY_UPLOAD_DRAFT_KEY)
      return
    }
    Modal.confirm({
      title: "Keep your unsaved changes?",
      icon: <WarningOutlined style={{ color: "#f59e0b" }} />,
      content: "You have unsaved fields or images. Continue editing later, or discard everything now?",
      okText: "Continue",
      cancelText: "Discard",
      okButtonProps: { icon: <CheckCircleOutlined /> },
      cancelButtonProps: { danger: true, icon: <DeleteOutlined /> },
      onOk: async () => {
        // Persist current state and close — user can resume later.
        await saveUploadDraft()
        setUploadModalVisible(false)
      },
      onCancel: () => {
        // Discard: clear fields, file list, and any saved draft.
        safeClearDraft(GALLERY_UPLOAD_DRAFT_KEY)
        form.resetFields()
        setFileList([])
        setUploadModalVisible(false)
      },
    })
  }

  const requestCloseEditModal = () => {
    if (!hasEditDirtyContent()) {
      setEditModalVisible(false)
      editForm.resetFields()
      setFileList([])
      setRemovedExistingIndexes([])
      setSelectedGallery(null)
      safeClearDraft(GALLERY_EDIT_DRAFT_KEY)
      return
    }
    Modal.confirm({
      title: "Keep your unsaved changes?",
      icon: <WarningOutlined style={{ color: "#f59e0b" }} />,
      content: "You have unsaved edits on this gallery. Continue editing later, or discard the changes now?",
      okText: "Continue",
      cancelText: "Discard",
      okButtonProps: { icon: <CheckCircleOutlined /> },
      cancelButtonProps: { danger: true, icon: <DeleteOutlined /> },
      onOk: async () => {
        await saveEditDraft()
        setEditModalVisible(false)
      },
      onCancel: () => {
        safeClearDraft(GALLERY_EDIT_DRAFT_KEY)
        editForm.resetFields()
        setFileList([])
        setRemovedExistingIndexes([])
        setSelectedGallery(null)
        setEditModalVisible(false)
      },
    })
  }

  // Upload handlers
  const handleUpload = async (values) => {
    if (!values.title || !values.title.trim()) {
      message.error("Please enter a title")
      return
    }

    if (!values.event_date) {
      message.error("Please select an event date")
      return
    }

    if (fileList.length === 0) {
      message.error("Please select at least one image to upload")
      return
    }

    if (fileList.length > MAX_IMAGES_PER_UPLOAD) {
      message.error(`You can only upload up to ${MAX_IMAGES_PER_UPLOAD} images at a time`)
      return
    }

    setUploading(true)
    const formData = new FormData()
    formData.append("title", values.title.trim())
    formData.append("event_date", values.event_date.format("YYYY-MM-DD"))

    fileList.forEach((file, index) => {
      formData.append(`images[${index}]`, file.originFileObj)
    })

    try {
      const response = await axiosConfig.post("/galleries", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      })
      if (response.data.success) {
        message.success(`Gallery created with ${fileList.length} image(s)!`)
        setUploadModalVisible(false)
        form.resetFields()
        setFileList([])
        // Clear the saved draft now that it has been persisted to the server.
        safeClearDraft(GALLERY_UPLOAD_DRAFT_KEY)
        fetchGalleries()
        fetchStatistics()
      }
    } catch (error) {
      console.error("Upload error:", error)
      const errorMsg = error.response?.data?.errors
        ? Object.values(error.response.data.errors).flat().join(', ')
        : error.response?.data?.message || "Failed to upload images"
      message.error(errorMsg)
    } finally {
      setUploading(false)
    }
  }

  // Edit handlers
  const handleEdit = (gallery) => {
    setSelectedGallery(gallery)
    setRemovedExistingIndexes([])
    setFileList([])
    editForm.setFieldsValue({
      title: gallery.title,
      event_date: gallery.event_date ? dayjs(gallery.event_date) : null,
    })

    // If we have a saved edit draft for the same gallery, offer to restore it.
    const draft = safeGetDraft(GALLERY_EDIT_DRAFT_KEY)
    if (draft && draft.mode === "edit" && draft.galleryId === gallery.id) {
      Modal.confirm({
        title: "Resume your unsaved edits?",
        icon: <ExclamationCircleOutlined />,
        content: (
          <div>
            <p>
              You have unsaved edits on this gallery
              {draft.savedAt ? ` from ${dayjs(draft.savedAt).format("MMM D, YYYY h:mm A")}` : ""}.
            </p>
            <p style={{ marginBottom: 0 }}>
              <strong>Continue</strong> to restore your changes, or <strong>Discard</strong> to start fresh.
            </p>
          </div>
        ),
        okText: "Continue",
        cancelText: "Discard",
        okButtonProps: { icon: <CheckCircleOutlined /> },
        cancelButtonProps: { danger: true, icon: <DeleteOutlined /> },
        onOk: () => {
          suppressAutoSaveRef.current = true
          try {
            editForm.setFieldsValue({
              title: draft.title || gallery.title,
              event_date: draft.event_date ? dayjs(draft.event_date) : (gallery.event_date ? dayjs(gallery.event_date) : null),
            })
            setFileList(buildFileListFromDraftFiles(draft.files || []))
            setRemovedExistingIndexes(Array.isArray(draft.removedExistingIndexes) ? draft.removedExistingIndexes : [])
          } finally {
            setTimeout(() => { suppressAutoSaveRef.current = false }, 250)
          }
          setEditModalVisible(true)
        },
        onCancel: () => {
          safeClearDraft(GALLERY_EDIT_DRAFT_KEY)
          setEditModalVisible(true)
        },
      })
    } else {
      setEditModalVisible(true)
    }
  }

  const handleEditSubmit = async (values) => {
    if (!values.title || !values.title.trim()) {
      message.error("Please enter a title")
      return
    }

    if (!values.event_date) {
      message.error("Please select an event date")
      return
    }

    setUploading(true)
    const formData = new FormData()
    formData.append("title", values.title.trim())
    formData.append("event_date", values.event_date.format("YYYY-MM-DD"))

    if (fileList.length > 0) {
      fileList.forEach((file, index) => {
        formData.append(`images[${index}]`, file.originFileObj)
      })
    }

    // NEW: send indexes of existing images the admin chose to remove
    if (removedExistingIndexes.length > 0) {
      removedExistingIndexes.forEach((idx, i) => {
        formData.append(`removed_indexes[${i}]`, idx)
      })
    }

    try {
      const response = await axiosConfig.post(`/galleries/${selectedGallery.id}`, formData, {
        headers: { "Content-Type": "multipart/form-data" },
      })
      if (response.data.success) {
        message.success("Gallery updated successfully!")
        setEditModalVisible(false)
        editForm.resetFields()
        setFileList([])
        setRemovedExistingIndexes([])
        setSelectedGallery(null)
        // Clear the edit draft now that the changes are saved on the server.
        safeClearDraft(GALLERY_EDIT_DRAFT_KEY)
        fetchGalleries()
      }
    } catch (error) {
      console.error("Edit error:", error)
      const errorMsg = error.response?.data?.errors
        ? Object.values(error.response.data.errors).flat().join(', ')
        : error.response?.data?.message || "Failed to update gallery"
      message.error(errorMsg)
    } finally {
      setUploading(false)
    }
  }

  // Delete handlers
  const handleDelete = (gallery) => {
    setSelectedGallery(gallery)
    setDeleteModalVisible(true)
  }

  const confirmDelete = async () => {
    try {
      const response = await axiosConfig.delete(`/galleries/${selectedGallery.id}`)
      if (response.data.success) {
        message.success("Gallery deleted successfully!")
        setDeleteModalVisible(false)
        setSelectedGallery(null)
        fetchGalleries()
        fetchStatistics()
      }
    } catch (error) {
      console.error("Delete error:", error)
      message.error(error.response?.data?.message || "Failed to delete gallery")
    }
  }

  // Bulk delete handlers
  const handleBulkDelete = () => {
    if (selectedImages.length === 0) {
      message.warning("Please select at least one gallery to delete")
      return
    }
    setBulkDeleteModalVisible(true)
  }

  const confirmBulkDelete = async () => {
    if (selectedImages.length === 0) return

    message.loading({ content: `Deleting ${selectedImages.length} gallery(s)...`, key: "bulk-delete", duration: 0 })

    let successCount = 0
    let failCount = 0

    for (const galleryId of selectedImages) {
      try {
        const response = await axiosConfig.delete(`/galleries/${galleryId}`)
        if (response.data.success) {
          successCount++
        } else {
          failCount++
        }
      } catch (error) {
        console.error("Delete error for gallery:", galleryId, error)
        failCount++
      }
    }

    setBulkDeleteModalVisible(false)
    setSelectionMode(false)
    setSelectedImages([])
    fetchGalleries()
    fetchStatistics()

    if (failCount === 0) {
      message.success({ content: `Successfully deleted ${successCount} gallery(s)!`, key: "bulk-delete" })
    } else {
      message.warning({ content: `Deleted ${successCount} gallery(s), ${failCount} failed.`, key: "bulk-delete" })
    }
  }

  // Download single image
  const handleDownload = async (gallery, imageIndex = 0) => {
    try {
      message.loading({ content: "Preparing download...", key: "download" })
      const response = await axiosConfig.get(`/galleries/${gallery.id}/download`, {
        responseType: "blob",
        params: { index: imageIndex }
      })

      const url = window.URL.createObjectURL(new Blob([response.data]))
      const link = document.createElement("a")
      link.href = url
      link.setAttribute("download", gallery.original_name || `${gallery.title}-${imageIndex + 1}.${gallery.file_type || 'jpg'}`)
      document.body.appendChild(link)
      link.click()
      link.remove()
      window.URL.revokeObjectURL(url)
      message.success({ content: "Download started!", key: "download" })
    } catch (error) {
      console.error("Download error:", error)
      message.error({ content: "Failed to download image", key: "download" })
    }
  }

  // Download all images from a gallery (with confirmation)
  const handleDownloadGallery = (gallery) => {
    const images = getGalleryImages(gallery)
    if (images.length === 0) {
      message.warning("No images to download")
      return
    }
    Modal.confirm({
      title: "Download all photos?",
      icon: <ExclamationCircleOutlined />,
      content: `Are you sure you want to download all ${images.length} photo(s) from "${gallery.title}"?`,
      okText: "Yes, download all",
      cancelText: "No",
      okButtonProps: { icon: <DownloadOutlined /> },
      onOk: () => doDownloadGallery(gallery),
    })
  }

  const doDownloadGallery = async (gallery) => {
    const images = getGalleryImages(gallery)
    if (images.length === 0) {
      message.warning("No images to download")
      return
    }

    message.loading({ content: `Downloading ${images.length} image(s)...`, key: "download-gallery", duration: 0 })

    let successCount = 0
    for (let i = 0; i < images.length; i++) {
      try {
        const response = await axiosConfig.get(`/galleries/${gallery.id}/download`, {
          responseType: "blob",
          params: { index: i }
        })

        const url = window.URL.createObjectURL(new Blob([response.data]))
        const link = document.createElement("a")
        link.href = url
        link.setAttribute("download", `${gallery.title}-${i + 1}.${gallery.file_type || 'jpg'}`)
        document.body.appendChild(link)
        link.click()
        link.remove()
        window.URL.revokeObjectURL(url)
        successCount++
        await new Promise(resolve => setTimeout(resolve, 300))
      } catch (error) {
        console.error("Download error for image:", i, error)
      }
    }

    message.success({ content: `Downloaded ${successCount} image(s)!`, key: "download-gallery" })
  }

  // Toggle selection mode
  const toggleSelectionMode = () => {
    setSelectionMode(!selectionMode)
    setSelectedImages([])
  }

  // Toggle image selection
  const toggleImageSelection = (galleryId) => {
    setSelectedImages(prev => {
      if (prev.includes(galleryId)) {
        return prev.filter(id => id !== galleryId)
      } else {
        return [...prev, galleryId]
      }
    })
  }

  // Select all visible galleries
  const selectAllImages = () => {
    setSelectedImages(galleries.map(g => g.id))
  }

  // Deselect all
  const deselectAllImages = () => {
    setSelectedImages([])
  }

  // Download selected galleries (with confirmation)
  const handleDownloadSelected = () => {
    if (selectedImages.length === 0) {
      message.warning("Please select at least one gallery to download")
      return
    }
    Modal.confirm({
      title: "Download selected photos?",
      icon: <ExclamationCircleOutlined />,
      content: `Are you sure you want to download all photos from ${selectedImages.length} selected gallery(ies)?`,
      okText: "Yes, download all",
      cancelText: "No",
      okButtonProps: { icon: <DownloadOutlined /> },
      onOk: () => doDownloadSelected(),
    })
  }

  const doDownloadSelected = async () => {
    if (selectedImages.length === 0) {
      message.warning("Please select at least one gallery to download")
      return
    }

    message.loading({ content: `Downloading selected galleries...`, key: "bulk-download", duration: 0 })

    let successCount = 0
    for (const galleryId of selectedImages) {
      const gallery = galleries.find(g => g.id === galleryId)
      if (!gallery) continue

      const images = getGalleryImages(gallery)
      for (let i = 0; i < images.length; i++) {
        try {
          const response = await axiosConfig.get(`/galleries/${galleryId}/download`, {
            responseType: "blob",
            params: { index: i }
          })

          const url = window.URL.createObjectURL(new Blob([response.data]))
          const link = document.createElement("a")
          link.href = url
          link.setAttribute("download", `${gallery.title}-${i + 1}.${gallery.file_type || 'jpg'}`)
          document.body.appendChild(link)
          link.click()
          link.remove()
          window.URL.revokeObjectURL(url)
          successCount++
          await new Promise(resolve => setTimeout(resolve, 200))
        } catch (error) {
          console.error("Download error:", error)
        }
      }
    }

    message.success({ content: `Downloaded ${successCount} image(s)!`, key: "bulk-download" })
    setSelectionMode(false)
    setSelectedImages([])
  }

  // Open the antd preview (with built-in zoom in/out, rotate)
  const openPreview = (gallery, imageIndex = 0) => {
    setSelectedGallery(gallery)
    setCurrentImageIndex(imageIndex)
    setPreviewVisible(true)
  }

  const closePreview = () => {
    setPreviewVisible(false)
  }

  // Upload props
  const uploadProps = {
    name: "images",
    multiple: true,
    fileList,
    showUploadList: false, // we render our own thumbnails with view + remove
    beforeUpload: (file) => {
      const isValidType = ["image/png", "image/jpeg", "image/jpg"].includes(file.type)
      if (!isValidType) {
        message.error("Only PNG, JPG, and JPEG files are allowed!")
        return Upload.LIST_IGNORE
      }
      const isLt10M = file.size / 1024 / 1024 < 10
      if (!isLt10M) {
        message.error("Each image must be smaller than 10MB!")
        return Upload.LIST_IGNORE
      }
      return false
    },
    onChange: ({ fileList: newFileList }) => {
      if (newFileList.length > MAX_IMAGES_PER_UPLOAD) {
        message.warning(`You can only upload up to ${MAX_IMAGES_PER_UPLOAD} images at a time`)
        setFileList(newFileList.slice(0, MAX_IMAGES_PER_UPLOAD))
      } else {
        setFileList(newFileList)
      }
    },
    onRemove: (file) => {
      setFileList((prev) => prev.filter((f) => f.uid !== file.uid))
    },
  }

  // NEW: shared thumbnail grid for files staged in fileList (with view + remove)
  const renderStagedThumbs = () => {
    if (fileList.length === 0) return null
    return (
      <div
        className="gal-upload-thumbs"
        style={{
          marginTop: 10,
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(90px, 1fr))",
          gap: 8,
          maxHeight: 240,
          overflowY: "auto",
          padding: 8,
          border: "1px dashed var(--border, #e5e7eb)",
          borderRadius: 10,
          background: "var(--surface-2, #f3f4f6)",
        }}
      >
        <Image.PreviewGroup>
          {fileList.map((file) => {
            const src = getFileThumbUrl(file)
            return (
              <div
                key={file.uid}
                style={{
                  position: "relative",
                  width: "100%",
                  paddingTop: "100%",
                  borderRadius: 8,
                  overflow: "hidden",
                  background: "#000",
                  boxShadow: "0 1px 4px rgba(0,0,0,0.15)",
                }}
              >
                <Image
                  src={src}
                  alt={file.name}
                  preview={{ mask: <EyeOutlined style={{ fontSize: 18 }} /> }}
                  fallback="data:image/svg+xml;charset=UTF-8,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 64 64%22%3E%3Crect width=%2264%22 height=%2264%22 fill=%22%231a1f2b%22/%3E%3Cpath d=%22M20 44l8-10 6 7 4-5 6 8H20z%22 fill=%22%23475569%22/%3E%3Ccircle cx=%2224%22 cy=%2224%22 r=%224%22 fill=%22%23475569%22/%3E%3C/svg%3E"
                  rootClassName="gal-thumb-image"
                  wrapperStyle={{
                    position: "absolute",
                    inset: 0,
                    width: "100%",
                    height: "100%",
                    display: "block",
                  }}
                  style={{
                    width: "100%",
                    height: "100%",
                    objectFit: "cover",
                    display: "block",
                  }}
                  onError={(e) => { try { e.target.style.opacity = 0.4 } catch (_) { } }}
                />
                <Tooltip title="Remove">
                  <Button
                    size="small"
                    danger
                    shape="circle"
                    icon={<CloseOutlined />}
                    onClick={(e) => {
                      e.stopPropagation()
                      setFileList((prev) => prev.filter((f) => f.uid !== file.uid))
                    }}
                    style={{
                      position: "absolute",
                      top: 4,
                      right: 4,
                      zIndex: 3,
                    }}
                  />
                </Tooltip>
              </div>
            )
          })}
        </Image.PreviewGroup>
      </div>
    )
  }

  // Generate year options
  const yearOptions = useMemo(() => {
    const currentYear = new Date().getFullYear()
    const years = []
    for (let i = currentYear; i >= currentYear - 10; i--) {
      years.push(i)
    }
    return years
  }, [])

  // Month options
  const monthOptions = [
    { value: 1, label: "January" },
    { value: 2, label: "February" },
    { value: 3, label: "March" },
    { value: 4, label: "April" },
    { value: 5, label: "May" },
    { value: 6, label: "June" },
    { value: 7, label: "July" },
    { value: 8, label: "August" },
    { value: 9, label: "September" },
    { value: 10, label: "October" },
    { value: 11, label: "November" },
    { value: 12, label: "December" },
  ]

  // Clear filters
  const clearFilters = () => {
    setSearchText("")
    setSelectedYear(null)
    setSelectedMonth(null)
    setCurrentPage(1)
  }

  // Current preview gallery's images (memoized)
  const previewImages = useMemo(
    () => (selectedGallery ? getGalleryImages(selectedGallery) : []),
    [selectedGallery]
  )

  // NEW: images of selectedGallery that are NOT removed (for edit modal preview)
  const remainingExistingImages = useMemo(() => {
    if (!selectedGallery) return []
    const all = getGalleryImages(selectedGallery)
    return all
      .map((url, idx) => ({ url, idx }))
      .filter(({ idx }) => !removedExistingIndexes.includes(idx))
  }, [selectedGallery, removedExistingIndexes])

  const hasActiveFilters = !!(searchText || selectedYear || selectedMonth)

  // NEW: compact dragger inline style (used in both upload + edit modals)
  const compactDraggerStyle = {
    padding: "10px 12px",
    minHeight: 0,
  }

  return (
    <Layout>
      <div className={`gallery-page ${revealed ? "is-revealed" : ""}`}>
        <div className="gallery-page-container">

          {/* ============ HERO ============ */}
          <section className="gal-hero">
            <div className="gal-hero__bg">
              <span className="gal-blob gal-blob-1" />
              <span className="gal-blob gal-blob-2" />
              <span className="gal-blob gal-blob-3" />
              <div className="gal-hero__grid" />
            </div>

            <div className="gal-hero__content">
              <div className="gal-hero__brand">
                <img src={logo} alt="OCC Logo" className="gal-hero__logo" />
                <div className="gal-hero__brand-meta">
                  <Tag className="gal-chip">ALUMNI GALLERY</Tag>
                  <span className="gal-hero__eyebrow">Memories, captured & shared</span>
                </div>
              </div>

              <Title className="gal-hero__title">
                Alumni <span className="grad-text">Photo Library</span>
              </Title>
              <Paragraph className="gal-hero__lead">
                {isAdmin
                  ? "Curate and showcase memorable moments. Upload, organize, and manage albums across years and events — everything in one professional workspace."
                  : "Relive memorable moments from events, reunions, and milestones. Browse, preview in high quality, and download photos with a single click."}
              </Paragraph>

              <div className="gal-hero__actions">
                {galleries.length > 0 && (
                  <Button
                    type={selectionMode ? "primary" : "default"}
                    icon={selectionMode ? <CloseCircleOutlined /> : <SelectOutlined />}
                    onClick={toggleSelectionMode}
                    className={`gal-btn-ghost ${selectionMode ? "is-active" : ""}`}
                    size="large"
                  >
                    {selectionMode ? "Cancel Selection" : "Select Mode"}
                  </Button>
                )}
                {isAdmin && (
                  <Button
                    type="primary"
                    icon={<CloudUploadOutlined />}
                    size="large"
                    className="gal-btn-primary"
                    onClick={() => setUploadModalVisible(true)}
                  >
                    Upload Images
                  </Button>
                )}
              </div>

              {/* Inline hero stats — admin only */}
              {isAdmin && (
                <Row gutter={[14, 14]} className="gal-hero__stats" justify="center">
                  <Col xs={24} sm={8}>
                    <div className="gal-stat-card stat-total">
                      <div className="gal-stat-icon"><PictureOutlined /></div>
                      <div className="gal-stat-body">
                        <span className="gal-stat-label">Total Images</span>
                        <Statistic value={statistics.total_images} />
                      </div>
                    </div>
                  </Col>
                  <Col xs={24} sm={8}>
                    <div className="gal-stat-card stat-size">
                      <div className="gal-stat-icon"><FileImageOutlined /></div>
                      <div className="gal-stat-body">
                        <span className="gal-stat-label">Total Storage</span>
                        <Statistic value={statistics.total_size} />
                      </div>
                    </div>
                  </Col>
                  <Col xs={24} sm={8}>
                    <div className="gal-stat-card stat-month">
                      <div className="gal-stat-icon"><CalendarOutlined /></div>
                      <div className="gal-stat-body">
                        <span className="gal-stat-label">This Month</span>
                        <Statistic value={statistics.this_month_uploads} />
                      </div>
                    </div>
                  </Col>
                </Row>
              )}
            </div>
          </section>

          {/* ============ SELECTION ACTIONS ============ */}
          {selectionMode && (
            <section className="gal-section">
              <Card className="gal-selection-actions">
                <Space wrap size="middle">
                  <Text strong className="selection-count">
                    <CheckCircleOutlined /> Selected: {selectedImages.length} gallery(s)
                  </Text>
                  <Button size="small" onClick={selectAllImages}>
                    Select All ({galleries.length})
                  </Button>
                  <Button size="small" onClick={deselectAllImages}>
                    Deselect All
                  </Button>
                  <Button
                    type="primary"
                    icon={<DownloadOutlined />}
                    onClick={handleDownloadSelected}
                    disabled={selectedImages.length === 0}
                  >
                    Download Selected
                  </Button>
                  {isAdmin && (
                    <Button
                      type="primary"
                      danger
                      icon={<DeleteOutlined />}
                      onClick={handleBulkDelete}
                      disabled={selectedImages.length === 0}
                    >
                      Delete Selected
                    </Button>
                  )}
                </Space>
              </Card>
            </section>
          )}

          {/* ============ FILTERS ============ */}
          <section className="gal-section">
            <Card className="gal-filters-card">
              <div className="gal-filters-head">
                <Tag className="gal-section-chip">
                  <FilterOutlined /> BROWSE & FILTER
                </Tag>
                <Text className="gal-filters-sub">
                  Find an album by title, year, or month
                </Text>
              </div>
              <Row gutter={[14, 14]} align="middle">
                <Col xs={24} sm={12} md={10}>
                  <Input
                    placeholder="Search by title..."
                    prefix={<SearchOutlined />}
                    value={searchText}
                    onChange={(e) => setSearchText(e.target.value)}
                    onPressEnter={fetchGalleries}
                    allowClear
                    className="gal-search-input"
                  />
                </Col>
                <Col xs={12} sm={6} md={4}>
                  <Select
                    placeholder="Year"
                    value={selectedYear}
                    onChange={setSelectedYear}
                    allowClear
                    className="gal-filter-select"
                    style={{ width: "100%" }}
                  >
                    {yearOptions.map((year) => (
                      <Option key={year} value={year}>
                        {year}
                      </Option>
                    ))}
                  </Select>
                </Col>
                <Col xs={12} sm={6} md={4}>
                  <Select
                    placeholder="Month"
                    value={selectedMonth}
                    onChange={setSelectedMonth}
                    allowClear
                    className="gal-filter-select"
                    style={{ width: "100%" }}
                  >
                    {monthOptions.map((month) => (
                      <Option key={month.value} value={month.value}>
                        {month.label}
                      </Option>
                    ))}
                  </Select>
                </Col>
                <Col xs={24} sm={24} md={6}>
                  <Space wrap className="gal-filter-actions">
                    <Button
                      type="primary"
                      icon={<FilterOutlined />}
                      onClick={fetchGalleries}
                      className="gal-btn-primary-sm"
                    >
                      Apply
                    </Button>
                    <Button
                      onClick={clearFilters}
                      disabled={!hasActiveFilters}
                      icon={<UndoOutlined />}
                    >
                      Reset
                    </Button>
                  </Space>
                </Col>
              </Row>
            </Card>
          </section>

          {/* ============ GRID HEADER ============ */}
          <section className="gal-section">
            <div className="gal-list-header">
              <div>
                <Tag className="gal-section-chip gal-section-chip--accent">
                  <AppstoreOutlined /> ALBUMS
                </Tag>
                <Title level={3} className="gal-list-title">
                  {hasActiveFilters ? "Filtered Results" : "All Galleries"}
                </Title>
                <Text className="gal-list-sub">
                  {loading ? "Loading…" : `${total} album${total === 1 ? "" : "s"} available`}
                </Text>
              </div>
            </div>

            {/* ============ GALLERY GRID ============ */}
            <div className="gal-grid-container">
              {loading ? (
                <div className="gal-loading">
                  <Spin size="large" tip="Loading gallery..." />
                </div>
              ) : galleries.length === 0 ? (
                <Card className="gal-empty-card">
                  <Empty
                    image={Empty.PRESENTED_IMAGE_SIMPLE}
                    description={
                      <span className="gal-empty-text">
                        {hasActiveFilters
                          ? "No galleries match your filters"
                          : "No galleries yet"}
                      </span>
                    }
                  >
                    {isAdmin && !hasActiveFilters && (
                      <Button
                        type="primary"
                        icon={<PlusOutlined />}
                        onClick={() => setUploadModalVisible(true)}
                        className="gal-btn-primary-sm"
                      >
                        Upload First Images
                      </Button>
                    )}
                    {hasActiveFilters && (
                      <Button icon={<UndoOutlined />} onClick={clearFilters}>
                        Clear Filters
                      </Button>
                    )}
                  </Empty>
                </Card>
              ) : (
                <Row gutter={[20, 20]} className="gal-grid">
                  {galleries.map((gallery, index) => {
                    const images = getGalleryImages(gallery)
                    const imageCount = images.length
                    const cardDelay = `${Math.min(index, 11) * 70}ms`

                    return (
                      <Col xs={24} sm={12} md={8} lg={6} key={gallery.id}>
                        <Card
                          className={`gal-image-card ${selectionMode && selectedImages.includes(gallery.id) ? "selected" : ""}`}
                          style={{ animationDelay: cardDelay }}
                          cover={
                            <div
                              className="gal-image-wrapper"
                              onClick={() => {
                                if (selectionMode) {
                                  toggleImageSelection(gallery.id)
                                } else {
                                  openPreview(gallery, 0)
                                }
                              }}
                            >
                              {selectionMode && (
                                <div className="gal-selection-checkbox">
                                  <Checkbox
                                    checked={selectedImages.includes(gallery.id)}
                                    onChange={() => toggleImageSelection(gallery.id)}
                                    onClick={(e) => e.stopPropagation()}
                                  />
                                </div>
                              )}

                              {imageCount > 1 && (
                                <div className="gal-image-count-badge">
                                  <AppstoreOutlined />
                                  <span>{imageCount}</span>
                                </div>
                              )}

                              {imageCount > 1 ? (
                                <Carousel
                                  autoplay
                                  dots={false}
                                  effect="fade"
                                  autoplaySpeed={3000}
                                  className="gal-carousel"
                                >
                                  {images.map((imgUrl, imgIndex) => (
                                    <div key={imgIndex} className="gal-carousel-slide">
                                      <img
                                        alt={`${gallery.title} - ${imgIndex + 1}`}
                                        src={imgUrl}
                                        className="gal-image"
                                        loading="lazy"
                                      />
                                    </div>
                                  ))}
                                </Carousel>
                              ) : (
                                <img
                                  alt={gallery.title}
                                  src={images[0] || gallery.image_url}
                                  className="gal-image"
                                  loading="lazy"
                                />
                              )}

                              <div className="gal-image-overlay">
                                <EyeOutlined className="gal-view-icon" />
                                <span>
                                  {selectionMode
                                    ? "Tap to Select"
                                    : `View ${imageCount > 1 ? `${imageCount} Photos` : "Photo"}`}
                                </span>
                              </div>
                            </div>
                          }
                          actions={[
                            <Tooltip title={imageCount > 1 ? "Download All" : "Download"} key="download">
                              <Button
                                type="text"
                                icon={<DownloadOutlined />}
                                onClick={() =>
                                  imageCount > 1
                                    ? handleDownloadGallery(gallery)
                                    : handleDownload(gallery, 0)
                                }
                                className="gal-action-btn"
                              />
                            </Tooltip>,
                            ...(isAdmin
                              ? [
                                <Tooltip title="Edit" key="edit">
                                  <Button
                                    type="text"
                                    icon={<EditOutlined />}
                                    onClick={() => handleEdit(gallery)}
                                    className="gal-action-btn"
                                  />
                                </Tooltip>,
                                <Tooltip title="Delete" key="delete">
                                  <Button
                                    type="text"
                                    danger
                                    icon={<DeleteOutlined />}
                                    onClick={() => handleDelete(gallery)}
                                    className="gal-action-btn"
                                  />
                                </Tooltip>,
                              ]
                              : []),
                          ]}
                        >
                          <Card.Meta
                            title={
                              <Tooltip title={gallery.title}>
                                <Text ellipsis className="gal-card-title">
                                  {gallery.title}
                                </Text>
                              </Tooltip>
                            }
                            description={
                              <Space direction="vertical" size={6} className="gal-card-meta">
                                <Text type="secondary" className="gal-card-date">
                                  <CalendarOutlined /> {gallery.formatted_date}
                                </Text>
                                <Space wrap size={4}>
                                  {imageCount > 1 && (
                                    <Tag className="gal-card-tag tag-photos">
                                      <AppstoreOutlined /> {imageCount} PHOTOS
                                    </Tag>
                                  )}
                                  <Tag className="gal-card-tag tag-type">
                                    {gallery.file_type?.toUpperCase() || "IMAGE"}
                                  </Tag>
                                  <Tag className="gal-card-tag tag-size">
                                    {gallery.formatted_size}
                                  </Tag>
                                </Space>
                              </Space>
                            }
                          />
                        </Card>
                      </Col>
                    )
                  })}
                </Row>
              )}
            </div>

            {/* ============ PAGINATION ============ */}
            {!loading && galleries.length > 0 && (
              <div className="gal-pagination">
                <Pagination
                  current={currentPage}
                  pageSize={pageSize}
                  total={total}
                  onChange={(page, size) => {
                    setCurrentPage(page)
                    setPageSize(size)
                  }}
                  showSizeChanger
                  showQuickJumper
                  showTotal={(total, range) => `${range[0]}-${range[1]} of ${total} galleries`}
                  responsive
                />
              </div>
            )}
          </section>

          {/* ============ UPLOAD MODAL ============ */}
          <Modal
            title={
              <Space>
                <CloudUploadOutlined />
                <span>Create New Gallery</span>
              </Space>
            }
            open={uploadModalVisible}
            onCancel={requestCloseUploadModal}
            footer={null}
            className="gal-modal"
            width={620}
            centered
            maskClosable={false}
            keyboard={false}
            destroyOnClose={false}
          >
            <Form
              form={form}
              layout="vertical"
              onFinish={handleUpload}
              onValuesChange={() => scheduleSaveUploadDraft()}
            >
              <Form.Item
                name="title"
                label="Gallery Title"
                rules={[
                  { required: true, message: "Please enter a title" },
                  { whitespace: true, message: "Title cannot be empty" }
                ]}
              >
                <Input placeholder="Enter title for this gallery" maxLength={255} showCount />
              </Form.Item>
              <Form.Item
                name="event_date"
                label="Event Date"
                rules={[{ required: true, message: "Please select an event date" }]}
              >
                <DatePicker style={{ width: "100%" }} format="MMMM DD, YYYY" disabledDate={disableFutureDates} />
              </Form.Item>
              <Form.Item
                label={`Images (up to ${MAX_IMAGES_PER_UPLOAD} photos per gallery)`}
                required
                help={`Selected: ${fileList.length}/${MAX_IMAGES_PER_UPLOAD} — click a thumbnail to view, ✕ to remove`}
                validateStatus={fileList.length === 0 ? "error" : "success"}
              >
                {/* Compact dragger so uploaded thumbs below are fully visible */}
                <Dragger
                  {...uploadProps}
                  className="gal-upload-dragger gal-upload-dragger--compact"
                  style={compactDraggerStyle}
                >
                  <p className="ant-upload-drag-icon" style={{ margin: 0, fontSize: 26, lineHeight: 1 }}>
                    <PictureOutlined />
                  </p>
                  <p className="ant-upload-text" style={{ margin: "4px 0 0", fontSize: 13, fontWeight: 600 }}>
                    Click or drag images to upload
                  </p>
                  <p className="ant-upload-hint" style={{ margin: 0, fontSize: 11 }}>
                    Up to {MAX_IMAGES_PER_UPLOAD} images — PNG/JPG/JPEG, max 10MB each
                  </p>
                </Dragger>

                {/* Custom thumbnail grid with view + remove */}
                {renderStagedThumbs()}
              </Form.Item>
              <Form.Item className="gal-modal-actions">
                <Space wrap>
                  <Button onClick={requestCloseUploadModal}>Cancel</Button>
                  <Button
                    type="primary"
                    htmlType="submit"
                    loading={uploading}
                    icon={<CloudUploadOutlined />}
                    disabled={fileList.length === 0}
                  >
                    Create Gallery {fileList.length > 0 ? `(${fileList.length} photos)` : ''}
                  </Button>
                </Space>
              </Form.Item>
            </Form>
          </Modal>

          {/* ============ EDIT MODAL ============ */}
          <Modal
            title={
              <Space>
                <EditOutlined />
                <span>Edit Gallery</span>
              </Space>
            }
            open={editModalVisible}
            onCancel={requestCloseEditModal}
            footer={null}
            className="gal-modal"
            width={640}
            centered
            maskClosable={false}
            keyboard={false}
            destroyOnClose={false}
          >
            <Form
              form={editForm}
              layout="vertical"
              onFinish={handleEditSubmit}
              onValuesChange={() => scheduleSaveEditDraft()}
            >
              <Form.Item
                name="title"
                label="Gallery Title"
                rules={[
                  { required: true, message: "Please enter a title" },
                  { whitespace: true, message: "Title cannot be empty" }
                ]}
              >
                <Input placeholder="Enter title" maxLength={255} showCount />
              </Form.Item>
              <Form.Item
                name="event_date"
                label="Event Date"
                rules={[{ required: true, message: "Please select an event date" }]}
              >
                <DatePicker style={{ width: "100%" }} format="MMMM DD, YYYY" disabledDate={disableFutureDates} />
              </Form.Item>

              {/* ===== Current Images: view + remove individually ===== */}
              {selectedGallery && (() => {
                const all = getGalleryImages(selectedGallery)
                const remaining = remainingExistingImages
                const visible = remaining.slice(0, 4)
                const extra = remaining.length - visible.length
                return (
                  <div className="gal-current-image-preview" style={{ marginBottom: 12 }}>
                    <Text type="secondary">
                      Current Images ({remaining.length}{removedExistingIndexes.length > 0 ? ` of ${all.length}` : ""}):
                    </Text>
                    <div
                      className="gal-preview-grid"
                      style={{
                        marginTop: 8,
                        display: "grid",
                        gridTemplateColumns: "repeat(auto-fill, minmax(90px, 1fr))",
                        gap: 8,
                      }}
                    >
                      <Image.PreviewGroup>
                        {visible.map(({ url, idx }) => (
                          <div
                            key={idx}
                            style={{
                              position: "relative",
                              width: "100%",
                              paddingTop: "100%",
                              borderRadius: 8,
                              overflow: "hidden",
                              background: "#000",
                              boxShadow: "0 1px 4px rgba(0,0,0,0.15)",
                            }}
                          >
                            <Image
                              src={url}
                              alt={`${selectedGallery.title} - ${idx + 1}`}
                              preview={{ mask: <EyeOutlined style={{ fontSize: 18 }} /> }}
                              fallback="data:image/svg+xml;charset=UTF-8,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 64 64%22%3E%3Crect width=%2264%22 height=%2264%22 fill=%22%231a1f2b%22/%3E%3Cpath d=%22M20 44l8-10 6 7 4-5 6 8H20z%22 fill=%22%23475569%22/%3E%3Ccircle cx=%2224%22 cy=%2224%22 r=%224%22 fill=%22%23475569%22/%3E%3C/svg%3E"
                              className="gal-preview-thumb"
                              rootClassName="gal-thumb-image"
                              wrapperStyle={{
                                position: "absolute",
                                inset: 0,
                                width: "100%",
                                height: "100%",
                                display: "block",
                              }}
                              style={{
                                width: "100%",
                                height: "100%",
                                objectFit: "cover",
                                display: "block",
                              }}
                              onError={(e) => { try { e.target.style.opacity = 0.4 } catch (_) { } }}
                            />
                            <Tooltip title="Remove this image">
                              <Button
                                size="small"
                                danger
                                shape="circle"
                                icon={<CloseOutlined />}
                                onClick={(e) => {
                                  e.stopPropagation()
                                  setRemovedExistingIndexes((prev) => [...prev, idx])
                                }}
                                style={{
                                  position: "absolute",
                                  top: 4,
                                  right: 4,
                                  zIndex: 3,
                                }}
                              />
                            </Tooltip>
                          </div>
                        ))}
                      </Image.PreviewGroup>

                      {extra > 0 && (
                        <Tooltip title="View all images">
                          <div
                            className="gal-preview-more"
                            onClick={() =>
                              openViewAll(
                                selectedGallery,
                                remaining.map((r) => r.url),
                                visible.length
                              )
                            }
                            style={{
                              width: "100%",
                              paddingTop: "100%",
                              position: "relative",
                              cursor: "pointer",
                              borderRadius: 8,
                              background: "var(--accent-soft, rgba(79,70,229,.10))",
                              border: "1px dashed var(--accent-ring, rgba(79,70,229,.35))",
                            }}
                          >
                            <div
                              style={{
                                position: "absolute",
                                inset: 0,
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                flexDirection: "column",
                                color: "var(--accent, #4f46e5)",
                                fontWeight: 700,
                              }}
                            >
                              <EyeOutlined style={{ fontSize: 18, marginBottom: 4 }} />
                              <span>+{extra}</span>
                            </div>
                          </div>
                        </Tooltip>
                      )}
                    </div>

                    {removedExistingIndexes.length > 0 && (
                      <div style={{ marginTop: 6 }}>
                        <Text type="warning" style={{ fontSize: 12 }}>
                          {removedExistingIndexes.length} image(s) marked for removal — will be deleted on save.
                        </Text>
                        <Button
                          size="small"
                          type="link"
                          icon={<UndoOutlined />}
                          onClick={() => setRemovedExistingIndexes([])}
                        >
                          Undo all removals
                        </Button>
                      </div>
                    )}

                    {remaining.length === 0 && fileList.length === 0 && (
                      <div style={{ marginTop: 6 }}>
                        <Text type="danger" style={{ fontSize: 12 }}>
                          A gallery must keep at least one image. Add new images below or undo removals.
                        </Text>
                      </div>
                    )}
                  </div>
                )
              })()}

              <Form.Item label="Add More Images (Optional)" help="Upload new images to add to this gallery">
                <Dragger
                  {...uploadProps}
                  className="gal-upload-dragger gal-upload-dragger--compact"
                  style={compactDraggerStyle}
                >
                  <p className="ant-upload-drag-icon" style={{ margin: 0, fontSize: 26, lineHeight: 1 }}>
                    <PictureOutlined />
                  </p>
                  <p className="ant-upload-text" style={{ margin: "4px 0 0", fontSize: 13, fontWeight: 600 }}>
                    Click or drag to add images
                  </p>
                  <p className="ant-upload-hint" style={{ margin: 0, fontSize: 11 }}>
                    Click a thumb to view, ✕ to remove before saving
                  </p>
                </Dragger>

                {/* New staged images, with view + remove */}
                {renderStagedThumbs()}
              </Form.Item>

              <Form.Item className="gal-modal-actions">
                <Space wrap>
                  <Button onClick={requestCloseEditModal}>Cancel</Button>
                  <Button
                    type="primary"
                    htmlType="submit"
                    loading={uploading}
                    icon={<CheckCircleOutlined />}
                  >
                    Save Changes
                  </Button>
                </Space>
              </Form.Item>
            </Form>
          </Modal>

          {/* ============ DELETE MODAL ============ */}
          <Modal
            title={
              <Space>
                <ExclamationCircleOutlined style={{ color: "var(--danger, #ef4444)" }} />
                <span>Delete Gallery</span>
              </Space>
            }
            open={deleteModalVisible}
            onCancel={() => {
              setDeleteModalVisible(false)
              setSelectedGallery(null)
            }}
            onOk={confirmDelete}
            okText="Delete"
            okButtonProps={{ danger: true, icon: <DeleteOutlined /> }}
            className="gal-delete-modal"
            centered
          >
            <p>Are you sure you want to delete this gallery?</p>
            {selectedGallery && (
              <div className="gal-delete-preview">
                <div
                  className="gal-delete-images"
                  style={{
                    display: "flex",
                    gap: 8,
                    flexWrap: "wrap",
                    marginBottom: 8,
                  }}
                >
                  <Image.PreviewGroup>
                    {getGalleryImages(selectedGallery).slice(0, 3).map((imgUrl, idx) => (
                      <div
                        key={idx}
                        style={{
                          width: 72,
                          height: 72,
                          borderRadius: 8,
                          overflow: "hidden",
                          background: "#000",
                          boxShadow: "0 1px 4px rgba(0,0,0,0.15)",
                        }}
                      >
                        <Image
                          src={imgUrl}
                          alt={`${selectedGallery.title} - ${idx + 1}`}
                          preview={{ mask: <EyeOutlined /> }}
                          fallback="data:image/svg+xml;charset=UTF-8,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 64 64%22%3E%3Crect width=%2264%22 height=%2264%22 fill=%22%231a1f2b%22/%3E%3Cpath d=%22M20 44l8-10 6 7 4-5 6 8H20z%22 fill=%22%23475569%22/%3E%3Ccircle cx=%2224%22 cy=%2224%22 r=%224%22 fill=%22%23475569%22/%3E%3C/svg%3E"
                          rootClassName="gal-thumb-image"
                          wrapperStyle={{ width: "100%", height: "100%", display: "block" }}
                          style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
                          onError={(e) => { try { e.target.style.opacity = 0.4 } catch (_) { } }}
                        />
                      </div>
                    ))}
                  </Image.PreviewGroup>
                  {getImageCount(selectedGallery) > 3 && (
                    <Tooltip title="View all images">
                      <div
                        className="gal-delete-more"
                        onClick={() => openViewAll(selectedGallery, null, 3)}
                        style={{
                          width: 72,
                          height: 72,
                          borderRadius: 8,
                          cursor: "pointer",
                          background: "var(--accent-soft, rgba(79,70,229,.10))",
                          border: "1px dashed var(--accent-ring, rgba(79,70,229,.35))",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          flexDirection: "column",
                          color: "var(--accent, #4f46e5)",
                          fontWeight: 700,
                        }}
                      >
                        <EyeOutlined />
                        <span>+{getImageCount(selectedGallery) - 3}</span>
                      </div>
                    </Tooltip>
                  )}
                </div>
                <div>
                  <Text strong>{selectedGallery.title}</Text>
                  <br />
                  <Text type="secondary">{getImageCount(selectedGallery)} image(s) • {selectedGallery.formatted_size}</Text>
                </div>
              </div>
            )}
            <p className="gal-delete-warning">This action cannot be undone. All images in this gallery will be permanently deleted.</p>
          </Modal>

          {/* ============ BULK DELETE MODAL ============ */}
          <Modal
            title={
              <Space>
                <ExclamationCircleOutlined style={{ color: "var(--danger, #ef4444)" }} />
                <span>Delete Selected Galleries</span>
              </Space>
            }
            open={bulkDeleteModalVisible}
            onCancel={() => setBulkDeleteModalVisible(false)}
            onOk={confirmBulkDelete}
            okText={`Delete ${selectedImages.length} Gallery(s)`}
            okButtonProps={{ danger: true, icon: <DeleteOutlined /> }}
            className="gal-delete-modal"
            centered
          >
            <p>Are you sure you want to delete <strong>{selectedImages.length}</strong> selected gallery(s)?</p>
            <div className="gal-bulk-delete-preview">
              <div className="gal-bulk-delete-grid">
                <Image.PreviewGroup>
                  {selectedImages.slice(0, 6).map((galleryId) => {
                    const gallery = galleries.find(g => g.id === galleryId)
                    if (!gallery) return null
                    const images = getGalleryImages(gallery)
                    return (
                      <div key={galleryId} className="gal-bulk-delete-item">
                        <Image
                          src={images[0]}
                          alt={gallery.title}
                          preview={{ mask: <EyeOutlined /> }}
                          fallback="data:image/svg+xml;charset=UTF-8,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 64 64%22%3E%3Crect width=%2264%22 height=%2264%22 fill=%22%231a1f2b%22/%3E%3Cpath d=%22M20 44l8-10 6 7 4-5 6 8H20z%22 fill=%22%23475569%22/%3E%3Ccircle cx=%2224%22 cy=%2224%22 r=%224%22 fill=%22%23475569%22/%3E%3C/svg%3E"
                          rootClassName="gal-thumb-image"
                          wrapperStyle={{ width: "100%", height: "100%", display: "block" }}
                          style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
                          onError={(e) => { try { e.target.style.opacity = 0.4 } catch (_) { } }}
                        />
                        <Text ellipsis className="gal-bulk-delete-title">{gallery.title}</Text>
                      </div>
                    )
                  })}
                </Image.PreviewGroup>
                {selectedImages.length > 6 && (
                  <div className="gal-bulk-delete-more">
                    +{selectedImages.length - 6} more
                  </div>
                )}
              </div>
            </div>
            <p className="gal-delete-warning">This action cannot be undone. All images in these galleries will be permanently deleted.</p>
          </Modal>

          {/* ============ IMAGE PREVIEW LIGHTBOX ============ */}
          {selectedGallery && (
            <div style={{ display: "none" }}>
              <Image.PreviewGroup
                key={`gallery-preview-${previewOrientation}`}
                preview={{
                  visible: previewVisible,
                  current: currentImageIndex,
                  onVisibleChange: (v) => {
                    setPreviewVisible(v)
                    if (!v) closePreview()
                  },
                  onChange: (idx) => setCurrentImageIndex(idx),
                  rootClassName: "gal-preview-root",
                  toolbarRender: (
                    _,
                    {
                      transform: { scale },
                      actions: {
                        onActive,
                        onFlipY,
                        onFlipX,
                        onRotateLeft,
                        onRotateRight,
                        onZoomOut,
                        onZoomIn,
                        onReset,
                      },
                    }
                  ) => (
                    <div
                      className="gal-preview-toolbar-scroll"
                      style={{
                        maxWidth: "96vw",
                        overflowX: "auto",
                        overflowY: "hidden",
                        WebkitOverflowScrolling: "touch",
                        scrollbarWidth: "thin",
                        padding: "8px 12px",
                        borderRadius: 999,
                        background: "var(--overlay, rgba(2,6,23,0.55))",
                        backdropFilter: "blur(10px)",
                        WebkitBackdropFilter: "blur(10px)",
                        touchAction: "pan-x",
                        cursor: "grab",
                      }}
                      onWheel={(e) => {
                        if (e.deltaY !== 0) {
                          e.currentTarget.scrollLeft += e.deltaY
                        }
                      }}
                      // rc-image sets touch-action:none on the preview wrap so it can
                      // implement its own pinch/pan gestures on the image. That swallows
                      // native touch-scrolling here too (taps still register, swipes don't).
                      // So: stop the gesture from reaching rc-image's handlers, and drive
                      // scrollLeft ourselves instead of relying on native touch scrolling.
                      onTouchStart={(e) => {
                        e.stopPropagation()
                        const el = e.currentTarget
                        el.dataset.dragX = String(e.touches[0].clientX)
                        el.dataset.dragScroll = String(el.scrollLeft)
                      }}
                      onTouchMove={(e) => {
                        e.stopPropagation()
                        const el = e.currentTarget
                        const startX = Number(el.dataset.dragX || 0)
                        const startScroll = Number(el.dataset.dragScroll || 0)
                        const dx = e.touches[0].clientX - startX
                        el.scrollLeft = startScroll - dx
                      }}
                      onTouchEnd={(e) => e.stopPropagation()}
                    >
                      <Space
                        size={10}
                        className="gal-preview-toolbar"
                        style={{ flexWrap: "nowrap", whiteSpace: "nowrap" }}
                      >
                        <Tooltip title="Previous">
                          <Button
                            shape="circle"
                            icon={<LeftOutlined />}
                            onClick={() => onActive?.(-1)}
                            disabled={previewImages.length <= 1}
                          />
                        </Tooltip>
                        <Tooltip title="Next">
                          <Button
                            shape="circle"
                            icon={<RightOutlined />}
                            onClick={() => onActive?.(1)}
                            disabled={previewImages.length <= 1}
                          />
                        </Tooltip>
                        <Tooltip title="Flip Y">
                          <Button shape="circle" icon={<SwapOutlined rotate={90} />} onClick={onFlipY} />
                        </Tooltip>
                        <Tooltip title="Flip X">
                          <Button shape="circle" icon={<SwapOutlined />} onClick={onFlipX} />
                        </Tooltip>
                        <Tooltip title="Rotate Left">
                          <Button shape="circle" icon={<RotateLeftOutlined />} onClick={onRotateLeft} />
                        </Tooltip>
                        <Tooltip title="Rotate Right">
                          <Button shape="circle" icon={<RotateRightOutlined />} onClick={onRotateRight} />
                        </Tooltip>
                        <Tooltip title="Zoom Out">
                          <Button
                            shape="circle"
                            icon={<ZoomOutOutlined />}
                            onClick={onZoomOut}
                            disabled={scale <= 1}
                          />
                        </Tooltip>
                        <Tooltip title="Zoom In">
                          <Button
                            shape="circle"
                            icon={<ZoomInOutlined />}
                            onClick={onZoomIn}
                            disabled={scale >= 50}
                          />
                        </Tooltip>
                        <Tooltip title="Reset">
                          <Button shape="circle" icon={<UndoOutlined />} onClick={onReset} />
                        </Tooltip>
                        <Tooltip title="Download this photo only">
                          <Button
                            type="primary"
                            shape="round"
                            icon={<DownloadOutlined />}
                            onClick={() => handleDownload(selectedGallery, currentImageIndex)}
                          >
                            Download this photo only
                          </Button>
                        </Tooltip>
                        {previewImages.length > 1 && (
                          <Tooltip title={`Download all ${previewImages.length}`}>
                            <Button
                              shape="round"
                              icon={<DownloadOutlined />}
                              onClick={() => handleDownloadGallery(selectedGallery)}
                            >
                              All ({previewImages.length})
                            </Button>
                          </Tooltip>
                        )}
                      </Space>
                    </div>
                  ),
                  imageRender: (originalNode) => originalNode,
                }}
              >
                {previewImages.map((imgUrl, idx) => (
                  <Image key={idx} src={imgUrl} alt={`${selectedGallery.title} - ${idx + 1}`} />
                ))}
              </Image.PreviewGroup>
            </div>
          )}

          {/* Caption rendered as an independent, viewport-pinned overlay —
              deliberately OUTSIDE Image.PreviewGroup's DOM tree. rc-image
              applies its pan/zoom/rotate transform to everything returned
              from imageRender, so a caption nested in there gets dragged
              along with that transform and can end up positioned off-screen
              (e.g. in landscape, or after zooming/rotating). Keeping it as
              a sibling, fixed to the viewport, means it always stays put
              and stays visible regardless of how the photo is transformed. */}
          {selectedGallery && previewVisible && (
            <div className="gal-preview-caption-fixed">
              <Text strong className="gal-preview-caption-title">
                {selectedGallery.title}
              </Text>
              <Text className="gal-preview-caption-meta">
                <CalendarOutlined /> {selectedGallery.formatted_date}
                {previewImages.length > 1 && (
                  <>  •  {currentImageIndex + 1} / {previewImages.length}</>
                )}
              </Text>
            </div>
          )}

          {/* ============ VIEW-ALL LIGHTBOX (edit / delete +N) ============ */}
          {viewAllGallery && (
            <div style={{ display: "none" }}>
              <Image.PreviewGroup
                key={`viewall-preview-${previewOrientation}`}
                preview={{
                  visible: viewAllVisible,
                  current: viewAllIndex,
                  onVisibleChange: (v) => {
                    setViewAllVisible(v)
                    if (!v) setViewAllGallery(null)
                  },
                  onChange: (idx) => setViewAllIndex(idx),
                  rootClassName: "gal-preview-root",
                }}
              >
                {(viewAllGallery._filteredImages || getGalleryImages(viewAllGallery)).map((u, i) => (
                  <Image key={i} src={u} alt={`${viewAllGallery.title || "image"} - ${i + 1}`} />
                ))}
              </Image.PreviewGroup>
            </div>
          )}
        </div>
      </div>
    </Layout>
  )
}

export default GalleryPage