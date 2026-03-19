import { useState, useEffect } from 'react'
import { Card, CardTitle, StatCard, Btn, Input } from './UI.jsx'
import { fmtShort, fmtDate } from '../utils/format.js'
import styles from './Setup.module.css'

export default function Setup({ state, derived, saveProject }) {
  const [form, setForm]       = useState({ title:'', budget:'', deadline:'', members:[] })
  const [memberInput, setMemberInput] = useState('')
  const [saved, setSaved]     = useState(false)

  useEffect(() => {
    if (state) setForm({ title: state.title||'', budget: state.budget||'', deadline: state.deadline||'', members: state.members||[] })
  }, [state])

  const f = k => e => setForm(p => ({ ...p, [k]: e.target.value }))

  const handleSave = async () => {
    await saveProject({ ...form, budget: parseFloat(form.budget)||0 })
    setSaved(true); setTimeout(() => setSaved(false), 1500)
  }

  const addMember = () => {
    const v = memberInput.trim()
    if (!v || form.members.includes(v)) return
    setForm(p => ({ ...p, members: [...p.members, v] }))
    setMemberInput('')
  }

  const removeMember = m => setForm(p => ({ ...p, members: p.members.filter(x => x !== m) }))

  const budgetNum = parseFloat(form.budget) || 0
  const daysPreview = form.deadline ? Math.max(0, Math.ceil((new Date(form.deadline) - new Date()) / 86_400_000)) : 0
  const sharePreview = form.members.length ? budgetNum / form.members.length : 0

  return (
    <div className={styles.grid}>
      <Card>
        <CardTitle>Project Info</CardTitle>
        <div className={styles.group}><Input label="Project Title" placeholder="e.g. Thesis, Research Paper..." value={form.title} onChange={f('title')} /></div>
        <div className={styles.row2}>
          <Input label="Total Budget (PHP)" type="number" placeholder="0.00" value={form.budget} onChange={f('budget')} />
          <Input label="Deadline" type="date" value={form.deadline} onChange={f('deadline')} />
        </div>
        <div className={styles.group}>
          <label className={styles.memberLabel}>Team Members</label>
          <div className={styles.memberInput}>
            <input className={styles.textInput} placeholder="Enter member name" value={memberInput} onChange={e=>setMemberInput(e.target.value)} onKeyDown={e=>e.key==='Enter'&&addMember()} />
            <Btn variant="ghost" onClick={addMember}>Add</Btn>
          </div>
          <div className={styles.memberTags}>
            {form.members.map(m => (
              <span key={m} className={styles.tag}>{m}<span className={styles.tagRemove} onClick={()=>removeMember(m)}>×</span></span>
            ))}
          </div>
        </div>
        <Btn variant={saved?'success':'primary'} onClick={handleSave} style={{width:'100%',marginTop:4}}>
          {saved ? '✓ Saved to Cloud!' : 'Save Project'}
        </Btn>
      </Card>
      <div className={styles.summaryCol}>
        <Card><CardTitle>Project Summary</CardTitle>
          <div className={styles.statGrid}>
            <StatCard label="Budget" value={fmtShort(budgetNum)} color="var(--accent-light)" />
            <StatCard label="Members" value={form.members.length} color="var(--warning)" />
            <StatCard label="Days Left" value={daysPreview} color="var(--success)" />
          </div>
        </Card>
        <Card><CardTitle>Share per Member</CardTitle>
          <div style={{fontSize:28,fontWeight:800,fontFamily:'var(--mono)',color:'var(--text)',marginBottom:4}}>{fmtShort(sharePreview)}</div>
          <div style={{fontSize:11,color:'var(--text3)'}}>Expected contribution per person</div>
        </Card>
        <Card><CardTitle>Deadline</CardTitle>
          <div style={{fontSize:15,fontWeight:700,fontFamily:'var(--mono)',color:'var(--text)'}}>{fmtDate(form.deadline)}</div>
        </Card>
      </div>
    </div>
  )
}
