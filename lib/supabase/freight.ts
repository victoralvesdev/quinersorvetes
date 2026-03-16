import { supabase } from './client';

export interface FreightZone {
  id: string;
  label: string;
  min_km: number;
  max_km: number;
  price: number;
  active: boolean;
  display_order: number;
}

export async function getFreightZones(): Promise<FreightZone[]> {
  const { data, error } = await supabase
    .from('freight_zones')
    .select('*')
    .order('display_order', { ascending: true });

  if (error) {
    console.error('Erro ao buscar zonas de frete:', error);
    return [];
  }

  return data || [];
}

export async function getActiveFreightZones(): Promise<FreightZone[]> {
  const { data, error } = await supabase
    .from('freight_zones')
    .select('*')
    .eq('active', true)
    .order('min_km', { ascending: true });

  if (error) {
    console.error('Erro ao buscar zonas de frete ativas:', error);
    return [];
  }

  return data || [];
}

export async function createFreightZone(
  zone: Omit<FreightZone, 'id'>
): Promise<FreightZone | null> {
  const { data, error } = await supabase
    .from('freight_zones')
    .insert([zone])
    .select()
    .single();

  if (error) {
    console.error('Erro ao criar zona de frete:', error);
    return null;
  }

  return data;
}

export async function updateFreightZone(
  id: string,
  updates: Partial<Omit<FreightZone, 'id'>>
): Promise<FreightZone | null> {
  const { data, error } = await supabase
    .from('freight_zones')
    .update(updates)
    .eq('id', id)
    .select()
    .single();

  if (error) {
    console.error('Erro ao atualizar zona de frete:', error);
    return null;
  }

  return data;
}

export async function deleteFreightZone(id: string): Promise<boolean> {
  const { error } = await supabase
    .from('freight_zones')
    .delete()
    .eq('id', id);

  if (error) {
    console.error('Erro ao deletar zona de frete:', error);
    return false;
  }

  return true;
}
