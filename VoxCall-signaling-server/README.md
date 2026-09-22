# VoxCall Signaling Server

Servidor leve (WebSocket) usado só para duas coisas: **descoberta por tag**
(`Nome#XXXX`) e **relay do "aperto de mão" inicial do WebRTC** (offer/answer/
ICE). Depois desse aperto de mão, a chamada/chat/arquivos vão **direto entre
os dois PCs** — este servidor nunca vê o conteúdo de áudio, vídeo ou
arquivos, então é leve o suficiente pra caber no plano gratuito do Render.

## Deploy no Render (gratuito, sem cartão de crédito)

**Passo 1 — Suba esta pasta pro GitHub**

Crie um repositório novo (pode ser privado) só com o conteúdo desta pasta
`server/` (ou o repositório inteiro do VoxCall — o Render só olha essa pasta
se você configurar o "Root Directory" no passo 3).

```bash
cd server
git init
git add .
git commit -m "voxcall signaling server"
git branch -M main
git remote add origin <URL_DO_SEU_REPO_NO_GITHUB>
git push -u origin main
```

**Passo 2 — Crie a conta no Render**

Vá em [render.com](https://render.com) → "Get Started" → pode entrar direto
com sua conta do GitHub. Não pede cartão de crédito para o plano gratuito.

**Passo 3 — Novo Web Service**

- Clique em **New +** → **Web Service**
- Conecte o repositório que você acabou de subir
- Se você subiu o repositório do VoxCall inteiro (não só a pasta `server/`),
  em **Root Directory** coloque `server`
- Preencha:
  - **Name**: `voxcall-signaling` (ou o nome que quiser — isso vira parte da
    URL pública)
  - **Runtime**: `Node`
  - **Build Command**: `npm install`
  - **Start Command**: `npm start`
  - **Instance Type**: **Free**
- Clique em **Create Web Service**

*(Alternativa mais rápida: se você subiu o repositório com o arquivo
`render.yaml` que já está nesta pasta, use **New + → Blueprint** em vez de
**Web Service** — o Render lê o `render.yaml` e preenche tudo isso
automaticamente.)*

**Passo 4 — Pegue a URL e cole no app**

Depois do primeiro deploy (leva 1–2 minutos), o Render mostra uma URL tipo:

```
https://voxcall-signaling.onrender.com
```

Abra o VoxCall → **Configurações → Servidor** e cole essa URL, trocando
`https://` por `wss://`:

```
wss://voxcall-signaling.onrender.com
```

*(o app já faz essa troca sozinho se você colar com `https://` mesmo)*

Reinicie o app. Pronto — agora qualquer pessoa, em qualquer rede, com o
VoxCall configurado pra esse mesmo endereço, consegue se achar por tag.

## Sobre o servidor "hibernar"

No plano gratuito, se ninguém tiver o VoxCall aberto por 15 minutos
seguidos, o Render desliga o serviço pra economizar recursos. A primeira
pessoa a abrir o app depois disso espera uns 30–60 segundos até a busca por
tag responder (o resto do app abre normal, só a parte de rede demora esse
tempinho na primeira vez).

Enquanto o app está aberto, ele manda um sinal a cada poucos minutos só pra
manter a conexão "viva" — então, com alguém usando, o servidor não hiberna
no meio de uma sessão. Quando todo mundo fecha o app, ele hiberna sozinho
de novo depois de um tempo. Não precisa fazer nada manualmente.

## Testando se está no ar

Acesse a URL do Render num navegador comum (`https://...`, sem trocar pra
`wss://`) — deve aparecer um texto simples tipo:

```
VoxCall signaling server ok — 0 usuário(s) online
```

Se aparecer isso, está funcionando.
