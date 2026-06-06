import uuid
from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field


class CompanyUpsertRequest(BaseModel):
    name: str = Field(min_length=2, max_length=255)
    industry: str = Field(default="Trade", max_length=120)
    country: str = Field(default="Hong Kong SAR", max_length=120)
    city: str | None = Field(default=None, max_length=120)
    description: str | None = None
    website: str | None = Field(default=None, max_length=255)
    logo_url: str | None = Field(default=None, max_length=1024)
    founded_year: int | None = Field(default=None, ge=1800, le=2100)
    employees: int | None = Field(default=None, ge=0)
    annual_revenue: int | None = Field(default=None, ge=0)
    registration_no: str | None = Field(default=None, max_length=120)
    contact_name: str | None = Field(default=None, max_length=255)
    contact_email: str | None = Field(default=None, max_length=255)


class CompanySummary(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    name: str
    industry: str
    country: str
    city: str | None = None
    website: str | None = None
    logo_url: str | None = None


class CompanyResponse(CompanySummary):
    owner_user_id: str
    description: str | None = None
    founded_year: int | None = None
    employees: int | None = None
    annual_revenue: int | None = None
    registration_no: str | None = None
    contact_name: str | None = None
    contact_email: str | None = None
    created_at: datetime
    updated_at: datetime
