import styles from './UI.module.css'

export function Card({ children, className = '' }) {
  return <div className={`${styles.card} ${className}`}>{children}</div>
}

export function CardTitle({ children }) {
  return <div className={styles.cardTitle}>{children}</div>
}

export function StatCard({ label, value, color }) {
  return (
    <div className={styles.stat}>
      <div className={styles.statLabel}>{label}</div>
      <div className={styles.statVal} style={color ? { color } : {}}>{value}</div>
    </div>
  )
}

export function Badge({ children, variant = 'neutral' }) {
  return <span className={`${styles.badge} ${styles['badge_' + variant]}`}>{children}</span>
}

export function Btn({ children, variant = 'primary', onClick, style, disabled, type = 'button' }) {
  return (
    <button
      type={type}
      className={`${styles.btn} ${styles['btn_' + variant]}`}
      onClick={onClick}
      style={style}
      disabled={disabled}
    >
      {children}
    </button>
  )
}

export function Input({ label, hint, ...props }) {
  return (
    <div className={styles.field}>
      {label && <label className={styles.label}>{label}</label>}
      <input className={styles.input} {...props} />
      {hint && <div className={styles.hint}>{hint}</div>}
    </div>
  )
}

export function Select({ label, children, ...props }) {
  return (
    <div className={styles.field}>
      {label && <label className={styles.label}>{label}</label>}
      <select className={styles.select} {...props}>{children}</select>
    </div>
  )
}

export function Textarea({ label, ...props }) {
  return (
    <div className={styles.field}>
      {label && <label className={styles.label}>{label}</label>}
      <textarea className={styles.textarea} {...props} />
    </div>
  )
}

export function ProgressBar({ pct }) {
  return (
    <div className={styles.track}>
      <div className={styles.fill} style={{ width: Math.min(100, pct) + '%' }} />
    </div>
  )
}
