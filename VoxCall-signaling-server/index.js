/**
 * VoxCall Signaling Server
 * ---------------------------------------------------------
 * Servidor MÍNIMO usado apenas para:
 *  1) Registrar usuários online por "tag" (Nome#XXXX)
 *  2) Permitir busca/adição de amigos por tag
 *  3) Fazer o "relay" das mensagens de sinalização WebRTC
 *     (offer/answer/ice candidates) entre dois peers
 *
 * O áudio/vídeo/chat/arquivos NUNCA passam por este servidor:
 * depois do handshake, a conexão é P2P direta (WebRTC). Isso
 * mantém o servidor extremamente leve (só texto pequeno) —
 * cabe tranquilamente no plano gratuito do Render.
 *
 * Local:  node index.js            (porta 4570 por padrão)
 * Render: usa automaticamente process.env.PORT
 */

const http = require('http');
const WebSocket = require('ws');

const PORT = process.env.PORT || process.env.VOXCALL_PORT || 4570;

// tag -> { ws, status }
const clients = new Map();

// Servidor HTTP "de verdade" por baixo do WebSocket:
//  - responde 200 em GET / para o health-check do Render
//  - dá um endpoint simples que o próprio app pode "bater" como keep-alive
const httpServer = http.createServer((req, res) => {
  res.writeHead(200, { 'Content-Type': 'text/plain; charset=utf-8' });
  res.end(`VoxCall signaling server ok — ${clients.size} usuário(s) online\n`);
});

const wss = new WebSocket.Server({ server: httpServer });

function send(ws, payload) {
  if (ws && ws.readyState === WebSocket.OPEN) {
    ws.send(JSON.stringify(payload));
  }
}

function broadcastStatus(tag, status) {
  for (const [, c] of clients) {
    send(c.ws, { type: 'presence', tag, status });
  }
}

wss.on('connection', (ws) => {
  let myTag = null;

  ws.on('message', (raw) => {
    let msg;
    try {
      msg = JSON.parse(raw);
    } catch (e) {
      return;
    }

    switch (msg.type) {
      // Sinal de vida periódico mandado pelo app enquanto está aberto.
      // Não faz nada além de contar como tráfego de entrada — é o que
      // evita o servidor gratuito hibernar enquanto alguém está com o
      // VoxCall aberto (ver nota no README).
      case 'heartbeat': {
        send(ws, { type: 'heartbeat-ack' });
        break;
      }

      // Registro inicial (após onboarding, ao abrir o app)
      case 'register': {
        myTag = msg.tag;
        clients.set(myTag, { ws, status: 'online' });
        send(ws, { type: 'registered', tag: myTag });
        broadcastStatus(myTag, 'online');
        break;
      }

      // Busca de usuário por tag exata (aba "Adicionar amigo")
      case 'lookup': {
        const found = clients.has(msg.tag);
        send(ws, {
          type: 'lookup-result',
          tag: msg.tag,
          found,
          status: found ? clients.get(msg.tag).status : 'offline',
        });
        break;
      }

      // Pedido de amizade (simplesmente notifica o destino; a UI decide aceitar)
      case 'friend-request':
      case 'friend-accept': {
        const target = clients.get(msg.to);
        if (target) send(target.ws, { ...msg, from: myTag });
        break;
      }

      // Relay de sinalização WebRTC (offer / answer / candidate)
      case 'offer':
      case 'answer':
      case 'ice-candidate':
      case 'call-end':
      case 'mute-state': {
        const target = clients.get(msg.to);
        if (target) send(target.ws, { ...msg, from: myTag });
        break;
      }

      default:
        break;
    }
  });

  ws.on('close', () => {
    if (myTag && clients.has(myTag)) {
      clients.delete(myTag);
      broadcastStatus(myTag, 'offline');
    }
  });
});

httpServer.listen(PORT, () => {
  console.log(`[VoxCall] Signaling server rodando na porta ${PORT}`);
});
