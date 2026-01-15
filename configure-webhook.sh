#!/bin/bash

# Script para configurar webhook na Evolution API
# URL do ngrok: https://58395382a9a5.ngrok-free.app

echo "Configurando webhook na Evolution API..."
echo ""

curl --location 'https://victoralvesdev-evolution-api.36merq.easypanel.host/webhook/set/Quiner' \
--header 'Content-Type: application/json' \
--header 'apikey: 0F4A6FF5E2CB-46F5-85DF-86A34140ECA9' \
--data '{
  "webhook": {
    "url": "https://58395382a9a5.ngrok-free.app/api/whatsapp/webhook",
    "enabled": true,
    "webhook_by_events": false,
    "webhook_base64": false,
    "events": [
      "MESSAGES_UPSERT"
    ]
  }
}'

echo ""
echo ""
echo "✅ Webhook configurado com sucesso!"
echo ""
echo "📱 URL do Webhook: https://58395382a9a5.ngrok-free.app/api/whatsapp/webhook"
echo ""
echo "Para testar, envie uma mensagem no WhatsApp:"
echo "  'cadastrar produto'"
echo ""
