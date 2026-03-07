# 🚀 Guia de Deploy - Monetra

Este guia contém todas as instruções para fazer o deploy do Monetra em produção.

---

## 📋 Pré-requisitos

- [ ] Conta no [Railway](https://railway.app) (gratuito para começar)
- [ ] Conta de Desenvolvedor no [Google Play Console](https://play.google.com/console) (R$ 100,00 única vez)
- [ ] Domínio próprio (opcional, mas recomendado)

---

## 1️⃣ Configurando o Railway

### Passo 1: Criar Conta
1. Acesse [railway.app](https://railway.app)
2. Clique em **"Start a New Project"**
3. Faça login com GitHub (recomendado) ou email

### Passo 2: Criar PostgreSQL
1. No dashboard, clique em **"+ New Project"**
2. Selecione **"Provision PostgreSQL"**
3. Aguarde a criação (leva ~30 segundos)

### Passo 3: Obter a String de Conexão
1. Clique no projeto PostgreSQL criado
2. Vá na aba **"Variables"**
3. Copie o valor de `DATABASE_URL`
4. Guarde este valor - você vai precisar!

**Exemplo da string:**
```
postgresql://postgres:XXXXX@containers-us-west-123.railway.app:5432/railway
```

### Passo 4: Criar o Projeto Web
1. No mesmo projeto (ou novo), clique em **"+ New Service"**
2. Selecione **"GitHub Repo"**
3. Autorize o Railway a acessar seu repositório
4. Selecione o repositório do Monetra

### Passo 5: Configurar Variáveis de Ambiente
No serviço web, vá em **"Variables"** e adicione:

```bash
# Obrigatórias
DATABASE_URL="postgresql://postgres:XXXXX@host:5432/railway"
NEXTAUTH_SECRET="gere-uma-chave-com-openssl-rand-base64-32"
NEXTAUTH_URL="https://seu-projeto.up.railway.app"

# Opcionais (Google Play)
GOOGLE_PLAY_CLIENT_EMAIL="xxx@xxx.iam.gserviceaccount.com"
GOOGLE_PLAY_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"

# Ambiente
NODE_ENV="production"
```

### Passo 6: Configurar Build
Nas configurações do serviço, configure:

**Build Command:**
```bash
bun install && bunx prisma generate && bunx prisma migrate deploy && bun run build
```

**Start Command:**
```bash
bun start
```

### Passo 7: Deploy
1. Clique em **"Deploy"**
2. Aguarde o build (primeira vez leva ~5 minutos)
3. Verifique os logs para confirmar sucesso

---

## 2️⃣ Configurando Domínio Personalizado

### Opção A: Domínio do Railway (Grátis)
1. No serviço web, vá em **"Settings"** → **"Domains"**
2. Clique em **"Generate Domain"**
3. Você receberá um domínio como: `seu-app.up.railway.app`

### Opção B: Domínio Próprio
1. Em **"Domains"**, clique em **"Custom Domain"**
2. Digite seu domínio (ex: `api.monetra.com`)
3. Adicione os registros DNS indicados no seu provedor:
   ```
   Tipo: CNAME
   Nome: api (ou @)
   Valor: seu-app.up.railway.app
   ```
4. Aguarde propagação DNS (até 48h, geralmente minutos)

---

## 3️⃣ Google Play Console

### Passo 1: Criar Conta
1. Acesse [play.google.com/console](https://play.google.com/console)
2. Pague a taxa única de R$ 100,00
3. Complete o perfil de desenvolvedor

### Passo 2: Criar Aplicativo
1. Clique em **"Criar app"**
2. Preencha:
   - Nome: **Monetra**
   - Idioma: Português (Brasil)
   - Gratuito/Pago: Gratuito

### Passo 3: Criar Produtos de Assinatura
Vá em **Monetize** → **Subscriptions** e crie:

| Product ID | Nome | Descrição | Preço |
|------------|------|-----------|-------|
| `basic_monthly` | Básico Mensal | Plano Básico - Mensal | R$ 14,90 |
| `basic_yearly` | Básico Anual | Plano Básico - Anual | R$ 149,90 |
| `pro_monthly` | Premium Mensal | Plano Premium - Mensal | R$ 24,90 |
| `pro_yearly` | Premium Anual | Plano Premium - Anual | R$ 249,90 |
| `business_monthly` | Business Mensal | Plano Business - Mensal | R$ 49,90 |
| `business_yearly` | Business Anual | Plano Business - Anual | R$ 499,90 |

### Passo 4: Criar Service Account (Para API)
1. Acesse [Google Cloud Console](https://console.cloud.google.com)
2. Selecione o projeto do app
3. Vá em **IAM & Admin** → **Service Accounts**
4. Clique em **"Create Service Account"**
5. Nome: `monetra-api`
6. Role: Selecione não precisa de role específica
7. Clique em **"Done"**
8. Clique no serviço criado → **"Keys"** → **"Add Key"** → **"Create new key"**
9. Selecione **JSON** e baixe o arquivo
10. Guarde este arquivo com segurança!

---

## 4️⃣ Variáveis do Service Account

Após baixar o JSON do Service Account, extraia:

```bash
# Do arquivo JSON:
GOOGLE_PLAY_CLIENT_EMAIL="client_email do JSON"
GOOGLE_PLAY_PRIVATE_KEY="private_key do JSON (mantenha os \n)"
```

Adicione estas variáveis no Railway.

---

## 5️⃣ Gerando o APK

### Opção A: PWA (Recomendado para começar)
O Monetra já é um PWA! Usuários podem:
1. Acessar o site no celular
2. Menu do navegador → "Adicionar à tela inicial"
3. Pronto! Funciona como app

### Opção B: TWA (Trusted Web Activity)
Para publicar na Play Store como app:

```bash
# Instalar Bubblewrap
npm install -g @anthropic/anthropic-bubblewrap

# Inicializar projeto TWA
bubblewrap init --manifest="https://seu-app.up.railway.app/manifest.json"

# Gerar APK
bubblewrap build
```

### Opção C: Capacitor (App Nativo)
Para mais recursos nativos:

```bash
# Instalar Capacitor
npm install @capacitor/core @capacitor/cli
npx cap init Monetra com.monetra.app

# Adicionar Android
npm install @capacitor/android
npx cap add android

# Build e sync
bun run build
npx cap sync

# Abrir no Android Studio
npx cap open android
```

---

## 6️⃣ Checklist Final

- [ ] PostgreSQL criado no Railway
- [ ] DATABASE_URL configurada
- [ ] NEXTAUTH_SECRET gerado e configurado
- [ ] NEXTAUTH_URL com domínio correto
- [ ] Deploy realizado com sucesso
- [ ] Domínio configurado e acessível
- [ ] Conta Google Play criada
- [ ] Produtos de assinatura criados
- [ ] Service Account configurado (se usar assinaturas)
- [ ] APK gerado ou PWA funcionando

---

## 🆘 Suporte

### Logs do Railway
- Acesse o serviço → **"Deployments"** → Clique no deploy → **"Logs"**

### Erros Comuns

**Erro: "Prisma Client could not connect"**
- Verifique se DATABASE_URL está correto
- Verifique se o PostgreSQL está rodando

**Erro: "NEXTAUTH_SECRET is required"**
- Gere uma chave: `openssl rand -base64 32`
- Adicione nas variáveis do Railway

**Erro: "CORS"**
- Verifique se NEXTAUTH_URL está com o domínio correto

---

## 📞 Contato

Precisa de ajuda? Abra uma issue no repositório!
