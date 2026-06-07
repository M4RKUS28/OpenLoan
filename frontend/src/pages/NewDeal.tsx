import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Building2, FileUp, Loader2, Package, ScanText, Ship, Trash2, Upload } from "lucide-react";
import { useMyCompany, useUpsertCompany } from "@/hooks/useCompany";
import { useCreateLoan, useIndustries } from "@/hooks/useLoans";
import { mockExtractLoanApplicationFieldsFromDocuments } from "@/loan-scoring-demo/mockDocumentExtraction";
import {
  type CollateralType,
  type DemoScenario,
  type ExpectedRepaymentSource,
  type ExpectedSalesChannel,
  type LoanApplicationInput,
} from "@/loan-scoring-demo/types";
import { Button } from "@/components/ui/Button";
import { formatBytes, formatCurrency, formatPercent } from "@/lib/utils";

const TRADE_TYPES = ["import", "export", "wholesale", "distribution"];
const BORROWER_IDS = ["brw_001", "brw_002", "brw_003", "brw_004", "brw_005"];
const DEMO_SCENARIOS: DemoScenario[] = ["strong", "medium", "weak", "hard_stop"];
const REPAYMENT_SOURCES: ExpectedRepaymentSource[] = [
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
const SALES_CHANNELS: ExpectedSalesChannel[] = [
  "marketplace",
  "own_website",
  "physical_store",
  "distributor",
  "mixed",
  "other",
];

export function NewDealPage() {
  const navigate = useNavigate();
  const { data: company } = useMyCompany();
  const upsertCompany = useUpsertCompany();
  const createLoan = useCreateLoan();
  const { data: industries } = useIndustries();

  // Company fields
  const [name, setName] = useState("");
  const [companyIndustry, setCompanyIndustry] = useState("");
  const [city, setCity] = useState("");
  const [website, setWebsite] = useState("");
  const [foundedYear, setFoundedYear] = useState<string>("");
  const [employees, setEmployees] = useState<string>("");
  const [revenue, setRevenue] = useState<string>("");
  const [companyDesc, setCompanyDesc] = useState("");

  // Deal fields
  const [title, setTitle] = useState("");
  const [goods, setGoods] = useState("");
  const [tradeType, setTradeType] = useState("import");
  const [industry, setIndustry] = useState("");
  const [origin, setOrigin] = useState("");
  const [destination, setDestination] = useState("Hong Kong SAR");
  const [purpose, setPurpose] = useState("");
  const [description, setDescription] = useState("");
  const [amount, setAmount] = useState(500000);
  const [term, setTerm] = useState(90);
  const [rate, setRate] = useState(8.0);

  // Demo scoring fields used to build LoanApplicationInput.
  const [borrowerId, setBorrowerId] = useState("brw_001");
  const [demoScenario, setDemoScenario] = useState<DemoScenario>("strong");
  const [purchaseOrderValue, setPurchaseOrderValue] = useState("600000");
  const [invoiceValue, setInvoiceValue] = useState("600000");
  const [supplierName, setSupplierName] = useState("Shenzhen Pearl Electronics Co Ltd");
  const [supplierCountry, setSupplierCountry] = useState("CN");
  const [productType, setProductType] = useState("consumer_electronics_accessories");
  const [goodsDescription, setGoodsDescription] = useState(
    "Wireless chargers, phone cases, and USB-C accessories",
  );
  const [quantity, setQuantity] = useState("12000");
  const [expectedDeliveryDays, setExpectedDeliveryDays] = useState("5");
  const [expectedRepaymentSource, setExpectedRepaymentSource] =
    useState<ExpectedRepaymentSource>("marketplace_sales");
  const [collateralType, setCollateralType] = useState<CollateralType>("insured_goods");
  const [collateralValue, setCollateralValue] = useState("600000");
  const [salesChannel, setSalesChannel] = useState<ExpectedSalesChannel>("marketplace");
  const [primaryMarketplace, setPrimaryMarketplace] = useState("HKTVmall");
  const [extractionNote, setExtractionNote] = useState<string | null>(null);

  const [files, setFiles] = useState<File[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  // Prefill once the company profile loads.
  useEffect(() => {
    if (!company) return;
    setName(company.name);
    setCompanyIndustry(company.industry ?? "");
    setIndustry((prev) => prev || company.industry || "");
    setCity(company.city ?? "");
    setWebsite(company.website ?? "");
    setFoundedYear(company.founded_year?.toString() ?? "");
    setEmployees(company.employees?.toString() ?? "");
    setRevenue(company.annual_revenue?.toString() ?? "");
    setCompanyDesc(company.description ?? "");
  }, [company]);

  function addFiles(list: FileList | null) {
    if (!list) return;
    setFiles((prev) => [...prev, ...Array.from(list)]);
  }

  function currentLoanApplicationFields(): Partial<LoanApplicationInput> {
    return {
      borrower_id: borrowerId,
      loan_amount_hkd: amount,
      loan_duration_days: term,
      purchase_order_value_hkd: numberOrUndefined(purchaseOrderValue),
      invoice_value_hkd: numberOrUndefined(invoiceValue),
      supplier_name: supplierName,
      supplier_country: supplierCountry,
      product_type: productType,
      goods_description: goodsDescription,
      quantity: numberOrUndefined(quantity),
      expected_delivery_days: numberOrUndefined(expectedDeliveryDays),
      expected_repayment_source: expectedRepaymentSource,
      collateral: {
        type: collateralType,
        value_hkd: numberOrUndefined(collateralValue),
      },
      sales_context: {
        expected_sales_channel: salesChannel,
        primary_marketplace: primaryMarketplace || undefined,
      },
      demo_scenario: demoScenario,
    };
  }

  function buildLoanApplicationInput(): LoanApplicationInput {
    return mockExtractLoanApplicationFieldsFromDocuments({
      borrower_id: borrowerId,
      demo_scenario: demoScenario,
      existing_fields: currentLoanApplicationFields(),
      files,
    });
  }

  function applyExtractedFields(application: LoanApplicationInput) {
    setBorrowerId(application.borrower_id);
    setDemoScenario(application.demo_scenario ?? demoScenario);
    setAmount(application.loan_amount_hkd);
    setTerm(application.loan_duration_days);
    setPurchaseOrderValue(String(application.purchase_order_value_hkd));
    setInvoiceValue(String(application.invoice_value_hkd));
    setSupplierName(application.supplier_name);
    setSupplierCountry(application.supplier_country);
    setProductType(application.product_type);
    setGoodsDescription(application.goods_description ?? "");
    setQuantity(application.quantity?.toString() ?? "");
    setExpectedDeliveryDays(String(application.expected_delivery_days));
    setExpectedRepaymentSource(application.expected_repayment_source);
    setCollateralType(application.collateral.type);
    setCollateralValue(application.collateral.value_hkd?.toString() ?? "");
    setSalesChannel(application.sales_context?.expected_sales_channel ?? "other");
    setPrimaryMarketplace(application.sales_context?.primary_marketplace ?? "");

    setGoods(application.goods_description ?? application.product_type.replaceAll("_", " "));
    setOrigin(countryLabel(application.supplier_country));
    setDestination("Hong Kong SAR");
    setPurpose(purposeForApplication(application));
    setIndustry(industryForProduct(application.product_type));
    setTitle((current) => current || titleForScenario(application.demo_scenario ?? "medium"));
    setDescription((current) => current || descriptionForApplication(application));
  }

  function extractFromDocuments() {
    const application = mockExtractLoanApplicationFieldsFromDocuments({
      demo_scenario: demoScenario,
      files,
    });
    applyExtractedFields(application);
    setExtractionNote("Demo extraction filled scoring fields from local scenario defaults.");
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (name.trim().length < 2) return setError("Please enter your company name.");
    if (title.trim().length < 4) return setError("Please give the deal a descriptive title.");

    setSubmitting(true);
    try {
      const application = buildLoanApplicationInput();
      applyExtractedFields(application);
      const dealIndustry = industry || industryForProduct(application.product_type);
      const dealPurpose = purpose || purposeForApplication(application);
      const dealDescription = description || descriptionForApplication(application);

      await upsertCompany.mutateAsync({
        name: name.trim(),
        industry: companyIndustry || "Trade",
        city: city || undefined,
        website: website || undefined,
        founded_year: foundedYear ? Number(foundedYear) : undefined,
        employees: employees ? Number(employees) : undefined,
        annual_revenue: revenue ? Number(revenue) : undefined,
        description: companyDesc || undefined,
      });

      const loan = await createLoan.mutateAsync({
        title: title.trim(),
        description: dealDescription || undefined,
        purpose: dealPurpose || undefined,
        trade_type: tradeType,
        industry: dealIndustry || companyIndustry || undefined,
        goods: goods || application.goods_description || application.product_type,
        origin_country: origin || countryLabel(application.supplier_country),
        destination_country: destination || "Hong Kong SAR",
        amount: application.loan_amount_hkd,
        currency: "HKD",
        term_days: application.loan_duration_days,
        interest_rate: rate,
        borrower_id: application.borrower_id,
        loan_amount_hkd: application.loan_amount_hkd,
        loan_duration_days: application.loan_duration_days,
        purchase_order_value_hkd: application.purchase_order_value_hkd,
        invoice_value_hkd: application.invoice_value_hkd,
        supplier_name: application.supplier_name,
        supplier_country: application.supplier_country,
        product_type: application.product_type,
        goods_description: application.goods_description,
        quantity: application.quantity,
        expected_delivery_days: application.expected_delivery_days,
        expected_repayment_source: application.expected_repayment_source,
        collateral: application.collateral,
        sales_context: application.sales_context,
        demo_scenario: application.demo_scenario,
      });

      navigate(`/deals/${loan.id}`);
    } catch (err) {
      console.error(err);
      setError("Something went wrong submitting your deal. Please try again.");
      setSubmitting(false);
    }
  }

  return (
    <>
      <section className="border-b border-line bg-paper-grad">
        <div className="mx-auto max-w-5xl px-4 py-12 sm:px-6">
          <span className="eyebrow text-brand">New financing request</span>
          <h1 className="mt-2 font-display text-4xl font-semibold tracking-tightish">Post a trade deal</h1>
          <p className="mt-3 max-w-xl text-ink-soft">
            Describe a specific trade deal you need financed. We'll compute a OpenLoan Score and
            open it to investors once you publish.
          </p>
        </div>
      </section>

      <form onSubmit={submit} className="mx-auto grid max-w-5xl gap-8 px-4 py-10 sm:px-6 lg:grid-cols-[1.6fr_1fr]">
        <div className="space-y-6">
          {/* Company */}
          <FormCard icon={Building2} title="Your business" subtitle="Used across your deals.">
            <div className="grid gap-4 sm:grid-cols-2">
              <Input label="Company name" value={name} onChange={setName} required placeholder="Pearl River Electronics Ltd" />
              <Input
                label="Industry"
                value={companyIndustry}
                onChange={setCompanyIndustry}
                placeholder="Electronics"
                list="industry-options"
              />
              <Input label="City" value={city} onChange={setCity} placeholder="Hong Kong" />
              <Input label="Website" value={website} onChange={setWebsite} placeholder="https://…" />
              <Input label="Founded year" value={foundedYear} onChange={setFoundedYear} type="number" placeholder="2015" />
              <Input label="Employees" value={employees} onChange={setEmployees} type="number" placeholder="50" />
              <Input
                label="Annual revenue (HKD)"
                value={revenue}
                onChange={setRevenue}
                type="number"
                placeholder="80000000"
                className="sm:col-span-2"
              />
            </div>
            <Textarea
              label="Short description"
              value={companyDesc}
              onChange={setCompanyDesc}
              placeholder="What your business does, who you trade with…"
            />
          </FormCard>

          {/* Deal */}
          <FormCard icon={Ship} title="The trade deal">
            <Input
              label="Deal title"
              value={title}
              onChange={setTitle}
              required
              placeholder="Import of consumer electronics from Shenzhen"
            />
            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              <Input label="Goods" value={goods} onChange={setGoods} placeholder="Smartphones & accessories" />
              <Select label="Trade type" value={tradeType} onChange={setTradeType}>
                {TRADE_TYPES.map((t) => (
                  <option key={t} value={t}>
                    {t[0].toUpperCase() + t.slice(1)}
                  </option>
                ))}
              </Select>
              <Input label="Industry" value={industry} onChange={setIndustry} placeholder="Electronics" list="industry-options" />
              <Input label="Origin country" value={origin} onChange={setOrigin} placeholder="Mainland China" />
              <Input label="Destination country" value={destination} onChange={setDestination} placeholder="Hong Kong SAR" />
              <Input label="Purpose" value={purpose} onChange={setPurpose} placeholder="Pre-finance a bulk order" />
            </div>
            <Textarea
              label="Description"
              value={description}
              onChange={setDescription}
              placeholder="Background, counterparties, timeline and how repayment will occur…"
            />
          </FormCard>

          {/* Terms */}
          <FormCard icon={Package} title="Financing terms">
            <Slider
              label="Requested amount"
              value={formatCurrency(amount, "HKD")}
              min={10000}
              max={5000000}
              step={10000}
              current={amount}
              onChange={setAmount}
            />
            <div className="mt-6 grid gap-6 sm:grid-cols-2">
              <Slider
                label="Term"
                value={`${term} days`}
                min={7}
                max={365}
                step={1}
                current={term}
                onChange={setTerm}
              />
              <Slider
                label="Target annual rate"
                value={formatPercent(rate)}
                min={1}
                max={25}
                step={0.1}
                current={rate}
                onChange={(v) => setRate(Number(v.toFixed(1)))}
              />
            </div>
          </FormCard>

          {/* Demo scoring */}
          <FormCard icon={ScanText} title="Demo scoring inputs">
            <div className="grid gap-4 sm:grid-cols-2">
              <Select label="Borrower ID" value={borrowerId} onChange={setBorrowerId}>
                {BORROWER_IDS.map((id) => (
                  <option key={id} value={id}>
                    {id}
                  </option>
                ))}
              </Select>
              <Select
                label="Demo scenario"
                value={demoScenario}
                onChange={(value) => setDemoScenario(value as DemoScenario)}
              >
                {DEMO_SCENARIOS.map((scenario) => (
                  <option key={scenario} value={scenario}>
                    {scenario.replace("_", " ")}
                  </option>
                ))}
              </Select>
              <Input
                label="Purchase order value (HKD)"
                value={purchaseOrderValue}
                onChange={setPurchaseOrderValue}
                type="number"
              />
              <Input
                label="Invoice value (HKD)"
                value={invoiceValue}
                onChange={setInvoiceValue}
                type="number"
              />
              <Input label="Supplier name" value={supplierName} onChange={setSupplierName} />
              <Input label="Supplier country" value={supplierCountry} onChange={setSupplierCountry} />
              <Input label="Product type" value={productType} onChange={setProductType} />
              <Input
                label="Goods description"
                value={goodsDescription}
                onChange={setGoodsDescription}
              />
              <Input label="Quantity" value={quantity} onChange={setQuantity} type="number" />
              <Input
                label="Expected delivery days"
                value={expectedDeliveryDays}
                onChange={setExpectedDeliveryDays}
                type="number"
              />
              <Select
                label="Repayment source"
                value={expectedRepaymentSource}
                onChange={(value) => setExpectedRepaymentSource(value as ExpectedRepaymentSource)}
              >
                {REPAYMENT_SOURCES.map((source) => (
                  <option key={source} value={source}>
                    {source.replaceAll("_", " ")}
                  </option>
                ))}
              </Select>
              <Select
                label="Collateral type"
                value={collateralType}
                onChange={(value) => setCollateralType(value as CollateralType)}
              >
                {COLLATERAL_TYPES.map((type) => (
                  <option key={type} value={type}>
                    {type.replaceAll("_", " ")}
                  </option>
                ))}
              </Select>
              <Input
                label="Collateral value (HKD)"
                value={collateralValue}
                onChange={setCollateralValue}
                type="number"
              />
              <Select
                label="Sales channel"
                value={salesChannel}
                onChange={(value) => setSalesChannel(value as ExpectedSalesChannel)}
              >
                {SALES_CHANNELS.map((channel) => (
                  <option key={channel} value={channel}>
                    {channel.replaceAll("_", " ")}
                  </option>
                ))}
              </Select>
              <Input
                label="Primary marketplace"
                value={primaryMarketplace}
                onChange={setPrimaryMarketplace}
                placeholder="HKTVmall"
              />
            </div>
          </FormCard>

          {/* Documents */}
          <FormCard icon={FileUp} title="Risk-assessment documents" subtitle="Trade docs, invoices, images — optional.">
            <div className="mb-4 flex justify-end">
              <Button type="button" variant="outline" size="sm" onClick={extractFromDocuments}>
                <ScanText className="h-4 w-4" /> Extract from documents
              </Button>
            </div>
            <div
              onClick={() => fileRef.current?.click()}
              onDragOver={(e) => e.preventDefault()}
              onDrop={(e) => {
                e.preventDefault();
                addFiles(e.dataTransfer.files);
              }}
              className="flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed border-line-strong bg-paper-dim py-10 text-center transition-colors hover:border-brand"
            >
              <Upload className="h-7 w-7 text-ink-muted" />
              <p className="mt-2 text-sm font-medium text-ink">Click to upload or drag & drop</p>
              <p className="text-xs text-ink-muted">PDF, images and spreadsheets</p>
              <input
                ref={fileRef}
                type="file"
                multiple
                className="hidden"
                onChange={(e) => {
                  addFiles(e.target.files);
                  e.target.value = "";
                }}
              />
            </div>
            {files.length > 0 && (
              <ul className="mt-4 space-y-2">
                {files.map((f, i) => (
                  <li
                    key={`${f.name}-${i}`}
                    className="flex items-center justify-between rounded-lg border border-line bg-card px-3 py-2"
                  >
                    <span className="min-w-0 truncate text-sm text-ink">{f.name}</span>
                    <div className="flex shrink-0 items-center gap-3">
                      <span className="text-xs text-ink-muted nums">{formatBytes(f.size)}</span>
                      <button
                        type="button"
                        onClick={() => setFiles((prev) => prev.filter((_, idx) => idx !== i))}
                        className="text-ink-muted transition-colors hover:text-brand"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </li>
                ))}
              </ul>
            )}
            {extractionNote && <p className="mt-3 text-xs text-ink-muted">{extractionNote}</p>}
          </FormCard>
        </div>

        {/* Summary sidebar */}
        <div className="lg:sticky lg:top-24 lg:self-start">
          <div className="rounded-2xl border border-line bg-card p-6 shadow-card">
            <p className="eyebrow text-ink-muted">Preview</p>
            <h3 className="mt-2 font-display text-lg font-semibold leading-snug text-ink">
              {title || "Your deal title"}
            </h3>
            <p className="text-sm text-ink-muted">{name || "Your company"}</p>

            <div className="mt-5 space-y-3 border-t border-line pt-5">
              <Row label="Amount" value={formatCurrency(amount, "HKD")} />
              <Row label="Target rate" value={formatPercent(rate)} accent />
              <Row label="Term" value={`${term} days`} />
              <Row label="Documents" value={`${files.length} selected`} />
            </div>

            <div className="mt-5 rounded-lg border border-gold/40 bg-gold-tint px-3 py-2.5 text-xs text-ink-soft">
              Your OpenLoan Score is computed on submission. The deal starts as
              <span className="font-semibold text-ink"> pending approval</span> until you publish it.
            </div>

            {error && (
              <p className="mt-4 rounded-lg bg-brand-tint px-3 py-2 text-sm text-brand-700">{error}</p>
            )}

            <Button type="submit" className="mt-5 w-full" size="lg" disabled={submitting}>
              {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : "Submit deal"}
            </Button>
            <p className="mt-3 text-center text-xs text-ink-muted">
              You can review and publish it on the next screen.
            </p>
          </div>
        </div>
      </form>

      <datalist id="industry-options">
        {(industries ?? []).map((i) => (
          <option key={i} value={i} />
        ))}
      </datalist>
    </>
  );
}

function numberOrUndefined(value: string): number | undefined {
  if (value.trim() === "") {
    return undefined;
  }

  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : undefined;
}

function countryLabel(countryCode: string): string {
  const labels: Record<string, string> = {
    CN: "Mainland China",
    HK: "Hong Kong SAR",
    VN: "Vietnam",
    MY: "Malaysia",
    TW: "Taiwan",
    KR: "South Korea",
    JP: "Japan",
  };

  return labels[countryCode.toUpperCase()] ?? countryCode;
}

function industryForProduct(productType: string): string {
  if (productType.includes("apparel") || productType.includes("fashion")) {
    return "Textiles & Apparel";
  }

  if (productType.includes("restaurant") || productType.includes("food")) {
    return "Food & Beverage";
  }

  if (productType.includes("household") || productType.includes("industrial")) {
    return "Wholesale";
  }

  return "Electronics";
}

function purposeForApplication(application: LoanApplicationInput): string {
  if (application.expected_repayment_source === "marketplace_sales") {
    return "Pre-finance inventory for marketplace resale.";
  }

  if (application.expected_repayment_source === "buyer_receivable") {
    return "Bridge working capital until buyer receivable settlement.";
  }

  return "Finance short-term inventory purchase and resale.";
}

function titleForScenario(scenario: DemoScenario): string {
  if (scenario === "strong") {
    return "Import of electronics accessories for marketplace resale";
  }

  if (scenario === "weak") {
    return "Inventory purchase for new online sales channel";
  }

  if (scenario === "hard_stop") {
    return "Catering equipment shipment for distributor order";
  }

  return "Apparel inventory purchase for Hong Kong retail channels";
}

function descriptionForApplication(application: LoanApplicationInput): string {
  return [
    application.supplier_name,
    "will supply",
    application.goods_description ?? application.product_type.replaceAll("_", " "),
    `for delivery to Hong Kong in ${application.expected_delivery_days} days.`,
  ].join(" ");
}

/* ── form primitives ───────────────────────────────────────────────────── */

function FormCard({
  icon: Icon,
  title,
  subtitle,
  children,
}: {
  icon: typeof Building2;
  title: string;
  subtitle?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-2xl border border-line bg-card p-6 shadow-card">
      <div className="mb-5 flex items-center gap-3">
        <span className="grid h-10 w-10 place-items-center rounded-xl bg-brand-tint text-brand">
          <Icon className="h-5 w-5" />
        </span>
        <div>
          <h2 className="font-display text-lg font-semibold text-ink">{title}</h2>
          {subtitle && <p className="text-xs text-ink-muted">{subtitle}</p>}
        </div>
      </div>
      {children}
    </div>
  );
}

function Input({
  label,
  value,
  onChange,
  type = "text",
  placeholder,
  required,
  list,
  className,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  type?: string;
  placeholder?: string;
  required?: boolean;
  list?: string;
  className?: string;
}) {
  return (
    <label className={`block ${className ?? ""}`}>
      <span className="mb-1.5 block text-sm font-medium text-ink-soft">
        {label} {required && <span className="text-brand">*</span>}
      </span>
      <input
        type={type}
        value={value}
        list={list}
        required={required}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
        className="h-11 w-full rounded-xl border border-line bg-paper-dim px-4 text-sm text-ink placeholder:text-ink-muted focus:border-brand focus:outline-none"
      />
    </label>
  );
}

function Textarea({
  label,
  value,
  onChange,
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
}) {
  return (
    <label className="mt-4 block">
      <span className="mb-1.5 block text-sm font-medium text-ink-soft">{label}</span>
      <textarea
        value={value}
        rows={3}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-xl border border-line bg-paper-dim px-4 py-3 text-sm text-ink placeholder:text-ink-muted focus:border-brand focus:outline-none"
      />
    </label>
  );
}

function Select({
  label,
  value,
  onChange,
  children,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-sm font-medium text-ink-soft">{label}</span>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="h-11 w-full cursor-pointer rounded-xl border border-line bg-paper-dim px-4 text-sm text-ink focus:border-brand focus:outline-none"
      >
        {children}
      </select>
    </label>
  );
}

function Slider({
  label,
  value,
  min,
  max,
  step,
  current,
  onChange,
}: {
  label: string;
  value: string;
  min: number;
  max: number;
  step: number;
  current: number;
  onChange: (v: number) => void;
}) {
  return (
    <div>
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium text-ink-soft">{label}</span>
        <span className="font-mono text-sm font-semibold text-ink nums">{value}</span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={current}
        onChange={(e) => onChange(Number(e.target.value))}
        className="mt-3 w-full accent-brand"
      />
    </div>
  );
}

function Row({ label, value, accent }: { label: string; value: string; accent?: boolean }) {
  return (
    <div className="flex items-center justify-between text-sm">
      <span className="text-ink-muted">{label}</span>
      <span className={`font-mono font-semibold nums ${accent ? "text-brand" : "text-ink"}`}>{value}</span>
    </div>
  );
}
