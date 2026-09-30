import React, { useEffect, useRef, useState } from "react";
import "@fontsource-variable/dm-sans";
import "@fontsource-variable/manrope";
import { createRoot } from "react-dom/client";
import {
  ArrowDown,
  ArrowLeft,
  ArrowRight,
  ArrowUpRight,
  Check,
  CircleAlert,
  Code2,
  ImagePlus,
  Leaf,
  LoaderCircle,
  LockKeyhole,
  Plus,
  ScanLine,
  Sprout,
  Sun,
  Upload,
  X,
} from "lucide-react";
import "./style.css";

const REPO = "https://github.com/ranaumarbilal31/leaflens";
type Prediction = {
  class_id: number;
  label: string;
  plant: string;
  condition: string;
  confidence: number;
};
type Category = { plant: string; condition: string };
const samples = [
  { file: "1.png", name: "Sample 1" },
  { file: "2.png", name: "Sample 2" },
  { file: "3.png", name: "Sample 3" },
];

function Mark() {
  return (
    <span className="brand-mark">
      <Leaf size={23} strokeWidth={1.7} />
    </span>
  );
}

function Header({ about }: { about: boolean }) {
  return (
    <header className="site-header wrap">
      <a className="brand" href="/" aria-label="LeafLens home">
        <Mark />
        LeafLens<span className="brand-period">.</span>
      </a>
      <nav aria-label="Main navigation">
        <a
          className={!about ? "nav-active" : ""}
          href="/"
          aria-current={!about ? "page" : undefined}
        >
          Leaf checker
        </a>
        <a
          className={about ? "nav-active" : ""}
          href="/how-it-works"
          aria-current={about ? "page" : undefined}
        >
          How it works
        </a>
        <a
          className="repo-link"
          href={REPO}
          target="_blank"
          rel="noreferrer"
          aria-label="View source on GitHub"
        >
          <Code2 size={17} />
          <span>View source</span>
          <ArrowUpRight size={14} />
        </a>
      </nav>
    </header>
  );
}

function Botanical() {
  return (
    <div className="botanical" aria-hidden="true">
      <div className="botanical-orbit orbit-one" />
      <div className="botanical-orbit orbit-two" />
      <span className="botanical-caption">A closer look at your garden</span>
      <svg className="leaf-art" viewBox="0 0 540 400" fill="none">
        <defs>
          <linearGradient
            id="leaf-one"
            x1="169"
            y1="291"
            x2="335"
            y2="29"
            gradientUnits="userSpaceOnUse"
          >
            <stop stopColor="#1c4736" />
            <stop offset=".5" stopColor="#588452" />
            <stop offset="1" stopColor="#b3be70" />
          </linearGradient>
          <linearGradient
            id="leaf-two"
            x1="256"
            y1="349"
            x2="387"
            y2="188"
            gradientUnits="userSpaceOnUse"
          >
            <stop stopColor="#234c38" />
            <stop offset="1" stopColor="#8faa68" />
          </linearGradient>
          <linearGradient
            id="leaf-three"
            x1="195"
            y1="357"
            x2="91"
            y2="162"
            gradientUnits="userSpaceOnUse"
          >
            <stop stopColor="#35563c" />
            <stop offset="1" stopColor="#9aad72" />
          </linearGradient>
          <filter id="shadow">
            <feDropShadow
              dx="8"
              dy="14"
              stdDeviation="10"
              floodColor="#233e29"
              floodOpacity=".13"
            />
          </filter>
        </defs>
        <ellipse
          cx="277"
          cy="362"
          rx="99"
          ry="11"
          fill="#3c6233"
          opacity=".08"
        />
        <g filter="url(#shadow)">
          <path
            d="M220 362C234 291 260 204 322 84"
            stroke="#536d3d"
            strokeWidth="5"
            strokeLinecap="round"
          />
          <path
            d="M235 294C167 255 165 182 208 130C244 86 305 90 352 37C374 117 351 221 291 272C273 287 254 293 235 294Z"
            fill="url(#leaf-one)"
          />
          <path
            d="M234 295C254 224 296 128 350 41"
            stroke="#c5cf91"
            strokeOpacity=".7"
            strokeWidth="2"
          />
          <path
            d="M248 253 201 211M260 223 193 174M274 193 211 139M291 157 248 106M309 121 287 89M248 251 302 245M262 222 334 203M277 189 353 157M294 153 361 112M311 119 360 80"
            stroke="#cbd49b"
            strokeOpacity=".35"
            strokeWidth="1.25"
          />
          <path
            d="M228 330C264 249 331 246 406 216C393 301 324 349 228 330Z"
            fill="url(#leaf-two)"
          />
          <path
            d="M226 331C294 307 350 276 404 219M275 310 281 279M305 295 324 260M340 274 366 237M277 310 313 330M310 291 349 310M345 269 376 283"
            stroke="#c1d29b"
            strokeOpacity=".45"
            strokeWidth="1.4"
          />
          <path
            d="M227 343C140 346 100 287 96 200C167 230 220 252 227 343Z"
            fill="url(#leaf-three)"
          />
          <path
            d="M227 343C183 296 135 253 97 202M192 307 197 270M164 279 163 249M137 251 134 224M192 307 152 309M162 278 123 277M136 251 109 242"
            stroke="#cad2a2"
            strokeOpacity=".4"
            strokeWidth="1.4"
          />
        </g>
        <path
          d="M156 114h-18v18M367 114h18v18M138 272v18h18M385 272v18h-18"
          stroke="#698568"
          strokeWidth="1.5"
          opacity=".7"
        />
        <circle cx="291" cy="180" r="5" fill="#edf1d9" />
        <circle cx="291" cy="180" r="13" stroke="#edf1d9" strokeOpacity=".6" />
      </svg>
      <div className="leaf-note">
        <span className="note-icon">
          <ScanLine size={20} />
        </span>
        <span>
          Every leaf tells a story.<small>Let’s take a closer look.</small>
        </span>
      </div>
      <span className="art-index">01 / OBSERVE & UNDERSTAND</span>
    </div>
  );
}

function Checker() {
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState("");
  const [result, setResult] = useState<Prediction | null>(null);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [dragging, setDragging] = useState(false);
  const input = useRef<HTMLInputElement>(null);
  const request = useRef<AbortController | null>(null);
  const version = useRef(0);
  const resultHeading = useRef<HTMLHeadingElement>(null);

  useEffect(() => {
    if (!file) {
      setPreview("");
      return;
    }
    const url = URL.createObjectURL(file);
    setPreview(url);
    return () => URL.revokeObjectURL(url);
  }, [file]);
  useEffect(() => () => request.current?.abort(), []);
  useEffect(() => {
    if (result) resultHeading.current?.focus();
  }, [result]);

  function reset() {
    version.current++;
    request.current?.abort();
    setBusy(false);
    setResult(null);
    setError("");
    setFile(null);
    if (input.current) input.current.value = "";
  }
  function selectFile(selected?: File) {
    reset();
    if (!selected) return;
    if (!["image/jpeg", "image/png"].includes(selected.type)) {
      setError("Please choose a JPEG or PNG photo.");
      return;
    }
    if (selected.size > 10 * 1024 * 1024) {
      setError("This photo is too large. Choose one under 10 MB.");
      return;
    }
    setFile(selected);
  }
  async function selectSample(sample: (typeof samples)[number]) {
    reset();
    const selectedVersion = version.current;
    try {
      const response = await fetch(`/samples/${sample.file}`);
      if (!response.ok) throw new Error();
      const blob = await response.blob();
      if (version.current === selectedVersion)
        setFile(new File([blob], `${sample.name}.png`, { type: "image/png" }));
    } catch {
      if (version.current === selectedVersion)
        setError("This sample could not load. Try uploading your own photo.");
    }
  }
  async function checkLeaf() {
    if (!file || busy) return;
    const selectedVersion = version.current;
    const controller = new AbortController();
    request.current = controller;
    setBusy(true);
    setError("");
    setResult(null);
    const timeout = window.setTimeout(() => controller.abort(), 60_000);
    try {
      const data = new FormData();
      data.append("image", file);
      const response = await fetch("/api/predict", {
        method: "POST",
        body: data,
        signal: controller.signal,
      });
      const payload = await response.json().catch(() => null);
      if (!response.ok)
        throw new Error(
          typeof payload?.detail === "string"
            ? payload.detail
            : "The leaf checker is waking up or temporarily unavailable. Please try again shortly.",
        );
      if (version.current === selectedVersion) setResult(payload);
    } catch (err) {
      if (version.current === selectedVersion)
        setError(
          controller.signal.aborted
            ? "This check took too long. The demo may be waking up; please try again."
            : err instanceof Error
              ? err.message
              : "We could not connect. Please try again.",
        );
    } finally {
      window.clearTimeout(timeout);
      if (version.current === selectedVersion) setBusy(false);
    }
  }

  return (
    <section
      id="check"
      className="checker-section wrap"
      aria-labelledby="checker-heading"
    >
      <div className="section-intro">
        <div>
          <span className="eyebrow">YOUR GARDEN, A LITTLE CLEARER</span>
          <h2 id="checker-heading">Start with a single leaf.</h2>
        </div>
        <span className="section-aside">
          <LockKeyhole size={15} /> Your photos aren’t stored
        </span>
      </div>
      <div className="checker-grid">
        <div className="upload-panel">
          <div className="panel-heading">
            <span className="step-index">01</span>
            <h3>Your leaf photo</h3>
            <span className="small-tag">JPG / PNG</span>
          </div>
          <input
            ref={input}
            className="file-input"
            type="file"
            accept="image/jpeg,image/png"
            aria-label="Choose a leaf photo"
            onChange={(event) => selectFile(event.target.files?.[0])}
          />
          {file ? (
            <div className="photo-preview">
              <img
                src={preview}
                alt="Your selected leaf"
                onError={() => {
                  setError(
                    "We could not preview this photo. Please choose another JPEG or PNG.",
                  );
                  setFile(null);
                }}
              />
              <button
                className="remove-photo"
                onClick={reset}
                aria-label="Remove photo"
              >
                <X size={18} />
              </button>
              <span className="photo-name">{file.name}</span>
            </div>
          ) : (
            <button
              className={`drop-zone ${dragging ? "is-dragging" : ""}`}
              onClick={() => input.current?.click()}
              onDragOver={(event) => {
                event.preventDefault();
                setDragging(true);
              }}
              onDragLeave={() => setDragging(false)}
              onDrop={(event) => {
                event.preventDefault();
                setDragging(false);
                selectFile(event.dataTransfer.files[0]);
              }}
            >
              <span className="upload-icon">
                <ImagePlus size={28} strokeWidth={1.5} />
                <span>
                  <Plus size={11} />
                </span>
              </span>
              <strong>Drop your leaf photo here</strong>
              <span>
                or <b>browse files</b> to choose one
              </span>
              <small>JPEG or PNG · Up to 10 MB / 20 MP</small>
            </button>
          )}
          <div className="samples">
            <span>Just exploring? Try a sample</span>
            <div className="sample-buttons">
              {samples.map((sample) => (
                <button
                  key={sample.file}
                  onClick={() => selectSample(sample)}
                  aria-label={`Try ${sample.name.toLowerCase()}`}
                  title={sample.name}
                >
                  <img src={`/samples/${sample.file}`} alt="" />
                  <span>{sample.name}</span>
                </button>
              ))}
            </div>
          </div>
          <button
            className="primary check-button"
            disabled={!file || busy}
            onClick={checkLeaf}
          >
            {busy ? (
              <>
                <LoaderCircle size={18} className="spin" /> Checking your leaf…
              </>
            ) : (
              <>
                <ScanLine size={18} />
                {result ? "Check again" : "Check my leaf"}
                <ArrowRight size={18} />
              </>
            )}
          </button>
          {error && (
            <div className="error-message" role="alert">
              <CircleAlert size={18} />
              <span>{error}</span>
            </div>
          )}
        </div>
        <div
          className={`result-panel ${result ? "has-result" : ""}`}
          aria-busy={busy}
        >
          <div className="panel-heading">
            <span className="step-index">02</span>
            <h3>Your leaf insights</h3>
            <span className={`status-dot ${result ? "complete" : ""}`}>
              {busy ? "Checking" : result ? "Ready" : "Awaiting photo"}
            </span>
          </div>
          {busy ? (
            <div className="result-empty" role="status">
              <span className="empty-symbol loading-symbol">
                <ScanLine size={37} strokeWidth={1} />
              </span>
              <h3>Taking a closer look.</h3>
              <p>
                Checking your photo for patterns in the leaf.
                <br />
                This usually takes a few seconds.
              </p>
              <div className="loading-track">
                <span />
              </div>
            </div>
          ) : result ? (
            <div className="result-content">
              <div className="result-kicker">
                <Leaf size={16} /> LIKELY MATCH
              </div>
              <h3 ref={resultHeading} tabIndex={-1} className="result-plant">
                {result.plant}
              </h3>
              <div
                className={`condition ${result.condition === "Healthy" ? "healthy" : ""}`}
              >
                {result.condition === "Healthy" ? (
                  <Check size={16} />
                ) : (
                  <CircleAlert size={16} />
                )}
                <span>
                  {result.condition === "Healthy"
                    ? "Appears healthy"
                    : result.condition}
                </span>
              </div>
              <div className="confidence">
                <div>
                  <span>Model confidence</span>
                  <strong>
                    {result.confidence.toFixed(1)}
                    <small>%</small>
                  </strong>
                </div>
                <meter
                  min="0"
                  max="100"
                  value={result.confidence}
                  aria-label="Model confidence"
                />
                <p>
                  How strongly the model matches this photo to this category—not
                  the certainty of a diagnosis.
                </p>
              </div>
              <div className="result-note">
                <Sprout size={21} />
                <div>
                  <strong>A useful starting point.</strong>
                  <p>
                    {result.condition === "Healthy"
                      ? "Keep observing your plant. A healthy-looking leaf doesn’t rule out other plant problems."
                      : "Compare this result with what you see on the plant. An experienced grower or local plant specialist can help confirm the cause."}
                  </p>
                </div>
              </div>
              <button className="text-button" onClick={reset}>
                Check another leaf <ArrowRight size={16} />
              </button>
            </div>
          ) : (
            <div className="result-empty">
              <span className="empty-symbol">
                <Sprout size={43} strokeWidth={1.1} />
              </span>
              <h3>
                A fresh perspective
                <br />
                on your plant.
              </h3>
              <p>
                Add a leaf photo and we’ll look for a match
                <br className="desktop-break" /> among supported plants and
                conditions.
              </p>
              <span className="empty-hint">
                <span />
                Your results will appear here
              </span>
            </div>
          )}
          <div className="result-footer">
            <CircleAlert size={14} />
            <span>A helpful first look, not a confirmed diagnosis.</span>
          </div>
        </div>
      </div>
      <div className="photo-tips">
        <span className="tips-label">
          <Sun size={17} /> A better photo, a better starting point
        </span>
        <span>
          <Check size={14} /> One leaf, in focus
        </span>
        <span>
          <Check size={14} /> Natural light
        </span>
        <span>
          <Check size={14} /> A simple background
        </span>
      </div>
    </section>
  );
}

function Home() {
  return (
    <>
      <section className="hero wrap">
        <div className="hero-copy">
          <span className="eyebrow">
            <span className="tiny-leaf" /> A LITTLE CARE GOES A LONG WAY
          </span>
          <h1>
            Get to know
            <br />
            your <em>leaves.</em>
          </h1>
          <p>
            Spotted something unusual? Take a closer look.
            <br className="desktop-break" /> A leaf photo is a simple place to
            start.
          </p>
          <a className="primary hero-cta" href="#check">
            Check a leaf <ArrowDown size={17} />
          </a>
          <span className="hero-footnote">Free to try. No sign-up needed.</span>
        </div>
        <Botanical />
      </section>
      <div className="benefit-strip wrap">
        <span>
          <Sprout size={18} />
          <strong>14</strong> supported plants
        </span>
        <span>
          <ScanLine size={18} />
          <strong>38</strong> leaf categories
        </span>
        <span>
          <LockKeyhole size={17} />
          Private by design
        </span>
        <a href="/how-it-works">
          Get to know LeafLens <ArrowUpRight size={15} />
        </a>
      </div>
      <Checker />
      <section className="garden-note wrap">
        <span className="note-number">A NOTE FROM LEAFLENS</span>
        <div>
          <h2>
            Made for curiosity.
            <br />
            <em>Rooted in care.</em>
          </h2>
          <p>
            LeafLens recognizes a limited set of common crop leaves and
            conditions. Real gardens are wonderfully varied—lighting,
            backgrounds, and unfamiliar plants can all affect a result.
          </p>
          <a className="text-button" href="/how-it-works">
            Explore what LeafLens can do <ArrowUpRight size={16} />
          </a>
        </div>
        <Leaf className="note-decoration" strokeWidth={0.65} />
      </section>
    </>
  );
}

function About() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loadError, setLoadError] = useState(false);
  useEffect(() => {
    fetch("/api/categories")
      .then((response) => {
        if (!response.ok) throw new Error();
        return response.json();
      })
      .then(setCategories)
      .catch(() => setLoadError(true));
  }, []);
  const plants = [...new Set(categories.map((category) => category.plant))];
  return (
    <main id="main" className="about wrap">
      <a className="text-button back-link" href="/">
        <ArrowLeft size={16} /> Back to leaf checker
      </a>
      <div className="about-hero">
        <span className="eyebrow">BEHIND THE LEAF</span>
        <h1>
          A closer look at
          <br />
          <em>how it works.</em>
        </h1>
        <p>
          A small tool for exploring plant health, built around an existing
          image-classification model. Here’s what happens to your photo—and what
          a result can tell you.
        </p>
      </div>
      <div className="process-grid">
        {[
          [
            "01",
            <Upload size={23} />,
            "You bring the leaf.",
            "Upload one clear JPEG or PNG. The server validates the file, corrects its orientation, and converts it to RGB at 256 × 256 pixels. Transparent backgrounds are composited onto white.",
          ],
          [
            "02",
            <ScanLine size={23} />,
            "We look for patterns.",
            "A ResNet9 model processes the image on a CPU. Pixel values are scaled from 0–255 to 0–1, using the same scaling as the 38-class reference notebook. No new training takes place.",
          ],
          [
            "03",
            <Sprout size={23} />,
            "You get a starting point.",
            "The highest-scoring category is shown with its softmax score. This score is not a calibrated probability that the plant has a disease. Your photo is processed in memory and is not saved.",
          ],
        ].map(([number, icon, title, text]) => (
          <article key={String(number)}>
            <div className="process-top">
              <span>{number}</span>
              {icon}
            </div>
            <h2>{title}</h2>
            <p>{text}</p>
          </article>
        ))}
      </div>
      <section className="about-section">
        <div>
          <span className="eyebrow">WHAT’S IN THE GARDEN</span>
          <h2>
            14 plants.
            <br />
            38 leaf categories.
          </h2>
          <p>
            Each category combines a plant with a condition or a healthy-leaf
            label. Coverage differs by plant.
          </p>
        </div>
        <div className="category-list">
          {loadError ? (
            <p role="alert">
              The category list couldn’t load. Please refresh to try again.
            </p>
          ) : !categories.length ? (
            <p role="status">Loading supported plants…</p>
          ) : (
            plants.map((plant) => (
              <details key={plant}>
                <summary>
                  {plant}
                  <span>
                    {
                      categories.filter((category) => category.plant === plant)
                        .length
                    }{" "}
                    categories <Plus size={15} />
                  </span>
                </summary>
                <ul>
                  {categories
                    .filter((category) => category.plant === plant)
                    .map((category) => (
                      <li key={category.condition}>{category.condition}</li>
                    ))}
                </ul>
              </details>
            ))
          )}
        </div>
      </section>
      <section className="limitations">
        <CircleAlert size={27} />
        <div>
          <h2>A result needs context.</h2>
          <p>
            The reference training data uses mostly isolated leaves under
            controlled conditions. Field photos, unusual lighting, several
            leaves, and busy backgrounds can reduce reliability. The model
            always chooses from its known categories; it cannot reliably reject
            unrelated images or identify every plant disease.
          </p>
          <p>
            Use LeafLens to explore possibilities. Confirm important plant-care
            decisions with a qualified local expert. No field accuracy or
            independent evaluation of this checkpoint is claimed.
          </p>
        </div>
      </section>
      <section className="about-section provenance">
        <div>
          <span className="eyebrow">BUILT WITH OPEN TOOLS</span>
          <h2>
            The roots
            <br />
            of LeafLens.
          </h2>
        </div>
        <div>
          <h3>Model & data provenance</h3>
          <p>
            The supplied checkpoint has 38 outputs and is compatible with the
            ResNet9 architecture in the reference{" "}
            <a
              href="https://www.kaggle.com/atharvaingle/plant-disease-classification-resnet-99-2"
              target="_blank"
              rel="noreferrer"
            >
              notebook by Atharva Ingle <ArrowUpRight size={13} />
            </a>
            . That notebook uses the augmented PlantVillage-derived dataset.
            Original dataset information is available from{" "}
            <a
              href="https://github.com/spMohanty/PlantVillage-Dataset"
              target="_blank"
              rel="noreferrer"
            >
              PlantVillage <ArrowUpRight size={13} />
            </a>
            .
          </p>
          <p>
            The exact training history of the supplied weights is not
            independently verified. A separate 14-class notebook in the original
            project does not describe the deployed checkpoint. Source
            attribution is retained; notebook accuracy figures are not presented
            as LeafLens performance.
          </p>
          <h3>The application</h3>
          <p>
            A React and TypeScript interface connects to a FastAPI service
            running PyTorch. The original model weights and category order are
            preserved. The app adds validated uploads, fixed-size preprocessing,
            accessible interaction states, and CPU inference with bounded
            concurrency.
          </p>
          <p>
            The demo runs on free hosting that may sleep when unused. Its first
            start can take longer. Uploaded photos are neither persisted nor
            used for training.
          </p>
          <a className="primary" href={REPO} target="_blank" rel="noreferrer">
            <Code2 size={17} /> Explore the source <ArrowUpRight size={16} />
          </a>
        </div>
      </section>
    </main>
  );
}

function App() {
  const about = window.location.pathname.replace(/\/$/, "") === "/how-it-works";
  return (
    <>
      <a className="skip-link" href="#main">
        Skip to content
      </a>
      <Header about={about} />
      {about ? (
        <About />
      ) : (
        <main id="main">
          <Home />
        </main>
      )}
      <footer className="site-footer wrap">
        <a className="brand" href="/">
          <Mark />
          LeafLens<span className="brand-period">.</span>
        </a>
        <span>A little insight. A little more care.</span>
        <div>
          <a href="/how-it-works">How it works</a>
          <a href={REPO} target="_blank" rel="noreferrer">
            GitHub <ArrowUpRight size={13} />
          </a>
        </div>
      </footer>
    </>
  );
}

createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
