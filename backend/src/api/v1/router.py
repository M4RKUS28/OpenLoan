from fastapi import APIRouter

from src.api.v1.endpoints.bids import router as bids_router
from src.api.v1.endpoints.companies import router as companies_router
from src.api.v1.endpoints.files import router as files_router
from src.api.v1.endpoints.loans import router as loans_router

api_router = APIRouter(prefix="/v1")
api_router.include_router(files_router)
api_router.include_router(companies_router)
api_router.include_router(loans_router)
api_router.include_router(bids_router)
