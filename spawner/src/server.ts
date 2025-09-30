import WebSocket from 'ws';
import http from 'http';

// Store the Meet URL that frontend will send
export let currentMeetUrl = '';

// This will be set from index.ts - using object to make it mutable
export const botController = {
  startBot: null as ((url: string) => void) | null
};

// Create HTTP server for API
const server = http.createServer((req, res) => {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  
  if (req.method === 'OPTIONS') {
    res.writeHead(200);
    res.end();
    return;
  }

  // POST /start - Receive Meet URL and start bot
  if (req.url === '/start' && req.method === 'POST') {
    let body = '';
    req.on('data', chunk => { body += chunk; });
    req.on('end', async () => {
      const { meetUrl } = JSON.parse(body);
      currentMeetUrl = meetUrl;
      console.log('Received Meet URL:', meetUrl);
      
      // Call the bot start function
      console.log('botController.startBot is:', botController.startBot);
      if (botController.startBot) {
        console.log('🚀 Calling bot start function...');
        botController.startBot(meetUrl);
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success: true, message: 'Bot starting...' }));
      } else {
        console.log('❌ Bot not ready!');
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success: false, message: 'Bot not ready' }));
      }
    });
  } else {
    res.writeHead(404);
    res.end('Not found');
  }
});

server.listen(3001, () => {
  console.log('HTTP server running on http://localhost:3001');
});

// WebSocket server for video streaming
const wss = new WebSocket.Server({ port: 8080 });

wss.on('connection', (ws) => {
  console.log('Client connected');

  ws.on('message', (data) => {
    console.log('Received data: ', data);
    wss.clients.forEach((client) => {
      if (client !== ws && client.readyState === WebSocket.OPEN) {
        client.send(data);
      }
    });
  });

  ws.on('close', () => {
    console.log('Client disconnected');
  });
});
