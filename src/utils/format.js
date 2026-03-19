export const fmt = (n) =>
  '₱' + Number(n).toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })

export const fmtShort = (n) =>
  '₱' + Math.round(n).toLocaleString('en-PH')

export const today = () => new Date().toISOString().split('T')[0]

export const fmtDate = (iso) =>
  iso ? new Date(iso).toLocaleDateString('en-PH', { year: 'numeric', month: 'long', day: 'numeric' }) : '—'
