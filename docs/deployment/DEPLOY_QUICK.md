# 🚀 Deploy Rápido no Google Cloud Run

## Passo 1: Configurar Projeto

```bash
# Definir projeto (substitua BOLsinho pelo seu project ID)
gcloud config set project BOLsinho

# Verificar projeto atual
gcloud config get-value project
```

## Passo 2: Habilitar APIs (via Console se CLI não funcionar)

1. Acesse: https://console.cloud.google.com/apis/library
2. Habilite estas APIs:
   - **Cloud Run API**
   - **Cloud Build API** (se for usar build na nuvem)
   - **Cloud SQL Admin API** (se for usar MySQL)

## Passo 3: Build e Deploy (Método Mais Simples)

### Opção A: Build Local + Deploy

```bash
# 1. Build da imagem Docker
docker build -t gcr.io/$(gcloud config get-value project)/bolsinho:latest .

# 2. Configurar Docker para usar gcloud como helper
gcloud auth configure-docker

# 3. Push da imagem para Container Registry
docker push gcr.io/$(gcloud config get-value project)/bolsinho:latest

# 4. Deploy no Cloud Run
gcloud run deploy bolsinho \
  --image gcr.io/$(gcloud config get-value project)/bolsinho:latest \
  --platform managed \
  --region us-central1 \
  --allow-unauthenticated \
  --port 8080 \
  --set-env-vars "NODE_ENV=production" \
  --set-env-vars "PORT=8080"
```

### Opção B: Build na Nuvem (Requer Cloud Build habilitado)

```bash
# 1. Build e deploy em um comando
gcloud run deploy bolsinho \
  --source . \
  --platform managed \
  --region us-central1 \
  --allow-unauthenticated \
  --port 8080 \
  --set-env-vars "NODE_ENV=production,PORT=8080"
```

## Passo 4: Configurar Variáveis de Ambiente

```bash
gcloud run services update bolsinho \
  --region us-central1 \
  --update-env-vars "GROQ_API_KEY=sua_chave_groq" \
  --update-env-vars "NEWS_API_KEY=sua_chave_newsapi" \
  --update-env-vars "JWT_SECRET=hermes123" \
  --update-env-vars "DATABASE_URL=mysql://usuario:senha@host:3306/database"
```

**OU** via Console:
1. Acesse: https://console.cloud.google.com/run
2. Clique no serviço `bolsinho`
3. Vá em "Edit & Deploy New Revision"
4. Aba "Variables & Secrets"
5. Adicione as variáveis de ambiente

## Passo 5: Acessar a Aplicação

Após o deploy, você receberá uma URL como:
```
https://bolsinho-xxxxx-uc.a.run.app
```

Para obter a URL:
```bash
gcloud run services describe bolsinho --region us-central1 --format "value(status.url)"
```

## Troubleshooting

### Erro: "Permission denied"
- Verifique se o billing está ativado
- Verifique se você tem permissão de Owner/Editor no projeto

### Erro: "API not enabled"
- Habilite as APIs via Console: https://console.cloud.google.com/apis/library

### Erro: "Container failed to start"
- Verifique os logs: `gcloud run services logs read bolsinho --region us-central1`
- Verifique se a porta está configurada (deve ser 8080)

### Erro: "Database connection failed"
- Verifique se o DATABASE_URL está correto
- Se usar Cloud SQL, configure a conexão: https://cloud.google.com/run/docs/connecting/cloud-sql

