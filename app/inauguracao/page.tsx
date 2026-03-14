"use client";

import { useState, useEffect, useRef } from "react";
import Image from "next/image";

function formatPhone(value: string) {
  const n = value.replace(/\D/g, "").slice(0, 11);
  if (n.length <= 2) return n;
  if (n.length <= 7) return `(${n.slice(0, 2)}) ${n.slice(2)}`;
  return `(${n.slice(0, 2)}) ${n.slice(2, 7)}-${n.slice(7)}`;
}

const DATA_INAUGURACAO = new Date("2026-03-16T11:00:00-03:00");

function calcularContagem() {
  const agora = new Date().getTime();
  const alvo = DATA_INAUGURACAO.getTime();
  const diff = Math.max(0, alvo - agora);
  return {
    dias: Math.floor(diff / (1000 * 60 * 60 * 24)),
    horas: Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)),
    minutos: Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60)),
    segundos: Math.floor((diff % (1000 * 60)) / 1000),
    encerrado: diff === 0,
  };
}

function Bloco({ valor, label }: { valor: number; label: string }) {
  return (
    <div style={{ textAlign: "center" }}>
      <div
        style={{
          position: "relative",
          fontFamily: "'Space Mono', monospace",
          fontSize: "clamp(28px, 7vw, 58px)",
          fontWeight: 700,
          color: "#1C0E0D",
          lineHeight: 1,
          padding: "clamp(12px, 2.5vw, 18px) clamp(14px, 3vw, 22px)",
          border: "1.5px solid rgba(163,81,79,0.5)",
          minWidth: "clamp(68px, 16vw, 116px)",
          backgroundColor: "rgba(255,255,255,0.45)",
          boxShadow: "3px 3px 0 rgba(163,81,79,0.15)",
        }}
      >
        {/* Cantos decorativos */}
        <span style={{ position: "absolute", top: 4, left: 4, display: "block", width: 7, height: 7, borderTop: "1.5px solid #C4553A", borderLeft: "1.5px solid #C4553A" }} />
        <span style={{ position: "absolute", top: 4, right: 4, display: "block", width: 7, height: 7, borderTop: "1.5px solid #C4553A", borderRight: "1.5px solid #C4553A" }} />
        <span style={{ position: "absolute", bottom: 4, left: 4, display: "block", width: 7, height: 7, borderBottom: "1.5px solid #C4553A", borderLeft: "1.5px solid #C4553A" }} />
        <span style={{ position: "absolute", bottom: 4, right: 4, display: "block", width: 7, height: 7, borderBottom: "1.5px solid #C4553A", borderRight: "1.5px solid #C4553A" }} />
        {String(valor).padStart(2, "0")}
      </div>
      <div
        style={{
          fontFamily: "'Josefin Sans', sans-serif",
          fontSize: 9,
          letterSpacing: "0.22em",
          textTransform: "uppercase",
          color: "#8B6A68",
          marginTop: 8,
        }}
      >
        {label}
      </div>
    </div>
  );
}

export default function InauguracaoPage() {
  const [contagem, setContagem] = useState(calcularContagem());
  const [showPanel, setShowPanel] = useState(false);
  const [phone, setPhone] = useState("");
  const [verifying, setVerifying] = useState(false);
  const [erro, setErro] = useState("");
  const clicksRef = useRef(0);
  const clickTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    document.body.style.overflow = "hidden";
    document.documentElement.style.overflow = "hidden";
    const intervalo = setInterval(() => setContagem(calcularContagem()), 1000);
    return () => {
      clearInterval(intervalo);
      document.body.style.overflow = "";
      document.documentElement.style.overflow = "";
    };
  }, []);

  // Requer 3 cliques rápidos para abrir (evita abertura acidental)
  const handleHiddenClick = () => {
    clicksRef.current += 1;
    if (clickTimerRef.current) clearTimeout(clickTimerRef.current);
    clickTimerRef.current = setTimeout(() => { clicksRef.current = 0; }, 800);
    if (clicksRef.current >= 3) {
      clicksRef.current = 0;
      setShowPanel(true);
      setPhone("");
      setErro("");
    }
  };

  const handleVerificar = async () => {
    const phoneLimpo = phone.replace(/\D/g, "");
    if (phoneLimpo.length < 10) { setErro("Digite um telefone válido."); return; }
    setVerifying(true);
    setErro("");
    try {
      const res = await fetch("/api/auth/preview-access", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone: phoneLimpo }),
      });
      if (res.ok) {
        window.location.href = "/";
      } else {
        setErro("Acesso não autorizado.");
      }
    } catch {
      setErro("Erro ao verificar. Tente novamente.");
    } finally {
      setVerifying(false);
    }
  };

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;0,600;0,700;1,300;1,400;1,600&family=Josefin+Sans:wght@300;400;600&family=Space+Mono:wght@400;700&display=swap');

        @keyframes revelar {
          from { opacity: 0; transform: translateY(18px); }
          to   { opacity: 1; transform: translateY(0);  }
        }
        @keyframes piscar {
          0%, 100% { opacity: 0.55; }
          50%       { opacity: 0.15; }
        }
        @keyframes flutuarLogo {
          0%, 100% { transform: translateY(0px);  }
          50%       { transform: translateY(-6px); }
        }

        .r1 { animation: revelar 0.9s cubic-bezier(0.16,1,0.3,1) 0.05s both; }
        .r2 { animation: revelar 0.9s cubic-bezier(0.16,1,0.3,1) 0.20s both; }
        .r3 { animation: revelar 0.9s cubic-bezier(0.16,1,0.3,1) 0.35s both; }
        .r4 { animation: revelar 0.9s cubic-bezier(0.16,1,0.3,1) 0.50s both; }
        .r5 { animation: revelar 0.9s cubic-bezier(0.16,1,0.3,1) 0.65s both; }
        .r6 { animation: revelar 0.9s cubic-bezier(0.16,1,0.3,1) 0.80s both; }

        .logo-flutuando { animation: flutuarLogo 5s ease-in-out infinite; }
        .piscar-sep { animation: piscar 1.4s ease-in-out infinite; }
      `}</style>

      {/* Tela cheia */}
      <div
        style={{
          position: "fixed",
          inset: 0,
          zIndex: 9999,
          overflow: "hidden",
          backgroundColor: "#F4E8D1",
          backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='300' height='300'%3E%3Cfilter id='g'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.75' numOctaves='4' stitchTiles='stitch'/%3E%3CfeColorMatrix type='saturate' values='0'/%3E%3C/filter%3E%3Crect width='300' height='300' filter='url(%23g)' opacity='0.055'/%3E%3C/svg%3E")`,
          backgroundRepeat: "repeat",
          backgroundSize: "300px 300px",
        }}
      >
        {/* Marca d'água "16" — elemento chave da composição */}
        <div
          aria-hidden
          style={{
            position: "absolute",
            top: "50%",
            left: "50%",
            transform: "translate(-50%, -52%)",
            fontFamily: "'Cormorant Garamond', serif",
            fontSize: "clamp(300px, 60vw, 680px)",
            fontWeight: 700,
            color: "rgba(163,81,79,0.055)",
            lineHeight: 1,
            userSelect: "none",
            pointerEvents: "none",
            whiteSpace: "nowrap",
            letterSpacing: "-0.06em",
          }}
        >
          16
        </div>

        {/* Cantos do frame */}
        <div style={{ position:"absolute", top:20, left:20, width:52, height:52, borderTop:"1px solid rgba(163,81,79,0.28)", borderLeft:"1px solid rgba(163,81,79,0.28)" }} />
        <div style={{ position:"absolute", top:20, right:20, width:52, height:52, borderTop:"1px solid rgba(163,81,79,0.28)", borderRight:"1px solid rgba(163,81,79,0.28)" }} />
        <div style={{ position:"absolute", bottom:20, left:20, width:52, height:52, borderBottom:"1px solid rgba(163,81,79,0.28)", borderLeft:"1px solid rgba(163,81,79,0.28)" }} />
        <div style={{ position:"absolute", bottom:20, right:20, width:52, height:52, borderBottom:"1px solid rgba(163,81,79,0.28)", borderRight:"1px solid rgba(163,81,79,0.28)" }} />

        {/* Conteúdo */}
        <div
          style={{
            position: "relative",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            minHeight: "100vh",
            padding: "48px 24px",
            textAlign: "center",
            gap: 0,
          }}
        >

          {/* Filete superior com identifier */}
          <div className="r1" style={{ width: "100%", maxWidth: 520, marginBottom: 24 }}>
            <div style={{ display:"flex", alignItems:"center", gap:14 }}>
              <div style={{ flex:1, height:1, background:"rgba(163,81,79,0.35)" }} />
              <span style={{
                fontFamily:"'Josefin Sans', sans-serif",
                fontSize: 10,
                letterSpacing: "0.24em",
                textTransform: "uppercase",
                color: "#8B6A68",
                whiteSpace: "nowrap",
              }}>
                Quiner Sorveteria · Est. 2026
              </span>
              <div style={{ flex:1, height:1, background:"rgba(163,81,79,0.35)" }} />
            </div>
          </div>

          {/* Logo */}
          <div className="r2 logo-flutuando" style={{ marginBottom: 20 }}>
            <div
              style={{
                width: "clamp(96px, 20vw, 148px)",
                height: "clamp(96px, 20vw, 148px)",
                borderRadius: "50%",
                border: "1.5px solid rgba(163,81,79,0.45)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                backgroundColor: "rgba(255,255,255,0.55)",
                boxShadow: "4px 4px 0 rgba(163,81,79,0.12)",
                position: "relative",
              }}
            >
              <Image
                src="/images/logotipo.png"
                alt="Quiner Sorvetes"
                width={110}
                height={110}
                style={{ width:"68%", height:"68%", objectFit:"contain" }}
                priority
              />
            </div>
          </div>

          {/* Título */}
          <div className="r3" style={{ lineHeight: 1, marginBottom: 6 }}>
            <div
              style={{
                fontFamily: "'Cormorant Garamond', serif",
                fontSize: "clamp(36px, 8.5vw, 82px)",
                fontWeight: 300,
                color: "#1C0E0D",
                letterSpacing: "-0.01em",
              }}
            >
              Nossa
            </div>
            <div
              style={{
                fontFamily: "'Cormorant Garamond', serif",
                fontSize: "clamp(36px, 8.5vw, 82px)",
                fontWeight: 600,
                fontStyle: "italic",
                color: "#A3514F",
                letterSpacing: "-0.015em",
                marginTop: -6,
              }}
            >
              Inauguração
            </div>
          </div>

          {/* Data */}
          <div className="r4" style={{ marginBottom: 28, marginTop: 18 }}>
            <div style={{ display:"flex", alignItems:"center", gap:12, justifyContent:"center", marginBottom:6 }}>
              <div style={{ width:28, height:1, background:"rgba(196,85,58,0.5)" }} />
              <span style={{
                fontFamily:"'Cormorant Garamond', serif",
                fontSize:"clamp(17px, 4vw, 26px)",
                fontWeight:400,
                color:"#1C0E0D",
                letterSpacing:"0.04em",
              }}>
                Segunda-feira, 16 de Março
              </span>
              <div style={{ width:28, height:1, background:"rgba(196,85,58,0.5)" }} />
            </div>
            <div style={{
              fontFamily:"'Josefin Sans', sans-serif",
              fontSize:10,
              letterSpacing:"0.2em",
              textTransform:"uppercase",
              color:"#8B6A68",
            }}>
              A partir das 11h
            </div>
          </div>

          {/* Contador */}
          {!contagem.encerrado ? (
            <div className="r5">
              <div style={{
                fontFamily:"'Josefin Sans', sans-serif",
                fontSize:9,
                letterSpacing:"0.22em",
                textTransform:"uppercase",
                color:"#8B6A68",
                marginBottom:14,
              }}>
                Faltam
              </div>
              <div style={{ display:"flex", alignItems:"flex-start", gap:"clamp(6px,2vw,16px)" }}>
                <Bloco valor={contagem.dias} label="Dias" />
                <span className="piscar-sep" style={{ fontFamily:"'Cormorant Garamond', serif", fontSize:"clamp(28px,7vw,58px)", color:"#A3514F", paddingTop:"clamp(12px,2.5vw,18px)", lineHeight:1 }}>:</span>
                <Bloco valor={contagem.horas} label="Horas" />
                <span className="piscar-sep" style={{ fontFamily:"'Cormorant Garamond', serif", fontSize:"clamp(28px,7vw,58px)", color:"#A3514F", paddingTop:"clamp(12px,2.5vw,18px)", lineHeight:1 }}>:</span>
                <Bloco valor={contagem.minutos} label="Minutos" />
                <span className="piscar-sep" style={{ fontFamily:"'Cormorant Garamond', serif", fontSize:"clamp(28px,7vw,58px)", color:"#A3514F", paddingTop:"clamp(12px,2.5vw,18px)", lineHeight:1 }}>:</span>
                <Bloco valor={contagem.segundos} label="Segundos" />
              </div>
            </div>
          ) : (
            <div className="r5" style={{
              fontFamily:"'Cormorant Garamond', serif",
              fontSize:"clamp(26px,6vw,52px)",
              fontStyle:"italic",
              color:"#A3514F",
            }}>
              Chegou o grande dia!
            </div>
          )}

          {/* Filete inferior + tagline */}
          <div className="r6" style={{ width:"100%", maxWidth:520, marginTop:28 }}>
            <div style={{ display:"flex", alignItems:"center", gap:14 }}>
              <div style={{ flex:1, height:1, background:"rgba(163,81,79,0.2)" }} />
              <span style={{
                fontFamily:"'Cormorant Garamond', serif",
                fontSize:"clamp(14px,3vw,18px)",
                fontStyle:"italic",
                color:"#8B6A68",
                whiteSpace:"nowrap",
              }}>
                Sorvetes artesanais feitos com amor
              </span>
              <div style={{ flex:1, height:1, background:"rgba(163,81,79,0.2)" }} />
            </div>
          </div>

        </div>

        {/* Rodapé */}
        <div style={{
          position:"absolute",
          bottom:14,
          left:0,
          right:0,
          textAlign:"center",
          fontFamily:"'Josefin Sans', sans-serif",
          fontSize:9,
          letterSpacing:"0.22em",
          textTransform:"uppercase",
          color:"rgba(139,106,104,0.35)",
        }}>
          quiner.com.br
        </div>

        {/* Botão invisível — canto inferior direito — 3 cliques rápidos para abrir */}
        <button
          onClick={handleHiddenClick}
          aria-hidden="true"
          tabIndex={-1}
          style={{
            position: "absolute",
            bottom: 0,
            right: 0,
            width: 48,
            height: 48,
            opacity: 0,
            cursor: "default",
            background: "transparent",
            border: "none",
          }}
        />

        {/* Modal de acesso */}
        {showPanel && (
          <div
            style={{
              position: "fixed",
              inset: 0,
              zIndex: 99999,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              background: "rgba(28,14,13,0.55)",
              backdropFilter: "blur(4px)",
            }}
            onClick={() => setShowPanel(false)}
          >
            <div
              onClick={(e) => e.stopPropagation()}
              style={{
                background: "#F4E8D1",
                border: "1.5px solid rgba(163,81,79,0.35)",
                borderRadius: 16,
                padding: "32px 28px",
                width: "min(360px, 90vw)",
                boxShadow: "0 24px 64px rgba(0,0,0,0.2)",
                fontFamily: "'Josefin Sans', sans-serif",
              }}
            >
              <p style={{
                fontFamily: "'Cormorant Garamond', serif",
                fontSize: 22,
                fontWeight: 600,
                color: "#1C0E0D",
                marginBottom: 6,
              }}>
                Acesso restrito
              </p>
              <p style={{ fontSize: 12, color: "#8B6A68", marginBottom: 20, letterSpacing: "0.05em" }}>
                Digite seu telefone para continuar
              </p>

              <input
                type="tel"
                inputMode="numeric"
                placeholder="(11) 99999-9999"
                value={phone}
                onChange={(e) => { setPhone(formatPhone(e.target.value)); setErro(""); }}
                onKeyDown={(e) => e.key === "Enter" && handleVerificar()}
                autoFocus
                style={{
                  width: "100%",
                  padding: "12px 16px",
                  borderRadius: 10,
                  border: `1.5px solid ${erro ? "#C4553A" : "rgba(163,81,79,0.35)"}`,
                  background: "rgba(255,255,255,0.6)",
                  fontSize: 18,
                  fontFamily: "monospace",
                  color: "#1C0E0D",
                  outline: "none",
                  marginBottom: 8,
                  boxSizing: "border-box",
                }}
              />

              {erro && (
                <p style={{ fontSize: 12, color: "#C4553A", marginBottom: 12 }}>{erro}</p>
              )}

              <button
                onClick={handleVerificar}
                disabled={verifying}
                style={{
                  width: "100%",
                  padding: "13px",
                  borderRadius: 10,
                  background: verifying ? "rgba(163,81,79,0.5)" : "#A3514F",
                  color: "#fff",
                  fontFamily: "'Josefin Sans', sans-serif",
                  fontSize: 13,
                  letterSpacing: "0.15em",
                  textTransform: "uppercase",
                  fontWeight: 600,
                  border: "none",
                  cursor: verifying ? "not-allowed" : "pointer",
                  marginBottom: 10,
                  transition: "opacity 0.2s",
                }}
              >
                {verifying ? "Verificando..." : "Entrar"}
              </button>

              <button
                onClick={() => setShowPanel(false)}
                style={{
                  width: "100%",
                  padding: "10px",
                  background: "transparent",
                  border: "none",
                  color: "#8B6A68",
                  fontSize: 12,
                  letterSpacing: "0.1em",
                  cursor: "pointer",
                }}
              >
                Cancelar
              </button>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
