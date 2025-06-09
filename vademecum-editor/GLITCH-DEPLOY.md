# 🌟 Deploy no Glitch - Vademecum Editor

## 🚀 Como fazer o deploy

### Método 1: Import direto do GitHub
1. Acesse [glitch.com](https://glitch.com)
2. Clique em "New Project" → "Import from GitHub"
3. Cole a URL do repositório
4. Aguarde a importação

### Método 2: Upload manual
1. Faça download do projeto como ZIP
2. No Glitch, clique "New Project" → "Import from GitHub"
3. Faça upload do arquivo ZIP

## ⚙️ Configurações necessárias

### 1. Environment Variables (.env)
```
VITE_APP_NAME=Vademecum Editor
VITE_APP_VERSION=2.0
VITE_GLITCH_MODE=true
```

### 2. Configurar package.json
- O script `start` já está configurado
- Porta automática via `$PORT`

### 3. Instalar dependências
```bash
# No terminal do Glitch
refresh
```

## 🔧 Scripts disponíveis

- `bun start` - Iniciar em modo desenvolvimento
- `bun run build` - Build para produção
- `bun run preview` - Preview da build

## 📱 Funcionalidades no Glitch

✅ Todas as funcionalidades funcionam normalmente:
- Sistema de anotações e tags
- Templates predefinidos
- Geração de PDF
- Sistema de busca avançado
- Preview editável
- Persistência no localStorage

## 🔗 URLs no Glitch

Após o deploy:
- **App URL**: `https://seu-projeto.glitch.me`
- **Editor**: `https://glitch.com/edit/#!/seu-projeto`

## 🎯 Vantagens do Glitch

- ✅ Editor online integrado
- ✅ Colaboração em tempo real
- ✅ Remix fácil para customizações
- ✅ Hospedagem gratuita
- ✅ SSL automático
- ✅ Logs em tempo real

## 🚨 Limitações

- ⚠️ Projeto "dorme" após inatividade (plano gratuito)
- ⚠️ Limitações de recursos (RAM/CPU)
- ⚠️ Ideal para desenvolvimento e protótipos

## 🔄 Manter ativo

Para projetos que precisam ficar sempre online:
1. Use um serviço de "ping" (ex: UptimeRobot)
2. Ou considere o plano pago do Glitch
3. Ou use alternativas como Vercel/Netlify para produção
