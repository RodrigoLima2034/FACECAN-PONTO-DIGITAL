"use client";

import { useState } from "react";
import Link from "next/link";
import styles from "./reports.module.css";

type ReportPeriod = "daily" | "weekly" | "monthly";
type ReportFormat = "json" | "csv" | "pdf";

interface ReportFilters {
  period: ReportPeriod;
  format: ReportFormat;
  startDate: string;
  endDate: string;
  department: string;
  employee: string;
}

interface ReportSummary {
  total_employees: number;
  total_events: number;
  average_confidence: number;
  attendance_rate: number;
}

interface ReportData {
  title: string;
  period: string;
  generated_at: string;
  summary: ReportSummary;
  insights: string[];
  records?: unknown[];
}

interface ReportResponse {
  success?: boolean;
  data: ReportData;
  message?: string;
}

function getDateRange(period: ReportPeriod) {
  const today = new Date();
  const endDate = new Date(today);
  const startDate = new Date(today);

  if (period === "daily") {
    // Mantém o mesmo dia.
  } else if (period === "weekly") {
    startDate.setDate(today.getDate() - 6);
  } else {
    startDate.setDate(1);
  }

  const formatDate = (date: Date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");

    return `${year}-${month}-${day}`;
  };

  return {
    startDate: formatDate(startDate),
    endDate: formatDate(endDate),
  };
}

function downloadFile(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");

  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();

  URL.revokeObjectURL(url);
}

export default function ReportsPage() {
  const initialRange = getDateRange("monthly");

  const [filters, setFilters] = useState<ReportFilters>({
    period: "monthly",
    format: "json",
    startDate: initialRange.startDate,
    endDate: initialRange.endDate,
    department: "",
    employee: "",
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [reportData, setReportData] = useState<ReportResponse | null>(null);

  const handlePeriodChange = (period: ReportPeriod) => {
    const range = getDateRange(period);

    setFilters((current) => ({
      ...current,
      period,
      startDate: range.startDate,
      endDate: range.endDate,
    }));
  };

  const handleGenerateReport = async () => {
    setLoading(true);
    setError("");
    setSuccess("");
    setReportData(null);

    try {
      const params = new URLSearchParams({
        period: filters.period,
        format: filters.format,
        startDate: filters.startDate,
        endDate: filters.endDate,
      });

      if (filters.department.trim()) {
        params.set("department", filters.department.trim());
      }

      if (filters.employee.trim()) {
        params.set("employee", filters.employee.trim());
      }

      const response = await fetch(`/api/report?${params.toString()}`, {
        method: "GET",
        credentials: "include",
        cache: "no-store",
      });

      const contentType = response.headers.get("content-type") || "";

      if (!response.ok) {
        let message = `Erro ao gerar relatório (${response.status}).`;

        if (contentType.includes("application/json")) {
          const body = await response.json().catch(() => null);

          if (body?.message) {
            message = body.message;
          } else if (body?.error) {
            message = body.error;
          }
        }

        throw new Error(message);
      }

      if (filters.format === "csv") {
        const blob = await response.blob();

        downloadFile(
          blob,
          `relatorio-${new Date().toISOString().slice(0, 10)}.csv`
        );

        setSuccess("Relatório CSV gerado com sucesso.");
        return;
      }

      if (filters.format === "pdf") {
        const blob = await response.blob();

        downloadFile(
          blob,
          `relatorio-${new Date().toISOString().slice(0, 10)}.pdf`
        );

        setSuccess("Relatório PDF gerado com sucesso.");
        return;
      }

      const data = (await response.json()) as ReportResponse;

      if (!data?.data) {
        throw new Error("A API retornou um relatório inválido.");
      }

      setReportData(data);
      setSuccess("Relatório gerado com sucesso.");
    } catch (err) {
      console.error("Erro ao gerar relatório:", err);

      setError(
        err instanceof Error
          ? err.message
          : "Não foi possível gerar o relatório."
      );
    } finally {
      setLoading(false);
    }
  };

  const saveJson = () => {
    if (!reportData) {
      return;
    }

    const dataStr = JSON.stringify(reportData.data, null, 2);

    const dataBlob = new Blob([dataStr], {
      type: "application/json;charset=utf-8",
    });

    downloadFile(
      dataBlob,
      `relatorio-${new Date().toISOString().slice(0, 10)}.json`
    );
  };

  return (
    <main className={styles.container}>
      <div className={styles.header}>
        <div>
          <Link href="/" className={styles.back_link}>
            ← Voltar
          </Link>

          <h1>📊 Relatórios</h1>

          <p>
            Consulte, analise e exporte os registros do Ponto Facial.
          </p>
        </div>
      </div>

      <div className={styles.content}>
        <section className={styles.filters}>
          <h2>⚙️ Filtros e Configurações</h2>

          <div className={styles.filter_group}>
            <label htmlFor="period">Período</label>

            <select
              id="period"
              value={filters.period}
              onChange={(event) =>
                handlePeriodChange(event.target.value as ReportPeriod)
              }
              disabled={loading}
            >
              <option value="daily">Diário</option>
              <option value="weekly">Semanal</option>
              <option value="monthly">Mensal</option>
            </select>
          </div>

          <div className={styles.filter_group}>
            <label htmlFor="format">Formato de Saída</label>

            <select
              id="format"
              value={filters.format}
              onChange={(event) =>
                setFilters((current) => ({
                  ...current,
                  format: event.target.value as ReportFormat,
                }))
              }
              disabled={loading}
            >
              <option value="json">📄 JSON (Visualizar)</option>
              <option value="csv">📊 CSV (Excel)</option>
              <option value="pdf">📑 PDF (Impressão)</option>
            </select>
          </div>

          <div className={styles.filter_row}>
            <div className={styles.filter_group}>
              <label htmlFor="startDate">Data Inicial</label>

              <input
                id="startDate"
                type="date"
                value={filters.startDate}
                onChange={(event) =>
                  setFilters((current) => ({
                    ...current,
                    startDate: event.target.value,
                  }))
                }
                disabled={loading}
              />
            </div>

            <div className={styles.filter_group}>
              <label htmlFor="endDate">Data Final</label>

              <input
                id="endDate"
                type="date"
                value={filters.endDate}
                onChange={(event) =>
                  setFilters((current) => ({
                    ...current,
                    endDate: event.target.value,
                  }))
                }
                disabled={loading}
              />
            </div>
          </div>

          <div className={styles.filter_group}>
            <label htmlFor="department">
              Departamento (Opcional)
            </label>

            <input
              id="department"
              type="text"
              placeholder="Ex.: Operações, RH, TI"
              value={filters.department}
              onChange={(event) =>
                setFilters((current) => ({
                  ...current,
                  department: event.target.value,
                }))
              }
              disabled={loading}
            />
          </div>

          <div className={styles.filter_group}>
            <label htmlFor="employee">
              Matrícula do Funcionário (Opcional)
            </label>

            <input
              id="employee"
              type="text"
              placeholder="Ex.: 0001, 0002"
              value={filters.employee}
              onChange={(event) =>
                setFilters((current) => ({
                  ...current,
                  employee: event.target.value,
                }))
              }
              disabled={loading}
            />
          </div>

          <button
            type="button"
            className={styles.btn_generate}
            onClick={handleGenerateReport}
            disabled={loading}
          >
            {loading ? "⏳ Gerando..." : "🚀 Gerar Relatório"}
          </button>

          {error && (
            <div className={styles.error} role="alert">
              {error}
            </div>
          )}

          {success && (
            <div className={styles.success} role="status">
              {success}
            </div>
          )}
        </section>

        {reportData && (
          <section className={styles.results_panel}>
            <h2>📈 Resultado do Relatório</h2>

            <div className={styles.summary}>
              <h3>{reportData.data.title}</h3>

              <p>
                <strong>Período:</strong> {reportData.data.period}
              </p>

              <p>
                <strong>Gerado em:</strong>{" "}
                {new Date(
                  reportData.data.generated_at
                ).toLocaleString("pt-BR")}
              </p>

              <div className={styles.metrics}>
                <div className={styles.metric_card}>
                  <span className={styles.metric_label}>
                    Funcionários
                  </span>

                  <span className={styles.metric_value}>
                    {reportData.data.summary.total_employees}
                  </span>
                </div>

                <div className={styles.metric_card}>
                  <span className={styles.metric_label}>
                    Eventos
                  </span>

                  <span className={styles.metric_value}>
                    {reportData.data.summary.total_events}
                  </span>
                </div>

                <div className={styles.metric_card}>
                  <span className={styles.metric_label}>
                    Confiança Média
                  </span>

                  <span className={styles.metric_value}>
                    {(
                      reportData.data.summary.average_confidence * 100
                    ).toFixed(1)}
                    %
                  </span>
                </div>

                <div className={styles.metric_card}>
                  <span className={styles.metric_label}>
                    Taxa de Presença
                  </span>

                  <span className={styles.metric_value}>
                    {reportData.data.summary.attendance_rate}%
                  </span>
                </div>
              </div>
            </div>

            <div className={styles.insights}>
              <h3>💡 Insights Automáticos</h3>

              {reportData.data.insights?.length ? (
                <ul>
                  {reportData.data.insights.map((insight, index) => (
                    <li key={`${index}-${insight}`}>{insight}</li>
                  ))}
                </ul>
              ) : (
                <p>Nenhum insight disponível para este período.</p>
              )}
            </div>

            <div className={styles.actions}>
              <button
                type="button"
                className={styles.btn_export}
                onClick={saveJson}
              >
                💾 Salvar JSON
              </button>

              <button
                type="button"
                className={styles.btn_print}
                onClick={() => window.print()}
              >
                🖨️ Imprimir
              </button>
            </div>
          </section>
        )}

        {!reportData && (
          <section className={styles.info_panel}>
            <h2>ℹ️ Sobre Relatórios</h2>

            <div className={styles.info_section}>
              <h3>🎯 Tipos de Relatórios</h3>

              <ul>
                <li>
                  <strong>Diário:</strong> análise completa do dia.
                </li>
                <li>
                  <strong>Semanal:</strong> consolidação da semana.
                </li>
                <li>
                  <strong>Mensal:</strong> resumo do mês completo.
                </li>
              </ul>
            </div>

            <div className={styles.info_section}>
              <h3>📋 Métricas Incluídas</h3>

              <ul>
                <li>Total de funcionários presentes.</li>
                <li>Quantidade de entradas e saídas.</li>
                <li>Registros de atrasos.</li>
                <li>Confiança média do reconhecimento facial.</li>
                <li>Taxa geral de presença.</li>
                <li>Insights e tendências.</li>
              </ul>
            </div>

            <div className={styles.info_section}>
              <h3>💾 Formatos Disponíveis</h3>

              <ul>
                <li>
                  <strong>JSON:</strong> integração com outros sistemas.
                </li>
                <li>
                  <strong>CSV:</strong> compatível com Excel e
                  Google Sheets.
                </li>
                <li>
                  <strong>PDF:</strong> pronto para impressão.
                </li>
              </ul>
            </div>
          </section>
        )}
      </div>
    </main>
  );
}