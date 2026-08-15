"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { motion } from "framer-motion";

type Employee = {
  id: number;
  registration: string;
  name: string;
  department: string;
  shift_name: string;
  photo_url?: string;
};

type AttendanceRecord = {
  id: number;
  employee_id: number;
  event: string;
  occurred_at: string;
  device_id: string;
};

export default function AttendancePage() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  
  const [cameraActive, setCameraActive] = useState(false);
  const [recognizedEmployee, setRecognizedEmployee] = useState<Employee | null>(null);
  const [lastRecord, setLastRecord] = useState<AttendanceRecord | null>(null);
  const [message, setMessage] = useState("Aguardando detecção de rosto");
  const [loading, setLoading] = useState(false);
  const [clock, setClock] = useState(new Date());
  const [stats, setStats] = useState({
    checked_in_today: 0,
    pending: 0,
    time_worked: "00:00"
  });

  // Clock update
  useEffect(() => {
    const timer = setInterval(() => setClock(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // Load stats
  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const res = await fetch("/api/attendance/stats");
      if (res.ok) {
        const data = await res.json();
        setStats(data);
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Start camera
  const startCamera = useCallback(async () => {
    try {
      const constraints = {
        video: {
          facingMode: "user",
          width: { ideal: 1280 },
          height: { ideal: 720 },
        },
        audio: false,
      };

      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
        setCameraActive(true);
        setMessage("📷 Câmera ativa • Aproxime seu rosto");
      }
    } catch (error) {
      setMessage("❌ Erro ao acessar câmera. Autorize no navegador.");
      console.error(error);
    }
  }, []);

  // Stop camera
  const stopCamera = useCallback(() => {
    if (videoRef.current?.srcObject) {
      const tracks = (videoRef.current.srcObject as MediaStream).getTracks();
      tracks.forEach((track) => track.stop());
      setCameraActive(false);
      setRecognizedEmployee(null);
    }
  }, []);

  // Capture and register face
  const captureFace = useCallback(async () => {
    if (!videoRef.current || !canvasRef.current) return;
    
    setLoading(true);
    try {
      const ctx = canvasRef.current.getContext("2d");
      if (ctx) {
        ctx.drawImage(videoRef.current, 0, 0, 1280, 720);
        const imageData = canvasRef.current.toDataURL("image/jpeg");

        // Send to API
        const res = await fetch("/api/attendance/recognize", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({
            image: imageData,
            device_id: "TABLET-TERMINAL-01",
            source: "FACE_RECOGNITION",
          }),
        });

        const data = await res.json();

        if (res.ok && data.employee) {
          setRecognizedEmployee(data.employee);
          setMessage(`✅ ${data.employee.name} • ${data.event || "Registrando..."}`);
          
          if (data.record) {
            setLastRecord(data.record);
            await fetchStats();
          }
          
          // Auto close after 3 seconds
          setTimeout(stopCamera, 3000);
        } else {
          setMessage(data.message || "❌ Rosto não identificado");
        }
      }
    } catch (error) {
      setMessage("❌ Erro ao processar imagem");
      console.error(error);
    } finally {
      setLoading(false);
    }
  }, [stopCamera]);

  const timeString = clock.toLocaleTimeString("pt-BR", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });

  const dateString = clock.toLocaleDateString("pt-BR", {
    weekday: "long",
    day: "2-digit",
    month: "long",
    year: "numeric",
  });

  return (
    <div className="attendance-page">
      {/* Header */}
      <header className="header-pro">
        <div className="header-brand">
          <div className="brand-icon">📊</div>
          <div className="brand-info">
            <h1>PONTO FACIAL ENTERPRISE</h1>
            <p>Sistema de Reconhecimento Facial • Oracle Integration</p>
          </div>
        </div>
        <div className="header-clock">
          <div className="time">{timeString}</div>
          <div className="date">{dateString}</div>
        </div>
      </header>

      {/* Main Grid - Tablet Responsive */}
      <main className="attendance-grid">
        {/* Camera Section */}
        <section className="camera-section">
          <div className="section-header">
            <h2>Registro de Ponto</h2>
            <span className={`status-badge ${cameraActive ? "active" : ""}`}>
              <i className="status-dot"></i>
              {cameraActive ? "CÂMERA ATIVA" : "AGUARDANDO"}
            </span>
          </div>

          <div className="camera-container">
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              className="camera-video"
            />
            <canvas ref={canvasRef} style={{ display: "none" }} width={1280} height={720} />
            
            {/* Face Detection Guide */}
            <div className="face-detection-overlay">
              <svg className="face-guide-svg" viewBox="0 0 300 300">
                <circle cx="150" cy="150" r="80" fill="none" stroke="currentColor" strokeWidth="2" />
                <path d="M70,100 L70,70 L100,70" fill="none" stroke="currentColor" strokeWidth="2" />
                <path d="M230,100 L230,70 L200,70" fill="none" stroke="currentColor" strokeWidth="2" />
                <path d="M70,200 L70,230 L100,230" fill="none" stroke="currentColor" strokeWidth="2" />
                <path d="M230,200 L230,230 L200,230" fill="none" stroke="currentColor" strokeWidth="2" />
              </svg>
            </div>

            {!cameraActive && (
              <motion.div
                className="camera-placeholder"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
              >
                <div className="placeholder-icon">📷</div>
                <p>Ative a câmera para iniciar</p>
                <button
                  className="btn-primary-large"
                  onClick={startCamera}
                >
                  Iniciar Câmera
                </button>
              </motion.div>
            )}
          </div>

          {/* Message Box */}
          <motion.div
            className="message-box"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <div className="message-icon">
              {loading ? "⏳" : recognizedEmployee ? "✅" : "ℹ️"}
            </div>
            <span>{message}</span>
          </motion.div>

          {/* Camera Controls */}
          {cameraActive && (
            <div className="camera-controls">
              <button
                className="btn-primary"
                onClick={captureFace}
                disabled={loading}
              >
                {loading ? "Processando..." : "Capturar Rosto"}
              </button>
              <button
                className="btn-secondary"
                onClick={stopCamera}
              >
                Cancelar
              </button>
            </div>
          )}
        </section>

        {/* Right Panel */}
        <aside className="info-section">
          {/* Stats */}
          <div className="stats-card">
            <h3>Hoje</h3>
            <div className="stat-item">
              <span className="stat-label">Entrada</span>
              <span className="stat-value">{stats.checked_in_today}</span>
            </div>
            <div className="stat-item">
              <span className="stat-label">Pendente</span>
              <span className="stat-value">{stats.pending}</span>
            </div>
            <div className="stat-item">
              <span className="stat-label">Trabalhado</span>
              <span className="stat-value">{stats.time_worked}</span>
            </div>
          </div>

          {/* Recognized Employee */}
          {recognizedEmployee && (
            <motion.div
              className="recognized-card"
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
            >
              {recognizedEmployee.photo_url && (
                <img src={recognizedEmployee.photo_url} alt={recognizedEmployee.name} />
              )}
              <div className="employee-info">
                <h4>{recognizedEmployee.name}</h4>
                <p>Mat: {recognizedEmployee.registration}</p>
                <p className="dept">{recognizedEmployee.department}</p>
                <p className="shift">Turno: {recognizedEmployee.shift_name}</p>
              </div>
              {lastRecord && (
                <div className="last-record">
                  <span className="event-badge">{lastRecord.event}</span>
                  <span className="time">{new Date(lastRecord.occurred_at).toLocaleTimeString("pt-BR")}</span>
                </div>
              )}
            </motion.div>
          )}

          {/* Info Box */}
          <div className="info-card">
            <h3>💡 Instruções</h3>
            <ul>
              <li>Posicione seu rosto centralizado</li>
              <li>Iluminação frontal adequada</li>
              <li>Mantenha distância de 40-60cm</li>
              <li>Sistema integrado com Oracle</li>
            </ul>
          </div>

          {/* Footer Info */}
          <div className="footer-info">
            <p>🔒 Dados criptografados • Conformidade LGPD</p>
            <p>📡 AWS Cloud • Oracle Integration</p>
          </div>
        </aside>
      </main>

      <style jsx>{`
        .attendance-page {
          min-height: 100vh;
          background: linear-gradient(135deg, var(--bg) 0%, var(--bg-secondary) 100%);
          padding: 20px;
        }

        .header-pro {
          display: flex;
          justify-content: space-between;
          align-items: center;
          max-width: 1400px;
          margin: 0 auto 30px;
          padding: 20px;
          background: rgba(29, 36, 52, 0.5);
          border: 1px solid var(--border);
          border-radius: 16px;
          backdrop-filter: blur(10px);
        }

        .header-brand {
          display: flex;
          gap: 16px;
          align-items: center;
        }

        .brand-icon {
          font-size: 32px;
        }

        .brand-info h1 {
          margin: 0;
          font-size: 24px;
          color: var(--text);
        }

        .brand-info p {
          margin: 4px 0 0;
          color: var(--text-secondary);
          font-size: 12px;
        }

        .header-clock {
          text-align: right;
        }

        .time {
          font-size: 32px;
          font-weight: 700;
          color: var(--accent);
        }

        .date {
          font-size: 12px;
          color: var(--text-muted);
          text-transform: capitalize;
          margin-top: 4px;
        }

        .attendance-grid {
          display: grid;
          grid-template-columns: 2fr 1fr;
          gap: 24px;
          max-width: 1400px;
          margin: 0 auto;
        }

        .camera-section,
        .info-section {
          background: rgba(29, 36, 52, 0.7);
          border: 1px solid var(--border);
          border-radius: 16px;
          padding: 24px;
          backdrop-filter: blur(10px);
        }

        .section-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 18px;
        }

        .section-header h2 {
          margin: 0;
          font-size: 18px;
        }

        .status-badge {
          display: flex;
          align-items: center;
          gap: 6px;
          font-size: 10px;
          color: var(--text-muted);
          border: 1px solid var(--border);
          padding: 6px 12px;
          border-radius: 999px;
          font-weight: 600;
          letter-spacing: 0.5px;
        }

        .status-badge.active {
          color: var(--accent);
          border-color: var(--accent);
        }

        .status-dot {
          display: inline-block;
          width: 6px;
          height: 6px;
          border-radius: 50%;
          background: var(--text-muted);
        }

        .status-badge.active .status-dot {
          background: var(--accent);
          box-shadow: 0 0 8px var(--accent);
          animation: pulse 2s infinite;
        }

        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.5; }
        }

        .camera-container {
          position: relative;
          width: 100%;
          aspect-ratio: 16 / 9;
          background: #000;
          border-radius: 12px;
          overflow: hidden;
          margin-bottom: 16px;
          border: 1px solid var(--border);
        }

        .camera-video {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }

        .face-detection-overlay {
          position: absolute;
          inset: 0;
          display: flex;
          align-items: center;
          justify-content: center;
          pointer-events: none;
        }

        .face-guide-svg {
          width: 180px;
          height: 180px;
          stroke: var(--accent-light);
          opacity: 0.6;
          filter: drop-shadow(0 0 10px var(--accent));
        }

        .camera-placeholder {
          position: absolute;
          inset: 0;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          background: linear-gradient(135deg, rgba(15, 20, 25, 0.9), rgba(26, 31, 46, 0.9));
        }

        .placeholder-icon {
          font-size: 60px;
          margin-bottom: 16px;
        }

        .camera-placeholder p {
          color: var(--text-secondary);
          font-size: 14px;
          margin-bottom: 20px;
        }

        .message-box {
          display: flex;
          gap: 12px;
          align-items: center;
          padding: 12px 16px;
          background: rgba(0, 208, 132, 0.1);
          border: 1px solid rgba(0, 208, 132, 0.2);
          border-radius: 10px;
          margin-bottom: 16px;
          font-size: 13px;
        }

        .message-icon {
          font-size: 18px;
        }

        .camera-controls {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 12px;
        }

        .btn-primary,
        .btn-secondary,
        .btn-primary-large {
          padding: 12px 16px;
          border: none;
          border-radius: 10px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.3s ease;
          font-size: 13px;
        }

        .btn-primary {
          background: var(--accent);
          color: #000;
        }

        .btn-primary:hover:not(:disabled) {
          background: var(--accent-light);
          transform: translateY(-2px);
          box-shadow: 0 8px 20px rgba(0, 208, 132, 0.3);
        }

        .btn-primary:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }

        .btn-secondary {
          background: transparent;
          border: 1px solid var(--border);
          color: var(--text-secondary);
        }

        .btn-secondary:hover {
          background: rgba(255, 255, 255, 0.05);
          border-color: var(--text-secondary);
        }

        .btn-primary-large {
          background: linear-gradient(135deg, var(--accent), var(--accent-light));
          color: #000;
          font-size: 16px;
          padding: 16px 24px;
          margin-bottom: 12px;
        }

        .btn-primary-large:hover {
          transform: translateY(-3px);
          box-shadow: 0 12px 30px rgba(0, 208, 132, 0.3);
        }

        .stats-card,
        .info-card {
          background: rgba(26, 31, 46, 0.5);
          border: 1px solid var(--border);
          border-radius: 12px;
          padding: 16px;
          margin-bottom: 16px;
        }

        .stats-card h3,
        .info-card h3 {
          margin: 0 0 12px;
          font-size: 13px;
          color: var(--text-secondary);
          letter-spacing: 0.5px;
        }

        .stat-item {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 8px 0;
          border-bottom: 1px solid rgba(42, 49, 66, 0.5);
        }

        .stat-item:last-child {
          border-bottom: none;
        }

        .stat-label {
          font-size: 12px;
          color: var(--text-muted);
        }

        .stat-value {
          font-size: 18px;
          font-weight: 700;
          color: var(--accent);
        }

        .recognized-card {
          background: linear-gradient(135deg, rgba(0, 208, 132, 0.1), rgba(0, 153, 255, 0.05));
          border: 2px solid var(--accent);
          border-radius: 12px;
          padding: 16px;
          margin-bottom: 16px;
          text-align: center;
        }

        .recognized-card img {
          width: 100px;
          height: 100px;
          border-radius: 50%;
          object-fit: cover;
          margin-bottom: 12px;
          border: 2px solid var(--accent);
        }

        .employee-info h4 {
          margin: 8px 0 4px;
          font-size: 14px;
          color: var(--accent);
        }

        .employee-info p {
          margin: 2px 0;
          font-size: 11px;
          color: var(--text-secondary);
        }

        .employee-info .dept {
          color: var(--text-muted);
          font-weight: 600;
        }

        .last-record {
          margin-top: 12px;
          display: flex;
          flex-direction: column;
          gap: 6px;
        }

        .event-badge {
          display: inline-block;
          background: var(--accent);
          color: #000;
          padding: 4px 8px;
          border-radius: 999px;
          font-size: 10px;
          font-weight: 700;
        }

        .last-record .time {
          font-size: 12px;
          color: var(--text-secondary);
        }

        .info-card ul {
          margin: 0;
          padding-left: 16px;
          list-style: none;
        }

        .info-card li {
          font-size: 11px;
          color: var(--text-secondary);
          margin: 6px 0;
          padding-left: 16px;
          position: relative;
        }

        .info-card li:before {
          content: "✓";
          position: absolute;
          left: 0;
          color: var(--accent);
          font-weight: 700;
        }

        .footer-info {
          font-size: 10px;
          color: var(--text-muted);
          padding-top: 16px;
          border-top: 1px solid var(--border);
        }

        .footer-info p {
          margin: 4px 0;
        }

        /* Tablet Responsive */
        @media (max-width: 1024px) {
          .attendance-grid {
            grid-template-columns: 1fr;
          }

          .header-pro {
            flex-direction: column;
            gap: 16px;
            text-align: center;
          }

          .header-brand {
            justify-content: center;
          }

          .camera-container {
            aspect-ratio: 4 / 3;
          }
        }

        /* Mobile Responsive */
        @media (max-width: 640px) {
          .attendance-page {
            padding: 12px;
          }

          .header-pro {
            padding: 12px;
            margin-bottom: 16px;
          }

          .section-header h2 {
            font-size: 16px;
          }

          .time {
            font-size: 24px;
          }

          .camera-section,
          .info-section {
            padding: 16px;
          }

          .camera-controls {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
    </div>
  );
}
