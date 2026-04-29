import { useState } from "react";
import { classifyReturn } from "./api";
import { ResultCard } from "./components/ResultCard";
import { TriageResponse } from "./types";

const SAMPLES = [
  { label: "EN Refund", text: "I ordered a blue stroller but got a red one. I want my money back immediately." },
  { label: "AR Refund", text: "أريد استرداد أموالي، المنتج وصل مكسوراً ولا يمكن استخدامه" },
  { label: "Exchange", text: "Wrong size — I ordered 6-12 months but received 12-18 months. Can I swap?" },
  { label: "Escalate", text: "This toy had a small part my 8-month-old almost choked on. I will report this." },
  { label: "Store Credit", text: "Been a loyal customer for years. Store credit is fine if that's easier." },
  { label: "Out of scope", text: "Hello, what time does your store close today?" },
];

export default function App() {
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [response, setResponse] = useState<TriageResponse | null>(null);

  async function handleClassify() {
    if (!input.trim() || loading) return;
    setLoading(true);
    setResponse(null);
    const result = await classifyReturn(input);
    setResponse(result);
    setLoading(false);
  }

  return (
    <div style={{
      minHeight: "100vh",
      background: "#f7f3ee",
      fontFamily: "'Inter', sans-serif",
      padding: "40px 16px",
    }}>
      <div style={{ maxWidth: 800, margin: "0 auto" }}>

        {/* Header */}
        <header style={{ textAlign: "center", marginBottom: 40 }}>
          <div style={{
            fontSize: 11, letterSpacing: 4, color: "#b08060",
            fontWeight: 700, marginBottom: 10, textTransform: "uppercase",
          }}>
            Mumzworld · مامزوورلد
          </div>
          <h1 style={{ fontSize: "clamp(26px,5vw,42px)", fontWeight: 700, color: "#1a1208", margin: 0 }}>
            Return Reason Triage
          </h1>
          <p style={{ color: "#8a7060", marginTop: 10, fontSize: 14 }}>
            AI classifier · Bilingual EN / AR · Confidence-scored structured output
          </p>
        </header>

        {/* Input card */}
        <div style={{
          background: "#fff", borderRadius: 16, padding: "24px",
          boxShadow: "0 2px 20px rgba(0,0,0,0.07)", marginBottom: 20,
        }}>
          <label style={{
            fontSize: 11, fontWeight: 700, letterSpacing: 2,
            color: "#b08060", textTransform: "uppercase", display: "block", marginBottom: 10,
          }}>
            Customer Return Reason
          </label>

          <textarea
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => { if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) handleClassify(); }}
            placeholder={'Enter return reason in English or Arabic…\ne.g. "I want my money back" / "أريد استرداد أموالي"'}
            style={{
              width: "100%", minHeight: 110,
              border: "1.5px solid #e5ddd3", borderRadius: 10,
              padding: "14px 16px", fontSize: 15, fontFamily: "inherit",
              resize: "vertical", outline: "none", boxSizing: "border-box",
              background: "#fdfaf7", lineHeight: 1.65, color: "#1a1208",
            }}
          />

          {/* Sample inputs */}
          <div style={{ marginTop: 10, marginBottom: 16, display: "flex", flexWrap: "wrap", gap: 6 }}>
            <span style={{ fontSize: 11, color: "#b08060", fontWeight: 600, alignSelf: "center", marginRight: 4 }}>
              Try:
            </span>
            {SAMPLES.map((s, i) => (
              <button
                key={i}
                onClick={() => setInput(s.text)}
                style={{
                  fontSize: 11, padding: "4px 12px",
                  background: "#f0ebe3", border: "1px solid #e0d5c8",
                  borderRadius: 20, cursor: "pointer",
                  color: "#7a6650", fontFamily: "inherit",
                  transition: "background 0.15s",
                }}
              >
                {s.label}
              </button>
            ))}
          </div>

          <button
            onClick={handleClassify}
            disabled={loading || !input.trim()}
            style={{
              width: "100%", padding: "14px",
              background: loading ? "#c9b9a5" : "#c0845a",
              color: "#fff", border: "none", borderRadius: 10,
              fontSize: 15, fontWeight: 600, cursor: loading ? "not-allowed" : "pointer",
              fontFamily: "inherit", letterSpacing: 0.4, transition: "background 0.2s",
            }}
          >
            {loading ? "Classifying…" : "Classify Return →"}
          </button>
          <p style={{ fontSize: 11, color: "#c0b0a0", textAlign: "center", margin: "10px 0 0" }}>
            ⌘ + Enter to submit
          </p>
        </div>

        {/* Error */}
        {response && !response.success && (
          <div style={{
            background: "#fdf2f2", border: "1.5px solid #f5c6c6",
            borderRadius: 12, padding: "16px 20px",
            color: "#c0392b", fontSize: 14, marginBottom: 16,
          }}>
            <strong>✗ Error:</strong> {response.error}
          </div>
        )}

        {/* Result */}
        {response?.success && response.result && (
          <ResultCard result={response.result} />
        )}

        <p style={{ textAlign: "center", color: "#c0b0a0", fontSize: 11, marginTop: 32, letterSpacing: 1 }}>
          MUMZWORLD AI INTERN · TRACK A · KIRAN MEDAM
        </p>
      </div>
    </div>
  );
}
