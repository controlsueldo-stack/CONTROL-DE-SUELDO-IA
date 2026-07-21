import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, Type } from "@google/genai";
import dotenv from "dotenv";
import { SALARY_DATABASE } from "./src/salaryData";

dotenv.config();

const app = express();
app.use(express.json());

const PORT = 3000;

// Lazy initialization helper for Gemini SDK
let aiInstance: GoogleGenAI | null = null;
function getGeminiClient() {
  if (!aiInstance) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error("GEMINI_API_KEY environment variable is required. Please set it in the Secrets panel.");
    }
    aiInstance = new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        },
      },
    });
  }
  return aiInstance;
}

// System Instruction for Sueldo Seguro AI
const SYSTEM_INSTRUCTION = `
Eres "Sueldo Seguro AI", un asistente experto en la liquidación de sueldos de vigiladores bajo el Convenio Colectivo de Trabajo de Seguridad Privada (CCT 507/07) de Argentina.
Tu objetivo es guiar amablemente al usuario para recopilar sus novedades mensuales y realizar el cálculo exacto de su sueldo de bolsillo.

--- PROCESO DE INTERACCIÓN OBLIGATORIO ---
Cuando el usuario inicie la conversación, te salude o indique su mes y categoría, NO debes calcular nada todavía.
Primero debes saludar amablemente y pedirle de forma muy clara y ordenada en una lista los siguientes datos específicos que faltan para poder calcular:
1. Años de antigüedad.
2. Cantidad de horas extras realizadas (diferenciando si son al 50% o al 100% por feriados).
3. Si tuvo vacaciones en ese mes, indicar cuántos días (para aplicar el Adicional Vacacional y el descuento de viáticos).
4. Cantidad de horas nocturnas trabajadas (entre las 21:00 y las 06:00 hs).

Solo cuando el usuario te provea estos datos (o te indique explícitamente que no tuvo ninguno), procederás a realizar el cálculo detallado utilizando la base de datos que tienes disponible abajo.

--- BASE DE DATOS SALARIAL CCT 507/07 (JULIO - DICIEMBRE 2026) ---
${JSON.stringify(SALARY_DATABASE, null, 2)}

--- REGLAS LÓGICAS DE CÁLCULO (MANDATORIAS) ---
1. Antigüedad: Se calcula como el 1% del Sueldo Básico correspondiente por cada año de antigüedad acumulado. (Antiguedad = Basico * 0.01 * años).
2. Valor de la Hora Base: Sueldo Básico dividido 200.
3. Horas Extras al 50%: Se calculan sobre el valor de la hora base incrementado en un 50%. (Monto = Hora Base * 1.5 * cantidad de horas).
4. Horas Extras al 100% / Feriado Trabajado: Se calculan sobre el valor de la hora base incrementado en un 100%. (Monto = Hora Base * 2 * cantidad de horas).
5. Plus Nocturno: Por cada hora nocturna trabajada (de 21:00 a 06:00 hs), se abona un adicional del 35% sobre el valor de la hora base. (Monto = Hora Base * 0.35 * cantidad de horas nocturnas).
6. Adicional Vacacional (Plus Vacacional): Es un valor de suma fija no acumulativo que corresponde exclusivamente según el mes liquidado indicado en la tabla. Solo se suma si el usuario confirma que tuvo vacaciones (días > 0). Debe figurar como un ítem independiente.
7. Descuento de Viático por Vacaciones: Si el usuario indica días de vacaciones, se debe calcular el viático diario (Monto de Viático del mes / 30) y luego multiplicar ese valor por los días de vacaciones. El resultado total obtenido se debe RESTAR del total de viáticos asignados para el mes.

--- REQUISITO DE RESPUESTA ---
Siempre que hagas el cálculo, debes desglosar la matemática paso a paso antes de dar el total definitivo. Presenta la información de la siguiente manera:
1. Identificación de Mes y Categoría elegida.
2. Valores base asignados (Básico, Presentismo, Viáticos con el descuento explícito aplicado por vacaciones si corresponde, No Remunerativo).
3. Desglose matemático explícito de cada adicional cargado (Antigüedad, Horas Extra al 50%/100%, Horas Nocturnas, Plus Vacacional si corresponde).
4. Resumen final consolidado con claridad de los Haberes Remunerativos, Deducciones habituales de Argentina (Jubilación 11%, Obra Social 3%, Ley 19032 3%, totalizando 17% de deducciones sobre lo remunerativo), Haberes No Remunerativos y el Sueldo Neto (de bolsillo) resultante.

--- FORMATO DE SALIDA (OBLIGATORIO) ---
Debes responder SIEMPRE en formato JSON con la siguiente estructura:
{
  "text": "Tu respuesta conversacional con formato Markdown que se le mostrará al usuario en el chat. Debe ser amigable, empática y respetar el proceso obligatorio.",
  "detectedFields": {
    "month": "JULIO" | "AGOSTO" | "SEPTIEMBRE" | "OCTUBRE" | "NOVIEMBRE" | "DICIEMBRE" | null,
    "category": "Vigilador General / Controlador Admisión" | "Vigilador Bombero / Verif. Eventos / Op. Monitoreo" | "Administrativo / Guía Técnico" | "Vigilador Principal / Instalador Sistemas" | null,
    "antiguedad": number | null,
    "horasExtras50": number | null,
    "horasExtras100": number | null,
    "horasNocturnas": number | null,
    "diasVacaciones": number | null
  }
}

Si detectas que el usuario menciona alguno de estos campos en su mensaje, extraelo y colócalo en 'detectedFields' para que podamos actualizar los controles de su simulador. Si no detectas alguno de los campos, ponlos como null.
`;

// API routes
app.post("/api/chat", async (req, res) => {
  try {
    const { messages, currentState } = req.body;
    
    if (!messages || !Array.isArray(messages)) {
      return res.status(400).json({ error: "El historial de mensajes es requerido." });
    }

    const ai = getGeminiClient();

    // Map conversation messages to Gemini contents format
    // We append the system instruction and current form state context to the chat config
    const geminiContents = messages.map(msg => ({
      role: msg.role === "assistant" ? "model" as const : "user" as const,
      parts: [{ text: msg.content }]
    }));

    // Inject current UI state into the last user message or as a system hint to make the AI smart
    const stateContext = currentState ? `\n\n[CONTEXTO DE ESTADO ACTUAL EN PANTALLA]: El usuario tiene seleccionados estos valores en la calculadora actual (si el usuario te dice algo que lo contradice, dale prioridad a lo que escribe, pero usa esto para saber qué tiene preseleccionado):
- Mes: ${currentState.month}
- Categoría: ${currentState.category}
- Antigüedad: ${currentState.antiguedad} años
- Horas Extras 50%: ${currentState.horasExtras50}
- Horas Extras 100%: ${currentState.horasExtras100}
- Horas Nocturnas: ${currentState.horasNocturnas}
- Días de Vacaciones: ${currentState.diasVacaciones}
` : '';

    if (geminiContents.length > 0 && stateContext) {
      const lastMsg = geminiContents[geminiContents.length - 1];
      if (lastMsg.role === "user") {
        lastMsg.parts[0].text += stateContext;
      }
    }

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: geminiContents,
      config: {
        systemInstruction: SYSTEM_INSTRUCTION,
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            text: {
              type: Type.STRING,
              description: "The Markdown-formatted conversational response from the assistant in Spanish."
            },
            detectedFields: {
              type: Type.OBJECT,
              description: "Fields extracted from the user's latest inputs to synchronize the form state.",
              properties: {
                month: { type: Type.STRING, description: "Extract month name in Spanish uppercase if mentioned (JULIO, AGOSTO, SEPTIEMBRE, OCTUBRE, NOVIEMBRE, DICIEMBRE)." },
                category: { type: Type.STRING, description: "Extract category if mentioned (must match exactly one of the CCT categories)." },
                antiguedad: { type: Type.INTEGER, description: "Extract years of seniority if mentioned." },
                horasExtras50: { type: Type.INTEGER, description: "Extract hours extra 50% if mentioned." },
                horasExtras100: { type: Type.INTEGER, description: "Extract hours extra 100% or holidays if mentioned." },
                horasNocturnas: { type: Type.INTEGER, description: "Extract night shift hours if mentioned." },
                diasVacaciones: { type: Type.INTEGER, description: "Extract vacation days if mentioned." }
              }
            }
          },
          required: ["text", "detectedFields"]
        }
      }
    });

    const jsonText = response.text || "{}";
    const resultObj = JSON.parse(jsonText.trim());
    
    return res.json(resultObj);

  } catch (error: any) {
    console.error("Gemini API Error:", error);
    return res.status(500).json({
      error: error.message || "Ocurrió un error al procesar tu solicitud con el asistente de Inteligencia Artificial."
    });
  }
});

// Serve frontend build and assets
async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    // Development Mode with Vite middleware
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
    console.log("Vite development middleware loaded.");
  } else {
    // Production Mode serving compiled static assets
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
    console.log("Serving static production assets from /dist.");
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Sueldo Seguro AI server running at http://localhost:${PORT}`);
  });
}

startServer();
