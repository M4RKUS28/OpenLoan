import uuid
from typing import Annotated

from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from src.api.v1.schemas.company import CompanyResponse, CompanyUpsertRequest
from src.core.auth import TokenData, get_current_user
from src.db.database import get_db
from src.services.company_service import get_company_by_id, get_my_company, upsert_company

router = APIRouter(prefix="/companies", tags=["companies"])

DbDep = Annotated[AsyncSession, Depends(get_db)]
UserDep = Annotated[TokenData, Depends(get_current_user)]


@router.get("/me", response_model=CompanyResponse | None)
async def my_company(db: DbDep, user: UserDep):
    company = await get_my_company(db, user.user_id)
    return CompanyResponse.model_validate(company) if company else None


@router.put("", response_model=CompanyResponse)
async def upsert(body: CompanyUpsertRequest, db: DbDep, user: UserDep):
    company = await upsert_company(db, user.user_id, body.model_dump(exclude_unset=True))
    return CompanyResponse.model_validate(company)


@router.get("/{company_id}", response_model=CompanyResponse)
async def get_one(company_id: uuid.UUID, db: DbDep):
    company = await get_company_by_id(db, company_id)
    return CompanyResponse.model_validate(company)
