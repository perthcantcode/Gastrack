import { useState } from 'react'
import { Card, CardTitle, Badge, Btn, Input, Select, Textarea } from './UI.jsx'
import { fmt, today } from '../utils/format.js'
import styles from './Expenses.module.css'

const CATEGORIES = ['Materials','Printing','Transportation','Food','Research','Other']
const BLANK = { name:'', desc:'', amount:'', cat:'Materials', paid:'', date:today() }

export default function Expenses({ state, expenses, addExpense, editExpense, deleteExpense }) {
  const [form, setForm]     = useState({ ...BLANK, paid: state?.members?.[0]||'' })
  const [editId, setEditId] = useState(null)

  const f = k => e => setForm(p => ({ ...p, [k]: e.target.value }))

  const handleSubmit = async () => {
    if (!form.name.trim()||!form.amount) return
    const exp = { ...form, amount: parseFloat(form.amount) }
    if (editId) { await editExpense(editId, exp); setEditId(null) }
    else          await addExpense(exp)
    setForm({ ...BLANK, paid: state?.members?.[0]||'' })
  }

  const handleEdit = e => {
    setEditId(e.id)
    setForm({ name:e.name, desc:e.desc, amount:e.amount, cat:e.cat, paid:e.paid, date:e.date })
  }

  const total = expenses.reduce((s,e)=>s+(e.amount||0),0)

  return (
    <div className={styles.grid}>
      <Card>
        <CardTitle>{editId?'Edit Expense':'Add New Expense'}</CardTitle>
        <div className={styles.group}><Input label="Expense Name" placeholder="e.g. Tarpaulin Printing" value={form.name} onChange={f('name')} /></div>
        <div className={styles.group}><Textarea label="Description" placeholder="e.g. Printed final tarp" value={form.desc} onChange={f('desc')} /></div>
        <div className={styles.row2}>
          <Input label="Amount (PHP)" type="number" placeholder="0.00" value={form.amount} onChange={f('amount')} />
          <Select label="Category" value={form.cat} onChange={f('cat')}>{CATEGORIES.map(c=><option key={c}>{c}</option>)}</Select>
        </div>
        <div className={styles.row2}>
          <Select label="Paid By" value={form.paid} onChange={f('paid')}>{(state?.members||[]).map(m=><option key={m}>{m}</option>)}</Select>
          <Input label="Date" type="date" value={form.date} onChange={f('date')} />
        </div>
        <div className={styles.btnRow}>
          <Btn variant="primary" onClick={handleSubmit} style={{flex:1}}>{editId?'Update Expense':'Add Expense'}</Btn>
          {editId && <Btn variant="ghost" onClick={()=>{setEditId(null);setForm({...BLANK,paid:state?.members?.[0]||''})}}>Cancel</Btn>}
        </div>
      </Card>
      <Card style={{padding:16}}>
        <CardTitle>All Expenses</CardTitle>
        <div className={styles.tableWrap}>
          <table className={styles.table}>
            <thead><tr><th>Name</th><th>Description</th><th>Amount</th><th>Category</th><th>Paid By</th><th>Date</th><th>Actions</th></tr></thead>
            <tbody>
              {expenses.length===0&&<tr><td colSpan={7} className={styles.empty}>No expenses yet</td></tr>}
              {expenses.map(e=>(
                <tr key={e.id} className={editId===e.id?styles.editing:''}>
                  <td className={styles.nameCell}>{e.name}</td>
                  <td className={styles.descCell}>{e.desc}</td>
                  <td className={styles.amtCell}>{fmt(e.amount)}</td>
                  <td><Badge variant="neutral">{e.cat}</Badge></td>
                  <td>{e.paid}</td>
                  <td className={styles.dateCell}>{e.date}</td>
                  <td className={styles.actionsCell}>
                    <Btn variant="edit" onClick={()=>handleEdit(e)}>Edit</Btn>{' '}
                    <Btn variant="danger" onClick={()=>deleteExpense(e.id)}>Delete</Btn>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className={styles.totalRow}>
          <span>Total Amount:</span>
          <span className={styles.totalAmt}>{fmt(total)}</span>
        </div>
      </Card>
    </div>
  )
}
