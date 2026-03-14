"use client";

import { useState, useEffect } from "react";
import Image from "next/image";

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

function UnidadeContagem({ valor, label }: { valor: number; label: string }) {
  return (
    <div className="flex flex-col items-center">
      <div
        className="relative flex items-center justify-center rounded-2xl md:rounded-3xl"
        style={{
          width: "clamp(68px, 18vw, 110px)",
          height: "clamp(68px, 18vw, 110px)",
          background: "rgba(255,255,255,0.15)",
          backdropFilter: "blur(12px)",
          border: "1.5px solid rgba(255,255,255,0.3)",
          boxShadow: "0 8px 32px rgba(163,110,108,0.18), inset 0 1px 0 rgba(255,255,255,0.25)",
        }}
      >
        <span
          className="font-bold tabular-nums leading-none"
          style={{
            fontSize: "clamp(28px, 7vw, 52px)",
            color: "#fff",
            textShadow: "0 2px 12px rgba(163,110,108,0.4)",
          }}
        >
          {String(valor).padStart(2, "0")}
        </span>
      </div>
      <span
        className="mt-2 text-xs md:text-sm font-semibold uppercase tracking-widest"
        style={{ color: "rgba(255,255,255,0.75)" }}
      >
        {label}
      </span>
    </div>
  );
}

// Pontos decorativos animados
function Particulas() {
  const particulas = [
    { top: "8%", left: "6%", size: 10, delay: 0, dur: 6 },
    { top: "14%", left: "82%", size: 7, delay: 1.2, dur: 5 },
    { top: "28%", left: "93%", size: 12, delay: 0.5, dur: 7 },
    { top: "72%", left: "4%", size: 9, delay: 2, dur: 5.5 },
    { top: "85%", left: "88%", size: 8, delay: 0.8, dur: 6.5 },
    { top: "55%", left: "96%", size: 5, delay: 1.5, dur: 4.5 },
    { top: "40%", left: "2%", size: 6, delay: 2.5, dur: 6 },
    { top: "90%", left: "50%", size: 11, delay: 0.3, dur: 7.5 },
    { top: "5%", left: "45%", size: 8, delay: 1.8, dur: 5.5 },
  ];

  return (
    <>
      {particulas.map((p, i) => (
        <div
          key={i}
          className="absolute rounded-full pointer-events-none"
          style={{
            top: p.top,
            left: p.left,
            width: p.size,
            height: p.size,
            background: "rgba(255,255,255,0.35)",
            animation: `pulsar ${p.dur}s ease-in-out ${p.delay}s infinite`,
          }}
        />
      ))}
    </>
  );
}

export default function InauguracaoPage() {
  const [contagem, setContagem] = useState(calcularContagem());
  const [visivel, setVisivel] = useState(false);

  useEffect(() => {
    setVisivel(true);
    // Trava scroll do body para que nada atrás do overlay seja acessível
    document.body.style.overflow = "hidden";
    document.documentElement.style.overflow = "hidden";

    const intervalo = setInterval(() => {
      setContagem(calcularContagem());
    }, 1000);

    return () => {
      clearInterval(intervalo);
      document.body.style.overflow = "";
      document.documentElement.style.overflow = "";
    };
  }, []);

  return (
    <>
      <style>{`
        @keyframes pulsar {
          0%, 100% { opacity: 0.2; transform: scale(1); }
          50% { opacity: 0.8; transform: scale(1.4); }
        }
        @keyframes flutuar {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-12px); }
        }
        @keyframes entrar {
          from { opacity: 0; transform: translateY(28px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes brilhar {
          0%, 100% { opacity: 0.6; }
          50% { opacity: 1; }
        }
      `}</style>

      <div
        className="fixed inset-0 overflow-hidden"
        style={{
          background: "linear-gradient(145deg, #c4918f 0%, #a36e6c 35%, #8a5a58 65%, #5d7184 100%)",
          zIndex: 9999,
        }}
      >
        {/* Camada de textura suave */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background:
              "radial-gradient(ellipse at 20% 30%, rgba(255,229,229,0.18) 0%, transparent 60%), radial-gradient(ellipse at 80% 70%, rgba(93,113,132,0.25) 0%, transparent 55%)",
          }}
        />

        {/* Partículas decorativas */}
        <Particulas />

        {/* Conteúdo central */}
        <div className="relative flex flex-col items-center justify-center min-h-screen px-6 py-10 text-center">

          {/* Logo */}
          <div
            className="mb-6 md:mb-8"
            style={{
              animation: visivel ? "flutuar 5s ease-in-out infinite" : "none",
            }}
          >
            <div
              className="relative mx-auto"
              style={{
                width: "clamp(120px, 30vw, 200px)",
                height: "clamp(120px, 30vw, 200px)",
                background: "rgba(255,255,255,0.18)",
                backdropFilter: "blur(16px)",
                borderRadius: "50%",
                border: "2px solid rgba(255,255,255,0.4)",
                boxShadow: "0 20px 60px rgba(0,0,0,0.15), inset 0 2px 0 rgba(255,255,255,0.3)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Image
                src="/images/logotipo.png"
                alt="Quiner Sorvetes"
                width={160}
                height={160}
                className="object-contain"
                style={{
                  width: "clamp(80px, 20vw, 140px)",
                  height: "clamp(80px, 20vw, 140px)",
                }}
                priority
              />
            </div>
          </div>

          {/* Badge "Em breve" */}
          <div
            style={{
              opacity: visivel ? 1 : 0,
              animation: visivel ? "entrar 0.6s ease-out 0.2s both" : "none",
            }}
          >
            <span
              className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs md:text-sm font-bold uppercase tracking-widest mb-4"
              style={{
                background: "rgba(255,182,193,0.25)",
                border: "1.5px solid rgba(255,182,193,0.5)",
                color: "#FFE5E5",
                backdropFilter: "blur(8px)",
              }}
            >
              <span style={{ animation: "brilhar 2s ease-in-out infinite" }}>✦</span>
              Em breve
              <span style={{ animation: "brilhar 2s ease-in-out 0.5s infinite" }}>✦</span>
            </span>
          </div>

          {/* Título principal */}
          <div
            style={{
              opacity: visivel ? 1 : 0,
              animation: visivel ? "entrar 0.6s ease-out 0.35s both" : "none",
            }}
          >
            <h1
              className="font-extrabold leading-tight mb-2"
              style={{
                fontSize: "clamp(32px, 8vw, 72px)",
                color: "#fff",
                textShadow: "0 4px 24px rgba(0,0,0,0.18)",
                letterSpacing: "-0.02em",
              }}
            >
              Nossa Inauguração
            </h1>
          </div>

          {/* Data destaque */}
          <div
            style={{
              opacity: visivel ? 1 : 0,
              animation: visivel ? "entrar 0.6s ease-out 0.5s both" : "none",
            }}
          >
            <div
              className="inline-flex flex-col items-center mb-8 md:mb-10 px-8 py-4 rounded-2xl"
              style={{
                background: "rgba(255,255,255,0.12)",
                backdropFilter: "blur(12px)",
                border: "1.5px solid rgba(255,255,255,0.25)",
              }}
            >
              <p
                className="font-black leading-none"
                style={{
                  fontSize: "clamp(42px, 12vw, 100px)",
                  color: "#FFE5E5",
                  textShadow: "0 4px 32px rgba(163,110,108,0.5)",
                  letterSpacing: "-0.03em",
                }}
              >
                16/03
              </p>
              <p
                className="font-semibold uppercase tracking-widest"
                style={{
                  fontSize: "clamp(11px, 3vw, 16px)",
                  color: "rgba(255,255,255,0.8)",
                  marginTop: "2px",
                }}
              >
                Segunda-feira
              </p>
            </div>
          </div>

          {/* Contador regressivo */}
          {!contagem.encerrado && (
            <div
              style={{
                opacity: visivel ? 1 : 0,
                animation: visivel ? "entrar 0.6s ease-out 0.65s both" : "none",
              }}
            >
              <p
                className="mb-4 text-xs md:text-sm uppercase tracking-widest font-semibold"
                style={{ color: "rgba(255,255,255,0.65)" }}
              >
                Faltam
              </p>
              <div className="flex items-start gap-3 md:gap-5">
                <UnidadeContagem valor={contagem.dias} label="Dias" />
                <span
                  className="font-bold"
                  style={{
                    fontSize: "clamp(24px, 6vw, 44px)",
                    color: "rgba(255,255,255,0.5)",
                    lineHeight: "clamp(68px, 18vw, 110px)",
                  }}
                >
                  :
                </span>
                <UnidadeContagem valor={contagem.horas} label="Horas" />
                <span
                  className="font-bold"
                  style={{
                    fontSize: "clamp(24px, 6vw, 44px)",
                    color: "rgba(255,255,255,0.5)",
                    lineHeight: "clamp(68px, 18vw, 110px)",
                  }}
                >
                  :
                </span>
                <UnidadeContagem valor={contagem.minutos} label="Minutos" />
                <span
                  className="font-bold"
                  style={{
                    fontSize: "clamp(24px, 6vw, 44px)",
                    color: "rgba(255,255,255,0.5)",
                    lineHeight: "clamp(68px, 18vw, 110px)",
                  }}
                >
                  :
                </span>
                <UnidadeContagem valor={contagem.segundos} label="Segundos" />
              </div>
            </div>
          )}

          {contagem.encerrado && (
            <div
              style={{
                opacity: visivel ? 1 : 0,
                animation: visivel ? "entrar 0.6s ease-out 0.65s both" : "none",
              }}
            >
              <p
                className="text-2xl md:text-4xl font-bold"
                style={{ color: "#FFE5E5" }}
              >
                🎉 Chegou o dia!
              </p>
            </div>
          )}

          {/* Tagline */}
          <div
            style={{
              opacity: visivel ? 1 : 0,
              animation: visivel ? "entrar 0.6s ease-out 0.8s both" : "none",
            }}
          >
            <p
              className="mt-8 md:mt-10 font-medium"
              style={{
                fontSize: "clamp(14px, 3.5vw, 20px)",
                color: "rgba(255,255,255,0.7)",
                maxWidth: "360px",
                lineHeight: 1.6,
              }}
            >
              Sorvetes artesanais com amor e sabor.<br />
              <span style={{ color: "rgba(255,229,229,0.9)" }}>Quiner Sorveteria</span> te espera!
            </p>
          </div>

          {/* Rodapé sutil */}
          <div
            className="absolute bottom-5 left-0 right-0 flex justify-center"
            style={{
              opacity: visivel ? 1 : 0,
              animation: visivel ? "entrar 0.6s ease-out 1s both" : "none",
            }}
          >
            <p
              className="text-xs"
              style={{ color: "rgba(255,255,255,0.35)" }}
            >
              quiner.com.br
            </p>
          </div>
        </div>
      </div>
    </>
  );
}
