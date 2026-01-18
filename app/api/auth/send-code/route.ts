import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase/client";
import { sendTextMessage } from "@/lib/evolution-api";

// Gera um código de 6 dígitos
function generateCode(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

// Formata o telefone para o padrão internacional
function formatPhoneNumber(phone: string): string {
  // Remove todos os caracteres não numéricos
  const cleaned = phone.replace(/\D/g, "");

  // Se não começar com 55, adiciona
  if (!cleaned.startsWith("55")) {
    return `55${cleaned}`;
  }

  return cleaned;
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

    const formattedPhone = formatPhoneNumber(phone);
    const code = generateCode();

    // Código expira em 10 minutos
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000).toISOString();

    // Invalida códigos anteriores não utilizados do mesmo telefone
    await supabase
      .from("verification_codes")
      .update({ used: true })
      .eq("phone", formattedPhone)
      .eq("used", false);

    // Salva o novo código no banco
    const { error: insertError } = await supabase
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

    // Envia o código via WhatsApp
    const message = `🍦 *Quiner Sorvetes*

Seu código de verificação é:

*${code}*

Este código expira em 10 minutos.

✨ Todas as atualizações dos seus pedidos serão enviadas por aqui e atualizadas no site!

_Se você não solicitou este código, ignore esta mensagem._`;

    try {
      await sendTextMessage(formattedPhone, message);
      console.log(`[SendCode] Código enviado para ${formattedPhone}`);
    } catch (whatsappError) {
      console.error("[SendCode] Erro ao enviar WhatsApp:", whatsappError);
      // Não retorna erro - código foi salvo, usuário pode tentar reenviar
    }

    return NextResponse.json({
      success: true,
      message: "Código enviado com sucesso",
      // Não retornamos o código por segurança
    });
  } catch (error) {
    console.error("[SendCode] Erro:", error);
    return NextResponse.json(
      { error: "Erro interno do servidor" },
      { status: 500 }
    );
  }
}
