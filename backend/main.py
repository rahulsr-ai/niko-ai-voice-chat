from murf import Murf
import os 
from fastapi.middleware.cors import CORSMiddleware 
from google import genai
from pydantic import BaseModel
from google.genai import types
from dotenv import load_dotenv
from fastapi import FastAPI
from typing import List, Literal, Optional

load_dotenv()

 
Geminiclient = genai.Client(api_key=os.getenv("GEMINI_API_KEY"))  
client = Murf(api_key=os.getenv("MURF_API_KEY"))
chat_session = Geminiclient.chats.create(model="gemini-2.5-flash")

# --- FastAPI App
app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    # allow_origins=["https://talkwithniko.netlify.app"],
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)



class Message(BaseModel):
    role: Literal["user", "ai"]
    message: str

class ConversationRequest(BaseModel):
    messages: List[Message]


class ConversationRequest(BaseModel):
    messages: List[Message]
    style: Optional[str] = "Helpful"
    system_instruction: Optional[str] = "You are Niko, a calm and helpful AI."


class TTSInput(BaseModel):
    text: str
    style: Optional[str] = "Conversational"
    language: Optional[str] = "English"  # Default language is Hindi

    




@app.post("/api/gemini/text")
async def generate_reply(payload: ConversationRequest):
    print("📥 Received messages:", payload.messages)

    # Get latest user message only (since Gemini chat session keeps context)

    print(f'HERE IS YOUR PAYLOD: {payload}')
    latest_user_input = ""
    sys_intruction = ""
    imp_instructions = "Your responses will be spoken aloud, so reply naturally as if you're talking to the user. Don’t mention anything about being a text model or not being able to speak."
    for msg in reversed(payload.messages):
        if msg.role == "user":
            latest_user_input = msg.message
            break

    if not latest_user_input:
        return {"reply": "⚠️ No valid user input found."}

    if not payload.system_instruction:
        sys_intruction = f'You are Niko, {imp_instructions} be {payload.style} in your response and Keep replies short, and relevant.'
    else: 
        sys_intruction = f'{payload.system_instruction} {{imp_instructions}} be {payload.style} in your response and Keep replies short, and relevant.' 
        

    try:
        # Send only latest input to chat session (it remembers the rest)
        response = chat_session.send_message(
            latest_user_input,
           config=types.GenerateContentConfig(
            system_instruction= sys_intruction,
        ),
        )

        print("🤖 Gemini reply:", response.text)
        return {"reply": response.text}

    except Exception as e:
        print("❌ Gemini generation failed:", e)
        return {"reply": "⚠️ Sorry, I couldn’t think of a reply."}






@app.post("/api/murf/audio")
def handle_AI_voice(data: TTSInput):  
    
    voiceId = ""
    native_locale = ""

    if data.language == "Hindi": 
        voiceId = "en-UK-hazel"  
        native_locale = "hi-IN"
    elif data.language == "French":
        native_locale = "fr-FR"
        voiceId = "en-UK-hazel" 
    elif data.language == "Spanish":
        native_locale = "es-ES"
        voiceId = "en-UK-hazel" 
    else : 
         voiceId = "en-US-natalie"  
         native_locale = "en-US"
        

        
    print(f"Using style: {data.style}")
    print(f"Language: {data.language}, Native Locale: {native_locale}")
    print(f"Using VoiceId: {voiceId} for language {data.language}")

    
     
    response = client.text_to_speech.generate(
        text=data.text,
        voice_id=voiceId,
        style= data.style,
        multi_native_locale=native_locale,
    )

    audio_url = response.audio_file
    return {"audio_url": audio_url}


    

