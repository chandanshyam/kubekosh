import { useState, useRef, useEffect } from 'react'
import styles from './BundleNav.module.css'
import { useConfirm } from '@hooks/useConfirm'

async function resetProgress(scope, opts) {
  await fetch('/api/progress/reset', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ scope, ...opts }),
  })
}

export default function BundleNav({
  bundles, activeBundleId, examSession, onSelect, onProgressUpdate, onStartExam, collapsed, onToggleCollapse,
  activeTrack
}) {
  const trackRef = useRef(null)
  const [isDragging, setIsDragging] = useState(false)
  const [startX, setStartX] = useState(0)
  const [scrollLeft, setScrollLeft] = useState(0)
  const [dragDist, setDragDist] = useState(0)
  const { confirm, ConfirmUI } = useConfirm()

  const [tooltip, setTooltip] = useState(null)

  useEffect(() => {
    if (collapsed) setTooltip(null)
  }, [collapsed])

  const handleMouseDown = (e) => {
    if (!trackRef.current) return
    setIsDragging(true)
    setDragDist(0)
    setStartX(e.pageX - trackRef.current.offsetLeft)
    setScrollLeft(trackRef.current.scrollLeft)
  }

  const handleMouseLeaveOrUp = () => {
    setIsDragging(false)
  }

  const handleMouseMove = (e) => {
    if (!isDragging || !trackRef.current) return
    e.preventDefault()
    const x = e.pageX - trackRef.current.offsetLeft
    const walk = x - startX
    if (Math.abs(walk) > 5) setDragDist(Math.abs(walk))
    trackRef.current.scrollLeft = scrollLeft - walk
  }

  const handleTooltipShow = (e, text) => {
    const tabEl = e.currentTarget.closest('.' + styles.tab)
    if (!tabEl) return
    const rect = tabEl.getBoundingClientRect()
    const navEl = tabEl.closest('.' + styles.nav)
    if (!navEl) return
    const navRect = navEl.getBoundingClientRect()
    setTooltip({
      text,
      x: rect.left - navRect.left + rect.width / 2,
      y: rect.bottom - navRect.top + 8,
      width: rect.width
    })
  }

  const handleTooltipHide = () => {
    setTooltip(null)
  }

  return (
    <>
      {ConfirmUI}
      <nav className={`${styles.nav} ${collapsed ? styles.collapsed : ''}`} aria-label="Scenario bundles">
        {!collapsed && (
          <div
            className={`${styles.track} ${(isDragging && dragDist > 5) ? styles.dragging : ''}`}
            ref={trackRef}
            onMouseDown={handleMouseDown}
            onMouseLeave={handleMouseLeaveOrUp}
            onMouseUp={handleMouseLeaveOrUp}
            onMouseMove={handleMouseMove}
          >
            {(activeTrack
              ? bundles.filter(b => (activeTrack.bundle_ids || []).includes(b.id))
              : bundles
            ).map(b => {
              const active = b.id === activeBundleId
              const isExamBundle = examSession?.bundle_id === b.id
              const lockedByExam = examSession && !isExamBundle
              const pct = b.stats.total > 0
                ? Math.round((b.stats.completed / b.stats.total) * 100)
                : 0

              return (
                <button
                  key={b.id}
                  className={`${styles.tab} ${active ? styles.active : ''} ${lockedByExam ? styles.locked : ''}`}
                  style={{ '--bcolor': b.color, '--bdim': b.colorDim }}
                  onClick={(e) => {
                    if (dragDist > 5) {
                      e.preventDefault()
                      e.stopPropagation()
                      return
                    }
                    if (!lockedByExam) onSelect(b.id)
                  }}
                  aria-pressed={active}
                  title={lockedByExam ? 'Abandon current exam to switch bundles' : undefined}
                >
                  <span className={styles.icon}>{b.icon}</span>
                  <span className={styles.name}>{b.name}</span>
                  <span
                    className={styles.infoBtn}
                    onMouseEnter={(e) => handleTooltipShow(e, b.tagline)}
                    onMouseLeave={handleTooltipHide}
                    onClick={e => e.stopPropagation()}
                    aria-label={b.tagline}
                  >
                    <svg viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <circle cx="12" cy="12" r="10" />
                      <line x1="12" y1="16" x2="12" y2="12" />
                      <line x1="12" y1="8" x2="12.01" y2="8" />
                    </svg>
                  </span>

                  {/* Count chip: X/Y · N% */}
                  {!examSession && (
                    <span className={styles.countChip}>
                      <span className={styles.countDot} />
                      {b.stats.completed}/{b.stats.total} · {pct}%
                    </span>
                  )}

                  {/* Start Exam button — shown on hover when not in exam mode */}
                  {!examSession && !lockedByExam && (
                    <button
                      className={styles.examBtn}
                      title={`Start timed exam for "${b.name}" (${b.exam_minutes ?? 120} min recommended)`}
                      onClick={e => {
                        e.stopPropagation()
                        onStartExam?.(b)
                      }}
                    >
                      ▶ Exam
                    </button>
                  )}

                  {/* In-exam indicator */}
                  {isExamBundle && (
                    <span className={styles.examBadge}>🏁 In Progress</span>
                  )}

                  {/* Reset button */}
                  {b.stats.completed > 0 && !examSession && (
                    <button
                      className={styles.bundleResetBtn}
                      title={`Reset all progress in "${b.name}"`}
                      onClick={async e => {
                        e.stopPropagation()
                        const ok = await confirm({
                          title: 'Reset Bundle Progress',
                          message: `Reset all progress in "${b.name}"?`,
                          confirmLabel: 'Reset',
                          danger: true,
                        })
                        if (!ok) return
                        await resetProgress('bundle', { bundleId: b.id })
                        onProgressUpdate?.()
                      }}
                    >
                      <svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M23 4v6h-6" />
                        <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10" />
                      </svg>
                    </button>
                  )}
                </button>
              )
            })}
          </div>
        )}
        {!collapsed && <div className={styles.fadeOverlay} />}
        <div
          className={styles.collapseWrap}
          onClick={onToggleCollapse}
          title={collapsed ? "Show Bundles" : "Hide Bundles"}
        >
          {collapsed ? '▼' : '▲'}
        </div>

        {tooltip && (
          <div
            className={styles.activeTooltip}
            style={{
              left: tooltip.x,
              top: tooltip.y,
              width: tooltip.width
            }}
          >
            {tooltip.text}
          </div>
        )}
      </nav>
    </>
  )
}
