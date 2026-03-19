import { useState, useRef, useEffect } from 'react'
import { Card } from './UI.jsx'
import styles from './Chatbot.module.css'

// ── INTENT CLASSIFIER ──
function classifyIntent(text, history) {
  const t = text.toLowerCase()
  const prev = history.slice(-2).map(m => m.content.toLowerCase()).join(' ')

  // Check if asking for simpler/shorter answer
  if (t.match(/simpl|shorter|brief|tldr|summarize|just tell|quick|lang|maikli|madali/))
    return 'simplify'

  // Check follow-up context from previous messages
  if (t.match(/^(yes|yeah|oo|yep|sure|okay|ok|ano|what|paano|how|bakit|why|then|then what|next|tapos)\b/) && prev)
    return 'followup'

  if (t.match(/^(hi|hello|huy|hey|kamusta|kumusta|sup|yo|oi|musta|good (morning|afternoon|evening|day))\b/))
    return 'greeting'
  if (t.match(/won'?t|not contributing|hindi nagbabayad|not helping|ayaw bayad|refuse|ghost|walang gawa|lazy|tamad|free.?rider|contribute|obligat/))
    return 'noncontrib'
  if (t.match(/over.?budget|naubos|sobra gastos|negative|exceeded|kulang budget|overspent|depleted/))
    return 'overbudget'
  if (t.match(/split|divide|fair share|how much owe|contribution|who.?paid|underpaid|overpaid|bayad|equal|settle|reimburse/))
    return 'split'
  if (t.match(/budget|gastos|pera|money|funds|pondo|how much left|remaining|total spent|expense track|financial/))
    return 'budget'
  if (t.match(/task|gawa|todo|assign|who does|checklist|progress|done|complete|responsible|duty|kanban/))
    return 'task'
  if (t.match(/deadline|finish|late|on time|submit|due date|days left|petsa|huling araw|behind|schedule|urgent|mabilis/))
    return 'deadline'
  if (t.match(/file|document|upload|treasury|store|save|pdf|docx|receipt|attachment|soft.?copy|hard.?copy/))
    return 'treasury'
  if (t.match(/team|group|member|collaborate|conflict|problema|away|kasama|teammate|kapwa|communicate|leader|roles/))
    return 'team'
  if (t.match(/motiv|inspir|encour|kaya|laban|push|tired|pagod|stress|anxious|worried|help|give up|quit|overwhelm/))
    return 'motivation'
  if (t.match(/thanks|salamat|ty|appreciate|helpful|galing|nice|ayos|bet|great/))
    return 'thanks'
  if (t.match(/tip|advice|suggest|how to improve|best practice|recommend|strategy|what should|paano|gawin ko/))
    return 'tips'
  if (t.match(/what is gastrack|how does gastrack|explain gastrack|features|tabs|dashboard|setup tab|gasbot/))
    return 'about'
  if (t.match(/say|script|what.?to.?say|message|approach|text|tell|confront|sinabi|sasabihin|paano sabihin/))
    return 'script'
  return 'general'
}

// ── RESPONSE GENERATOR ──
function generateResponse(intent, text, history, project, derived) {
  const t = text.toLowerCase()
  const budget = project?.budget || 0
  const spent = derived?.totalSpent || 0
  const remaining = derived?.remaining || 0
  const members = project?.members || []
  const share = members.length ? Math.round(budget / members.length) : 0
  const daysLeft = derived?.daysLeft || 0
  const taskPct = derived?.taskPct || 0
  const title = project?.title || 'your project'
  const pct = derived?.pctSpent || 0
  const memberPaid = derived?.memberPaid || {}
  const underpaidMembers = members.filter(m => (memberPaid[m] || 0) < share)
  const overpaidMembers = members.filter(m => (memberPaid[m] || 0) > share)
  const prevBot = history.filter(m => m.role === 'assistant').slice(-1)[0]?.content || ''

  switch (intent) {

    case 'simplify': {
      // Re-summarize the last bot response simply
      if (prevBot) {
        const lines = prevBot.split('\n').filter(l => l.trim() && !l.startsWith('**') && l.length > 10)
        const top3 = lines.slice(0, 3).map(l => l.replace(/•\s*/,'').trim()).join('\n• ')
        return `Sure! Here's the short version:\n\n• ${top3}\n\nNeed more detail on anything? 😊`
      }
      return `Sure! Ask me your question and I'll keep it simple. 😊`
    }

    case 'followup': {
      // Smart follow-up based on previous context
      const prevIntent = history.filter(m => m.role === 'user').slice(-2, -1)[0]?.intent || ''
      if (prevBot.includes('Step 1') || prevBot.includes('Step 2'))
        return `For your next step, the most important thing is to **document everything** in Gastrack first — screenshots of the Contribution Summary are your best evidence. Then approach your teammate privately and calmly. Want a specific script of what to say?`
      if (prevBot.includes('budget') || prevBot.includes('₱'))
        return `To dive deeper: your biggest action right now for **${title}** is to check the Expense Breakdown chart in Dashboard and identify which category is eating most of your ₱${budget.toLocaleString()} budget. Which category do you think is the issue?`
      return `Good question as a follow-up! Can you be more specific about what part you want to know more about? I'll give you a targeted answer. 😊`
    }

    case 'greeting':
      return `Kamusta, ${members[0] || 'team'}! 👋 I'm GasBot — your smart assistant for **${title}**.\n\nHere's your quick project snapshot:\n• 💰 Budget: ₱${budget.toLocaleString()} · Spent: ₱${spent.toLocaleString()} · Left: ₱${remaining.toLocaleString()}\n• ✅ Tasks: ${taskPct}% done\n• ⏰ Deadline: ${daysLeft} days away\n• 👥 Team: ${members.join(', ') || 'No members yet'}\n\nWhat do you need help with?`

    case 'noncontrib': {
      const names = underpaidMembers.length ? underpaidMembers.join(', ') : 'some members'
      const asking = t.match(/say|script|message|approach|sinabi|sasabihin|what to say|tell them/)
      if (asking) return intent === 'noncontrib' ? generateResponse('script', text, history, project, derived) : ''

      return `Here's how to handle a non-contributing teammate in **${title}**:\n\n**Who's currently underpaid:**\n${underpaidMembers.length
        ? underpaidMembers.map(m => `• **${m}** — Paid ₱${(memberPaid[m]||0).toLocaleString()} of ₱${share.toLocaleString()} expected`).join('\n')
        : '• Everyone is on track! 🎉'}\n\n**Action steps:**\n1. Screenshot the Gastrack Contribution Summary as proof\n2. Talk privately — not in group chat\n3. Be direct: *"You owe ₱${share.toLocaleString()} — can you settle by [date]?"*\n4. If ignored, bring evidence to your professor\n5. Reassign their tasks in Gastrack so the project continues\n\nWant me to write you the exact message to send them?`
    }

    case 'script':
      return `Here's a message you can send to a non-contributing teammate:\n\n---\n*"Hi [name], I wanted to check in about the project contributions. Based on our Gastrack tracker, the expected share per person is ₱${share.toLocaleString()}. I'd really appreciate it if we could settle this by [date] so we stay on track. Let me know if you have any concerns — we want to make this fair for everyone. Thanks!"*\n---\n\nTips for delivering it:\n• Send it privately (1-on-1 message, not group chat)\n• Be calm and factual — don't accuse, just state the numbers\n• Give a specific deadline\n• Forward the Gastrack screenshot as proof\n\nWant a more formal version or a more casual version?`

    case 'overbudget':
      return `You're ₱${Math.abs(remaining).toLocaleString()} over budget on **${title}**. Here's what to do:\n\n**Right now:**\n• Stop all non-essential spending immediately\n• Call an emergency group meeting\n• Each member owes an additional ₱${members.length ? Math.round(Math.abs(remaining) / members.length).toLocaleString() : 'N/A'} to cover the shortfall\n\n**Review your expenses:**\n• Open the Expenses tab and audit every entry\n• Check the Expense Breakdown chart — which category went over?\n• Are all amounts logged correctly? Any duplicates?\n\n**Cut costs:**\n• Switch to digital submission instead of printing if possible\n• Use free tools instead of paid ones\n• Buy in bulk or share costs with another group\n\n**Going forward:**\n• Set a hard rule: no spending without group approval\n• Check Dashboard daily — don't let it creep up again 📊`

    case 'split':
      return `Fair split breakdown for **${title}**:\n\n**Expected per member: ₱${share.toLocaleString()}**\n(₱${budget.toLocaleString()} ÷ ${members.length || 1} members)\n\n**Current status:**\n${members.length ? members.map(m => {
        const paid = memberPaid[m] || 0
        const diff = paid - share
        const status = diff > 0 ? `✅ Overpaid ₱${diff.toLocaleString()}` : diff < 0 ? `❌ Underpaid ₱${Math.abs(diff).toLocaleString()}` : `✅ Even`
        return `• **${m}**: Paid ₱${paid.toLocaleString()} → ${status}`
      }).join('\n') : '• No members added yet — go to Setup tab'}\n\n**How to settle:**\n• Underpaid members transfer money to overpaid members\n• Use GCash, bank transfer, or cash\n• Log it as an expense in Gastrack after settling\n• Aim to balance everyone at ₱${share.toLocaleString()} each 🎯`

    case 'budget':
      return `Budget overview for **${title}**:\n\n${pct > 90 ? '🔴 **CRITICAL** — Almost out of budget!' : pct > 70 ? '🟡 **WARNING** — Spending is high' : pct < 30 ? '🟢 **GOOD** — Budget well managed' : '🟡 **MODERATE** — Keep tracking'}\n\n• Total: ₱${budget.toLocaleString()}\n• Spent: ₱${spent.toLocaleString()} (${pct}%)\n• Remaining: ₱${remaining.toLocaleString()}\n• Per member share: ₱${share.toLocaleString()}\n\n**Smart budget tips:**\n• Log expenses the moment you spend — don't wait\n• Check Expense Breakdown chart to see your biggest cost category\n• Keep 10-15% as emergency fund — ₱${Math.round(budget * 0.1).toLocaleString()} for your project\n• No purchase without group approval rule\n\nWant to see who has paid the most? Check Dashboard → Contribution Summary!`

    case 'task':
      return `Task status for **${title}**: ${taskPct}% complete ${taskPct === 100 ? '🎉' : taskPct > 60 ? '💪' : taskPct > 30 ? '📝' : '⚠️'}\n\n**How to use Tasks effectively:**\n• Add EVERY task — even small ones like "Print Chapter 1"\n• Assign to a SPECIFIC person — no "group" tasks\n• Set a deadline for each using the date picker\n• Badges show: 🔴 Overdue · 🟡 Due soon · ⬜ Upcoming\n\n**Right now you should:**\n${taskPct < 30 ? '• Hold an emergency task assignment meeting\n• Break big tasks into 1-hour chunks\n• Each member picks at least 2 tasks today' : taskPct < 70 ? '• Focus on tasks due soonest first\n• Do a daily 5-minute group sync\n• Mark tasks done only when 100% complete' : '• You\'re doing great — keep the momentum!\n• Review remaining tasks for any blockers\n• Start preparing for final review'}\n\nGo to the Tasks tab to add and track everything!`

    case 'deadline':
      return `Deadline status for **${title}**:\n\n${daysLeft <= 0 ? '🔴 **OVERDUE!**' : daysLeft < 3 ? `🔴 **CRITICAL — Only ${daysLeft} days left!**` : daysLeft < 7 ? `🟠 **AT RISK — ${daysLeft} days left**` : daysLeft < 14 ? `🟡 **WATCH OUT — ${daysLeft} days left**` : `🟢 **ON TRACK — ${daysLeft} days left**`}\n\n• Task progress: ${taskPct}%\n• Ideal daily progress: ${Math.ceil((100 - taskPct) / Math.max(daysLeft, 1))}% per day\n\n${daysLeft < 7
        ? `**URGENT actions:**\n• Meet today and list ONLY what's required to submit\n• Divide remaining tasks right now — each person takes something\n• Set hourly check-ins\n• Prepare a "minimum viable submission" plan`
        : `**Timeline tips:**\n• Work backwards from deadline — set weekly milestones\n• Add 3-day buffer before submission for final review\n• Use Gastrack task deadlines to stay on track\n• If behind, eliminate nice-to-haves and focus on requirements`}`

    case 'treasury':
      return `File management tips for **${title}**'s Treasury:\n\n**What to upload:**\n• Research papers and references\n• Chapter drafts (v1, v2, final)\n• Receipts and payment proofs\n• Presentation files\n• Meeting notes\n\n**Naming convention:**\n• Format: \`[Topic]_[Status]_[Date]\`\n• Examples: \`Chapter1_Final_Mar20.docx\`, \`Receipt_Printing_500.jpg\`\n\n**Gastrack Treasury features:**\n• Max 900KB per file\n• Filter by type: PDF, DOCX, PPTX, Images\n• Search by filename\n• Download anytime — even on Vercel! 📁\n\nGo to Treasury tab to start uploading!`

    case 'team':
      return `Team management for **${title}** (${members.length} members: ${members.join(', ') || 'none added yet'}):\n\n**Current contribution balance:**\n${members.length ? members.map(m => {
        const paid = memberPaid[m] || 0
        const diff = paid - share
        return `• ${m}: ${diff >= 0 ? '✅' : '❌'} ₱${paid.toLocaleString()} paid`
      }).join('\n') : '• Add members in Setup tab first'}\n\n**Team collaboration tips:**\n• Use Gastrack Dashboard as your single source of truth\n• Share screenshots of progress in your group chat regularly\n• Set clear roles: Lead, Budget Keeper, Task Manager\n• Address issues early — small problems become big ones fast\n• Weekly 15-minute sync keeps everyone aligned\n\nRemember: you're all working toward the same goal! 🤝`

    case 'motivation':
      return `I hear you — school projects are genuinely hard. But look at what you've done: 💪\n\n**${title} progress:**\n• ✅ ${taskPct}% of tasks completed\n• 💰 ₱${spent.toLocaleString()} tracked and managed\n• 👥 ${members.length} member team organized\n• ⏰ ${daysLeft} days to make it happen\n\nThat's real. That's progress.\n\n**When you feel stuck:**\n1. Open Tasks tab — complete just ONE task right now\n2. That momentum carries you forward\n3. Tackle easy wins first — they add up fast\n4. Tell your group how you're feeling — you're not alone\n\n**Remember:** Every group that submitted felt exactly like this at some point. The ones who made it kept going anyway.\n\nKaya ninyo 'to. One task at a time. 🎯`

    case 'thanks':
      return `Walang anuman! 😊 Anytime ka mag-ask — lagi akong nandito para sa **${title}**!\n\nBefore you go, quick status check:\n• Budget: ${pct}% used (₱${remaining.toLocaleString()} left)\n• Tasks: ${taskPct}% done\n• Deadline: ${daysLeft} days away\n\n${pct > 80 || daysLeft < 7 ? '⚠️ Heads up — things are getting tight. Check the Dashboard!' : '✅ Looking good — keep it up!'}\n\nGood luck sa project ninyo! 💪`

    case 'tips':
      return `Top tips for **${title}** right now:\n\n**💰 Budget (${pct}% used)**\n• ${pct > 70 ? 'Slow down spending — you\'re over 70%!' : 'Log every expense immediately in Expenses tab'}\n• Check Expense Breakdown chart for biggest cost category\n\n**✅ Tasks (${taskPct}% done)**\n• ${taskPct < 50 ? 'Need to speed up — assign tasks today!' : 'Good progress — keep the daily momentum'}\n• Use deadline badges to prioritize urgent tasks\n\n**⏰ Timeline (${daysLeft} days left)**\n• ${daysLeft < 7 ? 'URGENT — focus on essentials only!' : 'Set weekly milestones and stick to them'}\n• Add 3-day buffer before final submission\n\n**👥 Team**\n• ${underpaidMembers.length ? `${underpaidMembers.join(', ')} still need to contribute their share` : 'All members contributing — great!'}\n• Daily 5-min sync keeps everyone aligned`

    case 'about':
      return `**Gastrack** is your all-in-one school project management app! Here's what it does:\n\n• ⚙️ **Setup** — Set project name, budget, deadline, and team members\n• 📊 **Dashboard** — See budget summary, who paid what, risk status, and expense charts\n• 💸 **Expenses** — Log and track every expense with category and date\n• ✅ **Tasks** — Assign tasks to members with deadlines and progress tracking\n• 📁 **Treasury** — Upload and organize project files and receipts\n• 🤖 **GasBot AI** — That's me! I answer questions and give advice based on your actual project data\n\nAll data is saved to your Google account via Firebase — so you can access it from any device! 🌐`

    default: {
      const hasData = budget > 0 || members.length > 0
      if (!hasData)
        return `I'd love to help! First, go to the **Setup tab** and fill in your project details — budget, deadline, and team members. Once that's done, I can give you personalized advice based on your actual data. 😊`

      // Check if it's clearly out of scope (academic, general knowledge, etc.)
      const outOfScope = t.match(/topic|subject|lesson|essay|research paper idea|assignment idea|what is|define|explain|history|science|math|formula|equation|code|program|create a|generate|write a|make a/)
      if (outOfScope)
        return `Pasensya, that's outside what I can help with! 😊 I'm GasBot — I specialize in **project management** for your group.\n\nHere's what I'm good at:\n• 💰 *"How's our budget?"* — tracks your actual spending\n• 👥 *"Who hasn't paid their share?"* — shows exact amounts owed\n• ✅ *"What tasks should we prioritize?"* — based on your deadlines\n• ⏰ *"Are we on track to finish?"* — real risk assessment\n• 🤝 *"My teammate won't contribute"* — step-by-step advice\n\nFor academic content help, try asking your professor or using a general AI tool. But for anything about **${title}** — I'm your guy! 🎯`

      return `I'm not sure I understood that fully — can you rephrase? 😊\n\nFor **${title}**, I can help with:\n• Budget tracking and expense management\n• Who owes what in your group\n• Task assignments and deadlines\n• Handling team conflicts\n• File organization in Treasury\n\nTry one of the suggestion buttons below or ask something specific! 🎯`
    }
  }
}

const SUGGESTIONS = [
  "Who hasn't paid their share?",
  "Are we on track to finish?",
  "My teammate won't contribute",
  "How's our budget looking?",
]

export default function Chatbot({ project, derived }) {
  const [messages, setMessages] = useState([
    { role: 'assistant', content: `Kamusta! 👋 I'm **GasBot**, your smart Gastrack assistant!\n\nI give **specific, personalized answers** based on your actual project data — not generic tips.\n\nTry asking:\n• *"Who hasn't paid their share?"*\n• *"My teammate won't contribute — what do I say?"*\n• *"Are we going to finish on time?"*\n• *"How do I split the costs fairly?"*\n\nWhat's on your mind?`, intent: 'greeting' }
  ])
  const [input, setInput]     = useState('')
  const [loading, setLoading] = useState(false)
  const [typing, setTyping]   = useState('')
  const bottomRef = useRef()

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, loading])

  const send = (overrideText) => {
    const text = (overrideText !== undefined ? overrideText : input).trim()
    if (!text || loading) return
    setInput('')

    const intent = classifyIntent(text, messages)
    const userMsg = { role: 'user', content: text, intent }
    const newMessages = [...messages, userMsg]
    setMessages(newMessages)
    setLoading(true)

    // Realistic typing delay based on response length
    const delay = 400 + Math.random() * 600

    setTimeout(() => {
      const reply = generateResponse(intent, text, newMessages, project, derived)
      setMessages(prev => [...prev, { role: 'assistant', content: reply, intent }])
      setLoading(false)
    }, delay)
  }

  const renderContent = (text) => {
    return text
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*(.*?)\*/g, '<em>$1</em>')
      .replace(/^---$/gm, '<hr style="border-color:rgba(255,255,255,0.1);margin:8px 0">')
      .replace(/\n•\s/g, '<br>• ')
      .replace(/\n(\d+)\.\s/g, '<br>$1. ')
      .replace(/\n/g, '<br>')
  }

  return (
    <Card style={{ display:'flex', flexDirection:'column', height:'660px' }}>
      <div className={styles.header}>
        <div className={styles.avatar}>G</div>
        <div style={{ flex: 1 }}>
          <div className={styles.name}>GasBot</div>
          <div className={styles.status}>
            <span className={styles.dot}/>
            Smart AI · Reads your live project data
          </div>
        </div>
        <div className={styles.geminiTag}>
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none">
            <circle cx="12" cy="12" r="10" fill="#6366F1"/>
            <path d="M8 12l3 3 5-5" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          GasBot v2
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
        {SUGGESTIONS.map(s => (
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
