# 📱 Monetra - Guia de Build e Publicação

Este guia explica como gerar os aplicativos nativos para Android (Play Store) e iOS (App Store).

---

## 🛠️ Pré-requisitos

### Para Android (Play Store)
- Node.js 18+
- Java JDK 17+
- Android Studio (para builds)
- Conta Google Play Developer ($25 taxa única)

### Para iOS (App Store)
- Mac com macOS
- Xcode 15+
- Conta Apple Developer ($99/ano)
- Certificados de distribuição iOS

---

## 📦 Build para Android

### 1. Gerar build do web app
```bash
bun run build:static
```

### 2. Sincronizar com Capacitor
```bash
bun run cap:sync
```

### 3. Abrir no Android Studio
```bash
bun run cap:open:android
```

### 4. Gerar APK/AAB no Android Studio
1. Vá em **Build > Generate Signed Bundle/APK**
2. Selecione **Android App Bundle** (para Play Store) ou **APK** (para testes)
3. Crie ou use uma keystore existente
4. Selecione **release** build variant
5. O arquivo será gerado em `android/app/release/`

---

## 📱 Build para iOS

### 1. Adicionar plataforma iOS (apenas em Mac)
```bash
bun run cap:ios
```

### 2. Sincronizar
```bash
bun run build:ios
```

### 3. Abrir no Xcode
```bash
bun run cap:open:ios
```

### 4. Configurar no Xcode
1. Defina o Bundle ID
2. Configure assinatura e certificados
3. Defina ícones e splash screens
4. Archive e distribua para App Store Connect

---

## 🎨 Ícones do App

### Android
Os ícones ficam em:
```
android/app/src/main/res/mipmap-*/
```

Tamanhos necessários:
- **mdpi**: 48x48px
- **hdpi**: 72x72px
- **xhdpi**: 96x96px
- **xxhdpi**: 144x144px
- **xxxhdpi**: 192x192px

### iOS
Os ícones ficam em:
```
ios/App/App/Assets.xcassets/AppIcon.appiconset
```

Use o Image Asset Studio no Xcode para gerar todos os tamanhos automaticamente.

---

## 📋 Checklist para Publicação

### Play Store
- [ ] APK/AAB assinado gerado
- [ ] Ícones em todos os tamanhos
- [ ] Screenshots (phone, tablet)
- [ ] Descrição do app
- [ ] Política de privacidade
- [ ] Classificação de conteúdo

### App Store
- [ ] Build archive no Xcode
- [ ] Ícones configurados
- [ ] Screenshots (iPhone, iPad)
- [ ] Descrição e palavras-chave
- [ ] Política de privacidade
- [ ] URL de suporte

---

## 🚀 Comandos Úteis

| Comando | Descrição |
|---------|-----------|
| `bun run build:static` | Gera build estático do web app |
| `bun run cap:sync` | Sincroniza arquivos com plataformas nativas |
| `bun run cap:android` | Adiciona plataforma Android |
| `bun run cap:ios` | Adiciona plataforma iOS |
| `bun run cap:open:android` | Abre no Android Studio |
| `bun run cap:open:ios` | Abre no Xcode |
| `bun run build:android` | Build completo para Android |
| `bun run build:ios` | Build completo para iOS |

---

## 📚 Recursos

- [Documentação Capacitor](https://capacitorjs.com/docs)
- [Google Play Console](https://play.google.com/console)
- [App Store Connect](https://appstoreconnect.apple.com)
- [Android Developer](https://developer.android.com)
- [Apple Developer](https://developer.apple.com)
