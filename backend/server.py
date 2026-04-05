from dotenv import load_dotenv
from pathlib import Path

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

from fastapi import FastAPI, APIRouter, HTTPException, Request, Response
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
from bson import ObjectId
import os
import logging
import bcrypt
import jwt
import secrets
import uuid
from datetime import datetime, timezone, timedelta
from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any
from emergentintegrations.llm.chat import LlmChat, UserMessage

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

app = FastAPI()
api_router = APIRouter(prefix="/api")

JWT_ALGORITHM = "HS256"

logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

# --- Password Utils ---
def hash_password(password: str) -> str:
    return bcrypt.hashpw(password.encode("utf-8"), bcrypt.gensalt()).decode("utf-8")

def verify_password(plain_password: str, hashed_password: str) -> bool:
    return bcrypt.checkpw(plain_password.encode("utf-8"), hashed_password.encode("utf-8"))

def get_jwt_secret() -> str:
    return os.environ["JWT_SECRET"]

def create_access_token(user_id: str, email: str) -> str:
    payload = {"sub": user_id, "email": email, "exp": datetime.now(timezone.utc) + timedelta(minutes=60), "type": "access"}
    return jwt.encode(payload, get_jwt_secret(), algorithm=JWT_ALGORITHM)

def create_refresh_token(user_id: str) -> str:
    payload = {"sub": user_id, "exp": datetime.now(timezone.utc) + timedelta(days=7), "type": "refresh"}
    return jwt.encode(payload, get_jwt_secret(), algorithm=JWT_ALGORITHM)

async def get_current_user(request: Request) -> dict:
    token = request.cookies.get("access_token")
    if not token:
        auth_header = request.headers.get("Authorization", "")
        if auth_header.startswith("Bearer "):
            token = auth_header[7:]
    if not token:
        raise HTTPException(status_code=401, detail="Not authenticated")
    try:
        payload = jwt.decode(token, get_jwt_secret(), algorithms=[JWT_ALGORITHM])
        if payload.get("type") != "access":
            raise HTTPException(status_code=401, detail="Invalid token type")
        user = await db.users.find_one({"_id": ObjectId(payload["sub"])})
        if not user:
            raise HTTPException(status_code=401, detail="User not found")
        user["_id"] = str(user["_id"])
        user.pop("password_hash", None)
        return user
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token expired")
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=401, detail="Invalid token")

# --- Pydantic Models ---
class RegisterInput(BaseModel):
    name: str
    email: str
    password: str

class LoginInput(BaseModel):
    email: str
    password: str

class AssetInput(BaseModel):
    id: Optional[str] = None
    asset_type: str
    asset_name: str
    purchased_year: int
    purchase_price: float
    current_value: float
    ownership_percent: float
    appreciation_percent: float

class FamilyMemberInput(BaseModel):
    id: Optional[str] = None
    name: str
    relationship: str
    age: int
    profession: str
    description: str

class AllocationInput(BaseModel):
    asset_id: str
    distributions: Dict[str, float]  # member_id -> percentage

class ScenarioCreateInput(BaseModel):
    name: str
    assets: List[AssetInput]
    family_members: List[FamilyMemberInput]
    allocations: List[AllocationInput]

class ScenarioUpdateInput(BaseModel):
    name: Optional[str] = None
    assets: Optional[List[AssetInput]] = None
    family_members: Optional[List[FamilyMemberInput]] = None
    allocations: Optional[List[AllocationInput]] = None

class ChatInput(BaseModel):
    message: str
    scenario_id: str
    session_id: Optional[str] = None

class CompareChatInput(BaseModel):
    message: str
    scenario_a_id: str
    scenario_b_id: str
    session_id: Optional[str] = None

# --- Auth Endpoints ---
@api_router.post("/auth/register")
async def register(input: RegisterInput, response: Response):
    email = input.email.lower().strip()
    existing = await db.users.find_one({"email": email})
    if existing:
        raise HTTPException(status_code=400, detail="Email already registered")
    hashed = hash_password(input.password)
    user_doc = {
        "email": email,
        "password_hash": hashed,
        "name": input.name,
        "role": "user",
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    result = await db.users.insert_one(user_doc)
    user_id = str(result.inserted_id)
    access_token = create_access_token(user_id, email)
    refresh_token = create_refresh_token(user_id)
    response.set_cookie(key="access_token", value=access_token, httponly=True, secure=False, samesite="lax", max_age=3600, path="/")
    response.set_cookie(key="refresh_token", value=refresh_token, httponly=True, secure=False, samesite="lax", max_age=604800, path="/")
    return {"id": user_id, "email": email, "name": input.name, "role": "user"}

@api_router.post("/auth/login")
async def login(input: LoginInput, request: Request, response: Response):
    email = input.email.lower().strip()
    ip = request.client.host if request.client else "unknown"
    identifier = f"{ip}:{email}"
    attempt = await db.login_attempts.find_one({"identifier": identifier})
    if attempt and attempt.get("count", 0) >= 5:
        lockout_until = attempt.get("locked_until")
        if lockout_until and datetime.now(timezone.utc) < datetime.fromisoformat(lockout_until):
            raise HTTPException(status_code=429, detail="Too many failed attempts. Try again in 15 minutes.")
        else:
            await db.login_attempts.delete_one({"identifier": identifier})
    user = await db.users.find_one({"email": email})
    if not user or not verify_password(input.password, user["password_hash"]):
        await db.login_attempts.update_one(
            {"identifier": identifier},
            {"$inc": {"count": 1}, "$set": {"locked_until": (datetime.now(timezone.utc) + timedelta(minutes=15)).isoformat()}},
            upsert=True
        )
        raise HTTPException(status_code=401, detail="Invalid email or password")
    await db.login_attempts.delete_one({"identifier": identifier})
    user_id = str(user["_id"])
    access_token = create_access_token(user_id, email)
    refresh_token = create_refresh_token(user_id)
    response.set_cookie(key="access_token", value=access_token, httponly=True, secure=False, samesite="lax", max_age=3600, path="/")
    response.set_cookie(key="refresh_token", value=refresh_token, httponly=True, secure=False, samesite="lax", max_age=604800, path="/")
    return {"id": user_id, "email": user["email"], "name": user.get("name", ""), "role": user.get("role", "user")}

@api_router.post("/auth/logout")
async def logout(response: Response):
    response.delete_cookie("access_token", path="/")
    response.delete_cookie("refresh_token", path="/")
    return {"message": "Logged out"}

@api_router.get("/auth/me")
async def get_me(request: Request):
    user = await get_current_user(request)
    return user

@api_router.post("/auth/refresh")
async def refresh_token(request: Request, response: Response):
    token = request.cookies.get("refresh_token")
    if not token:
        raise HTTPException(status_code=401, detail="No refresh token")
    try:
        payload = jwt.decode(token, get_jwt_secret(), algorithms=[JWT_ALGORITHM])
        if payload.get("type") != "refresh":
            raise HTTPException(status_code=401, detail="Invalid token type")
        user = await db.users.find_one({"_id": ObjectId(payload["sub"])})
        if not user:
            raise HTTPException(status_code=401, detail="User not found")
        user_id = str(user["_id"])
        access_token = create_access_token(user_id, user["email"])
        response.set_cookie(key="access_token", value=access_token, httponly=True, secure=False, samesite="lax", max_age=3600, path="/")
        return {"message": "Token refreshed"}
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=401, detail="Invalid refresh token")

# --- Scenario Endpoints ---
@api_router.post("/scenarios", status_code=201)
async def create_scenario(input: ScenarioCreateInput, request: Request):
    user = await get_current_user(request)
    assets = []
    for a in input.assets:
        asset_dict = a.model_dump()
        asset_dict["id"] = a.id or str(uuid.uuid4())
        assets.append(asset_dict)
    members = []
    for m in input.family_members:
        member_dict = m.model_dump()
        member_dict["id"] = m.id or str(uuid.uuid4())
        members.append(member_dict)
    allocations = []
    for alloc in input.allocations:
        allocations.append(alloc.model_dump())
    scenario_doc = {
        "user_id": user["_id"],
        "name": input.name,
        "assets": assets,
        "family_members": members,
        "allocations": allocations,
        "simulation_result": None,
        "created_at": datetime.now(timezone.utc).isoformat(),
        "updated_at": datetime.now(timezone.utc).isoformat()
    }
    result = await db.scenarios.insert_one(scenario_doc)
    scenario_doc["id"] = str(result.inserted_id)
    scenario_doc.pop("_id", None)
    return scenario_doc

@api_router.get("/scenarios")
async def list_scenarios(request: Request):
    user = await get_current_user(request)
    scenarios = await db.scenarios.find({"user_id": user["_id"]}, {"_id": 1, "name": 1, "created_at": 1, "updated_at": 1, "simulation_result": 1}).to_list(100)
    result = []
    for s in scenarios:
        s["id"] = str(s["_id"])
        s.pop("_id", None)
        has_result = s.get("simulation_result") is not None
        result.append({"id": s["id"], "name": s["name"], "created_at": s.get("created_at"), "updated_at": s.get("updated_at"), "has_simulation": has_result})
    return result

@api_router.get("/scenarios/{scenario_id}")
async def get_scenario(scenario_id: str, request: Request):
    user = await get_current_user(request)
    scenario = await db.scenarios.find_one({"_id": ObjectId(scenario_id), "user_id": user["_id"]})
    if not scenario:
        raise HTTPException(status_code=404, detail="Scenario not found")
    scenario["id"] = str(scenario["_id"])
    scenario.pop("_id", None)
    return scenario

@api_router.put("/scenarios/{scenario_id}")
async def update_scenario(scenario_id: str, input: ScenarioUpdateInput, request: Request):
    user = await get_current_user(request)
    scenario = await db.scenarios.find_one({"_id": ObjectId(scenario_id), "user_id": user["_id"]})
    if not scenario:
        raise HTTPException(status_code=404, detail="Scenario not found")
    update_data = {}
    if input.name is not None:
        update_data["name"] = input.name
    if input.assets is not None:
        assets = []
        for a in input.assets:
            asset_dict = a.model_dump()
            asset_dict["id"] = a.id or str(uuid.uuid4())
            assets.append(asset_dict)
        update_data["assets"] = assets
    if input.family_members is not None:
        members = []
        for m in input.family_members:
            member_dict = m.model_dump()
            member_dict["id"] = m.id or str(uuid.uuid4())
            members.append(member_dict)
        update_data["family_members"] = members
    if input.allocations is not None:
        allocations = [alloc.model_dump() for alloc in input.allocations]
        update_data["allocations"] = allocations
    update_data["updated_at"] = datetime.now(timezone.utc).isoformat()
    update_data["simulation_result"] = None
    await db.scenarios.update_one({"_id": ObjectId(scenario_id)}, {"$set": update_data})
    updated = await db.scenarios.find_one({"_id": ObjectId(scenario_id)})
    updated["id"] = str(updated["_id"])
    updated.pop("_id", None)
    return updated

@api_router.delete("/scenarios/{scenario_id}")
async def delete_scenario(scenario_id: str, request: Request):
    user = await get_current_user(request)
    result = await db.scenarios.delete_one({"_id": ObjectId(scenario_id), "user_id": user["_id"]})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Scenario not found")
    return {"message": "Scenario deleted"}

# --- Simulation ---
def calculate_simulation(scenario: dict) -> dict:
    assets = scenario.get("assets", [])
    members = scenario.get("family_members", [])
    allocations = scenario.get("allocations", [])

    # Ensure numeric values
    for a in assets:
        a["current_value"] = float(a.get("current_value", 0) or 0)
        a["purchase_price"] = float(a.get("purchase_price", 0) or 0)
        a["ownership_percent"] = float(a.get("ownership_percent", 100) or 100)

    total_value = sum(a["current_value"] * (a["ownership_percent"] / 100) for a in assets)

    member_values = {}
    for m in members:
        member_values[m["id"]] = {"name": m["name"], "relationship": m["relationship"], "total_value": 0, "assets": []}

    logger.info(f"Simulation: {len(assets)} assets, {len(members)} members, {len(allocations)} allocations, total_value={total_value}")
    logger.info(f"Asset IDs: {[a['id'] for a in assets]}")
    logger.info(f"Member IDs: {[m['id'] for m in members]}")
    logger.info(f"Allocation asset_ids: {[al.get('asset_id') for al in allocations]}")

    for alloc in allocations:
        asset_id = alloc.get("asset_id")
        asset = next((a for a in assets if a["id"] == asset_id), None)
        if not asset:
            logger.warning(f"Allocation references unknown asset_id={asset_id}")
            continue
        asset_value = asset["current_value"] * (asset["ownership_percent"] / 100)
        for mid, pct in alloc.get("distributions", {}).items():
            pct = float(pct or 0)
            if mid in member_values:
                share = asset_value * (pct / 100)
                member_values[mid]["total_value"] += share
                member_values[mid]["assets"].append({"asset_name": asset["asset_name"], "percentage": pct, "value": round(share, 2)})
            else:
                logger.warning(f"Allocation references unknown member_id={mid}")

    distribution = []
    for mid, data in member_values.items():
        pct_of_total = (data["total_value"] / total_value * 100) if total_value > 0 else 0
        distribution.append({
            "member_id": mid, "name": data["name"], "relationship": data["relationship"],
            "total_value": round(data["total_value"], 2), "percentage_of_total": round(pct_of_total, 2),
            "assets": data["assets"]
        })

    logger.info(f"Computed distribution: {[(d['name'], d['percentage_of_total']) for d in distribution]}")

    # Check if any distribution was actually computed
    total_distributed = sum(d["total_value"] for d in distribution)
    if total_distributed == 0 and total_value > 0 and len(allocations) > 0:
        logger.warning("Allocations exist but no value was distributed - possible ID mismatch")

    # Fairness score: 100 = perfectly equal, 0 = all to one person
    if len(distribution) > 1 and total_distributed > 0:
        percentages = [d["percentage_of_total"] for d in distribution]
        ideal = 100 / len(percentages)
        deviations = sum(abs(p - ideal) for p in percentages)
        max_deviation = 2 * (100 - ideal)
        fairness_score = max(0, round(100 - (deviations / max_deviation * 100), 1))
    else:
        fairness_score = 100.0
    # Risk alerts
    risk_alerts = []
    for d in distribution:
        if d["percentage_of_total"] > 60:
            risk_alerts.append({"type": "warning", "message": f"{d['name']} receives over 60% of the wealth, which may cause resentment."})
        if d["percentage_of_total"] < 5 and len(distribution) > 1:
            risk_alerts.append({"type": "warning", "message": f"{d['name']} receives less than 5%, which may feel exclusionary."})
    if fairness_score < 40:
        risk_alerts.append({"type": "error", "message": "Distribution is highly unequal. This may lead to family conflict."})
    # Future projection (5 years) - appreciation is calculated from purchase_price vs current_value
    future_values = []
    for a in assets:
        purchase = a.get("purchase_price", 0)
        current_raw = a.get("current_value", 0)
        appreciation = ((current_raw - purchase) / purchase * 100) if purchase > 0 else 0
        current = current_raw * (a.get("ownership_percent", 100) / 100)
        # Use a conservative annual growth rate derived from total appreciation over asset age
        purchased_year = a.get("purchased_year", datetime.now(timezone.utc).year)
        years_held = max(1, datetime.now(timezone.utc).year - purchased_year)
        annual_rate = ((current_raw / purchase) ** (1 / years_held) - 1) * 100 if purchase > 0 else 0
        future_val = current * ((1 + annual_rate / 100) ** 5)
        # Guard against NaN/Infinity
        if not isinstance(future_val, (int, float)) or future_val != future_val or future_val == float('inf'):
            future_val = current
        future_values.append({"asset_name": a["asset_name"], "current_value": round(current, 2), "future_value_5yr": round(future_val, 2), "appreciation_percent": round(appreciation, 2)})
    return {
        "total_estate_value": round(total_value, 2),
        "distribution": distribution,
        "fairness_score": fairness_score,
        "risk_alerts": risk_alerts,
        "future_projections": future_values,
        "simulated_at": datetime.now(timezone.utc).isoformat()
    }

@api_router.post("/scenarios/{scenario_id}/simulate")
async def run_simulation(scenario_id: str, request: Request):
    user = await get_current_user(request)
    scenario = await db.scenarios.find_one({"_id": ObjectId(scenario_id), "user_id": user["_id"]})
    if not scenario:
        raise HTTPException(status_code=404, detail="Scenario not found")
    result = calculate_simulation(scenario)
    await db.scenarios.update_one({"_id": ObjectId(scenario_id)}, {"$set": {"simulation_result": result, "updated_at": datetime.now(timezone.utc).isoformat()}})
    return result

# --- AI Chat ---
def build_scenario_context(scenario: dict) -> str:
    assets = scenario.get("assets", [])
    members = scenario.get("family_members", [])
    allocations = scenario.get("allocations", [])
    sim = scenario.get("simulation_result", {})
    ctx = f"Scenario: {scenario.get('name', 'Unnamed')}\n\n"
    ctx += "ASSETS:\n"
    for a in assets:
        purchase = a.get('purchase_price', 0)
        current_val = a.get('current_value', 0)
        appreciation = round(((current_val - purchase) / purchase * 100), 2) if purchase > 0 else 0
        ctx += f"- {a['asset_name']} ({a['asset_type']}): Purchase Price {purchase}, Current Value {current_val}, Ownership {a['ownership_percent']}%, Asset Appreciation {appreciation}%\n"
    ctx += "\nFAMILY MEMBERS:\n"
    for m in members:
        ctx += f"- {m['name']} ({m['relationship']}), Age {m['age']}, Profession: {m['profession']}, About: {m['description']}\n"
    ctx += "\nALLOCATIONS:\n"
    member_map = {m["id"]: m["name"] for m in members}
    for alloc in allocations:
        asset = next((a for a in assets if a["id"] == alloc["asset_id"]), None)
        if asset:
            dist_str = ", ".join([f"{member_map.get(mid, mid)}: {pct}%" for mid, pct in alloc.get("distributions", {}).items()])
            ctx += f"- {asset['asset_name']}: {dist_str}\n"
    if sim:
        ctx += f"\nSIMULATION RESULTS:\n"
        ctx += f"Total Estate Value: {sim.get('total_estate_value', 0)}\n"
        ctx += f"Fairness Score: {sim.get('fairness_score', 'N/A')}/100\n"
        for d in sim.get("distribution", []):
            ctx += f"- {d['name']}: {d['percentage_of_total']}% ({d['total_value']})\n"
        for alert in sim.get("risk_alerts", []):
            ctx += f"RISK: {alert['message']}\n"
    return ctx

SYSTEM_PROMPT = """You are NextHeir AI, an expert inheritance and wealth distribution advisor. You help high-net-worth individuals make fair and thoughtful decisions about distributing their wealth among family members.

You have access to the user's scenario data including assets, family members, allocations, and simulation results.

Your role:
- Provide thoughtful analysis on fairness of wealth distribution
- Consider both financial AND emotional aspects of inheritance decisions
- Flag potential family conflicts before they happen
- Suggest improvements to make distributions more equitable
- Consider each family member's needs, relationship, and circumstances
- Be empathetic but data-driven

IMPORTANT DISCLAIMER: Always include this disclaimer in your first response to a user: "This is AI-generated guidance and should not be considered financial or legal advice. Please consult qualified professionals for formal inheritance planning."

Keep responses concise, practical, and actionable. Use the scenario data provided to give specific, personalized advice."""

COMPARE_SYSTEM_PROMPT = """You are NextHeir AI, an expert inheritance comparison advisor. You are comparing two wealth distribution scenarios for a high-net-worth individual.

Your role:
- Compare both scenarios intelligently across financial and emotional dimensions
- Highlight trade-offs between the two approaches
- Suggest hybrid improvements combining the best of both
- Consider fairness, family dynamics, and potential conflict
- Explain reasoning in simple, clear language

IMPORTANT DISCLAIMER: Always include this disclaimer in your first response: "This is AI-generated guidance and should not be considered financial or legal advice. Please consult qualified professionals for formal inheritance planning."

Keep responses concise and actionable."""

@api_router.post("/chat")
async def chat_with_ai(input: ChatInput, request: Request):
    user = await get_current_user(request)
    scenario = await db.scenarios.find_one({"_id": ObjectId(input.scenario_id), "user_id": user["_id"]})
    if not scenario:
        raise HTTPException(status_code=404, detail="Scenario not found")
    context = build_scenario_context(scenario)
    session_id = input.session_id or str(uuid.uuid4())
    # Get chat history
    history = await db.chat_history.find({"session_id": session_id}, {"_id": 0}).sort("timestamp", 1).to_list(50)
    api_key = os.environ.get("EMERGENT_LLM_KEY")
    chat = LlmChat(api_key=api_key, session_id=session_id, system_message=SYSTEM_PROMPT + f"\n\nCURRENT SCENARIO DATA:\n{context}")
    chat.with_model("gemini", "gemini-3-flash-preview")
    # Re-feed history
    for h in history:
        if h["role"] == "user":
            chat.messages.append({"role": "user", "content": h["content"]})
        else:
            chat.messages.append({"role": "assistant", "content": h["content"]})
    user_msg = UserMessage(text=input.message)
    try:
        ai_response = await chat.send_message(user_msg)
    except Exception as e:
        logger.error(f"AI chat error: {e}")
        raise HTTPException(status_code=500, detail="AI service temporarily unavailable")
    # Save to history
    now = datetime.now(timezone.utc).isoformat()
    await db.chat_history.insert_many([
        {"session_id": session_id, "scenario_id": input.scenario_id, "user_id": user["_id"], "role": "user", "content": input.message, "timestamp": now},
        {"session_id": session_id, "scenario_id": input.scenario_id, "user_id": user["_id"], "role": "assistant", "content": ai_response, "timestamp": now}
    ])
    return {"response": ai_response, "session_id": session_id}

@api_router.post("/chat/compare")
async def compare_chat_with_ai(input: CompareChatInput, request: Request):
    user = await get_current_user(request)
    scenario_a = await db.scenarios.find_one({"_id": ObjectId(input.scenario_a_id), "user_id": user["_id"]})
    scenario_b = await db.scenarios.find_one({"_id": ObjectId(input.scenario_b_id), "user_id": user["_id"]})
    if not scenario_a or not scenario_b:
        raise HTTPException(status_code=404, detail="One or both scenarios not found")
    context_a = build_scenario_context(scenario_a)
    context_b = build_scenario_context(scenario_b)
    session_id = input.session_id or str(uuid.uuid4())
    history = await db.chat_history.find({"session_id": session_id}, {"_id": 0}).sort("timestamp", 1).to_list(50)
    api_key = os.environ.get("EMERGENT_LLM_KEY")
    chat = LlmChat(api_key=api_key, session_id=session_id, system_message=COMPARE_SYSTEM_PROMPT + f"\n\nSCENARIO A:\n{context_a}\n\nSCENARIO B:\n{context_b}")
    chat.with_model("gemini", "gemini-3-flash-preview")
    for h in history:
        if h["role"] == "user":
            chat.messages.append({"role": "user", "content": h["content"]})
        else:
            chat.messages.append({"role": "assistant", "content": h["content"]})
    user_msg = UserMessage(text=input.message)
    try:
        ai_response = await chat.send_message(user_msg)
    except Exception as e:
        logger.error(f"AI compare chat error: {e}")
        raise HTTPException(status_code=500, detail="AI service temporarily unavailable")
    now = datetime.now(timezone.utc).isoformat()
    await db.chat_history.insert_many([
        {"session_id": session_id, "scenario_id": f"{input.scenario_a_id}_vs_{input.scenario_b_id}", "user_id": user["_id"], "role": "user", "content": input.message, "timestamp": now},
        {"session_id": session_id, "scenario_id": f"{input.scenario_a_id}_vs_{input.scenario_b_id}", "user_id": user["_id"], "role": "assistant", "content": ai_response, "timestamp": now}
    ])
    return {"response": ai_response, "session_id": session_id}

@api_router.get("/chat/{session_id}/history")
async def get_chat_history(session_id: str, request: Request):
    user = await get_current_user(request)
    history = await db.chat_history.find({"session_id": session_id, "user_id": user["_id"]}, {"_id": 0}).sort("timestamp", 1).to_list(100)
    return history

# Include router
app.include_router(api_router)

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_methods=["*"],
    allow_headers=["*"],
)

# Startup
@app.on_event("startup")
async def startup():
    await db.users.create_index("email", unique=True)
    await db.login_attempts.create_index("identifier")
    await db.chat_history.create_index("session_id")
    await seed_admin()

async def seed_admin():
    admin_email = os.environ.get("ADMIN_EMAIL", "admin@nextheir.com")
    admin_password = os.environ.get("ADMIN_PASSWORD", "Admin123!")
    existing = await db.users.find_one({"email": admin_email})
    if existing is None:
        hashed = hash_password(admin_password)
        await db.users.insert_one({"email": admin_email, "password_hash": hashed, "name": "Admin", "role": "admin", "created_at": datetime.now(timezone.utc).isoformat()})
        logger.info(f"Admin user seeded: {admin_email}")
    elif not verify_password(admin_password, existing["password_hash"]):
        await db.users.update_one({"email": admin_email}, {"$set": {"password_hash": hash_password(admin_password)}})
        logger.info("Admin password updated")
    # Write test credentials
    os.makedirs("/app/memory", exist_ok=True)
    with open("/app/memory/test_credentials.md", "w") as f:
        f.write(f"# Test Credentials\n\n## Admin\n- Email: {admin_email}\n- Password: {admin_password}\n- Role: admin\n\n## Auth Endpoints\n- POST /api/auth/register\n- POST /api/auth/login\n- POST /api/auth/logout\n- GET /api/auth/me\n- POST /api/auth/refresh\n")

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()
