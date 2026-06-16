import { useState, useRef } from 'react'
import styles from './BundleNav.module.css'

async function resetProgress(scope, opts) {
  await fetch('/api/progress/reset', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ scope, ...opts }),
  })
}

export default function BundleNav({
  bundles, activeBundleId, examSession, onSelect, onProgressUpdate, onStartExam, collapsed, onToggleCollapse
}) {
  const trackRef = useRef(null)
  const [isDragging, setIsDragging] = useState(false)
  const [startX, setStartX] = useState(0)
  const [scrollLeft, setScrollLeft] = useState(0)
  const [dragDist, setDragDist] = useState(0)

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

  return (
    <>
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
            {bundles.map(b => {
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
                  title={lockedByExam ? 'Abandon current exam to switch bundles' : b.tagline}
                >
                  {/* Top row: icon + text + count + actions */}
                  <div className={styles.tabTop}>
                    <span className={styles.icon}>{b.icon}</span>
                    <div className={styles.text}>
                      <span className={styles.name}>{b.name}</span>
                      <span className={styles.tagline}>{b.tagline}</span>
                    </div>
                    <div className={styles.countWrap}>
                      {!examSession && (
                        <>
                          <span className={styles.countNum}>{b.stats.completed}/{b.stats.total}</span>
                          <span className={styles.countPct}>{pct}%</span>
                        </>
                      )}
                    </div>

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
                          if (!window.confirm(`Reset all progress in "${b.name}"?`)) return
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
                  </div>

                  {/* Inline progress track */}
                  {!examSession && (
                    <div className={styles.progressTrack}>
                      <div className={styles.progressFill} style={{ width: `${pct}%` }} />
                    </div>
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
      </nav>
    </>
  )
}
