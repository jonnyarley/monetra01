# 🚀 Guia de Configuração e Deploy - Monetra

## 📋 Visão Geral

O Monetra já está configurado com:
- ✅ Capacitor para Android/iOS
- ✅ Sistema de autenticação JWT
- ✅ Banco de dados Prisma (SQLite)
- ✅ APIs completas
- ✅ Google Play Billing (assinaturas)

---

## 🔧 CONFIGURAÇÕES EXTERNAS NECESSÁRIAS

### 1. Google Play Console (Obrigatório para APK)

#### Passo 1: Criar Conta de Desenvolvedor
1. Acesse: https://play.google.com/console
2. Pague a taxa única de $25 USD
3. Aguarde aprovação (24-48h)

#### Passo 2: Criar Aplicativo
1. Clique em "Criar app"
2. Preencha:
   - Nome: **Monetra**
   - Idioma: Português (Brasil)
   - Gratuito/Pago: Gratuito

#### Passo 3: Configurar Produtos de Assinatura
No Google Play Console, vá em **Monetize > Subscriptions**:

| ID do Produto | Nome | Preço | Descrição |
|--------------|------|-------|-----------|
| `pro_monthly` | Pro Mensal | R$ 19,90/mês | Acesso completo ao Monetra Pro |
| `pro_yearly` | Pro Anual | R$ 149,90/ano | Economize 37% com o plano anual |
| `business_monthly` | Business Mensal | R$ 49,90/mês | Para empresas e times |

#### Passo 4: Configurar Credenciais
1. Vá em **Setup > API access**
2. Vincule com Google Cloud Project
3. Baixe o arquivo `google-services.json`
4. Coloque em: `android/app/google-services.json`

---

### 2. Servidor de Produção (Obrigatório)

O app precisa de um servidor backend. Opções:

#### Opção A: Vercel (Recomendado)
```bash
# Instalar Vercel CLI
npm i -g vercel

# Deploy
vercel --prod
```

#### Opção B: Railway
```bash
# Instalar Railway CLI
npm i -g @railway/cli

# Login e deploy
railway login
railway init
railway up
```

#### Opção C: VPS (DigitalOcean, AWS, etc.)
```bash
# Build e start
bun run build
bun run start
```

**Importante:** Anote a URL de produção (ex: `https://monetra.seudominio.com`)

---

### 3. Configurar URL de Produção no App

Edite o arquivo `capacitor.config.ts`:

```typescript
import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.monetra.app',
  appName: 'Monetra',
  webDir: 'out',
  server: {
    // ADICIONE SUA URL DE PRODUÇÃO AQUI:
    url: 'https://monetra.seudominio.com',
    cleartext: true, // apenas para desenvolvimento
    androidScheme: 'https'
  },
  // ... resto da config
};
```

---

### 4. Variáveis de Ambiente (Produção)

No seu servidor de produção, configure:

```env
# Banco de dados (use PostgreSQL para produção)
DATABASE_URL="postgresql://user:password@host:5432/monetra"

# Autenticação JWT
NEXTAUTH_SECRET="sua-chave-secreta-muito-longa-e-segura-32-chars"
JWT_SECRET="outra-chave-secreta-diferente-32-chars"

# URL do app
NEXTAUTH_URL="https://monetra.seudominio.com"

# Google Play Billing (opcional)
GOOGLE_PLAY_SERVICE_ACCOUNT_EMAIL="sua-conta@iam.gserviceaccount.com"
GOOGLE_PLAY_SERVICE_ACCOUNT_KEY="{...chave JSON...}"
```

---

## 📱 GERAR APK

### Opção 1: APK de Desenvolvimento (Teste)

```bash
# 1. Configurar URL do servidor (capacitor.config.ts)
# 2. Build do Next.js
bun run build

# 3. Sincronizar com Capacitor
bun run cap:sync

# 4. Abrir no Android Studio
bun run cap:open:android

# 5. No Android Studio: Build > Build Bundle(s) / APK(s) > Build APK(s)
```

### Opção 2: APK Assinado (Produção)

#### 1. Gerar Keystore
```bash
keytool -genkey -v -keystore monetra.keystore -alias monetra -keyalg RSA -keysize 2048 -validity 10000
```

#### 2. Configurar Assinatura
Crie `android/keystore.properties`:
```properties
storePassword=sua_senha
keyPassword=sua_senha
keyAlias=monetra
storeFile=../monetra.keystore
```

#### 3. Editar `android/app/build.gradle`
Adicione antes de `android {`:
```gradle
def keystorePropertiesFile = rootProject.file("keystore.properties")
def keystoreProperties = new Properties()
keystoreProperties.load(new FileInputStream(keystorePropertiesFile))
```

E dentro de `android {`:
```gradle
signingConfigs {
    release {
        keyAlias keystoreProperties['keyAlias']
        keyPassword keystoreProperties['keyPassword']
        storeFile file(keystoreProperties['storeFile'])
        storePassword keystoreProperties['storePassword']
    }
}
buildTypes {
    release {
        signingConfig signingConfigs.release
        minifyEnabled false
        proguardFiles getDefaultProguardFile('proguard-android.txt'), 'proguard-rules.pro'
    }
}
```

#### 4. Gerar APK/AAB
```bash
cd android
./gradlew assembleRelease    # APK
./gradlew bundleRelease      # AAB (para Google Play)
```

O APK estará em: `android/app/build/outputs/apk/release/app-release.apk`

---

## 🔄 FLUXO COMPLETO DE DEPLOY

```
1. Configurar servidor de produção (Vercel/Railway/VPS)
   ↓
2. Configurar variáveis de ambiente no servidor
   ↓
3. Fazer deploy do backend
   ↓
4. Atualizar capacitor.config.ts com URL de produção
   ↓
5. Criar app no Google Play Console
   ↓
6. Configurar assinaturas no Google Play
   ↓
7. Gerar APK assinado
   ↓
8. Upload para Google Play Console
   ↓
9. Preencher informações da loja
   ↓
10. Enviar para revisão
```

---

## 📝 CHECKLIST FINAL

### Backend/Servidor
- [ ] Servidor de produção configurado
- [ ] Banco de dados PostgreSQL configurado
- [ ] Variáveis de ambiente configuradas
- [ ] SSL/HTTPS ativo
- [ ] URLs de webhook funcionando

### Google Play
- [ ] Conta de desenvolvedor ativa
- [ ] App criado no console
- [ ] Produtos de assinatura configurados
- [ ] google-services.json no projeto
- [ ] Política de privacidade publicada

### App
- [ ] URL de produção no capacitor.config.ts
- [ ] Ícones e splash screens corretos
- [ ] VersionCode e VersionName atualizados
- [ ] Keystore gerada e guardada com segurança
- [ ] APK testado em dispositivo real

---

## 🔗 Links Úteis

- [Capacitor Docs](https://capacitorjs.com/docs)
- [Google Play Console](https://play.google.com/console)
- [Vercel](https://vercel.com)
- [Railway](https://railway.app)
- [Android Studio](https://developer.android.com/studio)

---

## 💡 Dicas

1. **Teste em dispositivo real** antes de publicar
2. **Mantenha backup da keystore** - se perder, não consegue atualizar o app
3. **Use PostgreSQL** em produção (SQLite é só para desenvolvimento)
4. **Configure CI/CD** para deploy automático
5. **Monitore erros** com Sentry ou similar
