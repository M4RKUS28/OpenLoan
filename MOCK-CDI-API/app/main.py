from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.mock_logic import build_transaction_risk_response
from app.models import (
    HealthResponse,
    TransactionRiskEnrichmentRequest,
    TransactionRiskEnrichmentResponse,
)


app = FastAPI(
    title="Mock CDI Trade Risk Enrichment API",
    description=(
        "Hackathon mock API that returns CDI-style trade, shipment, supplier, "
        "order-normality, and sales-channel concentration signals for Hong Kong "
        "SME supply-chain lending demos."
    ),
    version="0.1.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/health", response_model=HealthResponse, tags=["Health"])
def health() -> HealthResponse:
    return HealthResponse(status="ok", service="mock-cdi-api")


@app.post(
    "/mock-cdi/v1/transaction-risk-enrichment",
    response_model=TransactionRiskEnrichmentResponse,
    tags=["Mock CDI"],
)
def transaction_risk_enrichment(
    payload: TransactionRiskEnrichmentRequest,
) -> TransactionRiskEnrichmentResponse:
    return build_transaction_risk_response(payload)
