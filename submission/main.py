from fastapi import FastAPI

app = FastAPI()

@app.get("/")
def home():
    return {"message": "Hello GIF Reader"}
# .\venv\Scripts\Activate.ps1
@app.post("/describe_gif")
def describe_gif(url: str):
    print(f"Received GIF URL: {url}") 
    return {"description": "test caption", "runtime": 0.1}
