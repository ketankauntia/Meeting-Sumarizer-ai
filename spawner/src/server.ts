import WebSocket from 'ws';
import http from 'http';
import fs from 'fs';
import path from 'path';
import { GoogleGenerativeAI } from '@google/generative-ai';
import dotenv from 'dotenv';

dotenv.config();

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
  
  // POST /save-captions - Receive captions from browser
  else if (req.url === '/save-captions' && req.method === 'POST') {
    let body = '';
    req.on('data', chunk => { body += chunk; });
    req.on('end', () => {
      try {
        const data = JSON.parse(body);
        
        // Append captions to our storage
        if (data.captions && Array.isArray(data.captions)) {
          allCaptions.push(...data.captions);
          console.log(`📝 Received ${data.captions.length} captions. Total: ${allCaptions.length}`);
        }
        
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success: true }));
      } catch (error) {
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success: false, message: 'Failed to save captions' }));
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
          
          // Save captions to file if we have any
          if (allCaptions.length > 0) {
            const recordingsDir = path.join(process.cwd(), 'recordings');
            if (!fs.existsSync(recordingsDir)) {
              fs.mkdirSync(recordingsDir, { recursive: true });
            }
            
            const timestamp = new Date().toISOString().replace(/:/g, '-').split('.')[0];
            const captionFileName = `captions-${timestamp}.json`;
            captionFilePath = path.join(recordingsDir, captionFileName);
            
            fs.writeFileSync(captionFilePath, JSON.stringify({
              recordingDate: new Date().toISOString(),
              totalCaptions: allCaptions.length,
              captions: allCaptions
            }, null, 2));
            
            broadcastLog(`📝 Saved ${allCaptions.length} captions to ${captionFileName}`);
          }
          
          // Include recording details in response
          const response = {
            ...result,
            ...lastRecordingDetails,
            captionsFile: captionFilePath ? path.basename(captionFilePath) : null,
            captionsCount: allCaptions.length
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
  
  // POST /generate-summary - Generate meeting summary using Gemini AI
  else if (req.url === '/generate-summary' && req.method === 'POST') {
    (async () => {
      try {
        if (allCaptions.length === 0) {
          res.writeHead(400, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ 
            success: false, 
            message: 'No captions available. Make sure captions were captured during the meeting.' 
          }));
          return;
        }
        
        broadcastLog('🤖 Generating AI summary...');
        const summary = await generateSummary(allCaptions);
        
        // Save summary to file
        const recordingsDir = path.join(process.cwd(), 'recordings');
        const timestamp = new Date().toISOString().replace(/:/g, '-').split('.')[0];
        const summaryFileName = `summary-${timestamp}.md`;
        const summaryFilePath = path.join(recordingsDir, summaryFileName);
        
        fs.writeFileSync(summaryFilePath, summary);
        broadcastLog(`✅ Summary saved to ${summaryFileName}`);
        
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ 
          success: true, 
          summary,
          summaryFile: summaryFileName,
          captionsCount: allCaptions.length
        }));
        
        // Clear captions after generating summary
        allCaptions = [];
        
      } catch (error: any) {
        broadcastLog('❌ Failed to generate summary: ' + error.message);
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ 
          success: false, 
          message: error.message || 'Failed to generate summary' 
        }));
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

// Storage for captions
let allCaptions: Array<{ timestamp: string; speaker: string; text: string }> = [];
let captionFilePath: string | null = null;

// Initialize Gemini AI (API key should be set in environment variable)
const genAI = process.env.GEMINI_API_KEY ? new GoogleGenerativeAI(process.env.GEMINI_API_KEY) : null;

async function generateSummary(captions: Array<{ timestamp: string; speaker: string; text: string }>) {
  if (!genAI) {
    throw new Error('GEMINI_API_KEY not set in environment variables');
  }
  
  try {
    const model = genAI.getGenerativeModel({ model: 'gemini-pro' });
    
    // Format captions into a readable transcript
    const transcript = captions
      .map(c => `[${c.timestamp}] ${c.speaker}: ${c.text}`)
      .join('\n');
    
    const prompt = `You are an AI assistant that summarizes meeting transcripts. Please analyze the following meeting transcript and provide:

1. **Meeting Summary**: A concise overview of what was discussed (2-3 paragraphs)
2. **Key Points**: Bullet points of the main topics discussed
3. **Action Items**: Any tasks or action items mentioned (if any)
4. **Decisions Made**: Important decisions that were made (if any)
5. **Participants**: List of speakers who participated

Here is the meeting transcript:

${transcript}

Please provide a well-structured summary in markdown format.`;
    
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const summary = response.text();
    
    return summary;
  } catch (error) {
    console.error('Error generating summary:', error);
    throw error;
  }
}

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
