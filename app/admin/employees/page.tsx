"use client";

/**
 * 👥 PONTO FACIAL - Employee Management Page
 * Gerenciamento de funcionários
 */

import { useEffect, useState } from "react";
import Link from "next/link";
import styles from "../admin.module.css";

interface Employee {
  id: number;
  registration: string;
  name: string;
  department: string;
  shift_name: string;
  face_status: string;
  status: string;
}

export default function EmployeesPage() {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [name, setName] = useState("");
  const [registration, setRegistration] = useState("");
  const [department, setDepartment] = useState("");
  const [shift, setShift] = useState("1");
  const [message, setMessage] = useState("");

  useEffect(() => {
    loadEmployees();
  }, []);

  const loadEmployees = async () => {
    try {
      const response = await fetch("/api/employees");
      const data = (await response.json()) as { employees?: Employee[] };
      setEmployees(data.employees || []);
    } catch (error) {
      setMessage(`❌ Erro ao carregar funcionários: ${error}`);
    } finally {
      setLoading(false);
    }
  };

  const handleAddEmployee = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const response = await fetch("/api/employees", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          name,
          registration,
          department,
          shiftId: Number(shift),
        }),
      });
      const data = (await response.json()) as { message?: string };
      setMessage(
        data.message || "✅ Funcionário cadastrado com sucesso!"
      );
      if (response.ok) {
        setName("");
        setRegistration("");
        setDepartment("");
        setShift("1");
        loadEmployees();
      }
    } catch (error) {
      setMessage(`❌ Erro ao cadastrar: ${error}`);
    }
  };

  return (
    <div className={styles.container}>
      <nav className={styles.navbar}>
        <div className={styles.navbar_brand}>
          <span className={styles.logo_emoji}>👥</span>
          <span className={styles.logo_text}>FUNCIONÁRIOS</span>
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
            <h1>👥 Gerenciar Funcionários</h1>
            <p>Cadastre, edite e monitore os funcionários da empresa</p>
          </div>
          <button
            className={styles.btn_refresh}
            onClick={loadEmployees}
            disabled={loading}
          >
            🔄 Atualizar
          </button>
        </div>

        {message && (
          <div
            style={{
              background: message.includes("✅") ? "#d4edda" : "#f8d7da",
              color: message.includes("✅") ? "#155724" : "#721c24",
              padding: "16px",
              borderRadius: "8px",
              marginBottom: "20px",
            }}
          >
            {message}
            <button
              onClick={() => setMessage("")}
              style={{
                float: "right",
                background: "none",
                border: "none",
                cursor: "pointer",
                fontSize: "1.2rem",
              }}
            >
              ×
            </button>
          </div>
        )}

        <div style={{ display: "grid", gridTemplateColumns: "1fr 2fr", gap: "20px" }}>
          {/* Formulário */}
          <div
            style={{
              background: "white",
              borderRadius: "12px",
              padding: "24px",
              boxShadow: "0 2px 8px rgba(0, 0, 0, 0.1)",
            }}
          >
            <h2 style={{ marginTop: 0 }}>➕ Novo Funcionário</h2>
            <form onSubmit={handleAddEmployee}>
              <div style={{ marginBottom: "16px" }}>
                <label
                  style={{
                    display: "block",
                    marginBottom: "8px",
                    fontWeight: "600",
                  }}
                >
                  Matrícula
                </label>
                <input
                  type="text"
                  value={registration}
                  onChange={(e) => setRegistration(e.target.value)}
                  required
                  placeholder="Ex: EMP001"
                  style={{
                    width: "100%",
                    padding: "10px",
                    border: "1px solid #ddd",
                    borderRadius: "6px",
                    fontSize: "0.95rem",
                    boxSizing: "border-box",
                  }}
                />
              </div>

              <div style={{ marginBottom: "16px" }}>
                <label
                  style={{
                    display: "block",
                    marginBottom: "8px",
                    fontWeight: "600",
                  }}
                >
                  Nome Completo
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  placeholder="Ex: João Silva"
                  style={{
                    width: "100%",
                    padding: "10px",
                    border: "1px solid #ddd",
                    borderRadius: "6px",
                    fontSize: "0.95rem",
                    boxSizing: "border-box",
                  }}
                />
              </div>

              <div style={{ marginBottom: "16px" }}>
                <label
                  style={{
                    display: "block",
                    marginBottom: "8px",
                    fontWeight: "600",
                  }}
                >
                  Departamento
                </label>
                <input
                  type="text"
                  value={department}
                  onChange={(e) => setDepartment(e.target.value)}
                  placeholder="Ex: TI"
                  style={{
                    width: "100%",
                    padding: "10px",
                    border: "1px solid #ddd",
                    borderRadius: "6px",
                    fontSize: "0.95rem",
                    boxSizing: "border-box",
                  }}
                />
              </div>

              <div style={{ marginBottom: "20px" }}>
                <label
                  style={{
                    display: "block",
                    marginBottom: "8px",
                    fontWeight: "600",
                  }}
                >
                  Turno
                </label>
                <select
                  value={shift}
                  onChange={(e) => setShift(e.target.value)}
                  style={{
                    width: "100%",
                    padding: "10px",
                    border: "1px solid #ddd",
                    borderRadius: "6px",
                    fontSize: "0.95rem",
                  }}
                >
                  <option value="1">Manhã (06:00 - 18:00)</option>
                  <option value="2">Noite (18:00 - 06:00)</option>
                </select>
              </div>

              <button
                type="submit"
                className={styles.btn_refresh}
                style={{ width: "100%" }}
              >
                ✅ Cadastrar Funcionário
              </button>
            </form>
          </div>

          {/* Lista de Funcionários */}
          <div
            style={{
              background: "white",
              borderRadius: "12px",
              padding: "24px",
              boxShadow: "0 2px 8px rgba(0, 0, 0, 0.1)",
            }}
          >
            <h2 style={{ marginTop: 0 }}>📋 Funcionários Cadastrados</h2>
            {loading ? (
              <p>⏳ Carregando...</p>
            ) : employees.length === 0 ? (
              <p style={{ color: "#999" }}>Nenhum funcionário cadastrado</p>
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
                        Nome
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
                        Turno
                      </th>
                      <th
                        style={{
                          textAlign: "left",
                          padding: "12px",
                          fontWeight: "600",
                          color: "#667eea",
                        }}
                      >
                        Status
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {employees.map((emp) => (
                      <tr key={emp.id} style={{ borderBottom: "1px solid #e0e0e0" }}>
                        <td style={{ padding: "12px" }}>{emp.name}</td>
                        <td style={{ padding: "12px" }}>{emp.registration}</td>
                        <td style={{ padding: "12px" }}>{emp.shift_name}</td>
                        <td style={{ padding: "12px" }}>
                          <span
                            style={{
                              background:
                                emp.face_status === "ATIVO"
                                  ? "#d4edda"
                                  : "#fff3cd",
                              color:
                                emp.face_status === "ATIVO"
                                  ? "#155724"
                                  : "#856404",
                              padding: "4px 8px",
                              borderRadius: "4px",
                              fontSize: "0.85rem",
                              fontWeight: "600",
                            }}
                          >
                            {emp.face_status}
                          </span>
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
    </div>
  );
}
