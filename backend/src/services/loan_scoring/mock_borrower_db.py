from .types import (
    BorrowerComponentScores,
    BorrowerProfile,
    BorrowerScoreRecord,
    PlatformHistory,
)
from .utils import hash_token

BORROWER_SCORE_RECORDS: dict[str, BorrowerScoreRecord] = {
    "brw_001": BorrowerScoreRecord(
        borrower_id="brw_001",
        borrower_profile=BorrowerProfile(
            legal_name="Harbour Retail Imports Limited",
            hong_kong_business_registration_number="74219368",
            company_registry_number="CR-2994817",
            registered_address="Unit 1204, Kowloon Commerce Centre, Kwai Chung, Hong Kong",
        ),
        component_scores=BorrowerComponentScores(
            repayment_history=96,
            current_platform_exposure=90,
            business_age_continuity=88,
            legal_compliance=95,
            kyb_consistency=96,
            cdi_activity_continuity=89,
        ),
        platform_history=PlatformHistory(
            median_invoice_value_hkd=600_000,
            usual_loan_duration_days=60,
            common_product_types=[
                "consumer_electronics_accessories",
                "electronics_accessories",
                "mobile_phone_accessories",
            ],
            common_supplier_countries=["CN", "HK"],
        ),
    ),
    "brw_002": BorrowerScoreRecord(
        borrower_id="brw_002",
        borrower_profile=BorrowerProfile(
            legal_name="Causeway Apparel Trading Limited",
            hong_kong_business_registration_number="61582047",
            company_registry_number="CR-2219044",
            registered_address="18/F, Lee Garden Three, Causeway Bay, Hong Kong",
        ),
        component_scores=BorrowerComponentScores(
            repayment_history=76,
            current_platform_exposure=62,
            business_age_continuity=75,
            legal_compliance=88,
            kyb_consistency=84,
            cdi_activity_continuity=70,
        ),
        platform_history=PlatformHistory(
            median_invoice_value_hkd=300_000,
            usual_loan_duration_days=75,
            common_product_types=["apparel_fashion_goods", "apparel", "fashion_goods"],
            common_supplier_countries=["CN", "VN"],
        ),
    ),
    "brw_003": BorrowerScoreRecord(
        borrower_id="brw_003",
        borrower_profile=BorrowerProfile(
            legal_name="New Territories Home Goods Company Limited",
            hong_kong_business_registration_number="50873194",
            company_registry_number="CR-3190041",
            registered_address="Workshop B, Tuen Mun Industrial Centre, Hong Kong",
        ),
        component_scores=BorrowerComponentScores(
            repayment_history=48,
            current_platform_exposure=45,
            business_age_continuity=52,
            legal_compliance=72,
            kyb_consistency=65,
            cdi_activity_continuity=50,
        ),
        platform_history=PlatformHistory(
            median_invoice_value_hkd=150_000,
            usual_loan_duration_days=45,
            common_product_types=["home_goods", "general_merchandise"],
            common_supplier_countries=["CN"],
        ),
    ),
    "brw_004": BorrowerScoreRecord(
        borrower_id="brw_004",
        borrower_profile=BorrowerProfile(
            legal_name="Pearl River Wholesale Distribution Limited",
            hong_kong_business_registration_number="83920416",
            company_registry_number="CR-1886422",
            registered_address="Suite 2301, Tower 2, The Gateway, Tsim Sha Tsui, Hong Kong",
        ),
        component_scores=BorrowerComponentScores(
            repayment_history=88,
            current_platform_exposure=70,
            business_age_continuity=86,
            legal_compliance=92,
            kyb_consistency=90,
            cdi_activity_continuity=82,
        ),
        platform_history=PlatformHistory(
            median_invoice_value_hkd=1_000_000,
            usual_loan_duration_days=75,
            common_product_types=[
                "wholesale_household_goods",
                "industrial_components",
                "consumer_electronics_accessories",
            ],
            common_supplier_countries=["CN", "MY", "VN"],
        ),
    ),
    "brw_005": BorrowerScoreRecord(
        borrower_id="brw_005",
        borrower_profile=BorrowerProfile(
            legal_name="Golden Bauhinia Catering Supplies Limited",
            hong_kong_business_registration_number="70458231",
            company_registry_number="CR-2741190",
            registered_address="Unit 9, 6/F, Wah Fat Industrial Building, Kwun Tong, Hong Kong",
        ),
        component_scores=BorrowerComponentScores(
            repayment_history=82,
            current_platform_exposure=78,
            business_age_continuity=80,
            legal_compliance=90,
            kyb_consistency=86,
            cdi_activity_continuity=76,
        ),
        platform_history=PlatformHistory(
            median_invoice_value_hkd=420_000,
            usual_loan_duration_days=60,
            common_product_types=["restaurant_equipment", "packaged_food", "consumer_goods"],
            common_supplier_countries=["CN", "TW"],
        ),
    ),
}


def get_borrower_score_record(borrower_id: str) -> BorrowerScoreRecord:
    return BORROWER_SCORE_RECORDS.get(borrower_id) or _default_thin_file_borrower(borrower_id)


def _default_thin_file_borrower(borrower_id: str) -> BorrowerScoreRecord:
    token = hash_token(f"default-borrower|{borrower_id}", 8).upper()
    return BorrowerScoreRecord(
        borrower_id=borrower_id,
        borrower_profile=BorrowerProfile(
            legal_name=f"Thin File Demo Borrower {token}",
            hong_kong_business_registration_number=f"BR-{token}",
            registered_address="Hong Kong",
        ),
        component_scores=BorrowerComponentScores(
            repayment_history=42,
            current_platform_exposure=50,
            business_age_continuity=45,
            legal_compliance=65,
            kyb_consistency=58,
            cdi_activity_continuity=45,
        ),
        platform_history=PlatformHistory(
            median_invoice_value_hkd=120_000,
            usual_loan_duration_days=45,
            common_product_types=[],
            common_supplier_countries=[],
        ),
    )
