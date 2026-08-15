"use client";

/**
 * ✅ PONTO FACIAL - Attendance Records Page
 * Visualizar e filtrar registros de ponto
 */

import { useEffect, useState } from "react";
import Link from "next/link";
import styles from "../admin.module.css";

interface Record {
  id: number;
  registration: string;
  name: string;
  event_type: string;
  occurred_at: string;
  source: string;
}

export default function AttendancePage() {
  const [records, setRecords] = useState<Record[]>([]);
  const [filteredRecords, setFilteredRecords] = useState<Record[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  useEffect(() => {
    loadRecords();
  }, []);

  useEffect(() => {
    filterRecords();
  }, [records, filter, startDate, endDate]);

  const loadRecords = async () => {
    try {
      const response = await fetch("/api/attendance");
      const data = (await response.json()) as { records?: Record[] };
      setRecords(data.records || []);
    } catch (error) {
      console.error("Erro ao carregar registros:", error);
    } finally {
      setLoading(false);
    }
  };

  const filterRecords = () => {
    let filtered = records;

    if (filter) {
      filtered = filtered.filter(
        (r) =>
          r.name.toLowerCase().includes(filter.toLowerCase()) ||
          r.registration.includes(filter)
      );
    }

    if (startDate) {
      const start = new Date(startDate);
      filtered = filtered.filter((r) => new Date(r.occurred_at) >= start);
    }

    if (endDate) {
      const end = new Date(endDate);
      end.setHours(23, 59, 59);
      filtered = filtered.filter((r) => new Date(r.occurred_at) <= end);
    }

    setFilteredRecords(filtered);
  };

  const getEventColor = (eventType: string) => {
    switch (eventType) {
      case "CHECK_IN":
        return "#d4edda";
      case "CHECK_OUT":
        return "#cfe2ff";
      case "BREAK_START":
        return "#fff3cd";
      case "BREAK_END":
        return "#fff3cd";
      default:
        return "#e2e3e5";
    }
  };

  const getEventTextColor = (eventType: string) => {
    switch (eventType) {
      case "CHECK_IN":
        return "#155724";
      case "CHECK_OUT":
        return "#084298";
      case "BREAK_START":
        return "#856404";
      case "BREAK_END":
        return "#856404";
      default:
        return "#383d41";
    }
  };

  return (
    <div className={styles.container}>
      <nav className={styles.navbar}>
        <div className={styles.navbar_brand}>
          <span className={styles.logo_emoji}>✅</span>
          <span className={styles.logo_text}>REGISTROS</span>
        </div>
        <div className={styles.navbar_user}>
          <Link href="/admin" style={{ color: "white", textDecoration: "none" }}>
            ← Voltar
          </Link>
        </div>
      </nav>

      <div className={styles.main}>
        <div className={styles.header}>
          <div className={styles.header_content}>
            <h1>✅ Registros de Presença</h1>
            <p>Visualize todos os registros de entrada e saída</p>
          </div>
          <button
            className={styles.btn_refresh}
            onClick={loadRecords}
            disabled={loading}
          >
            🔄 Atualizar
          </button>
        </div>

        {/* Filtros */}
        <div
          style={{
            background: "white",
            borderRadius: "12px",
            padding: "20px",
            marginBottom: "20px",
            boxShadow: "0 2px 8px rgba(0, 0, 0, 0.1)",
            display: "grid",
            gridTemplateColumns: "1fr 1fr 1fr",
            gap: "15px",
          }}
        >
          <div>
            <label
              style={{
                display: "block",
                marginBottom: "8px",
                fontWeight: "600",
                fontSize: "0.9rem",
              }}
            >
              🔍 Filtrar por nome ou matrícula
            </label>
            <input
              type="text"
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              placeholder="Digite nome ou matrícula..."
              style={{
                width: "100%",
                padding: "10px",
                border: "1px solid #ddd",
                borderRadius: "6px",
                boxSizing: "border-box",
              }}
            />
          </div>

          <div>
            <label
              style={{
                display: "block",
                marginBottom: "8px",
                fontWeight: "600",
                fontSize: "0.9rem",
              }}
            >
              📅 Data inicial
            </label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              style={{
                width: "100%",
                padding: "10px",
                border: "1px solid #ddd",
                borderRadius: "6px",
                boxSizing: "border-box",
              }}
            />
          </div>

          <div>
            <label
              style={{
                display: "block",
                marginBottom: "8px",
                fontWeight: "600",
                fontSize: "0.9rem",
              }}
            >
              📅 Data final
            </label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              style={{
                width: "100%",
                padding: "10px",
                border: "1px solid #ddd",
                borderRadius: "6px",
                boxSizing: "border-box",
              }}
            />
          </div>
        </div>

        {/* Tabela de Registros */}
        <div
          style={{
            background: "white",
            borderRadius: "12px",
            padding: "20px",
            boxShadow: "0 2px 8px rgba(0, 0, 0, 0.1)",
          }}
        >
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: "20px",
            }}
          >
            <h2 style={{ margin: 0 }}>📋 Registros ({filteredRecords.length})</h2>
            <a
              href="/api/report?format=csv"
              style={{
                background: "#667eea",
                color: "white",
                padding: "8px 16px",
                borderRadius: "6px",
                textDecoration: "none",
                fontSize: "0.9rem",
              }}
            >
              📥 Exportar CSV
            </a>
          </div>

          {loading ? (
            <p>⏳ Carregando registros...</p>
          ) : filteredRecords.length === 0 ? (
            <p style={{ color: "#999" }}>Nenhum registro encontrado</p>
          ) : (
            <div style={{ overflowX: "auto" }}>
              <table
                style={{
                  width: "100%",
                  borderCollapse: "collapse",
                  fontSize: "0.9rem",
                }}
              >
                <thead>
                  <tr style={{ borderBottom: "2px solid #e0e0e0" }}>
                    <th
                      style={{
                        textAlign: "left",
                        padding: "12px",
                        fontWeight: "600",
                        color: "#667eea",
                      }}
                    >
                      Funcionário
                    </th>
                    <th
                      style={{
                        textAlign: "left",
                        padding: "12px",
                        fontWeight: "600",
                        color: "#667eea",
                      }}
                    >
                      Matrícula
                    </th>
                    <th
                      style={{
                        textAlign: "left",
                        padding: "12px",
                        fontWeight: "600",
                        color: "#667eea",
                      }}
                    >
                      Evento
                    </th>
                    <th
                      style={{
                        textAlign: "left",
                        padding: "12px",
                        fontWeight: "600",
                        color: "#667eea",
                      }}
                    >
                      Data e Hora
                    </th>
                    <th
                      style={{
                        textAlign: "left",
                        padding: "12px",
                        fontWeight: "600",
                        color: "#667eea",
                      }}
                    >
                      Origem
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {filteredRecords.map((record) => (
                    <tr
                      key={record.id}
                      style={{ borderBottom: "1px solid #e0e0e0" }}
                    >
                      <td style={{ padding: "12px" }}>{record.name}</td>
                      <td style={{ padding: "12px" }}>{record.registration}</td>
                      <td style={{ padding: "12px" }}>
                        <span
                          style={{
                            background: getEventColor(record.event_type),
                            color: getEventTextColor(record.event_type),
                            padding: "4px 8px",
                            borderRadius: "4px",
                            fontSize: "0.85rem",
                            fontWeight: "600",
                          }}
                        >
                          {record.event_type.replaceAll("_", " ")}
                        </span>
                      </td>
                      <td style={{ padding: "12px" }}>
                        {new Date(record.occurred_at).toLocaleString("pt-BR")}
                      </td>
                      <td style={{ padding: "12px", fontSize: "0.85rem" }}>
                        {record.source === "FACIAL" ? "👤 Facial" : "🖱️ Manual"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
