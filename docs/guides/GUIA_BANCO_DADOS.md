# Guia Completo - Configuração do Banco de Dados

## Opção 1: Usando o Script Automático (Recomendado)

### Windows

1. **Abra o PowerShell ou CMD** como administrador
2. **Navegue até a pasta do projeto**:
   ```powershell
   cd C:\Users\filip\Downloads\finbot-source
   ```
3. **Execute o script**:
   ```powershell
   .\setup-database.bat
   ```
4. **Digite as credenciais do MySQL** quando solicitado

### Linux/Mac

1. **Dê permissão de execução**:
   ```bash
   chmod +x setup-database.sh
   ```
2. **Execute o script**:
   ```bash
   ./setup-database.sh
   ```
3. **Digite as credenciais do MySQL** quando solicitado

---

## Opção 2: Manual (MySQL CLI)

### Passo 1: Conectar ao MySQL

```bash
mysql -u root -p
```

### Passo 2: Executar o Script SQL

Dentro do MySQL, execute:

```sql
source setup-database-completo.sql;
```

Ou execute diretamente do terminal:

```bash
mysql -u root -p < setup-database-completo.sql
```

---

## Opção 3: Usando Drizzle Kit (Recomendado para Desenvolvimento)

### Passo 1: Configurar .env

Certifique-se de que o arquivo `.env` tem:

```env
DATABASE_URL=mysql://usuario:senha@localhost:3306/bolsinho
```

### Passo 2: Executar Drizzle Kit

```bash
# Gerar migrations baseadas no schema
npx drizzle-kit generate

# Aplicar migrations ao banco
npx drizzle-kit push
```

---

## Verificação

### Verificar se o banco foi criado

```sql
-- Conectar ao MySQL
mysql -u root -p

-- Listar bancos
SHOW DATABASES;

-- Deve aparecer "bolsinho" na lista
```

### Verificar tabelas

```sql
-- Usar o banco
USE bolsinho;

-- Listar tabelas
SHOW TABLES;

-- Deve mostrar:
-- - users
-- - categories
-- - transactions
-- - budgets
-- - goals
-- - chatMessages
-- - alerts
-- - documents
-- - investments
```

### Verificar estrutura da tabela users

```sql
-- Ver estrutura da tabela users
DESCRIBE users;

-- Deve mostrar:
-- - id (int, primary key)
-- - openId (varchar(64), nullable, unique)
-- - name (text, nullable)
-- - email (varchar(320), nullable, unique)
-- - passwordHash (varchar(255), nullable)  ← NOVO
-- - loginMethod (varchar(64), nullable)
-- - role (enum, default 'user')
-- - createdAt, updatedAt, lastSignedIn (timestamps)
```

---

## Configurar DATABASE_URL

Após criar o banco, configure no arquivo `.env`:

```env
DATABASE_URL=mysql://root:suasenha@localhost:3306/bolsinho
```

**Importante**: Substitua `root` e `suasenha` pelas suas credenciais do MySQL.

---

## Troubleshooting

### Erro: "Access denied for user"

**Solução**: Verifique se as credenciais estão corretas.

```bash
# Testar conexão
mysql -u root -p
```

### Erro: "Database already exists"

**Solução**: O banco já existe. Você pode:
1. **Usar o banco existente** (pular criação)
2. **Deletar e recriar** (CUIDADO - perde todos os dados):

```sql
DROP DATABASE IF EXISTS bolsinho;
-- Depois execute setup-database-completo.sql novamente
```

### Erro: "Table already exists"

**Solução**: As tabelas já existem. Execute apenas a migration de autenticação:

```bash
mysql -u root -p bolsinho < setup-database-auth.sql
```

### Erro: "Cannot add foreign key constraint"

**Solução**: Execute as tabelas na ordem correta. Use o script `setup-database-completo.sql` que já faz isso.

### Erro: "Column 'openId' cannot be null"

**Solução**: Execute a migration de autenticação:

```bash
mysql -u root -p bolsinho < setup-database-auth.sql
```

---

## Próximos Passos

1. ✅ Banco de dados criado
2. ✅ Tabelas criadas
3. ⏭️ Configurar `DATABASE_URL` no `.env`
4. ⏭️ Configurar `JWT_SECRET` no `.env`
5. ⏭️ Testar conexão com o servidor
6. ⏭️ Criar primeiro usuário através do frontend

---

## Estrutura Final do Banco

```
bolsinho/
├── users (usuários)
├── categories (categorias de gastos)
├── transactions (transações financeiras)
├── budgets (orçamentos)
├── goals (metas financeiras)
├── chatMessages (mensagens do chat)
├── alerts (alertas e notificações)
├── documents (documentos processados)
└── investments (investimentos/portfólio)
```

Todas as tabelas estão relacionadas através de foreign keys e incluem índices para performance.

