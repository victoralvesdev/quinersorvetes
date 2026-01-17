import { supabase } from './client';

const BUCKET_NAME = 'products';

/**
 * Faz upload de uma imagem em base64 para o Supabase Storage
 * @param base64Data - Dados da imagem em base64 (com ou sem prefixo data:image/...)
 * @param fileName - Nome do arquivo (opcional, será gerado automaticamente)
 * @returns URL pública da imagem ou null em caso de erro
 */
export async function uploadImageFromBase64(
  base64Data: string,
  fileName?: string
): Promise<string | null> {
  try {
    // Remove o prefixo data:image/... se existir
    let cleanBase64 = base64Data;
    let mimeType = 'image/jpeg'; // default

    if (base64Data.includes(',')) {
      const parts = base64Data.split(',');
      const header = parts[0];
      cleanBase64 = parts[1];

      // Extrai o tipo MIME do header
      const mimeMatch = header.match(/data:([^;]+);/);
      if (mimeMatch) {
        mimeType = mimeMatch[1];
      }
    }

    // Determina a extensão baseada no tipo MIME
    const extensionMap: Record<string, string> = {
      'image/jpeg': 'jpg',
      'image/jpg': 'jpg',
      'image/png': 'png',
      'image/gif': 'gif',
      'image/webp': 'webp',
    };
    const extension = extensionMap[mimeType] || 'jpg';

    // Gera um nome de arquivo único se não fornecido
    const finalFileName = fileName || `product_${Date.now()}_${Math.random().toString(36).substring(7)}.${extension}`;

    // Converte base64 para Buffer (Node.js nativo - funciona melhor em server-side)
    const buffer = Buffer.from(cleanBase64, 'base64');

    console.log('[uploadImageFromBase64] Fazendo upload:', finalFileName, 'tamanho:', buffer.length, 'mimeType:', mimeType);

    // Faz o upload para o Supabase Storage
    const { data, error } = await supabase.storage
      .from(BUCKET_NAME)
      .upload(finalFileName, buffer, {
        contentType: mimeType,
        upsert: true,
      });

    if (error) {
      console.error('[uploadImageFromBase64] Erro no upload:', error);
      return null;
    }

    console.log('[uploadImageFromBase64] Upload concluído:', data.path);

    // Obtém a URL pública da imagem
    const { data: publicUrlData } = supabase.storage
      .from(BUCKET_NAME)
      .getPublicUrl(data.path);

    console.log('[uploadImageFromBase64] URL pública:', publicUrlData.publicUrl);

    return publicUrlData.publicUrl;
  } catch (error) {
    console.error('[uploadImageFromBase64] Erro:', error);
    return null;
  }
}

/**
 * Faz upload de um arquivo de imagem para o Supabase Storage
 * @param file - Arquivo de imagem (File object)
 * @returns URL pública da imagem ou null em caso de erro
 */
export async function uploadImageFile(file: File): Promise<string | null> {
  try {
    // Valida o tipo do arquivo
    const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
    if (!validTypes.includes(file.type)) {
      console.error('[uploadImageFile] Tipo de arquivo inválido:', file.type);
      return null;
    }

    // Valida o tamanho (máximo 5MB)
    const maxSize = 5 * 1024 * 1024;
    if (file.size > maxSize) {
      console.error('[uploadImageFile] Arquivo muito grande:', file.size);
      return null;
    }

    // Determina a extensão
    const extensionMap: Record<string, string> = {
      'image/jpeg': 'jpg',
      'image/jpg': 'jpg',
      'image/png': 'png',
      'image/gif': 'gif',
      'image/webp': 'webp',
    };
    const extension = extensionMap[file.type] || 'jpg';

    // Gera um nome de arquivo único
    const fileName = `product_${Date.now()}_${Math.random().toString(36).substring(7)}.${extension}`;

    console.log('[uploadImageFile] Fazendo upload:', fileName, 'tamanho:', file.size, 'tipo:', file.type);

    // Faz o upload para o Supabase Storage
    const { data, error } = await supabase.storage
      .from(BUCKET_NAME)
      .upload(fileName, file, {
        contentType: file.type,
        upsert: true,
      });

    if (error) {
      console.error('[uploadImageFile] Erro no upload:', error);
      return null;
    }

    console.log('[uploadImageFile] Upload concluído:', data.path);

    // Obtém a URL pública da imagem
    const { data: publicUrlData } = supabase.storage
      .from(BUCKET_NAME)
      .getPublicUrl(data.path);

    console.log('[uploadImageFile] URL pública:', publicUrlData.publicUrl);

    return publicUrlData.publicUrl;
  } catch (error) {
    console.error('[uploadImageFile] Erro:', error);
    return null;
  }
}

/**
 * Deleta uma imagem do Supabase Storage
 * @param fileUrl - URL completa ou path do arquivo
 * @returns true se deletado com sucesso, false caso contrário
 */
export async function deleteImage(fileUrl: string): Promise<boolean> {
  try {
    // Extrai o path do arquivo da URL
    let filePath = fileUrl;
    if (fileUrl.includes(BUCKET_NAME)) {
      const parts = fileUrl.split(`${BUCKET_NAME}/`);
      filePath = parts[parts.length - 1];
    }

    const { error } = await supabase.storage
      .from(BUCKET_NAME)
      .remove([filePath]);

    if (error) {
      console.error('[deleteImage] Erro ao deletar:', error);
      return false;
    }

    return true;
  } catch (error) {
    console.error('[deleteImage] Erro:', error);
    return false;
  }
}
