// client.js

const WebSocket = require('ws');

const ws = new WebSocket('wss://34.47.235.85.nip.io/chat');

ws.on('open', () => {
  console.log('WebSocket connection established');
  // Send a join message to the server
  ws.send(JSON.stringify({ type: 'join', userId: 'user123', room: 'global' }));

  // Send a keep-alive message every minute
  const keepAliveInterval = setInterval(() => {
    if (ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify({ type: 'keep-alive' }));
    }
  }, 60000);

  ws.on('close', () => {
    clearInterval(keepAliveInterval);
  });
});

ws.on('message', (message) => {
  const data = JSON.parse(message);
  console.log('Received message:', data);
});

ws.on('close', () => {
  console.log('WebSocket connection closed');
});

ws.on('error', (error) => {
  console.error('WebSocket error:', error);
});