# 🚀 Guia de Configurações Externas - Monetra

Este guia lista TODAS as configurações externas necessárias para publicar o app na Play Store e começar a vender assinaturas.

---

## 📋 RESUMO RÁPIDO

| Serviço | Finalidade | Obrigatório? |
|---------|------------|--------------|
| Google Play Console | Publicar app na Play Store | ✅ Sim |
| Google Play Billing | Vender assinaturas no app | ✅ Sim |
| RevenueCat | Gerenciar assinaturas (recomendado) | ⚠️ Recomendado |
| Supabase | Backend (auth, banco de dados) | ✅ Sim |
| Firebase | Analytics + Push Notifications | ⚠️ Recomendado |
| Stripe | Pagamentos web (opcional) | ❌ Opcional |

---

## 1️⃣ GOOGLE PLAY CONSOLE (Obrigatório)

**Finalidade:** Publicar o app na Play Store

### Passos:

1. **Criar conta de desenvolvedor**
   - Acesse: https://play.google.com/console
   - Pague a taxa única de $25 USD
   - Complete o perfil de desenvolvedor

2. **Criar o aplicativo**
   - Clique em "Criar aplicativo"
   - Nome: `Monetra - Gestão Financeira`
   - Idioma: Português (Brasil)
   - Gratuito ou pago: Gratuito com compras no app

3. **Configurar assinaturas (In-app products)**
   - Vá em: Monetize → Products → Subscriptions
   - Crie os planos:
   
   ```
   Plano 1: premium_mensal
   - Nome: Premium Mensal
   - Preço: R$ 19,90/mês
   - Período: 1 mês
   
   Plano 2: business_mensal
   - Nome: Business Mensal
   - Preço: R$ 49,90/mês
   - Período: 1 mês
   ```

4. **Configurar Licensing**
   - Vá em: Setup → Licensing
   - Copie a chave de licença (para o arquivo .env)

---

## 2️⃣ REVENUECAT (Recomendado para Assinaturas)

**Finalidade:** Gerenciar assinaturas de forma simplificada

### Por que usar?
- Facilita muito a integração com Google Play Billing
- Gerencia webhooks automaticamente
- Painel para ver assinantes e métricas
- SDK pronto para React Native/Capacitor

### Passos:

1. **Criar conta**
   - Acesse: https://www.revenuecat.com
   - Crie uma conta gratuita (até $10k/mês em receita)

2. **Criar projeto**
   - Nome: `Monetra`
   - Plataforma: Android

3. **Configurar Google Play**
   - Vá em: Settings → Integrations → Google Play
   - Cole a chave de licença do Play Console
   - Configure o tópico Pub/Sub para webhooks

4. **Criar produtos**
   - Vá em: Products
   - Crie os produtos com os mesmos IDs do Play Console:
     - `premium_mensal`
     - `business_mensal`

5. **Criar Entitlements**
   ```
   Entitlement: premium
   - Attachments: premium_mensal, business_mensal
   ```

6. **Copiar API Key**
   - Vá em: Settings → API Keys
   - Copie a chave para o .env

---

## 3️⃣ SUPABASE (Obrigatório - Backend)

**Finalidade:** Autenticação, banco de dados, storage

### Passos:

1. **Criar conta**
   - Acesse: https://supabase.com
   - Crie uma organização e projeto

2. **Configurar autenticação**
   - Vá em: Authentication → Providers
   - Ative: Email/Password
   - Opcional: Google, Apple (para OAuth)

3. **Criar tabelas**
   ```sql
   -- Executar no SQL Editor
   
   CREATE TABLE users (
     id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
     email TEXT UNIQUE NOT NULL,
     name TEXT,
     plan TEXT DEFAULT 'FREE',
     created_at TIMESTAMPTZ DEFAULT NOW()
   );
   
   CREATE TABLE transactions (
     id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
     user_id UUID REFERENCES users(id),
     description TEXT,
     amount DECIMAL(10,2),
     type TEXT,
     category TEXT,
     date DATE,
     created_at TIMESTAMPTZ DEFAULT NOW()
   );
   
   CREATE TABLE goals (
     id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
     user_id UUID REFERENCES users(id),
     name TEXT,
     target_amount DECIMAL(10,2),
     current_amount DECIMAL(10,2) DEFAULT 0,
     deadline DATE,
     created_at TIMESTAMPTZ DEFAULT NOW()
   );
   
   -- RLS Policies
   ALTER TABLE users ENABLE ROW LEVEL SECURITY;
   ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;
   ALTER TABLE goals ENABLE ROW LEVEL SECURITY;
   
   CREATE POLICY "Users can only see own data" ON users
     FOR ALL USING (auth.uid() = id);
   
   CREATE POLICY "Users can only see own transactions" ON transactions
     FOR ALL USING (auth.uid() = user_id);
   
   CREATE POLICY "Users can only see own goals" ON goals
     FOR ALL USING (auth.uid() = user_id);
   ```

4. **Copiar credenciais**
   - Vá em: Settings → API
   - Copie: `Project URL` e `anon public key`

---

## 4️⃣ FIREBASE (Recomendado)

**Finalidade:** Analytics, Push Notifications, Crashlytics

### Passos:

1. **Criar projeto**
   - Acesse: https://console.firebase.google.com
   - Crie um novo projeto

2. **Adicionar app Android**
   - Nome do pacote: `com.monetra.app`
   - Baixe o `google-services.json`

3. **Configurar Analytics**
   - Já vem ativado por padrão
   - Configure eventos personalizados se quiser

4. **Configurar Cloud Messaging (Push)**
   - Vá em: Engage → Cloud Messaging
   - Copie a Server Key

5. **Configurar Crashlytics**
   - Vá em: Quality → Crashlytics
   - Siga as instruções de setup

---

## 5️⃣ STRIPE (Opcional - Pagamentos Web)

**Finalidade:** Receber pagamentos pela versão web

### Passos:

1. **Criar conta**
   - Acesse: https://stripe.com
   - Complete o cadastro da empresa

2. **Criar produtos**
   - Vá em: Products
   - Crie os planos Premium e Business

3. **Configurar webhooks**
   - Vá em: Developers → Webhooks
   - Adicione endpoint: `https://seudominio.com/api/stripe/webhook`

4. **Copiar chaves**
   - Vá em: Developers → API Keys
   - Copie: Publishable Key e Secret Key

---

## 📁 ARQUIVO .env (Configurações)

Crie o arquivo `.env.local` na raiz do projeto:

```env
# ============================================
# CONFIGURAÇÕES OBRIGATÓRIAS
# ============================================

# Supabase (Backend)
NEXT_PUBLIC_SUPABASE_URL=https://seu-projeto.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=sua-chave-anonima
SUPABASE_SERVICE_ROLE_KEY=sua-chave-service-role

# Google Play Console
GOOGLE_PLAY_LICENSE_KEY=sua-chave-de-licenca

# ============================================
# CONFIGURAÇÕES RECOMENDADAS
# ============================================

# RevenueCat (Assinaturas)
REVENUECAT_API_KEY=sua-api-key
REVENUECAT_PROJECT_ID=seu-project-id

# Firebase
NEXT_PUBLIC_FIREBASE_API_KEY=sua-api-key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=seu-projeto.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=seu-projeto-id
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=seu-sender-id
NEXT_PUBLIC_FIREBASE_APP_ID=seu-app-id
FIREBASE_SERVER_KEY=sua-server-key

# ============================================
# CONFIGURAÇÕES OPCIONAIS
# ============================================

# Stripe (Pagamentos Web)
STRIPE_PUBLISHABLE_KEY=pk_live_xxx
STRIPE_SECRET_KEY=sk_live_xxx
STRIPE_WEBHOOK_SECRET=whsec_xxx

# App
NEXT_PUBLIC_APP_URL=https://monetra.app
```

---

## 🔐 SEGURANÇA IMPORTANTE

### NUNCA commitar no Git:
- Arquivo `.env.local`
- `google-services.json`
- Chaves de API privadas
- Senhas de serviços

### Adicionar ao .gitignore:
```
.env.local
.env.production
google-services.json
*.keystore
```

---

## 📱 CHECKLIST FINAL

### Antes de publicar:

- [ ] Conta Google Play Console criada ($25)
- [ ] App criado no Play Console
- [ ] Assinaturas configuradas no Play Console
- [ ] Conta RevenueCat criada e configurada
- [ ] Projeto Supabase criado
- [ ] Tabelas criadas no Supabase
- [ ] RLS configurado no Supabase
- [ ] Projeto Firebase criado
- [ ] `google-services.json` adicionado ao projeto
- [ ] Arquivo `.env.local` configurado
- [ ] Screenshots do app preparados (mínimo 2)
- [ ] Ícone de alta resolução (512x512)
- [ ] Banner de promoção (1024x500) - opcional
- [ ] Política de privacidade publicada online
- [ ] Classificação de conteúdo preenchida

---

## 💰 CUSTOS ESTIMADOS

| Serviço | Custo |
|---------|-------|
| Google Play Console | $25 (único) |
| RevenueCat | Grátis até $10k/mês |
| Supabase | Grátis até 500MB |
| Firebase | Grátis até limite generoso |
| Stripe | 4,99% + R$0,50 por transação |

**Total inicial: ~$25 USD**

---

## 🆘 SUPORTE

Se precisar de ajuda com qualquer configuração, me avise!
