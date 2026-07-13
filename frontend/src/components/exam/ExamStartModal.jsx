import { useState, useEffect, useRef } from 'react'
import styles from './ExamStartModal.module.css'

export default function ExamStartModal({ bundle, onStart, onCancel }) {
  const totalScenarios = bundle?.scenario_ids?.length || 0
  const [minutes, setMinutes] = useState(bundle?.exam_minutes || 120)
  const [scenarioCount, setScenarioCount] = useState(totalScenarios)
  const inputRef = useRef(null)

  // Keep scenarioCount in sync if bundle changes
  useEffect(() => {
    setScenarioCount(bundle?.scenario_ids?.length || 0)
  }, [bundle])

  useEffect(() => {
    // Focus duration input on open
    const t = setTimeout(() => inputRef.current?.select(), 60)
    return () => clearTimeout(t)
  }, [])

  if (!bundle) return null

  const numMinutes = Number(minutes)
  const numScenarios = Number(scenarioCount)
  const isMinutesValid = numMinutes >= 5 && numMinutes <= 300
  const isScenariosValid = numScenarios >= 1 && numScenarios <= totalScenarios
  const isValid = isMinutesValid && isScenariosValid

  const handleStart = () => {
    if (!isValid) return
    onStart(numMinutes, numScenarios)
  }

  const presets = [
    { label: '30 min', value: 30 },
    { label: '60 min', value: 60 },
    { label: '90 min', value: 90 },
    { label: '120 min', value: 120 },
  ]

  return (
    <div className={styles.overlay} onClick={e => e.target === e.currentTarget && onCancel()}>
      <div className={styles.modal}>
        <div className={styles.header}>
          <span className={styles.icon}>{bundle.icon}</span>
          <div>
            <div className={styles.title}>Start Exam</div>
            <div className={styles.bundleName}>{bundle.name}</div>
          </div>
        </div>

        <div className={styles.body}>
          <div className={styles.info}>
            <span>📋</span>
            <span>{totalScenarios} scenarios · Recommended: <strong>{bundle.exam_minutes} min</strong></span>
          </div>

          {/* Duration field */}
          <div className={styles.field}>
            <label className={styles.label}>Exam Duration</label>
            <div className={styles.presets}>
              {presets.map(p => (
                <button
                  key={p.value}
                  className={`${styles.preset} ${minutes === p.value ? styles.presetActive : ''}`}
                  onClick={() => setMinutes(p.value)}
                  style={{ '--bcolor': bundle.color }}
                >
                  {p.label}
                </button>
              ))}
            </div>
            <div className={styles.customRow}>
              <input
                ref={inputRef}
                type="number"
                className={styles.input}
                value={minutes}
                min={5}
                max={300}
                onChange={e => setMinutes(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleStart()}
              />
              <span className={styles.unit}>minutes</span>
            </div>
            <div className={styles.hint}>
              {!isMinutesValid ? (
                <span style={{ color: 'var(--red)' }}>⚠ Duration must be between 5 and 300 minutes</span>
              ) : numMinutes < 60 ? '⚡ Speed run mode' :
               numMinutes <= 120 ? '🎯 Realistic exam timing' :
               '🧘 Relaxed practice pace'}
            </div>
          </div>

          {/* Scenario count field */}
          <div className={styles.field}>
            <label className={styles.label}>Number of Scenarios</label>
            <div className={styles.scenarioRow}>
              <input
                type="range"
                className={styles.slider}
                value={numScenarios}
                min={1}
                max={totalScenarios}
                step={1}
                onChange={e => setScenarioCount(Number(e.target.value))}
                style={{ '--bcolor': bundle.color }}
              />
              <input
                type="number"
                className={styles.input}
                value={scenarioCount}
                min={1}
                max={totalScenarios}
                onChange={e => setScenarioCount(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleStart()}
              />
            </div>
            <div className={styles.hint}>
              {!isScenariosValid ? (
                <span style={{ color: 'var(--red)' }}>⚠ Must be between 1 and {totalScenarios}</span>
              ) : numScenarios === totalScenarios
                ? `📚 Full exam — all ${totalScenarios} scenarios`
                : `🎯 ${numScenarios} randomly selected scenario${numScenarios > 1 ? 's' : ''}`}
            </div>
          </div>
        </div>

        <div className={styles.actions}>
          <button className={styles.cancelBtn} onClick={onCancel}>Cancel</button>
          <button
            className={styles.startBtn}
            onClick={handleStart}
            disabled={!isValid}
            style={{ background: bundle.color }}
          >
            ▶ Start Exam
          </button>
        </div>
      </div>
    </div>
  )
}
