import { supabase } from './client';
import { Category } from '@/types/product';

/**
 * Busca todas as categorias do banco de dados
 */
export async function getCategories(): Promise<Category[]> {
  const { data, error } = await supabase
    .from('categories')
    .select('*')
    .order('name', { ascending: true });

  if (error) {
    console.error('Erro ao buscar categorias:', error);
    return [];
  }

  return data || [];
}

/**
 * Busca uma categoria pelo ID
 */
export async function getCategoryById(id: string): Promise<Category | null> {
  const { data, error } = await supabase
    .from('categories')
    .select('*')
    .eq('id', id)
    .single();

  if (error) {
    console.error('Erro ao buscar categoria:', error);
    return null;
  }

  return data;
}

/**
 * Busca uma categoria pelo nome
 */
export async function getCategoryByName(name: string): Promise<Category | null> {
  const { data, error } = await supabase
    .from('categories')
    .select('*')
    .eq('name', name)
    .single();

  if (error) {
    console.error('Erro ao buscar categoria:', error);
    return null;
  }

  return data;
}

/**
 * Cria uma nova categoria
 */
export async function createCategory(category: Omit<Category, 'id'>): Promise<Category | null> {
  const { data, error } = await supabase
    .from('categories')
    .insert([category])
    .select()
    .single();

  if (error) {
    console.error('Erro ao criar categoria:', error);
    return null;
  }

  return data;
}

/**
 * Inicializa as categorias padrão se não existirem
 */
export async function initializeDefaultCategories(): Promise<void> {
  const defaultCategories = [
    { name: 'Casquinhas' },
    { name: 'Potes' },
    { name: 'Q-Mix' },
    { name: 'Milkshakes' },
  ];

  for (const category of defaultCategories) {
    const exists = await getCategoryByName(category.name);
    if (!exists) {
      await createCategory(category);
    }
  }
}
