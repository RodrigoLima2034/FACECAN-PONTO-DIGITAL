"use client";

/**
 * 📊 PONTO FACIAL - Admin Reports Page
 * Sistema de relatórios e análises do painel administrativo
 */

import { useState, useEffect } from "react";
import Link from "next/link";
import styles from "../admin.module.css";

interface ReportOption {
  id: string;
  title: string;
  description: string;
  icon: string;
  color: string;
  endpoint: string;
}

export default function ReportsPage() {
  const [loadingReports, setLoadingReports] = useState(false);
  const [reports] = useState<ReportOption[]>([
    {
      id: "attendance",
      title: "Relatório de Presença",
      description:
        "Análise detalhada de presença de funcionários por período",
      icon: "📋",
      color: "#667eea",
      endpoint: "/api/report/attendance",
    },
    {
      id: "daily",
      title: "Relatório Diário",
      description: "Resumo de atividades do dia atual",
      icon: "📅",
      color: "#764ba2",
      endpoint: "/api/report/daily",
    },
    {
      id: "confidence",
      title: "Análise de Confiança",
      description:
        "Estatísticas de confiança do reconhecimento facial por dia",
      icon: "🎯",
      color: "#10b981",
      endpoint: "/api/report/confidence",
    },
    {
      id: "latecomers",
      title: "Relatório de Atrasos",
      description: "Funcionários com atrasos registrados",
      icon: "⏰",
      color: "#f59e0b",
      endpoint: "/api/report/latecomers",
    },
    {
      id: "summary",
      title: "Resumo Executivo",
      description: "Análise consolidada do mês atual",
      icon: "📊",
      color: "#ef4444",
      endpoint: "/api/report/summary",
    },
    {
      id: "export",
      title: "Exportar Dados",
      description: "Exportar relatórios em CSV ou JSON",
      icon: "💾",
      color: "#0ea5e9",
      endpoint: "/api/report/export",
    },
  ]);

  const handleGenerateReport = async (reportId: string) => {
    setLoadingReports(true);
    try {
      const report = reports.find((r) => r.id === reportId);
      if (!report) return;

      const response = await fetch(
        `${report.endpoint}?format=pdf&timestamp=${Date.now()}`
      );

      if (!response.ok) {
        throw new Error(`Erro ao gerar relatório: ${response.status}`);
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `relatorio-${reportId}-${new Date().toISOString().split("T")[0]}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error("Erro ao gerar relatório:", error);
      alert(
        `Erro: ${error instanceof Error ? error.message : "Desconhecido"}`
      );
    } finally {
      setLoadingReports(false);
    }
  };

  return (
    <div className={styles.container}>
      {/* Navbar */}
      <nav className={styles.navbar}>
        <div className={styles.navbar_brand}>
          <span className={styles.logo_emoji}>👤</span>
          <span className={styles.logo_text}>Admin Dashboard</span>
        </div>
        <div className={styles.navbar_user}>
          <span className={styles.user_name}>Gerenciamento de Relatórios</span>
          <Link href="/admin">← Voltar</Link>
        </div>
      </nav>

      {/* Main Content */}
      <main className={styles.main}>
        {/* Header */}
        <div className={styles.header}>
          <div className={styles.header_content}>
            <h1>📊 Relatórios e Análises</h1>
            <p>Gere relatórios profissionais de presença e desempenho</p>
          </div>
        </div>

        {/* Reports Grid */}
        <div className={styles.reports_grid}>
          {reports.map((report) => (
            <div
              key={report.id}
              className={styles.report_card}
              style={{
                borderTop: `4px solid ${report.color}`,
              }}
            >
              <div
                className={styles.report_header}
                style={{ backgroundColor: report.color }}
              >
                <div className={styles.report_icon}>{report.icon}</div>
                <div className={styles.report_badge}>
                  {report.id === "export" ? "Exportar" : "Gerar"}
                </div>
              </div>
              <div className={styles.report_body}>
                <h3 className={styles.report_title}>{report.title}</h3>
                <p className={styles.report_desc}>{report.description}</p>
                <button
                  className={styles.report_btn}
                  style={{ backgroundColor: report.color }}
                  onClick={() => handleGenerateReport(report.id)}
                  disabled={loadingReports}
                >
                  {loadingReports
                    ? "⏳ Gerando..."
                    : `${report.id === "export" ? "💾" : "📥"} ${report.id === "export" ? "Exportar" : "Gerar PDF"}`}
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Info Section */}
        <section className={styles.system_info} style={{ marginTop: "40px" }}>
          <h2>ℹ️ Sobre os Relatórios</h2>
          <p>
            Os relatórios do sistema PONTO FACIAL fornecem análises detalhadas
            sobre:
          </p>

          <div className={styles.info_grid}>
            <div className={styles.info_item}>
              <div className={styles.info_label}>Presença</div>
              <div className={styles.info_value}>
                Marcações de entrada e saída
              </div>
            </div>
            <div className={styles.info_item}>
              <div className={styles.info_label}>Confiança</div>
              <div className={styles.info_value}>
                Precisão do reconhecimento facial
              </div>
            </div>
            <div className={styles.info_item}>
              <div className={styles.info_label}>Atrasos</div>
              <div className={styles.info_value}>
                Registros de atrasos nas entradas
              </div>
            </div>
            <div className={styles.info_item}>
              <div className={styles.info_label}>Período</div>
              <div className={styles.info_value}>Diário, semanal ou mensal</div>
            </div>
            <div className={styles.info_item}>
              <div className={styles.info_label}>Formato</div>
              <div className={styles.info_value}>PDF, CSV ou JSON</div>
            </div>
            <div className={styles.info_item}>
              <div className={styles.info_label}>Atualização</div>
              <div className={styles.info_value}>
                Dados em tempo real do banco
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className={styles.footer}>
        <p>© 2024 PONTO FACIAL - Sistema de Controle de Presença Digital</p>
      </footer>
    </div>
  );
}
