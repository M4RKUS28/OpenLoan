import type {
  BorrowerScoreRecord,
  CdiClientOptions,
  MockCdiTransactionRiskEnrichmentRequest,
  MockCdiTransactionRiskEnrichmentResponse,
  LoanScoringInput,
} from "./types";

const DEFAULT_MOCK_CDI_BASE_URL = "http://localhost:8000";
const TRANSACTION_RISK_ENDPOINT = "/mock-cdi/v1/transaction-risk-enrichment";

export async function fetchCdiTransactionRiskEnrichment(
  input: LoanScoringInput,
  borrowerRecord: BorrowerScoreRecord,
  options: CdiClientOptions = {},
): Promise<MockCdiTransactionRiskEnrichmentResponse> {
  const fetcher = options.fetchFn ?? globalThis.fetch;

  if (!fetcher) {
    throw new Error("Native fetch is not available in this runtime.");
  }

  const baseUrl = resolveMockCdiBaseUrl(options.cdiBaseUrl);
  const response = await fetcher(`${baseUrl}${TRANSACTION_RISK_ENDPOINT}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(buildCdiRequest(input, borrowerRecord)),
  });

  if (!response.ok) {
    throw new Error(`CDI mock API returned HTTP ${response.status}.`);
  }

  return (await response.json()) as MockCdiTransactionRiskEnrichmentResponse;
}

export function buildCdiRequest(
  input: LoanScoringInput,
  borrowerRecord: BorrowerScoreRecord,
): MockCdiTransactionRiskEnrichmentRequest {
  const transaction = input.transaction;
  const salesContext = transaction.sales_context ?? {
    expected_sales_channel: "other" as const,
    expected_sell_through_days: Math.max(1, input.loan_request.loan_duration_days),
  };

  return {
    request_id: input.request_id,
    consent: input.cdi_consent,
    borrower: {
      platform_borrower_id: borrowerRecord.borrower_id,
      legal_name: borrowerRecord.borrower_profile.legal_name,
      hong_kong_business_registration_number:
        borrowerRecord.borrower_profile.hong_kong_business_registration_number,
      company_registry_number: borrowerRecord.borrower_profile.company_registry_number,
      registered_address: borrowerRecord.borrower_profile.registered_address ?? "Hong Kong",
    },
    loan_request: {
      loan_amount_hkd: input.loan_request.loan_amount_hkd,
      loan_duration_days: input.loan_request.loan_duration_days,
      loan_purpose: "Short-term supply-chain financing for declared trade transaction",
      expected_repayment_source: input.loan_request.expected_repayment_source,
    },
    declared_transaction: {
      purchase_order: transaction.purchase_order,
      invoice: transaction.invoice,
      supplier: transaction.supplier,
      goods: {
        product_type: transaction.goods.product_type,
        description: transaction.goods.description ?? transaction.goods.product_type,
        quantity: transaction.goods.quantity ?? 1,
        declared_goods_value_hkd: transaction.goods.declared_goods_value_hkd,
      },
      shipment: {
        ...transaction.shipment,
        bill_of_lading_number:
          transaction.shipment.bill_of_lading_number ??
          transaction.shipment.air_waybill_number ??
          `BL-${input.request_id}`,
        container_numbers: transaction.shipment.container_numbers ?? [],
      },
      sales_context: {
        expected_sales_channel: salesContext.expected_sales_channel,
        primary_marketplace: salesContext.primary_marketplace,
        expected_sell_through_days:
          salesContext.expected_sell_through_days ?? Math.max(1, input.loan_request.loan_duration_days),
      },
    },
  };
}

export function resolveMockCdiBaseUrl(explicitBaseUrl?: string): string {
  const runtimeEnv = globalThis as {
    process?: {
      env?: Record<string, string | undefined>;
    };
  };
  const viteEnv = import.meta as unknown as {
    env?: Record<string, string | undefined>;
  };
  const baseUrl =
    explicitBaseUrl ??
    runtimeEnv.process?.env?.MOCK_CDI_BASE_URL ??
    viteEnv.env?.MOCK_CDI_BASE_URL ??
    viteEnv.env?.VITE_MOCK_CDI_BASE_URL ??
    DEFAULT_MOCK_CDI_BASE_URL;

  return baseUrl.replace(/\/+$/, "");
}
