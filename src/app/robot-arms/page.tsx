"use client";

import React from "react";

export default function RobotArmsPage() {
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
        }

        .ra-root {
          font-family: 'DM Sans', -apple-system, sans-serif;
          background: var(--bg);
          color: var(--text-primary);
          line-height: 1.5;
          padding: 2rem 1.5rem;
        }

        .ra-container { max-width: 1200px; margin: 0 auto; }

        .ra-header {
          margin-bottom: 2rem;
          padding-bottom: 1.5rem;
          border-bottom: 1px solid var(--border);
        }

        .ra-header h1 {
          font-size: 1.5rem;
          font-weight: 700;
          letter-spacing: -0.02em;
          color: var(--text-primary);
        }

        .ra-header p {
          font-size: 0.85rem;
          color: var(--text-secondary);
          margin-top: 0.35rem;
        }

        .ra-tier-label {
          display: inline-block;
          font-size: 0.65rem;
          font-weight: 600;
          letter-spacing: 0.08em;
          text-transform: uppercase;
          padding: 3px 8px;
          border-radius: 4px;
          margin-bottom: 0.75rem;
        }

        .ra-tier-industrial { background: var(--accent-industrial-bg); color: var(--accent-industrial); }
        .ra-tier-research { background: var(--accent-research-bg); color: var(--accent-research); }
        .ra-tier-hobby { background: var(--accent-hobby-bg); color: var(--accent-hobby); }

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
          min-width: 1100px;
          font-size: 0.82rem;
        }

        .ra-table-wrapper thead th {
          text-align: left;
          padding: 0.85rem 1rem;
          font-weight: 600;
          font-size: 0.72rem;
          letter-spacing: 0.06em;
          text-transform: uppercase;
          color: var(--text-tertiary);
          border-bottom: 1px solid var(--border);
          background: var(--bg);
          position: sticky;
          top: 0;
          z-index: 2;
        }

        .ra-table-wrapper thead th:first-child {
          border-top-left-radius: 10px;
          min-width: 180px;
        }

        .ra-table-wrapper thead th:last-child {
          border-top-right-radius: 10px;
        }

        .ra-table-wrapper tbody td {
          padding: 0.75rem 1rem;
          border-bottom: 1px solid #F2F1EE;
          vertical-align: top;
        }

        .ra-table-wrapper tbody tr:last-child td { border-bottom: none; }
        .ra-table-wrapper tbody tr:hover { background: #FDFCFA; }

        .ra-arm-name {
          font-weight: 600;
          font-size: 0.88rem;
          color: var(--text-primary);
          display: block;
        }

        .ra-arm-maker {
          font-size: 0.75rem;
          color: var(--text-secondary);
          display: block;
          margin-top: 1px;
        }

        .ra-arm-configs {
          font-family: 'JetBrains Mono', monospace;
          font-size: 0.7rem;
          color: var(--text-tertiary);
          display: block;
          margin-top: 4px;
        }

        .ra-val { font-family: 'JetBrains Mono', monospace; font-weight: 500; font-size: 0.82rem; }
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
        .ra-pill-red { background: var(--red-bg); color: var(--red-text); }

        .ra-rating-bar {
          display: flex;
          align-items: center;
          gap: 6px;
          margin-top: 4px;
        }

        .ra-rating-track {
          width: 60px;
          height: 4px;
          background: #EEEEE9;
          border-radius: 2px;
          overflow: hidden;
        }

        .ra-rating-fill {
          height: 100%;
          border-radius: 2px;
        }

        .ra-fill-high { background: var(--accent-industrial); }
        .ra-fill-mid { background: var(--accent-research); }
        .ra-fill-low { background: var(--accent-hobby); }

        .ra-note {
          font-size: 0.72rem;
          color: var(--text-secondary);
          line-height: 1.45;
          display: block;
          margin-top: 3px;
        }

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

        .ra-buy-links {
          display: flex;
          gap: 6px;
          margin-top: 4px;
          flex-wrap: wrap;
        }

        .ra-buy-link {
          display: inline-block;
          font-size: 0.68rem;
          font-weight: 500;
          padding: 2px 7px;
          border-radius: 4px;
          background: #F0F0EC;
          color: var(--text-secondary);
          text-decoration: none;
          transition: background 0.15s;
        }

        .ra-buy-link:hover {
          background: #E4E4DE;
          color: var(--text-primary);
        }

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
            <p>9 arm types across industrial, research, and data-collection tiers &mdash; compared for production deployment</p>
          </header>

          <div className="ra-table-wrapper">
            <table>
              <thead>
                <tr>
                  <th>Arm</th>
                  <th>Payload</th>
                  <th>Reach</th>
                  <th>DOF</th>
                  <th>Repeatability</th>
                  <th>Price (USD)</th>
                  <th>Price (EUR)</th>
                  <th>Ctrl freq.</th>
                  <th>Buy</th>
                  <th>Production readiness</th>
                </tr>
              </thead>
              <tbody>
                {/* Industrial tier */}
                <tr>
                  <td>
                    <span className="ra-tier-label ra-tier-industrial">Industrial</span>
                    <span className="ra-arm-name">UR5e</span>
                    <span className="ra-arm-maker">Universal Robots &bull; Denmark</span>
                    <span className="ra-arm-configs">single &middot; bimanual</span>
                  </td>
                  <td><span className="ra-val">5<span className="ra-unit">kg</span></span></td>
                  <td><span className="ra-val">850<span className="ra-unit">mm</span></span></td>
                  <td><span className="ra-val">6</span></td>
                  <td><span className="ra-val">&plusmn;0.03<span className="ra-unit">mm</span></span></td>
                  <td><span className="ra-val">$30&ndash;45k</span></td>
                  <td><span className="ra-val">&euro;29&ndash;40k</span></td>
                  <td><span className="ra-val">500<span className="ra-unit">Hz</span></span></td>
                  <td>
                    <div className="ra-buy-links">
                      <a className="ra-buy-link" href="https://www.universal-robots.com/" target="_blank" rel="noopener noreferrer">Global</a>
                      <a className="ra-buy-link" href="https://www.mybotshop.de/Universal-Robots-UR5-UR5e_1" target="_blank" rel="noopener noreferrer">EU</a>
                    </div>
                  </td>
                  <td>
                    <span className="ra-pill ra-pill-green">Production-ready</span>
                    <span className="ra-note">ISO 13849 PLd Cat 3 &bull; IP54 &bull; Harmonic drives &bull; Massive integrator ecosystem &bull; 24/7 proven</span>
                    <div className="ra-rating-bar">
                      <div className="ra-rating-track"><div className="ra-rating-fill ra-fill-high" style={{ width: "95%" }}></div></div>
                      <span style={{ fontSize: "0.7rem", color: "var(--text-tertiary)" }}>95 / 100</span>
                    </div>
                  </td>
                </tr>

                {/* Research tier */}
                <tr>
                  <td>
                    <span className="ra-tier-label ra-tier-research">Research</span>
                    <span className="ra-arm-name">Franka FR3</span>
                    <span className="ra-arm-maker">Franka Robotics &bull; Germany</span>
                    <span className="ra-arm-configs">single</span>
                  </td>
                  <td><span className="ra-val">3<span className="ra-unit">kg</span></span></td>
                  <td><span className="ra-val">855<span className="ra-unit">mm</span></span></td>
                  <td><span className="ra-val">7</span></td>
                  <td><span className="ra-val">&plusmn;0.1<span className="ra-unit">mm</span></span></td>
                  <td><span className="ra-val">~$30k</span></td>
                  <td><span className="ra-val">~&euro;24k</span><span className="ra-note">Quote-based</span></td>
                  <td><span className="ra-val">1,000<span className="ra-unit">Hz</span></span></td>
                  <td>
                    <div className="ra-buy-links">
                      <a className="ra-buy-link" href="https://franka.de/products" target="_blank" rel="noopener noreferrer">Official</a>
                      <a className="ra-buy-link" href="https://www.generationrobots.com/en/403992-7-axis-franka-research-3-robotic-arm-fci-licence.html" target="_blank" rel="noopener noreferrer">EU</a>
                    </div>
                  </td>
                  <td>
                    <span className="ra-pill ra-pill-amber">Lab / light production</span>
                    <span className="ra-note">Best-in-class torque sensing &bull; 7-axis dexterity &bull; IP40 only &bull; Insolvency in 2023 &mdash; support uncertain &bull; Low payload limits use cases</span>
                    <div className="ra-rating-bar">
                      <div className="ra-rating-track"><div className="ra-rating-fill ra-fill-mid" style={{ width: "45%" }}></div></div>
                      <span style={{ fontSize: "0.7rem", color: "var(--text-tertiary)" }}>45 / 100</span>
                    </div>
                  </td>
                </tr>

                <tr>
                  <td>
                    <span className="ra-tier-label ra-tier-research">Research</span>
                    <span className="ra-arm-name">OpenArm</span>
                    <span className="ra-arm-maker">Enactic / WowRobo &bull; Open-source</span>
                    <span className="ra-arm-configs">single &middot; bimanual</span>
                  </td>
                  <td><span className="ra-val">6<span className="ra-unit">kg</span></span><span className="ra-note">Peak</span></td>
                  <td><span className="ra-val">633<span className="ra-unit">mm</span></span></td>
                  <td><span className="ra-val">7</span></td>
                  <td><span className="ra-val">&mdash;</span><span className="ra-note">Not published</span></td>
                  <td><span className="ra-val">$3.6&ndash;6.5k</span></td>
                  <td><span className="ra-val">~&euro;3.3&ndash;6k</span><span className="ra-note">Ships intl.</span></td>
                  <td><span className="ra-val">1,000<span className="ra-unit">Hz</span></span></td>
                  <td>
                    <div className="ra-buy-links">
                      <a className="ra-buy-link" href="https://store.foxtech.com/openarm/" target="_blank" rel="noopener noreferrer">US</a>
                      <a className="ra-buy-link" href="https://openelab.io/products/wowrobo-robotics-openarm-open-source" target="_blank" rel="noopener noreferrer">EU</a>
                    </div>
                  </td>
                  <td>
                    <span className="ra-pill ra-pill-amber">Lab / open-source</span>
                    <span className="ra-note">CE &amp; UKCA compliant &bull; 5.5 kg arm weight &bull; Backdrivable joints &bull; CAN-FD &bull; Damiao motors &bull; MuJoCo + Isaac Sim support &bull; Best payload-to-price in class</span>
                    <div className="ra-rating-bar">
                      <div className="ra-rating-track"><div className="ra-rating-fill ra-fill-mid" style={{ width: "55%" }}></div></div>
                      <span style={{ fontSize: "0.7rem", color: "var(--text-tertiary)" }}>55 / 100</span>
                    </div>
                  </td>
                </tr>

                {/* Data collection tier */}
                <tr>
                  <td>
                    <span className="ra-tier-label ra-tier-hobby">Data collection</span>
                    <span className="ra-arm-name">YAM</span>
                    <span className="ra-arm-maker">I2RT Robotics &bull; USA</span>
                    <span className="ra-arm-configs">single &middot; bimanual</span>
                  </td>
                  <td><span className="ra-val">2<span className="ra-unit">kg</span></span></td>
                  <td><span className="ra-val">750<span className="ra-unit">mm</span></span></td>
                  <td><span className="ra-val">6</span></td>
                  <td><span className="ra-val">&mdash;</span><span className="ra-note">Cross-roller bearings</span></td>
                  <td><span className="ra-val">$3.0k</span></td>
                  <td><span className="ra-val">~&euro;2.8k</span><span className="ra-note">Ships intl.</span></td>
                  <td><span className="ra-val">250<span className="ra-unit">Hz</span></span></td>
                  <td>
                    <div className="ra-buy-links">
                      <a className="ra-buy-link" href="https://i2rt.com/collections/yam-arm" target="_blank" rel="noopener noreferrer">Official</a>
                    </div>
                  </td>
                  <td>
                    <span className="ra-pill ra-pill-red">Not production-viable</span>
                    <span className="ra-note">CNC 6061 billet &bull; Cross-roller bearings &bull; 4.7 kg arm weight &bull; Vertically integrated motors &bull; Ships in 2&ndash;3 days</span>
                    <div className="ra-rating-bar">
                      <div className="ra-rating-track"><div className="ra-rating-fill ra-fill-low" style={{ width: "25%" }}></div></div>
                      <span style={{ fontSize: "0.7rem", color: "var(--text-tertiary)" }}>25 / 100</span>
                    </div>
                  </td>
                </tr>

                <tr>
                  <td>
                    <span className="ra-tier-label ra-tier-hobby">Data collection</span>
                    <span className="ra-arm-name">YAM Pro</span>
                    <span className="ra-arm-maker">I2RT Robotics &bull; USA</span>
                    <span className="ra-arm-configs">single &middot; bimanual</span>
                  </td>
                  <td><span className="ra-val">3<span className="ra-unit">kg</span></span></td>
                  <td><span className="ra-val">750<span className="ra-unit">mm</span></span></td>
                  <td><span className="ra-val">6</span></td>
                  <td><span className="ra-val">&mdash;</span><span className="ra-note">Not published</span></td>
                  <td><span className="ra-val">$3.5k</span></td>
                  <td><span className="ra-val">~&euro;3.2k</span><span className="ra-note">Ships intl.</span></td>
                  <td><span className="ra-val">250<span className="ra-unit">Hz</span></span></td>
                  <td>
                    <div className="ra-buy-links">
                      <a className="ra-buy-link" href="https://i2rt.com/collections/yam-arm" target="_blank" rel="noopener noreferrer">Official</a>
                    </div>
                  </td>
                  <td>
                    <span className="ra-pill ra-pill-red">Not production-viable</span>
                    <span className="ra-note">Same build as YAM with enhanced payload &bull; 4.8 kg arm weight &bull; 95 mm gripper throw &bull; Also available: YAM Ultra ($4.3k) &amp; Big YAM ($5k)</span>
                    <div className="ra-rating-bar">
                      <div className="ra-rating-track"><div className="ra-rating-fill ra-fill-low" style={{ width: "28%" }}></div></div>
                      <span style={{ fontSize: "0.7rem", color: "var(--text-tertiary)" }}>28 / 100</span>
                    </div>
                  </td>
                </tr>

                <tr>
                  <td>
                    <span className="ra-tier-label ra-tier-hobby">Data collection</span>
                    <span className="ra-arm-name">TRLC DK1</span>
                    <span className="ra-arm-maker">The Robot Learning Company &bull; Germany</span>
                    <span className="ra-arm-configs">leader+follower &middot; bimanual (DK1-X)</span>
                  </td>
                  <td><span className="ra-val">1<span className="ra-unit">kg</span></span></td>
                  <td><span className="ra-val">700<span className="ra-unit">mm</span></span></td>
                  <td><span className="ra-val">6</span></td>
                  <td><span className="ra-val">&mdash;</span><span className="ra-note">Not published</span></td>
                  <td><span className="ra-val">$4.0&ndash;7.0k</span></td>
                  <td><span className="ra-val">~&euro;3.7&ndash;6.5k</span></td>
                  <td><span className="ra-val">&mdash;</span><span className="ra-note">Camera 60fps</span></td>
                  <td>
                    <div className="ra-buy-links">
                      <a className="ra-buy-link" href="https://www.robot-learning.co/" target="_blank" rel="noopener noreferrer">Official</a>
                    </div>
                  </td>
                  <td>
                    <span className="ra-pill ra-pill-red">Not production-viable</span>
                    <span className="ra-note">Open-source (Apache-2.0) &bull; Dynamixel XL330 servos &bull; Leader + follower arms &bull; LeRobot integration &bull; Full CAD (STEP) &bull; URDF &bull; Designed for teleoperation &amp; imitation learning</span>
                    <div className="ra-rating-bar">
                      <div className="ra-rating-track"><div className="ra-rating-fill ra-fill-low" style={{ width: "18%" }}></div></div>
                      <span style={{ fontSize: "0.7rem", color: "var(--text-tertiary)" }}>18 / 100</span>
                    </div>
                  </td>
                </tr>

                <tr>
                  <td>
                    <span className="ra-tier-label ra-tier-hobby">Data collection</span>
                    <span className="ra-arm-name">Trossen ViperX 300 S</span>
                    <span className="ra-arm-maker">Trossen Robotics &bull; USA</span>
                    <span className="ra-arm-configs">bimanual &middot; mobile</span>
                  </td>
                  <td><span className="ra-val">0.75<span className="ra-unit">kg</span></span></td>
                  <td><span className="ra-val">750<span className="ra-unit">mm</span></span></td>
                  <td><span className="ra-val">6</span></td>
                  <td><span className="ra-val">~1<span className="ra-unit">mm</span></span><span className="ra-note">Dynamixel servos, no harmonic drives</span></td>
                  <td><span className="ra-val">$6.7k</span></td>
                  <td><span className="ra-val">&euro;5.5k</span></td>
                  <td><span className="ra-val">50<span className="ra-unit">Hz</span></span></td>
                  <td>
                    <div className="ra-buy-links">
                      <a className="ra-buy-link" href="https://www.trossenrobotics.com/viperx-300" target="_blank" rel="noopener noreferrer">US</a>
                      <a className="ra-buy-link" href="https://www.mybotshop.de/Interbotix-ViperX_1" target="_blank" rel="noopener noreferrer">EU</a>
                    </div>
                  </td>
                  <td>
                    <span className="ra-pill ra-pill-red">Not production-viable</span>
                    <span className="ra-note">ALOHA-native &bull; Great for cheap bimanual data &bull; Hobby servos = backlash, limited torque &bull; No safety certs &bull; No IP rating</span>
                    <div className="ra-rating-bar">
                      <div className="ra-rating-track"><div className="ra-rating-fill ra-fill-low" style={{ width: "10%" }}></div></div>
                      <span style={{ fontSize: "0.7rem", color: "var(--text-tertiary)" }}>10 / 100</span>
                    </div>
                  </td>
                </tr>

                <tr>
                  <td>
                    <span className="ra-tier-label ra-tier-hobby">Data collection</span>
                    <span className="ra-arm-name">ARX X5 / L5</span>
                    <span className="ra-arm-maker">ARX Technology &bull; China</span>
                    <span className="ra-arm-configs">bimanual &middot; mobile</span>
                  </td>
                  <td><span className="ra-val">1.5<span className="ra-unit">kg</span></span></td>
                  <td><span className="ra-val">620<span className="ra-unit">mm</span></span></td>
                  <td><span className="ra-val">6</span></td>
                  <td><span className="ra-val">~0.5&ndash;1<span className="ra-unit">mm</span></span><span className="ra-note">Planetary gears, better than servos</span></td>
                  <td><span className="ra-val">$2&ndash;4k</span><span className="ra-note">Quote-based</span></td>
                  <td><span className="ra-val">&mdash;</span><span className="ra-note">Contact mfr.</span></td>
                  <td><span className="ra-val">500<span className="ra-unit">Hz</span></span></td>
                  <td>
                    <div className="ra-buy-links">
                      <a className="ra-buy-link" href="https://arx-x.com/" target="_blank" rel="noopener noreferrer">Direct</a>
                    </div>
                  </td>
                  <td>
                    <span className="ra-pill ra-pill-red">Not production-viable</span>
                    <span className="ra-note">3.4 kg arm weight &bull; Planetary gears &gt; Dynamixel but &lt; harmonic &bull; Growing ALOHA/LeRobot ecosystem &bull; No safety certs &bull; No Western reseller</span>
                    <div className="ra-rating-bar">
                      <div className="ra-rating-track"><div className="ra-rating-fill ra-fill-low" style={{ width: "15%" }}></div></div>
                      <span style={{ fontSize: "0.7rem", color: "var(--text-tertiary)" }}>15 / 100</span>
                    </div>
                  </td>
                </tr>

                <tr>
                  <td>
                    <span className="ra-tier-label ra-tier-hobby">Data collection</span>
                    <span className="ra-arm-name">AgileX PiPER</span>
                    <span className="ra-arm-maker">AgileX Robotics &bull; China</span>
                    <span className="ra-arm-configs">bimanual</span>
                  </td>
                  <td><span className="ra-val">1.5<span className="ra-unit">kg</span></span></td>
                  <td><span className="ra-val">626<span className="ra-unit">mm</span></span></td>
                  <td><span className="ra-val">6</span></td>
                  <td><span className="ra-val">~0.1<span className="ra-unit">mm</span></span></td>
                  <td><span className="ra-val">$2.5k</span></td>
                  <td><span className="ra-val">&euro;2.8&ndash;3.7k</span></td>
                  <td><span className="ra-val">200<span className="ra-unit">Hz</span></span></td>
                  <td>
                    <div className="ra-buy-links">
                      <a className="ra-buy-link" href="https://global.agilex.ai/products/piper" target="_blank" rel="noopener noreferrer">Global</a>
                      <a className="ra-buy-link" href="https://autodiscovery.eu/en/products/piper" target="_blank" rel="noopener noreferrer">EU</a>
                    </div>
                  </td>
                  <td>
                    <span className="ra-pill ra-pill-red">Not production-viable</span>
                    <span className="ra-note">4.2 kg arm weight &bull; ROS2-native &bull; Good for mobile robot integration &bull; Widest EU reseller availability in class &bull; No safety certs &bull; No IP rating</span>
                    <div className="ra-rating-bar">
                      <div className="ra-rating-track"><div className="ra-rating-fill ra-fill-low" style={{ width: "12%" }}></div></div>
                      <span style={{ fontSize: "0.7rem", color: "var(--text-tertiary)" }}>12 / 100</span>
                    </div>
                  </td>
                </tr>
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
