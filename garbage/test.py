import requests
import json

API_KEY = "AIzaSyBydKxwYm_N1oovfztprziibkvUNHXb3ng"

url = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=AIzaSyBydKxwYm_N1oovfztprziibkvUNHXb3ng"

data = {
    "contents": [
        {
            "parts": [
                {
                    "text": "Hello Gemini!"
                }
            ]
        }
    ]
}

response = requests.post(url, json=data)

print(response.json())