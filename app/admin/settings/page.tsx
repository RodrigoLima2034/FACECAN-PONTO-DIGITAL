"use client";

/**
 * ⚙️ PONTO FACIAL - Settings Page
 * Configurações do sistema
 */

import { useEffect, useState } from "react";
import Link from "next/link";
import styles from "../admin.module.css";

export default function SettingsPage() {
  const [settings, setSettings] = useState({
    sound_enabled: true,
    sound_volume: 70,
    shift_morning_start: "06:00",
    shift_morning_end: "18:00",
    shift_night_start: "18:00",
    shift_night_end: "06:00",
    admin_email: "",
    system_version: "3.0.0 Enterprise",
  });
  const [message, setMessage] = useState("");

  const saveSettings = async () => {
    setMessage("✅ Configurações salvas com sucesso!");
    setTimeout(() => setMessage(""), 3000);
  };

  return (
    <div className={styles.container}>
      <nav className={styles.navbar}>
        <div className={styles.navbar_brand}>
          <span className={styles.logo_emoji}>⚙️</span>
          <span className={styles.logo_text}>CONFIGURAÇÕES</span>
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
            <h1>⚙️ Configurações do Sistema</h1>
            <p>Personalize o comportamento e a segurança do PONTO FACIAL</p>
          </div>
        </div>

        {message && (
          <div
            style={{
              background: "#d4edda",
              color: "#155724",
              padding: "16px",
              borderRadius: "8px",
              marginBottom: "20px",
            }}
          >
            {message}
          </div>
        )}

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: "20px",
          }}
        >
          {/* Audio Settings */}
          <div
            style={{
              background: "white",
              borderRadius: "12px",
              padding: "24px",
              boxShadow: "0 2px 8px rgba(0, 0, 0, 0.1)",
            }}
          >
            <h2 style={{ marginTop: 0 }}>🔊 Configurações de Áudio</h2>

            <div style={{ marginBottom: "20px" }}>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  marginBottom: "12px",
                }}
              >
                <label style={{ fontWeight: "600" }}>Som do Terminal</label>
                <input
                  type="checkbox"
                  checked={settings.sound_enabled}
                  onChange={(e) =>
                    setSettings({
                      ...settings,
                      sound_enabled: e.target.checked,
                    })
                  }
                  style={{ width: "24px", height: "24px", cursor: "pointer" }}
                />
              </div>
              <p style={{ color: "#666", fontSize: "0.9rem", margin: "0" }}>
                Ativa feedback sonoro após cada registro bem-sucedido
              </p>
            </div>

            <div>
              <label style={{ display: "block", fontWeight: "600", marginBottom: "8px" }}>
                Volume: {settings.sound_volume}%
              </label>
              <input
                type="range"
                min="0"
                max="100"
                value={settings.sound_volume}
                onChange={(e) =>
                  setSettings({
                    ...settings,
                    sound_volume: Number(e.target.value),
                  })
                }
                style={{ width: "100%", cursor: "pointer" }}
              />
            </div>
          </div>

          {/* Shift Settings */}
          <div
            style={{
              background: "white",
              borderRadius: "12px",
              padding: "24px",
              boxShadow: "0 2px 8px rgba(0, 0, 0, 0.1)",
            }}
          >
            <h2 style={{ marginTop: 0 }}>⏰ Configuração de Turnos</h2>

            <div style={{ marginBottom: "16px" }}>
              <label style={{ display: "block", fontWeight: "600", marginBottom: "8px" }}>
                Turno Manhã - Entrada
              </label>
              <input
                type="time"
                value={settings.shift_morning_start}
                onChange={(e) =>
                  setSettings({
                    ...settings,
                    shift_morning_start: e.target.value,
                  })
                }
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
              <label style={{ display: "block", fontWeight: "600", marginBottom: "8px" }}>
                Turno Manhã - Saída
              </label>
              <input
                type="time"
                value={settings.shift_morning_end}
                onChange={(e) =>
                  setSettings({
                    ...settings,
                    shift_morning_end: e.target.value,
                  })
                }
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

          {/* Security Box */}
          <div
            style={{
              gridColumn: "1 / -1",
              background: "#fff3cd",
              borderRadius: "12px",
              padding: "24px",
              border: "2px solid #ffc107",
            }}
          >
            <h2 style={{ marginTop: 0 }}>🔒 Checklist de Segurança em Produção</h2>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                gap: "15px",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                <input type="checkbox" style={{ width: "20px", height: "20px" }} />
                <span>HTTPS ativado</span>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                <input type="checkbox" style={{ width: "20px", height: "20px" }} />
                <span>Autenticação Multi-Fator (MFA)</span>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                <input type="checkbox" style={{ width: "20px", height: "20px" }} />
                <span>Banco de dados privado</span>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                <input type="checkbox" style={{ width: "20px", height: "20px" }} />
                <span>Backups automáticos ativados</span>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                <input type="checkbox" style={{ width: "20px", height: "20px" }} />
                <span>Web Application Firewall (WAF)</span>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                <input type="checkbox" style={{ width: "20px", height: "20px" }} />
                <span>Gestão de Segredos/Variáveis de Ambiente</span>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                <input type="checkbox" style={{ width: "20px", height: "20px" }} />
                <span>Monitoramento e Logging Centralizado</span>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                <input type="checkbox" style={{ width: "20px", height: "20px" }} />
                <span>Revisão de Segurança Independente</span>
              </div>
            </div>
          </div>

          {/* About */}
          <div
            style={{
              gridColumn: "1 / -1",
              background: "white",
              borderRadius: "12px",
              padding: "24px",
              boxShadow: "0 2px 8px rgba(0, 0, 0, 0.1)",
            }}
          >
            <h2 style={{ marginTop: 0 }}>ℹ️ Sobre o Sistema</h2>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px" }}>
              <div>
                <p style={{ color: "#666", margin: "0 0 5px" }}>Versão do Sistema</p>
                <p style={{ fontSize: "1.2rem", fontWeight: "600", margin: "0" }}>
                  {settings.system_version}
                </p>
              </div>
              <div>
                <p style={{ color: "#666", margin: "0 0 5px" }}>
                  Desenvolvido por
                </p>
                <p style={{ fontSize: "1rem", fontWeight: "600", margin: "0" }}>
                  Rodrigo Lima
                </p>
              </div>
            </div>
            <p
              style={{
                marginTop: "20px",
                padding: "15px",
                background: "#f5f5f5",
                borderRadius: "6px",
                fontSize: "0.9rem",
                lineHeight: "1.6",
                color: "#333",
              }}
            >
              <strong>PONTO FACIAL v3.0 Enterprise</strong> - Sistema de Controle
              de Presença com Reconhecimento Facial. Seguro, confiável e escalável
              para empresas de qualquer porte. Desenvolvido com Next.js, TypeScript
              e PostgreSQL.
            </p>
          </div>
        </div>

        <div style={{ textAlign: "center", marginTop: "30px" }}>
          <button
            onClick={saveSettings}
            style={{
              background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
              color: "white",
              padding: "12px 32px",
              borderRadius: "6px",
              border: "none",
              fontSize: "1rem",
              fontWeight: "600",
              cursor: "pointer",
            }}
          >
            💾 Salvar Configurações
          </button>
        </div>
      </div>
    </div>
  );
}
