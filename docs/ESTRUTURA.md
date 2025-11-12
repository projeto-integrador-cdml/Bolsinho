# 📁 Estrutura de Documentação

Esta é a estrutura completa da documentação do Bolsinho.

## 📂 Estrutura de Pastas

```
docs/
├── README.md                    # Índice principal da documentação
├── API.md                       # Documentação da API
│
├── setup/                       # Setup e Configuração
│   ├── README.md               # Índice do setup
│   ├── INICIO_RAPIDO.md        # Início rápido
│   ├── CONFIGURAR_ENV.md       # Configuração do ambiente
│   ├── BACKEND_SETUP.md        # Setup do backend
│   ├── README_BACKEND.md       # Setup do banco de dados
│   ├── SETUP_DOCKER_MYSQL.md   # Setup do Docker MySQL
│   ├── SETUP_CACHE_ACOES.md    # Setup do cache de ações
│   └── RESUMO_SETUP_BANCO.md   # Resumo do setup do banco
│
├── guides/                      # Guias de Funcionalidades
│   ├── README.md               # Índice dos guias
│   ├── GUIA_BANCO_DADOS.md     # Guia do banco de dados
│   ├── GUIA_CACHE_ACOES.md     # Guia do cache de ações
│   └── GUIA_DADOS_REAIS_ACOES.md # Guia de dados reais de ações
│
├── deployment/                  # Guias de Deploy
│   ├── README.md               # Índice de deploy
│   ├── DEPLOY.md               # Guia geral de deploy
│   ├── DEPLOY_QUICK.md         # Deploy rápido
│   ├── DEPLOY_GOOGLE_CLOUD.md  # Deploy no Google Cloud
│   ├── DEPLOY_AZURE.md         # Deploy no Azure
│   └── DEPLOY_RENDER_RAILWAY.md # Deploy no Render/Railway
│
└── solutions/                   # Soluções de Problemas
    ├── README.md               # Índice de soluções
    ├── SOLUCAO_BCRYPT.md       # Solução: Erro do bcrypt
    └── SOLUCAO_ERRO_DATABASE.md # Solução: Erro do banco de dados
```

## 📄 Arquivos na Raiz

Na raiz do projeto, mantivemos apenas os arquivos essenciais:

- `README.md` - README principal do projeto
- `CONTRIBUTING.md` - Guia de contribuição
- `todo.md` - Lista de tarefas (se houver)

## 🎯 Navegação

### Por Categoria

1. **Setup e Configuração** (`docs/setup/`)
   - Guias para configurar o ambiente, banco de dados, cache, etc.

2. **Guias de Funcionalidades** (`docs/guides/`)
   - Guias detalhados sobre funcionalidades específicas

3. **Deploy** (`docs/deployment/`)
   - Guias para fazer deploy em diferentes plataformas

4. **Soluções de Problemas** (`docs/solutions/`)
   - Soluções para problemas comuns

### Por Fluxo

1. **Começar a Usar**
   - `docs/setup/INICIO_RAPIDO.md`
   - `docs/setup/CONFIGURAR_ENV.md`
   - `docs/setup/SETUP_DOCKER_MYSQL.md`

2. **Configurar Funcionalidades**
   - `docs/setup/SETUP_CACHE_ACOES.md`
   - `docs/guides/GUIA_CACHE_ACOES.md`

3. **Fazer Deploy**
   - `docs/deployment/DEPLOY.md`
   - Escolha uma plataforma específica

4. **Resolver Problemas**
   - `docs/solutions/` - Veja as soluções disponíveis

## 🔗 Links Rápidos

- [Índice Principal](README.md)
- [Início Rápido](setup/INICIO_RAPIDO.md)
- [Configuração do Ambiente](setup/CONFIGURAR_ENV.md)
- [Setup do Banco de Dados](setup/README_BACKEND.md)
- [Guia do Cache de Ações](guides/GUIA_CACHE_ACOES.md)
- [Guia Geral de Deploy](deployment/DEPLOY.md)
- [Documentação da API](API.md)

