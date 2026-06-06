import uuid

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from src.db.models.company import Company


async def create_company(db: AsyncSession, **kwargs) -> Company:
    company = Company(**kwargs)
    db.add(company)
    await db.flush()
    await db.refresh(company)
    return company


async def get_company(db: AsyncSession, company_id: uuid.UUID) -> Company | None:
    result = await db.execute(select(Company).where(Company.id == company_id))
    return result.scalar_one_or_none()


async def get_company_by_owner(db: AsyncSession, owner_user_id: str) -> Company | None:
    result = await db.execute(
        select(Company).where(Company.owner_user_id == owner_user_id).limit(1)
    )
    return result.scalar_one_or_none()


async def update_company(db: AsyncSession, company: Company, **changes) -> Company:
    for key, value in changes.items():
        if value is not None:
            setattr(company, key, value)
    await db.flush()
    await db.refresh(company)
    return company
