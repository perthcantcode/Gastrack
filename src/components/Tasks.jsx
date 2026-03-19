import { useState } from 'react'
import { Card, CardTitle, Badge, Btn } from './UI.jsx'
import styles from './Tasks.module.css'

const today = () => new Date().toISOString().split('T')[0]

export default function Tasks({ state, tasks, addTask, toggleTask, deleteTask }) {
  const [text, setText]         = useState('')
  const [assignee, setAssignee] = useState(state?.members?.[0] || '')
  const [deadline, setDeadline] = useState('')

  const handleAdd = async () => {
    if (!text.trim()) return
    await addTask({ text: text.trim(), assignee, deadline })
    setText('')
    setDeadline('')
  }

  const done  = tasks.filter(t => t.done).length
  const total = tasks.length
  const pct   = total ? Math.round((done / total) * 100) : 0

  const getDeadlineStatus = (dl) => {
    if (!dl) return null
    const diff = Math.ceil((new Date(dl) - new Date()) / 86_400_000)
    if (diff < 0)  return { label: 'Overdue',     variant: 'danger' }
    if (diff === 0) return { label: 'Due today',   variant: 'warn' }
    if (diff <= 3)  return { label: `${diff}d left`, variant: 'warn' }
    return { label: `${diff}d left`, variant: 'neutral' }
  }

  return (
    <Card>
      <CardTitle>Task Management</CardTitle>

      {/* Add task row */}
      <div className={styles.addBox}>
        <div className={styles.inputRow}>
          <input
            className={styles.taskInput}
            placeholder="Enter new task..."
            value={text}
            onChange={e => setText(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleAdd()}
          />
          <Btn variant="primary" onClick={handleAdd}>Add Task</Btn>
        </div>
        <div className={styles.metaRow}>
          <div className={styles.metaField}>
            <label className={styles.metaLabel}>Assign to</label>
            <select className={styles.metaSelect} value={assignee} onChange={e => setAssignee(e.target.value)}>
              <option value="">Unassigned</option>
              {(state?.members || []).map(m => <option key={m}>{m}</option>)}
            </select>
          </div>
          <div className={styles.metaField}>
            <label className={styles.metaLabel}>Deadline</label>
            <input className={styles.metaInput} type="date" value={deadline} onChange={e => setDeadline(e.target.value)} min={today()} />
          </div>
        </div>
      </div>

      {/* Progress bar */}
      {total > 0 && (
        <div className={styles.progressWrap}>
          <div className={styles.progressTrack}>
            <div className={styles.progressFill} style={{ width: pct + '%' }} />
          </div>
          <span className={styles.progressLabel}>{pct}% complete · {done}/{total} tasks</span>
        </div>
      )}

      {/* Task list */}
      {total === 0 && <div className={styles.empty}>No tasks yet — add one above</div>}

      <div className={styles.list}>
        {tasks.map(t => {
          const ds = getDeadlineStatus(t.deadline)
          return (
            <div key={t.id} className={`${styles.taskRow} ${t.done ? styles.taskDone : ''}`}>
              <div className={`${styles.cb} ${t.done ? styles.cbChecked : ''}`} onClick={() => toggleTask(t.id, t.done)} />
              <div className={styles.taskContent}>
                <span className={styles.taskText}>{t.text}</span>
                <div className={styles.taskMeta}>
                  {t.assignee && <Badge variant="neutral">{t.assignee}</Badge>}
                  {t.deadline && ds && <Badge variant={ds.variant}>{ds.label}</Badge>}
                  {t.deadline && <span className={styles.deadlineDate}>{t.deadline}</span>}
                </div>
              </div>
              <Btn variant="danger" onClick={() => deleteTask(t.id)}>✕</Btn>
            </div>
          )
        })}
      </div>

      {/* Footer */}
      {total > 0 && (
        <div className={styles.footer}>
          <span>{total} task{total !== 1 ? 's' : ''} · {done} done</span>
          <span className={styles.mono}>{total - done} remaining</span>
        </div>
      )}
    </Card>
  )
}
