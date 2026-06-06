import uuid

from sqlalchemy.ext.asyncio import AsyncSession

from src.core.exceptions import NotFoundError
from src.db.crud.company import (
    create_company,
    get_company,
    get_company_by_owner,
    update_company,
)
from src.db.models.company import Company


async def get_my_company(db: AsyncSession, user_id: str) -> Company | None:
    return await get_company_by_owner(db, user_id)


async def get_company_by_id(db: AsyncSession, company_id: uuid.UUID) -> Company:
    company = await get_company(db, company_id)
    if not company:
        raise NotFoundError("Company")
    return company


async def upsert_company(db: AsyncSession, user_id: str, data: dict) -> Company:
    """Create the caller's company profile, or update it if one already exists.

    Each user owns at most one company profile in the MVP.
    """
    existing = await get_company_by_owner(db, user_id)
    if existing:
        return await update_company(db, existing, **data)
    return await create_company(db, owner_user_id=user_id, **data)
