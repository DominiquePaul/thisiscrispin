"use client";

import { useState, useMemo, useCallback, useRef, useEffect } from "react";

// --- Types ---
interface Round {
  id: number;
  name: string;
  type: "safe" | "priced";
  amount: number;
  valCap: number;
  discount: number;
  preMoneyVal: number;
  esopPct: number;
}

interface Shareholder {
  name: string;
  shares: number;
  invested: number;
  type: "founder" | "investor" | "esop";
  ownership: number;
  impliedValue?: number;
  multiple?: number | null;
}

interface ConvertedSafe {
  name: string;
  shares: number;
  invested: number;
  effectivePrice: number;
  type: "investor";
  capTriggered: boolean;
  discountTriggered: boolean;
  capOwnership: number;
}

interface Snapshot {
  roundName: string;
  roundType: "safe" | "priced";
  amountRaised: number;
  totalRaised: number;
  preMoney: number | null;
  postMoney: number | null;
  pricePerShare: number | null;
  shareholders: Shareholder[];
  pendingSafes?: Round[];
  convertedSafes?: ConvertedSafe[];
  totalShares: number;
  esopPct?: number;
  esopShares?: number;
}

// --- Defaults ---
const DEFAULT_ROUNDS: Round[] = [
  { id: 1, name: "SAFE", type: "safe", amount: 500000, valCap: 15000000, discount: 0, preMoneyVal: 0, esopPct: 0 },
  { id: 2, name: "Seed", type: "priced", amount: 8000000, valCap: 0, discount: 0, preMoneyVal: 35000000, esopPct: 15 },
  { id: 3, name: "Series A", type: "priced", amount: 40000000, valCap: 0, discount: 0, preMoneyVal: 140000000, esopPct: 10 },
];

const INTERNAL_FOUNDER_SHARES = 10000000;
const DEFAULT_INITIAL_ESOP = 10;

// --- URL State Encoding ---
interface ShareableState {
  rounds: Round[];
  esop: number;
}

function encodeState(rounds: Round[], initialEsopPct: number): string {
  const state: ShareableState = { rounds, esop: initialEsopPct };
  const json = JSON.stringify(state);
  return btoa(unescape(encodeURIComponent(json)));
}

function decodeState(encoded: string): ShareableState | null {
  try {
    const json = decodeURIComponent(escape(atob(encoded)));
    const parsed = JSON.parse(json);
    if (parsed && Array.isArray(parsed.rounds) && typeof parsed.esop === "number") {
      return parsed as ShareableState;
    }
  } catch {
    // Invalid state, ignore
  }
  return null;
}

// --- Formatting ---
function formatNum(n: number): string {
  return Math.round(n).toLocaleString("de-DE");
}

function formatCurrency(n: number): string {
  if (n >= 1e9) return `€${(n / 1e9).toFixed(2)}B`;
  if (n >= 1e6) return `€${(n / 1e6).toFixed(2)}M`;
  return `€${formatNum(n)}`;
}

function formatPct(n: number): string {
  return `${(n * 100).toFixed(2)}%`;
}

function parseFormatted(str: string): number {
  if (!str) return 0;
  const cleaned = str.replace(/\./g, "").replace(/,/g, ".");
  const n = Number(cleaned);
  return isNaN(n) ? 0 : n;
}

// --- Computation ---
function computeCapTable(rounds: Round[], founderShares: number, initialEsopPct: number): Snapshot[] {
  const snapshots: Snapshot[] = [];
  let totalShares = founderShares;
  let shareholders: { name: string; shares: number; invested: number; type: "founder" | "investor" | "esop" }[] = [
    { name: "Founders", shares: founderShares, invested: 0, type: "founder" },
  ];
  let totalRaised = 0;
  let pendingSafes: Round[] = [];
  let cumulativeEsopShares = 0;
  let initialEsopApplied = false;

  function applyInitialEsop() {
    if (initialEsopApplied || initialEsopPct <= 0) return;
    initialEsopApplied = true;
    const esopShares = Math.floor((totalShares * initialEsopPct) / (100 - initialEsopPct));
    cumulativeEsopShares += esopShares;
    totalShares += esopShares;
    shareholders.push({ name: "ESOP Pool", shares: cumulativeEsopShares, invested: 0, type: "esop" });
  }

  for (let i = 0; i < rounds.length; i++) {
    const round = rounds[i];
    totalRaised += round.amount;

    if (round.type === "safe") {
      pendingSafes.push({ ...round });
      const snap: Snapshot = {
        roundName: round.name,
        roundType: "safe",
        amountRaised: round.amount,
        totalRaised,
        preMoney: null,
        postMoney: null,
        pricePerShare: null,
        shareholders: shareholders.map((s) => ({ ...s, ownership: s.shares / totalShares })),
        pendingSafes: pendingSafes.map((s) => ({ ...s })),
        totalShares,
      };
      snapshots.push(snap);
    } else {
      applyInitialEsop();
      const preMoney = round.preMoneyVal;
      const ppsAtPreMoney = preMoney / totalShares;

      let newSharesFromSafes = 0;
      const convertedSafes: ConvertedSafe[] = [];
      for (const safe of pendingSafes) {
        const capShares =
          safe.valCap > 0 ? Math.floor((totalShares * safe.amount) / (safe.valCap - safe.amount)) : 0;
        const discountPrice = safe.discount > 0 ? ppsAtPreMoney * (1 - safe.discount / 100) : Infinity;
        const discountShares = safe.discount > 0 ? Math.floor(safe.amount / discountPrice) : 0;
        const capOwnership = safe.valCap > 0 ? safe.amount / safe.valCap : 0;

        let safeShares: number;
        let capTriggered = false;
        let discountTriggered = false;

        if (safe.valCap > 0 && safe.discount > 0) {
          if (capShares >= discountShares) {
            safeShares = capShares;
            capTriggered = true;
          } else {
            safeShares = discountShares;
            discountTriggered = true;
          }
        } else if (safe.valCap > 0) {
          safeShares = capShares;
          capTriggered = true;
        } else if (safe.discount > 0) {
          safeShares = discountShares;
          discountTriggered = true;
        } else {
          safeShares = Math.floor(safe.amount / ppsAtPreMoney);
        }

        const effectivePrice = safeShares > 0 ? safe.amount / safeShares : ppsAtPreMoney;
        newSharesFromSafes += safeShares;
        convertedSafes.push({
          name: `${safe.name} Investor`,
          shares: safeShares,
          invested: safe.amount,
          effectivePrice,
          type: "investor",
          capTriggered,
          discountTriggered,
          capOwnership,
        });
      }

      const totalSharesAfterSafe = totalShares + newSharesFromSafes;
      const ppsThisRound = preMoney / totalSharesAfterSafe;
      const roundShares = Math.floor(round.amount / ppsThisRound);

      let esopShares = 0;
      if (round.esopPct > 0) {
        const totalBeforeEsop = totalSharesAfterSafe + roundShares;
        esopShares = Math.floor((totalBeforeEsop * round.esopPct) / (100 - round.esopPct));
      }
      cumulativeEsopShares += esopShares;
      totalShares = totalSharesAfterSafe + roundShares + esopShares;

      const nonEsopShareholders = shareholders.filter((s) => s.type !== "esop");
      const newShareholders: typeof shareholders = [
        ...nonEsopShareholders,
        ...convertedSafes,
        { name: `${round.name} Investor`, shares: roundShares, invested: round.amount, type: "investor" },
      ];
      if (cumulativeEsopShares > 0) {
        newShareholders.push({ name: "ESOP Pool", shares: cumulativeEsopShares, invested: 0, type: "esop" });
      }
      shareholders = newShareholders;
      pendingSafes = [];

      const postMoney = preMoney + round.amount;
      const snap: Snapshot = {
        roundName: round.name,
        roundType: "priced",
        amountRaised: round.amount,
        totalRaised,
        preMoney,
        postMoney,
        pricePerShare: ppsThisRound,
        esopPct: round.esopPct,
        esopShares,
        shareholders: shareholders.map((s) => ({
          ...s,
          ownership: s.shares / totalShares,
          impliedValue: (s.shares / totalShares) * postMoney,
          multiple: s.invested > 0 ? ((s.shares / totalShares) * postMoney) / s.invested : null,
        })),
        convertedSafes,
        totalShares,
      };
      snapshots.push(snap);
    }
  }
  return snapshots;
}

// --- UI Components ---
interface FormattedInputProps {
  label: string;
  value: number;
  onChange: (v: number) => void;
  prefix?: string;
  suffix?: string;
  step?: number;
  min?: number;
}

function FormattedInput({ label, value, onChange, prefix = "", suffix = "", step = 1, min = 0 }: FormattedInputProps) {
  const [displayVal, setDisplayVal] = useState(formatNum(value));
  const [isFocused, setIsFocused] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!isFocused) setDisplayVal(formatNum(value));
  }, [value, isFocused]);

  const handleFocus = () => {
    setIsFocused(true);
    setDisplayVal(String(value));
  };

  const handleBlur = () => {
    setIsFocused(false);
    const parsed = parseFormatted(displayVal);
    const clamped = Math.max(min, parsed);
    onChange(clamped);
    setDisplayVal(formatNum(clamped));
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => setDisplayVal(e.target.value);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowUp" || e.key === "ArrowDown") {
      e.preventDefault();
      const current = isFocused ? Number(displayVal) || 0 : value;
      const delta = e.key === "ArrowUp" ? step : -step;
      const next = Math.max(min, current + delta);
      onChange(next);
      if (isFocused) setDisplayVal(String(next));
    }
    if (e.key === "Enter") inputRef.current?.blur();
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
      <label
        style={{
          fontSize: 11,
          fontWeight: 600,
          color: "var(--text-dim)",
          letterSpacing: "0.05em",
          textTransform: "uppercase",
          fontFamily: "var(--mono)",
        }}
      >
        {label}
      </label>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          background: "var(--input-bg)",
          borderRadius: 6,
          border: `1px solid ${isFocused ? "var(--accent-priced)" : "var(--border)"}`,
          padding: "6px 10px",
          transition: "border-color 0.2s",
        }}
      >
        {prefix && (
          <span style={{ color: "var(--text-dim)", fontSize: 14, fontFamily: "var(--mono)", marginRight: 4 }}>
            {prefix}
          </span>
        )}
        <input
          ref={inputRef}
          type="text"
          inputMode="numeric"
          value={displayVal}
          onChange={handleChange}
          onFocus={handleFocus}
          onBlur={handleBlur}
          onKeyDown={handleKeyDown}
          style={{
            background: "transparent",
            border: "none",
            outline: "none",
            color: "var(--text)",
            fontSize: 15,
            fontFamily: "var(--mono)",
            width: "100%",
            fontWeight: 500,
          }}
        />
        {suffix && (
          <span style={{ color: "var(--text-dim)", fontSize: 12, fontFamily: "var(--mono)", marginLeft: 4 }}>
            {suffix}
          </span>
        )}
      </div>
    </div>
  );
}

interface RoundCardProps {
  round: Round;
  onUpdate: (updated: Round) => void;
  onRemove: () => void;
  isOnly: boolean;
}

function RoundCard({ round, onUpdate, onRemove, isOnly }: RoundCardProps) {
  const isSafe = round.type === "safe";
  const accentColor = isSafe ? "var(--accent-safe)" : "var(--accent-priced)";

  return (
    <div
      style={{
        background: "var(--card-bg)",
        border: "1px solid var(--border)",
        borderTop: `3px solid ${accentColor}`,
        borderRadius: 10,
        padding: 20,
        display: "flex",
        flexDirection: "column",
        gap: 14,
        minWidth: 260,
        flex: "1 1 280px",
      }}
    >
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <input
            value={round.name}
            onChange={(e) => onUpdate({ ...round, name: e.target.value })}
            style={{
              background: "transparent",
              border: "none",
              outline: "none",
              color: "var(--text)",
              fontSize: 18,
              fontWeight: 700,
              fontFamily: "var(--sans)",
              width: 120,
            }}
          />
          <span
            style={{
              fontSize: 10,
              fontWeight: 700,
              textTransform: "uppercase",
              letterSpacing: "0.1em",
              color: accentColor,
              background: `${accentColor}18`,
              padding: "3px 8px",
              borderRadius: 4,
              fontFamily: "var(--mono)",
            }}
          >
            {isSafe ? "SAFE" : "PRICED"}
          </span>
        </div>
        <div style={{ display: "flex", gap: 6 }}>
          <button
            onClick={() => onUpdate({ ...round, type: isSafe ? "priced" : "safe" })}
            style={{
              background: "var(--input-bg)",
              border: "1px solid var(--border)",
              borderRadius: 5,
              color: "var(--text-dim)",
              fontSize: 11,
              padding: "4px 8px",
              cursor: "pointer",
              fontFamily: "var(--mono)",
            }}
          >
            &rarr; {isSafe ? "Priced" : "SAFE"}
          </button>
          {!isOnly && (
            <button
              onClick={onRemove}
              style={{
                background: "transparent",
                border: "1px solid var(--border)",
                borderRadius: 5,
                color: "var(--text-dim)",
                fontSize: 14,
                padding: "2px 8px",
                cursor: "pointer",
                lineHeight: 1,
              }}
            >
              &times;
            </button>
          )}
        </div>
      </div>
      <FormattedInput
        label="Amount Raised"
        prefix="€"
        value={round.amount}
        onChange={(v) => onUpdate({ ...round, amount: v })}
        step={50000}
      />
      {isSafe ? (
        <>
          <FormattedInput
            label="Valuation Cap (post-money)"
            prefix="€"
            value={round.valCap}
            onChange={(v) => onUpdate({ ...round, valCap: v })}
            step={500000}
          />
          <FormattedInput
            label="Discount"
            suffix="%"
            value={round.discount}
            onChange={(v) => onUpdate({ ...round, discount: v })}
            step={1}
          />
        </>
      ) : (
        <>
          <FormattedInput
            label="Pre-Money Valuation"
            prefix="€"
            value={round.preMoneyVal}
            onChange={(v) => onUpdate({ ...round, preMoneyVal: v })}
            step={500000}
          />
          <FormattedInput
            label="ESOP Pool (% post-money)"
            suffix="%"
            value={round.esopPct}
            onChange={(v) => onUpdate({ ...round, esopPct: v })}
            step={1}
          />
        </>
      )}
    </div>
  );
}

const INVESTOR_COLORS = ["#f59e0b", "#10b981", "#06b6d4", "#ef4444", "#f97316", "#ec4899"];

function OwnershipBar({ shareholders }: { shareholders: Shareholder[] }) {
  let investorIdx = 0;
  return (
    <div style={{ display: "flex", borderRadius: 8, overflow: "hidden", height: 32, width: "100%" }}>
      {shareholders.map((s, i) => {
        let color: string;
        if (s.type === "founder") color = "#3b82f6";
        else if (s.type === "esop") color = "#8b5cf6";
        else {
          color = INVESTOR_COLORS[investorIdx % INVESTOR_COLORS.length];
          investorIdx++;
        }
        return (
          <div
            key={i}
            title={`${s.name}: ${formatPct(s.ownership)}`}
            style={{
              width: `${s.ownership * 100}%`,
              background: color,
              minWidth: s.ownership > 0.005 ? 2 : 0,
              transition: "width 0.4s ease",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              overflow: "hidden",
            }}
          >
            {s.ownership > 0.06 && (
              <span
                style={{
                  fontSize: 10,
                  color: "#fff",
                  fontWeight: 700,
                  fontFamily: "var(--mono)",
                  whiteSpace: "nowrap",
                }}
              >
                {formatPct(s.ownership)}
              </span>
            )}
          </div>
        );
      })}
    </div>
  );
}

function Legend({ shareholders }: { shareholders: Shareholder[] }) {
  let investorIdx = 0;
  return (
    <div style={{ display: "flex", flexWrap: "wrap", gap: "6px 16px", marginTop: 8 }}>
      {shareholders.map((s, i) => {
        let color: string;
        if (s.type === "founder") color = "#3b82f6";
        else if (s.type === "esop") color = "#8b5cf6";
        else {
          color = INVESTOR_COLORS[investorIdx % INVESTOR_COLORS.length];
          investorIdx++;
        }
        return (
          <div key={i} style={{ display: "flex", alignItems: "center", gap: 5 }}>
            <div style={{ width: 10, height: 10, borderRadius: 2, background: color, flexShrink: 0 }} />
            <span style={{ fontSize: 11, color: "var(--text-dim)", fontFamily: "var(--mono)" }}>{s.name}</span>
          </div>
        );
      })}
    </div>
  );
}

function SnapshotCard({ snapshot }: { snapshot: Snapshot }) {
  const isPriced = snapshot.roundType === "priced";
  const founders = snapshot.shareholders.find((s) => s.type === "founder");
  const esop = snapshot.shareholders.find((s) => s.type === "esop");

  return (
    <div
      style={{
        background: "var(--card-bg)",
        border: "1px solid var(--border)",
        borderRadius: 10,
        padding: 20,
        marginBottom: 16,
      }}
    >
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "baseline",
          marginBottom: 16,
          flexWrap: "wrap",
          gap: 8,
        }}
      >
        <h3 style={{ margin: 0, fontSize: 20, fontWeight: 700, color: "var(--text)", fontFamily: "var(--sans)" }}>
          After {snapshot.roundName}
        </h3>
        <span style={{ fontSize: 12, color: "var(--text-dim)", fontFamily: "var(--mono)" }}>
          Total raised: {formatCurrency(snapshot.totalRaised)}
        </span>
      </div>

      {isPriced && (
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(130px, 1fr))",
            gap: 12,
            marginBottom: 18,
          }}
        >
          {[
            { label: "Pre-Money", value: formatCurrency(snapshot.preMoney!) },
            { label: "Post-Money", value: formatCurrency(snapshot.postMoney!) },
            { label: "Price/Share", value: `€${snapshot.pricePerShare!.toFixed(4)}` },
            { label: "Founder Own.", value: formatPct(founders?.ownership || 0) },
            ...(esop ? [{ label: "ESOP Pool", value: formatPct(esop.ownership) }] : []),
          ].map((m) => (
            <div key={m.label} style={{ background: "var(--input-bg)", borderRadius: 8, padding: "10px 14px" }}>
              <div
                style={{
                  fontSize: 10,
                  textTransform: "uppercase",
                  letterSpacing: "0.06em",
                  color: "var(--text-dim)",
                  fontWeight: 600,
                  fontFamily: "var(--mono)",
                  marginBottom: 4,
                }}
              >
                {m.label}
              </div>
              <div style={{ fontSize: 16, fontWeight: 700, color: "var(--text)", fontFamily: "var(--mono)" }}>
                {m.value}
              </div>
            </div>
          ))}
        </div>
      )}

      {!isPriced && (
        <div style={{ background: "var(--input-bg)", borderRadius: 8, padding: 14, marginBottom: 16 }}>
          <div style={{ fontSize: 12, color: "var(--accent-safe)", fontWeight: 600, fontFamily: "var(--mono)" }}>
            &#9203; SAFE — converts at next priced round
          </div>
          <div style={{ fontSize: 12, color: "var(--text-dim)", marginTop: 6, fontFamily: "var(--mono)" }}>
            Cap: {formatCurrency(snapshot.pendingSafes?.[snapshot.pendingSafes.length - 1]?.valCap || 0)} · Discount:{" "}
            {snapshot.pendingSafes?.[snapshot.pendingSafes.length - 1]?.discount || 0}%
          </div>
        </div>
      )}

      {isPriced && snapshot.convertedSafes && snapshot.convertedSafes.length > 0 && (
        <div
          style={{
            background: "#f59e0b10",
            border: "1px solid #f59e0b30",
            borderRadius: 8,
            padding: 14,
            marginBottom: 16,
          }}
        >
          <div
            style={{
              fontSize: 11,
              fontWeight: 700,
              textTransform: "uppercase",
              color: "#f59e0b",
              marginBottom: 8,
              fontFamily: "var(--mono)",
            }}
          >
            SAFE Conversion Details
          </div>
          {snapshot.convertedSafes.map((cs, i) => (
            <div key={i} style={{ fontSize: 12, color: "var(--text)", fontFamily: "var(--mono)", marginBottom: 4 }}>
              {cs.name}: {cs.capOwnership != null ? formatPct(cs.capOwnership) : ""} at conversion @{" "}
              €{cs.effectivePrice.toFixed(4)}/sh
              {cs.capTriggered && <span style={{ color: "#f59e0b", marginLeft: 6 }}>(cap triggered)</span>}
              {cs.discountTriggered && <span style={{ color: "#f59e0b", marginLeft: 6 }}>(discount triggered)</span>}
            </div>
          ))}
        </div>
      )}

      {isPriced && (
        <>
          <OwnershipBar shareholders={snapshot.shareholders} />
          <Legend shareholders={snapshot.shareholders} />
          <div style={{ marginTop: 14, overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13, fontFamily: "var(--mono)" }}>
              <thead>
                <tr style={{ borderBottom: "1px solid var(--border)" }}>
                  {["Shareholder", "Ownership", "Implied Value", "Return"].map((h) => (
                    <th
                      key={h}
                      style={{
                        textAlign: "left",
                        padding: "8px 6px",
                        fontSize: 10,
                        textTransform: "uppercase",
                        letterSpacing: "0.06em",
                        color: "var(--text-dim)",
                        fontWeight: 600,
                      }}
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {snapshot.shareholders.map((s, i) => (
                  <tr
                    key={i}
                    style={{ borderBottom: "1px solid var(--border)", opacity: s.type === "esop" ? 0.65 : 1 }}
                  >
                    <td style={{ padding: "8px 6px", color: "var(--text)", fontWeight: 600 }}>
                      {s.name}
                      {s.type === "esop" && (
                        <span style={{ color: "var(--text-dim)", fontWeight: 400 }}> (reserved)</span>
                      )}
                    </td>
                    <td style={{ padding: "8px 6px", color: "var(--text)" }}>{formatPct(s.ownership)}</td>
                    <td style={{ padding: "8px 6px", color: "var(--text)" }}>
                      {s.impliedValue != null ? formatCurrency(s.impliedValue) : "—"}
                    </td>
                    <td
                      style={{
                        padding: "8px 6px",
                        color:
                          s.multiple != null
                            ? s.multiple >= 1
                              ? "#10b981"
                              : "#ef4444"
                            : "var(--text-dim)",
                      }}
                    >
                      {s.multiple != null ? `${s.multiple.toFixed(2)}×` : "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
}

// --- Main Component ---
export default function CapTable() {
  const [rounds, setRounds] = useState<Round[]>(DEFAULT_ROUNDS);
  const [initialEsopPct, setInitialEsopPct] = useState(DEFAULT_INITIAL_ESOP);
  const [copied, setCopied] = useState(false);
  const [initialized, setInitialized] = useState(false);

  // Load state from URL on mount
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const encoded = params.get("c");
    if (encoded) {
      const state = decodeState(encoded);
      if (state) {
        setRounds(state.rounds);
        setInitialEsopPct(state.esop);
      }
    }
    setInitialized(true);
  }, []);

  const nextId = rounds.length > 0 ? Math.max(...rounds.map((r) => r.id)) + 1 : 1;
  const snapshots = useMemo(
    () => computeCapTable(rounds, INTERNAL_FOUNDER_SHARES, initialEsopPct),
    [rounds, initialEsopPct]
  );

  const updateRound = useCallback(
    (index: number, updated: Round) => {
      const next = [...rounds];
      next[index] = updated;
      setRounds(next);
    },
    [rounds]
  );

  const removeRound = useCallback(
    (index: number) => {
      setRounds(rounds.filter((_, i) => i !== index));
    },
    [rounds]
  );

  const addRound = useCallback(() => {
    const labels = ["Seed", "Series A", "Series B", "Series C", "Series D", "Series E", "Series F"];
    const existingNames = new Set(rounds.map((r) => r.name));
    const name = labels.find((l) => !existingNames.has(l)) || `Round ${rounds.length + 1}`;

    setRounds([
      ...rounds,
      {
        id: nextId,
        name,
        type: "priced",
        amount: 5000000,
        valCap: 0,
        discount: 0,
        preMoneyVal: 30000000,
        esopPct: 5,
      },
    ]);
  }, [rounds, nextId]);

  const copyShareLink = useCallback(() => {
    const encoded = encodeState(rounds, initialEsopPct);
    const url = `${window.location.origin}${window.location.pathname}?c=${encoded}`;
    navigator.clipboard.writeText(url).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }, [rounds, initialEsopPct]);

  const resetToDefaults = useCallback(() => {
    setRounds(DEFAULT_ROUNDS);
    setInitialEsopPct(DEFAULT_INITIAL_ESOP);
    // Clear URL params
    window.history.replaceState({}, "", window.location.pathname);
  }, []);

  // Don't render until we've loaded URL state
  if (!initialized) return null;

  return (
    <div
      style={
        {
          "--bg": "#0f1117",
          "--card-bg": "#181b24",
          "--input-bg": "#1e222d",
          "--border": "#2a2f3c",
          "--text": "#e8eaf0",
          "--text-dim": "#6b7280",
          "--accent-safe": "#f59e0b",
          "--accent-priced": "#3b82f6",
          "--mono": "'JetBrains Mono', monospace",
          "--sans": "'Space Grotesk', -apple-system, sans-serif",
          background: "var(--bg)",
          color: "var(--text)",
          minHeight: "100vh",
          padding: "28px 24px",
          fontFamily: "var(--sans)",
          marginTop: -1,
        } as React.CSSProperties
      }
    >
      {/* eslint-disable-next-line @next/next/no-page-custom-font */}
      <link
        href="https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500;600;700&display=swap"
        rel="stylesheet"
      />

      <div style={{ maxWidth: 960, margin: "0 auto" }}>
        {/* Header with share button */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 32, flexWrap: "wrap", gap: 12 }}>
          <div>
            <h1 style={{ fontSize: 28, fontWeight: 700, margin: 0, letterSpacing: "-0.02em" }}>
              Cap Table Simulator
            </h1>
            <p style={{ fontSize: 13, color: "var(--text-dim)", margin: "6px 0 0", fontFamily: "var(--mono)" }}>
              SAFE conversions · priced rounds · ESOP pools · dilution &amp; returns
            </p>
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            <button
              onClick={resetToDefaults}
              style={{
                background: "var(--input-bg)",
                border: "1px solid var(--border)",
                borderRadius: 6,
                color: "var(--text-dim)",
                fontSize: 13,
                padding: "8px 16px",
                cursor: "pointer",
                fontFamily: "var(--mono)",
                fontWeight: 500,
                transition: "all 0.2s",
              }}
            >
              Reset
            </button>
            <button
              onClick={copyShareLink}
              style={{
                background: copied ? "#10b981" : "var(--accent-priced)",
                border: "none",
                borderRadius: 6,
                color: "#fff",
                fontSize: 13,
                padding: "8px 16px",
                cursor: "pointer",
                fontFamily: "var(--mono)",
                fontWeight: 600,
                transition: "all 0.2s",
              }}
            >
              {copied ? "Copied!" : "Copy Link"}
            </button>
          </div>
        </div>

        {/* Initial ESOP setting */}
        <div style={{ marginBottom: 24, maxWidth: 280 }}>
          <FormattedInput
            label="Initial ESOP (% pre-first round)"
            suffix="%"
            value={initialEsopPct}
            onChange={setInitialEsopPct}
            step={1}
            min={0}
          />
          <div style={{ fontSize: 11, color: "var(--text-dim)", fontFamily: "var(--mono)", marginTop: 4 }}>
            Created before first priced round — dilutes founders only
          </div>
        </div>

        {/* Rounds */}
        <div style={{ marginBottom: 12 }}>
          <h2
            style={{
              fontSize: 15,
              fontWeight: 700,
              color: "var(--text-dim)",
              textTransform: "uppercase",
              letterSpacing: "0.08em",
              marginBottom: 14,
              fontFamily: "var(--mono)",
            }}
          >
            Rounds
          </h2>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 16 }}>
            {rounds.map((round, i) => (
              <RoundCard
                key={round.id}
                round={round}
                onUpdate={(updated) => updateRound(i, updated)}
                onRemove={() => removeRound(i)}
                isOnly={rounds.length === 1}
              />
            ))}
            <button
              onClick={addRound}
              style={{
                minWidth: 160,
                flex: "0 0 auto",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                background: "transparent",
                border: "2px dashed var(--border)",
                borderRadius: 10,
                color: "var(--text-dim)",
                fontSize: 14,
                fontWeight: 600,
                cursor: "pointer",
                fontFamily: "var(--mono)",
                padding: 20,
                minHeight: 240,
              }}
            >
              + Add Round
            </button>
          </div>
        </div>

        {/* Snapshots */}
        <div style={{ marginTop: 36 }}>
          <h2
            style={{
              fontSize: 15,
              fontWeight: 700,
              color: "var(--text-dim)",
              textTransform: "uppercase",
              letterSpacing: "0.08em",
              marginBottom: 14,
              fontFamily: "var(--mono)",
            }}
          >
            Cap Table Snapshots
          </h2>
          {snapshots.map((snap, i) => (
            <SnapshotCard key={i} snapshot={snap} />
          ))}
          {snapshots.length === 0 && (
            <div
              style={{
                color: "var(--text-dim)",
                fontSize: 14,
                fontFamily: "var(--mono)",
                padding: 40,
                textAlign: "center",
              }}
            >
              Add at least one round to see results.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
