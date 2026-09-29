from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from typing import List, Any
import uuid

from app.db.session import get_db
from app.db.models import User, Scheme, PolicyVersion, Application, Document, Deficiency, ScrutinyCase, SelectionDecision, Grievance, AuditLog
from app.schemas.schemas import (
    UserCreate, UserResponse, LoginRequest, Token,
    SchemeCreate, SchemeResponse,
    PolicyVersionCreate, PolicyVersionResponse,
    ApplicationCreate, ApplicationResponse,
    GrievanceCreate, GrievanceResponse,
    AuditBlockResponse
)
from app.core.security import verify_password, get_password_hash, create_access_token
from app.services.audit_chain import append_audit_block, verify_chain_integrity

api_router = APIRouter()

# ----------------- AUTH -----------------
@api_router.post("/auth/login", response_model=Token)
async def login(req: LoginRequest, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(User).where(User.email == req.email))
    user = result.scalar_one_or_none()
    if not user or not verify_password(req.password, user.password_hash):
        raise HTTPException(status_code=401, detail="Invalid email or password")
    
    token = create_access_token({"sub": str(user.id), "email": user.email, "role": user.role})
    
    await append_audit_block(
        session=db,
        actor_user_id=user.id,
        actor_role=user.role,
        action="USER_LOGIN",
        entity_type="USER",
        entity_id=str(user.id),
        payload={"email": user.email}
    )
    
    return {"token": token, "user": user}

@api_router.post("/auth/register", response_model=Token, status_code=201)
async def register(req: UserCreate, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(User).where(User.email == req.email))
    if result.scalar_one_or_none():
        raise HTTPException(status_code=409, detail="Email already registered")
    
    new_user = User(
        id=uuid.uuid4(),
        name=req.name,
        email=req.email,
        password_hash=get_password_hash(req.password),
        role=req.role,
        institution=req.institution,
        state=req.state
    )
    db.add(new_user)
    await db.commit()
    await db.refresh(new_user)
    
    token = create_access_token({"sub": str(new_user.id), "email": new_user.email, "role": new_user.role})
    return {"token": token, "user": new_user}

# ----------------- SCHEMES & POLICIES -----------------
@api_router.get("/schemes", response_model=List[SchemeResponse])
async def get_schemes(db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Scheme))
    return result.scalars().all()

@api_router.post("/schemes", response_model=SchemeResponse, status_code=201)
async def create_scheme(req: SchemeCreate, db: AsyncSession = Depends(get_db)):
    scheme = Scheme(
        id=uuid.uuid4(),
        code=req.code.upper(),
        name=req.name,
        description=req.description,
        category=req.category,
        ministry=req.ministry
    )
    db.add(scheme)
    await db.commit()
    await db.refresh(scheme)
    return scheme

@api_router.get("/policies", response_model=List[PolicyVersionResponse])
async def get_policies(db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(PolicyVersion))
    return result.scalars().all()

# ----------------- APPLICATIONS -----------------
@api_router.get("/applications", response_model=List[ApplicationResponse])
async def get_applications(db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Application))
    return result.scalars().all()

# ----------------- AUDIT TRAIL -----------------
@api_router.get("/audit/logs", response_model=List[AuditBlockResponse])
async def get_audit_logs(db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(AuditLog).order_by(AuditLog.event_index.desc()).limit(100))
    return result.scalars().all()

@api_router.get("/audit/verify-chain")
async def verify_chain(db: AsyncSession = Depends(get_db)):
    return await verify_chain_integrity(db)
