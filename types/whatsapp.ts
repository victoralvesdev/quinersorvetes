/**
 * Tipos para integração com Evolution API (WhatsApp)
 */

export interface WhatsAppMessage {
  event: string;
  instance: string;
  data: {
    key: {
      remoteJid: string;
      fromMe: boolean;
      id: string;
    };
    message?: {
      conversation?: string;
      extendedTextMessage?: {
        text: string;
      };
      buttonsResponseMessage?: {
        selectedButtonId: string;
        selectedDisplayText: string;
      };
      listResponseMessage?: {
        singleSelectReply: {
          selectedRowId: string;
        };
      };
    };
    messageTimestamp: number;
    pushName?: string;
  };
}

export interface ConversationState {
  phoneNumber: string;
  step:
    // Cadastro de produto
    | 'awaiting_category'
    | 'awaiting_name'
    | 'awaiting_description'
    | 'awaiting_price'
    | 'awaiting_image'
    | 'completed'
    // Edição de produto
    | 'edit_awaiting_category'
    | 'edit_awaiting_product'
    | 'edit_awaiting_field'
    | 'edit_awaiting_name'
    | 'edit_awaiting_description'
    | 'edit_awaiting_price'
    | 'edit_awaiting_image';
  categoryId?: string;
  productData?: {
    name?: string;
    description?: string;
    price?: number;
    image?: string;
    // Para edição
    availableCategories?: Array<{ index: number; id: string; name: string }>;
    availableProducts?: Array<{ index: number; id: string; name: string; price: number }>;
    editProductId?: string;
    editProductName?: string;
  };
  flow?: 'cadastrar' | 'editar';
  createdAt: Date;
  updatedAt: Date;
}
