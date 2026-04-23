#!/bin/bash
set -e

# ─── Detecta o IP do servidor ───────────────────────────────────────────────
SERVER_IP=$(hostname -I | awk '{print $1}')
echo "→ IP detectado: $SERVER_IP"

# ─── Cria .env se não existir ────────────────────────────────────────────────
if [ ! -f .env ]; then
  echo "→ Criando .env com valores padrão..."
  cat > .env << EOF
# Gerado automaticamente por setup.sh

POSTGRES_PASSWORD=Classroom@2024
JWT_SECRET=aB3kP9mX2nQ7rY5wZ1cD8fG4hJ6iK0lL3mN5oP7qR9sT1uV3wX5yZ7aB9cD1eF3g
MINIO_ACCESS_KEY=minioadmin
MINIO_SECRET_KEY=Minio@2024

# IP do servidor (para acesso externo)
SERVER_IP=$SERVER_IP

# Stripe (desabilitado — preencha para ativar pagamentos)
STRIPE_SECRET_KEY=sk_test_disabled
STRIPE_PUBLISHABLE_KEY=pk_test_disabled
STRIPE_WEBHOOK_SECRET=whsec_disabled

# Admin padrão
ADMIN_EMAIL=admin@classroom.com
ADMIN_PASSWORD=Admin@123456
EOF
  echo "✓ .env criado"
else
  echo "→ .env já existe, mantendo..."
  # Garante que SERVER_IP está definido
  if ! grep -q "^SERVER_IP=" .env; then
    echo "SERVER_IP=$SERVER_IP" >> .env
    echo "✓ SERVER_IP adicionado ao .env"
  fi
fi

# ─── Sobe os containers ──────────────────────────────────────────────────────
echo "→ Iniciando containers..."
docker compose up -d --build

echo ""
echo "════════════════════════════════════════════════"
echo "  Classroom está subindo!"
echo "════════════════════════════════════════════════"
echo "  Frontend:      http://$SERVER_IP:3000"
echo "  API / Swagger: http://$SERVER_IP:8080/swagger"
echo "  MinIO Console: http://$SERVER_IP:9001"
echo ""
echo "  Login admin:   admin@classroom.com"
echo "  Senha:         Admin@123456"
echo "════════════════════════════════════════════════"
echo ""
echo "Acompanhe os logs da API:"
echo "  docker compose logs -f api"
