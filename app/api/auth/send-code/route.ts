import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/server";
import { sendTextMessage } from "@/lib/evolution-api";

function generateCode(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

function formatPhoneNumber(phone: string): string {
  const cleaned = phone.replace(/\D/g, "");
  if (!cleaned.startsWith("55")) {
    return `55${cleaned}`;
  }
  return cleaned;
}

// Validação básica de telefone brasileiro
function isValidBrazilianPhone(phone: string): boolean {
  const cleaned = phone.replace(/\D/g, "");
  // Com DDI 55: 12-13 dígitos | Sem DDI: 10-11 dígitos
  const withoutCountryCode = cleaned.startsWith("55") ? cleaned.slice(2) : cleaned;
  return withoutCountryCode.length >= 10 && withoutCountryCode.length <= 11;
}

// Rate limiting simples em memória: máx 3 tentativas por telefone a cada 10 min
const rateLimitMap = new Map<string, { count: number; resetAt: number }>();

function checkRateLimit(phone: string): boolean {
  const now = Date.now();
  const entry = rateLimitMap.get(phone);

  if (!entry || now > entry.resetAt) {
    rateLimitMap.set(phone, { count: 1, resetAt: now + 10 * 60 * 1000 });
    return true;
  }

  if (entry.count >= 3) return false;

  entry.count += 1;
  return true;
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { phone } = body;

    if (!phone) {
      return NextResponse.json(
        { error: "Telefone é obrigatório" },
        { status: 400 }
      );
    }

    // M4: Validação de formato
    if (!isValidBrazilianPhone(phone)) {
      return NextResponse.json(
        { error: "Telefone inválido. Use um número brasileiro válido." },
        { status: 400 }
      );
    }

    const formattedPhone = formatPhoneNumber(phone);

    // M3: Rate limiting
    if (!checkRateLimit(formattedPhone)) {
      return NextResponse.json(
        { error: "Muitas tentativas. Aguarde alguns minutos." },
        { status: 429 }
      );
    }

    const code = generateCode();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000).toISOString();

    // Invalida códigos anteriores não utilizados do mesmo telefone
    await supabaseAdmin
      .from("verification_codes")
      .update({ used: true })
      .eq("phone", formattedPhone)
      .eq("used", false);

    // Salva o novo código no banco
    const { error: insertError } = await supabaseAdmin
      .from("verification_codes")
      .insert({
        phone: formattedPhone,
        code,
        expires_at: expiresAt,
        used: false,
      });

    if (insertError) {
      console.error("[SendCode] Erro ao salvar código:", insertError);
      return NextResponse.json(
        { error: "Erro ao gerar código de verificação" },
        { status: 500 }
      );
    }

    const message = `🍦 *Quiner Sorvetes*

Seu código de verificação é:

*${code}*

Este código expira em 10 minutos.

✨ Todas as atualizações dos seus pedidos serão enviadas por aqui e atualizadas no site!

_Se você não solicitou este código, ignore esta mensagem._`;

    try {
      await sendTextMessage(formattedPhone, message);
    } catch (whatsappError) {
      console.error("[SendCode] Erro ao enviar WhatsApp:", whatsappError);
    }

    return NextResponse.json({
      success: true,
      message: "Código enviado com sucesso",
    });
  } catch (error) {
    console.error("[SendCode] Erro:", error);
    return NextResponse.json(
      { error: "Erro interno do servidor" },
      { status: 500 }
    );
  }
}
