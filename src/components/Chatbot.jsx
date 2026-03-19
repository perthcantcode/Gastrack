import { useState, useRef, useEffect } from 'react'
import { Card } from './UI.jsx'
import styles from './Chatbot.module.css'

// Smart response engine with specific topic handling
function generateResponse(text, project, derived) {
  const t = text.toLowerCase()
  const budget = project?.budget || 0
  const spent = derived?.totalSpent || 0
  const remaining = derived?.remaining || 0
  const members = project?.members || []
  const share = members.length ? Math.round(budget / members.length) : 0
  const daysLeft = derived?.daysLeft || 0
  const taskPct = derived?.taskPct || 0
  const title = project?.title || 'your project'

  // ── GREETING ──
  if (t.match(/^(hi|hello|huy|hey|kamusta|kumusta|sup|yo|oi|musta|good (morning|afternoon|evening))\b/)) {
    return `Kamusta! 👋 I'm GasBot, your Gastrack assistant!\n\nI'm here to help with anything about **${title}** — budgeting, tasks, team issues, deadlines, and more.\n\nWhat's on your mind today?`
  }

  // ── NON-CONTRIBUTING TEAMMATE ──
  if (t.match(/won'?t|wont|not contributing|hindi nagbabayad|hindi tumutulong|not helping|ayaw|refuse|ignore|absent|ghost|walang gawa|lazy|tamad|free rider/)) {
    const underpaid = members.filter(m => (derived?.memberPaid?.[m] || 0) < share)
    const underpaidList = underpaid.length ? underpaid.join(', ') : 'some members'
    return `That's a really common group project problem — here's how to handle it properly:\n\n**Step 1 — Document everything first**\nGastrack already shows you who's underpaid in the Dashboard → Contribution Summary. Screenshot this as evidence. Currently, **${underpaidList}** haven't met their expected share of ₱${share.toLocaleString()}.\n\n**Step 2 — Have a direct but respectful conversation**\nApproach privately, not in front of the group. Use "I" statements: *"I noticed you haven't contributed yet — is there something blocking you?"*\n\n**Step 3 — Set a clear deadline for settlement**\nGive a specific date: *"Can you settle ₱${share.toLocaleString()} by [date]?"* Document this agreement.\n\n**Step 4 — Escalate if needed**\nIf still unresolved, bring the Gastrack screenshots to your professor as documented proof. Most professors take this seriously.\n\n**Step 5 — Adjust tasks in Gastrack**\nIf they're also not doing tasks, reassign in the Tasks tab so the project doesn't stall.\n\nRemember: the goal is to finish the project, not win an argument. 💪`
  }

  // ── OVER BUDGET ──
  if (t.match(/over budget|sobra|naubos|kulang|negative|exceeded|overspent|-/)) {
    return `You're currently ₱${Math.abs(remaining).toLocaleString()} over budget — here's what to do:\n\n**Immediate actions:**\n• Freeze all non-essential spending right now\n• Go to Expenses tab and review every entry — are all amounts correct?\n• Check if any expense can be reduced or cancelled\n\n**To recover:**\n• Have an emergency group meeting to discuss the shortfall\n• Calculate the additional amount needed per member: ₱${members.length ? Math.round(Math.abs(remaining) / members.length).toLocaleString() : 'N/A'} each\n• Consider cheaper alternatives for remaining project needs (e.g., digital submission instead of printing)\n\n**Going forward:**\n• Add a "no spending without group approval" rule\n• Log every peso in Gastrack immediately after spending\n• Check the Dashboard regularly so you catch overspending early 📊`
  }

  // ── SPLIT / CONTRIBUTION ──
  if (t.match(/split|divide|share|contribution|fair|bayad|equal|owe|reimburse|settle|who paid|utang|how much|magkano/)) {
    const memberStatus = members.map(m => {
      const paid = derived?.memberPaid?.[m] || 0
      const diff = paid - share
      return `• **${m}**: Paid ₱${paid.toLocaleString()} → ${diff >= 0 ? `Overpaid by ₱${diff.toLocaleString()} ✅` : `Underpaid by ₱${Math.abs(diff).toLocaleString()} ❌`}`
    }).join('\n')
    return `Here's the fair split breakdown for **${title}**:\n\n**Expected share per member: ₱${share.toLocaleString()}**\n(Total ₱${budget.toLocaleString()} ÷ ${members.length} members)\n\n**Current contribution status:**\n${memberStatus || '• No members added yet — go to Setup tab'}\n\n**How to settle:**\n• Members who are underpaid should transfer money to those who overpaid\n• Use GCash, bank transfer, or cash — then log it in Expenses\n• Once everyone is at ₱${share.toLocaleString()}, contributions are balanced 🎯`
  }

  // ── BUDGET SUMMARY ──
  if (t.match(/budget|gastos|pera|money|funds|pondo|how much left|remaining|spent|expense/)) {
    const pct = derived?.pctSpent || 0
    const status = pct > 90 ? '🔴 Critical — almost out of budget!' : pct > 70 ? '🟡 Warning — spending getting high' : '🟢 Good — budget on track'
    return `Here's your budget overview for **${title}**:\n\n📊 **Budget Status: ${status}**\n• Total Budget: ₱${budget.toLocaleString()}\n• Total Spent: ₱${spent.toLocaleString()} (${pct}%)\n• Remaining: ₱${remaining.toLocaleString()}\n• Per member share: ₱${share.toLocaleString()}\n\n**Tips to stay on budget:**\n• Log every expense immediately in the Expenses tab\n• Check the Expense Breakdown chart to see your biggest spending category\n• Before any purchase, ask: "Is this necessary for the project?"\n• Keep a small emergency fund (10% of budget) for unexpected costs\n\nNeed to see who's paid the most? Check Dashboard → Contribution Summary! 💡`
  }

  // ── TASK MANAGEMENT ──
  if (t.match(/task|gawa|todo|assign|work|progress|done|complete|responsible|checklist|kanban|who does what/)) {
    return `For managing tasks in **${title}**:\n\n**Current progress: ${taskPct}% complete** ${taskPct === 100 ? '🎉 All done!' : taskPct > 60 ? '💪 Good progress!' : taskPct > 30 ? '📝 Keep pushing!' : '⚠️ Need to pick up pace'}\n\n**How to use Gastrack Tasks effectively:**\n• Add every task — even small ones like "Print Chapter 1"\n• Assign to specific members so everyone is accountable\n• Set realistic deadlines per task using the date picker\n• Use the status badges: 🔴 Overdue, 🟡 Due soon, ⬜ Upcoming\n\n**Task management best practices:**\n• Break large tasks into smaller 1-2 hour chunks\n• Do a quick daily sync with your group (even just in chat)\n• If someone is blocked, reassign or help them immediately\n• Don't mark tasks done until they're actually done 😄\n\nGo to the Tasks tab to add and track everything!`
  }

  // ── DEADLINE / TIME ──
  if (t.match(/deadline|finish|late|on time|submit|due|days left|petsa|when|time|schedule|behind|paspas|urgent/)) {
    const riskLevel = daysLeft < 3 ? '🔴 CRITICAL' : daysLeft < 7 ? '🟡 AT RISK' : daysLeft < 14 ? '🟠 WATCH OUT' : '🟢 ON TRACK'
    return `**${title}** deadline status: ${riskLevel}\n\n⏰ **${daysLeft} days remaining**\n📋 **${taskPct}% of tasks completed**\n\n${daysLeft < 7 ? `**URGENT — ${daysLeft} days left!**\n• Drop everything non-essential and focus on the project\n• Hold an emergency group meeting today\n• List only the MUST-HAVE items to submit\n• Divide remaining tasks right now — everyone takes something\n• Set hourly/daily mini-deadlines` : `**Timeline advice:**\n• You have ${daysLeft} days — use them wisely!\n• With ${taskPct}% done, you need to complete ${100 - taskPct}% more\n• Ideal pace: finish ${Math.ceil((100 - taskPct) / Math.max(daysLeft, 1))}% per day\n• Set a "soft deadline" 3 days before actual submission for final review\n• Use Gastrack's task deadlines to stay on track`}\n\nCheck the Dashboard → Risk Status card for real-time monitoring! 🎯`
  }

  // ── TREASURY / FILES ──
  if (t.match(/file|document|upload|treasury|store|save|pdf|docx|receipt|photo|attachment|soft.?copy|hard.?copy/)) {
    return `For file management in **${title}**'s Treasury:\n\n**What to upload:**\n• Research papers and references\n• Draft documents (Chapter 1, 2, 3...)\n• Receipts and payment proofs\n• Presentation files (PPTX)\n• Photos of physical work\n\n**Naming convention tips:**\n• Use: \`[Content]_[Status]_[Date]\`\n• Example: \`Chapter1_Final_Mar19.docx\`\n• Example: \`Receipt_Printing_500peso.jpg\`\n\n**Gastrack Treasury features:**\n• Upload up to 900KB per file\n• Filter by file type (PDF, DOCX, PPTX, Images)\n• Search by filename\n• Download any file anytime\n• All files are saved to your account via Firebase\n\nGo to the Treasury tab to start uploading! 📁`
  }

  // ── MOTIVATION ──
  if (t.match(/motiv|inspir|encour|kaya|laban|push|tired|pagod|stress|anxious|worried|pangamba|takot|scared|helpless|wala na|give up|quit/)) {
    return `I hear you — school projects can be genuinely stressful. But let's put things in perspective: 💪\n\n**You've already:**\n• Set up your project in Gastrack ✅\n• Tracked ₱${spent.toLocaleString()} in expenses ✅\n• Completed ${taskPct}% of your tasks ✅\n• Have ${daysLeft} days to finish ✅\n\n**That's real progress — don't discount it!**\n\n**When you're feeling overwhelmed:**\n1. Open Gastrack Tasks and just complete ONE task\n2. That momentum will carry you to the next one\n3. Check off the easy ones first for quick wins\n4. Tell your group how you're feeling — you're not alone\n\n**Remember:** Every group that submitted a project felt exactly like this at some point. The fact that you're still pushing means you're going to make it. 🎯\n\nKaya ninyo to! One task at a time!`
  }

  // ── ASKING FOR TIPS / ADVICE ──
  if (t.match(/tip|advice|suggest|how to|paano|what should|recommend|best way|strategy|help me|tulungan/)) {
    return `Here are my top tips for **${title}**:\n\n**Budget Tips 💰**\n• Log expenses immediately — don't wait until end of week\n• Take photos of receipts and upload to Treasury\n• Check Dashboard daily to monitor spending\n\n**Task Tips ✅**\n• Assign every task to someone specific — no "group" tasks\n• Set deadlines even for internal milestones\n• ${taskPct < 50 ? `You're at ${taskPct}% — need to speed up!` : `Great job at ${taskPct}% — keep the momentum!`}\n\n**Team Tips 🤝**\n• Use Gastrack's Contribution Summary as your accountability tool\n• Hold short weekly check-ins (15 minutes max)\n• Address issues early — small problems become big ones fast\n\n**Deadline Tips ⏰**\n• ${daysLeft < 7 ? `Only ${daysLeft} days left — focus on essentials only!` : `You have ${daysLeft} days — use them strategically`}\n• Always have a "backup day" before submission\n• Submit early if possible — avoid last-minute technical issues\n\nAsk me about any of these in more detail! 😊`
  }

  // ── DEFAULT ── (connect any topic to Gastrack)
  return `That's a great point! Let me connect it to your project. 😊\n\nFor **${title}**, here's what I can help with right now:\n\n📊 **Budget**: ₱${remaining.toLocaleString()} remaining of ₱${budget.toLocaleString()}\n✅ **Tasks**: ${taskPct}% complete\n⏰ **Timeline**: ${daysLeft} days left\n👥 **Team**: ${members.length} member${members.length !== 1 ? 's' : ''}\n\nCan you be more specific? For example:\n• *"Who hasn't paid their share?"*\n• *"How do I handle a lazy teammate?"*\n• *"What tasks should I prioritize?"*\n• *"Are we on track to finish on time?"*\n\nThe more specific your question, the better I can help! 🎯`
}

export default function Chatbot({ project, derived }) {
  const [messages, setMessages] = useState([
    { role: 'assistant', content: `Huy! I'm **GasBot** 👋, your Gastrack AI assistant!\n\nAsk me **anything** about your project — I give specific, personalized answers based on your actual data.\n\nTry asking:\n• *"Who hasn't paid their share?"*\n• *"Are we going to finish on time?"*\n• *"My teammate won't contribute — what do I do?"*\n• *"How's our budget looking?"*` }
  ])
  const [input, setInput]     = useState('')
  const [loading, setLoading] = useState(false)
  const bottomRef = useRef()

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const send = (overrideText) => {
    const text = (overrideText !== undefined ? overrideText : input).trim()
    if (!text || loading) return
    setInput('')
    const newMessages = [...messages, { role: 'user', content: text }]
    setMessages(newMessages)
    setLoading(true)
    setTimeout(() => {
      const reply = generateResponse(text, project, derived)
      setMessages(prev => [...prev, { role: 'assistant', content: reply }])
      setLoading(false)
    }, 600 + Math.random() * 400)
  }

  const renderContent = (text) => text
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.*?)\*/g, '<em>$1</em>')
    .replace(/\n•\s/g, '<br>• ')
    .replace(/\n/g, '<br>')

  const suggestions = [
    'Who hasn\'t paid their share?',
    'Are we on track to finish?',
    'How\'s our budget?',
    'I need motivation!'
  ]

  return (
    <Card style={{ display:'flex', flexDirection:'column', height:'640px' }}>
      <div className={styles.header}>
        <div className={styles.avatar}>G</div>
        <div>
          <div className={styles.name}>GasBot</div>
          <div className={styles.status}><span className={styles.dot}/> Smart AI · Personalized answers</div>
        </div>
        <div className={styles.geminiTag}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="10" fill="#6366F1"/><path d="M8 12l3 3 5-5" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
          GasBot AI
        </div>
      </div>

      <div className={styles.messages}>
        {messages.map((m, i) => (
          <div key={i} className={`${styles.msg} ${m.role==='user' ? styles.user : styles.bot}`}>
            {m.role==='assistant' && <div className={styles.msgAvatar}>G</div>}
            <div className={styles.bubble} dangerouslySetInnerHTML={{ __html: renderContent(m.content) }} />
          </div>
        ))}
        {loading && (
          <div className={`${styles.msg} ${styles.bot}`}>
            <div className={styles.msgAvatar}>G</div>
            <div className={styles.typing}><span/><span/><span/></div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      <div className={styles.suggestions}>
        {suggestions.map(s => (
          <button key={s} className={styles.suggestion} onClick={() => send(s)}>{s}</button>
        ))}
      </div>

      <div className={styles.inputRow}>
        <input
          className={styles.input}
          placeholder="Ask anything about your project..."
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => e.key==='Enter' && !e.shiftKey && send()}
          disabled={loading}
        />
        <button className={styles.sendBtn} onClick={() => send()} disabled={loading || !input.trim()}>↑</button>
      </div>
    </Card>
  )
}
