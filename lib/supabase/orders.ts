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
    .update({ status })
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

