import WebSocket from 'ws';

const wss = new WebSocket.Server({ port: 8080 });

wss.on('connection', (ws) => {
  console.log('Client connected');

  ws.on('message', (data) => {
    console.log('Received data: ', data);
    // You can broadcast or send the received chunk to all connected clients (if multiple clients).
    wss.clients.forEach((client) => {
      if (client !== ws && client.readyState === WebSocket.OPEN) {
        client.send(data); // Send the chunk to the frontend
      }
    });
  });

  ws.on('close', () => {
    console.log('Client disconnected');
  });
});
