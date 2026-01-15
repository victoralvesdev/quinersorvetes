/**
 * Valida se um CEP pertence a Bragança Paulista
 * CEPs de Bragança Paulista: 12900-000 a 12929-999
 */
export function isValidBragancaPaulistaCEP(cep: string): boolean {
  // Remove caracteres não numéricos
  const cleanCEP = cep.replace(/\D/g, '');
  
  // Verifica se tem 8 dígitos
  if (cleanCEP.length !== 8) {
    return false;
  }
  
  // Converte para número
  const cepNumber = parseInt(cleanCEP, 10);
  
  // Bragança Paulista: 12900-000 a 12929-999
  return cepNumber >= 12900000 && cepNumber <= 12929999;
}

/**
 * Formata CEP (adiciona hífen)
 */
export function formatCEP(cep: string): string {
  const cleanCEP = cep.replace(/\D/g, '');
  if (cleanCEP.length === 8) {
    return `${cleanCEP.slice(0, 5)}-${cleanCEP.slice(5)}`;
  }
  return cleanCEP;
}

/**
 * Busca informações do CEP usando API ViaCEP
 */
export async function fetchCEPInfo(cep: string): Promise<{
  street?: string;
  neighborhood?: string;
  city?: string;
  state?: string;
  error?: string;
}> {
  const cleanCEP = cep.replace(/\D/g, '');
  
  if (cleanCEP.length !== 8) {
    return { error: 'CEP inválido' };
  }

  try {
    const response = await fetch(`https://viacep.com.br/ws/${cleanCEP}/json/`);
    const data = await response.json();

    if (data.erro) {
      return { error: 'CEP não encontrado' };
    }

    return {
      street: data.logradouro || '',
      neighborhood: data.bairro || '',
      city: data.localidade || '',
      state: data.uf || '',
    };
  } catch (error) {
    console.error('Erro ao buscar CEP:', error);
    return { error: 'Erro ao buscar informações do CEP' };
  }
}

