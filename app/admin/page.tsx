"use client";

/**
 * 🔐 PONTO FACIAL - Administrative Dashboard
 * Painel de controle completo do sistema
 * Version: 3.0.0 Enterprise
 */

import { useEffect, useState } from "react";
import Link from "next/link";
import styles from "./admin.module.css";

interface DashboardStats {
  total_employees: number;
  total_records: number;
  pending_biometries: number;
  system_health: "healthy" | "warning" | "critical";
}

interface Employee {
  id: number;
  registration: string;
  name: string;
  department: string;
  shift_name: string;
  face_status: string;
  status: string;
}

interface Record {
  id: number;
  registration: string;
  name: string;
  event_type: string;
  occurred_at: string;
}

export default function AdminDashboard() {
  const [logged, setLogged] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [records, setRecords] = useState<Record[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [user, setUser] = useState<{ name?: string; email?: string } | null>(
    null
  );

  useEffect(() => {
    checkLogin();
  }, []);

  /**
   * Verifica se usuário está autenticado
   */
  const checkLogin = async () => {
    try {
      const response = await fetch("/api/admin/me");
      if (response.ok) {
        const data = (await response.json()) as {
          name?: string;
          email?: string;
        };
        setUser(data);
        setLogged(true);
        await loadDashboardData();
      }
    } catch (err) {
      console.error("Erro ao verificar autenticação:", err);
    } finally {
      setLoading(false);
    }
  };

  /**
   * Realiza login do administrador
   */
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setLoading(true);
      const response = await fetch("/api/admin/login", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      if (response.ok) {
        setLogged(true);
        setPassword("");
        setEmail("");
        await loadDashboardData();
      } else {
        setError("❌ Credenciais inválidas. Tente novamente.");
      }
    } catch (err) {
      setError(`❌ Erro ao fazer login: ${err instanceof Error ? err.message : "Desconhecido"}`);
    } finally {
      setLoading(false);
    }
  };

  /**
   * Carrega dados do dashboard
   */
  const loadDashboardData = async () => {
    try {
      setLoading(true);
      const [empResponse, recResponse] = await Promise.all([
        fetch("/api/employees"),
        fetch("/api/attendance"),
      ]);

      const empData = (await empResponse.json()) as { employees?: Employee[] };
      const recData = (await recResponse.json()) as { records?: Record[] };

      const emps = empData.employees || [];
      const recs = recData.records || [];

      setEmployees(emps);
      setRecords(recs);

      setStats({
        total_employees: emps.length,
        total_records: recs.length,
        pending_biometries: emps.filter((e) => e.face_status !== "ATIVO").length,
        system_health: "healthy",
      });
    } catch (err) {
      setError(
        `❌ Erro ao carregar dados: ${err instanceof Error ? err.message : "Desconhecido"}`
      );
    } finally {
      setLoading(false);
    }
  };

  /**
   * Realiza logout
   */
  const handleLogout = async () => {
    try {
      await fetch("/api/admin/logout", { method: "POST" });
      setLogged(false);
      setUser(null);
      setEmail("");
      setPassword("");
    } catch (err) {
      alert("❌ Erro ao fazer logout");
    }
  };

  // Tela de login
  if (!logged) {
    return (
      <div className={styles.container}>
        <div
          style={{
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            minHeight: "100vh",
            background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
          }}
        >
          <div
            style={{
              background: "white",
              borderRadius: "16px",
              padding: "40px",
              maxWidth: "400px",
              width: "100%",
              boxShadow: "0 20px 60px rgba(0, 0, 0, 0.3)",
            }}
          >
            <div style={{ textAlign: "center", marginBottom: "30px" }}>
              <div style={{ fontSize: "3rem", marginBottom: "10px" }}>🔐</div>
              <h1 style={{ color: "#333", margin: "0 0 8px" }}>PONTO FACIAL</h1>
              <p style={{ color: "#999", margin: "0", fontSize: "0.9rem" }}>
                Acesso administrativo
              </p>
            </div>

            {error && (
              <div
                style={{
                  background: "#f8d7da",
                  color: "#721c24",
                  padding: "12px",
                  borderRadius: "6px",
                  marginBottom: "20px",
                  fontSize: "0.9rem",
                }}
              >
                {error}
              </div>
            )}

            <form onSubmit={handleLogin}>
              <div style={{ marginBottom: "16px" }}>
                <label
                  style={{
                    display: "block",
                    color: "#333",
                    fontWeight: "600",
                    marginBottom: "8px",
                    fontSize: "0.9rem",
                  }}
                >
                  E-mail
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="admin@empresa.local"
                  required
                  style={{
                    width: "100%",
                    padding: "12px",
                    border: "2px solid #e0e0e0",
                    borderRadius: "6px",
                    fontSize: "0.95rem",
                    fontFamily: "inherit",
                    boxSizing: "border-box",
                  }}
                />
              </div>

              <div style={{ marginBottom: "20px" }}>
                <label
                  style={{
                    display: "block",
                    color: "#333",
                    fontWeight: "600",
                    marginBottom: "8px",
                    fontSize: "0.9rem",
                  }}
                >
                  Senha
                </label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  style={{
                    width: "100%",
                    padding: "12px",
                    border: "2px solid #e0e0e0",
                    borderRadius: "6px",
                    fontSize: "0.95rem",
                    fontFamily: "inherit",
                    boxSizing: "border-box",
                  }}
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                style={{
                  width: "100%",
                  padding: "12px",
                  background: loading
                    ? "#ccc"
                    : "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
                  color: "white",
                  border: "none",
                  borderRadius: "6px",
                  fontSize: "1rem",
                  fontWeight: "600",
                  cursor: loading ? "not-allowed" : "pointer",
                  transition: "all 0.3s ease",
                }}
              >
                {loading ? "⏳ Entrando..." : "🔓 Entrar"}
              </button>
            </form>

            <p
              style={{
                textAlign: "center",
                color: "#999",
                fontSize: "0.85rem",
                marginTop: "20px",
                lineHeight: "1.5",
              }}
            >
              Configure as variáveis ADMIN_EMAIL, ADMIN_PASSWORD e SESSION_SECRET
              no arquivo .env antes de usar em produção.
            </p>

            <Link
              href="/"
              style={{
                display: "block",
                textAlign: "center",
                color: "#667eea",
                textDecoration: "none",
                marginTop: "15px",
                fontSize: "0.9rem",
                fontWeight: "600",
              }}
            >
              ← Voltar ao terminal
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // Dashboard principal
  return (
    <div className={styles.container}>
      {/* Navbar */}
      <nav className={styles.navbar}>
        <div className={styles.navbar_brand}>
          <span className={styles.logo_emoji}>🔐</span>
          <span className={styles.logo_text}>PONTO FACIAL</span>
        </div>
        <div className={styles.navbar_user}>
          <span className={styles.user_name}>
            {user?.name || "Administrador"}
          </span>
          <button
            className={styles.btn_logout}
            onClick={handleLogout}
            title="Fazer logout"
          >
            🚪 Sair
          </button>
        </div>
      </nav>

      {/* Conteúdo Principal */}
      <div className={styles.main}>
        {/* Header */}
        <div className={styles.header}>
          <div className={styles.header_content}>
            <h1>📊 Dashboard Administrativo</h1>
            <p>Bem-vindo ao painel de controle do PONTO FACIAL v3.0 Enterprise</p>
          </div>
          <button
            className={styles.btn_refresh}
            onClick={loadDashboardData}
            disabled={loading}
          >
            {loading ? "⏳" : "🔄"} Atualizar
          </button>
        </div>

        {/* Alertas */}
        {error && <div className={styles.alert_error}>{error}</div>}

        {/* Stats Cards */}
        <div className={styles.stats_container}>
          {!loading && stats ? (
            <>
              <div className={styles.stat_card}>
                <div className={styles.stat_icon}>👥</div>
                <div className={styles.stat_content}>
                  <p className={styles.stat_label}>Funcionários</p>
                  <p className={styles.stat_value}>{stats.total_employees}</p>
                </div>
              </div>

              <div className={styles.stat_card}>
                <div className={styles.stat_icon}>📋</div>
                <div className={styles.stat_content}>
                  <p className={styles.stat_label}>Registros</p>
                  <p className={styles.stat_value}>{stats.total_records}</p>
                </div>
              </div>

              <div className={styles.stat_card}>
                <div className={styles.stat_icon}>⚠️</div>
                <div className={styles.stat_content}>
                  <p className={styles.stat_label}>Pendências</p>
                  <p className={styles.stat_value}>{stats.pending_biometries}</p>
                </div>
              </div>

              <div className={styles.stat_card}>
                <div className={styles.stat_icon}>🟢</div>
                <div className={styles.stat_content}>
                  <p className={styles.stat_label}>Saúde do Sistema</p>
                  <p className={styles.stat_value}>
                    {stats.system_health === "healthy"
                      ? "Ótima"
                      : stats.system_health === "warning"
                        ? "Aviso"
                        : "Crítica"}
                  </p>
                </div>
              </div>
            </>
          ) : (
            <div className={styles.loading}>⏳ Carregando dados...</div>
          )}
        </div>

        {/* Menu de Navegação */}
        <div className={styles.menu_section}>
          <h2>🎯 Menu Principal</h2>
          <div className={styles.menu_grid}>
            <Link
              href="/admin/employees"
              className={styles.menu_card}
              style={
                {
                  "--card-color": "#667eea",
                } as React.CSSProperties
              }
            >
              <div className={styles.menu_icon}>👥</div>
              <div className={styles.menu_content}>
                <h3>Funcionários</h3>
                <p>Gerenciar funcionários e seus dados</p>
              </div>
              <div className={styles.menu_arrow}>→</div>
            </Link>

            <Link
              href="/admin/attendance"
              className={styles.menu_card}
              style={
                {
                  "--card-color": "#4facfe",
                } as React.CSSProperties
              }
            >
              <div className={styles.menu_icon}>✅</div>
              <div className={styles.menu_content}>
                <h3>Presença</h3>
                <p>Visualizar registros de presença</p>
              </div>
              <div className={styles.menu_arrow}>→</div>
            </Link>

            <Link
              href="/reports"
              className={styles.menu_card}
              style={
                {
                  "--card-color": "#f093fb",
                } as React.CSSProperties
              }
            >
              <div className={styles.menu_icon}>📊</div>
              <div className={styles.menu_content}>
                <h3>Relatórios</h3>
                <p>Gerar análises e relatórios profissionais</p>
              </div>
              <div className={styles.menu_arrow}>→</div>
            </Link>

            <a
              href="/api/report?format=csv"
              className={styles.menu_card}
              style={
                {
                  "--card-color": "#764ba2",
                } as React.CSSProperties
              }
            >
              <div className={styles.menu_icon}>📥</div>
              <div className={styles.menu_content}>
                <h3>Exportar CSV</h3>
                <p>Baixar registros em formato CSV</p>
              </div>
              <div className={styles.menu_arrow}>→</div>
            </a>

            <a
              href="/api/report?format=pdf"
              className={styles.menu_card}
              style={
                {
                  "--card-color": "#fa709a",
                } as React.CSSProperties
              }
            >
              <div className={styles.menu_icon}>📄</div>
              <div className={styles.menu_content}>
                <h3>Exportar PDF</h3>
                <p>Gerar relatório em PDF</p>
              </div>
              <div className={styles.menu_arrow}>→</div>
            </a>

            <Link
              href="/admin/settings"
              className={styles.menu_card}
              style={
                {
                  "--card-color": "#30b0fe",
                } as React.CSSProperties
              }
            >
              <div className={styles.menu_icon}>⚙️</div>
              <div className={styles.menu_content}>
                <h3>Configurações</h3>
                <p>Personalizar sistema e segurança</p>
              </div>
              <div className={styles.menu_arrow}>→</div>
            </Link>
          </div>
        </div>

        {/* Últimos Registros */}
        {records.length > 0 && (
          <div className={styles.system_info}>
            <h2>📝 Últimos Registros</h2>
            <div
              style={{
                overflowX: "auto",
              }}
            >
              <table
                style={{
                  width: "100%",
                  borderCollapse: "collapse",
                  fontSize: "0.9rem",
                }}
              >
                <thead>
                  <tr
                    style={{
                      borderBottom: "2px solid #e0e0e0",
                    }}
                  >
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
                      Data/Hora
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {records.slice(0, 10).map((record) => (
                    <tr
                      key={record.id}
                      style={{
                        borderBottom: "1px solid #e0e0e0",
                      }}
                    >
                      <td style={{ padding: "12px" }}>{record.name}</td>
                      <td style={{ padding: "12px" }}>{record.registration}</td>
                      <td style={{ padding: "12px" }}>
                        <span
                          style={{
                            background: "#e0e0ff",
                            color: "#667eea",
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
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* Footer */}
      <footer className={styles.footer}>
        <p>
          © 2024 PONTO FACIAL - Sistema de Presença com Reconhecimento Facial
          v3.0 Enterprise | Todos os direitos reservados
        </p>
      </footer>
    </div>
  );
}
