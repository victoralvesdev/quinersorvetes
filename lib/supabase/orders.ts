import { supabase } from "./client";
import { CartItem } from "@/types/product";
import { PaymentMethod } from "@/types/checkout";
import { Address } from "@/types/address";

export interface OrderItem {
  product_id: string;
  product_name: string;
  quantity: number;
  price: number;
}

export interface OrderData {
  user_id: string;
  items: OrderItem[];
  total: number;
  status: "novo" | "preparando" | "saiu_entrega" | "entregue" | "cancelado";
  payment_method: PaymentMethod;
  address_id?: string;
  address_data?: {
    street: string;
    number: string;
    complement?: string;
    neighborhood: string;
    city: string;
    state: string;
    zip_code: string;
    reference?: string;
  };
}

export interface Order {
  id: string;
  user_id: string;
  items: OrderItem[];
  total: number;
  status: "novo" | "preparando" | "saiu_entrega" | "entregue" | "cancelado";
  payment_method: PaymentMethod;
  address_id?: string;
  address_data?: any;
  delivery_code?: string;
  created_at: string;
  updated_at: string;
}

export async function createOrder(orderData: OrderData): Promise<Order> {
  const { data, error } = await supabase
    .from("orders")
    .insert([orderData])
    .select()
    .single();

  if (error) {
    console.error("Erro ao criar pedido:", error);
    throw new Error("Erro ao criar pedido. Tente novamente.");
  }

  return data;
}

export async function getUserOrders(userId: string): Promise<Order[]> {
  const { data, error } = await supabase
    .from("orders")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Erro ao buscar pedidos:", error);
    throw new Error("Erro ao buscar pedidos.");
  }

  return data || [];
}

export async function getOrderById(orderId: string): Promise<Order | null> {
  const { data, error } = await supabase
    .from("orders")
    .select("*")
    .eq("id", orderId)
    .single();

  if (error) {
    console.error("Erro ao buscar pedido:", error);
    return null;
  }

  return data;
}

/**
 * Busca um pedido pelo código curto (primeiros 8 caracteres do ID)
 */
export async function getOrderByShortCode(shortCode: string): Promise<Order | null> {
  // Remove o # se presente e converte para minúsculas
  const code = shortCode.replace('#', '').trim().toLowerCase();

  console.log('[getOrderByShortCode] Buscando pedido com código:', code);

  // Busca pedidos recentes e filtra pelo código
  const { data, error } = await supabase
    .from("orders")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(100);

  if (error) {
    console.error("[getOrderByShortCode] Erro ao buscar pedidos:", error);
    return null;
  }

  // Filtra pelo código (primeiros 8 caracteres do ID)
  const order = data?.find(o => o.id.toLowerCase().startsWith(code));

  if (order) {
    console.log('[getOrderByShortCode] Pedido encontrado:', order.id);
  } else {
    console.log('[getOrderByShortCode] Pedido não encontrado para código:', code);
  }

  return order || null;
}

/**
 * Atualiza o status de um pedido
 */
export async function updateOrderStatus(
  orderId: string,
  status: Order["status"]
): Promise<Order | null> {
  console.log('[updateOrderStatus] Atualizando pedido:', orderId, 'para status:', status);

  const { data, error } = await supabase
    .from("orders")
    .update({ status, updated_at: new Date().toISOString() })
    .eq("id", orderId)
    .select();

  if (error) {
    console.error("[updateOrderStatus] Erro ao atualizar:", error);
    return null;
  }

  if (!data || data.length === 0) {
    console.error("[updateOrderStatus] Nenhuma linha atualizada");
    return null;
  }

  console.log('[updateOrderStatus] Pedido atualizado:', data[0].id);
  return data[0];
}

/**
 * Busca o usuário de um pedido
 */
export async function getOrderWithUser(orderId: string): Promise<{ order: Order; userPhone: string } | null> {
  const { data, error } = await supabase
    .from("orders")
    .select(`
      *,
      users:user_id (
        phone
      )
    `)
    .eq("id", orderId)
    .single();

  if (error) {
    console.error("Erro ao buscar pedido com usuário:", error);
    return null;
  }

  return {
    order: data,
    userPhone: (data.users as any)?.phone || ''
  };
}

/**
 * Gera um código de entrega único de 4 dígitos
 */
export async function generateDeliveryCode(): Promise<string> {
  // Gera código aleatório de 4 dígitos
  const generateCode = () => Math.floor(1000 + Math.random() * 9000).toString();

  let code = generateCode();
  let attempts = 0;
  const maxAttempts = 10;

  // Verifica se o código já está em uso em algum pedido ativo
  while (attempts < maxAttempts) {
    const existing = await getOrderByDeliveryCode(code);
    if (!existing) {
      return code;
    }
    code = generateCode();
    attempts++;
  }

  // Se após várias tentativas ainda colidir, usa timestamp
  return Date.now().toString().slice(-4);
}

/**
 * Busca pedido pelo código de entrega (apenas pedidos em saiu_entrega)
 */
export async function getOrderByDeliveryCode(code: string): Promise<Order | null> {
  const { data, error } = await supabase
    .from("orders")
    .select("*")
    .eq("delivery_code", code)
    .eq("status", "saiu_entrega")
    .single();

  if (error) {
    // Não é erro se não encontrar
    if (error.code !== 'PGRST116') {
      console.error("[getOrderByDeliveryCode] Erro:", error);
    }
    return null;
  }

  return data;
}

/**
 * Define o código de entrega de um pedido
 */
export async function setOrderDeliveryCode(orderId: string, code: string): Promise<Order | null> {
  const { data, error } = await supabase
    .from("orders")
    .update({ delivery_code: code, updated_at: new Date().toISOString() })
    .eq("id", orderId)
    .select()
    .single();

  if (error) {
    console.error("[setOrderDeliveryCode] Erro:", error);
    return null;
  }

  return data;
}

/**
 * Busca pedidos aguardando confirmação de entrega há mais de X minutos
 */
export async function getOrdersAwaitingDeliveryConfirmation(
  minutesThreshold: number = 30
): Promise<Array<{ order: Order; userPhone: string }>> {
  const thresholdTime = new Date(Date.now() - minutesThreshold * 60 * 1000).toISOString();

  const { data, error } = await supabase
    .from("orders")
    .select(`
      *,
      users:user_id (
        phone
      )
    `)
    .eq("status", "saiu_entrega")
    .lt("updated_at", thresholdTime)
    .order("updated_at", { ascending: true });

  if (error) {
    console.error("Erro ao buscar pedidos aguardando confirmação:", error);
    return [];
  }

  return (data || []).map((item: any) => ({
    order: item,
    userPhone: item.users?.phone || ''
  }));
}

/**
 * Busca pedido pelo telefone do usuário que está em status saiu_entrega
 */
export async function getActiveDeliveryOrderByPhone(phone: string): Promise<Order | null> {
  // Remove formatação do telefone
  const cleanPhone = phone.replace(/\D/g, '');
  const phoneVariants = [
    cleanPhone,
    cleanPhone.startsWith('55') ? cleanPhone.slice(2) : `55${cleanPhone}`,
  ];

  const { data, error } = await supabase
    .from("orders")
    .select(`
      *,
      users:user_id (
        phone
      )
    `)
    .eq("status", "saiu_entrega")
    .order("updated_at", { ascending: false });

  if (error) {
    console.error("Erro ao buscar pedido ativo:", error);
    return null;
  }

  // Filtra por telefone do usuário
  const order = data?.find((item: any) => {
    const userPhone = (item.users?.phone || '').replace(/\D/g, '');
    return phoneVariants.some(v => userPhone.includes(v) || v.includes(userPhone));
  });

  return order || null;
}

