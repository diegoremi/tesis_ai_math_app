
import os
import json
import random
import re
from datetime import datetime
from typing import List, Optional, Dict, Any

from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
import google.generativeai as genai
from mangum import Mangum

app = FastAPI()
handler = Mangum(app)

API_KEY = os.getenv("GEMINI_API_KEY")
if API_KEY:
    genai.configure(api_key=API_KEY)

class ChatMessage(BaseModel):
    message: str

class ExercisePrompt(BaseModel):
    prompt: str


class HintRequest(BaseModel):
    stem: str
    options: Optional[List[dict]] = None
    domain: Optional[str] = None
    competency: Optional[str] = None


class TheoryModuleRequest(BaseModel):
    participantProfile: Dict[str, Any]
    pretestSummary: Optional[Dict[str, Any]] = None
    reflection: Optional[str] = None
    moduleIndex: int = 0


def has_gemini_key() -> bool:
    return bool(API_KEY)


PII_PATTERNS = [
    r"[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}",
    r"\+?\d[\d\-\s]{7,}",
    r"(?i)(calle|direccion|address)\s+[\w\s]+\d{1,4}",
]


def redact(text: str) -> str:
    redacted = text
    for pattern in PII_PATTERNS:
        redacted = re.sub(pattern, "[REDACTED]", redacted)
    return redacted

@app.get("/")
def read_root():
    return {"Hello": "World"}

@app.post("/chat")
def chat(chat_message: ChatMessage):
    if not has_gemini_key():
        return {"response": "I currently cannot reach the AI service, but keep practicing—consistency is key!"}

    try:
        model = genai.GenerativeModel(
            'gemini-2.0-flash-lite',
            system_instruction=(
                "You are a helpful math tutor for young adults (18+). "
                "Provide concise explanations, actionable hints, and motivation."
            ),
        )
        response = model.generate_content(redact(chat_message.message))
        return {"response": response.text}
    except Exception as e:
        raise HTTPException(status_code=502, detail=f"AI service error: {e}")

@app.post("/generate_exercise")
def generate_exercise(exercise_prompt: ExercisePrompt):
    if not has_gemini_key():
        return {
            "question": "What is 7 + 5?",
            "answer": "12",
        }

    try:
        model = genai.GenerativeModel(
            'gemini-2.0-flash-lite',
            system_instruction=(
                "You are a math problem generator. Generate a single math problem and its answer "
                "based on the user's request. Provide JSON: {\"question\": ..., \"answer\": ...}."
            ),
        )
        response = model.generate_content(exercise_prompt.prompt)
        return json.loads(response.text)
    except Exception as e:
        raise HTTPException(status_code=502, detail=f"AI service error: {e}")


@app.post("/hint")
def generate_hint(request: HintRequest):
    if not request.stem:
        raise HTTPException(status_code=400, detail="stem is required for hint generation")

    if not has_gemini_key():
        return {"hint": "Focus on identifying known values and isolate the variable step by step."}

    option_text = ""
    if request.options:
        option_lines = [f"{opt.get('key')}: {opt.get('label')}" for opt in request.options if opt]
        option_text = "\nOptions:\n" + "\n".join(option_lines)

    domain_text = f"Domain: {request.domain}." if request.domain else ""
    competency_text = f" Competency: {request.competency}." if request.competency else ""

    prompt = (
        "Provide a succinct hint (not the full solution) to help a student solve the following math problem. "
        "The hint should encourage the next step without revealing the answer.\n"
        f"Problem: {redact(request.stem)}\n"
        f"{option_text}\n"
        f"{domain_text}{competency_text}\n"
        "Hint:"
    )

    try:
        model = genai.GenerativeModel(
            'gemini-2.0-flash-lite',
            system_instruction="You deliver short, actionable math hints without giving the solution away.",
        )
        response = model.generate_content(prompt)
        return {"hint": response.text.strip() if response.text else "Try breaking the problem into simpler steps."}
    except Exception as e:
        raise HTTPException(status_code=502, detail=f"AI service error: {e}")


@app.post("/generate/theory-module")
def generate_theory_module(payload: TheoryModuleRequest):
    module_index = max(payload.moduleIndex, 0)
    profile = payload.participantProfile or {}

    if not has_gemini_key():
        return _fallback_theory_module(payload)

    try:
        system_prompt = (
            "Eres un diseñador instruccional de matemática. Devuelves JSON válido con la forma:"
            " {\"title\": str, \"description\": str, \"version\": str, \"sections\": [ ... ], \"checkpoint\": {...}}."
            " Cada sección puede incluir elementos: texto simple, objetos {\"math\": Latex}, {\"callout\": str},"
            " o {\"visualization\": {\"type\": \"plotly\", \"data\": [...], \"layout\": {...}}}."
            " Ajusta el tono al nivel académico y edad del participante."
        )

        request = {
            "profile": profile,
            "pretest": payload.pretestSummary,
            "reflection": redact(payload.reflection or "") if payload.reflection else None,
            "moduleIndex": module_index,
            "timestamp": datetime.utcnow().isoformat(),
        }

        model = genai.GenerativeModel('gemini-2.0-flash-lite', system_instruction=system_prompt)
        response = model.generate_content(
            json.dumps(
              {
                "instruction": "Genera contenido pedagógico personalizado.",
                "request": request,
              }
            )
        )
        if not response.text:
            return _fallback_theory_module(payload)
        try:
            parsed = json.loads(response.text)
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
    random.seed(rand_seed)
    offset = random.randint(1, 5)

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
                            "y": [random.randint(1, 4) + offset * i for i in range(5)],
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
