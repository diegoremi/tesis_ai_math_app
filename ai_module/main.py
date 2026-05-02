import os
import json
import random
import re
from datetime import datetime, timezone
from typing import List, Optional, Dict, Any

from fastapi import FastAPI, HTTPException
from pydantic import BaseModel, Field
from openai import OpenAI
from mangum import Mangum

app = FastAPI()
handler = Mangum(app)

OPENROUTER_API_KEY = os.getenv("OPENROUTER_API_KEY")
OPENROUTER_MODEL = os.getenv("OPENROUTER_MODEL", "openrouter/free")

client: Optional[OpenAI] = None
if OPENROUTER_API_KEY:
    client = OpenAI(
        base_url="https://openrouter.ai/api/v1",
        api_key=OPENROUTER_API_KEY,
    )


@app.get("/health")
def health_check():
    return {"status": "ok", "service": "ai_module"}


class ChatMessage(BaseModel):
    message: str = Field(..., max_length=2000)


class ExercisePrompt(BaseModel):
    prompt: str = Field(..., max_length=3000)


class HintRequest(BaseModel):
    stem: str = Field(..., max_length=2000)
    options: Optional[List[dict]] = None
    domain: Optional[str] = Field(None, max_length=100)
    competency: Optional[str] = Field(None, max_length=100)
    hint_level: int = Field(0, ge=0, le=3)


class TheoryModuleRequest(BaseModel):
    participantProfile: Dict[str, Any]
    pretestSummary: Optional[Dict[str, Any]] = None
    reflection: Optional[str] = Field(None, max_length=2000)
    moduleIndex: int = Field(0, ge=0)


def has_ai_key() -> bool:
    return client is not None


PII_PATTERNS = [
    r"[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}",
    r"\+?\d[\d\-\s]{7,}",
    r"(?i)(calle|direccion|address)\s+[\w\s]+\d{1,4}",
]


ASSESSMENT_KEYWORDS = [
    "pretest", "postest", "evaluacion", "examen", "test",
    "respuesta correcta", "cual es la respuesta", "dame la respuesta",
    "solucion completa", "resuelveme esto", "dime la opcion",
]


def redact(text: str) -> str:
    redacted = text
    for pattern in PII_PATTERNS:
        redacted = re.sub(pattern, "[REDACTED]", redacted)
    return redacted


def contains_assessment_content(text: str) -> bool:
    text_lower = text.lower()
    return any(keyword in text_lower for keyword in ASSESSMENT_KEYWORDS)


@app.get("/")
def read_root():
    return {"Hello": "World"}


def _openrouter_chat(messages: List[Dict[str, str]], system: Optional[str] = None, temperature: float = 0.7, max_tokens: int = 2048) -> str:
    if not client:
        raise RuntimeError("OpenRouter client not configured")

    api_messages: List[Dict[str, str]] = []
    if system:
        api_messages.append({"role": "system", "content": system})
    api_messages.extend(messages)

    response = client.chat.completions.create(
        model=OPENROUTER_MODEL,
        messages=api_messages,
        temperature=temperature,
        max_tokens=max_tokens,
    )
    return response.choices[0].message.content or ""


@app.post("/chat")
def chat(chat_message: ChatMessage):
    if not has_ai_key():
        return {"response": "I currently cannot reach the AI service, but keep practicing—consistency is key!"}

    redacted_message = redact(chat_message.message)

    if contains_assessment_content(redacted_message):
        return {
            "response": (
                "No puedo ayudarte con preguntas de evaluaciones o exámenes. "
                "Soy tu tutor para práctica y comprensión de conceptos. "
                "Si tienes dudas sobre cómo resolver un tipo de problema o necesitas "
                "repasar un concepto, con gusto te guío paso a paso."
            )
        }

    try:
        system_prompt = (
            "Eres un tutor de matemáticas para adultos jóvenes (18+). "
            "Tu rol es guiar el aprendizaje, NO dar respuestas directas a problemas. "
            "REGLAS ESTRICTAS:\n"
            "1. NUNCA respondas preguntas de evaluaciones, exámenes o tests.\n"
            "2. NUNCA des la respuesta numérica final de un ejercicio.\n"
            "3. SIEMPRE guía con preguntas reflexivas y sugerencias de estrategia.\n"
            "4. Usa un tono claro, motivador y adulto.\n"
            "5. Explica conceptos con ejemplos relacionados, no resolviendo el ejercicio exacto del estudiante.\n"
            "6. Si el estudiante pide la respuesta, redirige: 'Vamos a descomponer el problema juntos. ¿Qué información tienes?'"
        )
        text = _openrouter_chat(
            messages=[{"role": "user", "content": redacted_message}],
            system=system_prompt,
            temperature=0.7,
            max_tokens=2048,
        )
        return {"response": text}
    except Exception as e:
        raise HTTPException(status_code=502, detail=f"AI service error: {e}")


@app.post("/generate_exercise")
def generate_exercise(exercise_prompt: ExercisePrompt):
    if not has_ai_key():
        return {
            "question": "What is 7 + 5?",
            "answer": "12",
        }

    try:
        redacted_prompt = redact(exercise_prompt.prompt)
        system_prompt = (
            "You are a math problem generator. Generate a single math problem and its answer "
            "based on the user's request. Provide JSON: {\"question\": ..., \"answer\": ...}."
        )
        text = _openrouter_chat(
            messages=[{"role": "user", "content": redacted_prompt}],
            system=system_prompt,
            temperature=0.7,
            max_tokens=1024,
        )
        return json.loads(text)
    except Exception as e:
        raise HTTPException(status_code=502, detail=f"AI service error: {e}")


@app.post("/hint")
def generate_hint(request: HintRequest):
    if not request.stem:
        raise HTTPException(status_code=400, detail="stem is required for hint generation")

    if not has_ai_key():
        return {"hint": _fallback_hint(request.hint_level)}

    option_text = ""
    if request.options:
        option_lines = [f"{opt.get('key')}: {opt.get('label')}" for opt in request.options if opt]
        option_text = "\nOptions:\n" + "\n".join(option_lines)

    domain_text = f"Domain: {request.domain}." if request.domain else ""
    competency_text = f" Competency: {request.competency}." if request.competency else ""

    hint_instructions = {
        0: (
            "Da una pista muy general sobre la estrategia a usar. "
            "NO menciones números específicos del problema. "
            "NO des la respuesta. "
            "Solo sugiere qué concepto o método aplicar."
        ),
        1: (
            "Da una pista más específica sobre el primer paso. "
            "Puedes mencionar qué operación o fórmula usar. "
            "NO des la respuesta final. "
            "NO resuelvas el problema completo."
        ),
        2: (
            "Guía sobre el siguiente paso concreto. "
            "Menciona qué valores usar y cómo organizarlos. "
            "NO des la respuesta final. "
            "Solo orienta el procedimiento."
        ),
        3: (
            "Da una pista muy detallada sobre el procedimiento, paso a paso. "
            "Puedes mostrar la operación parcial. "
            "NO des la respuesta final explícita. "
            "Deja que el estudiante complete el último paso."
        ),
    }

    instruction = hint_instructions.get(request.hint_level, hint_instructions[0])

    prompt = (
        f"{instruction}\n"
        f"Problem: {redact(request.stem)}\n"
        f"{option_text}\n"
        f"{domain_text}{competency_text}\n"
        "Hint:"
    )

    try:
        system_prompt = (
            "You deliver short, actionable math hints without giving the solution away. "
            "You NEVER reveal the final answer. You guide the student to discover it themselves."
        )
        text = _openrouter_chat(
            messages=[{"role": "user", "content": prompt}],
            system=system_prompt,
            temperature=0.7,
            max_tokens=1024,
        )
        return {"hint": text.strip() if text else _fallback_hint(request.hint_level)}
    except Exception as e:
        raise HTTPException(status_code=502, detail=f"AI service error: {e}")


def _fallback_hint(hint_level: int) -> str:
    hints = {
        0: "Piensa en qué concepto matemático se aplica aquí. ¿Reconoces el tipo de problema?",
        1: "Identifica los datos conocidos y lo que te piden encontrar. Luego busca la relación entre ellos.",
        2: "Aplica la fórmula o método correspondiente paso a paso. Verifica cada operación.",
        3: "Realiza la operación principal y verifica si tu resultado tiene sentido en el contexto del problema.",
    }
    return hints.get(hint_level, hints[0])


@app.post("/generate/theory-module")
def generate_theory_module(payload: TheoryModuleRequest):
    module_index = max(payload.moduleIndex, 0)
    profile = payload.participantProfile or {}

    if not has_ai_key():
        return _fallback_theory_module(payload)

    try:
        system_prompt = (
            "Eres un diseñador instruccional de matemática. Devuelves JSON válido con la forma:"
            ' {"title": str, "description": str, "version": str, "sections": [ ... ], "checkpoint": {...}}.'
            " Cada sección puede incluir elementos: texto simple, objetos {\"math\": Latex}, {\"callout\": str},"
            ' o {\"visualization\": {\"type\": \"plotly\", \"data\": [...], \"layout\": {...}}}.'
            " Ajusta el tono al nivel académico y edad del participante."
        )

        request_content = {
            "profile": profile,
            "pretest": payload.pretestSummary,
            "reflection": redact(payload.reflection or "") if payload.reflection else None,
            "moduleIndex": module_index,
            "timestamp": datetime.now(timezone.utc).isoformat(),
        }

        prompt = (
            "Genera contenido pedagógico personalizado en español para un módulo de matemáticas. "
            "Responde ÚNICAMENTE con un objeto JSON válido, sin texto adicional ni markdown.\n\n"
            f"Solicitud: {json.dumps(request_content, ensure_ascii=False)}"
        )

        text = _openrouter_chat(
            messages=[{"role": "user", "content": prompt}],
            system=system_prompt,
            temperature=0.7,
            max_tokens=4096,
        )

        if not text:
            return _fallback_theory_module(payload)

        # Try to extract JSON if the model wrapped it in markdown
        cleaned = text.strip()
        if cleaned.startswith("```json"):
            cleaned = cleaned[7:]
        if cleaned.startswith("```"):
            cleaned = cleaned[3:]
        if cleaned.endswith("```"):
            cleaned = cleaned[:-3]
        cleaned = cleaned.strip()

        try:
            parsed = json.loads(cleaned)
        except json.JSONDecodeError:
            return _fallback_theory_module(payload)

        parsed.setdefault("moduleId", f"generated-{module_index}")
        parsed.setdefault("version", "ai-v1")
        parsed.setdefault("title", f"Módulo {module_index + 1}")
        return parsed
    except Exception as exc:
        raise HTTPException(status_code=502, detail=f"AI service error: {exc}")


def _fallback_theory_module(payload: TheoryModuleRequest) -> Dict[str, Any]:
    profile = payload.participantProfile or {}
    level = profile.get("mathLevel", "intermediate") or "intermediate"
    topic = {
        "beginner": "Fracciones y proporciones",
        "intermediate": "Funciones lineales",
        "advanced": "Optimización cuadrática",
    }.get(level, "Fundamentos matemáticos")

    rand_seed = profile.get("age", 20) + payload.moduleIndex
    rng = random.Random(rand_seed)
    offset = rng.randint(1, 5)

    return {
        "moduleId": f"fallback-{payload.moduleIndex}",
        "version": "fallback",
        "title": f"Módulo {payload.moduleIndex + 1}: {topic}",
        "description": "Este módulo se generó localmente cuando el servicio IA no estuvo disponible.",
        "sections": [
            {
                "heading": "Objetivo del módulo",
                "body": [
                    f"Comprender los conceptos principales de {topic.lower()} y aplicarlos en ejercicios contextualizados.",
                    {
                        "callout": "Recuerda repasar el pretest para identificar tus áreas de mejora.",
                    },
                ],
            },
            {
                "heading": "Derivación clave",
                "body": [
                    {
                        "math": "\\text{Si } f(x) = mx + b, \\text{ entonces } f(0) = b \\text{ y } f(1) = m + b",
                    },
                    "Interpretá la pendiente m como la tasa de variación entre dos puntos consecutivos.",
                ],
            },
            {
                "visualization": {
                    "type": "plotly",
                    "data": [
                        {
                            "x": [0, 1, 2, 3, 4],
                            "y": [rng.randint(1, 4) + offset * i for i in range(5)],
                            "type": "scatter",
                            "mode": "lines+markers",
                            "name": "Progreso estimado",
                        }
                    ],
                    "layout": {
                        "title": "Tendencia de aprendizaje",
                        "xaxis": {"title": "Sesión"},
                        "yaxis": {"title": "Puntaje"},
                    },
                }
            },
        ],
        "checkpoint": {
            "questions": [
                {
                    "id": "q1",
                    "stem": "Resuelve la ecuación $2x + 6 = 14$. ¿Cuál es el valor de $x$?",
                    "options": [
                        {"key": "A", "label": "2"},
                        {"key": "B", "label": "3"},
                        {"key": "C", "label": "4"},
                        {"key": "D", "label": "5"},
                    ],
                    "correct": "C",
                },
                {
                    "id": "q2",
                    "stem": "Si una recta pasa por (0,2) con pendiente 3, ¿cuál es su ecuación?",
                    "options": [
                        {"key": "A", "label": "y = 3x"},
                        {"key": "B", "label": "y = 3x + 2"},
                        {"key": "C", "label": "y = 2x + 3"},
                        {"key": "D", "label": "y = 2x"},
                    ],
                    "correct": "B",
                },
            ]
        }
    }


if __name__ == "__main__":
    import uvicorn
    port = int(os.getenv("PORT", 8000))
    uvicorn.run("main:app", host="0.0.0.0", port=port)
