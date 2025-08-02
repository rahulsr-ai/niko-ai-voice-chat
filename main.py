import requests
from playsound3 import playsound  # or use playsound if works
from murf import Murf
import os 
from fastapi.middleware.cors import CORSMiddleware
import speech_recognition as sr 
from google import genai
from pydantic import BaseModel
from google.genai import types
from dotenv import load_dotenv
from fastapi import FastAPI
from typing import List, Literal

load_dotenv()

 
Geminiclient = genai.Client(api_key=os.getenv("GEMINI_API_KEY"))  
client = Murf(api_key=os.getenv("MURF_API_KEY"))
chat_session = Geminiclient.chats.create(model="gemini-2.5-flash")

# --- FastAPI App
app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # For dev only. Use specific domain in prod
    allow_methods=["*"],
    allow_headers=["*"],
)




class Message(BaseModel):
    role: Literal["user", "ai"]
    message: str

class ConversationRequest(BaseModel):
    messages: List[Message]



class TTSInput(BaseModel):
    text: str



@app.post("/api/gemini/text")
async def generate_reply(payload: ConversationRequest):
    print("📥 Received messages:", payload.messages)

    # Get latest user message only (since Gemini chat session keeps context)
    latest_user_input = ""
    for msg in reversed(payload.messages):
        if msg.role == "user":
            latest_user_input = msg.message
            break

    if not latest_user_input:
        return {"reply": "⚠️ No valid user input found."}

    try:
        # Send only latest input to chat session (it remembers the rest)
        response = chat_session.send_message(
            latest_user_input,
           config=types.GenerateContentConfig(
            system_instruction="You are Niko, a calm, helpful AI. Keep replies short, polite, and relevant.",
        ),
        )

        print("🤖 Gemini reply:", response.text)
        return {"reply": response.text}

    except Exception as e:
        print("❌ Gemini generation failed:", e)
        return {"reply": "⚠️ Sorry, I couldn’t think of a reply."}




@app.post("/api/murf/audio")
def handle_AI_voice(data: TTSInput):   
    print("🤖 Generating AI voice for:", data.text)  
    response = client.text_to_speech.generate(
        text=data.text,
        voice_id="en-US-natalie",
        style="Conversational",
        pitch=0,
    )

    audio_url = response.audio_file
    return {"audio_url": audio_url}