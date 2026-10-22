import { useEffect, useRef, useState, type ReactNode } from "react"
import { Icon } from "./Icon"
import { dict, langs, languageNames, spanishNames, type Lang, type Step } from "./i18n"

type Screen = "home" | "appointments" | "appointment" | "contigo" | "call" | "settings" | "language" | "pre" | "summary" | "preSent" | "turn" | "consultation" | "share" | "shareSent" | "translate" | "interpreter" | "reports" | "report" | "question" | "questionSent" | "human"
// `spec` indexes the translated specialty name (0 = Traumatología).
const appointments = [
  { id: 0, spec: 0, day: 19, time: "11:30", doctor: 0, room: "2.14", past: false },
  { id: 1, spec: 1, day: 22, time: "09:15", doctor: 1, room: "1.08", past: false },
  { id: 2, spec: 2, day: 28, time: "16:00", doctor: 2, room: "3.02", past: false },
  { id: 3, spec: 3, day: 12, time: "10:00", doctor: 3, room: "1.05", past: true },
  { id: 4, spec: 0, day: 7, time: "11:30", doctor: 0, room: "2.14", past: true },
]
const permissionKeys = ["reports", "appointments", "turn"] as const
// Screens not listed under any section belong to "Contigo".
const navItems: { key: keyof typeof dict.ES.nav, icon: string, target: Screen, screens: Screen[] }[] = [
  { key: "home", icon: "home", target: "home", screens: ["home"] },
  { key: "appointments", icon: "calendar", target: "appointments", screens: ["appointments", "appointment"] },
  { key: "contigo", icon: "heart", target: "contigo", screens: [] },
  { key: "reports", icon: "file", target: "reports", screens: ["reports", "report", "question", "questionSent"] },
  { key: "settings", icon: "settings", target: "settings", screens: ["settings"] },
]
function Button({
  children,
  onClick,
  secondary = false,
  disabled = false,
}: {
  children: ReactNode
  onClick?: () => void
  secondary?: boolean
  disabled?: boolean
}) {
  return (
    <button
      className={secondary ? "button secondary" : "button"}
      onClick={onClick}
      disabled={disabled}
    >
      {children}
    </button>
  )
}
function Notice({ text }: { text: string }) {
  return (
    <div className="notice">
      <Icon name="shield" size={21} />
      <span>{text}</span>
    </div>
  )
}
function Toggle({
  label,
  description,
  checked,
  onChange,
}: {
  label: string
  description?: string
  checked: boolean
  onChange: (checked: boolean) => void
}) {
  return (
    <label className="toggle">
      <span>
        <strong>{label}</strong>
        {description && <span>{description}</span>}
      </span>
      <input
        type="checkbox"
        role="switch"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
      />
    </label>
  )
}
function RelativePicker({
  relatives,
  value,
  onChange,
}: {
  relatives: string[]
  value: number | null
  onChange: (relative: number) => void
}) {
  return (
    <div className="language-options">
      {relatives.map((r, i) => (
        <button
          className={`language-option ${value === i ? "chosen" : ""}`}
          key={r}
          onClick={() => onChange(i)}
        >
          <span className="round-icon">
            <Icon name="user" />
          </span>
          <strong>{r}</strong>
          <span className="radio">{value === i && <i />}</span>
        </button>
      ))}
    </div>
  )
}
function Success({ title, text }: { title: string, text: string }) {
  return (
    <div className="success">
      <span className="success-icon">
        <Icon name="check" size={34} />
      </span>
      <h2>{title}</h2>
      <p>{text}</p>
    </div>
  )
}
export default function App() {
  const [screen, setScreen] = useState<Screen>("home")
  const [history, setHistory] = useState<Screen[]>([])
  const scroll = useRef<HTMLElement>(null)
  const [selectedAppointment, setSelectedAppointment] = useState(0)
  const [tab, setTab] = useState<"next" | "past">("next")
  const [month, setMonth] = useState(4)
  const [selectedDay, setSelectedDay] = useState<number | null>(null)
  // App language: everything on screen, including what the assistant says.
  const [lang, setLang] = useState<Lang>("ES")
  const [answers, setAnswers] = useState<string[]>([])
  const [draft, setDraft] = useState("")
  const [preSent, setPreSent] = useState(false)
  const [extraSummary, setExtraSummary] = useState("")
  const [notification, setNotification] = useState(false)
  const [called, setCalled] = useState(false)
  const [relative, setRelative] = useState<number | null>(null)
  const [consent, setConsent] = useState(false)
  const [shared, setShared] = useState(false)
  const [fromLang, setFromLang] = useState<Lang>("EN")
  const [toLang, setToLang] = useState<Lang>("ES")
  const [listening, setListening] = useState(false)
  const [selectedReport, setSelectedReport] = useState(0)
  const [openParameter, setOpenParameter] = useState<number | null>(0)
  const [doubt, setDoubt] = useState("")
  const [humanRequested, setHumanRequested] = useState(false)
  const [callStep, setCallStep] = useState(0)
  const [handoffAt, setHandoffAt] = useState<number | null>(null)
  const [callSeconds, setCallSeconds] = useState(0)
  const [trustedDraft, setTrustedDraft] = useState<number | null>(null)
  const [trusted, setTrusted] = useState<number | null>(null)
  const [permissions, setPermissions] = useState({
    reports: true,
    appointments: false,
    turn: false,
  })
  const [aiConsent, setAiConsent] = useState(false)
  const s = dict[lang]
  const appointment = appointments[selectedAppointment]
  const specialty = s.specialties[appointment.spec]
  const report = s.reportList[selectedReport]
  const activeNav =
    navItems.find((n) => n.screens.includes(screen))?.key ?? "contigo"
  const queueCount = called ? 0 : notification ? 2 : 3
  const queueWait = called ? s.yourTurn : notification ? "≈10 min" : "≈15 min"
  const changeLang = (next: Lang) => {
    setLang(next)
    setAnswers([])
    setDraft("")
  }
  useEffect(() => {
    document.documentElement.lang = lang.toLowerCase()
    // The translator opens with the patient's language on their side.
    setToLang(lang)
    setFromLang((f) => (f === lang ? (lang === "ES" ? "EN" : "ES") : f))
  }, [lang])
  const go = (next: Screen) => {
    setHistory((h) => [...h, screen])
    setScreen(next)
    scroll.current?.scrollTo(0, 0)
  }
  const root = (next: Screen) => {
    setHistory([])
    setScreen(next)
    scroll.current?.scrollTo(0, 0)
  }
  const back = () => {
    setScreen(history.at(-1) || "home")
    setHistory((h) => h.slice(0, -1))
    scroll.current?.scrollTo(0, 0)
  }
  const openAppointment = (id: number) => {
    setSelectedAppointment(id)
    go("appointment")
  }
  const openAppointmentReport = () => {
    setSelectedReport(appointment.spec === 0 ? 1 : 0)
    setOpenParameter(0)
    go("report")
  }
  const startPre = () => {
    setSelectedAppointment(0)
    go("language")
  }
  const startCall = () => {
    setCallStep(0)
    setHandoffAt(null)
    setCallSeconds(0)
    go("call")
  }
  const reachedTurns = s.callTurns.slice(0, (handoffAt ?? callStep) + 1)
  const callLines = [
    ...reachedTurns.flatMap((t) => t.lines),
    ...(handoffAt === null ? [] : s.handoffLines),
  ]
  // Later turns overwrite earlier fields with the same label (e.g. "Estado").
  const callSummary = [...new Map(reachedTurns.flatMap((t) => t.summary ?? []))]
  const callEnded = handoffAt !== null || callStep === s.callTurns.length - 1
  const callClock = `${Math.floor(callSeconds / 60)}:${String(callSeconds % 60).padStart(2, "0")}`
  useEffect(() => {
    if (screen !== "call" || callEnded) return
    const timer = setInterval(() => setCallSeconds((s) => s + 1), 1000)
    return () => clearInterval(timer)
  }, [screen, callEnded])
  const simulateReply = () => {
    setCallStep((s) => s + 1)
    requestAnimationFrame(() =>
      scroll.current?.scrollTo({ top: scroll.current.scrollHeight, behavior: "smooth" }),
    )
  }
  const addAnswer = (value: string) => {
    if (value.trim() && answers.length < 5) {
      setAnswers((a) => [...a, value.trim()])
      setDraft("")
    }
  }
  const appointmentCards = appointments.filter(
    (a) =>
      a.past === (tab === "past") &&
      (selectedDay === null || (month === 4 && a.day === selectedDay)),
  )
  const startDay = new Date(2025, month, 1).getDay()
  const blanks = (startDay + 6) % 7
  const days = new Date(2025, month + 1, 0).getDate()
  const monthLabel = new Date(2025, month, 1).toLocaleDateString(s.locale, {
    month: "long",
    year: "numeric",
  })
  // Human support is offered only where someone may be left waiting or lost.
  const footer = screen === "appointment" || screen === "turn"
  // The doctor always reads Spanish; typed answers are passed on as written.
  const ds = dict.ES.doctorSummary
  const forDoctor = (i: number) =>
    answers[i] === s.exampleAnswers[i] ? ds.examples[i] : answers[i] || ds.notGiven
  const relativeName = (i: number) => s.relatives[i].split(" · ")[0]
  const languageSelect = (value: Lang, onChange: (l: Lang) => void) => (
    <select value={value} onChange={(e) => onChange(e.target.value as Lang)}>
      {langs.map((l) => (
        <option key={l} value={l}>
          {languageNames[l]}
        </option>
      ))}
    </select>
  )
  const moduleCards = (
    <div className="module-list">
      {[
        {
          title: s.modules.call[0],
          copy: s.modules.call[1],
          icon: "phone",
          action: startCall,
        },
        {
          title: s.modules.pre[0],
          copy: preSent ? s.modules.preDone : s.modules.pre[1],
          icon: "chat",
          action: startPre,
        },
        {
          title: s.modules.translate[0],
          copy: s.modules.translate[1],
          icon: "translate",
          action: () => go("translate"),
        },
        {
          title: s.modules.reports[0],
          copy: s.modules.reports[1],
          icon: "file",
          action: () => go("reports"),
        },
      ].map((m) => (
        <button className="module-card" key={m.icon} onClick={m.action}>
          <span className="module-icon">
            <Icon name={m.icon} />
          </span>
          <span className="module-copy">
            <strong>{m.title}</strong>
            <span>{m.copy}</span>
          </span>
          <Icon name="arrow" size={19} />
        </button>
      ))}
    </div>
  )
  const first = appointment.id === 0
  const j = s.journey
  const journey: {
    label: string
    description: string
    state: Step
    action: () => void
    disabled: boolean
  }[] = [
    {
      label: j.appointment,
      description: first ? j.appointmentCall : s.confirmed,
      state: "hecho",
      action: startCall,
      disabled: !first,
    },
    {
      label: s.modules.pre[0],
      description: preSent ? j.preDone : j.preTodo,
      state: appointment.past || preSent ? "hecho" : "pendiente",
      action: startPre,
      disabled: !first,
    },
    {
      label: j.turn,
      description: first
        ? called
          ? j.turnDone
          : j.turnWaiting(queueCount, queueWait)
        : j.turnLater,
      state: appointment.past || (called && first) ? "hecho" : first ? "ahora" : "pendiente",
      action: () => go("turn"),
      disabled: !first,
    },
    {
      label: j.consultation,
      description: appointment.past
        ? j.consultationDone
        : `${appointment.time} · ${s.room(appointment.room)}`,
      state: appointment.past ? "hecho" : called && first ? "ahora" : "pendiente",
      action: () => go("consultation"),
      disabled: !first || !called,
    },
    {
      label: j.report,
      description: appointment.past ? j.reportDone : j.reportLater,
      state: appointment.past ? "hecho" : "pendiente",
      action: openAppointmentReport,
      disabled: !appointment.past,
    },
  ]
  const translation = s.translation
  const explanation = (title: string, meaning: string, advice: string) => (
    <div className="parameter-explanation">
      {title && <p className="muted left">{title}</p>}
      <h3>{s.whatItMeans}</h3>
      <p>{meaning}</p>
      <h3>{s.whatIsDone}</h3>
      <p>{advice}</p>
      <div className="reviewed">
        <Icon name="shield" size={19} />
        {s.reviewedByDoctor}
      </div>
    </div>
  )
  return (
    <div className="presentation">
      <div className="phone">
        <div className="status-bar">
          <span>11:15</span>
          <div className="status-symbols">
            <svg
              viewBox="0 0 18 12"
              width="18"
              height="12"
              fill="currentColor"
              aria-hidden="true"
            >
              <rect x="1" y="8" width="3" height="4" rx="1" />
              <rect x="5.5" y="5.5" width="3" height="6.5" rx="1" />
              <rect x="10" y="3" width="3" height="9" rx="1" />
              <rect x="14.5" width="3" height="12" rx="1" />
            </svg>
            <svg
              width="18"
              height="14"
              viewBox="0 0 20 15"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              aria-hidden="true"
            >
              <path d="M2 5a12 12 0 0 1 16 0M5 8a8 8 0 0 1 10 0m-7 3a3 3 0 0 1 4 0" />
              <circle cx="10" cy="13" r="1" fill="currentColor" stroke="none" />
            </svg>
            <span className="battery">70</span>
          </div>
        </div>
        <p className="disclaimer">{s.disclaimer}</p>
        <header className="brand-header">
          <img src={`${import.meta.env.BASE_URL}hospiten-logo.png`} alt="Hospiten" />
          <button
            className="avatar"
            onClick={() => root("settings")}
            aria-label={s.titles.settings}
          >
            AL
          </button>
        </header>
        {screen !== "home" && (
          <div className="page-heading">
            <button aria-label={s.back} onClick={back}>
              <Icon name="back" />
            </button>
            <h1>{s.titles[screen]}</h1>
          </div>
        )}
        <main
          ref={scroll}
          className={`screen-content screen-${screen}`}
          key={screen}
        >
          {screen === "home" && (
            <>
              <div className="greeting">
                <p>{s.greeting}</p>
                <h1>Ana</h1>
                <span>{s.todayLong}</span>
              </div>
              <section className="next-appointment card">
                <span className="round-icon">
                  <Icon name="calendar" size={25} />
                </span>
                <span className="overline">{s.nextAppointment}</span>
                <h2>{s.specialties[0]}</h2>
                <p className="appointment-time">
                  11:30 <span>· {s.room("2.14")}</span>
                </p>
                <p>{s.doctors[0]} · {s.hospital}</p>
                <Button onClick={() => openAppointment(0)}>
                  {s.viewAppointment}
                  <Icon name="arrow" size={20} />
                </Button>
              </section>
              <button className="home-turn" onClick={() => go("turn")}>
                <span className="round-icon">
                  <Icon name="clock" />
                </span>
                <span>
                  <strong>{s.homeTurn(queueCount)}</strong>
                  <span>{called ? s.goToRoom("2.14") : s.estimated(queueWait)}</span>
                </span>
                <Icon name="arrow" size={22} />
              </button>
              <section className="contigo-section card">
                <div className="section-heading">
                  <Icon name="heart" size={25} />
                  <h2>{s.contigoTitle}</h2>
                  <span className="tag">{s.newTag}</span>
                </div>
                <p>{s.accompany}</p>
                {moduleCards}
              </section>
            </>
          )}
          {screen === "appointments" && (
            <>
              <section className="calendar card">
                <div className="calendar-heading">
                  <button
                    aria-label={s.prevMonth}
                    onClick={() => {
                      setMonth((m) => m - 1)
                      setSelectedDay(null)
                    }}
                  >
                    <Icon name="back" size={20} />
                  </button>
                  <h2>{monthLabel}</h2>
                  <button
                    aria-label={s.nextMonth}
                    onClick={() => {
                      setMonth((m) => m + 1)
                      setSelectedDay(null)
                    }}
                  >
                    <Icon name="arrow" size={20} />
                  </button>
                </div>
                <div className="calendar-grid">
                  {s.weekdays.map((d, i) => (
                    <span className="weekday" key={`w${i}`}>
                      {d}
                    </span>
                  ))}
                  {Array.from({ length: blanks }, (_, i) => (
                    <span key={`b${i}`} />
                  ))}
                  {Array.from({ length: days }, (_, i) => {
                    const day = i + 1
                    const marked =
                      month === 4 && appointments.some((a) => a.day === day)
                    return (
                      <button
                        key={day}
                        aria-label={s.dayLabel(day, monthLabel, marked)}
                        aria-pressed={selectedDay === day}
                        onClick={() => {
                          setSelectedDay(selectedDay === day ? null : day)
                          if (marked) setTab(day < 19 ? "past" : "next")
                        }}
                        className={`${
                          month === 4 && day === 19 ? "today" : ""
                        } ${selectedDay === day ? "selected" : ""}`}
                      >
                        {day}
                        {marked && <i />}
                      </button>
                    )
                  })}
                </div>
                <p className="calendar-key">
                  <i />
                  {s.dayWithAppointment} <span>{s.todayDate}</span>
                </p>
              </section>
              <div
                className="tabs"
                role="tablist"
                aria-label={s.appointmentStatus}
              >
                <button
                  role="tab"
                  aria-selected={tab === "next"}
                  className={tab === "next" ? "active" : ""}
                  onClick={() => {
                    setTab("next")
                    setSelectedDay(null)
                  }}
                >
                  {s.upcoming} <span>3</span>
                </button>
                <button
                  role="tab"
                  aria-selected={tab === "past"}
                  className={tab === "past" ? "active" : ""}
                  onClick={() => {
                    setTab("past")
                    setSelectedDay(null)
                  }}
                >
                  {s.past} <span>2</span>
                </button>
              </div>
              {selectedDay && (
                <button
                  className="text-button"
                  onClick={() => setSelectedDay(null)}
                >
                  {s.clearFilter}
                </button>
              )}
              <div className="appointment-list" role="tabpanel">
                {appointmentCards.length ? (
                  appointmentCards.map((a) => (
                    <button
                      className="appointment-card card"
                      key={a.id}
                      onClick={() => openAppointment(a.id)}
                    >
                      <span className="date-tile">
                        <strong>{a.day}</strong>
                        <span>{s.monthShort}</span>
                      </span>
                      <span className="appointment-copy">
                        <strong>{s.specialties[a.spec]}</strong>
                        <span>
                          {a.day === 19 ? s.today : s.dateShort(a.day)} · {a.time}
                        </span>
                        <span>
                          {a.past ? s.done : s.confirmed} · {s.inPerson}
                        </span>
                      </span>
                      <Icon name="arrow" size={20} />
                    </button>
                  ))
                ) : (
                  <div className="empty-state card">
                    <Icon name="calendar" size={30} />
                    <h2>{s.noAppointments}</h2>
                    <p>{s.noAppointmentsHint}</p>
                    <Button secondary onClick={() => setSelectedDay(null)}>
                      {s.viewAll}
                    </Button>
                  </div>
                )}
              </div>
            </>
          )}
          {screen === "appointment" && (
            <>
              <section className="appointment-detail card">
                <span className="tag">
                  {appointment.past ? s.done : s.confirmed}
                </span>
                <h2>{specialty}</h2>
                <p className="appointment-time">
                  {appointment.day === 19
                    ? s.today
                    : s.dateLong(appointment.day)}{" "}
                  · {appointment.time}
                </p>
                <div className="detail-row">
                  <Icon name="user" />
                  <div>
                    <strong>{s.doctors[appointment.doctor]}</strong>
                    <span>{s.specialist(specialty)}</span>
                  </div>
                </div>
                <div className="detail-row">
                  <Icon name="calendar" />
                  <div>
                    <strong>{s.hospital}</strong>
                    <span>{s.room(appointment.room)} · {s.inPerson}</span>
                  </div>
                </div>
                <p className="patient-line">{s.patientLine}</p>
              </section>
              <section className="journey">
                <h2>{s.journeyTitle}</h2>
                <p>{s.journeyHint}</p>
                <div className="journey-list">
                  {journey.map((step, i) => (
                    <button
                      className="journey-step"
                      key={i}
                      onClick={step.action}
                      disabled={step.disabled}
                    >
                      <span className={`step-number ${step.state}`}>
                        {step.state === "hecho" ? (
                          <Icon name="check" size={20} />
                        ) : (
                          i + 1
                        )}
                      </span>
                      <span className="step-copy">
                        <span>
                          <strong>{step.label}</strong>
                          <span className={`step-state ${step.state}`}>
                            {s.states[step.state]}
                          </span>
                        </span>
                        <span>{step.description}</span>
                      </span>
                      <Icon name="arrow" size={17} />
                    </button>
                  ))}
                </div>
              </section>
            </>
          )}
          {screen === "contigo" && (
            <>
              <div className="intro">
                <span className="tag">{s.contigoIntro[0]}</span>
                <h2>{s.contigoIntro[1]}</h2>
                <p>{s.contigoIntro[2]}</p>
              </div>
              <button className="home-turn" onClick={() => go("turn")}>
                <span className="round-icon">
                  <Icon name="clock" />
                </span>
                <span>
                  <strong>{s.titles.turn}</strong>
                  <span>{s.turnPeople(queueCount, queueWait)}</span>
                </span>
                <Icon name="arrow" />
              </button>
              {moduleCards}
            </>
          )}
          {screen === "call" && (
            <>
              <section className="call-card card">
                <span className={`round-icon ${callEnded ? "" : "live"}`}>
                  <Icon name="phone" size={26} />
                </span>
                <h2>{s.callTitle}</h2>
                <p>
                  {callEnded ? s.callEnded : s.inCall} · {callClock}
                </p>
              </section>
              <Notice text={s.callNotice} />
              <div className="chat-stack">
                {callLines.map((line, i) => (
                  <div
                    className={`bubble ${line.who === "patient" ? "patient" : "assistant"}`}
                    key={i}
                  >
                    <span className="speaker">{s.speakers[line.who]}</span>
                    <p>{line.text}</p>
                  </div>
                ))}
              </div>
              {handoffAt !== null && (
                <>
                  <section className="card summary-card call-summary">
                    <h3>{s.handoffSummary}</h3>
                    <p className="muted left">{s.handoffCount(handoffAt)}</p>
                    <dl>
                      {[...callSummary, s.handoffReason].map(
                        ([label, value]) => (
                          <div key={label}>
                            <dt>{label}</dt>
                            <dd>{value}</dd>
                          </div>
                        ),
                      )}
                    </dl>
                  </section>
                  <p className="muted">{s.handoffEnd}</p>
                </>
              )}
              {!callEnded ? (
                <>
                  <Button onClick={simulateReply}>
                    <Icon name="mic" size={20} />
                    {s.simulateReply}
                  </Button>
                  {callStep > 0 && (
                    <Button secondary onClick={() => setHandoffAt(callStep)}>
                      <Icon name="user" size={21} />
                      {s.passToPerson}
                    </Button>
                  )}
                </>
              ) : (
                <>
                  <button className="notification-card sms-card" onClick={startPre}>
                    <span className="round-icon">
                      <Icon name="chat" />
                    </span>
                    <span>
                      <strong>{s.smsTitle}</strong>
                      <span>
                        {s.sms} <u>{s.smsLink}</u>
                      </span>
                    </span>
                    <Icon name="arrow" size={20} />
                  </button>
                  <Button secondary onClick={() => openAppointment(0)}>
                    {s.viewInApp}
                  </Button>
                </>
              )}
            </>
          )}
          {screen === "settings" && (
            <>
              <Notice text={s.settingsNotice} />
              <section className="card settings-card">
                <h2>{s.languageSection[0]}</h2>
                <p>{s.languageSection[1]}</p>
                <div className="language-options">
                  {langs.map((l) => (
                    <button
                      className={`language-option ${lang === l ? "chosen" : ""}`}
                      key={l}
                      onClick={() => changeLang(l)}
                    >
                      <span className="language-code">{l}</span>
                      <strong lang={l.toLowerCase()}>{languageNames[l]}</strong>
                      <span className="radio">{lang === l && <i />}</span>
                    </button>
                  ))}
                </div>
              </section>
              <section className="card settings-card">
                <h2>{s.trustedTitle}</h2>
                <p>{s.trustedText}</p>
                {trusted !== null ? (
                  <>
                    <div className="trusted-person">
                      <span className="round-icon">
                        <Icon name="user" />
                      </span>
                      <strong>{s.relatives[trusted]}</strong>
                    </div>
                    {permissionKeys.map((key) => (
                      <Toggle
                        key={key}
                        label={s.permissions[key]}
                        checked={permissions[key]}
                        onChange={(on) =>
                          setPermissions((p) => ({ ...p, [key]: on }))
                        }
                      />
                    ))}
                    <Button
                      secondary
                      onClick={() => {
                        setTrusted(null)
                        setTrustedDraft(null)
                      }}
                    >
                      {s.removeTrusted}
                    </Button>
                  </>
                ) : (
                  <>
                    <RelativePicker
                      relatives={s.relatives}
                      value={trustedDraft}
                      onChange={setTrustedDraft}
                    />
                    <Button
                      disabled={trustedDraft === null}
                      onClick={() => setTrusted(trustedDraft)}
                    >
                      {s.addTrusted}
                    </Button>
                  </>
                )}
                <p className="muted left">{s.permissionsNote}</p>
              </section>
              <section className="card settings-card">
                <h2>{s.aiTitle}</h2>
                <Toggle
                  label={s.aiLabel}
                  description={s.aiDescription}
                  checked={aiConsent}
                  onChange={setAiConsent}
                />
              </section>
              <section className="card summary-card settings-card">
                <h2>{s.dataTitle}</h2>
                <dl>
                  {s.data.map(([label, value]) => (
                    <div key={label}>
                      <dt>{label}</dt>
                      <dd>{value}</dd>
                    </div>
                  ))}
                </dl>
                <p className="muted left">{s.dataNote}</p>
              </section>
              <p className="muted">{s.settingsNote}</p>
            </>
          )}
          {screen === "language" && (
            <>
              <Notice text={s.aiNotice} />
              <div className="intro">
                <h2>{s.preTitle}</h2>
                <p>{s.preIntro}</p>
              </div>
              <div className="context-line">
                <Icon name="calendar" size={20} />
                {s.preContext}
              </div>
              <h3>{s.assistantSpeaks(languageNames[lang])}</h3>
              <button className="text-button" onClick={() => go("settings")}>
                {s.changeLanguage}
              </button>
              <p className="muted">{s.summaryInEs}</p>
              <Button
                onClick={() => {
                  setAnswers([])
                  setDraft("")
                  go("pre")
                }}
              >
                {s.startPre}
                <Icon name="arrow" size={20} />
              </Button>
            </>
          )}
          {screen === "pre" && (
            <>
              <Notice text={s.aiNotice} />
              <div className="progress-heading">
                <span>
                  {answers.length === 5
                    ? s.progressDone
                    : s.progress(answers.length + 1)}
                </span>
                <span className="tag">{lang}</span>
              </div>
              <progress
                value={answers.length === 5 ? 5 : answers.length + 1}
                max="5"
                aria-label={s.progressLabel}
              />
              <div className="chat-stack">
                {s.questions
                  .slice(0, Math.min(answers.length + 1, 5))
                  .map((q, i) => (
                    <div className="chat-pair" key={i}>
                      <div className="bubble assistant">
                        <span className="speaker">{s.assistant} · {lang}</span>
                        <p>{q}</p>
                      </div>
                      {answers[i] && <div className="bubble patient">{answers[i]}</div>}
                    </div>
                  ))}
              </div>
              {answers.length < 5 ? (
                <>
                  <p className="muted">{s.exampleHint}</p>
                  <button
                    className="answer-suggestion"
                    onClick={() => addAnswer(s.exampleAnswers[answers.length])}
                  >
                    {s.exampleAnswers[answers.length]}
                    <Icon name="arrow" size={18} />
                  </button>
                  <form
                    className="message-input"
                    onSubmit={(e) => {
                      e.preventDefault()
                      addAnswer(draft)
                    }}
                  >
                    <input
                      aria-label={s.yourAnswer}
                      placeholder={s.answerPlaceholder}
                      value={draft}
                      onChange={(e) => setDraft(e.target.value)}
                    />
                    <button
                      type="button"
                      aria-label={s.dictate}
                      onClick={() => setDraft(s.exampleAnswers[answers.length])}
                    >
                      <Icon name="mic" size={21} />
                    </button>
                    <button
                      type="submit"
                      disabled={!draft.trim()}
                      aria-label={s.sendAnswer}
                    >
                      <Icon name="send" size={22} />
                    </button>
                  </form>
                </>
              ) : (
                <Button onClick={() => go("summary")}>
                  <Icon name="file" size={20} />
                  {s.reviewSummary}
                </Button>
              )}
            </>
          )}
          {screen === "summary" && (
            <>
              <Notice text={s.aiNotice} />
              <div className="intro">
                <h2>{s.reviewTitle}</h2>
                <p>{s.reviewText}</p>
              </div>
              <section className="card summary-card">
                <h3>{s.summaryHeading}</h3>
                <dl lang="es">
                  <div>
                    <dt>{ds.labels[0]}</dt>
                    <dd>{forDoctor(0)}</dd>
                  </div>
                  <div>
                    <dt>{ds.labels[1]}</dt>
                    <dd>{forDoctor(1)}</dd>
                  </div>
                  <div>
                    <dt>{ds.labels[2]}</dt>
                    <dd>
                      {forDoctor(2)} {forDoctor(3)}
                    </dd>
                  </div>
                  <div>
                    <dt>{ds.labels[3]}</dt>
                    <dd>{forDoctor(4)}</dd>
                  </div>
                  <div>
                    <dt>{ds.labels[4]}</dt>
                    <dd>{spanishNames[lang]}</dd>
                  </div>
                </dl>
              </section>
              <label className="field-label" htmlFor="summary-note">
                {s.addOrFix}
              </label>
              <textarea
                id="summary-note"
                value={extraSummary}
                onChange={(e) => setExtraSummary(e.target.value)}
                placeholder={s.notePlaceholder}
              />
              <p className="muted">{s.noTranslation}</p>
              <Button
                onClick={() => {
                  setPreSent(true)
                  go("preSent")
                }}
              >
                <Icon name="send" size={20} />
                {s.sendToDoctor}
              </Button>
              <Button secondary onClick={() => go("pre")}>
                {s.backToAnswers}
              </Button>
            </>
          )}
          {screen === "preSent" && (
            <>
              <Notice text={s.aiNotice} />
              <Success title={s.preSentTitle} text={s.preSentText} />
              <div className="card confirmation-info">
                <Icon name="file" />
                <span>
                  {s.preCompleted}
                  {extraSummary && s.withNote}.
                </span>
              </div>
              <Button
                onClick={() => {
                  setSelectedAppointment(0)
                  go("appointment")
                }}
              >
                {s.viewJourney}
              </Button>
              <Button secondary onClick={() => go("turn")}>
                {s.viewTurn}
              </Button>
              <p className="muted">{s.simulatedSend}</p>
            </>
          )}
          {screen === "turn" && (
            <>
              <div className="context-line">
                <Icon name="calendar" size={20} />
                {s.turnContext}
              </div>
              <section className="queue card">
                <span className="tag">{s.roomTag}</span>
                <div className="queue-number">
                  {called ? "0" : notification ? "2" : "3"}
                </div>
                <h2>{s.peopleAhead}</h2>
                <span className="queue-time">
                  <Icon name="clock" size={22} />
                  {queueWait}
                </span>
                <progress
                  max="100"
                  value={called ? 100 : notification ? 75 : 45}
                  aria-label={s.progressTurn}
                />
                <p>{s.hospital}</p>
              </section>
              {!notification ? (
                <>
                  <div className="notice">
                    <Icon name="bell" size={23} />
                    <span>
                      {s.notifyNotice[0]}
                      <br />
                      {s.notifyNotice[1]}
                    </span>
                  </div>
                  <Button secondary onClick={() => setNotification(true)}>
                    <Icon name="bell" size={20} />
                    {s.simulateAlert}
                  </Button>
                </>
              ) : (
                <button
                  className="notification-card"
                  onClick={() => {
                    setCalled(true)
                    go("consultation")
                  }}
                >
                  <span className="round-icon">
                    <Icon name="bell" />
                  </span>
                  <span>
                    <strong>{s.alertTitle}</strong>
                    <span>
                      {s.alertText[0]}
                      <br />
                      {s.alertText[1]}
                    </span>
                  </span>
                  <Icon name="arrow" size={20} />
                </button>
              )}
              <Button
                onClick={() => {
                  setConsent(false)
                  go("share")
                }}
              >
                <Icon name="share" size={21} />
                {shared ? s.shareAgain : s.shareWith}
              </Button>
              <p className="muted">{s.turnNote}</p>
            </>
          )}
          {screen === "consultation" && (
            <>
              <Success title={s.consultationTitle} text={s.consultationText} />
              <div className="card consultation-card">
                <Icon name="calendar" size={28} />
                <h3>{s.hospital}</h3>
                <p>{s.patient} · {s.room("2.14")}</p>
                <span className="tag">{s.yourTurn}</span>
              </div>
              <Button onClick={() => go("translate")}>
                <Icon name="translate" size={21} />
                {s.openTranslator}
              </Button>
              <Button
                secondary
                onClick={() => {
                  setSelectedAppointment(0)
                  go("appointment")
                }}
              >
                {s.viewMyAppointment}
              </Button>
              <p className="muted">{s.consultationNote}</p>
            </>
          )}
          {screen === "share" && (
            <>
              <div className="intro">
                <h2>{s.shareTitle}</h2>
                <p>{s.shareText}</p>
              </div>
              <h3>{s.linkedRelatives}</h3>
              <RelativePicker
                relatives={s.relatives}
                value={relative}
                onChange={setRelative}
              />
              <Notice text={s.shareNotice} />
              <label className="consent">
                <input
                  type="checkbox"
                  checked={consent}
                  onChange={(e) => setConsent(e.target.checked)}
                />
                <span>{s.shareConsent}</span>
              </label>
              <Button
                disabled={relative === null || !consent}
                onClick={() => {
                  setShared(true)
                  go("shareSent")
                }}
              >
                {s.confirmShare}
              </Button>
              <p className="muted">{s.shareNote}</p>
            </>
          )}
          {screen === "shareSent" && (
            <>
              <Success
                title={s.sharedTitle}
                text={s.sharedText(relativeName(relative ?? 0))}
              />
              <div className="card confirmation-info">
                <Icon name="share" />
                <span>
                  {s.sharedInfo[0]}
                  <br />
                  {s.sharedInfo[1]}
                </span>
              </div>
              <Button onClick={() => go("turn")}>{s.backToTurn}</Button>
              <Button
                secondary
                onClick={() => {
                  setShared(false)
                  setConsent(false)
                  go("turn")
                }}
              >
                {s.stopSharing}
              </Button>
              <p className="muted">{s.sharedNote}</p>
            </>
          )}
          {screen === "translate" && (
            <>
              <div className="translator-selectors">
                <label>
                  {s.doctorLanguage}
                  {languageSelect(fromLang, (l) => {
                    setFromLang(l)
                    if (l === toLang) setToLang(fromLang)
                  })}
                </label>
                <button
                  className="swap-button"
                  aria-label={s.swapLanguages}
                  onClick={() => {
                    setFromLang(toLang)
                    setToLang(fromLang)
                  }}
                >
                  <Icon name="translate" />
                </button>
                <label>
                  {s.yourLanguage}
                  {languageSelect(toLang, (l) => {
                    setToLang(l)
                    if (l === fromLang) setFromLang(toLang)
                  })}
                </label>
              </div>
              <p className="muted">{s.translationHint}</p>
              <div className="translation-bubble doctor">
                <span className="speaker">{s.doctorLabel} · {fromLang}</span>
                <p lang={fromLang.toLowerCase()}>
                  {translation[fromLang].doctor}
                </p>
                <div className="translation-divider" />
                <p className="translated" lang={toLang.toLowerCase()}>
                  {translation[toLang].doctor}
                </p>
              </div>
              <div className="translation-bubble patient-translation">
                <span className="speaker">{s.patientShort} · {toLang}</span>
                <p lang={toLang.toLowerCase()}>{translation[toLang].patient}</p>
                <div className="translation-divider" />
                <p className="translated" lang={fromLang.toLowerCase()}>
                  {translation[fromLang].patient}
                </p>
              </div>
              <div className="listening-area">
                <button
                  className={`big-mic ${listening ? "active" : ""}`}
                  aria-label={listening ? s.micPause : s.micStart}
                  onClick={() => setListening(!listening)}
                >
                  <Icon name="mic" size={30} />
                </button>
                <strong>{listening ? s.listening : s.tapToSpeak}</strong>
                <span>{listening ? s.listeningNote : s.micDemo}</span>
              </div>
              <Button secondary onClick={() => go("interpreter")}>
                <Icon name="user" size={21} />
                {s.requestInterpreter}
              </Button>
              <p className="muted">{s.mtWarning}</p>
            </>
          )}
          {screen === "interpreter" && (
            <>
              <Success
                title={s.interpreterTitle}
                text={s.interpreterText(languageNames[fromLang], languageNames[toLang])}
              />
              <div className="notice">
                <Icon name="user" />
                <span>{s.interpreterNotice}</span>
              </div>
              <Button onClick={() => go("translate")}>
                {s.backToTranslator}
              </Button>
              <p className="muted">{s.interpreterNote}</p>
            </>
          )}
          {screen === "reports" && (
            <>
              <div className="intro compact">
                <p>{s.reportsIntro}</p>
              </div>
              <div className="report-list">
                {s.reportList.map((r, i) => (
                  <button
                    className="report-list-card card"
                    key={i}
                    onClick={() => {
                      setSelectedReport(i)
                      setOpenParameter(0)
                      go("report")
                    }}
                  >
                    <div className="report-card-top">
                      <span className="round-icon">
                        <Icon name="file" />
                      </span>
                      <span>{r.date}</span>
                      <Icon name="arrow" size={20} />
                    </div>
                    <h2>{r.title}</h2>
                    <p>
                      {r.type} · {r.appointment}
                    </p>
                    <p>{r.intro}</p>
                    <span className="available">
                      <Icon name="check" size={17} />
                      {s.explanationAvailable}
                    </span>
                  </button>
                ))}
              </div>
            </>
          )}
          {screen === "report" && (
            <>
              <section className="report-intro">
                <span className="overline">{report.date} · {s.patient.toUpperCase()}</span>
                <h2>{report.title}</h2>
                <p>{report.appointment} · {s.hospital}</p>
              </section>
              <div className="reviewed">
                <Icon name="shield" size={22} />
                <strong>{s.reviewedByDoctor}</strong>
              </div>
              <p className="muted left">{s.tapBlock}</p>
              {(selectedReport === 0
                ? s.parameters.map((p) => ({
                    key: p.name,
                    head: (
                      <>
                        <strong>{p.name}</strong>
                        <span className="parameter-value">{p.value}</span>
                        <span className={`result-badge ${p.normal ? "normal" : ""}`}>
                          {p.normal ? s.normal : s.outOfRange}
                        </span>
                      </>
                    ),
                    body: explanation(p.range, p.meaning, p.advice),
                  }))
                : s.findings.map((p) => ({
                    key: p.title,
                    head: (
                      <>
                        <strong>{p.title}</strong>
                        <span className="muted">{p.status}</span>
                      </>
                    ),
                    body: explanation("", p.meaning, p.advice),
                  }))
              ).map((p, i) => (
                <section className="parameter card" key={p.key}>
                  <button
                    className="parameter-toggle"
                    aria-expanded={openParameter === i}
                    onClick={() => setOpenParameter(openParameter === i ? null : i)}
                  >
                    <span>{p.head}</span>
                    <span
                      className={openParameter === i ? "chevron expanded" : "chevron"}
                    >
                      <Icon name="arrow" size={21} />
                    </span>
                  </button>
                  {openParameter === i && p.body}
                </section>
              ))}
              <Button
                onClick={() => {
                  setDoubt("")
                  go("question")
                }}
              >
                <Icon name="chat" size={21} />
                {s.haveDoubt}
              </Button>
              <p className="muted">{s.reportNote}</p>
            </>
          )}
          {screen === "question" && (
            <>
              <div className="intro">
                <h2>{s.doubtTitle}</h2>
                <p>{s.doubtText}</p>
              </div>
              <div className="context-line">
                <Icon name="file" size={21} />
                {report.title} · {report.date}
              </div>
              <form
                onSubmit={(e) => {
                  e.preventDefault()
                  if (doubt.trim()) go("questionSent")
                }}
              >
                <label className="field-label" htmlFor="doubt">
                  {s.doubtLabel}
                </label>
                <textarea
                  id="doubt"
                  required
                  maxLength={1000}
                  value={doubt}
                  onChange={(e) => setDoubt(e.target.value)}
                  placeholder={s.doubtPlaceholder}
                  rows={5}
                />
                <p className="muted left">{s.doubtRouting(report.appointment)}</p>
                <Notice text={s.urgencyNotice} />
                <button
                  type="submit"
                  className="button"
                  disabled={!doubt.trim()}
                >
                  {s.sendToConsultation}
                  <Icon name="send" size={20} />
                </button>
              </form>
            </>
          )}
          {screen === "questionSent" && (
            <>
              <Success
                title={s.doubtSentTitle}
                text={s.doubtSentText(report.title, report.appointment)}
              />
              <div className="card confirmation-info">
                <Icon name="chat" />
                <span>{doubt}</span>
              </div>
              <p className="muted">{s.doubtSentNote}</p>
              <Button onClick={() => go("report")}>{s.backToReport}</Button>
              <Button secondary onClick={() => root("reports")}>
                {s.viewAllReports}
              </Button>
            </>
          )}
          {screen === "human" && (
            <>
              <div className="intro">
                <h2>{s.humanTitle}</h2>
                <p>{s.humanText}</p>
              </div>
              <div className="card human-card">
                <span className="round-icon">
                  <Icon name="user" size={28} />
                </span>
                <h3>{s.patientCare}</h3>
                <p>{s.hospital}</p>
                {!humanRequested ? (
                  <Button onClick={() => setHumanRequested(true)}>
                    {s.requestContact}
                  </Button>
                ) : (
                  <div className="notice">
                    <Icon name="check" />
                    <span>{s.humanRequested}</span>
                  </div>
                )}
              </div>
              <p className="muted">{s.emergency}</p>
            </>
          )}
          {footer && (
            <button
              className="human-button"
              onClick={() => {
                setHumanRequested(false)
                go("human")
              }}
            >
              <Icon name="chat" size={21} />
              <span>{s.talkToPerson}</span>
              <Icon name="arrow" size={18} />
            </button>
          )}
          <p className="prototype-note">{s.prototypeNote}</p>
        </main>
        <nav className="bottom-nav" aria-label={s.mainNav}>
          {navItems.map((item) => (
            <button
              key={item.key}
              onClick={() => root(item.target)}
              className={`${item.key === activeNav ? "nav-active" : ""} ${
                item.key === "contigo" ? "contigo-nav" : ""
              }`}
              aria-current={item.key === activeNav ? "page" : undefined}
            >
              <span className="nav-icon">
                <Icon name={item.icon} size={25} />
              </span>
              <span>{s.nav[item.key]}</span>
            </button>
          ))}
        </nav>
        <div className="home-indicator">
          <span />
        </div>
      </div>
    </div>
  )
}
