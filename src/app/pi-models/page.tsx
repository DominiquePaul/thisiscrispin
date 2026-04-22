"use client";

import React from "react";

/* ── types ────────────────────────────────────────────────────────── */
type ModelKey = "pi0" | "pi05" | "pi06" | "piStar06" | "pi07";

interface Model {
  key: ModelKey;
  name: string;
  display: React.ReactNode;
  year: string;
  tagline: string;
  size: React.ReactNode;
  keyIdeas: React.ReactNode;
  contributions: React.ReactNode;
  results: React.ReactNode;
  diff: React.ReactNode;
  appendix: React.ReactNode;
}

/* ── model data ───────────────────────────────────────────────────── */
const MODELS: Model[] = [
  {
    key: "pi0",
    name: "pi0",
    display: <>π<sub>0</sub></>,
    year: "2024",
    tagline: "Foundation paper",
    size: (
      <>
        <strong>3.3B</strong>: PaliGemma 3B (SigLIP 400M + Gemma 2B) + 300M action expert
      </>
    ),
    keyIdeas: (
      <>
        VLM + separate action expert MoE branch; <strong>conditional flow matching</strong> for continuous action chunks (H=50, 10 integration steps, 50&nbsp;Hz); cross-embodiment pre-training
      </>
    ),
    contributions: (
      <>
        First flow-matching VLA with high-frequency chunks; pre-training/post-training recipe analogous to LLMs; ~10,000 hours — largest robot experiment at the time
      </>
    ),
    results: (
      <>
        Beat OpenVLA/Octo by large margins on shirt folding, bussing, bagging. Fine-tuning needed for laundry/boxes.
        <br />
        <em>Shortcomings:</em> not all tasks work reliably, data composition unclear, positive transfer to navigation/locomotion unexplored, language following relies on sub-task decomposition.
      </>
    ),
    diff: <>Foundation paper.</>,
    appendix: (
      <>
        Blockwise causal mask with 3 blocks ([images+text], [state], [noisy actions]). Action expert: width=1024, mlp_dim=4096. Beta(1.5,1) timestep with s=0.999 (up to 1,000 integration steps). <strong>Temporal ensembling was tried and hurt performance</strong> — chunks executed open-loop. 73&nbsp;ms onboard / 86&nbsp;ms off-board on RTX&nbsp;4090.
      </>
    ),
  },
  {
    key: "pi05",
    name: "pi0.5",
    display: <>π<sub>0.5</sub></>,
    year: "2025",
    tagline: "Generalize to new homes",
    size: (
      <>
        SigLIP 400M + Gemma 2.6B + 300M action expert. Two-stage: pre-train 280k steps (discrete only) → post-train 80k steps (adds flow matching).
      </>
    ),
    keyIdeas: (
      <>
        <strong>Heterogeneous co-training</strong>: mobile (400h, only 2.4–3.4%), non-mobile diverse env (ME), lab cross-embod (CE), high-level subtask (HL), verbal instructions (VI), web data (WD). <strong>Hierarchical inference in one unified model</strong>. <strong>Hybrid training</strong>: FAST discrete tokens in pre-training, flow matching in post-training.
      </>
    ),
    contributions: (
      <>
        First end-to-end system doing 10–15&nbsp;min dexterous tasks <strong>in entirely new homes</strong>. Co-training recipe — each ablation hurts. 104-location model matches one trained directly on test homes.
      </>
    ),
    results: (
      <>
        Strong on dishes-in-sink, items-in-drawer, laundry, make-bed in 3 real unseen homes.
        <br />
        <em>Shortcomings:</em> persistent challenges with unfamiliar affordances (weird handles, hard-to-open cabinets), partial observability (arm occluding spill), high-level inference loops (open/close drawer repeatedly), only simple prompts, modest context window.
      </>
    ),
    diff: (
      <>
        Hierarchical inference <strong>in the same model</strong> (π<sub>0</sub> used external VLM). Introduced FAST + hybrid training (π<sub>0</sub> was pure flow matching). Mobile-manipulation focus. Web co-training. Verbal instruction demos as novel supervision modality.
      </>
    ),
    appendix: (
      <>
        Action expert tokens do NOT attend to FAST tokens (avoids info leakage between two action representations). Adaptive RMSNorm for τ injection (vs. input fusion in π<sub>0</sub>). α=10.0 post-training. Image aug: crop 0.95×, rotate ±5°, color jitter.
      </>
    ),
  },
  {
    key: "pi06",
    name: "pi0.6",
    display: <>π<sub>0.6</sub></>,
    year: "Nov 2025",
    tagline: "Specialist-level out of the box",
    size: (
      <>
        SigLIP 400M + <strong>Gemma 3 4B</strong> + <strong>860M action expert</strong> (same depth as backbone).
      </>
    ),
    keyIdeas: (
      <>
        Keep π<sub>0.5</sub> hierarchy. Bigger backbone + bigger action expert. Add <strong>metadata conditioning</strong> in prompt. Full <strong>Knowledge Insulation (KI)</strong> training: VLM predicts FAST tokens, action expert predicts continuous actions, <strong>stop-gradient prevents action-expert gradients flowing into VLM</strong>. Up to 4 images at 448×448.
      </>
    ),
    contributions: (
      <>
        Specialist-level out-of-box performance <strong>without task-specific fine-tuning</strong>. Folds laundry reliably + fully assembles boxes 20% out of box (previously needed fine-tuning for non-zero success). ~2× throughput vs π<sub>0.5</sub>. Base model for π*<sub>0.6</sub>. 63&nbsp;ms/chunk on single H100.
      </>
    ),
    results: (
      <>
        Big gains on shirt/laundry folding, box assembly, table bussing, mobile tasks, generalization benchmarks.
        <br />
        <em>Shortcomings:</em> still relies on fine-tuning for some specialists; model card doesn&apos;t deeply analyze failure modes.
      </>
    ),
    diff: (
      <>
        Gemma 2.6B → 4B. Action expert 300M → 860M (~3×). Metadata conditioning. Full KI recipe.
      </>
    ),
    appendix: (
      <>
        No formal appendix — 4-page card. Image tokens bidirectional, text tokens now causal.
      </>
    ),
  },
  {
    key: "piStar06",
    name: "pi*0.6",
    display: <>π*<sub>0.6</sub></>,
    year: "Nov 2025",
    tagline: "RECAP — RL on flow-matching VLAs",
    size: (
      <>
        Same base as π<sub>0.6</sub> + separate <strong>670M distributional value function</strong> (Gemma 3-based, 201 value bins).
      </>
    ),
    keyIdeas: (
      <>
        <strong>RECAP</strong> = RL with Experience and Corrections via Advantage-conditioned Policies.
        <br />
        (1) Train multi-task value function via cross-entropy on discretized MC returns.
        <br />
        (2) Add binarized advantage indicator I<sub>t</sub> to prompt (CFGRL-style — avoids PPO&apos;s instability with flow heads).
        <br />
        (3) Per-task threshold ε<sub>ℓ</sub> at ~30–40th percentile.
        <br />
        (4) Offline RL pretrain → SFT → iterate: autonomous rollouts + HG-DAgger interventions → retrain value + policy.
        <br />
        (5) Sparse reward: −1 per step, −C<sub>fail</sub> on failure, 0 on success; value = expected negative steps-to-completion.
      </>
    ),
    contributions: (
      <>
        First general RL recipe that scales to large flow-matching VLAs via advantage conditioning. Handles good + bad data together. <strong>&gt;2× throughput, ~2× failure reduction</strong> on hardest tasks. 13&nbsp;h continuous espresso, factory-grade box assembly. Beats AWR and PPO baselines.
      </>
    ),
    results: (
      <>
        Espresso, box assembly, laundry all reach 90%+.
        <br />
        <em>Shortcomings:</em> not fully autonomous — needs human reward labels, interventions, resets. Naive exploration (relies on policy stochasticity + interventions). Iterated offline RL, not concurrent online. Corrections alone don&apos;t fix overall speed or subtle behaviors. Value function is MC on-policy — could benefit from off-policy Q-learning.
      </>
    ),
    diff: (
      <>
        Adds advantage indicator + value function + full RL training loop. Distills RL specialist behaviors into one generalist via metadata + autonomous data.
      </>
    ),
    appendix: (
      <>
        Advantage dropout 30% for test-time CFG. β ∈ [1.5, 2.5] — high β pushes actions to support boundaries (aggressive). PPO baseline needed SPO-style constraint with η=0.01 for stability. Detailed flow-matching ELBO decomposition (AR + diffusion). Laundry used only autonomous data; box assembly used 600 auto + 360 correction eps/iter on 3 robots.
      </>
    ),
  },
  {
    key: "pi07",
    name: "pi0.7",
    display: <>π<sub>0.7</sub></>,
    year: "2026",
    tagline: "Compositional generalization",
    size: (
      <>
        ~5B: Gemma 3 4B + 400M SigLIP + <strong>860M action expert</strong> + <strong>MEM video history encoder</strong> (6 history frames @ 1s stride, compressed to single-frame token count). Up to 4 cameras + up to 3 subgoal images @ 448×448. Separate <strong>14B BAGEL-initialized world model</strong> for subgoal generation.
      </>
    ),
    keyIdeas: (
      <>
        <strong>Diverse prompt conditioning</strong>: detailed language + subtask ℓ̂ + multi-view subgoal images + metadata (speed/quality/mistake flag) + control mode. Each component randomly dropped during training → flexible inference.
        <br />
        <strong>Language coaching</strong>: humans give step-by-step instructions to teach new long-horizon tasks without action data, then distill into a high-level policy.
        <br />
        Train on much more diverse data including <strong>suboptimal autonomous rollouts (incl. π*<sub>0.6</sub> RL training data)</strong>, failures, egocentric human video. Subgoals refreshed on subtask change or every 4s.
      </>
    ),
    contributions: (
      <>
        Strong signs of <strong>compositional generalization</strong> — the &ldquo;grand challenge&rdquo;.
        <br />
        (1) Out-of-box specialist-level dexterity matching π*<sub>0.6</sub> RL specialists, no RL or fine-tuning needed.
        <br />
        (2) <strong>Zero-shot cross-embodiment transfer</strong> — folds t-shirts on bimanual UR5e (never trained for this), matching expert teleoperators (85.6%/80% vs 90.9%/80.6%).
        <br />
        (3) Discovers new manipulation strategies suited to target embodiment (vertical grasps on UR5e).
        <br />
        (4) New short-horizon tasks out of box.
        <br />
        (5) New long-horizon tasks via coaching → autonomous distillation.
        <br />
        (6) Breaks dataset biases (reverse bussing).
      </>
    ),
    results: (
      <>
        Seen tasks often &gt;90%; unseen tasks / novel embodiment combos 60–80%. Mixed-quality data scaling: <strong>without metadata, more/noisier data hurts; with metadata it keeps improving</strong>.
        <br />
        <em>Shortcomings:</em> unseen success rate still well below in-dist. Very hard to define what&apos;s &ldquo;truly unseen&rdquo; in such a diverse dataset. World model inference is expensive (1.25&nbsp;s/subgoal with 4×H100 + 8-bit + SageAttention). Only manipulation, no navigation/locomotion claims.
      </>
    ),
    diff: (
      <>
        Multi-modal prompt (language + subgoals + metadata + control mode). MEM memory encoder. Separate BAGEL-based world model. Egocentric human video + suboptimal autonomous data + π*<sub>0.6</sub> RL rollouts in training. Training-time RTC for latency tolerance. Emphasis on steerability and emergent generalization rather than pure throughput/robustness.
      </>
    ),
    appendix: (
      <>
        Subgoal sampling: 25% of examples have subgoal images; within those, 25% use end-of-segment, 75% sample 0–4s ahead uniformly. Subtask instruction dropped 30% when image is present. Metadata dropped 15% entirely; each component +5% individually. State uses <strong>linear projection, not text tokenization</strong> (change from π<sub>0.6</sub>). Minimal variant: 38&nbsp;ms/chunk on single H100; 127&nbsp;ms with MEM + subgoal. World model: 4×H100 tensor-parallel, 8-bit matmuls, SageAttention → 1.25&nbsp;s per subgoal, 25 denoising steps. <strong>EE control showed no clear advantage over joint control</strong> in cross-embodiment experiments (contradicts some prior intuitions).
      </>
    ),
  },
];

/* ── row definitions ──────────────────────────────────────────────── */
const ROWS: { label: string; field: keyof Pick<Model, "size" | "keyIdeas" | "contributions" | "results" | "diff" | "appendix"> }[] = [
  { label: "Size",                   field: "size" },
  { label: "Key ideas",              field: "keyIdeas" },
  { label: "Core contributions",     field: "contributions" },
  { label: "Results & shortcomings", field: "results" },
  { label: "Diff vs prev",           field: "diff" },
  { label: "Appendix",               field: "appendix" },
];

/* ── component ────────────────────────────────────────────────────── */
export default function PiModelsPage() {
  return (
    <>
      <style>{`
        .pm-root {
          --bg: #FAFAF8;
          --surface: #FFFFFF;
          --border: #E8E6E1;
          --border-strong: #D8D6D1;
          --text-primary: #1A1A18;
          --text-secondary: #4A4944;
          --text-tertiary: #9C9A93;
          --accent: #4A5899;
          --accent-bg: #ECEEF6;
          font-family: 'DM Sans', -apple-system, sans-serif;
          background: var(--bg);
          color: var(--text-primary);
          line-height: 1.55;
          padding: 2rem 1.5rem;
          min-height: 100vh;
        }

        .pm-container { max-width: 1400px; margin: 0 auto; }

        .pm-header {
          margin-bottom: 2rem;
          padding-bottom: 1.5rem;
          border-bottom: 1px solid var(--border);
        }
        .pm-header h1 {
          font-size: 1.5rem;
          font-weight: 700;
          letter-spacing: -0.02em;
        }
        .pm-header p {
          font-size: 0.85rem;
          color: var(--text-secondary);
          margin-top: 0.35rem;
          max-width: 780px;
        }

        .pm-table-wrapper {
          overflow-x: auto;
          -webkit-overflow-scrolling: touch;
          border: 1px solid var(--border);
          border-radius: 10px;
          background: var(--surface);
        }

        .pm-table-wrapper table {
          border-collapse: collapse;
          font-size: 0.82rem;
          width: max-content;
          min-width: 100%;
        }

        .pm-table-wrapper thead th {
          text-align: left;
          padding: 0.95rem 1rem;
          font-weight: 600;
          border-bottom: 1px solid var(--border-strong);
          background: var(--bg);
          position: sticky;
          top: 0;
          z-index: 2;
          vertical-align: top;
          min-width: 280px;
          max-width: 340px;
        }

        .pm-table-wrapper thead th.pm-row-header {
          left: 0;
          z-index: 3;
          min-width: 170px;
          max-width: 170px;
          background: var(--bg);
          border-right: 1px solid var(--border-strong);
        }

        .pm-table-wrapper thead th:first-child { border-top-left-radius: 10px; }
        .pm-table-wrapper thead th:last-child  { border-top-right-radius: 10px; }

        .pm-model-name {
          font-family: 'JetBrains Mono', monospace;
          font-size: 1.05rem;
          font-weight: 500;
          color: var(--text-primary);
          letter-spacing: -0.01em;
        }
        .pm-model-year {
          display: inline-block;
          font-size: 0.62rem;
          font-weight: 600;
          letter-spacing: 0.08em;
          text-transform: uppercase;
          padding: 2px 7px;
          border-radius: 4px;
          background: var(--accent-bg);
          color: var(--accent);
          margin-left: 0.5rem;
          vertical-align: middle;
        }
        .pm-model-tagline {
          font-size: 0.72rem;
          font-weight: 400;
          color: var(--text-secondary);
          margin-top: 4px;
          letter-spacing: normal;
          text-transform: none;
          line-height: 1.4;
        }

        .pm-table-wrapper tbody td {
          padding: 0.95rem 1rem;
          border-bottom: 1px solid #F2F1EE;
          border-right: 1px solid #F2F1EE;
          vertical-align: top;
          font-size: 0.8rem;
          line-height: 1.55;
          color: var(--text-secondary);
          min-width: 280px;
          max-width: 340px;
        }
        .pm-table-wrapper tbody td:last-child { border-right: none; }
        .pm-table-wrapper tbody tr:last-child td { border-bottom: none; }

        .pm-table-wrapper tbody td strong {
          color: var(--text-primary);
          font-weight: 600;
        }
        .pm-table-wrapper tbody td em {
          color: var(--text-primary);
          font-style: normal;
          font-weight: 500;
        }

        .pm-row-label {
          position: sticky;
          left: 0;
          z-index: 1;
          background: var(--bg);
          font-size: 0.68rem;
          font-weight: 600;
          letter-spacing: 0.08em;
          text-transform: uppercase;
          color: var(--text-tertiary);
          min-width: 170px !important;
          max-width: 170px !important;
          border-right: 1px solid var(--border-strong) !important;
          padding-top: 1rem !important;
        }

        .pm-synthesis {
          margin-top: 2rem;
          padding: 1.5rem 1.75rem;
          background: var(--surface);
          border: 1px solid var(--border);
          border-radius: 10px;
        }
        .pm-synthesis h2 {
          font-size: 0.7rem;
          font-weight: 600;
          letter-spacing: 0.08em;
          text-transform: uppercase;
          color: var(--text-tertiary);
          margin-bottom: 0.85rem;
        }
        .pm-synthesis p {
          font-size: 0.85rem;
          color: var(--text-secondary);
          line-height: 1.65;
          margin-bottom: 0.85rem;
        }
        .pm-synthesis p:last-child { margin-bottom: 0; }
        .pm-synthesis strong { color: var(--text-primary); font-weight: 600; }

        .pm-scroll-hint {
          margin-top: 0.75rem;
          font-size: 0.72rem;
          color: var(--text-tertiary);
          text-align: right;
        }

        @media (max-width: 640px) {
          .pm-root { padding: 1rem 0.75rem; }
          .pm-header h1 { font-size: 1.25rem; }
          .pm-table-wrapper thead th,
          .pm-table-wrapper tbody td {
            min-width: 240px;
            max-width: 260px;
          }
          .pm-row-label { min-width: 130px !important; max-width: 130px !important; }
        }
      `}</style>

      <link
        href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500;600&display=swap"
        rel="stylesheet"
      />

      <div className="pm-root">
        <div className="pm-container">
          <header className="pm-header">
            <h1>The π model family</h1>
            <p>
              Physical Intelligence&rsquo;s VLA lineage, 2024–2026. Each generation compared across architecture, training recipe, contributions, and limitations. Scroll horizontally to move through the timeline.
            </p>
          </header>

          <div className="pm-table-wrapper">
            <table>
              <thead>
                <tr>
                  <th className="pm-row-header" />
                  {MODELS.map((m) => (
                    <th key={m.key}>
                      <div>
                        <span className="pm-model-name">{m.display}</span>
                        <span className="pm-model-year">{m.year}</span>
                      </div>
                      <div className="pm-model-tagline">{m.tagline}</div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {ROWS.map((row) => (
                  <tr key={row.field}>
                    <td className="pm-row-label">{row.label}</td>
                    {MODELS.map((m) => (
                      <td key={m.key}>{m[row.field]}</td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="pm-scroll-hint">← scroll horizontally to compare →</div>

          <div className="pm-synthesis">
            <h2>Quick synthesis</h2>
            <p>
              <strong>Backbone:</strong> Gemma 2B → 2.6B → 4B (and stabilizes at 4B). <strong>Action expert:</strong> 300M → 300M → <strong>860M</strong> (big jump at π<sub>0.6</sub>).
            </p>
            <p>
              <strong>Training recipe:</strong> pure flow matching (π<sub>0</sub>) → hybrid FAST + flow, two-stage (π<sub>0.5</sub>) → <strong>Knowledge Insulation with stop-gradient</strong> (π<sub>0.6</sub>+). KI is the structural backbone for everything after.
            </p>
            <p>
              <strong>Supervision evolution:</strong> demos-only → + hierarchy/verbal/web → + metadata → + RL reward + advantage conditioning + interventions → + subgoal images + diverse &ldquo;how&rdquo; metadata + autonomous/failure data + egocentric human video.
            </p>
            <p>
              <strong>Philosophy shift per generation:</strong> &ldquo;can we generalize to new homes?&rdquo; → &ldquo;can we get specialist-level out-of-box performance?&rdquo; → &ldquo;can VLAs learn from experience via RL?&rdquo; → &ldquo;can we get compositional generalization via rich prompting?&rdquo;
            </p>
          </div>
        </div>
      </div>
    </>
  );
}
