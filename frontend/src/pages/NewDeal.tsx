import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Building2, FileUp, Loader2, Package, Ship, Trash2, Upload } from "lucide-react";
import { useMyCompany, useUpsertCompany } from "@/hooks/useCompany";
import { useCreateLoan, useIndustries } from "@/hooks/useLoans";
import { uploadFileDirect } from "@/lib/api";
import { Button } from "@/components/ui/Button";
import { formatBytes, formatCurrency, formatPercent } from "@/lib/utils";

const TRADE_TYPES = ["import", "export", "wholesale", "distribution"];

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

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (name.trim().length < 2) return setError("Please enter your company name.");
    if (title.trim().length < 4) return setError("Please give the deal a descriptive title.");

    setSubmitting(true);
    try {
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
        description: description || undefined,
        purpose: purpose || undefined,
        trade_type: tradeType,
        industry: industry || companyIndustry || undefined,
        goods: goods || undefined,
        origin_country: origin || undefined,
        destination_country: destination || undefined,
        amount,
        currency: "HKD",
        term_days: term,
        interest_rate: rate,
      });

      for (const file of files) {
        await uploadFileDirect(file, { loan_id: loan.id, category: "risk_document" });
      }

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
            Describe a specific trade deal you need financed. We'll compute a TradeFlow Score and
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

          {/* Documents */}
          <FormCard icon={FileUp} title="Risk-assessment documents" subtitle="Trade docs, invoices, images — optional.">
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
              <Row label="Documents" value={`${files.length} attached`} />
            </div>

            <div className="mt-5 rounded-lg border border-gold/40 bg-gold-tint px-3 py-2.5 text-xs text-ink-soft">
              Your TradeFlow Score is computed on submission. The deal starts as
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
