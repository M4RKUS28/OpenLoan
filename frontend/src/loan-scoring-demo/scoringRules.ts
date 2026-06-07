import type {
  BorrowerComponentKey,
  BorrowerScoreRecord,
  LoanScoringInput,
  ScoreComponent,
  ScoreComponentDefinition,
  TransactionComponentKey,
} from "./types";
import { clamp, daysBetweenIso, hasNonEmptyText, isPositiveFiniteNumber, normalizeToken, round2 } from "./utils";

export const BORROWER_COMPONENT_DEFINITIONS: ScoreComponentDefinition<BorrowerComponentKey>[] = [
  {
    key: "repayment_history",
    label: "Past repayment history on our platform",
    weight_percent: 20,
  },
  {
    key: "current_platform_exposure",
    label: "Current exposure on our platform",
    weight_percent: 10,
  },
  {
    key: "business_age_continuity",
    label: "Business age and operating continuity",
    weight_percent: 5,
  },
  {
    key: "legal_compliance",
    label: "Legal/compliance status",
    weight_percent: 4,
  },
  {
    key: "kyb_consistency",
    label: "Basic borrower identity and KYB consistency",
    weight_percent: 2,
  },
  {
    key: "cdi_activity_continuity",
    label: "CDI-observed business activity continuity",
    weight_percent: 4,
  },
];

export const TRANSACTION_COMPONENT_DEFINITIONS: ScoreComponentDefinition<TransactionComponentKey>[] = [
  {
    key: "loan_to_invoice_reasonableness",
    label: "Loan-to-invoice / advance-rate reasonableness",
    weight_percent: 8,
  },
  {
    key: "collateral_recovery_quality",
    label: "Collateral/recovery quality",
    weight_percent: 10,
  },
  {
    key: "platform_order_normality",
    label: "Order normality based on our platform history",
    weight_percent: 7,
  },
  {
    key: "basic_transaction_completeness",
    label: "Basic transaction completeness",
    weight_percent: 5,
  },
  {
    key: "verified_trade_shipment",
    label: "Verified trade/shipment data",
    weight_percent: 14,
  },
  {
    key: "supplier_reliability",
    label: "Supplier reliability",
    weight_percent: 4,
  },
  {
    key: "cdi_order_normality",
    label: "CDI-based order normality",
    weight_percent: 4,
  },
  {
    key: "buyer_channel_concentration",
    label: "Buyer/customer/channel concentration risk",
    weight_percent: 3,
  },
];

export function buildScoreComponent<Key extends string>(
  definition: ScoreComponentDefinition<Key>,
  rawScore: number,
): ScoreComponent {
  const raw_score_0_100 = round2(clamp(rawScore, 0, 100));

  return {
    key: definition.key,
    label: definition.label,
    weight_percent: definition.weight_percent,
    raw_score_0_100,
    weighted_points: round2((raw_score_0_100 * definition.weight_percent) / 100),
  };
}

export function buildBorrowerScoreComponents(record: BorrowerScoreRecord): ScoreComponent[] {
  return BORROWER_COMPONENT_DEFINITIONS.map((definition) =>
    buildScoreComponent(definition, record.component_scores[definition.key]),
  );
}

export function getInternalShowstopper(input: LoanScoringInput): string | null {
  if (input.loan_request.loan_amount_hkd <= 0) {
    return "Loan amount must be positive.";
  }

  if (input.loan_request.loan_duration_days <= 0) {
    return "Loan duration must be positive.";
  }

  if (input.transaction.invoice.invoice_value_hkd <= 0) {
    return "Invoice value must be positive.";
  }

  if (input.loan_request.loan_amount_hkd > input.transaction.invoice.invoice_value_hkd) {
    return "Requested loan amount exceeds invoice value.";
  }

  return null;
}

export function buildLocalTransactionComponents(
  input: LoanScoringInput,
  borrowerRecord: BorrowerScoreRecord,
): {
  components: Partial<Record<TransactionComponentKey, ScoreComponent>>;
  showstopper: string | null;
} {
  const loanToInvoice = scoreLoanToInvoiceReasonableness(input);

  return {
    components: {
      loan_to_invoice_reasonableness: buildScoreComponent(
        getTransactionDefinition("loan_to_invoice_reasonableness"),
        loanToInvoice.rawScore,
      ),
      collateral_recovery_quality: buildScoreComponent(
        getTransactionDefinition("collateral_recovery_quality"),
        scoreCollateralRecoveryQuality(input),
      ),
      platform_order_normality: buildScoreComponent(
        getTransactionDefinition("platform_order_normality"),
        scorePlatformOrderNormality(input, borrowerRecord),
      ),
      basic_transaction_completeness: buildScoreComponent(
        getTransactionDefinition("basic_transaction_completeness"),
        scoreBasicTransactionCompleteness(input),
      ),
    },
    showstopper: loanToInvoice.showstopper,
  };
}

export function sumWeightedPoints(components: ScoreComponent[]): number {
  return round2(components.reduce((sum, component) => sum + component.weighted_points, 0));
}

export function getTransactionDefinition(
  key: TransactionComponentKey,
): ScoreComponentDefinition<TransactionComponentKey> {
  const definition = TRANSACTION_COMPONENT_DEFINITIONS.find((candidate) => candidate.key === key);

  if (!definition) {
    throw new Error(`Unknown transaction score component: ${key}`);
  }

  return definition;
}

function scoreLoanToInvoiceReasonableness(input: LoanScoringInput): {
  rawScore: number;
  showstopper: string | null;
} {
  const loanAmount = input.loan_request.loan_amount_hkd;
  const invoiceValue = input.transaction.invoice.invoice_value_hkd;

  if (invoiceValue <= 0 || loanAmount <= 0) {
    return { rawScore: 0, showstopper: null };
  }

  const advanceRate = loanAmount / invoiceValue;

  if (advanceRate <= 0.6) {
    return { rawScore: 95, showstopper: null };
  }

  if (advanceRate <= 0.75) {
    return { rawScore: 85, showstopper: null };
  }

  if (advanceRate <= 0.9) {
    return { rawScore: 65, showstopper: null };
  }

  if (advanceRate <= 1) {
    return { rawScore: 40, showstopper: null };
  }

  return {
    rawScore: 10,
    showstopper: "Requested loan amount exceeds invoice value.",
  };
}

function scoreCollateralRecoveryQuality(input: LoanScoringInput): number {
  const collateral = input.transaction.collateral;
  const loanAmount = input.loan_request.loan_amount_hkd;
  const baseByType = {
    cash_deposit: 95,
    warehouse_receipt: 85,
    insured_goods: 75,
    inventory: 55,
    none: 25,
  } satisfies Record<LoanScoringInput["transaction"]["collateral"]["type"], number>;
  const baseScore = baseByType[collateral.type];
  const coverage = loanAmount > 0 ? Math.max(0, collateral.value_hkd) / loanAmount : 0;

  if (coverage >= 1) {
    return baseScore;
  }

  if (coverage >= 0.75) {
    return clamp(baseScore - 5, 0, 100);
  }

  if (coverage >= 0.5) {
    return clamp(baseScore - 15, 0, 100);
  }

  if (coverage > 0) {
    return clamp(baseScore - 30, 0, 100);
  }

  return Math.min(baseScore, 20);
}

function scorePlatformOrderNormality(
  input: LoanScoringInput,
  borrowerRecord: BorrowerScoreRecord,
): number {
  const history = borrowerRecord.platform_history;

  if (!history) {
    return 45;
  }

  let score = 100;
  const invoiceValue = input.transaction.invoice.invoice_value_hkd;
  const medianInvoiceValue = history.median_invoice_value_hkd;
  const loanDuration = input.loan_request.loan_duration_days;
  const usualDuration = history.usual_loan_duration_days;
  const productType = normalizeToken(input.transaction.goods.product_type);
  const supplierCountry = input.transaction.supplier.supplier_country.trim().toUpperCase();

  if (medianInvoiceValue > 0) {
    if (invoiceValue > medianInvoiceValue * 2.5) {
      score -= 35;
    } else if (invoiceValue > medianInvoiceValue * 1.5) {
      score -= 15;
    }
  }

  if (usualDuration > 0) {
    if (loanDuration > usualDuration * 1.75) {
      score -= 20;
    } else if (loanDuration > usualDuration * 1.25) {
      score -= 10;
    }
  }

  const commonProductTypes = history.common_product_types.map(normalizeToken);
  const commonSupplierCountries = history.common_supplier_countries.map((country) =>
    country.trim().toUpperCase(),
  );

  if (!commonProductTypes.includes(productType)) {
    score -= 15;
  }

  if (!commonSupplierCountries.includes(supplierCountry)) {
    score -= 10;
  }

  return clamp(score, 0, 100);
}

function scoreBasicTransactionCompleteness(input: LoanScoringInput): number {
  const shipmentDays = daysBetweenIso(
    input.transaction.shipment.expected_departure_date,
    input.transaction.shipment.expected_arrival_date,
  );
  const checks = [
    isPositiveFiniteNumber(input.transaction.purchase_order.po_value_hkd),
    isPositiveFiniteNumber(input.transaction.invoice.invoice_value_hkd),
    hasNonEmptyText(input.transaction.supplier.supplier_name),
    hasNonEmptyText(input.transaction.supplier.supplier_country),
    hasNonEmptyText(input.transaction.goods.product_type),
    Number.isFinite(shipmentDays) && shipmentDays > 0,
    hasNonEmptyText(input.loan_request.expected_repayment_source),
    isPositiveFiniteNumber(input.loan_request.loan_amount_hkd),
    isPositiveFiniteNumber(input.loan_request.loan_duration_days),
  ];
  const invalidCount = checks.filter((isValid) => !isValid).length;

  return clamp(100 - invalidCount * 10, 0, 100);
}
