import { useRef, useEffect } from 'react'
import { Chart, ArcElement, Tooltip, DoughnutController } from 'chart.js'
import { Card, CardTitle, StatCard, Badge, ProgressBar } from './UI.jsx'
import { fmt } from '../utils/format.js'
import styles from './Dashboard.module.css'

Chart.register(ArcElement, Tooltip, DoughnutController)

const COLORS = ['#6366F1','#10B981','#F59E0B','#EC4899','#3B82F6','#EF4444']

function RiskBadge({ daysLeft, taskPct, pctSpent }) {
  let label = 'On Track', variant = 'success', pulse = false
  if (daysLeft < 7 || pctSpent > 80) { label = 'At Risk'; variant = 'warn' }
  if (taskPct === 0 && daysLeft < 14) { label = 'Behind Schedule'; variant = 'danger'; pulse = true }
  return (
    <span className={`${styles.riskBadge} ${styles['risk_'+variant]} ${pulse?styles.pulse:''}`}>
      <span className={styles.dot}/>{label}
    </span>
  )
}

function ContribCard({ name, paid, share }) {
  const diff = paid - share
  const cls = diff > 0 ? styles.over : diff < 0 ? styles.under : styles.even
  return (
    <div className={`${styles.contrib} ${cls}`}>
      <div>
        <div className={styles.contribName}>{name}</div>
        {diff > 0
          ? <Badge variant="success">Overpaid by {fmt(Math.abs(diff))}</Badge>
          : diff < 0
          ? <Badge variant="danger">Underpaid by {fmt(Math.abs(diff))}</Badge>
          : <Badge variant="neutral">Even</Badge>}
      </div>
      <div className={styles.contribPaid}>Paid: {fmt(paid)}</div>
    </div>
  )
}

function DonutChart({ catBreakdown, totalSpent }) {
  const canvasRef = useRef(null)
  const chartRef  = useRef(null)
  const labels = Object.keys(catBreakdown)
  const data   = Object.values(catBreakdown)

  useEffect(() => {
    if (!canvasRef.current || !labels.length) return
    if (chartRef.current) chartRef.current.destroy()
    chartRef.current = new Chart(canvasRef.current, {
      type: 'doughnut',
      data: { labels, datasets: [{ data, backgroundColor: COLORS, borderWidth: 2, borderColor: 'transparent', hoverOffset: 6 }] },
      options: {
        cutout: '68%',
        plugins: {
          legend: { display: false },
          tooltip: { callbacks: { label: ctx => ` ${ctx.label}: ${fmt(ctx.raw)}` } }
        },
        animation: { duration: 700 },
      },
    })
    return () => { if (chartRef.current) { chartRef.current.destroy(); chartRef.current = null } }
  }, [JSON.stringify(catBreakdown)])

  if (!labels.length) return <div className={styles.empty}>No expenses yet</div>

  return (
    <>
      <div className={styles.donutWrap}>
        <canvas ref={canvasRef} style={{ maxWidth: 200, maxHeight: 200 }} />
        <div className={styles.donutCenter}>
          <div className={styles.donutAmt}>{fmt(totalSpent)}</div>
          <div className={styles.donutLbl}>total spent</div>
        </div>
      </div>
      <div className={styles.legend}>
        {labels.map((l, i) => (
          <div key={l} className={styles.legendItem}>
            <span className={styles.legendDot} style={{ background: COLORS[i % COLORS.length] }}/>
            <span>{l}</span>
            <span className={styles.legendAmt}>{fmt(data[i])}</span>
          </div>
        ))}
      </div>
    </>
  )
}

export default function Dashboard({ state, derived }) {
  const { totalSpent, remaining, pctSpent, sharePerMember, daysLeft, taskPct, memberPaid, catBreakdown } = derived
  const members = state?.members || []

  return (
    <div className={styles.wrap}>
      <div className={styles.row2}>
        <Card>
          <CardTitle>Budget Summary</CardTitle>
          <div className={styles.stat3}>
            <StatCard label="Total Budget" value={fmt(state?.budget||0)} color="var(--text)" />
            <StatCard label="Total Spent"  value={fmt(totalSpent)}       color="var(--danger)" />
            <StatCard label="Remaining"    value={fmt(remaining)}        color="var(--success)" />
          </div>
          <div className={styles.pctRow}>
            <span>Budget Used</span>
            <span className={styles.mono}>{pctSpent}%</span>
          </div>
          <ProgressBar pct={pctSpent} />
        </Card>

        <Card>
          <CardTitle>Risk Status</CardTitle>
          <div style={{ marginBottom: 14 }}>
            <RiskBadge daysLeft={daysLeft} taskPct={taskPct} pctSpent={pctSpent} />
          </div>
          <div className={styles.stat3}>
            <StatCard label="Days Left"     value={daysLeft}       color="var(--text)" />
            <StatCard label="Task Progress" value={taskPct + '%'}  color="var(--accent-light)" />
            <StatCard label="Budget Used"   value={pctSpent + '%'} color="var(--warning)" />
          </div>
        </Card>
      </div>

      <div className={styles.row2}>
        <Card>
          <CardTitle>Contribution Summary</CardTitle>
          <div className={styles.shareHint}>
            Expected share per member: <span className={styles.mono}>{fmt(sharePerMember)}</span>
          </div>
          {members.length === 0 && <div className={styles.empty}>No members yet — add them in Setup</div>}
          {members.map(m => (
            <ContribCard key={m} name={m} paid={memberPaid[m] || 0} share={sharePerMember} />
          ))}
        </Card>

        <Card>
          <CardTitle>Expense Breakdown</CardTitle>
          <DonutChart catBreakdown={catBreakdown} totalSpent={totalSpent} />
        </Card>
      </div>
    </div>
  )
}
