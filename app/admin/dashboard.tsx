"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";

type DashboardStats = {
  total_employees: number;
  checked_in_today: number;
  late_arrivals: number;
  avg_confidence: number;
  system_uptime: string;
  total_records_today: number;
  failed_recognitions: number;
};

type ChartData = {
  time: string;
  success: number;
  failed: number;
};

export default function AdminDashboard() {
  const [stats, setStats] = useState<DashboardStats>({
    total_employees: 0,
    checked_in_today: 0,
    late_arrivals: 0,
    avg_confidence: 0,
    system_uptime: "99.9%",
    total_records_today: 0,
    failed_recognitions: 0,
  });

  const [chartData, setChartData] = useState<ChartData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
    const interval = setInterval(fetchDashboardData, 30000); // Refresh every 30s
    return () => clearInterval(interval);
  }, []);

  const fetchDashboardData = async () => {
    try {
      const res = await fetch("/api/admin/dashboard");
      if (res.ok) {
        const data = await res.json();
        setStats(data.stats);
        setChartData(data.chartData);
      }
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const StatCard = ({
    title,
    value,
    icon,
    color,
  }: {
    title: string;
    value: string | number;
    icon: string;
    color: string;
  }) => (
    <motion.div
      className="stat-card"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      style={{ borderLeft: `4px solid ${color}` }}
    >
      <div className="stat-icon">{icon}</div>
      <div className="stat-content">
        <h3>{title}</h3>
        <p>{value}</p>
      </div>
    </motion.div>
  );

  return (
    <div className="dashboard-container">
      <header className="dashboard-header">
        <div>
          <h1>Dashboard Administrativo</h1>
          <p>Sistema de Reconhecimento Facial • Ponto Digital Enterprise</p>
        </div>
        <div className="header-actions">
          <button className="btn-secondary">Exportar Relatório</button>
          <button className="btn-primary">Configurações</button>
        </div>
      </header>

      {/* Stats Grid */}
      <section className="stats-grid">
        <StatCard
          title="Funcionários"
          value={stats.total_employees}
          icon="👥"
          color="#00d084"
        />
        <StatCard
          title="Registrados Hoje"
          value={stats.checked_in_today}
          icon="✅"
          color="#0099ff"
        />
        <StatCard
          title="Atrasos"
          value={stats.late_arrivals}
          icon="⏰"
          color="#ff9800"
        />
        <StatCard
          title="Confiança Média"
          value={`${(stats.avg_confidence * 100).toFixed(1)}%`}
          icon="📊"
          color="#4caf50"
        />
        <StatCard
          title="Registros Hoje"
          value={stats.total_records_today}
          icon="📝"
          color="#9c27b0"
        />
        <StatCard
          title="Falhas"
          value={stats.failed_recognitions}
          icon="❌"
          color="#f44336"
        />
      </section>

      {/* Charts */}
      <section className="charts-section">
        <div className="chart-card">
          <h2>Registros por Hora</h2>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#2a3142" />
              <XAxis dataKey="time" stroke="#7a8290" />
              <YAxis stroke="#7a8290" />
              <Tooltip
                contentStyle={{
                  background: "#1d2434",
                  border: "1px solid #2a3142",
                }}
              />
              <Legend />
              <Bar dataKey="success" fill="#00d084" name="Sucesso" />
              <Bar dataKey="failed" fill="#ff4444" name="Falhas" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="chart-card">
          <h2>Confiança ao Longo do Dia</h2>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#2a3142" />
              <XAxis dataKey="time" stroke="#7a8290" />
              <YAxis stroke="#7a8290" />
              <Tooltip
                contentStyle={{
                  background: "#1d2434",
                  border: "1px solid #2a3142",
                }}
              />
              <Legend />
              <Line
                type="monotone"
                dataKey="success"
                stroke="#00d084"
                strokeWidth={2}
                name="Taxa Sucesso"
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </section>

      {/* System Info */}
      <section className="system-info">
        <div className="info-card">
          <h3>Status do Sistema</h3>
          <div className="info-row">
            <span>Uptime:</span>
            <strong>{stats.system_uptime}</strong>
          </div>
          <div className="info-row">
            <span>Integração Oracle:</span>
            <strong style={{ color: "#00d084" }}>✅ Conectado</strong>
          </div>
          <div className="info-row">
            <span>AWS S3:</span>
            <strong style={{ color: "#00d084" }}>✅ Ativo</strong>
          </div>
          <div className="info-row">
            <span>Servidores Ativos:</span>
            <strong>5</strong>
          </div>
        </div>

        <div className="info-card">
          <h3>Alertas</h3>
          <div className="alert alert-info">
            📌 Sincronização Oracle em progresso
          </div>
          <div className="alert alert-success">
            ✅ Backup automático realizado há 2h
          </div>
          <div className="alert alert-warning">
            ⚠️ Taxa de falha acima de 5% em 2 terminais
          </div>
        </div>

        <div className="info-card">
          <h3>Configuração</h3>
          <div className="config-item">
            <label>Modo Reconhecimento:</label>
            <select>
              <option>AWS Rekognition</option>
              <option>Modelo Local</option>
              <option>Híbrido</option>
            </select>
          </div>
          <div className="config-item">
            <label>Confiança Mínima:</label>
            <input type="range" min="0.7" max="0.99" step="0.01" value="0.85" />
            <span>85%</span>
          </div>
          <button className="btn-primary-small">Salvar Configurações</button>
        </div>
      </section>

      <style jsx>{`
        .dashboard-container {
          min-height: 100vh;
          background: linear-gradient(135deg, var(--bg) 0%, var(--bg-secondary) 100%);
          padding: 30px;
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
        }

        .dashboard-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          margin-bottom: 40px;
        }

        .dashboard-header h1 {
          margin: 0;
          font-size: 32px;
          color: var(--text);
        }

        .dashboard-header p {
          margin: 6px 0 0;
          color: var(--text-secondary);
          font-size: 13px;
        }

        .header-actions {
          display: flex;
          gap: 12px;
        }

        .btn-primary,
        .btn-secondary,
        .btn-primary-small {
          padding: 10px 16px;
          border: none;
          border-radius: 8px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.3s;
        }

        .btn-primary {
          background: var(--accent);
          color: #000;
        }

        .btn-primary:hover {
          background: var(--accent-light);
          transform: translateY(-2px);
        }

        .btn-secondary {
          background: transparent;
          border: 1px solid var(--border);
          color: var(--text-secondary);
        }

        .btn-secondary:hover {
          background: rgba(255, 255, 255, 0.05);
        }

        .btn-primary-small {
          background: var(--accent);
          color: #000;
          padding: 8px 12px;
          font-size: 11px;
          width: 100%;
        }

        .stats-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
          gap: 16px;
          margin-bottom: 40px;
        }

        .stat-card {
          display: flex;
          gap: 16px;
          align-items: center;
          padding: 20px;
          background: rgba(29, 36, 52, 0.7);
          border: 1px solid var(--border);
          border-radius: 12px;
          backdrop-filter: blur(10px);
          transition: transform 0.3s, box-shadow 0.3s;
        }

        .stat-card:hover {
          transform: translateY(-4px);
          box-shadow: 0 12px 30px rgba(0, 208, 132, 0.2);
        }

        .stat-icon {
          font-size: 32px;
        }

        .stat-content h3 {
          margin: 0 0 4px;
          font-size: 12px;
          color: var(--text-secondary);
          letter-spacing: 0.5px;
        }

        .stat-content p {
          margin: 0;
          font-size: 28px;
          font-weight: 700;
          color: var(--text);
        }

        .charts-section {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(500px, 1fr));
          gap: 20px;
          margin-bottom: 40px;
        }

        .chart-card {
          padding: 24px;
          background: rgba(29, 36, 52, 0.7);
          border: 1px solid var(--border);
          border-radius: 12px;
          backdrop-filter: blur(10px);
        }

        .chart-card h2 {
          margin: 0 0 20px;
          font-size: 16px;
          color: var(--text);
        }

        .system-info {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
          gap: 20px;
        }

        .info-card {
          padding: 24px;
          background: rgba(29, 36, 52, 0.7);
          border: 1px solid var(--border);
          border-radius: 12px;
          backdrop-filter: blur(10px);
        }

        .info-card h3 {
          margin: 0 0 16px;
          font-size: 14px;
          color: var(--text);
          font-weight: 600;
        }

        .info-row {
          display: flex;
          justify-content: space-between;
          padding: 8px 0;
          font-size: 12px;
          color: var(--text-secondary);
        }

        .info-row strong {
          color: var(--text);
          font-weight: 600;
        }

        .alert {
          padding: 10px 12px;
          border-radius: 8px;
          font-size: 12px;
          margin-bottom: 8px;
          border-left: 3px solid;
        }

        .alert-info {
          background: rgba(0, 153, 255, 0.1);
          border-left-color: #0099ff;
          color: #6bbbff;
        }

        .alert-success {
          background: rgba(76, 175, 80, 0.1);
          border-left-color: #4caf50;
          color: #81c784;
        }

        .alert-warning {
          background: rgba(255, 152, 0, 0.1);
          border-left-color: #ff9800;
          color: #ffb74d;
        }

        .config-item {
          display: grid;
          gap: 6px;
          margin-bottom: 12px;
          padding-bottom: 12px;
          border-bottom: 1px solid var(--border);
        }

        .config-item label {
          font-size: 11px;
          color: var(--text-secondary);
          font-weight: 600;
        }

        .config-item input,
        .config-item select {
          padding: 8px;
          background: #1d2434;
          border: 1px solid var(--border);
          border-radius: 6px;
          color: var(--text);
          font-size: 12px;
        }

        .config-item span {
          font-size: 12px;
          color: var(--accent);
          font-weight: 600;
        }

        @media (max-width: 1024px) {
          .stats-grid {
            grid-template-columns: repeat(2, 1fr);
          }

          .charts-section {
            grid-template-columns: 1fr;
          }
        }

        @media (max-width: 640px) {
          .dashboard-container {
            padding: 16px;
          }

          .dashboard-header {
            flex-direction: column;
            gap: 16px;
          }

          .stats-grid {
            grid-template-columns: 1fr;
          }

          .chart-card {
            min-width: auto;
          }
        }
      `}</style>
    </div>
  );
}
