import type {
  CdiConsentScope,
  CollateralType,
  DemoScenario,
  ExpectedRepaymentSource,
  ExpectedSalesChannel,
  LoanApplicationInput,
  LoanScoringInput,
  TransportMode,
} from "./types";
import { addDaysIso, hashToken, hasNonEmptyText, seededInt } from "./utils";

const DEMO_BASE_DATE_ISO = "2026-06-07";

const ALL_CDI_SCOPES: CdiConsentScope[] = [
  "trade_records",
  "cargo_records",
  "customs_declarations",
  "supplier_history",
  "sales_channel_summary",
];

const EXPECTED_REPAYMENT_SOURCES: ExpectedRepaymentSource[] = [
  "inventory_sales",
  "buyer_receivable",
  "marketplace_sales",
  "other",
];

const COLLATERAL_TYPES: CollateralType[] = [
  "none",
  "cash_deposit",
  "inventory",
  "insured_goods",
  "warehouse_receipt",
];

const EXPECTED_SALES_CHANNELS: ExpectedSalesChannel[] = [
  "marketplace",
  "own_website",
  "physical_store",
  "distributor",
  "mixed",
  "other",
];

const SCENARIO_INVOICE_DIGIT = {
  strong: "2",
  medium: "5",
  weak: "8",
  hard_stop: "9",
} satisfies Record<DemoScenario, string>;

export function inventLoanScoringInput(input: LoanApplicationInput): LoanScoringInput {
  const borrowerId = requireText(input.borrower_id, "borrower_id");
  const supplierName = requireText(input.supplier_name, "supplier_name");
  const supplierCountry = requireText(input.supplier_country, "supplier_country").toUpperCase();
  const productType = requireText(input.product_type, "product_type");
  const expectedRepaymentSource = requireEnum(
    input.expected_repayment_source,
    EXPECTED_REPAYMENT_SOURCES,
    "expected_repayment_source",
  );
  const collateralType = requireEnum(input.collateral?.type, COLLATERAL_TYPES, "collateral.type");
  const scenario = input.demo_scenario ?? inferDemoScenario(input);
  const seed = [borrowerId, supplierName, input.invoice_value_hkd].join("|");
  const token = hashToken(seed, 8).toUpperCase();
  const invoiceDigit = SCENARIO_INVOICE_DIGIT[scenario];
  const poDate = addDaysIso(DEMO_BASE_DATE_ISO, -seededInt(`${seed}|po-age`, 4, 16));
  const invoiceDate = addDaysIso(poDate, seededInt(`${seed}|invoice-lag`, 1, 3));
  const departureDate = addDaysIso(DEMO_BASE_DATE_ISO, seededInt(`${seed}|departure`, 2, 8));
  const deliveryDays = Math.max(1, Math.round(input.expected_delivery_days || 1));
  const transportMode = chooseTransportMode(supplierCountry, deliveryDays);
  const collateralValue = inferCollateralValue(
    collateralType,
    input.collateral?.value_hkd,
    input.loan_amount_hkd,
    input.invoice_value_hkd,
  );
  const salesContext = buildSalesContext(input, seed);

  return {
    request_id: `loanreq_demo_${token}`,
    borrower_id: borrowerId,
    loan_request: {
      loan_amount_hkd: Number(input.loan_amount_hkd),
      loan_duration_days: Number(input.loan_duration_days),
      expected_repayment_source: expectedRepaymentSource,
    },
    transaction: {
      purchase_order: {
        po_number: `PO-DEMO-${token}`,
        po_date: poDate,
        po_value_hkd: Number(input.purchase_order_value_hkd),
      },
      invoice: {
        invoice_number: `INV-DEMO-${token}${invoiceDigit}`,
        invoice_date: invoiceDate,
        invoice_value_hkd: Number(input.invoice_value_hkd),
      },
      supplier: {
        supplier_name: supplierName,
        supplier_country: supplierCountry,
        supplier_registration_id: supplierRegistrationId(supplierCountry, supplierName, token),
      },
      goods: {
        product_type: productType,
        description: input.goods_description ?? humanizeProductType(productType),
        quantity: inferQuantity(input.quantity, input.invoice_value_hkd, productType, seed),
        declared_goods_value_hkd: Number(input.invoice_value_hkd),
      },
      shipment: buildShipment(transportMode, supplierCountry, departureDate, deliveryDays, token),
      collateral: buildCollateral(collateralType, collateralValue, token),
      sales_context: salesContext,
    },
    cdi_consent: {
      consent_id: `consent_demo_${hashToken(`${seed}|consent`, 10).toUpperCase()}`,
      scopes: [...ALL_CDI_SCOPES],
    },
  };
}

function inferDemoScenario(input: LoanApplicationInput): DemoScenario {
  const loanAmount = input.loan_amount_hkd;
  const invoiceValue = input.invoice_value_hkd;
  const hasCollateral = input.collateral?.type !== undefined && input.collateral.type !== "none";

  if (
    hasCollateral &&
    invoiceValue > 0 &&
    loanAmount <= invoiceValue * 0.75 &&
    input.loan_duration_days <= 60
  ) {
    return "strong";
  }

  if (invoiceValue > 0 && loanAmount <= invoiceValue * 0.9) {
    return "medium";
  }

  return "weak";
}

function buildSalesContext(
  input: LoanApplicationInput,
  seed: string,
): LoanScoringInput["transaction"]["sales_context"] {
  const expectedSalesChannel = input.sales_context
    ? requireEnum(
        input.sales_context.expected_sales_channel,
        EXPECTED_SALES_CHANNELS,
        "sales_context.expected_sales_channel",
      )
    : "other";
  const expectedSellThroughDays = Math.max(
    14,
    Math.min(150, input.loan_duration_days - 7 || seededInt(`${seed}|sell-through`, 30, 75)),
  );

  return {
    expected_sales_channel: expectedSalesChannel,
    primary_marketplace: input.sales_context?.primary_marketplace,
    expected_sell_through_days: expectedSellThroughDays,
  };
}

function buildShipment(
  transportMode: TransportMode,
  supplierCountry: string,
  departureDate: string,
  deliveryDays: number,
  token: string,
): LoanScoringInput["transaction"]["shipment"] {
  const shipment: LoanScoringInput["transaction"]["shipment"] = {
    transport_mode: transportMode,
    origin_port: originPortForCountry(supplierCountry),
    destination_port: "Hong Kong",
    expected_departure_date: departureDate,
    expected_arrival_date: addDaysIso(departureDate, deliveryDays),
    bill_of_lading_number: `BL-${supplierCountry}-HKG-${token}`,
  };

  if (transportMode === "air") {
    shipment.air_waybill_number = `AWB-${supplierCountry}-HKG-${token}`;
  } else {
    shipment.container_numbers = [`TEMU${numericToken(token, 7)}`];
  }

  return shipment;
}

function buildCollateral(
  type: CollateralType,
  valueHkd: number,
  token: string,
): LoanScoringInput["transaction"]["collateral"] {
  const collateral: LoanScoringInput["transaction"]["collateral"] = {
    type,
    value_hkd: valueHkd,
  };

  if (type === "insured_goods") {
    collateral.insurance_policy_number = `INS-HKG-${token}`;
  }

  if (type === "warehouse_receipt") {
    collateral.warehouse_receipt_number = `WHR-HKG-${token}`;
  }

  return collateral;
}

function inferCollateralValue(
  collateralType: CollateralType,
  suppliedValue: number | undefined,
  loanAmount: number,
  invoiceValue: number,
): number {
  if (typeof suppliedValue === "number" && Number.isFinite(suppliedValue)) {
    return Math.max(0, suppliedValue);
  }

  if (collateralType === "none") {
    return 0;
  }

  if (collateralType === "cash_deposit") {
    return Math.max(0, Math.round(loanAmount));
  }

  if (collateralType === "warehouse_receipt" || collateralType === "insured_goods") {
    return Math.max(0, Math.round(invoiceValue));
  }

  return Math.max(0, Math.round(Math.min(invoiceValue, loanAmount * 0.75)));
}

function inferQuantity(
  suppliedQuantity: number | undefined,
  invoiceValue: number,
  productType: string,
  seed: string,
): number {
  if (typeof suppliedQuantity === "number" && Number.isFinite(suppliedQuantity) && suppliedQuantity > 0) {
    return Math.round(suppliedQuantity);
  }

  const unitValueByProduct: Array<[string, number]> = [
    ["electronics", 120],
    ["apparel", 85],
    ["fashion", 85],
    ["restaurant_equipment", 1_250],
    ["industrial", 750],
    ["food", 55],
  ];
  const normalizedProduct = productType.toLowerCase();
  const matchedUnitValue =
    unitValueByProduct.find(([productKey]) => normalizedProduct.includes(productKey))?.[1] ??
    seededInt(`${seed}|unit-value`, 90, 240);

  return Math.max(1, Math.round(Math.max(1, invoiceValue) / matchedUnitValue));
}

function chooseTransportMode(supplierCountry: string, deliveryDays: number): TransportMode {
  if (supplierCountry === "CN" && deliveryDays <= 7) {
    return "road";
  }

  if (deliveryDays <= 5) {
    return "air";
  }

  return "sea";
}

function originPortForCountry(country: string): string {
  const ports: Record<string, string> = {
    CN: "Yantian",
    HK: "Hong Kong",
    MO: "Macau",
    TW: "Kaohsiung",
    VN: "Hai Phong",
    MY: "Port Klang",
    TH: "Laem Chabang",
    ID: "Tanjung Priok",
    SG: "Singapore",
  };

  return ports[country] ?? `${country} Export Terminal`;
}

function supplierRegistrationId(country: string, supplierName: string, token: string): string {
  const countryPrefix = country.replace(/[^A-Z]/g, "").slice(0, 3) || "INT";
  const nameToken = hashToken(`${supplierName}|registration`, 6).toUpperCase();

  return `${countryPrefix}-${nameToken}-${token.slice(0, 4)}`;
}

function humanizeProductType(productType: string): string {
  return productType
    .split(/[_\s-]+/)
    .filter(Boolean)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

function numericToken(token: string, length: number): string {
  const digits = token
    .split("")
    .map((character) => character.charCodeAt(0) % 10)
    .join("");

  return digits.padEnd(length, "0").slice(0, length);
}

function requireText(value: unknown, fieldName: string): string {
  if (!hasNonEmptyText(value)) {
    throw new Error(`${fieldName} is required.`);
  }

  return value.trim();
}

function requireEnum<Value extends string>(
  value: unknown,
  allowedValues: Value[],
  fieldName: string,
): Value {
  if (typeof value === "string" && allowedValues.includes(value as Value)) {
    return value as Value;
  }

  throw new Error(`${fieldName} must be one of: ${allowedValues.join(", ")}.`);
}
