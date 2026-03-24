export interface User {
  id: string;
  name: string;
  phone: string;
  cpf?: string;
  created_at: string;
  updated_at: string;
}

export interface UserFormData {
  name: string;
  phone: string;
}

