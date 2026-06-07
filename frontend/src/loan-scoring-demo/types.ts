export type ExpectedRepaymentSource =
  | "inventory_sales"
  | "buyer_receivable"
  | "marketplace_sales"
  | "other";

export type CollateralType =
  | "none"
  | "cash_deposit"
  | "inventory"
  | "insured_goods"
  | "warehouse_receipt";

export type ExpectedSalesChannel =
  | "marketplace"
  | "own_website"
  | "physical_store"
  | "distributor"
  | "mixed"
  | "other";

export type DemoScenario = "strong" | "medium" | "weak" | "hard_stop";

export type TransportMode = "sea" | "air" | "road" | "rail";

export type CdiConsentScope =
  | "trade_records"
  | "cargo_records"
  | "customs_declarations"
  | "supplier_history"
  | "sales_channel_summary";

export interface LoanApplicationInput {
  [metadataKey: `_${string}`]: unknown;

  borrower_id: string;

  loan_amount_hkd: number;
  loan_duration_days: number;

  purchase_order_value_hkd: number;
  invoice_value_hkd: number;

  supplier_name: string;
  supplier_country: string;

  product_type: string;
  goods_description?: string;
  quantity?: number;

  expected_delivery_days: number;

  expected_repayment_source: ExpectedRepaymentSource;

  collateral: {
    type: CollateralType;
    value_hkd?: number;
  };

  sales_context?: {
    expected_sales_channel: ExpectedSalesChannel;
    primary_marketplace?: string;
  };

  demo_scenario?: DemoScenario;
}

export interface LoanScoringInput {
  request_id: string;
  borrower_id: string;

  loan_request: {
    loan_amount_hkd: number;
    loan_duration_days: number;
    expected_repayment_source: ExpectedRepaymentSource;
  };

  transaction: {
    purchase_order: {
      po_number: string;
      po_date: string;
      po_value_hkd: number;
    };

    invoice: {
      invoice_number: string;
      invoice_date: string;
      invoice_value_hkd: number;
    };

    supplier: {
      supplier_name: string;
      supplier_country: string;
      supplier_registration_id: string;
    };

    goods: {
      product_type: string;
      description?: string;
      quantity?: number;
      declared_goods_value_hkd: number;
    };

    shipment: {
      transport_mode: TransportMode;
      origin_port: string;
      destination_port: string;
      expected_departure_date: string;
      expected_arrival_date: string;
      bill_of_lading_number?: string;
      air_waybill_number?: string;
      container_numbers?: string[];
    };

    collateral: {
      type: CollateralType;
      value_hkd: number;
      insurance_policy_number?: string;
      warehouse_receipt_number?: string;
    };

    sales_context?: {
      expected_sales_channel: ExpectedSalesChannel;
      primary_marketplace?: string;
      expected_sell_through_days?: number;
    };
  };

  cdi_consent: {
    consent_id: string;
    scopes: CdiConsentScope[];
  };
}

export interface ScoreComponent {
  key: string;
  label: string;
  weight_percent: number;
  raw_score_0_100: number;
  weighted_points: number;
}

export interface LoanScoreResult {
  request_id: string;
  borrower_id: string;

  total_score: number;
  borrower_score: number;
  transaction_score: number;

  showstopper: string | null;

  borrower_components: ScoreComponent[];
  transaction_components: ScoreComponent[];
}

export interface BorrowerScoreRecord {
  borrower_id: string;

  borrower_profile: {
    legal_name: string;
    hong_kong_business_registration_number: string;
    company_registry_number?: string;
    registered_address?: string;
  };

  component_scores: {
    repayment_history: number;
    current_platform_exposure: number;
    business_age_continuity: number;
    legal_compliance: number;
    kyb_consistency: number;
    cdi_activity_continuity: number;
  };

  platform_history?: {
    median_invoice_value_hkd: number;
    usual_loan_duration_days: number;
    common_product_types: string[];
    common_supplier_countries: string[];
  };
}

export type BorrowerComponentKey = keyof BorrowerScoreRecord["component_scores"];

export type TransactionComponentKey =
  | "loan_to_invoice_reasonableness"
  | "collateral_recovery_quality"
  | "platform_order_normality"
  | "basic_transaction_completeness"
  | "verified_trade_shipment"
  | "supplier_reliability"
  | "cdi_order_normality"
  | "buyer_channel_concentration";

export interface ScoreComponentDefinition<Key extends string = string> {
  key: Key;
  label: string;
  weight_percent: number;
}

export interface CdiClientOptions {
  cdiBaseUrl?: string;
  fetchFn?: typeof fetch;
}

export type ScoreLoanRequestOptions = CdiClientOptions;

export interface MockCdiTransactionRiskEnrichmentRequest {
  request_id: string;
  consent: LoanScoringInput["cdi_consent"];
  borrower: {
    platform_borrower_id: string;
    legal_name: string;
    hong_kong_business_registration_number: string;
    company_registry_number?: string;
    registered_address: string;
  };
  loan_request: {
    loan_amount_hkd: number;
    loan_duration_days: number;
    loan_purpose: string;
    expected_repayment_source: ExpectedRepaymentSource;
  };
  declared_transaction: {
    purchase_order: LoanScoringInput["transaction"]["purchase_order"];
    invoice: LoanScoringInput["transaction"]["invoice"] & {
      invoice_file_hash?: string;
    };
    supplier: LoanScoringInput["transaction"]["supplier"];
    goods: Required<LoanScoringInput["transaction"]["goods"]>;
    shipment: LoanScoringInput["transaction"]["shipment"] & {
      bill_of_lading_number: string;
      container_numbers: string[];
    };
    sales_context: {
      expected_sales_channel: ExpectedSalesChannel;
      primary_marketplace?: string;
      expected_sell_through_days: number;
    };
  };
}

export interface MockCdiHardStopFlag {
  code: string;
  severity: "block" | "warning";
  message: string;
}

export interface MockCdiTransactionRiskEnrichmentResponse {
  cdi_request_id: string;
  request_id: string;
  response_generated_at: string;
  borrower_match: {
    matched: boolean;
    match_confidence: number;
    matched_business_registration_number: string;
    matched_company_name: string;
  };
  risk_signals: {
    trade_shipment_verification: {
      score_0_100: number;
    };
    supplier_reliability: {
      score_0_100: number;
    };
    order_normality: {
      score_0_100: number;
    };
    buyer_channel_concentration: {
      score_0_100: number;
    };
  };
  hard_stop_flags?: MockCdiHardStopFlag[];
  data_limitations?: string[];
}
