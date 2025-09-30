import WebSocket from 'ws';
import http from 'http';
import fs from 'fs';
import path from 'path';

// Store the Meet URL that frontend will send
export let currentMeetUrl = '';

// Store connected SSE clients for log broadcasting
const logClients: http.ServerResponse[] = [];

// Function to broadcast logs to all connected clients
export function broadcastLog(message: string) {
  const timestamp = new Date().toLocaleTimeString();
  const logMessage = `[${timestamp}] ${message}`;
  console.log(logMessage); // Also log to console
  
  logClients.forEach(client => {
    client.write(`data: ${JSON.stringify({ log: logMessage })}\n\n`);
  });
}

// This will be set from index.ts - using object to make it mutable
export const botController = {
  startBot: null as ((url: string) => void) | null,
  stopBot: null as (() => Promise<{ success: boolean; message: string }>) | null
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

  // GET /logs - SSE endpoint for real-time logs
  if (req.url === '/logs' && req.method === 'GET') {
    res.writeHead(200, {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
      'Access-Control-Allow-Origin': '*'
    });
    
    // Send initial connection message
    res.write(`data: ${JSON.stringify({ log: '[SSE] Connected to log stream' })}\n\n`);
    
    logClients.push(res);
    console.log('✅ SSE client connected. Total clients:', logClients.length);
    
    // Keep connection alive with periodic pings
    const keepAliveInterval = setInterval(() => {
      res.write(`: keepalive\n\n`);
    }, 15000);
    
    req.on('close', () => {
      clearInterval(keepAliveInterval);
      const index = logClients.indexOf(res);
      if (index > -1) {
        logClients.splice(index, 1);
      }
      console.log('SSE client disconnected. Remaining clients:', logClients.length);
    });
    
    return; // Don't fall through to 404
  }
  
  // POST /start - Receive Meet URL and start bot
  else if (req.url === '/start' && req.method === 'POST') {
    let body = '';
    req.on('data', chunk => { body += chunk; });
    req.on('end', async () => {
      const { meetUrl } = JSON.parse(body);
      currentMeetUrl = meetUrl;
      broadcastLog('📥 Received Meet URL: ' + meetUrl);
      
      if (botController.startBot) {
        broadcastLog('🚀 Starting bot...');
        botController.startBot(meetUrl);
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success: true, message: 'Bot starting...' }));
      } else {
        broadcastLog('❌ Bot not ready!');
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success: false, message: 'Bot not ready' }));
      }
    });
  } 
  
  // POST /stop - Stop recording and leave meeting
  else if (req.url === '/stop' && req.method === 'POST') {
    (async () => {
      try {
        if (botController.stopBot) {
          console.log('Calling stop bot function...');
          const result = await botController.stopBot();
          
          // Include recording details in response
          const response = {
            ...result,
            ...lastRecordingDetails
          };
          
          res.writeHead(result.success ? 200 : 500, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify(response));
        } else {
          res.writeHead(500, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ success: false, message: 'Stop function not available' }));
        }
      } catch (error) {
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success: false, message: 'Failed to stop recording' }));
      }
    })();
  }
  
  else {
    res.writeHead(404);
    res.end('Not found');
  }
});

server.listen(3001, () => {
  console.log('HTTP server running on http://localhost:3001');
});

// WebSocket server for video streaming
const wss = new WebSocket.Server({ port: 8080 });

// Storage for video chunks
const videoChunks: Buffer[] = [];
let recordingStartTime: number | null = null;
let lastRecordingDetails: {filename: string; size: string; duration: string} | null = null;

wss.on('connection', (ws) => {
  broadcastLog('🎥 Client connected - Recording started');
  recordingStartTime = Date.now();
  videoChunks.length = 0; // Clear previous chunks

  ws.on('message', (data) => {
    // Store the chunk
    videoChunks.push(data as Buffer);
    const totalSize = videoChunks.reduce((sum, chunk) => sum + chunk.length, 0);
    broadcastLog(`######### Chunk ${videoChunks.length} received | Total: ${(totalSize / 1024 / 1024).toFixed(2)} MB`);
  });

  ws.on('close', () => {
    broadcastLog('Client disconnected - Saving video...');
    
    if (videoChunks.length > 0) {
      // Create recordings directory if it doesn't exist
      const recordingsDir = path.join(process.cwd(), 'recordings');
      if (!fs.existsSync(recordingsDir)) {
        fs.mkdirSync(recordingsDir, { recursive: true });
      }
      
      // Generate filename with timestamp
      const timestamp = new Date().toISOString().replace(/:/g, '-').split('.')[0];
      const filename = `recording-${timestamp}.webm`;
      const filepath = path.join(recordingsDir, filename);
      
      // Combine all chunks into one file
      const videoBuffer = Buffer.concat(videoChunks);
      fs.writeFileSync(filepath, videoBuffer);
      
      const duration = recordingStartTime ? ((Date.now() - recordingStartTime) / 1000).toFixed(1) : 'unknown';
      const sizeInMB = (videoBuffer.length / 1024 / 1024).toFixed(2);
      
      broadcastLog(`Video saved: ${filename}`);
      broadcastLog(`Size: ${sizeInMB} MB`);
      broadcastLog(`Duration: ~${duration}s`);
      
      // Store details for frontend
      lastRecordingDetails = {
        filename: filename,
        size: `${sizeInMB} MB`,
        duration: `${duration}s`
      };
      
      // Clear chunks
      videoChunks.length = 0;
      recordingStartTime = null;
    } else {
      broadcastLog('!!!! No video chunks to save');
    }
  });
});
