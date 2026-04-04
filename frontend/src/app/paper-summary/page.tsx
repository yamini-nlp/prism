"use client";

import { motion } from "framer-motion";
import Sidebar from "@/components/Sidebar";
import Link from "next/link";
import { ArrowRight, BookOpen, AlertTriangle, CheckCircle, TrendingUp } from "lucide-react";

const paper = {
  title: "Attention Is All You Need",
  authors: "Ashish Vaswani, Noam Shazeer, Niki Parmar, Jakob Uszkoreit, Llion Jones, Aidan N. Gomez, Łukasz Kaiser, Illia Polosukhin",
  year: 2017,
  venue: "NeurIPS 2017",
  tldr:
    "Introduces the Transformer, a model architecture based solely on attention mechanisms, dispensing with recurrence and convolutions entirely. It achieves state-of-the-art on translation tasks with significantly less training time.",
  key_concepts: [
    "Self-Attention",
    "Multi-Head Attention",
    "Positional Encoding",
    "Encoder-Decoder Architecture",
    "Scaled Dot-Product Attention",
    "Feed-Forward Networks",
  ],
  methodology:
    "The authors propose the Transformer architecture, using stacked self-attention and point-wise, fully connected layers for both the encoder and decoder. Multi-head attention is employed to allow the model to jointly attend to information from different representation subspaces. Positional encodings are added to the input embeddings to retain sequence order information without recurrent connections.",
  results:
    "The Transformer achieves 28.4 BLEU on WMT 2014 English-to-German and 41.0 BLEU on English-to-French translation tasks, outperforming all previously reported ensembles. Training time is dramatically reduced — the big model was trained for 3.5 days on 8 P100 GPUs, compared to weeks for recurrent models achieving similar performance.",
  limitations:
    "The self-attention mechanism has quadratic complexity in sequence length, making it computationally expensive for very long sequences. The model requires large amounts of data and compute to achieve strong performance. Absolute positional encodings may not generalize well to sequences longer than those seen during training.",
  citations: 94823,
  pages: 15,
};

const sections = [
  {
    label: "TLDR",
    tag: "Summary",
    tagClass: "tag-indigo",
    content: paper.tldr,
    icon: BookOpen,
  },
  {
    label: "Methodology",
    tag: "Methods",
    tagClass: "tag-indigo",
    content: paper.methodology,
    icon: TrendingUp,
  },
  {
    label: "Results",
    tag: "Findings",
    tagClass: "tag-green",
    content: paper.results,
    icon: CheckCircle,
  },
  {
    label: "Limitations",
    tag: "Caveats",
    tagClass: "tag-orange",
    content: paper.limitations,
    icon: AlertTriangle,
  },
];

export default function PaperSummaryPage() {
  return (
    <div style={{ display: "flex", minHeight: "100vh", background: "var(--bg-base)" }}>
      <Sidebar />

      <main style={{ flex: 1, padding: "40px 48px", overflowY: "auto", maxWidth: 900 }}>
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
          <div className="tag tag-indigo" style={{ marginBottom: 16 }}>
            Paper Summary
          </div>

          <h1
            style={{
              fontFamily: "'DM Serif Display', serif",
              fontSize: "clamp(28px, 3vw, 44px)",
              letterSpacing: "-0.02em",
              color: "var(--text-primary)",
              lineHeight: 1.15,
              marginBottom: 14,
            }}
          >
            {paper.title}
          </h1>

          <p style={{ fontSize: 14, color: "var(--text-secondary)", marginBottom: 6, lineHeight: 1.6 }}>
            {paper.authors}
          </p>

          <div style={{ display: "flex", gap: 10, marginBottom: 36, flexWrap: "wrap" }}>
            <span className="tag tag-indigo">{paper.venue}</span>
            <span className="tag" style={{ background: "var(--bg-base)", color: "var(--text-muted)", border: "1px solid var(--border-subtle)" }}>
              {paper.year}
            </span>
            <span className="tag" style={{ background: "var(--bg-base)", color: "var(--text-muted)", border: "1px solid var(--border-subtle)" }}>
              {paper.pages} pages
            </span>
            <span className="tag" style={{ background: "var(--bg-base)", color: "var(--text-muted)", border: "1px solid var(--border-subtle)" }}>
              {paper.citations.toLocaleString()} citations
            </span>
          </div>

          <div
            style={{
              padding: "18px 22px",
              borderRadius: "var(--radius-md)",
              background: "rgba(99,102,241,0.05)",
              border: "1px solid rgba(99,102,241,0.15)",
              marginBottom: 32,
            }}
          >
            <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", color: "var(--accent-prism)", marginBottom: 10 }}>
              Key Concepts
            </div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 7 }}>
              {paper.key_concepts.map((c) => (
                <span key={c} className="tag tag-indigo">
                  {c}
                </span>
              ))}
            </div>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
            {sections.map((section, i) => (
              <motion.div
                key={section.label}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1, duration: 0.4 }}
                className="card"
                style={{ padding: 28 }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 16 }}>
                  <div
                    style={{
                      width: 36,
                      height: 36,
                      borderRadius: 10,
                      background: "var(--bg-base)",
                      border: "1px solid var(--border-subtle)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    <section.icon size={16} color="var(--text-secondary)" />
                  </div>
                  <div>
                    <div
                      style={{
                        fontFamily: "'DM Serif Display', serif",
                        fontSize: 20,
                        color: "var(--text-primary)",
                      }}
                    >
                      {section.label}
                    </div>
                  </div>
                  <span className={`tag ${section.tagClass}`} style={{ marginLeft: "auto" }}>
                    {section.tag}
                  </span>
                </div>
                <p
                  style={{
                    fontSize: 14,
                    color: "var(--text-secondary)",
                    lineHeight: 1.75,
                    fontFamily: section.label === "TLDR" ? "'DM Serif Display', serif" : "inherit",
                    fontStyle: section.label === "TLDR" ? "italic" : "normal",
                    fontSize: section.label === "TLDR" ? 17 : 14,
                  }}
                >
                  {section.content}
                </p>
              </motion.div>
            ))}
          </div>

          <div style={{ marginTop: 32, display: "flex", gap: 12 }}>
            <Link href="/workspace" style={{ textDecoration: "none" }}>
              <button className="btn-primary">
                Query This Paper <ArrowRight size={14} />
              </button>
            </Link>
            <Link href="/source-trace" style={{ textDecoration: "none" }}>
              <button className="btn-secondary">
                View Source Trace
              </button>
            </Link>
          </div>
        </motion.div>
      </main>
    </div>
  );
}