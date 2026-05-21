from fastapi import FastAPI

app = FastAPI(title="Kira AI Gateway", version="1.0.0")

@app.get("/health")
async def health():
    return {"status": "ok"}
