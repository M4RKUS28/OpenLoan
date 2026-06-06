"""Idempotent demo seed.

Populates the marketplace with a set of realistic Greater Bay Area trade deals
so the app looks alive on first run. Runs only when the loans table is empty.
"""

import logging
from datetime import datetime, timedelta, timezone
from decimal import Decimal

from src.db.crud.bid import create_bid
from src.db.crud.company import create_company
from src.db.crud.loan import count_loans, create_loan
from src.db.database import AsyncSessionLocal
from src.services.scoring import compute_score

logger = logging.getLogger(__name__)


_COMPANIES = [
    {
        "name": "Pearl River Electronics Ltd",
        "industry": "Electronics",
        "city": "Hong Kong",
        "description": "Importer and distributor of consumer electronics sourced across the "
        "Greater Bay Area, supplying retail chains throughout Hong Kong and Macau.",
        "website": "https://example.com/pearlriver",
        "founded_year": 2014,
        "employees": 48,
        "annual_revenue": 92_000_000,
        "registration_no": "HK-1849201",
        "contact_name": "Daniel Cheung",
    },
    {
        "name": "Victoria Harbour Textiles",
        "industry": "Textiles & Apparel",
        "city": "Kwun Tong",
        "description": "Export-focused garment manufacturer shipping finished apparel to "
        "European and North American buyers.",
        "website": "https://example.com/vhtextiles",
        "founded_year": 2009,
        "employees": 120,
        "annual_revenue": 154_000_000,
        "registration_no": "HK-1120945",
        "contact_name": "Mei Lin Wong",
    },
    {
        "name": "Kowloon Fresh Foods Co.",
        "industry": "Food & Beverage",
        "city": "Kowloon",
        "description": "Cold-chain importer of premium produce and seafood serving Hong Kong's "
        "hospitality sector.",
        "website": "https://example.com/klnfresh",
        "founded_year": 2017,
        "employees": 65,
        "annual_revenue": 71_000_000,
        "registration_no": "HK-2204113",
        "contact_name": "Ricky Tam",
    },
    {
        "name": "Lantau Auto Parts",
        "industry": "Automotive",
        "city": "Tuen Mun",
        "description": "Wholesale distributor of automotive components for the Pearl River Delta "
        "aftermarket.",
        "website": "https://example.com/lantauauto",
        "founded_year": 2012,
        "employees": 33,
        "annual_revenue": 58_000_000,
        "registration_no": "HK-1730887",
        "contact_name": "Samuel Ho",
    },
    {
        "name": "Jade Dragon Cosmetics",
        "industry": "Beauty & Personal Care",
        "city": "Causeway Bay",
        "description": "Cross-border beauty brand importing K-beauty and J-beauty lines for "
        "distribution across the GBA.",
        "website": "https://example.com/jadedragon",
        "founded_year": 2019,
        "employees": 27,
        "annual_revenue": 39_000_000,
        "registration_no": "HK-2511630",
        "contact_name": "Christy Lau",
    },
]

# (company_index, loan dict, status)
_DEALS = [
    (
        0,
        {
            "title": "Import of consumer electronics from Shenzhen",
            "goods": "Smartphones, tablets & accessories",
            "purpose": "Pre-finance a bulk electronics order ahead of the Q4 retail season.",
            "trade_type": "import",
            "industry": "Electronics",
            "origin_country": "Mainland China",
            "destination_country": "Hong Kong SAR",
            "amount": Decimal("850000"),
            "term_days": 90,
            "interest_rate": 8.5,
        },
        "open",
    ),
    (
        1,
        {
            "title": "Export order — apparel shipment to Hamburg",
            "goods": "Finished garments (40ft container)",
            "purpose": "Bridge working capital between supplier payment and buyer settlement.",
            "trade_type": "export",
            "industry": "Textiles & Apparel",
            "origin_country": "Hong Kong SAR",
            "destination_country": "Germany",
            "amount": Decimal("420000"),
            "term_days": 120,
            "interest_rate": 9.2,
        },
        "open",
    ),
    (
        2,
        {
            "title": "Cold-chain seafood import from Japan",
            "goods": "Frozen seafood, premium grade",
            "purpose": "Finance a refrigerated shipment for the year-end hospitality demand.",
            "trade_type": "import",
            "industry": "Food & Beverage",
            "origin_country": "Japan",
            "destination_country": "Hong Kong SAR",
            "amount": Decimal("260000"),
            "term_days": 60,
            "interest_rate": 7.8,
        },
        "open",
    ),
    (
        3,
        {
            "title": "Automotive parts restock — PRD aftermarket",
            "goods": "Brake systems & filters",
            "purpose": "Replenish inventory ahead of distributor contracts.",
            "trade_type": "import",
            "industry": "Automotive",
            "origin_country": "Mainland China",
            "destination_country": "Hong Kong SAR",
            "amount": Decimal("180000"),
            "term_days": 75,
            "interest_rate": 8.0,
        },
        "open",
    ),
    (
        4,
        {
            "title": "K-beauty product line import",
            "goods": "Skincare & cosmetics",
            "purpose": "Fund a seasonal product launch across GBA retail partners.",
            "trade_type": "import",
            "industry": "Beauty & Personal Care",
            "origin_country": "South Korea",
            "destination_country": "Hong Kong SAR",
            "amount": Decimal("310000"),
            "term_days": 90,
            "interest_rate": 9.8,
        },
        "open",
    ),
    (
        0,
        {
            "title": "Wearables shipment — completed Q2 deal",
            "goods": "Smartwatches & earbuds",
            "purpose": "Settled trade financing for a spring electronics order.",
            "trade_type": "import",
            "industry": "Electronics",
            "origin_country": "Mainland China",
            "destination_country": "Hong Kong SAR",
            "amount": Decimal("540000"),
            "term_days": 90,
            "interest_rate": 8.3,
        },
        "repaid",
    ),
    (
        1,
        {
            "title": "Premium fabric import — funded",
            "goods": "Italian wool & silk blends",
            "purpose": "Inventory build for a luxury apparel contract.",
            "trade_type": "import",
            "industry": "Textiles & Apparel",
            "origin_country": "Italy",
            "destination_country": "Hong Kong SAR",
            "amount": Decimal("390000"),
            "term_days": 100,
            "interest_rate": 8.9,
        },
        "funded",
    ),
]


async def seed_demo_data() -> None:
    async with AsyncSessionLocal() as db:
        try:
            if await count_loans(db) > 0:
                return

            logger.info("[seed] Empty marketplace — inserting demo deals…")
            companies = []
            for i, c in enumerate(_COMPANIES):
                company = await create_company(db, owner_user_id=f"seed-user-{i}", **c)
                companies.append(company)

            now = datetime.now(timezone.utc)
            created_loans = []
            for idx, (ci, deal, status) in enumerate(_DEALS):
                company = companies[ci]
                result = compute_score(
                    company_name=company.name,
                    title=deal["title"],
                    amount=deal["amount"],
                    term_days=deal["term_days"],
                    interest_rate=deal["interest_rate"],
                    industry=deal["industry"],
                    documents=3,
                )
                deadline = now + timedelta(days=7 + (idx * 3))
                funded_amount = deal["amount"] if status in ("funded", "repaid") else Decimal("0")
                loan = await create_loan(
                    db,
                    company_id=company.id,
                    owner_user_id=company.owner_user_id,
                    status=status,
                    risk_score=result.score,
                    risk_grade=result.grade,
                    auction_deadline=deadline,
                    funded_amount=funded_amount,
                    currency="HKD",
                    **deal,
                )
                created_loans.append(loan)

            # A few competing bids on the first open deal.
            first = created_loans[0]
            sample_bids = [
                ("Meridian Private Credit", Decimal("850000"), 8.1),
                ("Harbour Capital Partners", Decimal("850000"), 7.9),
                ("GBA Family Office", Decimal("500000"), 8.4),
            ]
            for name, amount, rate in sample_bids:
                await create_bid(
                    db,
                    loan_id=first.id,
                    lender_user_id=f"seed-lender-{name[:6]}",
                    lender_name=name,
                    amount=amount,
                    interest_rate=rate,
                    status="pending",
                )

            await db.commit()
            logger.info("[seed] Inserted %d companies and %d deals.", len(companies), len(_DEALS))
        except Exception:
            await db.rollback()
            logger.exception("[seed] Failed to seed demo data")
