"use client";

import React, { useState, useMemo } from "react";

/* ── types ────────────────────────────────────────────────────────── */
type Tier = "industrial" | "research" | "hobby";
type Pill = "green" | "amber" | "red";
type SK = "name" | "payload" | "reach" | "dof" | "repeatability" | "priceUSD" | "priceEUR" | "ctrlFreq";

interface BuyLink { label: string; url: string }
interface Arm {
  tier: Tier;
  name: string;
  maker: string;
  flag: string;
  country: string;
  configs: string;
  img: string;
  // sort values
  payload: number;
  reach: number;
  dof: number;
  repeatability: number | null;
  priceUSD: number;
  priceEUR: number;
  ctrlFreq: number | null;
  // display strings
  payloadD: string;
  reachD: string;
  repeatabilityD: string;
  repeatabilityNote?: string;
  priceUSDd: string;
  priceEURd: string;
  priceNote?: string;
  ctrlFreqD: string;
  ctrlFreqNote?: string;
  buyLinks: BuyLink[];
  pill: Pill;
  pillLabel: string;
  readinessNote: string;
}

/* ── arm data ─────────────────────────────────────────────────────── */
const ARMS: Arm[] = [
  {
    tier: "industrial",
    name: "UR5e",
    maker: "Universal Robots",
    flag: "🇩🇰", country: "Denmark",
    configs: "single · bimanual",
    img: "https://www.universal-robots.com/media/1815260/ur5e.png",
    payload: 5, reach: 850, dof: 6, repeatability: 0.03,
    priceUSD: 37500, priceEUR: 34500, ctrlFreq: 500,
    payloadD: "5 kg", reachD: "850 mm",
    repeatabilityD: "±0.03 mm",
    priceUSDd: "$30–45k", priceEURd: "€29–40k",
    ctrlFreqD: "500 Hz",
    buyLinks: [
      { label: "Global", url: "https://www.universal-robots.com/" },
      { label: "EU", url: "https://www.mybotshop.de/Universal-Robots-UR5-UR5e_1" },
    ],
    pill: "green", pillLabel: "Production-ready",
    readinessNote: "ISO 13849 PLd Cat 3 · IP54 · Harmonic drives · Massive integrator ecosystem · 24/7 proven",
  },
  {
    tier: "research",
    name: "Franka FR3",
    maker: "Franka Robotics",
    flag: "🇩🇪", country: "Germany",
    configs: "single",
    img: "https://franka.de/assets/img/robots/fr3/fr3_robot.png",
    payload: 3, reach: 855, dof: 7, repeatability: 0.1,
    priceUSD: 30000, priceEUR: 24000, ctrlFreq: 1000,
    payloadD: "3 kg", reachD: "855 mm",
    repeatabilityD: "±0.1 mm",
    priceUSDd: "~$30k", priceEURd: "~€24k", priceNote: "Quote-based",
    ctrlFreqD: "1,000 Hz",
    buyLinks: [
      { label: "Official", url: "https://franka.de/products" },
      { label: "EU", url: "https://www.generationrobots.com/en/403992-7-axis-franka-research-3-robotic-arm-fci-licence.html" },
    ],
    pill: "amber", pillLabel: "Lab / light production",
    readinessNote: "Best-in-class torque sensing · 7-axis dexterity · IP40 only · Insolvency in 2023 — support uncertain · Low payload limits use cases",
  },
  {
    tier: "research",
    name: "OpenArm",
    maker: "Enactic / WowRobo",
    flag: "🇨🇳", country: "China",
    configs: "single · bimanual",
    img: "https://openelab.io/cdn/shop/files/openarm-product.jpg",
    payload: 6, reach: 633, dof: 7, repeatability: null,
    priceUSD: 5050, priceEUR: 4650, ctrlFreq: 1000,
    payloadD: "6 kg", reachD: "633 mm",
    repeatabilityD: "—", repeatabilityNote: "Not published",
    priceUSDd: "$3.6–6.5k", priceEURd: "~€3.3–6k", priceNote: "Ships intl.",
    ctrlFreqD: "1,000 Hz",
    buyLinks: [
      { label: "US", url: "https://store.foxtech.com/openarm/" },
      { label: "EU", url: "https://openelab.io/products/wowrobo-robotics-openarm-open-source" },
    ],
    pill: "amber", pillLabel: "Lab / open-source",
    readinessNote: "CE & UKCA compliant · 5.5 kg arm weight · Backdrivable joints · CAN-FD · Damiao motors · MuJoCo + Isaac Sim support · Best payload-to-price in class",
  },
  {
    tier: "hobby",
    name: "YAM",
    maker: "I2RT Robotics",
    flag: "🇺🇸", country: "USA",
    configs: "single · bimanual",
    img: "https://i2rt.com/cdn/shop/files/YAM_front.jpg",
    payload: 2, reach: 750, dof: 6, repeatability: null,
    priceUSD: 3000, priceEUR: 2800, ctrlFreq: 250,
    payloadD: "2 kg", reachD: "750 mm",
    repeatabilityD: "—", repeatabilityNote: "Cross-roller bearings",
    priceUSDd: "$3.0k", priceEURd: "~€2.8k", priceNote: "Ships intl.",
    ctrlFreqD: "250 Hz",
    buyLinks: [
      { label: "Official", url: "https://i2rt.com/collections/yam-arm" },
    ],
    pill: "red", pillLabel: "Not production-viable",
    readinessNote: "CNC 6061 billet · Cross-roller bearings · 4.7 kg arm weight · Vertically integrated motors · Ships in 2–3 days",
  },
  {
    tier: "hobby",
    name: "YAM Pro",
    maker: "I2RT Robotics",
    flag: "🇺🇸", country: "USA",
    configs: "single · bimanual",
    img: "https://i2rt.com/cdn/shop/files/YAM_Pro_front.jpg",
    payload: 3, reach: 750, dof: 6, repeatability: null,
    priceUSD: 3500, priceEUR: 3200, ctrlFreq: 250,
    payloadD: "3 kg", reachD: "750 mm",
    repeatabilityD: "—", repeatabilityNote: "Not published",
    priceUSDd: "$3.5k", priceEURd: "~€3.2k", priceNote: "Ships intl.",
    ctrlFreqD: "250 Hz",
    buyLinks: [
      { label: "Official", url: "https://i2rt.com/collections/yam-arm" },
    ],
    pill: "red", pillLabel: "Not production-viable",
    readinessNote: "Same build as YAM with enhanced payload · 4.8 kg arm weight · 95 mm gripper throw · Also available: YAM Ultra ($4.3k) & Big YAM ($5k)",
  },
  {
    tier: "hobby",
    name: "TRLC DK1",
    maker: "The Robot Learning Company",
    flag: "🇩🇪", country: "Germany",
    configs: "leader+follower · bimanual (DK1-X)",
    img: "https://www.robot-learning.co/images/dk1-arm.jpg",
    payload: 1, reach: 700, dof: 6, repeatability: null,
    priceUSD: 5500, priceEUR: 5100, ctrlFreq: null,
    payloadD: "1 kg", reachD: "700 mm",
    repeatabilityD: "—", repeatabilityNote: "Not published",
    priceUSDd: "$4.0–7.0k", priceEURd: "~€3.7–6.5k",
    ctrlFreqD: "—", ctrlFreqNote: "Camera 60 fps",
    buyLinks: [
      { label: "Official", url: "https://www.robot-learning.co/" },
    ],
    pill: "red", pillLabel: "Not production-viable",
    readinessNote: "Open-source (Apache-2.0) · Dynamixel XL330 servos · Leader + follower arms · LeRobot integration · Full CAD (STEP) · URDF · Designed for teleoperation & imitation learning",
  },
  {
    tier: "hobby",
    name: "Trossen ViperX 300 S",
    maker: "Trossen Robotics",
    flag: "🇺🇸", country: "USA",
    configs: "bimanual · mobile",
    img: "https://www.trossenrobotics.com/content/PImages/ViperX300-main.jpg",
    payload: 0.75, reach: 750, dof: 6, repeatability: 1.5,
    priceUSD: 6700, priceEUR: 5500, ctrlFreq: 50,
    payloadD: "0.75 kg", reachD: "750 mm",
    repeatabilityD: "~1 mm", repeatabilityNote: "Dynamixel servos, no harmonic drives",
    priceUSDd: "$6.7k", priceEURd: "€5.5k",
    ctrlFreqD: "50 Hz",
    buyLinks: [
      { label: "US", url: "https://www.trossenrobotics.com/viperx-300" },
      { label: "EU", url: "https://www.mybotshop.de/Interbotix-ViperX_1" },
    ],
    pill: "red", pillLabel: "Not production-viable",
    readinessNote: "ALOHA-native · Great for cheap bimanual data · Hobby servos = backlash, limited torque · No safety certs · No IP rating",
  },
  {
    tier: "hobby",
    name: "ARX X5 / L5",
    maker: "ARX Technology",
    flag: "🇨🇳", country: "China",
    configs: "bimanual · mobile",
    img: "https://arx-x.com/images/x5-arm.jpg",
    payload: 1.5, reach: 620, dof: 6, repeatability: 0.75,
    priceUSD: 3000, priceEUR: 2750, ctrlFreq: 500,
    payloadD: "1.5 kg", reachD: "620 mm",
    repeatabilityD: "~0.5–1 mm", repeatabilityNote: "Planetary gears, better than servos",
    priceUSDd: "$2–4k", priceEURd: "—", priceNote: "Contact mfr.",
    ctrlFreqD: "500 Hz",
    buyLinks: [
      { label: "Direct", url: "https://arx-x.com/" },
    ],
    pill: "red", pillLabel: "Not production-viable",
    readinessNote: "3.4 kg arm weight · Planetary gears > Dynamixel but < harmonic · Growing ALOHA/LeRobot ecosystem · No safety certs · No Western reseller",
  },
  {
    tier: "hobby",
    name: "AgileX PiPER",
    maker: "AgileX Robotics",
    flag: "🇨🇳", country: "China",
    configs: "bimanual",
    img: "https://global.agilex.ai/cdn/shop/files/piper-arm.jpg",
    payload: 1.5, reach: 626, dof: 6, repeatability: 0.1,
    priceUSD: 2500, priceEUR: 3100, ctrlFreq: 200,
    payloadD: "1.5 kg", reachD: "626 mm",
    repeatabilityD: "~0.1 mm",
    priceUSDd: "$2.5k", priceEURd: "€2.8–3.7k",
    ctrlFreqD: "200 Hz",
    buyLinks: [
      { label: "Global", url: "https://global.agilex.ai/products/piper" },
      { label: "EU", url: "https://autodiscovery.eu/en/products/piper" },
    ],
    pill: "red", pillLabel: "Not production-viable",
    readinessNote: "4.2 kg arm weight · ROS2-native · Good for mobile robot integration · Widest EU reseller availability in class · No safety certs · No IP rating",
  },
];

/* ── sort helper ──────────────────────────────────────────────────── */
function getVal(arm: Arm, key: SK): number | string | null {
  if (key === "name") return arm.name;
  if (key === "payload") return arm.payload;
  if (key === "reach") return arm.reach;
  if (key === "dof") return arm.dof;
  if (key === "repeatability") return arm.repeatability;
  if (key === "priceUSD") return arm.priceUSD;
  if (key === "priceEUR") return arm.priceEUR;
  if (key === "ctrlFreq") return arm.ctrlFreq;
  return null;
}

function sortArms(arms: Arm[], key: SK | null, dir: "asc" | "desc"): Arm[] {
  if (!key) return arms;
  return [...arms].sort((a, b) => {
    const av = getVal(a, key);
    const bv = getVal(b, key);
    if (av === null && bv === null) return 0;
    if (av === null) return 1;
    if (bv === null) return -1;
    if (typeof av === "string" && typeof bv === "string") {
      return dir === "asc" ? av.localeCompare(bv) : bv.localeCompare(av);
    }
    const r = (av as number) - (bv as number);
    return dir === "asc" ? r : -r;
  });
}

const TIER_ORDER: Record<Tier, number> = { industrial: 0, research: 1, hobby: 2 };

/* ── component ────────────────────────────────────────────────────── */
export default function RobotArmsPage() {
  const [sortKey, setSortKey] = useState<SK | null>(null);
  const [sortDir, setSortDir] = useState<"asc" | "desc">("asc");

  const handleSort = (key: SK) => {
    if (sortKey === key) {
      setSortDir(d => d === "asc" ? "desc" : "asc");
    } else {
      setSortKey(key);
      setSortDir("asc");
    }
  };

  const sorted = useMemo(() => {
    if (!sortKey) return [...ARMS].sort((a, b) => TIER_ORDER[a.tier] - TIER_ORDER[b.tier]);
    return sortArms(ARMS, sortKey, sortDir);
  }, [sortKey, sortDir]);

  const SortIcon = ({ col }: { col: SK }) => {
    if (sortKey !== col) return <span className="ra-sort-icon ra-sort-neutral">↕</span>;
    return <span className="ra-sort-icon ra-sort-active">{sortDir === "asc" ? "↑" : "↓"}</span>;
  };

  const Th = ({ col, children }: { col: SK; children: React.ReactNode }) => (
    <th onClick={() => handleSort(col)} className="ra-sortable-th">
      {children} <SortIcon col={col} />
    </th>
  );

  return (
    <>
      <style>{`
        .ra-root {
          --bg: #FAFAF8;
          --surface: #FFFFFF;
          --border: #E8E6E1;
          --text-primary: #1A1A18;
          --text-secondary: #6B6962;
          --text-tertiary: #9C9A93;
          --accent-industrial: #2B5F3F;
          --accent-industrial-bg: #E8F0EC;
          --accent-research: #4A5899;
          --accent-research-bg: #ECEEF6;
          --accent-hobby: #8B6B3E;
          --accent-hobby-bg: #F4F0E6;
          --red-text: #9B2C2C;
          --red-bg: #FEF2F2;
          --green-text: #276749;
          --green-bg: #F0FFF4;
          --amber-text: #7B5B1E;
          --amber-bg: #FFFBEB;
          font-family: 'DM Sans', -apple-system, sans-serif;
          background: var(--bg);
          color: var(--text-primary);
          line-height: 1.5;
          padding: 2rem 1.5rem;
        }

        .ra-container { max-width: 1300px; margin: 0 auto; }

        .ra-header {
          margin-bottom: 2rem;
          padding-bottom: 1.5rem;
          border-bottom: 1px solid var(--border);
        }

        .ra-header h1 {
          font-size: 1.5rem;
          font-weight: 700;
          letter-spacing: -0.02em;
        }

        .ra-header p {
          font-size: 0.85rem;
          color: var(--text-secondary);
          margin-top: 0.35rem;
        }

        .ra-tier-label {
          display: inline-block;
          font-size: 0.63rem;
          font-weight: 600;
          letter-spacing: 0.08em;
          text-transform: uppercase;
          padding: 2px 7px;
          border-radius: 4px;
          margin-bottom: 0.5rem;
        }
        .ra-tier-industrial { background: var(--accent-industrial-bg); color: var(--accent-industrial); }
        .ra-tier-research   { background: var(--accent-research-bg);   color: var(--accent-research); }
        .ra-tier-hobby      { background: var(--accent-hobby-bg);       color: var(--accent-hobby); }

        .ra-table-wrapper {
          overflow-x: auto;
          -webkit-overflow-scrolling: touch;
          border: 1px solid var(--border);
          border-radius: 10px;
          background: var(--surface);
        }

        .ra-table-wrapper table {
          width: 100%;
          border-collapse: collapse;
          min-width: 1060px;
          font-size: 0.82rem;
        }

        .ra-table-wrapper thead th {
          text-align: left;
          padding: 0.85rem 0.9rem;
          font-weight: 600;
          font-size: 0.7rem;
          letter-spacing: 0.06em;
          text-transform: uppercase;
          color: var(--text-tertiary);
          border-bottom: 1px solid var(--border);
          background: var(--bg);
          position: sticky;
          top: 0;
          z-index: 2;
          white-space: nowrap;
          user-select: none;
        }

        .ra-sortable-th {
          cursor: pointer;
        }
        .ra-sortable-th:hover {
          color: var(--text-secondary) !important;
          background: #F2F1EE !important;
        }

        .ra-sort-icon {
          display: inline-block;
          margin-left: 3px;
          font-size: 0.7rem;
        }
        .ra-sort-neutral { opacity: 0.3; }
        .ra-sort-active  { color: var(--text-primary); opacity: 1; }

        .ra-table-wrapper thead th:first-child { border-top-left-radius: 10px; }
        .ra-table-wrapper thead th:last-child  { border-top-right-radius: 10px; }

        .ra-table-wrapper tbody td {
          padding: 0.75rem 0.9rem;
          border-bottom: 1px solid #F2F1EE;
          vertical-align: top;
        }
        .ra-table-wrapper tbody tr:last-child td { border-bottom: none; }
        .ra-table-wrapper tbody tr:hover { background: #FDFCFA; }

        /* arm cell */
        .ra-arm-cell { display: flex; gap: 10px; align-items: flex-start; min-width: 180px; }
        .ra-arm-thumb {
          flex-shrink: 0;
          width: 52px; height: 52px;
          border-radius: 6px;
          object-fit: contain;
          background: #F5F5F2;
          border: 1px solid var(--border);
          padding: 4px;
        }
        .ra-arm-thumb-placeholder {
          flex-shrink: 0;
          width: 52px; height: 52px;
          border-radius: 6px;
          background: #F0F0EC;
          border: 1px solid var(--border);
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 0.65rem;
          color: var(--text-tertiary);
          font-weight: 600;
          letter-spacing: 0.02em;
        }
        .ra-arm-meta { display: flex; flex-direction: column; }
        .ra-arm-name {
          font-weight: 600;
          font-size: 0.88rem;
          color: var(--text-primary);
        }
        .ra-arm-maker {
          font-size: 0.73rem;
          color: var(--text-secondary);
          margin-top: 1px;
        }
        .ra-arm-configs {
          font-family: 'JetBrains Mono', monospace;
          font-size: 0.68rem;
          color: var(--text-tertiary);
          margin-top: 3px;
        }

        /* flag cell */
        .ra-flag-cell { font-size: 1.3rem; text-align: center; line-height: 1; padding-top: 0.85rem; }

        .ra-val  { font-family: 'JetBrains Mono', monospace; font-weight: 500; font-size: 0.82rem; }
        .ra-unit { font-size: 0.72rem; color: var(--text-tertiary); margin-left: 2px; }

        .ra-pill {
          display: inline-block;
          font-size: 0.68rem;
          font-weight: 600;
          padding: 2px 7px;
          border-radius: 4px;
        }
        .ra-pill-green { background: var(--green-bg); color: var(--green-text); }
        .ra-pill-amber { background: var(--amber-bg); color: var(--amber-text); }
        .ra-pill-red   { background: var(--red-bg);   color: var(--red-text); }

        .ra-note {
          font-size: 0.71rem;
          color: var(--text-secondary);
          line-height: 1.45;
          display: block;
          margin-top: 3px;
        }

        .ra-buy-links { display: flex; gap: 5px; flex-wrap: wrap; margin-top: 2px; }
        .ra-buy-link {
          display: inline-block;
          font-size: 0.68rem;
          font-weight: 500;
          padding: 2px 7px;
          border-radius: 4px;
          background: #F0F0EC;
          color: var(--text-secondary);
          text-decoration: none;
          transition: background 0.12s;
        }
        .ra-buy-link:hover { background: #E4E4DE; color: var(--text-primary); }

        .ra-bottom-note {
          margin-top: 1.25rem;
          font-size: 0.75rem;
          color: var(--text-tertiary);
          line-height: 1.6;
          padding: 0.75rem 1rem;
          background: var(--bg);
          border-radius: 8px;
          border: 1px solid var(--border);
        }
        .ra-bottom-note strong { color: var(--text-secondary); font-weight: 600; }

        @media (max-width: 640px) {
          .ra-root { padding: 1rem 0.75rem; }
          .ra-header h1 { font-size: 1.25rem; }
        }
      `}</style>

      <link
        href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500&display=swap"
        rel="stylesheet"
      />

      <div className="ra-root">
        <div className="ra-container">
          <header className="ra-header">
            <h1>Robot arms for robot learning</h1>
            <p>9 arm types across industrial, research, and data-collection tiers &mdash; click any column header to sort</p>
          </header>

          <div className="ra-table-wrapper">
            <table>
              <thead>
                <tr>
                  <Th col="name">Arm</Th>
                  <th style={{ textAlign: "center", minWidth: 46 }}>Made in</th>
                  <Th col="payload">Payload</Th>
                  <Th col="reach">Reach</Th>
                  <Th col="dof">DOF</Th>
                  <Th col="repeatability">Repeatability</Th>
                  <Th col="priceUSD">Price (USD)</Th>
                  <Th col="priceEUR">Price (EUR)</Th>
                  <Th col="ctrlFreq">Ctrl freq.</Th>
                  <th>Buy</th>
                  <th>Production readiness</th>
                </tr>
              </thead>
              <tbody>
                {sorted.map((arm) => (
                  <ArmRow key={arm.name} arm={arm} />
                ))}
              </tbody>
            </table>
          </div>

          <div className="ra-bottom-note">
            <strong>Reading this table:</strong> Only the UR5e carries full industrial safety certification (ISO, IP54) for production deployment. The Franka FR3 and OpenArm are viable for structured lab environments. Everything in the data-collection tier is designed for teleoperation and training data gathering &mdash; not deployment hardware. The YAM arms stand out for build quality in the budget tier (CNC billet, cross-roller bearings), while the TRLC DK1 and PiPER offer the most turnkey LeRobot/ALOHA integration. EUR prices are approximate conversions where not explicitly listed by resellers.
          </div>
        </div>
      </div>
    </>
  );
}

/* ── row sub-component ────────────────────────────────────────────── */
function ArmRow({ arm }: { arm: Arm }) {
  const [imgFailed, setImgFailed] = React.useState(false);

  const initials = arm.name
    .split(/\s+/)
    .slice(0, 2)
    .map(w => w[0])
    .join("")
    .toUpperCase();

  return (
    <tr>
      {/* Arm */}
      <td>
        <span className={`ra-tier-label ra-tier-${arm.tier}`}>
          {arm.tier === "industrial" ? "Industrial" : arm.tier === "research" ? "Research" : "Data collection"}
        </span>
        <div className="ra-arm-cell">
          {imgFailed ? (
            <div className="ra-arm-thumb-placeholder">{initials}</div>
          ) : (
            <img
              className="ra-arm-thumb"
              src={arm.img}
              alt={arm.name}
              onError={() => setImgFailed(true)}
            />
          )}
          <div className="ra-arm-meta">
            <span className="ra-arm-name">{arm.name}</span>
            <span className="ra-arm-maker">{arm.maker}</span>
            <span className="ra-arm-configs">{arm.configs}</span>
          </div>
        </div>
      </td>

      {/* Made in */}
      <td className="ra-flag-cell" title={arm.country}>{arm.flag}</td>

      {/* Payload */}
      <td><span className="ra-val">{arm.payloadD}</span></td>

      {/* Reach */}
      <td><span className="ra-val">{arm.reachD}</span></td>

      {/* DOF */}
      <td><span className="ra-val">{arm.dof}</span></td>

      {/* Repeatability */}
      <td>
        <span className="ra-val">{arm.repeatabilityD}</span>
        {arm.repeatabilityNote && <span className="ra-note">{arm.repeatabilityNote}</span>}
      </td>

      {/* Price USD */}
      <td>
        <span className="ra-val">{arm.priceUSDd}</span>
        {arm.priceNote && <span className="ra-note">{arm.priceNote}</span>}
      </td>

      {/* Price EUR */}
      <td>
        <span className="ra-val">{arm.priceEURd}</span>
      </td>

      {/* Ctrl freq */}
      <td>
        <span className="ra-val">{arm.ctrlFreqD}</span>
        {arm.ctrlFreqNote && <span className="ra-note">{arm.ctrlFreqNote}</span>}
      </td>

      {/* Buy */}
      <td>
        <div className="ra-buy-links">
          {arm.buyLinks.map(l => (
            <a key={l.label} className="ra-buy-link" href={l.url} target="_blank" rel="noopener noreferrer">
              {l.label}
            </a>
          ))}
        </div>
      </td>

      {/* Production readiness */}
      <td>
        <span className={`ra-pill ra-pill-${arm.pill}`}>{arm.pillLabel}</span>
        <span className="ra-note">{arm.readinessNote}</span>
      </td>
    </tr>
  );
}
