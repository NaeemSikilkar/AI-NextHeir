import os
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pymongo import MongoClient
from datetime import datetime
from pydantic import BaseModel

# ========================
# ENV VARIABLES
# ========================
MONGO_URL = os.getenv("MONGO_URL")
SECRET_KEY = os.getenv("SECRET_KEY")

if not MONGO_URL:
    raise Exception("MONGO_URL is missing")

# ========================
# DATABASE
# ========================
client = MongoClient(MONGO_URL)
db = client["nextheir"]

# ========================
# APP INIT
# ========================
app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ========================
# MODELS
# ========================
class User(BaseModel):
    name: str
    email: str

class Scenario(BaseModel):
    name: str
    total_value: float

# ========================
# HEALTH CHECK
# ========================
@app.get("/")
def home():
    return {"status": "NextHeir backend is LIVE 🚀"}

# ========================
# USER APIs
# ========================
@app.post("/register")
def register_user(user: User):
    existing = db.users.find_one({"email": user.email})

    if existing:
        raise HTTPException(status_code=400, detail="User already exists")

    db.users.insert_one({
        "name": user.name,
        "email": user.email,
        "created_at": datetime.utcnow()
    })

    return {"message": "User registered successfully"}

@app.get("/users")
def get_users():
    users = list(db.users.find({}, {"_id": 0}))
    return users

# ========================
# SCENARIO APIs
# ========================
@app.post("/scenario")
def create_scenario(scenario: Scenario):
    db.scenarios.insert_one({
        "name": scenario.name,
        "total_value": scenario.total_value,
        "created_at": datetime.utcnow()
    })

    return {"message": "Scenario created"}

@app.get("/scenarios")
def get_scenarios():
    scenarios = list(db.scenarios.find({}, {"_id": 0}))
    return scenarios

# ========================
# SIMPLE SIMULATION
# ========================
@app.get("/simulate")
def simulate():
    return {
        "fairness_score": 78,
        "risk": "Moderate imbalance",
        "suggestion": "Distribute assets more evenly"
    }

# ========================
# SHUTDOWN
# ========================
@app.on_event("shutdown")
def shutdown():
    client.close()
