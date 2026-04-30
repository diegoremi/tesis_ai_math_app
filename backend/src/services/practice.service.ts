import axios from "axios";
import crypto from "crypto";
import {
  AssessmentType,
  EducationLevel,
  PracticeItemStatus,
  DifficultyLevel,
} from "@prisma/client";
import { prisma } from '../lib/prisma.js';

const logPractice = (...args: unknown[]) => {
  console.log("[practice]", ...args);
};

const extractJsonString = (raw: string): string => {
  if (!raw) {
    throw new Error("Respuesta vacía del modelo");
  }
  let text = raw.trim();
  const fenced = text.match(/```(?:json)?\s*([\s\S]*?)```/i);
  if (fenced) {
    text = (fenced[1] ?? "").trim();
  }
  const firstBrace = text.indexOf("{");
  const lastBrace = text.lastIndexOf("}");
  if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
    text = text.slice(firstBrace, lastBrace + 1);
  }
  return text;
};

type Topic = "aritmética" | "porcentajes" | "álgebra";
type Difficulty = "basico" | "medio";

type PracticeOption = { key: string; text: string };

type PracticeItem = {
  id: string;
  stem: string;
  options: PracticeOption[];
  correct_key: "A" | "B" | "C" | "D";
  explain_correct: string;
  explain_incorrect: Record<"A" | "B" | "C" | "D", string>;
  meta: {
    domain: Topic;
    skill:
      | "operaciones"
      | "razones_y_porcentajes"
      | "ecuaciones_lineales"
      | "simplificacion";
    estimated_time_sec: number;
  };
};

type PracticePayload = {
  session_id: string;
  seed: number;
  locale: "es-PE";
  topic: Topic;
  difficulty: Difficulty;
  items: PracticeItem[];
};

type GenerationContext = {
  userId: number;
  edad: number;
  nivel_formacion: string;
  objetivo_usuario: string;
  puntaje_pretest: number;
  dominios_debiles: Topic[];
  topic: Topic;
  difficulty: Difficulty;
};

const DEFAULT_TOPICS: Topic[] = ["aritmética", "porcentajes", "álgebra"];

const topicDifficulty: Record<Topic, DifficultyLevel> = {
  aritmética: "basic",
  porcentajes: "intermediate",
  álgebra: "advanced",
};

const provider = (process.env.AI_PROVIDER ?? "openai").toLowerCase();

const isPracticeOption = (value: unknown): value is PracticeOption => {
  return (
    typeof value === "object" &&
    value !== null &&
    typeof (value as PracticeOption).key === "string" &&
    typeof (value as PracticeOption).text === "string"
  );
};

const isPracticeItem = (value: unknown): value is PracticeItem => {
  if (typeof value !== "object" || value === null) {
    return false;
  }
  const item = value as PracticeItem;
  if (
    typeof item.id !== "string" ||
    typeof item.stem !== "string" ||
    !Array.isArray(item.options) ||
    item.options.length !== 4 ||
    !item.options.every(isPracticeOption)
  ) {
    return false;
  }
  if (!["A", "B", "C", "D"].includes(item.correct_key)) {
    return false;
  }
  if (typeof item.explain_correct !== "string") {
    return false;
  }
  const incorrect = item.explain_incorrect;
  if (
    typeof incorrect !== "object" ||
    incorrect === null ||
    !["A", "B", "C", "D"].every(
      (key) => typeof incorrect[key as "A"] === "string"
    )
  ) {
    return false;
  }
  if (!item.meta || typeof item.meta !== "object") {
    return false;
  }
  const meta = item.meta;
  if (!["aritmética", "porcentajes", "álgebra"].includes(meta.domain)) {
    return false;
  }
  if (
    ![
      "operaciones",
      "razones_y_porcentajes",
      "ecuaciones_lineales",
      "simplificacion",
    ].includes(meta.skill)
  ) {
    return false;
  }
  if (typeof meta.estimated_time_sec !== "number") {
    return false;
  }
  return true;
};

const isPracticePayload = (value: unknown): value is PracticePayload => {
  if (typeof value !== "object" || value === null) {
    return false;
  }
  const payload = value as PracticePayload;
  if (
    typeof payload.session_id !== "string" ||
    typeof payload.seed !== "number" ||
    payload.locale !== "es-PE" ||
    !["aritmética", "porcentajes", "álgebra"].includes(payload.topic) ||
    !["basico", "medio"].includes(payload.difficulty) ||
    !Array.isArray(payload.items) ||
    payload.items.length === 0 ||
    !payload.items.every(isPracticeItem)
  ) {
    return false;
  }
  return true;
};

const mapEducationLevel = (level: EducationLevel | null): string => {
  switch (level) {
    case "high_school":
      return "secundaria completa";
    case "university":
      return "universitario";
    case "other":
    default:
      return "otro";
  }
};

export const mapDomainToTopic = (domain: string | null | undefined): Topic => {
  switch (domain) {
    case "proporciones_porcentajes":
    case "porcentajes":
    case "razones_y_porcentajes":
    case "porcentaje":
      return "porcentajes";
    case "algebra_basica":
    case "algebra":
    case "álgebra":
      return "álgebra";
    case "aritmetica_y_numeros":
    case "aritmetica":
    case "aritmética":
    case "operaciones":
    default:
      return "aritmética";
  }
};

const selectDifficulty = (accuracy: number | null | undefined): Difficulty => {
  if (accuracy !== undefined && accuracy !== null && accuracy >= 0.6) {
    return "medio";
  }
  return "basico";
};

const SYSTEM_PROMPT = `Eres un generador de ejercicios de matemáticas para adultos. Crea ítems de PRÁCTICA simples, de opción múltiple, alineados a aritmética, proporciones/porcentajes y álgebra básica. Cada ítem debe ser claro, sin trucos, con 1 sola respuesta correcta y 3 distractores plausibles. Muestra números razonables (enteros y decimales simples) y, si hay expresiones, usa LaTeX en el enunciado. Da siempre feedback que explique POR QUÉ la respuesta es correcta e indique el error típico de cada distractor.

Responde SIEMPRE en JSON válido que cumpla el “schema_salida” siguiente. No agregues comentarios, ni texto fuera del JSON. No inventes campos.

schema_salida:
{
  "session_id": "string",
  "seed": "number",
  "locale": "es-PE",
  "topic": "aritmética|porcentajes|álgebra",
  "difficulty": "basico|medio",
  "items": [
    {
      "id": "string",
      "stem": "string",
      "options": [
        {"key":"A","text":"string"},
        {"key":"B","text":"string"},
        {"key":"C","text":"string"},
        {"key":"D","text":"string"}
      ],
      "correct_key": "A|B|C|D",
      "explain_correct": "string",
      "explain_incorrect": {
        "A": "string", "B": "string", "C": "string", "D": "string"
      },
      "meta": {
        "domain": "aritmética|porcentajes|álgebra",
        "skill": "operaciones|razones_y_porcentajes|ecuaciones_lineales|simplificacion",
        "estimated_time_sec": 60
      }
    }
  ]
}`;

const buildUserPrompt = (
  context: GenerationContext,
  sessionId: string,
  seed: number,
  nItems: number
) => {
  return `
[USER]
Genera ${nItems} ejercicio(s) de práctica independientes con las siguientes condiciones:

Contexto del estudiante:
- edad: ${context.edad}
- nivel_formacion: ${context.nivel_formacion}
- objetivo_usuario: ${context.objetivo_usuario}
- resultado_pretest: ${context.puntaje_pretest}
- dominios_debiles: ${JSON.stringify(context.dominios_debiles)}

Parámetros de generación:
- session_id: "${sessionId}"
- seed: ${seed}
- locale: "es-PE"
- topic: "${context.topic}"
- difficulty: "${context.difficulty}"
- n_items: ${nItems}

Reglas:
1) 70% de los ítems deben enfocarse en los 2 dominios más débiles si coinciden con el “topic” actual.
2) Un (1) ítem = un (1) concepto/procedimiento. Nada de multi-pasos largos.
3) Distractores deben reflejar errores típicos (p. ej., operar mal el orden de operaciones, confundir 20% de aumento vs. 20% de descuento, error de despeje en ecuaciones).
4) Usa cantidades realistas (precios, tiempos, cantidades).
5) Devuelve SOLO JSON que cumpla “schema_salida”. No pongas comentarios, ni backticks, ni texto fuera del JSON.

Genera ahora.`;
};

const callOpenAI = async (
  systemPrompt: string,
  userPrompt: string
): Promise<string> => {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    throw new Error("OPENAI_API_KEY no configurada");
  }
  const model = process.env.OPENAI_MODEL || "gpt-4o-mini";
  const response = await axios.post(
    "https://api.openai.com/v1/chat/completions",
    {
      model,
      temperature: 0.7,
      response_format: { type: "json_object" },
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
    },
    {
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
    }
  );
  const content: string | undefined =
    response.data?.choices?.[0]?.message?.content?.trim();
  if (!content) {
    throw new Error("Respuesta vacía del modelo OpenAI");
  }
  return content;
};

const callGemini = async (
  systemPrompt: string,
  userPrompt: string
): Promise<string> => {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error("GEMINI_API_KEY no configurada");
  }
  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-flash-latest:generateContent?key=${apiKey}`;

  try {
    const response = await axios.post(
      url,
      {
        contents: [
          {
            role: "user",
            parts: [
              {
                // concatenamos el prompt maestro + el prompt de usuario
                text: `${systemPrompt}\n\n${userPrompt}`,
              },
            ],
          },
        ],
        generationConfig: {
          temperature: 0.7,
        },
      },
      {
        headers: { "Content-Type": "application/json" },
      }
    );

    const text =
      response.data?.candidates?.[0]?.content?.parts
        ?.map((part: { text?: string }) => part?.text || "")
        .join("")
        .trim() || "";

    if (!text) {
      throw new Error("Gemini devolvió una respuesta vacía");
    }
    return text;
  } catch (error) {
    if (axios.isAxiosError(error)) {
      const status = error.response?.status;
      const detail = error.response?.data;
      console.error("[practice] Gemini error payload", { status, detail });
      throw new Error(
        `Gemini error ${status ?? "unknown"}: ${JSON.stringify(detail)}`
      );
    }
    throw error;
  }
};

const callLLM = async (
  systemPrompt: string,
  userPrompt: string
): Promise<string> => {
  if (provider === "gemini") {
    return callGemini(systemPrompt, userPrompt);
  }
  if (provider === "openai") {
    return callOpenAI(systemPrompt, userPrompt);
  }
  throw new Error(`AI_PROVIDER ${provider} no soportado todavía`);
};

const computeWeakDomains = (
  responses: { is_correct: boolean | null; item: { domain: string | null } }[]
): Topic[] => {
  if (!responses.length) {
    return DEFAULT_TOPICS;
  }
  const stats = new Map<Topic, { correct: number; total: number }>();
  responses.forEach((response) => {
    const topic = mapDomainToTopic(response.item.domain);
    const entry = stats.get(topic) ?? { correct: 0, total: 0 };
    stats.set(topic, {
      correct: entry.correct + (response.is_correct ? 1 : 0),
      total: entry.total + 1,
    });
  });
  const ordered = Array.from(stats.entries())
    .map(([topic, { correct, total }]) => ({
      topic,
      accuracy: total ? correct / total : 0,
    }))
    .sort((a, b) => a.accuracy - b.accuracy);
  const weakest = ordered.slice(0, 2).map((entry) => entry.topic);
  return weakest.length ? weakest : DEFAULT_TOPICS;
};

const gatherContext = async (userId: number): Promise<GenerationContext> => {
  const user = await prisma.user.findUnique({ where: { user_id: userId } });
  const edad = user?.age ?? 22;
  const nivel_formacion = mapEducationLevel(user?.education_level ?? null);
  const objetivo_usuario = user?.goal ?? "mejorar mi desempeño en matemática";

  const pretest = await prisma.assessment.findFirst({
    where: { user_id: userId, assessment_type: AssessmentType.pretest },
    orderBy: { created_at: "desc" },
    include: {
      responses: {
        include: {
          item: true,
        },
      },
    },
  });

  const puntaje_pretest = pretest?.total_score ?? 0;
  const dominios_debiles = computeWeakDomains(pretest?.responses ?? []);
  const topic = dominios_debiles[0] ?? "aritmética";

  const accuracy = (() => {
    if (!pretest || !pretest.responses.length) {
      return null;
    }
    const total = pretest.responses.length;
    const correct = pretest.responses.reduce(
      (acc, curr) => acc + (curr.is_correct ? 1 : 0),
      0
    );
    return total ? correct / total : null;
  })();

  const difficulty = selectDifficulty(accuracy);

  return {
    userId,
    edad,
    nivel_formacion,
    objetivo_usuario,
    puntaje_pretest,
    dominios_debiles,
    topic,
    difficulty,
  };
};

const storeGeneratedItem = async (
  userId: number,
  sessionId: string,
  topic: Topic,
  difficulty: Difficulty,
  item: PracticeItem
) => {
  return prisma.practiceGenerated.create({
    data: {
      user_id: userId,
      session_id: sessionId,
      topic,
      difficulty,
      item_json: item,
    },
  });
};

const fallbackFromSeed = async (preferredTopic?: Topic): Promise<PracticeItem> => {
  const candidates = await prisma.assessmentItem.findMany({
    where: { test_version: "practice_v1" },
    orderBy: { item_id: "asc" },
  });

  if (!candidates.length) {
    throw new Error("No hay ejercicios de práctica configurados");
  }

  const filtered = preferredTopic
    ? candidates.filter((item) => mapDomainToTopic(item.domain ?? null) === preferredTopic)
    : candidates;

  const pool = filtered.length ? filtered : candidates;
  const fallbackItem = pool[Math.floor(Math.random() * pool.length)]!;

  const optionsArray = Array.isArray(fallbackItem.options)
    ? (fallbackItem.options as Array<Record<string, unknown>>)
    : [];

  const normalizedOptions: PracticeOption[] = optionsArray.map((raw, index) => {
    const key =
      typeof raw?.key === "string"
        ? raw.key
        : ["A", "B", "C", "D"][index] ?? "A";
    const textCandidate =
      typeof raw?.text === "string"
        ? raw.text
        : typeof raw?.label === "string"
        ? (raw.label as string)
        : String(raw ?? "");
    return {
      key,
      text: textCandidate,
    };
  });

  const topic = mapDomainToTopic(fallbackItem.domain ?? null);

  return {
    id: `LEGACY-${fallbackItem.item_id}`,
    stem: fallbackItem.stem,
    options: normalizedOptions,
    correct_key: (
      fallbackItem.correct_key || "A"
    ).toUpperCase() as PracticeItem["correct_key"],
    explain_correct:
      "Revisa el procedimiento paso a paso y verifica tus cálculos.",
    explain_incorrect: {
      A: "Analiza si aplicaste la operación correcta.",
      B: "Analiza si aplicaste la operación correcta.",
      C: "Analiza si aplicaste la operación correcta.",
      D: "Analiza si aplicaste la operación correcta.",
    },
    meta: {
      domain: topic,
      skill: "operaciones",
      estimated_time_sec: 60,
    },
  };
};

export const fetchNextPracticeItem = async (userId: number) => {
  let candidate = await prisma.practiceGenerated.findFirst({
    where: { user_id: userId, status: PracticeItemStatus.generated },
    orderBy: { created_at: "asc" },
  });

  const featureFlags = await prisma.featureFlag.findUnique({
    where: { user_id: userId },
  });
  const adaptativoEnabled = featureFlags?.adaptativo ?? false;

  const context = await gatherContext(userId);
  let sessionId = crypto.randomUUID();

  if (!candidate) {
    if (!adaptativoEnabled) {
      const fallback = await fallbackFromSeed(context.topic);
      candidate = await storeGeneratedItem(
        userId,
        sessionId,
        fallback.meta.domain,
        context.difficulty,
        fallback
      );
      logPractice("serving control fallback item", {
        userId,
        sessionId,
        topic: fallback.meta.domain,
        difficulty: context.difficulty,
      });
    } else {
      logPractice("no pending item, generating via LLM", { userId });
      const seed = Math.floor(Math.random() * 1_000_000_000);
      const userPrompt = buildUserPrompt(context, sessionId, seed, 1);

      try {
        const raw = await callLLM(SYSTEM_PROMPT, userPrompt);
        const parsed = JSON.parse(extractJsonString(raw));
        if (!isPracticePayload(parsed)) {
          throw new Error("Payload IA inválido");
        }
        if (!parsed.items.length) {
          throw new Error("Payload IA sin items");
        }
        const item = parsed.items[0]!;
        candidate = await storeGeneratedItem(
          context.userId,
          parsed.session_id,
          parsed.topic,
          parsed.difficulty,
          item
        );
        logPractice("generated item via LLM", {
          userId,
          sessionId: parsed.session_id,
          topic: parsed.topic,
          difficulty: parsed.difficulty,
          itemId: item.id,
        });
      } catch (error) {
        console.error("[practice] LLM failure, using fallback", {
          userId,
          error: (error as Error).message,
        });
        const fallback = await fallbackFromSeed(context.topic);
        candidate = await storeGeneratedItem(
          userId,
          sessionId,
          fallback.meta.domain,
          context.difficulty,
          fallback
        );
        logPractice("fallback item served", {
          userId,
          sessionId,
          topic: fallback.meta.domain,
          itemId: fallback.id,
        });
      }
    }
  }

  const item = candidate.item_json as PracticeItem;
  logPractice("serving practice item", {
    userId,
    practiceGeneratedId: candidate.practice_generated_id,
    sessionId: candidate.session_id,
    topic: item.meta.domain,
    difficulty: candidate.difficulty,
  });
  return {
    record: candidate,
    item,
  };
};

const incrementActivityAggregate = async (
  userId: number,
  domain: Topic,
  competency: PracticeItem["meta"]["skill"],
  correct: boolean
) => {
  const difficultyLevel = topicDifficulty[domain];
  const existing = await prisma.activity.findFirst({
    where: {
      user_id: userId,
      activity_type: "exercise",
      domain,
      competency,
    },
  });

  if (existing) {
    await prisma.activity.update({
      where: { activity_id: existing.activity_id },
      data: {
        attempts: existing.attempts + 1,
        correct_answers: existing.correct_answers + (correct ? 1 : 0),
        occurred_at: new Date(),
        status: "completed",
      },
    });
  } else {
    await prisma.activity.create({
      data: {
        user_id: userId,
        activity_type: "exercise",
        difficulty_level: difficultyLevel,
        attempts: 1,
        correct_answers: correct ? 1 : 0,
        status: "completed",
        domain,
        competency,
      },
    });
  }
};

export const submitPracticeAnswer = async (
  userId: number,
  practiceGeneratedId: number,
  userAnswer: string
) => {
  const record = await prisma.practiceGenerated.findUnique({
    where: { practice_generated_id: practiceGeneratedId },
  });
  if (!record) {
    throw new Error("Practice item not found");
  }

  if (record.user_id !== userId) {
    throw new Error("Unauthorized: practice item belongs to another user");
  }

  const item = record.item_json as PracticeItem;
  const normalized = userAnswer.trim().toUpperCase();
  const correct = normalized === item.correct_key;
  const explanation = correct
    ? item.explain_correct
    : item.explain_incorrect[normalized as "A" | "B" | "C" | "D"] ||
      "Revisa el procedimiento y vuelve a intentarlo.";

  if (record.status !== PracticeItemStatus.completed) {
    await prisma.practiceGenerated.update({
      where: { practice_generated_id: practiceGeneratedId },
      data: {
        status: PracticeItemStatus.completed,
        consumed_at: new Date(),
      },
    });
  }

  await prisma.practiceAttempt.create({
    data: {
      practice_generated_id: practiceGeneratedId,
      user_id: userId,
      user_answer: normalized,
      correct,
      explanation,
      domain: item.meta.domain,
      competency: item.meta.skill,
    },
  });

  await incrementActivityAggregate(
    userId,
    item.meta.domain,
    item.meta.skill,
    correct
  );

  const attempts = await prisma.practiceAttempt.count({
    where: { user_id: userId },
  });
  const correctAttempts = await prisma.practiceAttempt.count({
    where: { user_id: userId, correct: true },
  });
  const accuracy = attempts ? correctAttempts / attempts : 0;

  logPractice("practice answer recorded", {
    userId,
    practiceGeneratedId,
    correct,
    attempts,
    accuracy,
  });

  return {
    correct,
    explanation,
    correctKey: item.correct_key,
    attempts,
    accuracy,
    domain: item.meta.domain,
    competency: item.meta.skill,
  };
};

export const getStoredPracticeItem = async (practiceGeneratedId: number) => {
  const record = await prisma.practiceGenerated.findUnique({
    where: { practice_generated_id: practiceGeneratedId },
  });
  if (!record) {
    return null;
  }
  const item = record.item_json as PracticeItem;
  return {
    stem: item.stem,
    options: item.options.map((option) => ({
      key: option.key,
      label: option.text,
    })),
    domain: item.meta.domain,
    competency: item.meta.skill,
  };
};
