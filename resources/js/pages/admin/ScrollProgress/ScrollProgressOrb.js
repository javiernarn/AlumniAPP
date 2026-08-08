"use client"
import { useCallback, useEffect, useRef, useState } from "react"
import { createPortal } from "react-dom"
import { ArrowUpOutlined, ArrowDownOutlined } from "@ant-design/icons"
import logo from "~/assets/images/OCC_LOGO.png"
import "./ScrollProgressOrb.css"



const ORB_POSITION_KEY = "occScrollOrbPosition"
const DRAG_THRESHOLD = 6 // px of movement before a press counts as a drag, not a click

const obfuscatedStorage = {
  get(key) {
    try {
      const raw = window.localStorage.getItem(key)
      if (!raw) return null
      const json = decodeURIComponent(escape(window.atob(raw)))
      return JSON.parse(json)
    } catch {
      return null
    }
  },
  set(key, value) {
    try {
      const json = JSON.stringify(value)
      const encoded = window.btoa(unescape(encodeURIComponent(json)))
      window.localStorage.setItem(key, encoded)
    } catch {
      // Ignore quota errors / private-browsing / SSR
    }
  },
}

const ScrollProgressOrb = () => {
  const [percent, setPercent] = useState(100)
  const [popupOpen, setPopupOpen] = useState(false)
  const [scrollDir, setScrollDir] = useState("up")
  const [mounted, setMounted] = useState(false)
  const [pos, setPos] = useState(null) // {x, y} top-left px once dragged/restored; null = default corner
  const [isDragging, setIsDragging] = useState(false)
  // Was a single shared ref, which meant a scroll event from ANY nested
  // scrollable element (a Select dropdown, a Carousel, the mobile panel)
  // would get compared against the page's scrollTop and could flip
  // scrollDir the wrong way mid-scroll. Track each target's own previous
  // scrollTop instead so unrelated elements can't corrupt one another.
  const lastYByTargetRef = useRef(new WeakMap())
  const wrapRef = useRef(null)
  const scrollTargetRef = useRef(null)
  const dragStateRef = useRef({ pointerX: 0, pointerY: 0, origX: 0, origY: 0 })
  const draggingRef = useRef(false)
  const suppressClickRef = useRef(false)

  const clampToViewport = useCallback((x, y) => {
    const wrap = wrapRef.current
    const w = wrap ? wrap.offsetWidth : 84
    const h = wrap ? wrap.offsetHeight : 84
    const maxX = Math.max(window.innerWidth - w, 0)
    const maxY = Math.max(window.innerHeight - h, 0)
    return {
      x: Math.min(Math.max(x, 0), maxX),
      y: Math.min(Math.max(y, 0), maxY),
    }
  }, [])

  useEffect(() => {
    setMounted(true)
  }, [])

  // Restore a saved position (if any) once mounted and the orb has real dimensions
  useEffect(() => {
    if (!mounted) return
    const saved = obfuscatedStorage.get(ORB_POSITION_KEY)
    if (saved && typeof saved.x === "number" && typeof saved.y === "number") {
      setPos(clampToViewport(saved.x, saved.y))
    }
  }, [mounted, clampToViewport])

  // Keep the orb on-screen if the window is resized
  useEffect(() => {
    const handleResize = () => {
      setPos((current) => (current ? clampToViewport(current.x, current.y) : current))
    }
    window.addEventListener("resize", handleResize)
    return () => window.removeEventListener("resize", handleResize)
  }, [clampToViewport])

  useEffect(() => {
    const getMetrics = (target) => {
      if (!target || target === document || target === window) {
        return {
          scrollTop: window.scrollY || document.documentElement.scrollTop || 0,
          scrollHeight: document.documentElement.scrollHeight,
          clientHeight: window.innerHeight,
        }
      }
      return {
        scrollTop: target.scrollTop,
        scrollHeight: target.scrollHeight,
        clientHeight: target.clientHeight,
      }
    }

    const applyMetrics = (target, metrics) => {
      const { scrollTop, scrollHeight, clientHeight } = metrics
      const docHeight = scrollHeight - clientHeight
      const fraction = docHeight > 0 ? scrollTop / docHeight : 0
      const clamped = Math.min(1, Math.max(0, fraction))

      // 100% at top -> 0% at bottom
      setPercent(Math.round((1 - clamped) * 100))

      const key = target || document
      const prevScrollTop = lastYByTargetRef.current.get(key) ?? scrollTop

      if (scrollTop > prevScrollTop + 2) {
        setScrollDir("down")
      } else if (scrollTop < prevScrollTop - 2) {
        setScrollDir("up")
      }
      lastYByTargetRef.current.set(key, scrollTop)
      scrollTargetRef.current = target
    }

    // Capture phase catches scroll events from ANY scrollable element on
    // the page (window, or a nested container e.g. inside a Layout with
    // its own overflow area) - regular bubbling listeners miss the latter
    // since scroll events don't bubble.
    const handleScroll = (e) => {
      const target = e && e.target && e.target !== document ? e.target : document
      applyMetrics(target, getMetrics(target))
    }

    // Initial read
    applyMetrics(document, getMetrics(document))

    window.addEventListener("scroll", handleScroll, {
      capture: true,
      passive: true,
    })
    window.addEventListener("resize", handleScroll)
    return () => {
      window.removeEventListener("scroll", handleScroll, { capture: true })
      window.removeEventListener("resize", handleScroll)
    }
  }, [])

  // Close the popup if the user clicks/taps outside the orb
  useEffect(() => {
    if (!popupOpen) return
    const handleOutside = (e) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target)) {
        setPopupOpen(false)
      }
    }
    document.addEventListener("mousedown", handleOutside)
    document.addEventListener("touchstart", handleOutside)
    return () => {
      document.removeEventListener("mousedown", handleOutside)
      document.removeEventListener("touchstart", handleOutside)
    }
  }, [popupOpen])

  const fastScrollTo = useCallback((target, top) => {
    const isWindowTarget = !target || target === document || target === window
    const getTop = () =>
      isWindowTarget
        ? window.scrollY || document.documentElement.scrollTop || 0
        : target.scrollTop
    const setTop = (v) => {
      if (isWindowTarget) window.scrollTo(0, v)
      else target.scrollTop = v
    }

    const start = getTop()
    const distance = top - start
    const duration = Math.min(500, Math.max(200, Math.abs(distance) / 4))
    const startTime = performance.now()

    const easeOutQuad = (t) => t * (2 - t)

    const step = (now) => {
      const elapsed = now - startTime
      const t = Math.min(1, elapsed / duration)
      setTop(start + distance * easeOutQuad(t))
      if (t < 1) requestAnimationFrame(step)
    }
    requestAnimationFrame(step)
  }, [])

  const handleJump = useCallback(
    (e) => {
      e.stopPropagation()
      const target = scrollTargetRef.current
      const isWindowTarget = !target || target === document || target === window
      const bottomTop = isWindowTarget
        ? document.documentElement.scrollHeight
        : target.scrollHeight

      fastScrollTo(target, scrollDir === "up" ? 0 : bottomTop)
      setPopupOpen(false)
    },
    [scrollDir, fastScrollTo]
  )

  // ---------- Drag to reposition ----------
  const handlePointerMove = useCallback(
    (e) => {
      const { pointerX, pointerY, origX, origY } = dragStateRef.current
      const dx = e.clientX - pointerX
      const dy = e.clientY - pointerY

      if (!draggingRef.current) {
        if (Math.abs(dx) < DRAG_THRESHOLD && Math.abs(dy) < DRAG_THRESHOLD) return
        draggingRef.current = true
        suppressClickRef.current = true
        setIsDragging(true)
        setPopupOpen(false)
      }

      setPos(clampToViewport(origX + dx, origY + dy))
    },
    [clampToViewport]
  )

  const handlePointerUp = useCallback(() => {
    window.removeEventListener("pointermove", handlePointerMove)
    window.removeEventListener("pointerup", handlePointerUp)

    if (draggingRef.current) {
      setIsDragging(false)
      setPos((current) => {
        if (current) obfuscatedStorage.set(ORB_POSITION_KEY, current)
        return current
      })
    }
    draggingRef.current = false
    // The click event fires right after pointerup - clear the suppression
    // on the next tick so this drag-release doesn't also toggle the popup.
    setTimeout(() => {
      suppressClickRef.current = false
    }, 0)
  }, [handlePointerMove])

  const handlePointerDown = useCallback(
    (e) => {
      // Only left click / primary touch
      if (e.button !== undefined && e.button !== 0) return
      const wrap = wrapRef.current
      if (!wrap) return
      const rect = wrap.getBoundingClientRect()
      dragStateRef.current = {
        pointerX: e.clientX,
        pointerY: e.clientY,
        origX: rect.left,
        origY: rect.top,
      }
      window.addEventListener("pointermove", handlePointerMove)
      window.addEventListener("pointerup", handlePointerUp)
    },
    [handlePointerMove, handlePointerUp]
  )

  const handleOrbClick = useCallback(() => {
    if (suppressClickRef.current) return
    setPopupOpen((v) => !v)
  }, [])

  const circumference = 2 * Math.PI * 46

  if (!mounted) return null

  return createPortal(
    <div
      className={`scroll-orb-wrap${isDragging ? " is-dragging" : ""}`}
      ref={wrapRef}
      style={pos ? { left: pos.x, top: pos.y, right: "auto", bottom: "auto" } : undefined}
      onPointerDown={handlePointerDown}
    >
      <button
        type="button"
        className={`scroll-orb-popup scroll-orb-popup--${scrollDir} ${
          popupOpen ? "is-open" : ""
        }`}
        onClick={handleJump}
        aria-label={
          scrollDir === "up" ? "Scroll to top" : "Scroll to bottom"
        }
        tabIndex={popupOpen ? 0 : -1}
      >
        {scrollDir === "up" ? <ArrowUpOutlined /> : <ArrowDownOutlined />}
      </button>

      <button
        type="button"
        className="scroll-orb"
        onClick={handleOrbClick}
        aria-label={`Scroll progress ${percent}%`}
      >
        <svg viewBox="0 0 100 100" className="scroll-orb__ring">
          <circle className="scroll-orb__ring-track" cx="50" cy="50" r="46" />
          <circle
            className="scroll-orb__ring-fill"
            cx="50"
            cy="50"
            r="46"
            style={{
              strokeDasharray: circumference,
              strokeDashoffset: circumference * (1 - percent / 100),
            }}
          />
        </svg>

        <span className="scroll-orb__body">
          <span
            className="scroll-orb__water"
            style={{ height: `${percent}%` }}
            aria-hidden="true"
          >
            <span className="scroll-orb__wave scroll-orb__wave--1" />
            <span className="scroll-orb__wave scroll-orb__wave--2" />
          </span>
          <img src={logo} alt="OCC" className="scroll-orb__logo" />
          <span className="scroll-orb__percent">{percent}%</span>
        </span>
      </button>
    </div>,
    document.body
  )
}

export default ScrollProgressOrb