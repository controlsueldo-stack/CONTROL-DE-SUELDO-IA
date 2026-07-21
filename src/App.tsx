import React, { useState, useRef, useEffect } from "react";
import { 
  Send, 
  Shield, 
  User, 
  Calculator, 
  Calendar, 
  Clock, 
  Info, 
  Percent, 
  Briefcase, 
  Plane, 
  MapPin, 
  FileText, 
  Check, 
  HelpCircle, 
  RefreshCw, 
  AlertCircle, 
  ChevronRight, 
  MessageSquare,
  Sparkles,
  Download
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { 
  SALARY_DATABASE, 
  calculateSalary, 
  CalculationInputs, 
  CalculationResult 
} from "./salaryData";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  detectedFields?: any;
}

const PRESETS = [
  {
    label: "Vigilador General en Julio",
    text: "Hola, soy Vigilador General, quiero calcular mi sueldo para Julio. Tengo 5 años de antigüedad, hice 15 horas extras al 50%, no tuve horas extras al 100% ni horas nocturnas, y no me tomé vacaciones.",
    state: {
      month: "JULIO",
      category: "Vigilador General / Controlador Admisión",
      antiguedad: 5,
      horasExtras50: 15,
      horasExtras100: 0,
      horasNocturnas: 0,
      diasVacaciones: 0,
    }
  },
  {
    label: "Op. Monitoreo con Extras y Vacaciones",
    text: "Hola, soy Operador de Monitoreo en Agosto. Tengo 10 años de antigüedad, hice 8 horas extras al 50%, 4 horas extras al 100% por un feriado trabajado, 32 horas nocturnas y me tomé 14 días de vacaciones.",
    state: {
      month: "AGOSTO",
      category: "Vigilador Bombero / Verif. Eventos / Op. Monitoreo",
      antiguedad: 10,
      horasExtras50: 8,
      horasExtras100: 4,
      horasNocturnas: 32,
      diasVacaciones: 14,
    }
  },
  {
    label: "Vigilador Principal en Diciembre (Patagonia)",
    text: "Hola, soy Vigilador Principal, mi provincia es Neuquén. Quiero calcular mi sueldo de Diciembre, tengo 12 años de antigüedad, hice 10 horas extras al 50%, 45 horas nocturnas y no tuve vacaciones.",
    state: {
      month: "DICIEMBRE",
      category: "Vigilador Principal / Instalador Sistemas",
      antiguedad: 12,
      horasExtras50: 10,
      horasExtras100: 0,
      horasNocturnas: 45,
      diasVacaciones: 0,
      tieneAdNeuquen: true
    }
  }
];

export default function App() {
  // Simulator State
  const [inputs, setInputs] = useState<CalculationInputs>({
    month: "JULIO",
    category: "Vigilador General / Controlador Admisión",
    antiguedad: 3,
    horasExtras50: 0,
    horasExtras100: 0,
    horasNocturnas: 0,
    diasVacaciones: 0,
    tieneAeroportuario: false,
    tieneAdNeuquen: false,
    tieneSindicato: true,
  });

  // Chat State
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "welcome",
      role: "assistant",
      content: "¡Hola! Bienvenido/a a **Sueldo Seguro AI**, tu asistente experto para la liquidación de haberes bajo el CCT de Seguridad Privada (507/07) de Argentina.\n\nPara guiarte paso a paso con tu cálculo de sueldo del período **Julio - Diciembre**, indícame por favor tu **Categoría de trabajo** y el **Mes a liquidar**, o selecciona los valores directamente en el simulador de la derecha. ¡Con gusto te ayudaré!",
    }
  ]);
  const [userInput, setUserInput] = useState("");
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [chatError, setChatError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"calculator" | "breakdown">("calculator");

  // Interactive Questionnaire Wizard State
  const [wizardActive, setWizardActive] = useState(true);
  const [wizardStep, setWizardStep] = useState<"month" | "category" | "antiguedad" | "extras" | "nocturnas" | "vacaciones" | "confirm">("month");
  
  // Temporary wizard selections
  const [wizMonth, setWizMonth] = useState("JULIO");
  const [wizCategory, setWizCategory] = useState("Vigilador General / Controlador Admisión");
  const [wizAntiguedad, setWizAntiguedad] = useState(0);
  const [wizExtras50, setWizExtras50] = useState(0);
  const [wizExtras100, setWizExtras100] = useState(0);
  const [wizNocturnas, setWizNocturnas] = useState(0);
  const [wizVacaciones, setWizVacaciones] = useState(0);
  
  // Ref for chat scrolling
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isAiLoading]);

  // Calculate current salary dynamically
  const result: CalculationResult = calculateSalary(inputs);

  // Send a message to the backend
  const handleSendMessage = async (text: string) => {
    if (!text.trim() || isAiLoading) return;

    const newUserMessage: Message = {
      id: Date.now().toString(),
      role: "user",
      content: text,
    };

    setMessages(prev => [...prev, newUserMessage]);
    setUserInput("");
    setIsAiLoading(true);
    setChatError(null);

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: [...messages, newUserMessage].map(m => ({
            role: m.role,
            content: m.content
          })),
          currentState: inputs
        })
      });

      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        throw new Error(errData.error || "Error en el servidor de Inteligencia Artificial.");
      }

      const data = await response.json();
      
      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: data.text,
        detectedFields: data.detectedFields
      };

      setMessages(prev => [...prev, assistantMessage]);

      // If fields were detected, synchronize them to the UI state with a smooth reaction!
      if (data.detectedFields) {
        const df = data.detectedFields;
        setInputs(prev => {
          const updated = { ...prev };
          if (df.month && SALARY_DATABASE[df.month]) {
            updated.month = df.month;
          }
          if (df.category && SALARY_DATABASE[updated.month].categories[df.category]) {
            updated.category = df.category;
          }
          if (df.antiguedad !== undefined && df.antiguedad !== null) {
            updated.antiguedad = Math.min(45, Math.max(0, df.antiguedad));
          }
          if (df.horasExtras50 !== undefined && df.horasExtras50 !== null) {
            updated.horasExtras50 = Math.min(100, Math.max(0, df.horasExtras50));
          }
          if (df.horasExtras100 !== undefined && df.horasExtras100 !== null) {
            updated.horasExtras100 = Math.min(100, Math.max(0, df.horasExtras100));
          }
          if (df.horasNocturnas !== undefined && df.horasNocturnas !== null) {
            updated.horasNocturnas = Math.min(180, Math.max(0, df.horasNocturnas));
          }
          if (df.diasVacaciones !== undefined && df.diasVacaciones !== null) {
            updated.diasVacaciones = Math.min(30, Math.max(0, df.diasVacaciones));
          }
          return updated;
        });
      }

    } catch (error: any) {
      console.error(error);
      setChatError(error.message || "Error al conectar con Sueldo Seguro AI.");
    } finally {
      setIsAiLoading(false);
    }
  };

  // Pre-fill fields and send preset message
  const handleApplyPreset = (preset: typeof PRESETS[0]) => {
    setInputs(prev => ({
      ...prev,
      ...preset.state
    }));
    handleSendMessage(preset.text);
  };

  // Share current state directly with the AI
  const handleShareStateWithAi = () => {
    const formattedText = `Hola, quiero liquidar mi sueldo con estos datos que tengo cargados en la planilla:
- Mes: ${inputs.month}
- Categoría: ${inputs.category}
- Antigüedad: ${inputs.antiguedad} años
- Horas Extras 50%: ${inputs.horasExtras50} hs
- Horas Extras 100% (Feriados): ${inputs.horasExtras100} hs
- Horas Nocturnas: ${inputs.horasNocturnas} hs
- Vacaciones: ${inputs.diasVacaciones} días
- Adicional Aeroportuario: ${inputs.tieneAeroportuario ? 'Sí' : 'No'}
- Adicional Neuquén: ${inputs.tieneAdNeuquen ? 'Sí' : 'No'}
- Aporte Sindical: ${inputs.tieneSindicato ? 'Sí' : 'No'}

Por favor, haceme el desglose matemático detallado de mi liquidación.`;

    handleSendMessage(formattedText);
  };

  // Helper to format currency values in ARS
  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat("es-AR", {
      style: "currency",
      currency: "ARS",
      maximumFractionDigits: 0
    }).format(val);
  };

  const handleReset = () => {
    setInputs({
      month: "JULIO",
      category: "Vigilador General / Controlador Admisión",
      antiguedad: 0,
      horasExtras50: 0,
      horasExtras100: 0,
      horasNocturnas: 0,
      diasVacaciones: 0,
      tieneAeroportuario: false,
      tieneAdNeuquen: false,
      tieneSindicato: true,
    });
    setMessages([
      {
        id: "welcome-reset",
        role: "assistant",
        content: "¡Se ha reiniciado el simulador! Indícame tu **Categoría de trabajo** y el **Mes a liquidar**, o selecciona los valores directamente en la calculadora de la derecha para comenzar un nuevo cálculo.",
      }
    ]);
    setChatError(null);
    setWizardActive(true);
    setWizardStep("month");
    setWizMonth("JULIO");
    setWizCategory("Vigilador General / Controlador Admisión");
    setWizAntiguedad(0);
    setWizExtras50(0);
    setWizExtras100(0);
    setWizNocturnas(0);
    setWizVacaciones(0);
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 font-sans flex flex-col antialiased">
      {/* APP HEADER */}
      <header className="bg-slate-900 text-white py-4 px-6 shadow-md border-b border-slate-800 shrink-0">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row justify-between items-center gap-4">
          <div className="flex items-center gap-3">
            <div className="bg-emerald-500 text-slate-950 p-2 rounded-xl shadow-lg shadow-emerald-500/20">
              <Shield className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-xl font-bold tracking-tight flex items-center gap-2">
                Sueldo Seguro AI
                <span className="text-[10px] bg-emerald-500/20 text-emerald-400 font-medium px-2 py-0.5 rounded-full uppercase border border-emerald-500/30">
                  CCT 507/07
                </span>
              </h1>
              <p className="text-xs text-slate-400 font-normal">
                Liquidador Inteligente y Asistente Experto en Seguridad Privada Argentina
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <button
              onClick={handleReset}
              className="text-xs bg-slate-800 hover:bg-slate-700 hover:text-white transition px-3 py-1.5 rounded-lg flex items-center gap-1.5 border border-slate-700"
            >
              <RefreshCw className="w-3.5 h-3.5 text-slate-400" />
              Reiniciar Valores
            </button>
            <a 
              href="https://loyal.org.ar" 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-[11px] text-slate-400 hover:text-white transition bg-slate-800/50 px-2.5 py-1.5 rounded-lg border border-slate-800"
            >
              CCT 507/07 Homologado
            </a>
          </div>
        </div>
      </header>

      {/* MAIN TWO-COLUMN DASHBOARD */}
      <main className="flex-1 max-w-7xl w-full mx-auto grid grid-cols-1 lg:grid-cols-12 gap-6 p-4 sm:p-6 overflow-hidden">
        
        {/* LEFT COLUMN: CHAT ASSISTANT (5 cols on large screens) */}
        <section className="lg:col-span-5 bg-white rounded-2xl border border-slate-200/80 shadow-sm flex flex-col h-[calc(100vh-10rem)] min-h-[500px]">
          
          {/* Chat Header */}
          <div className="p-4 border-b border-slate-100 bg-slate-50/50 rounded-t-2xl flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center text-white shadow-md shadow-indigo-600/10">
                <Sparkles className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-slate-800">Chat con Sueldo Seguro AI</h3>
                <p className="text-[10px] text-slate-500 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                  Especialista de Convenio Activo
                </p>
              </div>
            </div>
            <button
              onClick={handleShareStateWithAi}
              className="text-xs text-indigo-600 bg-indigo-50 hover:bg-indigo-100 transition px-2.5 py-1.5 rounded-lg flex items-center gap-1 font-medium"
              title="Sincronizar el estado del simulador para que el asistente de chat te liquide estos números"
            >
              <Calculator className="w-3.5 h-3.5" />
              Verificar mis números
            </button>
          </div>

          {/* Messages Window */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            <AnimatePresence initial={false}>
              {messages.map((msg) => (
                <motion.div
                  key={msg.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`flex gap-3 max-w-[85%] ${msg.role === "user" ? "ml-auto flex-row-reverse" : "mr-auto"}`}
                >
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 shadow-sm ${
                    msg.role === "user" 
                      ? "bg-slate-100 text-slate-700" 
                      : "bg-indigo-100 text-indigo-700"
                  }`}>
                    {msg.role === "user" ? <User className="w-4 h-4" /> : <Shield className="w-4 h-4" />}
                  </div>
                  
                  <div>
                    <div className={`p-3 rounded-2xl text-xs leading-relaxed shadow-sm ${
                      msg.role === "user"
                        ? "bg-slate-900 text-slate-50 rounded-tr-none"
                        : "bg-slate-50 border border-slate-200/60 text-slate-800 rounded-tl-none whitespace-pre-wrap"
                    }`}>
                      {msg.content}
                    </div>

                    {/* Detected Fields Notice badge */}
                    {msg.role === "assistant" && msg.detectedFields && Object.values(msg.detectedFields).some(v => v !== null) && (
                      <div className="mt-1 flex flex-wrap gap-1 items-center">
                        <span className="text-[9px] text-slate-400 font-medium px-1">Campos detectados:</span>
                        {Object.entries(msg.detectedFields).map(([key, val]) => {
                          if (val === null || val === undefined) return null;
                          return (
                            <span 
                              key={key} 
                              className="text-[9px] bg-indigo-50 text-indigo-700 border border-indigo-100 px-1.5 py-0.5 rounded font-mono"
                            >
                              {key}: {typeof val === "boolean" ? (val ? "Sí" : "No") : String(val)}
                            </span>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>

            {isAiLoading && (
              <div className="flex gap-3 max-w-[85%] mr-auto">
                <div className="w-8 h-8 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center shrink-0">
                  <Shield className="w-4 h-4 animate-pulse" />
                </div>
                <div className="bg-slate-50 border border-slate-200/50 p-4 rounded-2xl rounded-tl-none flex items-center gap-2">
                  <div className="flex gap-1">
                    <span className="w-1.5 h-1.5 bg-indigo-500 rounded-full animate-bounce" style={{ animationDelay: "0ms" }}></span>
                    <span className="w-1.5 h-1.5 bg-indigo-500 rounded-full animate-bounce" style={{ animationDelay: "150ms" }}></span>
                    <span className="w-1.5 h-1.5 bg-indigo-500 rounded-full animate-bounce" style={{ animationDelay: "300ms" }}></span>
                  </div>
                  <span className="text-xs text-slate-500 font-mono">Calculando con CCT 507/07...</span>
                </div>
              </div>
            )}

            {chatError && (
              <div className="bg-red-50 border border-red-200 text-red-700 p-3 rounded-xl text-xs flex items-start gap-2 max-w-[90%] mx-auto">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-red-500" />
                <div>
                  <p className="font-semibold">Error al conectar con el Asistente</p>
                  <p className="text-[10px] mt-0.5">{chatError}</p>
                </div>
              </div>
            )}

            {/* INTERACTIVE QUESTIONNAIRE WIZARD */}
            {wizardActive && (
              <motion.div
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-indigo-50/70 border border-indigo-200/80 rounded-2xl p-4 shadow-sm space-y-4 text-xs"
              >
                <div className="flex items-center justify-between border-b border-indigo-200/40 pb-2">
                  <div className="flex items-center gap-1.5">
                    <Sparkles className="w-4 h-4 text-indigo-600 animate-pulse" />
                    <span className="font-bold text-slate-800">Asistente de Selección Rápida</span>
                  </div>
                  <button 
                    onClick={() => setWizardActive(false)}
                    className="text-[10px] text-slate-400 hover:text-slate-600 font-medium bg-white px-2 py-0.5 rounded border border-slate-200"
                  >
                    Omitir
                  </button>
                </div>

                {/* Progress bar */}
                <div className="w-full bg-slate-200 rounded-full h-1.5 overflow-hidden">
                  <div 
                    className="bg-indigo-600 h-1.5 transition-all duration-300"
                    style={{ 
                      width: 
                        wizardStep === "month" ? "14%" :
                        wizardStep === "category" ? "28%" :
                        wizardStep === "antiguedad" ? "42%" :
                        wizardStep === "extras" ? "56%" :
                        wizardStep === "nocturnas" ? "70%" :
                        wizardStep === "vacaciones" ? "84%" : "100%"
                    }}
                  />
                </div>

                {/* STEP CONTENT */}
                {wizardStep === "month" && (
                  <div className="space-y-3">
                    <p className="font-semibold text-slate-700">Paso 1 de 7: ¿Qué mes deseas liquidar?</p>
                    <div className="grid grid-cols-3 gap-2">
                      {Object.keys(SALARY_DATABASE).map((m) => (
                        <button
                          type="button"
                          key={m}
                          onClick={() => {
                            setWizMonth(m);
                            setWizardStep("category");
                          }}
                          className={`py-2 px-1.5 rounded-lg border text-center font-medium transition-all ${
                            wizMonth === m 
                              ? "bg-indigo-600 border-indigo-600 text-white shadow-xs" 
                              : "bg-white border-slate-200 hover:border-indigo-400 text-slate-700"
                          }`}
                        >
                          {m}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {wizardStep === "category" && (
                  <div className="space-y-3">
                    <p className="font-semibold text-slate-700">Paso 2 de 7: Selecciona tu categoría profesional CCT 507/07:</p>
                    <div className="flex flex-col gap-2">
                      {Object.keys(SALARY_DATABASE[wizMonth].categories).map((cat) => (
                        <button
                          type="button"
                          key={cat}
                          onClick={() => {
                            setWizCategory(cat);
                            setWizardStep("antiguedad");
                          }}
                          className={`text-left p-2.5 rounded-lg border transition-all text-xs flex items-center justify-between gap-2 ${
                            wizCategory === cat 
                              ? "bg-indigo-600 border-indigo-600 text-white shadow-xs font-semibold" 
                              : "bg-white border-slate-200 hover:border-indigo-400 text-slate-700"
                          }`}
                        >
                          <span>{cat}</span>
                          <ChevronRight className="w-3.5 h-3.5 shrink-0 opacity-70" />
                        </button>
                      ))}
                    </div>
                    <button 
                      type="button"
                      onClick={() => setWizardStep("month")}
                      className="text-[10px] text-indigo-600 hover:underline font-semibold"
                    >
                      ⬅️ Volver al paso anterior
                    </button>
                  </div>
                )}

                {wizardStep === "antiguedad" && (
                  <div className="space-y-3">
                    <p className="font-semibold text-slate-700">Paso 3 de 7: ¿Cuántos años de antigüedad tienes?</p>
                    <div className="flex items-center justify-between bg-white border border-slate-200 rounded-xl p-3 gap-4">
                      <button 
                        type="button"
                        onClick={() => setWizAntiguedad(prev => Math.max(0, prev - 1))}
                        className="bg-slate-100 hover:bg-slate-200 text-slate-700 w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm"
                      >
                        -
                      </button>
                      <span className="text-sm font-bold text-indigo-700">{wizAntiguedad} {wizAntiguedad === 1 ? "año" : "años"}</span>
                      <button 
                        type="button"
                        onClick={() => setWizAntiguedad(prev => Math.min(45, prev + 1))}
                        className="bg-slate-100 hover:bg-slate-200 text-slate-700 w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm"
                      >
                        +
                      </button>
                    </div>

                    <div className="flex flex-wrap gap-1.5 pt-1">
                      {[0, 1, 2, 3, 5, 10, 15, 20].map((yr) => (
                        <button
                          type="button"
                          key={yr}
                          onClick={() => setWizAntiguedad(yr)}
                          className="px-2.5 py-1 rounded bg-white hover:bg-indigo-50 hover:text-indigo-700 border border-slate-200 text-[10px] font-medium"
                        >
                          {yr} {yr === 1 ? "año" : "años"}
                        </button>
                      ))}
                    </div>

                    <div className="flex justify-between items-center pt-2">
                      <button 
                        type="button"
                        onClick={() => setWizardStep("category")}
                        className="text-[10px] text-indigo-600 hover:underline font-semibold"
                      >
                        ⬅️ Volver
                      </button>
                      <button 
                        type="button"
                        onClick={() => setWizardStep("extras")}
                        className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold px-4 py-2 rounded-lg"
                      >
                        Siguiente paso ➡️
                      </button>
                    </div>
                  </div>
                )}

                {wizardStep === "extras" && (
                  <div className="space-y-3">
                    <p className="font-semibold text-slate-700">Paso 4 de 7: Horas Extras realizadas en el mes:</p>
                    <div className="grid grid-cols-2 gap-3 bg-white border border-slate-200 rounded-xl p-3">
                      
                      <div className="space-y-1 text-center">
                        <span className="text-[10px] text-slate-500 font-semibold uppercase">Extras 50%</span>
                        <div className="flex items-center justify-center gap-2">
                          <button 
                            type="button"
                            onClick={() => setWizExtras50(prev => Math.max(0, prev - 1))}
                            className="bg-slate-100 hover:bg-slate-200 text-slate-700 w-6 h-6 rounded-full flex items-center justify-center font-bold"
                          >
                            -
                          </button>
                          <span className="font-bold text-slate-800 text-xs w-8">{wizExtras50} hs</span>
                          <button 
                            type="button"
                            onClick={() => setWizExtras50(prev => Math.min(100, prev + 1))}
                            className="bg-slate-100 hover:bg-slate-200 text-slate-700 w-6 h-6 rounded-full flex items-center justify-center font-bold"
                          >
                            +
                          </button>
                        </div>
                      </div>

                      <div className="space-y-1 text-center">
                        <span className="text-[10px] text-slate-500 font-semibold uppercase">Extras 100% / Feriados</span>
                        <div className="flex items-center justify-center gap-2">
                          <button 
                            type="button"
                            onClick={() => setWizExtras100(prev => Math.max(0, prev - 1))}
                            className="bg-slate-100 hover:bg-slate-200 text-slate-700 w-6 h-6 rounded-full flex items-center justify-center font-bold"
                          >
                            -
                          </button>
                          <span className="font-bold text-slate-800 text-xs w-8">{wizExtras100} hs</span>
                          <button 
                            type="button"
                            onClick={() => setWizExtras100(prev => Math.min(100, prev + 1))}
                            className="bg-slate-100 hover:bg-slate-200 text-slate-700 w-6 h-6 rounded-full flex items-center justify-center font-bold"
                          >
                            +
                          </button>
                        </div>
                      </div>

                    </div>

                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          setWizExtras50(0);
                          setWizExtras100(0);
                          setWizardStep("nocturnas");
                        }}
                        className="flex-1 py-1 px-2 text-[10px] bg-slate-100 hover:bg-slate-200 text-slate-600 rounded font-medium border border-slate-200"
                      >
                        No realicé ninguna hora extra
                      </button>
                    </div>

                    <div className="flex justify-between items-center pt-2">
                      <button 
                        type="button"
                        onClick={() => setWizardStep("antiguedad")}
                        className="text-[10px] text-indigo-600 hover:underline font-semibold"
                      >
                        ⬅️ Volver
                      </button>
                      <button 
                        type="button"
                        onClick={() => setWizardStep("nocturnas")}
                        className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold px-4 py-2 rounded-lg"
                      >
                        Siguiente paso ➡️
                      </button>
                    </div>
                  </div>
                )}

                {wizardStep === "nocturnas" && (
                  <div className="space-y-3">
                    <p className="font-semibold text-slate-700">Paso 5 de 7: Cantidad de horas nocturnas (21:00 a 06:00 hs):</p>
                    <div className="flex items-center justify-between bg-white border border-slate-200 rounded-xl p-3 gap-4">
                      <button 
                        type="button"
                        onClick={() => setWizNocturnas(prev => Math.max(0, prev - 2))}
                        className="bg-slate-100 hover:bg-slate-200 text-slate-700 w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm"
                      >
                        -
                      </button>
                      <span className="text-sm font-bold text-indigo-700">{wizNocturnas} horas</span>
                      <button 
                        type="button"
                        onClick={() => setWizNocturnas(prev => Math.min(180, prev + 2))}
                        className="bg-slate-100 hover:bg-slate-200 text-slate-700 w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm"
                      >
                        +
                      </button>
                    </div>

                    <div className="flex flex-wrap gap-1.5 pt-1">
                      {[0, 8, 16, 24, 32, 48, 80].map((hs) => (
                        <button
                          type="button"
                          key={hs}
                          onClick={() => setWizNocturnas(hs)}
                          className="px-2.5 py-1 rounded bg-white hover:bg-indigo-50 hover:text-indigo-700 border border-slate-200 text-[10px] font-medium"
                        >
                          {hs} hs
                        </button>
                      ))}
                    </div>

                    <div className="flex justify-between items-center pt-2">
                      <button 
                        type="button"
                        onClick={() => setWizardStep("extras")}
                        className="text-[10px] text-indigo-600 hover:underline font-semibold"
                      >
                        ⬅️ Volver
                      </button>
                      <button 
                        type="button"
                        onClick={() => setWizardStep("vacaciones")}
                        className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold px-4 py-2 rounded-lg"
                      >
                        Siguiente paso ➡️
                      </button>
                    </div>
                  </div>
                )}

                {wizardStep === "vacaciones" && (
                  <div className="space-y-3">
                    <p className="font-semibold text-slate-700">Paso 6 de 7: ¿Te tomaste días de vacaciones en este mes?</p>
                    <div className="flex items-center justify-between bg-white border border-slate-200 rounded-xl p-3 gap-4">
                      <button 
                        type="button"
                        onClick={() => setWizVacaciones(prev => Math.max(0, prev - 1))}
                        className="bg-slate-100 hover:bg-slate-200 text-slate-700 w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm"
                      >
                        -
                      </button>
                      <span className="text-sm font-bold text-indigo-700">{wizVacaciones} {wizVacaciones === 1 ? "día" : "días"}</span>
                      <button 
                        type="button"
                        onClick={() => setWizVacaciones(prev => Math.min(30, prev + 1))}
                        className="bg-slate-100 hover:bg-slate-200 text-slate-700 w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm"
                      >
                        +
                      </button>
                    </div>

                    <div className="flex flex-wrap gap-1.5 pt-1">
                      {[0, 7, 14, 21, 28, 30].map((v) => (
                        <button
                          type="button"
                          key={v}
                          onClick={() => setWizVacaciones(v)}
                          className="px-2.5 py-1 rounded bg-white hover:bg-indigo-50 hover:text-indigo-700 border border-slate-200 text-[10px] font-medium"
                        >
                          {v === 0 ? "Sin vacaciones" : `${v} días`}
                        </button>
                      ))}
                    </div>

                    <div className="flex justify-between items-center pt-2">
                      <button 
                        type="button"
                        onClick={() => setWizardStep("nocturnas")}
                        className="text-[10px] text-indigo-600 hover:underline font-semibold"
                      >
                        ⬅️ Volver
                      </button>
                      <button 
                        type="button"
                        onClick={() => setWizardStep("confirm")}
                        className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold px-4 py-2 rounded-lg"
                      >
                        Verificar resumen ➡️
                      </button>
                    </div>
                  </div>
                )}

                {wizardStep === "confirm" && (
                  <div className="space-y-3">
                    <p className="font-semibold text-slate-700">Paso 7 de 7: Confirma tu información seleccionada:</p>
                    
                    <div className="bg-white border border-slate-200 rounded-xl p-3 space-y-1.5 text-slate-700">
                      <div className="flex justify-between py-0.5 border-b border-slate-100">
                        <span className="text-slate-400">Mes:</span>
                        <span className="font-semibold">{wizMonth}</span>
                      </div>
                      <div className="flex justify-between py-0.5 border-b border-slate-100">
                        <span className="text-slate-400">Categoría:</span>
                        <span className="font-semibold text-right truncate max-w-[180px]" title={wizCategory}>{wizCategory}</span>
                      </div>
                      <div className="flex justify-between py-0.5 border-b border-slate-100">
                        <span className="text-slate-400">Antigüedad:</span>
                        <span className="font-semibold">{wizAntiguedad} años</span>
                      </div>
                      <div className="flex justify-between py-0.5 border-b border-slate-100">
                        <span className="text-slate-400">Horas Extras (50% / 100%):</span>
                        <span className="font-semibold">{wizExtras50} hs / {wizExtras100} hs</span>
                      </div>
                      <div className="flex justify-between py-0.5 border-b border-slate-100">
                        <span className="text-slate-400">Horas Nocturnas:</span>
                        <span className="font-semibold">{wizNocturnas} hs</span>
                      </div>
                      <div className="flex justify-between py-0.5">
                        <span className="text-slate-400">Vacaciones:</span>
                        <span className="font-semibold">{wizVacaciones > 0 ? `${wizVacaciones} días` : "No tuve"}</span>
                      </div>
                    </div>

                    <div className="flex gap-2">
                      <button 
                        type="button"
                        onClick={() => {
                          setWizardStep("month");
                        }}
                        className="flex-1 py-2 border border-slate-200 hover:bg-slate-50 text-slate-700 font-semibold rounded-lg"
                      >
                        Reestablecer
                      </button>
                      <button 
                        type="button"
                        onClick={() => {
                          const finalInputs = {
                            month: wizMonth,
                            category: wizCategory,
                            antiguedad: wizAntiguedad,
                            horasExtras50: wizExtras50,
                            horasExtras100: wizExtras100,
                            horasNocturnas: wizNocturnas,
                            diasVacaciones: wizVacaciones,
                            tieneAeroportuario: inputs.tieneAeroportuario,
                            tieneAdNeuquen: inputs.tieneAdNeuquen,
                            tieneSindicato: inputs.tieneSindicato
                          };
                          setInputs(finalInputs);
                          
                          const promptMsg = `Hola, soy de la categoría "${wizCategory}" y quiero calcular mi liquidación para el mes de ${wizMonth}. Tengo los siguientes datos:
- Antigüedad: ${wizAntiguedad} años.
- Horas extras al 50%: ${wizExtras50} horas.
- Horas extras al 100%: ${wizExtras100} horas.
- Horas nocturnas: ${wizNocturnas} horas.
- Días de vacaciones: ${wizVacaciones} días.

Por favor, realizame el cálculo de sueldo neto y mostrame el desglose de conceptos del recibo.`;
                          handleSendMessage(promptMsg);
                          setWizardActive(false);
                        }}
                        className="flex-2 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-2 px-3 rounded-lg flex items-center justify-center gap-1 shadow-sm"
                      >
                        <Calculator className="w-3.5 h-3.5" />
                        Calcular Sueldo Expreso
                      </button>
                    </div>
                  </div>
                )}
              </motion.div>
            )}

            {!wizardActive && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="bg-indigo-50/50 border border-indigo-100 rounded-xl p-2.5 text-center flex items-center justify-between gap-2"
              >
                <div className="flex items-center gap-1.5 text-[11px] text-slate-600">
                  <Sparkles className="w-3.5 h-3.5 text-indigo-500" />
                  <span>¿Deseas usar la guía paso a paso?</span>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setWizardStep("month");
                    setWizardActive(true);
                  }}
                  className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-[10px] px-2.5 py-1 rounded transition"
                >
                  Abrir Selección Rápida
                </button>
              </motion.div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Quick presets list */}
          <div className="p-3 border-t border-slate-100 bg-slate-50/30">
            <p className="text-[10px] font-semibold text-slate-400 mb-2 uppercase tracking-wider flex items-center gap-1">
              <Sparkles className="w-3 h-3 text-indigo-500" /> Ejemplos de prueba rápidos:
            </p>
            <div className="flex flex-col gap-1.5 max-h-[85px] overflow-y-auto">
              {PRESETS.map((preset, idx) => (
                <button
                  key={idx}
                  onClick={() => handleApplyPreset(preset)}
                  className="text-left text-[11px] bg-white border border-slate-200 hover:border-indigo-400 hover:bg-indigo-50/20 text-slate-700 hover:text-indigo-900 p-2 rounded-lg transition-all flex items-center justify-between gap-2 group shadow-xs shrink-0"
                >
                  <span className="font-medium truncate">{preset.label}</span>
                  <ChevronRight className="w-3 h-3 text-slate-400 group-hover:text-indigo-600 shrink-0" />
                </button>
              ))}
            </div>
          </div>

          {/* Chat Input Bar */}
          <div className="p-3 border-t border-slate-100 bg-slate-50/50 rounded-b-2xl">
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSendMessage(userInput);
              }}
              className="flex gap-2"
            >
              <input
                type="text"
                value={userInput}
                onChange={(e) => setUserInput(e.target.value)}
                placeholder="Escribe tu consulta aquí (ej: 'Vigilador con 5 años de antigüedad')..."
                className="flex-1 bg-white border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 rounded-xl px-4 py-2.5 text-xs shadow-inner"
                disabled={isAiLoading}
              />
              <button
                type="submit"
                disabled={!userInput.trim() || isAiLoading}
                className="bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-200 text-white disabled:text-slate-400 p-2.5 rounded-xl transition shadow-md shadow-indigo-600/10 shrink-0 flex items-center justify-center"
              >
                <Send className="w-4 h-4" />
              </button>
            </form>
            <p className="text-[10px] text-slate-400 text-center mt-1.5 font-normal">
              Sueldo Seguro AI analiza tus mensajes y sincroniza el recibo de la derecha.
            </p>
          </div>

        </section>

        {/* RIGHT COLUMN: INTERACTIVE SIMULATOR (7 cols on large screens) */}
        <section className="lg:col-span-7 flex flex-col gap-6 h-[calc(100vh-10rem)] min-h-[500px] overflow-y-auto pr-1">
          
          {/* TABS SELECTOR */}
          <div className="bg-slate-200/60 p-1 rounded-xl flex shrink-0">
            <button
              onClick={() => setActiveTab("calculator")}
              className={`flex-1 py-2 text-xs font-semibold rounded-lg transition flex items-center justify-center gap-1.5 ${
                activeTab === "calculator" ? "bg-white text-slate-900 shadow-sm" : "text-slate-600 hover:text-slate-900"
              }`}
            >
              <Calculator className="w-3.5 h-3.5" />
              Simulador y Recibo
            </button>
            <button
              onClick={() => setActiveTab("breakdown")}
              className={`flex-1 py-2 text-xs font-semibold rounded-lg transition flex items-center justify-center gap-1.5 ${
                activeTab === "breakdown" ? "bg-white text-slate-900 shadow-sm" : "text-slate-600 hover:text-slate-900"
              }`}
            >
              <FileText className="w-3.5 h-3.5" />
              Desglose Matemático Detallado
            </button>
          </div>

          {activeTab === "calculator" ? (
            <div className="space-y-6">
              {/* CONTROLS CARD */}
              <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs space-y-4">
                <div className="flex items-center gap-2 border-b border-slate-100 pb-2.5">
                  <Calculator className="w-4.5 h-4.5 text-indigo-600" />
                  <h3 className="text-sm font-semibold text-slate-800">Parámetros del Simulador</h3>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Month Selection */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-medium text-slate-500 flex items-center gap-1.5">
                      <Calendar className="w-3.5 h-3.5 text-slate-400" />
                      Mes a Calcular
                    </label>
                    <select
                      value={inputs.month}
                      onChange={(e) => setInputs(prev => ({ ...prev, month: e.target.value }))}
                      className="w-full bg-slate-50 border border-slate-200/80 rounded-xl px-3 py-2 text-xs font-medium focus:ring-2 focus:ring-indigo-500 text-slate-800"
                    >
                      {Object.keys(SALARY_DATABASE).map((m) => (
                        <option key={m} value={m}>{m}</option>
                      ))}
                    </select>
                  </div>

                  {/* Category Selection */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-medium text-slate-500 flex items-center gap-1.5">
                      <Briefcase className="w-3.5 h-3.5 text-slate-400" />
                      Categoría CCT 507/07
                    </label>
                    <select
                      value={inputs.category}
                      onChange={(e) => setInputs(prev => ({ ...prev, category: e.target.value }))}
                      className="w-full bg-slate-50 border border-slate-200/80 rounded-xl px-3 py-2 text-xs font-medium focus:ring-2 focus:ring-indigo-500 text-slate-800"
                    >
                      {Object.keys(SALARY_DATABASE[inputs.month].categories).map((cat) => (
                        <option key={cat} value={cat}>{cat}</option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* SLIDERS SECTION */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2 border-t border-slate-100">
                  
                  {/* Antiguedad */}
                  <div className="space-y-1.5 bg-slate-50/50 p-3 rounded-xl border border-slate-100">
                    <div className="flex justify-between items-center text-xs font-medium">
                      <span className="text-slate-600 flex items-center gap-1">
                        <Percent className="w-3.5 h-3.5 text-slate-400" />
                        Antigüedad (años)
                      </span>
                      <span className="text-indigo-700 font-semibold bg-indigo-50 px-2 py-0.5 rounded text-[11px]">
                        {inputs.antiguedad} {inputs.antiguedad === 1 ? "año" : "años"}
                      </span>
                    </div>
                    <input
                      type="range"
                      min="0"
                      max="45"
                      value={inputs.antiguedad}
                      onChange={(e) => setInputs(prev => ({ ...prev, antiguedad: parseInt(e.target.value) || 0 }))}
                      className="w-full h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-indigo-600"
                    />
                    <div className="flex justify-between text-[9px] text-slate-400 font-mono">
                      <span>0 años (Básico)</span>
                      <span>45 años max</span>
                    </div>
                  </div>

                  {/* Vacations */}
                  <div className="space-y-1.5 bg-slate-50/50 p-3 rounded-xl border border-slate-100">
                    <div className="flex justify-between items-center text-xs font-medium">
                      <span className="text-slate-600 flex items-center gap-1">
                        <Plane className="w-3.5 h-3.5 text-slate-400" />
                        Días de Vacaciones
                      </span>
                      <span className="text-indigo-700 font-semibold bg-indigo-50 px-2 py-0.5 rounded text-[11px]">
                        {inputs.diasVacaciones} {inputs.diasVacaciones === 1 ? "día" : "días"}
                      </span>
                    </div>
                    <input
                      type="range"
                      min="0"
                      max="30"
                      value={inputs.diasVacaciones}
                      onChange={(e) => setInputs(prev => ({ ...prev, diasVacaciones: parseInt(e.target.value) || 0 }))}
                      className="w-full h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-indigo-600"
                    />
                    <div className="flex justify-between text-[9px] text-slate-400 font-mono">
                      <span>Sin Vacaciones</span>
                      <span>30 días</span>
                    </div>
                  </div>

                  {/* Overtime 50% */}
                  <div className="space-y-1.5 bg-slate-50/50 p-3 rounded-xl border border-slate-100">
                    <div className="flex justify-between items-center text-xs font-medium">
                      <span className="text-slate-600 flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5 text-slate-400" />
                        Horas Extras al 50%
                      </span>
                      <span className="text-indigo-700 font-semibold bg-indigo-50 px-2 py-0.5 rounded text-[11px]">
                        {inputs.horasExtras50} hs
                      </span>
                    </div>
                    <input
                      type="range"
                      min="0"
                      max="100"
                      value={inputs.horasExtras50}
                      onChange={(e) => setInputs(prev => ({ ...prev, horasExtras50: parseInt(e.target.value) || 0 }))}
                      className="w-full h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-indigo-600"
                    />
                    <div className="flex justify-between text-[9px] text-slate-400 font-mono">
                      <span>0 hs</span>
                      <span>100 hs max</span>
                    </div>
                  </div>

                  {/* Overtime 100% */}
                  <div className="space-y-1.5 bg-slate-50/50 p-3 rounded-xl border border-slate-100">
                    <div className="flex justify-between items-center text-xs font-medium">
                      <span className="text-slate-600 flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5 text-slate-400" />
                        Horas Extras 100% / Feriados
                      </span>
                      <span className="text-indigo-700 font-semibold bg-indigo-50 px-2 py-0.5 rounded text-[11px]">
                        {inputs.horasExtras100} hs
                      </span>
                    </div>
                    <input
                      type="range"
                      min="0"
                      max="100"
                      value={inputs.horasExtras100}
                      onChange={(e) => setInputs(prev => ({ ...prev, horasExtras100: parseInt(e.target.value) || 0 }))}
                      className="w-full h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-indigo-600"
                    />
                    <div className="flex justify-between text-[9px] text-slate-400 font-mono">
                      <span>0 hs</span>
                      <span>100 hs max</span>
                    </div>
                  </div>

                  {/* Night Hours */}
                  <div className="space-y-1.5 bg-slate-50/50 p-3 rounded-xl border border-slate-100 md:col-span-2">
                    <div className="flex justify-between items-center text-xs font-medium">
                      <span className="text-slate-600 flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5 text-slate-400" />
                        Horas Nocturnas Trabajadas (de 21:00 a 06:00 hs)
                      </span>
                      <span className="text-indigo-700 font-semibold bg-indigo-50 px-2 py-0.5 rounded text-[11px]">
                        {inputs.horasNocturnas} hs
                      </span>
                    </div>
                    <input
                      type="range"
                      min="0"
                      max="180"
                      value={inputs.horasNocturnas}
                      onChange={(e) => setInputs(prev => ({ ...prev, horasNocturnas: parseInt(e.target.value) || 0 }))}
                      className="w-full h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-indigo-600"
                    />
                    <div className="flex justify-between text-[9px] text-slate-400 font-mono">
                      <span>0 hs</span>
                      <span>90 hs</span>
                      <span>180 hs max</span>
                    </div>
                  </div>
                </div>

                {/* CHECKBOXES TOGGLES */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-3 border-t border-slate-100">
                  {/* Aeroportuario */}
                  <label className="flex items-center gap-2.5 p-2 bg-slate-50 hover:bg-slate-100/70 border border-slate-100 rounded-xl cursor-pointer transition select-none">
                    <input
                      type="checkbox"
                      checked={inputs.tieneAeroportuario}
                      onChange={(e) => setInputs(prev => ({ ...prev, tieneAeroportuario: e.target.checked }))}
                      className="w-4 h-4 text-indigo-600 rounded border-slate-300 focus:ring-indigo-500"
                    />
                    <div className="text-left">
                      <p className="text-[11px] font-semibold text-slate-700 flex items-center gap-1">
                        Adi. Aeroportuario
                      </p>
                      <p className="text-[9px] text-slate-400">Servicio en Aeropuertos</p>
                    </div>
                  </label>

                  {/* Neuquen */}
                  <label className="flex items-center gap-2.5 p-2 bg-slate-50 hover:bg-slate-100/70 border border-slate-100 rounded-xl cursor-pointer transition select-none">
                    <input
                      type="checkbox"
                      checked={inputs.tieneAdNeuquen}
                      onChange={(e) => setInputs(prev => ({ ...prev, tieneAdNeuquen: e.target.checked }))}
                      className="w-4 h-4 text-indigo-600 rounded border-slate-300 focus:ring-indigo-500"
                    />
                    <div className="text-left">
                      <p className="text-[11px] font-semibold text-slate-700 flex items-center gap-1">
                        Adicional Neuquén
                      </p>
                      <p className="text-[9px] text-slate-400">Plus por Zona Patagónica</p>
                    </div>
                  </label>

                  {/* Sindicato */}
                  <label className="flex items-center gap-2.5 p-2 bg-slate-50 hover:bg-slate-100/70 border border-slate-100 rounded-xl cursor-pointer transition select-none">
                    <input
                      type="checkbox"
                      checked={inputs.tieneSindicato}
                      onChange={(e) => setInputs(prev => ({ ...prev, tieneSindicato: e.target.checked }))}
                      className="w-4 h-4 text-indigo-600 rounded border-slate-300 focus:ring-indigo-500"
                    />
                    <div className="text-left">
                      <p className="text-[11px] font-semibold text-slate-700">Aporte Sindical</p>
                      <p className="text-[9px] text-slate-400">Retención del 2% UPSRA</p>
                    </div>
                  </label>
                </div>
              </div>

              {/* SIMULATED ARGENTINE PAY SLIP CARD */}
              <div className="bg-white rounded-2xl border-2 border-slate-300 shadow-lg relative overflow-hidden font-mono text-slate-800">
                {/* Pay Slip Decorative Watermark */}
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-[0.03] select-none text-[80px] font-extrabold rotate-12">
                  CCT 507/07
                </div>

                {/* Stub Top header */}
                <div className="bg-slate-100 px-5 py-4 border-b border-slate-300 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
                  <div>
                    <h2 className="text-xs font-bold uppercase tracking-wider text-slate-600">Planilla de Haberes Provisoria</h2>
                    <p className="text-[10px] text-slate-400 font-sans">Simuladora no contractual - Valores homologados</p>
                  </div>
                  <div className="bg-slate-200 px-3 py-1 rounded text-[11px] font-semibold text-slate-700">
                    PERÍODO: {inputs.month} 2026
                  </div>
                </div>

                {/* Stub metadata */}
                <div className="p-4 bg-slate-50 border-b border-slate-200 grid grid-cols-2 md:grid-cols-4 gap-3 text-[10px]">
                  <div>
                    <span className="text-slate-400 font-sans block text-[9px] uppercase">Convenio Colectivo:</span>
                    <strong>CCT 507/07 Seg. Privada</strong>
                  </div>
                  <div>
                    <span className="text-slate-400 font-sans block text-[9px] uppercase">Categoría Profesional:</span>
                    <strong className="truncate block" title={inputs.category}>{inputs.category}</strong>
                  </div>
                  <div>
                    <span className="text-slate-400 font-sans block text-[9px] uppercase">Antigüedad:</span>
                    <strong>{inputs.antiguedad} años ({inputs.antiguedad}%)</strong>
                  </div>
                  <div>
                    <span className="text-slate-400 font-sans block text-[9px] uppercase">Valor Hora Base:</span>
                    <strong>{formatCurrency(result.horaBase)}</strong>
                  </div>
                </div>

                {/* Recibo Table */}
                <div className="overflow-x-auto">
                  <table className="w-full text-[11px] text-left border-collapse">
                    <thead>
                      <tr className="bg-slate-100/50 text-slate-500 border-b border-slate-200 text-[10px]">
                        <th className="py-2 px-4 w-12 text-center">Cód.</th>
                        <th className="py-2 px-2">Concepto</th>
                        <th className="py-2 px-2 text-right">Cant.</th>
                        <th className="py-2 px-3 text-right">Hab. Rem.</th>
                        <th className="py-2 px-3 text-right">Hab. No Rem.</th>
                        <th className="py-2 px-4 text-right">Deducciones</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      
                      {/* Remunerativos */}
                      <tr>
                        <td className="py-1.5 px-4 text-slate-400 text-center font-mono">001</td>
                        <td className="py-1.5 px-2 font-medium">SUELDO BÁSICO</td>
                        <td className="py-1.5 px-2 text-right text-slate-400">30 d</td>
                        <td className="py-1.5 px-3 text-right text-emerald-700">{formatCurrency(result.basico)}</td>
                        <td className="py-1.5 px-3 text-right">-</td>
                        <td className="py-1.5 px-4 text-right">-</td>
                      </tr>

                      <tr>
                        <td className="py-1.5 px-4 text-slate-400 text-center font-mono">002</td>
                        <td className="py-1.5 px-2">PRESENTISMO CCT 507/07</td>
                        <td className="py-1.5 px-2 text-right text-slate-400">100%</td>
                        <td className="py-1.5 px-3 text-right text-emerald-700">{formatCurrency(result.presentismo)}</td>
                        <td className="py-1.5 px-3 text-right">-</td>
                        <td className="py-1.5 px-4 text-right">-</td>
                      </tr>

                      {result.antiguedadMonto > 0 && (
                        <tr>
                          <td className="py-1.5 px-4 text-slate-400 text-center font-mono">005</td>
                          <td className="py-1.5 px-2">ADICIONAL ANTIGÜEDAD</td>
                          <td className="py-1.5 px-2 text-right text-slate-400">{inputs.antiguedad}%</td>
                          <td className="py-1.5 px-3 text-right text-emerald-700">{formatCurrency(result.antiguedadMonto)}</td>
                          <td className="py-1.5 px-3 text-right">-</td>
                          <td className="py-1.5 px-4 text-right">-</td>
                        </tr>
                      )}

                      {result.horasExtras50Monto > 0 && (
                        <tr>
                          <td className="py-1.5 px-4 text-slate-400 text-center font-mono">012</td>
                          <td className="py-1.5 px-2">HORAS EXTRAS AL 50%</td>
                          <td className="py-1.5 px-2 text-right text-slate-400">{inputs.horasExtras50} hs</td>
                          <td className="py-1.5 px-3 text-right text-emerald-700">{formatCurrency(result.horasExtras50Monto)}</td>
                          <td className="py-1.5 px-3 text-right">-</td>
                          <td className="py-1.5 px-4 text-right">-</td>
                        </tr>
                      )}

                      {result.horasExtras100Monto > 0 && (
                        <tr>
                          <td className="py-1.5 px-4 text-slate-400 text-center font-mono">013</td>
                          <td className="py-1.5 px-2">HORAS EXTRAS AL 100% / FERIADOS</td>
                          <td className="py-1.5 px-2 text-right text-slate-400">{inputs.horasExtras100} hs</td>
                          <td className="py-1.5 px-3 text-right text-emerald-700">{formatCurrency(result.horasExtras100Monto)}</td>
                          <td className="py-1.5 px-3 text-right">-</td>
                          <td className="py-1.5 px-4 text-right">-</td>
                        </tr>
                      )}

                      {result.plusNocturnoMonto > 0 && (
                        <tr>
                          <td className="py-1.5 px-4 text-slate-400 text-center font-mono">018</td>
                          <td className="py-1.5 px-2">PLUS NOCTURNO CCT (35%)</td>
                          <td className="py-1.5 px-2 text-right text-slate-400">{inputs.horasNocturnas} hs</td>
                          <td className="py-1.5 px-3 text-right text-emerald-700">{formatCurrency(result.plusNocturnoMonto)}</td>
                          <td className="py-1.5 px-3 text-right">-</td>
                          <td className="py-1.5 px-4 text-right">-</td>
                        </tr>
                      )}

                      {result.aeroportuarioMonto > 0 && (
                        <tr>
                          <td className="py-1.5 px-4 text-slate-400 text-center font-mono">025</td>
                          <td className="py-1.5 px-2">ADICIONAL AEROPORTUARIO</td>
                          <td className="py-1.5 px-2 text-right text-slate-400">Mes</td>
                          <td className="py-1.5 px-3 text-right text-emerald-700">{formatCurrency(result.aeroportuarioMonto)}</td>
                          <td className="py-1.5 px-3 text-right">-</td>
                          <td className="py-1.5 px-4 text-right">-</td>
                        </tr>
                      )}

                      {result.adNeuquenMonto > 0 && (
                        <tr>
                          <td className="py-1.5 px-4 text-slate-400 text-center font-mono">028</td>
                          <td className="py-1.5 px-2">ADICIONAL ZONA NEUQUÉN</td>
                          <td className="py-1.5 px-2 text-right text-slate-400">Mes</td>
                          <td className="py-1.5 px-3 text-right text-emerald-700">{formatCurrency(result.adNeuquenMonto)}</td>
                          <td className="py-1.5 px-3 text-right">-</td>
                          <td className="py-1.5 px-4 text-right">-</td>
                        </tr>
                      )}

                      {result.plusVacacionalMonto > 0 && (
                        <tr>
                          <td className="py-1.5 px-4 text-slate-400 text-center font-mono">035</td>
                          <td className="py-1.5 px-2">ADICIONAL PLUS VACACIONAL</td>
                          <td className="py-1.5 px-2 text-right text-slate-400">Fijo</td>
                          <td className="py-1.5 px-3 text-right text-emerald-700">{formatCurrency(result.plusVacacionalMonto)}</td>
                          <td className="py-1.5 px-3 text-right">-</td>
                          <td className="py-1.5 px-4 text-right">-</td>
                        </tr>
                      )}

                      {/* No Remunerativos */}
                      <tr>
                        <td className="py-1.5 px-4 text-slate-400 text-center font-mono">105</td>
                        <td className="py-1.5 px-2">
                          VIÁTICOS DE CONVENIO
                          {result.viaticoDescuento > 0 && (
                            <span className="text-[9px] text-red-500 block font-sans">
                              (Dcto. Vacaciones {inputs.diasVacaciones}d: -{formatCurrency(result.viaticoDescuento)})
                            </span>
                          )}
                        </td>
                        <td className="py-1.5 px-2 text-right text-slate-400">
                          {result.viaticoDescuento > 0 ? `${30 - inputs.diasVacaciones} d` : "30 d"}
                        </td>
                        <td className="py-1.5 px-3 text-right">-</td>
                        <td className="py-1.5 px-3 text-right text-amber-700">{formatCurrency(result.viaticoFinal)}</td>
                        <td className="py-1.5 px-4 text-right">-</td>
                      </tr>

                      <tr>
                        <td className="py-1.5 px-4 text-slate-400 text-center font-mono">109</td>
                        <td className="py-1.5 px-2">ADICIONAL NO REMUNERATIVO</td>
                        <td className="py-1.5 px-2 text-right text-slate-400">Mes</td>
                        <td className="py-1.5 px-3 text-right">-</td>
                        <td className="py-1.5 px-3 text-right text-amber-700">{formatCurrency(result.adiNoRem)}</td>
                        <td className="py-1.5 px-4 text-right">-</td>
                      </tr>

                      {/* Retenciones / Deducciones */}
                      <tr>
                        <td className="py-1.5 px-4 text-slate-400 text-center font-mono">501</td>
                        <td className="py-1.5 px-2">APORTE JUBILACIÓN</td>
                        <td className="py-1.5 px-2 text-right text-slate-400">11%</td>
                        <td className="py-1.5 px-3 text-right">-</td>
                        <td className="py-1.5 px-3 text-right">-</td>
                        <td className="py-1.5 px-4 text-right text-red-700">{formatCurrency(result.deduccionJubilacion)}</td>
                      </tr>

                      <tr>
                        <td className="py-1.5 px-4 text-slate-400 text-center font-mono">502</td>
                        <td className="py-1.5 px-2">OBRA SOCIAL UPSRA/OTRA</td>
                        <td className="py-1.5 px-2 text-right text-slate-400">3%</td>
                        <td className="py-1.5 px-3 text-right">-</td>
                        <td className="py-1.5 px-3 text-right">-</td>
                        <td className="py-1.5 px-4 text-right text-red-700">{formatCurrency(result.deduccionObraSocial)}</td>
                      </tr>

                      <tr>
                        <td className="py-1.5 px-4 text-slate-400 text-center font-mono">503</td>
                        <td className="py-1.5 px-2">LEY 19032 (INSSJP)</td>
                        <td className="py-1.5 px-2 text-right text-slate-400">3%</td>
                        <td className="py-1.5 px-3 text-right">-</td>
                        <td className="py-1.5 px-3 text-right">-</td>
                        <td className="py-1.5 px-4 text-right text-red-700">{formatCurrency(result.deduccionLey19032)}</td>
                      </tr>

                      {inputs.tieneSindicato && (
                        <tr>
                          <td className="py-1.5 px-4 text-slate-400 text-center font-mono">504</td>
                          <td className="py-1.5 px-2">CUOTA SINDICAL SINDICATO</td>
                          <td className="py-1.5 px-2 text-right text-slate-400">2%</td>
                          <td className="py-1.5 px-3 text-right">-</td>
                          <td className="py-1.5 px-3 text-right">-</td>
                          <td className="py-1.5 px-4 text-right text-red-700">{formatCurrency(result.deduccionSindicato)}</td>
                        </tr>
                      )}

                    </tbody>
                  </table>
                </div>

                {/* Receipt Footers */}
                <div className="bg-slate-50 p-4 border-t border-slate-300 grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                  <div className="p-2 bg-white rounded border border-slate-200">
                    <span className="text-slate-400 block text-[9px] uppercase font-sans">Total Remunerativo (Bruto)</span>
                    <strong className="text-slate-800 text-sm">{formatCurrency(result.subtotalRemunerativo)}</strong>
                  </div>
                  <div className="p-2 bg-white rounded border border-slate-200">
                    <span className="text-slate-400 block text-[9px] uppercase font-sans">Total No Remunerativo</span>
                    <strong className="text-slate-800 text-sm">{formatCurrency(result.subtotalNoRemunerativo)}</strong>
                  </div>
                  <div className="p-2 bg-white rounded border border-slate-200">
                    <span className="text-slate-400 block text-[9px] uppercase font-sans">Total Retenciones (17%{inputs.tieneSindicato ? ' + 2%' : ''})</span>
                    <strong className="text-red-700 text-sm">-{formatCurrency(result.totalDeducciones)}</strong>
                  </div>
                </div>

                {/* Net pocket pay */}
                <div className="bg-slate-900 text-white px-5 py-4 flex flex-col sm:flex-row justify-between items-center gap-3">
                  <div className="flex items-center gap-2.5">
                    <div className="bg-emerald-500 text-slate-950 p-1.5 rounded">
                      <Calculator className="w-5 h-5" />
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 font-sans uppercase tracking-wider block">Sueldo Neto Liquidado (De Bolsillo)</span>
                      <span className="text-xs text-emerald-400 font-sans font-normal">Fórmula: (Remunerativo - Retenciones) + No Remunerativo</span>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="text-2xl font-black text-emerald-400">{formatCurrency(result.sueldoNeto)}</span>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            /* DETAILED MATHEMATICAL BREAKDOWN PANEL */
            <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-sm space-y-6">
              <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
                <FileText className="w-5 h-5 text-indigo-600" />
                <div>
                  <h3 className="text-sm font-semibold text-slate-800">Desglose de Operaciones y Fórmulas</h3>
                  <p className="text-[11px] text-slate-500 font-sans">Matemática explícita y lógica de liquidación aplicada</p>
                </div>
              </div>

              {/* Steps Accordion-like blocks */}
              <div className="space-y-4 text-xs">
                
                {/* Antiguedad */}
                <div className="p-4 bg-slate-50 rounded-xl border border-slate-150 space-y-2">
                  <h4 className="font-semibold text-slate-800 flex items-center justify-between">
                    <span>1. Adicional por Antigüedad</span>
                    <span className="bg-indigo-50 text-indigo-700 text-[10px] font-mono px-2 py-0.5 rounded">1% por año</span>
                  </h4>
                  <p className="text-slate-600">
                    Se calcula aplicando el 1% del sueldo básico por la cantidad de años de servicio del vigilador:
                  </p>
                  <div className="p-2.5 bg-white rounded border border-slate-200 font-mono text-[11px]">
                    <p className="text-slate-400">Fórmula: Básico * 0.01 * Años</p>
                    <p className="text-slate-800 font-semibold mt-1">
                      {formatCurrency(result.basico)} * 0.01 * {inputs.antiguedad} = {formatCurrency(result.antiguedadMonto)}
                    </p>
                  </div>
                </div>

                {/* Hora Base */}
                <div className="p-4 bg-slate-50 rounded-xl border border-slate-150 space-y-2">
                  <h4 className="font-semibold text-slate-800 flex items-center justify-between">
                    <span>2. Determinación de Hora Base</span>
                    <span className="bg-indigo-50 text-indigo-700 text-[10px] font-mono px-2 py-0.5 rounded">Básico / 200hs</span>
                  </h4>
                  <p className="text-slate-600">
                    El valor de la hora base se obtiene dividiendo el sueldo básico del mes por la jornada legal de 200 horas mensuales:
                  </p>
                  <div className="p-2.5 bg-white rounded border border-slate-200 font-mono text-[11px]">
                    <p className="text-slate-400">Fórmula: Básico / 200</p>
                    <p className="text-slate-800 font-semibold mt-1">
                      {formatCurrency(result.basico)} / 200 = {formatCurrency(result.horaBase)} / hora
                    </p>
                  </div>
                </div>

                {/* Horas Extras 50% */}
                <div className="p-4 bg-slate-50 rounded-xl border border-slate-150 space-y-2">
                  <h4 className="font-semibold text-slate-800 flex items-center justify-between">
                    <span>3. Horas Extras al 50%</span>
                    <span className="bg-indigo-50 text-indigo-700 text-[10px] font-mono px-2 py-0.5 rounded">Hora Base * 1.5</span>
                  </h4>
                  <p className="text-slate-600">
                    Las horas extras en días hábiles se abonan con un recargo del 50% sobre el valor de la hora base:
                  </p>
                  <div className="p-2.5 bg-white rounded border border-slate-200 font-mono text-[11px]">
                    <p className="text-slate-400">Fórmula: Hora Base * 1.5 * Cantidad de Horas</p>
                    <p className="text-slate-850 mt-1">
                      Cálculo Unitario: {formatCurrency(result.horaBase)} * 1.5 = {formatCurrency(result.horaBase * 1.5)} por hora extra 50%
                    </p>
                    <p className="text-slate-850 font-semibold mt-1 text-slate-900 border-t border-slate-100 pt-1">
                      Total ({inputs.horasExtras50} hs): {formatCurrency(result.horaBase * 1.5)} * {inputs.horasExtras50} = {formatCurrency(result.horasExtras50Monto)}
                    </p>
                  </div>
                </div>

                {/* Horas Extras 100% / Feriados */}
                <div className="p-4 bg-slate-50 rounded-xl border border-slate-150 space-y-2">
                  <h4 className="font-semibold text-slate-800 flex items-center justify-between">
                    <span>4. Horas Extras al 100% o Feriados</span>
                    <span className="bg-indigo-50 text-indigo-700 text-[10px] font-mono px-2 py-0.5 rounded">Hora Base * 2</span>
                  </h4>
                  <p className="text-slate-600">
                    Las horas trabajadas en días domingos, feriados nacionales o francos se liquidan con un incremento del 100% sobre la hora base:
                  </p>
                  <div className="p-2.5 bg-white rounded border border-slate-200 font-mono text-[11px]">
                    <p className="text-slate-400">Fórmula: Hora Base * 2 * Cantidad de Horas</p>
                    <p className="text-slate-850 mt-1">
                      Cálculo Unitario: {formatCurrency(result.horaBase)} * 2 = {formatCurrency(result.horaBase * 2)} por hora extra 100%
                    </p>
                    <p className="text-slate-850 font-semibold mt-1 text-slate-900 border-t border-slate-100 pt-1">
                      Total ({inputs.horasExtras100} hs): {formatCurrency(result.horaBase * 2)} * {inputs.horasExtras100} = {formatCurrency(result.horasExtras100Monto)}
                    </p>
                  </div>
                </div>

                {/* Plus Nocturno */}
                <div className="p-4 bg-slate-50 rounded-xl border border-slate-150 space-y-2">
                  <h4 className="font-semibold text-slate-800 flex items-center justify-between">
                    <span>5. Plus Nocturno (de 21:00 a 06:00 hs)</span>
                    <span className="bg-indigo-50 text-indigo-700 text-[10px] font-mono px-2 py-0.5 rounded">Adicional 35%</span>
                  </h4>
                  <p className="text-slate-600">
                    De acuerdo al CCT 507/07, por cada hora trabajada en jornada nocturna se abona un plus del 35% sobre el valor de la hora base:
                  </p>
                  <div className="p-2.5 bg-white rounded border border-slate-200 font-mono text-[11px]">
                    <p className="text-slate-400">Fórmula: Hora Base * 0.35 * Cantidad de Horas</p>
                    <p className="text-slate-850 mt-1">
                      Adicional Unitario: {formatCurrency(result.horaBase)} * 0.35 = {formatCurrency(result.horaBase * 0.35)} por hora nocturna
                    </p>
                    <p className="text-slate-850 font-semibold mt-1 text-slate-900 border-t border-slate-100 pt-1">
                      Total ({inputs.horasNocturnas} hs): {formatCurrency(result.horaBase * 0.35)} * {inputs.horasNocturnas} = {formatCurrency(result.plusNocturnoMonto)}
                    </p>
                  </div>
                </div>

                {/* Descuento de Viáticos */}
                <div className="p-4 bg-slate-50 rounded-xl border border-slate-150 space-y-2">
                  <h4 className="font-semibold text-slate-800 flex items-center justify-between">
                    <span>6. Descuento de Viáticos por Vacaciones</span>
                    <span className="bg-red-50 text-red-700 text-[10px] font-mono px-2 py-0.5 rounded">Resta de Viático Diario</span>
                  </h4>
                  <p className="text-slate-600">
                    Si el empleado tiene días de vacaciones, se calcula el valor diario de viáticos (Total del mes / 30) y se le descuentan los días de vacaciones. A cambio, recibe el plus vacacional fijo:
                  </p>
                  <div className="p-2.5 bg-white rounded border border-slate-200 font-mono text-[11px]">
                    <p className="text-slate-400">Fórmula Viático Diario: Viático Mensual / 30</p>
                    <p className="text-slate-850 mt-1">
                      Viático Diario: {formatCurrency(result.viaticoOriginal)} / 30 = {formatCurrency(result.viaticoOriginal / 30)}
                    </p>
                    <p className="text-slate-850 mt-1 border-t border-slate-100 pt-1">
                      Descuento ({inputs.diasVacaciones} días de Vacaciones): {formatCurrency(result.viaticoOriginal / 30)} * {inputs.diasVacaciones} = -{formatCurrency(result.viaticoDescuento)}
                    </p>
                    <p className="text-slate-850 font-semibold mt-1 text-slate-900">
                      Viático Final Neto: {formatCurrency(result.viaticoOriginal)} - {formatCurrency(result.viaticoDescuento)} = {formatCurrency(result.viaticoFinal)}
                    </p>
                  </div>
                </div>

                {/* Adicional Vacacional */}
                <div className="p-4 bg-slate-50 rounded-xl border border-slate-150 space-y-2">
                  <h4 className="font-semibold text-slate-800 flex items-center justify-between">
                    <span>7. Adicional Vacacional Fijo</span>
                    <span className="bg-indigo-50 text-indigo-700 text-[10px] font-mono px-2 py-0.5 rounded">Suma fija de mes</span>
                  </h4>
                  <p className="text-slate-600">
                    Asignado de forma independiente según el mes, únicamente si se registra al menos 1 día de vacaciones:
                  </p>
                  <div className="p-2.5 bg-white rounded border border-slate-200 font-mono text-[11px]">
                    <p className="text-slate-400">Fórmula: Suma Fija (si Vacaciones &gt; 0)</p>
                    <p className="text-slate-800 font-semibold mt-1">
                      {inputs.diasVacaciones > 0 ? `Vacaciones activas. Se suma: ${formatCurrency(result.plusVacacionalMonto)}` : "No registra vacaciones (monto: $0)"}
                    </p>
                  </div>
                </div>

              </div>
            </div>
          )}

        </section>

      </main>

      {/* FOOTER */}
      <footer className="bg-slate-900 text-slate-450 text-center py-4 text-xs border-t border-slate-800 shrink-0">
        <p className="text-slate-400">
          Sueldo Seguro AI &copy; 2026 - Desarrollado bajo las escalas salariales vigentes para Seguridad Privada de la República Argentina (CCT 507/07)
        </p>
        <p className="text-[10px] text-slate-500 mt-1">
          La presente herramienta sirve como simulador de referencia estimativo y de soporte didáctico con Inteligencia Artificial. No reemplaza un recibo formal.
        </p>
      </footer>
    </div>
  );
}
