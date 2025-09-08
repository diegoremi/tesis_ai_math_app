
from fastapi import FastAPI
from pydantic import BaseModel
import google.generativeai as genai
import os
import json

app = FastAPI()

genai.configure(api_key=os.getenv("GEMINI_API_KEY"))

class ChatMessage(BaseModel):
    message: str

class ExercisePrompt(BaseModel):
    prompt: str

@app.get("/")
def read_root():
    return {"Hello": "World"}

@app.post("/chat")
def chat(chat_message: ChatMessage):
    try:
        model = genai.GenerativeModel('gemini-2.0-flash-lite', system_instruction="You are a helpful math tutor for young adults (18+). Your purpose is to help users learn mathematics, provide explanations, hints, and motivation. You are part of an AI-based educational platform.")
        response = model.generate_content(chat_message.message)
        return {"response": response.text}
    except Exception as e:
        return {"error": str(e)}

@app.post("/generate_exercise")
def generate_exercise(exercise_prompt: ExercisePrompt):
    try:
        model = genai.GenerativeModel('gemini-2.0-flash-lite', system_instruction="You are a math problem generator. Generate a single math problem and its answer based on the user's request. Provide the problem and answer in a JSON format like: {\"question\": \"What is 2+2?\", \"answer\": \"4\"}")
        response = model.generate_content(exercise_prompt.prompt)
        return json.loads(response.text)
    except Exception as e:
        return {"error": str(e)}
