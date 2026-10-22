import { useEffect, useRef, useState, type ReactNode } from "react"
import { Icon } from "./Icon"

type Screen = "home" | "appointments" | "appointment" | "contigo" | "call" | "settings" | "language" | "pre" | "summary" | "preSent" | "turn" | "consultation" | "share" | "shareSent" | "translate" | "interpreter" | "reports" | "report" | "question" | "questionSent" | "human"
type Lang = "ES" | "EN" | "DE"
const languages: Record<Lang, string> = {
  ES: "Español",
  EN: "Inglés",
  DE: "Alemán",
}
const appointments = [
  {
    id: 0,
    name: "Traumatología",
    day: 19,
    time: "11:30",
    doctor: "Dra. Elena Martín",
    room: "2.14",
    past: false,
  },
  {
    id: 1,
    name: "Cardiología",
    day: 22,
    time: "09:15",
    doctor: "Dr. Pablo Ruiz",
    room: "1.08",
    past: false,
  },
  {
    id: 2,
    name: "Dermatología",
    day: 28,
    time: "16:00",
    doctor: "Dra. Lucía Torres",
    room: "3.02",
    past: false,
  },
  {
    id: 3,
    name: "Medicina general",
    day: 12,
    time: "10:00",
    doctor: "Dr. Javier Santos",
    room: "1.05",
    past: true,
  },
  {
    id: 4,
    name: "Traumatología",
    day: 7,
    time: "11:30",
    doctor: "Dra. Elena Martín",
    room: "2.14",
    past: true,
  },
]
const questions: Record<Lang, string[]> = {
  ES: [
    "¿Qué te ocurre y desde cuándo?",
    "¿Has tenido alguna caída?",
    "¿Qué intensidad tiene el dolor?",
    "¿Cuándo empeora el dolor?",
    "¿Hay algo más que quieras comentar?",
  ],
  EN: [
    "What is bothering you and for how long?",
    "Have you had a fall?",
    "How severe is the pain?",
    "When does the pain get worse?",
    "Is there anything else you would like to add?",
  ],
  DE: [
    "Was fehlt Ihnen und seit wann?",
    "Hatten Sie einen Sturz?",
    "Wie stark sind die Schmerzen?",
    "Wann werden die Schmerzen schlimmer?",
    "Möchten Sie noch etwas hinzufügen?",
  ],
}
const exampleAnswers: Record<Lang, string[]> = {
  ES: [
    "Me duele la rodilla derecha desde hace dos semanas",
    "No",
    "Moderado, 5 de 10",
    "Al caminar y por la noche",
    "No, nada más",
  ],
  EN: [
    "My right knee has hurt for two weeks",
    "No",
    "Moderate, 5 out of 10",
    "When walking and at night",
    "No, nothing else",
  ],
  DE: [
    "Mein rechtes Knie tut seit zwei Wochen weh",
    "Nein",
    "Mäßig, 5 von 10",
    "Beim Gehen und nachts",
    "Nein, sonst nichts",
  ],
}
type Speaker = "ia" | "patient" | "agent"
const speakers: Record<Speaker, string> = {
  ia: "ASISTENTE DE CITAS · IA",
  patient: "ANA",
  agent: "LAURA · EQUIPO DE CITAS",
}
type CallLine = { who: Speaker, text: string }
// Each "Simular respuesta" reveals the next turn; the summary fields of the
// turns reached so far are what the agent receives on handoff.
const callTurns: { lines: CallLine[], summary?: [string, string][] }[] = [
  {
    lines: [
      {
        who: "ia",
        text: "Hola, has llamado a Hospiten. Soy el asistente virtual de citas: puedo pedir, cambiar o anular una cita. Si prefieres hablar con una persona, dilo en cualquier momento.",
      },
    ],
  },
  {
    lines: [
      { who: "patient", text: "Quiero pedir cita en Traumatología." },
      { who: "ia", text: "De acuerdo. ¿Me dices tu nombre completo y tu fecha de nacimiento?" },
    ],
    summary: [["Gestión", "Pedir cita · Traumatología"]],
  },
  {
    lines: [
      { who: "patient", text: "Ana López, 3 de marzo de 1985." },
      { who: "ia", text: "Gracias, Ana. ¿Cuál es el motivo de la consulta?" },
    ],
    summary: [["Paciente", "Ana López · 03/03/1985"]],
  },
  {
    lines: [
      { who: "patient", text: "Me duele la rodilla derecha desde hace dos semanas." },
      { who: "ia", text: "Anotado. ¿Prefieres mañana o tarde, y en qué hospital?" },
    ],
    summary: [["Motivo indicado", "Dolor de rodilla derecha, desde hace dos semanas"]],
  },
  {
    lines: [
      { who: "patient", text: "Por la mañana, en Estepona." },
      {
        who: "ia",
        text: "Tengo hueco el lunes 19 de mayo a las 11:30 con la Dra. Elena Martín, en Hospiten Estepona. ¿Te viene bien?",
      },
    ],
    summary: [
      ["Preferencia", "Mañanas · Hospiten Estepona"],
      ["Estado", "Hueco ofrecido: lun 19 mayo, 11:30 · sin confirmar"],
    ],
  },
  {
    lines: [
      { who: "patient", text: "Sí, perfecto. ¿Crees que es grave?" },
      {
        who: "ia",
        text: "No puedo darte información clínica; la doctora te lo explicará en la consulta. Tu cita queda confirmada: lunes 19 de mayo, 11:30. Te envío un SMS con la confirmación y un enlace para preparar tu consulta.",
      },
    ],
    summary: [
      ["Estado", "Cita confirmada: lun 19 mayo, 11:30 · SMS enviado"],
      ["Nota", "Preguntó si es grave; no se dio información clínica"],
    ],
  },
  {
    lines: [
      { who: "patient", text: "Vale, muchas gracias." },
      { who: "ia", text: "A ti, Ana. ¡Que te mejores!" },
    ],
  },
]
const handoffLines: CallLine[] = [
  { who: "patient", text: "Prefiero hablar con una persona." },
  {
    who: "ia",
    text: "Claro. Te paso con el equipo de citas y le envío el resumen de la llamada para que no tengas que repetir nada.",
  },
  {
    who: "agent",
    text: "Hola, soy Laura, del equipo de citas. Ya tengo tu resumen, así que seguimos desde donde lo dejaste.",
  },
]
const relatives = ["Carlos López · Hermano", "Marta López · Madre"]
const permissionLabels = {
  reports: "Informes y diagnósticos",
  appointments: "Citas",
  turn: "Turno en vivo",
}
const parameters = [
  {
    name: "Colesterol LDL",
    value: "162 mg/dL",
    range: "Referencia ilustrativa: menos de 100 mg/dL",
    normal: false,
    meaning:
      "El LDL transporta colesterol. Un valor elevado puede favorecer su acumulación en las arterias. El objetivo depende de tu riesgo cardiovascular.",
    advice:
      "Se suelen revisar la alimentación, la actividad física y otros factores de riesgo. Tu médico decidirá si necesitas tratamiento.",
  },
  {
    name: "Glucosa",
    value: "92 mg/dL",
    range: "Referencia ilustrativa en ayunas: 70–99 mg/dL",
    normal: true,
    meaning:
      "La glucosa es una fuente de energía. Este resultado está dentro del intervalo de referencia ilustrativo en ayunas.",
    advice:
      "Se suelen mantener hábitos saludables y los controles indicados por tu médico. Se interpreta junto con tu historia clínica.",
  },
  {
    name: "Hemoglobina",
    value: "13,5 g/dL",
    range: "Referencia ilustrativa: 12–16 g/dL",
    normal: true,
    meaning:
      "La hemoglobina ayuda a transportar oxígeno por la sangre. Este valor está dentro del intervalo de referencia ilustrativo.",
    advice:
      "Se suele valorar junto con el resto del hemograma y los síntomas. Tu médico indicará si hace falta seguimiento.",
  },
]
const reportList = [
  {
    title: "Análisis de sangre",
    date: "12 mayo 2025",
    type: "Laboratorio",
    appointment: "Medicina general",
    intro: "Perfil lipídico, glucosa y hemograma",
  },
  {
    title: "Informe de alta",
    date: "7 mayo 2025",
    type: "Alta de consulta",
    appointment: "Traumatología",
    intro: "Valoración y recomendaciones de seguimiento",
  },
]
// Screens not listed under any section belong to "Contigo".
const navItems: { title: string, icon: string, target: Screen, screens: Screen[] }[] = [
  { title: "Inicio", icon: "home", target: "home", screens: ["home"] },
  { title: "Citas", icon: "calendar", target: "appointments", screens: ["appointments", "appointment"] },
  { title: "Contigo", icon: "heart", target: "contigo", screens: [] },
  { title: "Informes", icon: "file", target: "reports", screens: ["reports", "report", "question", "questionSent"] },
  { title: "Ajustes", icon: "settings", target: "settings", screens: ["settings"] },
]
const titles: Record<Screen, string> = {
  home: "Inicio",
  appointments: "Mis citas",
  appointment: "Detalle de la cita",
  contigo: "Hospiten Contigo",
  call: "Asistente de citas",
  settings: "Ajustes y privacidad",
  language: "Pre-consulta",
  pre: "Pre-consulta",
  summary: "Revisar resumen",
  preSent: "Resumen enviado",
  turn: "Mi turno",
  consultation: "Tu consulta",
  share: "Compartir mi turno",
  shareSent: "Turno compartido",
  translate: "Traductor",
  interpreter: "Intérprete solicitado",
  reports: "Mis informes",
  report: "Informe explicado",
  question: "Tengo una duda",
  questionSent: "Duda enviada",
  human: "Atención personal",
}
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
function IA() {
  return (
    <div className="notice">
      <Icon name="shield" size={21} />
      <span>Asistente de IA. No realiza diagnósticos.</span>
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
  value,
  onChange,
}: {
  value: string
  onChange: (relative: string) => void
}) {
  return (
    <div className="language-options">
      {relatives.map((r) => (
        <button
          className={`language-option ${value === r ? "chosen" : ""}`}
          key={r}
          onClick={() => onChange(r)}
        >
          <span className="round-icon">
            <Icon name="user" />
          </span>
          <strong>{r}</strong>
          <span className="radio">{value === r && <i />}</span>
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
  const [lang, setLang] = useState<Lang>("DE")
  const [answers, setAnswers] = useState<string[]>([])
  const [draft, setDraft] = useState("")
  const [preSent, setPreSent] = useState(false)
  const [extraSummary, setExtraSummary] = useState("")
  const [notification, setNotification] = useState(false)
  const [called, setCalled] = useState(false)
  const [relative, setRelative] = useState("")
  const [consent, setConsent] = useState(false)
  const [shared, setShared] = useState(false)
  const [fromLang, setFromLang] = useState<Lang>("ES")
  const [toLang, setToLang] = useState<Lang>("EN")
  const [listening, setListening] = useState(false)
  const [selectedReport, setSelectedReport] = useState(0)
  const [openParameter, setOpenParameter] = useState<number | null>(0)
  const [doubt, setDoubt] = useState("")
  const [humanRequested, setHumanRequested] = useState(false)
  const [callStep, setCallStep] = useState(0)
  const [handoffAt, setHandoffAt] = useState<number | null>(null)
  const [callSeconds, setCallSeconds] = useState(0)
  const [trustedDraft, setTrustedDraft] = useState("")
  const [trusted, setTrusted] = useState("")
  const [permissions, setPermissions] = useState({
    reports: true,
    appointments: false,
    turn: false,
  })
  const [aiConsent, setAiConsent] = useState(false)
  const appointment = appointments[selectedAppointment]
  const report = reportList[selectedReport]
  const activeNav =
    navItems.find((n) => n.screens.includes(screen))?.title ?? "Contigo"
  const queueCount = called ? 0 : notification ? 2 : 3
  const queueWait = called ? "Es tu turno" : notification ? "≈10 min" : "≈15 min"
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
    setSelectedReport(appointment.name === "Traumatología" ? 1 : 0)
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
  const reachedTurns = callTurns.slice(0, (handoffAt ?? callStep) + 1)
  const callLines = [
    ...reachedTurns.flatMap((t) => t.lines),
    ...(handoffAt === null ? [] : handoffLines),
  ]
  // Later turns overwrite earlier fields with the same label (e.g. "Estado").
  const callSummary = [...new Map(reachedTurns.flatMap((t) => t.summary ?? []))]
  const callEnded = handoffAt !== null || callStep === callTurns.length - 1
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
  const monthLabel = new Date(2025, month, 1).toLocaleDateString("es-ES", {
    month: "long",
    year: "numeric",
  })
  const footer = !["home", "human", "call", "settings", "language", "pre", "summary", "preSent", "report"].includes(screen)
  const answerText = (i: number) => answers[i] || "No indicado"
  const moduleCards = (
    <div className="module-list">
      {[
        {
          title: "Asistente de citas",
          copy: "Pide, cambia o anula tu cita por teléfono",
          icon: "phone",
          action: startCall,
        },
        {
          title: "Pre-consulta",
          copy: preSent
            ? "Resumen enviado a tu médico"
            : "Prepara tu próxima visita",
          icon: "chat",
          action: startPre,
        },
        {
          title: "Traductor",
          copy: "Habla y entiende, en tu idioma",
          icon: "translate",
          action: () => go("translate"),
        },
        {
          title: "Mis informes",
          copy: "Tu información médica, más clara",
          icon: "file",
          action: () => go("reports"),
        },
      ].map((m) => (
        <button className="module-card" key={m.title} onClick={m.action}>
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
  const journey = [
    {
      label: "Cita",
      description:
        appointment.id === 0
          ? "Confirmada por teléfono · SMS recibido"
          : "Confirmada",
      state: "Hecho",
      action: startCall,
      disabled: appointment.id !== 0,
    },
    {
      label: "Pre-consulta",
      description: preSent ? "Resumen enviado" : "Preparar mi visita",
      state: appointment.past || preSent ? "Hecho" : "Pendiente",
      action: startPre,
      disabled: appointment.id !== 0,
    },
    {
      label: "Turno",
      description:
        appointment.id === 0
          ? called
            ? "Turno completado"
            : notification
              ? "2 delante · ≈10 min"
              : "3 delante · ≈15 min"
          : "Disponible el día de tu cita",
      state:
        appointment.past || (called && appointment.id === 0)
          ? "Hecho"
          : appointment.id === 0
            ? "Ahora"
            : "Pendiente",
      action: () => go("turn"),
      disabled: appointment.id !== 0,
    },
    {
      label: "Consulta",
      description: appointment.past
        ? "Consulta realizada"
        : `${appointment.time} · Consulta ${appointment.room}`,
      state: appointment.past
        ? "Hecho"
        : called && appointment.id === 0
          ? "Ahora"
          : "Pendiente",
      action: () => go("consultation"),
      disabled: appointment.id !== 0 || !called,
    },
    {
      label: "Informe",
      description: appointment.past
        ? "Explicación disponible"
        : "Después de tu consulta",
      state: appointment.past ? "Hecho" : "Pendiente",
      action: openAppointmentReport,
      disabled: !appointment.past,
    },
  ]
  const translation = {
    ES: {
      doctor: "¿Desde cuándo tiene el dolor?",
      patient: "Desde hace dos semanas. Empeora por la noche.",
    },
    EN: {
      doctor: "How long have you had the pain?",
      patient: "For two weeks. It gets worse at night.",
    },
    DE: {
      doctor: "Seit wann haben Sie die Schmerzen?",
      patient: "Seit zwei Wochen. Nachts wird es schlimmer.",
    },
  }
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
        <p className="disclaimer">
          Prototipo conceptual · Hackathon Talento Canario 2026 · No es una app
          oficial de Hospiten
        </p>
        <header className="brand-header">
          <img src={`${import.meta.env.BASE_URL}hospiten-logo.png`} alt="Hospiten" />
          <button
            className="avatar"
            onClick={() => root("settings")}
            aria-label="Ajustes y privacidad"
          >
            AL
          </button>
        </header>
        {screen !== "home" && (
          <div className="page-heading">
            <button aria-label="Volver" onClick={back}>
              <Icon name="back" />
            </button>
            <h1>{titles[screen]}</h1>
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
                <p>Buenos días,</p>
                <h1>Ana</h1>
                <span>Lunes, 19 de mayo</span>
              </div>
              <section className="next-appointment card">
                <span className="round-icon">
                  <Icon name="calendar" size={25} />
                </span>
                <span className="overline">TU PRÓXIMA CITA · HOY</span>
                <h2>Traumatología</h2>
                <p className="appointment-time">
                  11:30 <span>· Consulta 2.14</span>
                </p>
                <p>Dra. Elena Martín · Hospiten Estepona</p>
                <Button onClick={() => openAppointment(0)}>
                  VER MI CITA
                  <Icon name="arrow" size={20} />
                </Button>
              </section>
              <button className="home-turn" onClick={() => go("turn")}>
                <span className="round-icon">
                  <Icon name="clock" />
                </span>
                <span>
                  <strong>Mi turno · {queueCount} delante</strong>
                  <span>{called ? "Pasa a la consulta 2.14" : `Tiempo estimado: ${queueWait}`}</span>
                </span>
                <Icon name="arrow" size={22} />
              </button>
              <section className="contigo-section card">
                <div className="section-heading">
                  <Icon name="heart" size={25} />
                  <h2>Hospiten Contigo</h2>
                  <span className="tag">Nuevo</span>
                </div>
                <p>Te acompañamos en cada paso.</p>
                {moduleCards}
              </section>
            </>
          )}
          {screen === "appointments" && (
            <>
              <section className="calendar card">
                <div className="calendar-heading">
                  <button
                    aria-label="Mes anterior"
                    onClick={() => {
                      setMonth((m) => m - 1)
                      setSelectedDay(null)
                    }}
                  >
                    <Icon name="back" size={20} />
                  </button>
                  <h2>{monthLabel}</h2>
                  <button
                    aria-label="Mes siguiente"
                    onClick={() => {
                      setMonth((m) => m + 1)
                      setSelectedDay(null)
                    }}
                  >
                    <Icon name="arrow" size={20} />
                  </button>
                </div>
                <div className="calendar-grid">
                  {["L", "M", "X", "J", "V", "S", "D"].map((d, i) => (
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
                        aria-label={`${day} ${monthLabel}${
                          marked ? ", con cita" : ""
                        }`}
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
                  Día con cita <span>Hoy: 19 de mayo</span>
                </p>
              </section>
              <div
                className="tabs"
                role="tablist"
                aria-label="Estado de las citas"
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
                  Próximas <span>3</span>
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
                  Pasadas <span>2</span>
                </button>
              </div>
              {selectedDay && (
                <button
                  className="text-button"
                  onClick={() => setSelectedDay(null)}
                >
                  Ver todas las citas · Quitar filtro
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
                        <span>MAY</span>
                      </span>
                      <span className="appointment-copy">
                        <strong>{a.name}</strong>
                        <span>
                          {a.day === 19 ? "Hoy" : `${a.day} mayo`} · {a.time}
                        </span>
                        <span>
                          {a.past ? "Realizada" : "Confirmada"} · Presencial
                        </span>
                      </span>
                      <Icon name="arrow" size={20} />
                    </button>
                  ))
                ) : (
                  <div className="empty-state card">
                    <Icon name="calendar" size={30} />
                    <h2>Sin citas este día</h2>
                    <p>Puedes seleccionar otro día o ver todas tus citas.</p>
                    <Button secondary onClick={() => setSelectedDay(null)}>
                      Ver todas
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
                  {appointment.past ? "Realizada" : "Confirmada"}
                </span>
                <h2>{appointment.name}</h2>
                <p className="appointment-time">
                  {appointment.day === 19
                    ? "Hoy"
                    : `${appointment.day} mayo 2025`}{" "}
                  · {appointment.time}
                </p>
                <div className="detail-row">
                  <Icon name="user" />
                  <div>
                    <strong>{appointment.doctor}</strong>
                    <span>
                      Especialista en {appointment.name.toLowerCase()}
                    </span>
                  </div>
                </div>
                <div className="detail-row">
                  <Icon name="calendar" />
                  <div>
                    <strong>Hospiten Estepona</strong>
                    <span>Consulta {appointment.room} · Presencial</span>
                  </div>
                </div>
                <p className="patient-line">Paciente: Ana López</p>
              </section>
              <section className="journey">
                <h2>Tu recorrido de atención</h2>
                <p>Todo lo que necesitas, paso a paso.</p>
                <div className="journey-list">
                  {journey.map((step, i) => (
                    <button
                      className="journey-step"
                      key={step.label}
                      onClick={step.action}
                      disabled={step.disabled}
                    >
                      <span
                        className={`step-number ${step.state.toLowerCase()}`}
                      >
                        {step.state === "Hecho" ? (
                          <Icon name="check" size={20} />
                        ) : (
                          i + 1
                        )}
                      </span>
                      <span className="step-copy">
                        <span>
                          <strong>{step.label}</strong>
                          <span
                            className={`step-state ${step.state.toLowerCase()}`}
                          >
                            {step.state}
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
                <span className="tag">NUEVO EN HOSPITEN</span>
                <h2>Más cerca de ti.</h2>
                <p>Antes, durante y después de tu consulta.</p>
              </div>
              <button className="home-turn" onClick={() => go("turn")}>
                <span className="round-icon">
                  <Icon name="clock" />
                </span>
                <span>
                  <strong>Mi turno</strong>
                  <span>{queueCount} personas delante · {queueWait}</span>
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
                <h2>Hospiten · Citas</h2>
                <p>
                  {callEnded ? "Llamada finalizada" : "En llamada"} · {callClock}
                </p>
              </section>
              <div className="notice">
                <Icon name="shield" size={21} />
                <span>
                  Llamada simulada. El asistente gestiona citas y no da
                  información clínica.
                </span>
              </div>
              <div className="chat-stack">
                {callLines.map((line, i) => (
                  <div
                    className={`bubble ${line.who === "patient" ? "patient" : "assistant"}`}
                    key={i}
                  >
                    <span className="speaker">{speakers[line.who]}</span>
                    <p>{line.text}</p>
                  </div>
                ))}
              </div>
              {handoffAt !== null && (
                <>
                  <section className="card summary-card call-summary">
                    <h3>Resumen que recibe Laura</h3>
                    <p className="muted left">
                      Generado con tus {handoffAt}{" "}
                      {handoffAt === 1 ? "respuesta" : "respuestas"} al asistente.
                    </p>
                    <dl>
                      {[...callSummary, ["Motivo del traspaso", "Lo pide la paciente"]].map(
                        ([label, value]) => (
                          <div key={label}>
                            <dt>{label}</dt>
                            <dd>{value}</dd>
                          </div>
                        ),
                      )}
                    </dl>
                  </section>
                  <p className="muted">
                    Fin de la simulación: Laura completa la gestión y la cita
                    confirmada llega a la app y por SMS.
                  </p>
                </>
              )}
              {!callEnded ? (
                <>
                  <Button onClick={simulateReply}>
                    <Icon name="mic" size={20} />
                    SIMULAR RESPUESTA
                  </Button>
                  {callStep > 0 && (
                    <Button secondary onClick={() => setHandoffAt(callStep)}>
                      <Icon name="user" size={21} />
                      Pasar con una persona
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
                      <strong>SMS · Hospiten</strong>
                      <span>
                        Cita confirmada: Traumatología, lun 19 may, 11:30, Dra.
                        Elena Martín. Prepara tu consulta:{" "}
                        <u>enlace a la pre-consulta</u>
                      </span>
                    </span>
                    <Icon name="arrow" size={20} />
                  </button>
                  <Button secondary onClick={() => openAppointment(0)}>
                    Ver la cita en la app
                  </Button>
                </>
              )}
            </>
          )}
          {screen === "settings" && (
            <>
              <div className="notice">
                <Icon name="shield" size={21} />
                <span>
                  Tus datos de salud solo se usan para atenderte. Tú decides
                  qué compartes y con quién, y puedes cambiarlo cuando quieras.
                </span>
              </div>
              <section className="card settings-card">
                <h2>Persona de confianza</h2>
                <p>
                  Alguien que puede ver tus diagnósticos e informes y ayudarte a
                  gestionar tu atención. Pensado sobre todo para personas
                  mayores: lo decides tú.
                </p>
                {trusted ? (
                  <>
                    <div className="trusted-person">
                      <span className="round-icon">
                        <Icon name="user" />
                      </span>
                      <strong>{trusted}</strong>
                    </div>
                    {(Object.keys(permissionLabels) as (keyof typeof permissionLabels)[]).map(
                      (key) => (
                        <Toggle
                          key={key}
                          label={permissionLabels[key]}
                          checked={permissions[key]}
                          onChange={(on) =>
                            setPermissions((p) => ({ ...p, [key]: on }))
                          }
                        />
                      ),
                    )}
                    <Button
                      secondary
                      onClick={() => {
                        setTrusted("")
                        setTrustedDraft("")
                      }}
                    >
                      Quitar persona de confianza
                    </Button>
                  </>
                ) : (
                  <>
                    <RelativePicker value={trustedDraft} onChange={setTrustedDraft} />
                    <Button
                      disabled={!trustedDraft}
                      onClick={() => setTrusted(trustedDraft)}
                    >
                      AÑADIR PERSONA DE CONFIANZA
                    </Button>
                  </>
                )}
                <p className="muted left">
                  Cada permiso se da por separado y se puede retirar en
                  cualquier momento. Menores de 14 años: la cuenta la gestiona
                  su tutor. De 14 a 17 años decide el propio menor.
                </p>
              </section>
              <section className="card settings-card">
                <h2>Mejora de la IA</h2>
                <Toggle
                  label="Usar mis datos seudonimizados para mejorar la IA"
                  description="Opcional y desactivado por defecto. No afecta a tu atención y puedes retirarlo cuando quieras."
                  checked={aiConsent}
                  onChange={setAiConsent}
                />
              </section>
              <section className="card summary-card settings-card">
                <h2>Protección de datos</h2>
                <dl>
                  <div>
                    <dt>Responsable</dt>
                    <dd>El hospital Hospiten que te atiende.</dd>
                  </div>
                  <div>
                    <dt>Finalidad</dt>
                    <dd>Gestionar tu atención sanitaria y la comunicación contigo.</dd>
                  </div>
                  <div>
                    <dt>Base jurídica</dt>
                    <dd>
                      Asistencia sanitaria (art. 9.2.h RGPD). Compartir con tu
                      persona de confianza y mejorar la IA, solo con tu
                      consentimiento.
                    </dd>
                  </div>
                  <div>
                    <dt>Tus derechos</dt>
                    <dd>
                      Acceso, rectificación, supresión, oposición, limitación y
                      portabilidad. Puedes reclamar ante la Agencia Española de
                      Protección de Datos.
                    </dd>
                  </div>
                </dl>
                <p className="muted left">
                  Texto de ejemplo: el texto legal definitivo lo fija Hospiten.
                </p>
              </section>
              <p className="muted">Ajustes simulados · No se guardan datos</p>
            </>
          )}
          {screen === "language" && (
            <>
              <IA />
              <div className="intro">
                <h2>Prepara tu consulta</h2>
                <p>
                  Un chat guiado te ayuda a contar a la Dra. Elena Martín el
                  motivo de tu visita. En la versión real, el asistente adapta
                  sus preguntas a lo que respondes.
                </p>
              </div>
              <div className="context-line">
                <Icon name="calendar" size={20} />
                Traumatología · Hoy, 11:30
              </div>
              <h3>¿En qué idioma prefieres hablar?</h3>
              <div className="language-options">
                {(Object.keys(languages) as Lang[]).map((l) => (
                  <button
                    className={`language-option ${lang === l ? "chosen" : ""}`}
                    key={l}
                    onClick={() => setLang(l)}
                  >
                    <span className="language-code">{l}</span>
                    <strong>{languages[l]}</strong>
                    <span className="radio">{lang === l && <i />}</span>
                  </button>
                ))}
              </div>
              <p className="muted">
                El resumen para tu médico estará en español.
              </p>
              <Button
                onClick={() => {
                  setAnswers([])
                  setDraft("")
                  go("pre")
                }}
              >
                COMENZAR PRE-CONSULTA
                <Icon name="arrow" size={20} />
              </Button>
            </>
          )}
          {screen === "pre" && (
            <>
              <IA />
              <div className="progress-heading">
                <span>
                  {answers.length === 5
                    ? "Preguntas completadas"
                    : `Pregunta ${answers.length + 1} de 5`}
                </span>
                <span className="tag">{lang}</span>
              </div>
              <progress
                value={answers.length === 5 ? 5 : answers.length + 1}
                max="5"
                aria-label="Progreso de pre-consulta"
              />
              <div className="chat-stack">
                {questions[lang]
                  .slice(0, Math.min(answers.length + 1, 5))
                  .map((q, i) => (
                    <div className="chat-pair" key={i}>
                      <div className="bubble assistant">
                        <span className="speaker">ASISTENTE · {lang}</span>
                        <p lang={lang.toLowerCase()}>{q}</p>
                      </div>
                      {answers[i] && (
                        <div
                          className="bubble patient"
                          lang={lang.toLowerCase()}
                        >
                          {answers[i]}
                        </div>
                      )}
                    </div>
                  ))}
              </div>
              {answers.length < 5 ? (
                <>
                  <p className="muted">
                    Respuesta de ejemplo · Toca para usarla
                  </p>
                  <button
                    className="answer-suggestion"
                    lang={lang.toLowerCase()}
                    onClick={() =>
                      addAnswer(exampleAnswers[lang][answers.length])
                    }
                  >
                    {exampleAnswers[lang][answers.length]}
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
                      aria-label="Tu respuesta"
                      placeholder="Escribe tu respuesta…"
                      value={draft}
                      onChange={(e) => setDraft(e.target.value)}
                    />
                    <button
                      type="button"
                      aria-label="Simular dictado con respuesta de ejemplo"
                      onClick={() =>
                        setDraft(exampleAnswers[lang][answers.length])
                      }
                    >
                      <Icon name="mic" size={21} />
                    </button>
                    <button
                      type="submit"
                      disabled={!draft.trim()}
                      aria-label="Enviar respuesta"
                    >
                      <Icon name="send" size={22} />
                    </button>
                  </form>
                </>
              ) : (
                <Button onClick={() => go("summary")}>
                  <Icon name="file" size={20} />
                  REVISAR RESUMEN
                </Button>
              )}
            </>
          )}
          {screen === "summary" && (
            <>
              <IA />
              <div className="intro">
                <h2>Revisa antes de enviar</h2>
                <p>
                  Este resumen se compartirá con la Dra. Elena Martín para tu
                  cita de hoy a las 11:30.
                </p>
              </div>
              <section className="card summary-card">
                <h3>Resumen para el médico (ES)</h3>
                <dl>
                  <div>
                    <dt>Motivo de consulta</dt>
                    <dd>
                      {answers[0] === exampleAnswers[lang][0]
                        ? "Dolor en rodilla derecha desde hace 2 semanas."
                        : answerText(0)}
                    </dd>
                  </div>
                  <div>
                    <dt>Caídas o traumatismos</dt>
                    <dd>
                      {answers[1] === exampleAnswers[lang][1]
                        ? "Sin caídas."
                        : answerText(1)}
                    </dd>
                  </div>
                  <div>
                    <dt>Intensidad y evolución</dt>
                    <dd>
                      {answers[2] === exampleAnswers[lang][2]
                        ? "Dolor moderado, 5 de 10."
                        : answerText(2)}{" "}
                      {answers[3] === exampleAnswers[lang][3]
                        ? "Empeora al caminar y por la noche."
                        : answerText(3)}
                    </dd>
                  </div>
                  <div>
                    <dt>Información adicional</dt>
                    <dd>
                      {answers[4] === exampleAnswers[lang][4]
                        ? "Sin comentarios adicionales."
                        : answerText(4)}
                    </dd>
                  </div>
                  <div>
                    <dt>Idioma del paciente</dt>
                    <dd>{languages[lang]}</dd>
                  </div>
                </dl>
              </section>
              <label className="field-label" htmlFor="summary-note">
                ¿Quieres añadir o corregir algo?
              </label>
              <textarea
                id="summary-note"
                value={extraSummary}
                onChange={(e) => setExtraSummary(e.target.value)}
                placeholder="Escribe una aclaración (opcional)…"
              />
              <p className="muted">
                Las respuestas libres se muestran tal como las escribes; este
                prototipo no realiza traducción automática.
              </p>
              <Button
                onClick={() => {
                  setPreSent(true)
                  go("preSent")
                }}
              >
                <Icon name="send" size={20} />
                ENVIAR A MI MÉDICO
              </Button>
              <Button secondary onClick={() => go("pre")}>
                Volver a mis respuestas
              </Button>
            </>
          )}
          {screen === "preSent" && (
            <>
              <IA />
              <Success
                title="Tu médico ya tiene el resumen"
                text="Resumen preparado para la Dra. Elena Martín. Traumatología · Hoy, 11:30 · Consulta 2.14."
              />
              <div className="card confirmation-info">
                <Icon name="file" />
                <span>
                  Pre-consulta completada
                  {extraSummary && " con tu aclaración adicional"}.
                </span>
              </div>
              <Button
                onClick={() => {
                  setSelectedAppointment(0)
                  go("appointment")
                }}
              >
                VER EL RECORRIDO DE MI CITA
              </Button>
              <Button secondary onClick={() => go("turn")}>
                Ver mi turno
              </Button>
              <p className="muted">
                Envío simulado. No se ha enviado información real.
              </p>
            </>
          )}
          {screen === "turn" && (
            <>
              <div className="context-line">
                <Icon name="calendar" size={20} />
                Hoy, 11:30 · Traumatología
              </div>
              <section className="queue card">
                <span className="tag">CONSULTA 2.14</span>
                <div className="queue-number">
                  {called ? "0" : notification ? "2" : "3"}
                </div>
                <h2>personas delante</h2>
                <span className="queue-time">
                  <Icon name="clock" size={22} />
                  {called
                    ? "Es tu turno"
                    : notification
                      ? "≈10 min"
                      : "≈15 min"}
                </span>
                <progress
                  max="100"
                  value={called ? 100 : notification ? 75 : 45}
                  aria-label="Avance de tu turno"
                />
                <p>Hospiten Estepona</p>
              </section>
              {!notification ? (
                <>
                  <div className="notice">
                    <Icon name="bell" size={23} />
                    <span>
                      Te avisamos 10 min antes.
                      <br />
                      Puedes esperar con tranquilidad.
                    </span>
                  </div>
                  <Button secondary onClick={() => setNotification(true)}>
                    <Icon name="bell" size={20} />
                    Simular aviso de turno
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
                    <strong>Te toca en 10 min</strong>
                    <span>
                      Prepárate para la consulta 2.14.
                      <br />
                      Toca para ver la indicación.
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
                {shared ? "COMPARTIR DE NUEVO" : "COMPARTIR CON UN FAMILIAR"}
              </Button>
              <p className="muted">
                Tiempo estimado. El orden puede variar por necesidades
                asistenciales.
              </p>
            </>
          )}
          {screen === "consultation" && (
            <>
              <Success
                title="Pasa a la consulta 2.14"
                text="La Dra. Elena Martín te espera para tu cita de Traumatología de las 11:30."
              />
              <div className="card consultation-card">
                <Icon name="calendar" size={28} />
                <h3>Hospiten Estepona</h3>
                <p>Ana López · Consulta 2.14</p>
                <span className="tag">Es tu turno</span>
              </div>
              <Button onClick={() => go("translate")}>
                <Icon name="translate" size={21} />
                ABRIR TRADUCTOR
              </Button>
              <Button
                secondary
                onClick={() => {
                  setSelectedAppointment(0)
                  go("appointment")
                }}
              >
                Ver mi cita
              </Button>
              <p className="muted">
                Indicación simulada para esta presentación.
              </p>
            </>
          )}
          {screen === "share" && (
            <>
              <div className="intro">
                <h2>Comparte tu tranquilidad</h2>
                <p>
                  Elige a un familiar vinculado para que pueda seguir tu turno.
                </p>
              </div>
              <h3>Familiares vinculados</h3>
              <RelativePicker value={relative} onChange={setRelative} />
              <div className="notice">
                <Icon name="shield" size={22} />
                <span>
                  Solo se compartirá el estado del turno y el tiempo estimado.
                  Nunca el motivo de consulta ni tus informes.
                </span>
              </div>
              <label className="consent">
                <input
                  type="checkbox"
                  checked={consent}
                  onChange={(e) => setConsent(e.target.checked)}
                />
                <span>
                  Acepto compartir mi turno de hoy con el familiar seleccionado.
                </span>
              </label>
              <Button
                disabled={!relative || !consent}
                onClick={() => {
                  setShared(true)
                  go("shareSent")
                }}
              >
                CONFIRMAR Y COMPARTIR
              </Button>
              <p className="muted">
                Familiares ficticios · Compartición simulada
              </p>
            </>
          )}
          {screen === "shareSent" && (
            <>
              <Success
                title="Tu familiar puede seguir tu turno"
                text={`Has autorizado compartir el estado de tu turno con ${relative.split(" · ")[0]}.`}
              />
              <div className="card confirmation-info">
                <Icon name="share" />
                <span>
                  Traumatología · Hoy, 11:30
                  <br />
                  Solo estado del turno y espera estimada.
                </span>
              </div>
              <Button onClick={() => go("turn")}>VOLVER A MI TURNO</Button>
              <Button
                secondary
                onClick={() => {
                  setShared(false)
                  setConsent(false)
                  go("turn")
                }}
              >
                Dejar de compartir
              </Button>
              <p className="muted">
                Confirmación de demostración. No se han enviado datos.
              </p>
            </>
          )}
          {screen === "translate" && (
            <>
              <div className="translator-selectors">
                <label>
                  Idioma del médico
                  <select
                    value={fromLang}
                    onChange={(e) => {
                      const l = e.target.value as Lang
                      setFromLang(l)
                      if (l === toLang) setToLang(fromLang)
                    }}
                  >
                    {(Object.keys(languages) as Lang[]).map((l) => (
                      <option key={l} value={l}>
                        {languages[l]}
                      </option>
                    ))}
                  </select>
                </label>
                <button
                  className="swap-button"
                  aria-label="Intercambiar idiomas"
                  onClick={() => {
                    setFromLang(toLang)
                    setToLang(fromLang)
                  }}
                >
                  <Icon name="translate" />
                </button>
                <label>
                  Tu idioma
                  <select
                    value={toLang}
                    onChange={(e) => {
                      const l = e.target.value as Lang
                      setToLang(l)
                      if (l === fromLang) setFromLang(toLang)
                    }}
                  >
                    {(Object.keys(languages) as Lang[]).map((l) => (
                      <option key={l} value={l}>
                        {languages[l]}
                      </option>
                    ))}
                  </select>
                </label>
              </div>
              <p className="muted">
                Conversación de ejemplo · Subtítulos y traducción
              </p>
              <div className="translation-bubble doctor">
                <span className="speaker">MÉDICO · {fromLang}</span>
                <p lang={fromLang.toLowerCase()}>
                  {translation[fromLang].doctor}
                </p>
                <div className="translation-divider" />
                <p className="translated" lang={toLang.toLowerCase()}>
                  {translation[toLang].doctor}
                </p>
              </div>
              <div className="translation-bubble patient-translation">
                <span className="speaker">ANA · {toLang}</span>
                <p lang={toLang.toLowerCase()}>{translation[toLang].patient}</p>
                <div className="translation-divider" />
                <p className="translated" lang={fromLang.toLowerCase()}>
                  {translation[fromLang].patient}
                </p>
              </div>
              <div className="listening-area">
                <button
                  className={`big-mic ${listening ? "active" : ""}`}
                  aria-label={
                    listening
                      ? "Pausar escucha simulada"
                      : "Iniciar escucha simulada"
                  }
                  onClick={() => setListening(!listening)}
                >
                  <Icon name="mic" size={30} />
                </button>
                <strong>
                  {listening ? "Escuchando…" : "Toca para hablar"}
                </strong>
                <span>
                  {listening
                    ? "Escucha simulada · Sin grabación"
                    : "Micrófono de demostración"}
                </span>
              </div>
              <Button secondary onClick={() => go("interpreter")}>
                <Icon name="user" size={21} />
                SOLICITAR INTÉRPRETE
              </Button>
              <p className="muted">
                La traducción automática puede contener errores.
              </p>
            </>
          )}
          {screen === "interpreter" && (
            <>
              <Success
                title="Solicitud de intérprete preparada"
                text={`Se ha simulado una solicitud de apoyo para ${languages[fromLang].toLowerCase()} y ${languages[toLang].toLowerCase()}.`}
              />
              <div className="notice">
                <Icon name="user" />
                <span>
                  En la app real, atención al paciente confirmaría la
                  disponibilidad del intérprete.
                </span>
              </div>
              <Button onClick={() => go("translate")}>
                VOLVER AL TRADUCTOR
              </Button>
              <p className="muted">
                No se ha contactado con ningún servicio real.
              </p>
            </>
          )}
          {screen === "reports" && (
            <>
              <div className="intro compact">
                <p>
                  Consulta tus documentos y entiende tus resultados con más
                  claridad.
                </p>
              </div>
              <div className="report-list">
                {reportList.map((r, i) => (
                  <button
                    className="report-list-card card"
                    key={r.title}
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
                      Explicación disponible
                    </span>
                  </button>
                ))}
              </div>
            </>
          )}
          {screen === "report" && (
            <>
              <section className="report-intro">
                <span className="overline">{report.date} · ANA LÓPEZ</span>
                <h2>{report.title}</h2>
                <p>{report.appointment} · Hospiten Estepona</p>
              </section>
              <div className="reviewed">
                <Icon name="shield" size={22} />
                <strong>Revisado por tu médico</strong>
              </div>
              <p className="muted left">
                Toca cada bloque para ver su explicación.
              </p>
              {selectedReport === 0
                ? parameters.map((p, i) => (
                    <section className="parameter card" key={p.name}>
                      <button
                        className="parameter-toggle"
                        aria-expanded={openParameter === i}
                        onClick={() =>
                          setOpenParameter(openParameter === i ? null : i)
                        }
                      >
                        <span>
                          <strong>{p.name}</strong>
                          <span className="parameter-value">{p.value}</span>
                          <span
                            className={`result-badge ${
                              p.normal ? "normal" : ""
                            }`}
                          >
                            {p.normal ? "Normal" : "Fuera de rango"}
                          </span>
                        </span>
                        <span
                          className={
                            openParameter === i ? "chevron expanded" : "chevron"
                          }
                        >
                          <Icon name="arrow" size={21} />
                        </span>
                      </button>
                      {openParameter === i && (
                        <div className="parameter-explanation">
                          <p className="muted left">{p.range}</p>
                          <h3>Qué significa</h3>
                          <p>{p.meaning}</p>
                          <h3>Qué se suele hacer</h3>
                          <p>{p.advice}</p>
                          <div className="reviewed">
                            <Icon name="shield" size={19} />
                            Revisado por tu médico
                          </div>
                        </div>
                      )}
                    </section>
                  ))
                : [
                    {
                      title: "Valoración de la rodilla",
                      status: "Seguimiento indicado",
                      meaning:
                        "El informe de ejemplo recoge dolor en la rodilla derecha y recomienda una nueva valoración. No establece un diagnóstico en este prototipo.",
                      advice:
                        "Acudir a la revisión de Traumatología del 19 de mayo a las 11:30 con la Dra. Elena Martín, consulta 2.14.",
                    },
                    {
                      title: "Cuidados y seguimiento",
                      status: "Recomendaciones",
                      meaning:
                        "Estas indicaciones ilustrativas sirven para preparar la próxima visita y comentar la evolución de los síntomas.",
                      advice:
                        "Seguir las indicaciones personalizadas del equipo médico. Si aparece un empeoramiento importante, contactar con un profesional.",
                    },
                  ].map((p, i) => (
                    <section className="parameter card" key={p.title}>
                      <button
                        className="parameter-toggle"
                        aria-expanded={openParameter === i}
                        onClick={() =>
                          setOpenParameter(openParameter === i ? null : i)
                        }
                      >
                        <span>
                          <strong>{p.title}</strong>
                          <span className="muted">{p.status}</span>
                        </span>
                        <span
                          className={
                            openParameter === i ? "chevron expanded" : "chevron"
                          }
                        >
                          <Icon name="arrow" size={21} />
                        </span>
                      </button>
                      {openParameter === i && (
                        <div className="parameter-explanation">
                          <h3>Qué significa</h3>
                          <p>{p.meaning}</p>
                          <h3>Qué se suele hacer</h3>
                          <p>{p.advice}</p>
                          <div className="reviewed">
                            <Icon name="shield" size={19} />
                            Revisado por tu médico
                          </div>
                        </div>
                      )}
                    </section>
                  ))}
              <Button
                onClick={() => {
                  setDoubt("")
                  go("question")
                }}
              >
                <Icon name="chat" size={21} />
                TENGO UNA DUDA
              </Button>
              <p className="muted">
                Datos ilustrativos. No sustituye la consulta médica.
              </p>
            </>
          )}
          {screen === "question" && (
            <>
              <div className="intro">
                <h2>Tu duda, a tu consulta</h2>
                <p>
                  Pregunta sobre tu informe. El equipo médico podrá orientarte.
                </p>
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
                  ¿Qué te gustaría preguntar?
                </label>
                <textarea
                  id="doubt"
                  required
                  maxLength={1000}
                  value={doubt}
                  onChange={(e) => setDoubt(e.target.value)}
                  placeholder="Escribe tu duda sobre el informe…"
                  rows={5}
                />
                <p className="muted left">
                  Se dirigirá al equipo de tu consulta de{" "}
                  {report.appointment.toLowerCase()}.
                </p>
                <div className="notice">
                  <Icon name="shield" size={21} />
                  <span>
                    Este canal no atiende urgencias. Si es una urgencia, llama
                    al 112.
                  </span>
                </div>
                <button
                  type="submit"
                  className="button"
                  disabled={!doubt.trim()}
                >
                  ENVIAR A MI CONSULTA
                  <Icon name="send" size={20} />
                </button>
              </form>
            </>
          )}
          {screen === "questionSent" && (
            <>
              <Success
                title="Enviada a tu consulta"
                text={`Tu duda sobre «${report.title}» se ha preparado para el equipo de ${report.appointment.toLowerCase()}.`}
              />
              <div className="card confirmation-info">
                <Icon name="chat" />
                <span>{doubt}</span>
              </div>
              <p className="muted">
                Envío simulado. No se ha enviado ninguna consulta real.
              </p>
              <Button onClick={() => go("report")}>VOLVER AL INFORME</Button>
              <Button secondary onClick={() => root("reports")}>
                Ver todos mis informes
              </Button>
            </>
          )}
          {screen === "human" && (
            <>
              <div className="intro">
                <h2>Estamos para escucharte</h2>
                <p>
                  El equipo de atención al paciente puede ayudarte con tu
                  recorrido.
                </p>
              </div>
              <div className="card human-card">
                <span className="round-icon">
                  <Icon name="user" size={28} />
                </span>
                <h3>Atención al paciente</h3>
                <p>Hospiten Estepona</p>
                {!humanRequested ? (
                  <Button onClick={() => setHumanRequested(true)}>
                    SOLICITAR QUE ME CONTACTEN
                  </Button>
                ) : (
                  <div className="notice">
                    <Icon name="check" />
                    <span>
                      Solicitud simulada preparada. No se ha contactado con
                      ningún servicio real.
                    </span>
                  </div>
                )}
              </div>
              <p className="muted">Si es una urgencia, llama al 112.</p>
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
              <span>Hablar con una persona</span>
              <Icon name="arrow" size={18} />
            </button>
          )}
          <p className="prototype-note">Prototipo · Datos ilustrativos</p>
        </main>
        <nav className="bottom-nav" aria-label="Navegación principal">
          {navItems.map((item) => (
            <button
              key={item.title}
              onClick={() => root(item.target)}
              className={`${item.title === activeNav ? "nav-active" : ""} ${
                item.title === "Contigo" ? "contigo-nav" : ""
              }`}
              aria-current={item.title === activeNav ? "page" : undefined}
            >
              <span className="nav-icon">
                <Icon name={item.icon} size={25} />
              </span>
              <span>{item.title}</span>
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
