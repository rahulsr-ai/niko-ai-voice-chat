import requests
from playsound3 import playsound  # or use playsound if works
from murf import Murf
import os 
import speech_recognition as sr 
from google import genai
from google.genai import types
from dotenv import load_dotenv



load_dotenv()

 
Geminiclient = genai.Client(api_key=os.getenv("GEMINI_API_KEY"))  
client = Murf(api_key=os.getenv("MURF_API_KEY"))



def get_user_voice_input() -> str:
    recognizer = sr.Recognizer()

    # Use default microphone
    with sr.Microphone() as source:
        print("🎤 Please speak now...")
        recognizer.adjust_for_ambient_noise(source, duration=1)
        audio = recognizer.listen(source, timeout=None, phrase_time_limit=30)  

    try:
        text = recognizer.recognize_google(audio)
        print("✅ You said:", text)
                
        response = Geminiclient.models.generate_content(
            model="gemini-2.5-flash", 
            contents= text,
            config=types.GenerateContentConfig(
            system_instruction="Your name is niko who is very polite and calm in your response make it short ",),
        )
        
        print(f'YOUR TEXT TO GEMINI : {response.text}')
        handle_AI_voice(response.text)
        return response.text
        
    except sr.UnknownValueError:
        print("❌ Couldn't understand you.")
    except sr.RequestError as e:
        print(f"❌ Request to Google failed: {e}")

    return ""




def handle_AI_voice(text: str):   
    print("🤖 Generating AI voice for:", text)  
    response = client.text_to_speech.generate(
        text=text,
        voice_id = "en-US-natalie",
        style = "Conversational",
        pitch = 0,
    )

    audio_url = response.audio_file

    # ✅ Step 1: Download the audio
    audio_file_path = "murf_voice.wav"
    res = requests.get(audio_url)
    if res.status_code == 200:
        with open(audio_file_path, "wb") as f:
            f.write(res.content)
        print("✅ Downloaded audio to murf_voice.wav")
        playsound(audio_file_path)
        if os.path.exists(audio_file_path):
                os.remove(audio_file_path)
                print("🗑️ Audio file deleted")
    else:
         print("❌ Failed to download audio:", res.status_code)



get_user_voice_input() 