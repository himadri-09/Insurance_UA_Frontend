"use client";
import React from "react";
import { Document, Page, View, Text, StyleSheet } from "@react-pdf/renderer";
import type { SubmissionOutput } from "@/types";

interface SignalSource {
  doc: string;
  page: number | null;
  section: string;
}

interface RuleResult {
  rule_id: string;
  rule_name: string;
  passed: boolean;
  reason: string;
  severity: string;
  narrative?: string;
  sources?: SignalSource[];
}

interface Props {
  data: SubmissionOutput;
  ruleResults: RuleResult[];
}

function cleanRuleName(name: string): string {
  return name.replace(/^(DECLINE|REFER|OVERRIDE|POSITIVE):\s*/i, "").trim();
}

function markdownToPlainText(md: string): string {
  return md
    .replace(/^#{1,6}\s+(.+)$/gm, "$1")
    .replace(/\*\*(.+?)\*\*/g, "$1")
    .replace(/\*(.+?)\*/g, "$1")
    .replace(/`(.+?)`/g, "$1")
    .replace(/\[(.+?)\]\(.+?\)/g, "$1")
    .replace(/^[-*+]\s+/gm, "• ")
    .replace(/^\d+\.\s+/gm, "")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

function getSeverityColors(severity: string) {
  switch (severity) {
    case "decline": return { border: "#fecaca", bg: "#fef2f2", text: "#b91c1c", label: "Decline Signal" };
    case "refer":   return { border: "#fed7aa", bg: "#fff7ed", text: "#c2410c", label: "Refer Signal" };
    case "override":return { border: "#bfdbfe", bg: "#eff6ff", text: "#1d4ed8", label: "Mitigating Factor" };
    default:        return { border: "#bbf7d0", bg: "#f0fdf4", text: "#15803d", label: "Positive Signal" };
  }
}

const styles = StyleSheet.create({
  page: {
    paddingTop: 44,
    paddingBottom: 48,
    paddingHorizontal: 44,
    fontFamily: "Helvetica",
    fontSize: 9,
    color: "#1f2937",
    backgroundColor: "#ffffff",
  },
  header: {
    marginBottom: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#e5e7eb",
  },
  companyName: {
    fontSize: 22,
    fontFamily: "Helvetica-Bold",
    color: "#111827",
    marginBottom: 6,
  },
  metaRow: {
    flexDirection: "row",
    marginTop: 4,
    flexWrap: "wrap",
  },
  metaChip: {
    fontSize: 7.5,
    borderWidth: 1,
    borderColor: "#d1d5db",
    color: "#4b5563",
    paddingHorizontal: 7,
    paddingVertical: 2.5,
    borderRadius: 20,
    marginRight: 6,
    marginBottom: 4,
  },
  scoreRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 12,
  },
  scoreLabel: {
    fontSize: 7.5,
    color: "#9ca3af",
    textTransform: "uppercase",
    letterSpacing: 0.5,
    marginBottom: 2,
  },
  scoreValue: {
    fontSize: 24,
    fontFamily: "Helvetica-Bold",
  },
  scoreDenom: {
    fontSize: 12,
    color: "#9ca3af",
    fontFamily: "Helvetica",
  },
  actionChip: {
    fontSize: 8,
    borderWidth: 1,
    paddingHorizontal: 10,
    paddingVertical: 3.5,
    borderRadius: 20,
    marginLeft: 16,
    marginTop: 4,
  },
  sectionContainer: {
    marginBottom: 22,
  },
  sectionTitle: {
    fontSize: 11,
    fontFamily: "Helvetica-Bold",
    color: "#111827",
    marginBottom: 10,
    paddingBottom: 6,
    borderBottomWidth: 1,
    borderBottomColor: "#f3f4f6",
  },
  subLabel: {
    fontSize: 7.5,
    fontFamily: "Helvetica-Bold",
    color: "#6b7280",
    textTransform: "uppercase",
    letterSpacing: 0.6,
    marginBottom: 7,
  },
  signalCard: {
    marginBottom: 7,
    padding: 10,
    borderRadius: 6,
    borderWidth: 1,
  },
  signalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 5,
  },
  signalName: {
    fontSize: 8.5,
    fontFamily: "Helvetica-Bold",
    color: "#111827",
    flex: 1,
    marginRight: 8,
  },
  signalBadge: {
    fontSize: 6.5,
    borderWidth: 1,
    paddingHorizontal: 5,
    paddingVertical: 2,
    borderRadius: 10,
  },
  signalBody: {
    fontSize: 8,
    color: "#4b5563",
    lineHeight: 1.55,
    marginBottom: 5,
  },
  signalSources: {
    fontSize: 7,
    color: "#9ca3af",
    marginTop: 3,
  },
  signalSourcesLabel: {
    fontFamily: "Helvetica-Bold",
    color: "#6b7280",
  },
  briefText: {
    fontSize: 8.5,
    color: "#374151",
    lineHeight: 1.65,
  },
  footer: {
    position: "absolute",
    bottom: 22,
    left: 44,
    right: 44,
    flexDirection: "row",
    justifyContent: "space-between",
    borderTopWidth: 1,
    borderTopColor: "#e5e7eb",
    paddingTop: 7,
  },
  footerText: {
    fontSize: 7,
    color: "#9ca3af",
  },
  signalGroup: {
    marginBottom: 14,
  },
});

export function SubmissionPDFDocument({ data, ruleResults }: Props) {
  const negativeSignals = ruleResults.filter(r => r.severity === "decline" || r.severity === "refer");
  const positiveSignals = ruleResults.filter(r => r.severity === "positive" || r.severity === "override");

  const briefText = markdownToPlainText(
    (data.risk_brief_markdown || "")
      .replace(/^```markdown\n?/, "")
      .replace(/\n?```$/, "")
      .trim()
  );

  const scoreColor =
    data.appetite_assessment.score >= 4 ? "#16a34a" :
    data.appetite_assessment.score === 3 ? "#d97706" : "#dc2626";

  const exportedAt = new Date().toLocaleString("en-US", {
    year: "numeric", month: "short", day: "numeric",
    hour: "2-digit", minute: "2-digit",
  });

  const renderSignals = (signals: RuleResult[]) =>
    signals.map(signal => {
      const colors = getSeverityColors(signal.severity);
      const bodyText = signal.narrative || signal.reason;
      return (
        <View
          key={signal.rule_id}
          style={[styles.signalCard, { borderColor: colors.border, backgroundColor: colors.bg }]}
        >
          <View style={styles.signalHeader}>
            <Text style={styles.signalName}>{cleanRuleName(signal.rule_name)}</Text>
            <Text style={[styles.signalBadge, { borderColor: colors.border, color: colors.text }]}>
              {colors.label}
            </Text>
          </View>
          <Text style={styles.signalBody}>{bodyText}</Text>
          {signal.sources && signal.sources.length > 0 && (
            <Text style={styles.signalSources}>
              <Text style={styles.signalSourcesLabel}>Sources: </Text>
              {signal.sources.map((s, i) =>
                `${i + 1}. ${s.doc}${s.page ? `, p.${s.page}` : ""}${s.section ? ` (${s.section})` : ""}${i < (signal.sources?.length ?? 0) - 1 ? "  •  " : ""}`
              ).join("")}
            </Text>
          )}
        </View>
      );
    });

  return (
    <Document
      title={`${data.company?.name || "Submission"} — Triage Report`}
      author="TriagePilot"
    >
      <Page size="A4" style={styles.page}>

        {/* ── Header ── */}
        <View style={styles.header}>
          <Text style={styles.companyName}>{data.company?.name || "Unknown Company"}</Text>
          <View style={styles.metaRow}>
            <Text style={styles.metaChip}>
              {data.appetite_assessment.status.replace(/_/g, " ").toUpperCase()}
            </Text>
            <Text style={styles.metaChip}>
              {data.line_of_business.replace(/_/g, " ").toUpperCase()}
            </Text>
            <Text style={styles.metaChip}>Queue: {data.recommended_queue}</Text>
          </View>
          <View style={styles.scoreRow}>
            <View>
              <Text style={styles.scoreLabel}>Appetite Score</Text>
              <Text style={[styles.scoreValue, { color: scoreColor }]}>
                {data.appetite_assessment.score}
                <Text style={styles.scoreDenom}>/5</Text>
              </Text>
            </View>
          </View>
        </View>

        {/* ── Risk Details ── */}
        {ruleResults.length > 0 && (
          <View style={styles.sectionContainer}>
            <Text style={styles.sectionTitle}>
              Risk Details  ({ruleResults.length} signals)
            </Text>

            {negativeSignals.length > 0 && (
              <View style={styles.signalGroup}>
                <Text style={styles.subLabel}>
                  Negative Signals ({negativeSignals.length})
                </Text>
                {renderSignals(negativeSignals)}
              </View>
            )}

            {positiveSignals.length > 0 && (
              <View style={styles.signalGroup}>
                <Text style={styles.subLabel}>
                  Positive Signals ({positiveSignals.length})
                </Text>
                {renderSignals(positiveSignals)}
              </View>
            )}
          </View>
        )}

        {/* ── Risk Brief ── */}
        {briefText ? (
          <View style={styles.sectionContainer}>
            <Text style={styles.sectionTitle}>Risk Brief</Text>
            <Text style={styles.briefText}>{briefText}</Text>
          </View>
        ) : null}

        {/* ── Broker Follow-up Questions ── */}
        {data.broker_questions && data.broker_questions.length > 0 && (
          <View style={styles.sectionContainer}>
            <Text style={styles.sectionTitle}>Broker Follow-up Questions</Text>
            {data.broker_questions.map((q, i) => (
              <View key={i} style={{ flexDirection: "row", marginBottom: 6 }}>
                <Text style={{ fontSize: 8, color: "#9ca3af", fontFamily: "Helvetica-Bold", marginRight: 6, minWidth: 14 }}>
                  {i + 1}.
                </Text>
                <Text style={{ fontSize: 8.5, color: "#374151", lineHeight: 1.55, flex: 1 }}>
                  {q}
                </Text>
              </View>
            ))}
          </View>
        )}

        {/* ── Footer ── */}
        <View style={styles.footer} fixed>
          <Text style={styles.footerText}>TriagePilot — Exported {exportedAt}</Text>
          <Text style={styles.footerText}>ID: {data.submission_id || "—"}</Text>
        </View>

      </Page>
    </Document>
  );
}