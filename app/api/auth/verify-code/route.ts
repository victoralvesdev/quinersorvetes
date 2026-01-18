import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase/client";

// Formata o telefone para o padrão internacional
function formatPhoneNumber(phone: string): string {
  const cleaned = phone.replace(/\D/g, "");
  if (!cleaned.startsWith("55")) {
    return `55${cleaned}`;
  }
  return cleaned;
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { phone, code } = body;

    if (!phone || !code) {
      return NextResponse.json(
        { error: "Telefone e código são obrigatórios" },
        { status: 400 }
      );
    }

    const formattedPhone = formatPhoneNumber(phone);

    // Busca o código mais recente não utilizado para este telefone
    const { data: verificationData, error: selectError } = await supabase
      .from("verification_codes")
      .select("*")
      .eq("phone", formattedPhone)
      .eq("code", code)
      .eq("used", false)
      .order("created_at", { ascending: false })
      .limit(1)
      .single();

    if (selectError || !verificationData) {
      console.log("[VerifyCode] Código não encontrado:", { phone: formattedPhone, code });
      return NextResponse.json(
        { error: "Código inválido ou expirado" },
        { status: 400 }
      );
    }

    // Verifica se o código expirou
    const expiresAt = new Date(verificationData.expires_at);
    if (expiresAt < new Date()) {
      console.log("[VerifyCode] Código expirado:", { phone: formattedPhone, expiresAt });
      return NextResponse.json(
        { error: "Código expirado. Solicite um novo código." },
        { status: 400 }
      );
    }

    // Marca o código como utilizado
    const { error: updateError } = await supabase
      .from("verification_codes")
      .update({
        used: true,
        verified_at: new Date().toISOString()
      })
      .eq("id", verificationData.id);

    if (updateError) {
      console.error("[VerifyCode] Erro ao atualizar código:", updateError);
      // Continua mesmo com erro - código foi validado
    }

    console.log(`[VerifyCode] Código verificado com sucesso para ${formattedPhone}`);

    return NextResponse.json({
      success: true,
      verified: true,
      message: "Código verificado com sucesso",
    });
  } catch (error) {
    console.error("[VerifyCode] Erro:", error);
    return NextResponse.json(
      { error: "Erro interno do servidor" },
      { status: 500 }
    );
  }
}
