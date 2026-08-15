"use client";

import { useCallback, useEffect, useRef, useState } from "react";

type Employee = { id: number; registration: string; name: string; department: string; shift_name: string; face_status: string };

type TerminalState = "camera" | "detecting" | "success" | "error";

export default function Home() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const scanTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const cooldownRef = useRef(false);
  const [clock, setClock] = useState(new Date());
  const [camera, setCamera] = useState(false);
  const [state, setState] = useState<TerminalState>("camera");
  const [message, setMessage] = useState("A câmera será iniciada automaticamente");
  const [lastRegistration, setLastRegistration] = useState<string | null>(null);

  useEffect(() => {
    const timer = setInterval(() => setClock(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const stopCamera = useCallback(() => {
    if (scanTimerRef.current) clearInterval(scanTimerRef.current);
    scanTimerRef.current = null;
    if (streamRef.current) streamRef.current.getTracks().forEach((track) => track.stop());
    streamRef.current = null;
    setCamera(false);
  }, []);

  const startCamera = useCallback(async () => {
    if (!navigator.mediaDevices?.getUserMedia) {
      setState("error"); setMessage("Este navegador não oferece acesso à câmera."); return;
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "user", width: { ideal: 1280 }, height: { ideal: 720 } }, audio: false });
      streamRef.current = stream;
      if (videoRef.current) { videoRef.current.srcObject = stream; await videoRef.current.play(); }
      setCamera(true); setState("detecting"); setMessage("Aproxime-se da câmera");
    } catch {
      setState("error"); setMessage("Não foi possível acessar a câmera. Autorize o acesso no navegador.");
    }
  }, []);

  useEffect(() => { startCamera(); return () => stopCamera(); }, [startCamera, stopCamera]);

  useEffect(() => {
    if (!camera) return;
    scanTimerRef.current = setInterval(() => {
      if (!cooldownRef.current) setState((s) => s === "success" || s === "error" ? s : "detecting");
    }, 1000);
    return () => { if (scanTimerRef.current) clearInterval(scanTimerRef.current); scanTimerRef.current = null; };
  }, [camera]);

  const date = clock.toLocaleDateString("pt-BR", { weekday: "long", day: "2-digit", month: "long", year: "numeric" });
  const time = clock.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit", second: "2-digit" });
  const statusText = state === "success" ? "PONTO REGISTRADO" : state === "error" ? "ATENÇÃO" : camera ? "CÂMERA ATIVA" : "CÂMERA";

  return <main className="terminal">
    <header className="topbar">
      <div className="brand"><div className="brand-mark">F</div><div><strong>FACECAN</strong><span>PONTO FACIAL • ENTERPRISE</span></div></div>
      <a className="ghost-btn" href="/admin">Área administrativa</a>
    </header>
    <section className="terminal-grid">
      <div className="camera-card">
        <div className="card-head"><div><span className="eyebrow">TERMINAL DE PONTO</span><h1>Reconhecimento facial</h1></div><span className={camera ? "status live" : "status"}><i /> {statusText}</span></div>
        <div className="camera-frame">
          <video ref={videoRef} muted playsInline autoPlay />
          <div className="face-guide"><span/><span/><span/><span/></div>
          {!camera && <div className="camera-placeholder"><div className="camera-icon">◉</div><p>{message}</p><button className="primary-btn" onClick={startCamera}>Ativar câmera</button></div>}
        </div>
        <div className="terminal-message"><div className={`pulse ${state === "error" ? "pulse-error" : ""}`} /><span>{message}</span></div>
        {lastRegistration && <div className="last-registration"><small>ÚLTIMO REGISTRO</small><strong>{lastRegistration}</strong></div>}
        <div className="terminal-help">O reconhecimento é automático. Não há seleção manual de funcionário nem botão para bater ponto.</div>
      </div>
      <aside className="info-panel">
        <div className="clock">{time}</div><div className="date">{date}</div>
        <div className="rule-card"><span>REGRA AUTOMÁTICA</span><h3>Identificação sem toque</h3><p>O terminal mantém a câmera ativa e aguarda uma única pessoa diante do enquadramento.</p></div>
        <div className="shift-mini"><div><b>☀ Manhã</b><span>06:00–11:00 entrada</span><span>12:00–13:30 intervalo</span><span>17:00–18:00 saída</span></div><div><b>☾ Noite</b><span>18:00–22:00 entrada</span><span>01:20–07:00 saída</span></div></div>
        <div className="security-note">🔒 Validação no servidor • registros auditáveis</div>
      </aside>
    </section>
  </main>;
}
