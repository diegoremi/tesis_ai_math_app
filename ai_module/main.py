
import os
import json
from typing import List, Optional

from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
import google.generativeai as genai

app = FastAPI()

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


def has_gemini_key() -> bool:
    return bool(API_KEY)

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
        response = model.generate_content(chat_message.message)
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
        f"Problem: {request.stem}\n"
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
