import type { DemoScenario, LoanApplicationInput } from "./types";

export interface MockDocumentExtractionContext {
  demo_scenario?: DemoScenario;
  borrower_id?: string;
  existing_fields?: Partial<LoanApplicationInput>;
  files?: readonly { name: string }[];
}

const DEFAULTS_BY_SCENARIO: Record<DemoScenario, LoanApplicationInput> = {
  strong: {
    borrower_id: "brw_001",
    loan_amount_hkd: 420_000,
    loan_duration_days: 60,
    purchase_order_value_hkd: 600_000,
    invoice_value_hkd: 600_000,
    supplier_name: "Shenzhen Pearl Electronics Co Ltd",
    supplier_country: "CN",
    product_type: "consumer_electronics_accessories",
    goods_description: "Wireless chargers, phone cases, and USB-C accessories",
    quantity: 12_000,
    expected_delivery_days: 5,
    expected_repayment_source: "marketplace_sales",
    collateral: { type: "insured_goods", value_hkd: 600_000 },
    sales_context: {
      expected_sales_channel: "marketplace",
      primary_marketplace: "HKTVmall",
    },
    demo_scenario: "strong",
  },
  medium: {
    borrower_id: "brw_002",
    loan_amount_hkd: 268_000,
    loan_duration_days: 75,
    purchase_order_value_hkd: 330_000,
    invoice_value_hkd: 320_000,
    supplier_name: "Ho Chi Minh Fashion Manufacturing JSC",
    supplier_country: "VN",
    product_type: "apparel_fashion_goods",
    goods_description: "Summer apparel and casualwear inventory",
    quantity: 3_800,
    expected_delivery_days: 14,
    expected_repayment_source: "inventory_sales",
    collateral: { type: "inventory", value_hkd: 200_000 },
    sales_context: {
      expected_sales_channel: "mixed",
    },
    demo_scenario: "medium",
  },
  weak: {
    borrower_id: "brw_003",
    loan_amount_hkd: 400_000,
    loan_duration_days: 90,
    purchase_order_value_hkd: 430_000,
    invoice_value_hkd: 420_000,
    supplier_name: "Dongguan Smart Living Products Co Ltd",
    supplier_country: "CN",
    product_type: "smart_home_devices",
    goods_description: "Smart home hubs and connected sensors for resale",
    quantity: 2_500,
    expected_delivery_days: 9,
    expected_repayment_source: "inventory_sales",
    collateral: { type: "none" },
    sales_context: {
      expected_sales_channel: "own_website",
    },
    demo_scenario: "weak",
  },
  hard_stop: {
    borrower_id: "brw_005",
    loan_amount_hkd: 300_000,
    loan_duration_days: 60,
    purchase_order_value_hkd: 450_000,
    invoice_value_hkd: 440_000,
    supplier_name: "Taichung Commercial Kitchen Equipment Co Ltd",
    supplier_country: "TW",
    product_type: "restaurant_equipment",
    goods_description: "Commercial induction cookers and stainless-steel kitchen fixtures",
    quantity: 240,
    expected_delivery_days: 10,
    expected_repayment_source: "buyer_receivable",
    collateral: { type: "insured_goods", value_hkd: 440_000 },
    sales_context: {
      expected_sales_channel: "distributor",
    },
    demo_scenario: "hard_stop",
  },
};

export function mockExtractLoanApplicationFieldsFromDocuments(
  context: MockDocumentExtractionContext = {},
): LoanApplicationInput {
  // Demo-only behavior: uploaded files are accepted by the UI but are not parsed.
  // The scenario and current form values deterministically choose/fill the fields.
  void context.files;

  const scenario =
    context.demo_scenario ?? context.existing_fields?.demo_scenario ?? "strong";
  const defaults = DEFAULTS_BY_SCENARIO[scenario];
  const existing = context.existing_fields ?? {};

  return {
    ...defaults,
    ...definedTopLevel(existing),
    borrower_id: context.borrower_id || existing.borrower_id || defaults.borrower_id,
    collateral: {
      ...defaults.collateral,
      ...definedNested(existing.collateral),
      type: existing.collateral?.type ?? defaults.collateral.type,
    },
    sales_context: {
      ...defaults.sales_context,
      ...definedNested(existing.sales_context),
      expected_sales_channel:
        existing.sales_context?.expected_sales_channel ??
        defaults.sales_context?.expected_sales_channel ??
        "other",
    },
    demo_scenario: scenario,
  };
}

function definedTopLevel(
  input: Partial<LoanApplicationInput>,
): Partial<LoanApplicationInput> {
  return Object.fromEntries(
    Object.entries(input).filter(
      ([key, value]) =>
        key !== "collateral" &&
        key !== "sales_context" &&
        value !== undefined &&
        value !== "",
    ),
  ) as Partial<LoanApplicationInput>;
}

function definedNested<T extends object>(input: T | undefined): Partial<T> {
  if (!input) {
    return {};
  }

  return Object.fromEntries(
    Object.entries(input).filter(([, value]) => value !== undefined && value !== ""),
  ) as Partial<T>;
}
