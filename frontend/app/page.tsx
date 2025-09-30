'use client';

import { useState, useEffect, useRef } from 'react';

export default function Home() {
  const [meetUrl, setMeetUrl] = useState('');
  const [status, setStatus] = useState('idle'); // idle, recording, stopped
  const [error, setError] = useState('');
  const [logs, setLogs] = useState<string[]>([]);
  const [recordingDetails, setRecordingDetails] = useState<{filename: string; size: string; duration: string} | null>(null);
  const logsEndRef = useRef<HTMLDivElement>(null);
  const eventSourceRef = useRef<EventSource | null>(null);

  // Auto-scroll logs to bottom
  useEffect(() => {
    logsEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [logs]);

  // Connect to SSE log stream on mount
  useEffect(() => {
    let eventSource: EventSource | null = null;
    let reconnectTimeout: NodeJS.Timeout;

    const connect = () => {
      try {
        console.log('🔌 Connecting to SSE log stream...');
        eventSource = new EventSource('http://localhost:3001/logs');
        eventSourceRef.current = eventSource;
        
        eventSource.onopen = () => {
          console.log('✅ SSE connection opened');
        };
        
        eventSource.onmessage = (event) => {
          try {
            const data = JSON.parse(event.data);
            setLogs(prev => [...prev, data.log]);
          } catch (e) {
            console.error('Failed to parse SSE message:', e);
          }
        };
        
        eventSource.onerror = () => {
          if (eventSource?.readyState === EventSource.CLOSED) {
            console.log('SSE connection closed, will retry in 5s...');
            reconnectTimeout = setTimeout(connect, 5000);
          }
        };
      } catch (error) {
        console.error('Failed to create EventSource:', error);
        reconnectTimeout = setTimeout(connect, 5000);
      }
    };

    connect();
    
    return () => {
      if (reconnectTimeout) clearTimeout(reconnectTimeout);
      if (eventSource) {
        eventSource.close();
      }
    };
  }, []);

  const handleStart = async () => {
    if (!meetUrl.trim()) {
      setError('Please enter a Google Meet URL');
      return;
    }
    
    setStatus('recording');
    setError('');
    setLogs([]);
    setRecordingDetails(null);
    
    try {
      const response = await fetch('http://localhost:3001/start', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ meetUrl })
      });
      
      const data = await response.json();
      if (!response.ok) {
        setError(data.message || 'Failed to start bot');
        setStatus('idle');
      }
    } catch {
      setError('Failed to connect to backend. Make sure backend is running on port 3001.');
      setStatus('idle');
    }
  };

  const handleStop = async () => {
    setStatus('stopped');
    setError('');

    try {
      const response = await fetch('http://localhost:3001/stop', {
        method: 'POST',
      });

      const data = await response.json();

      if (response.ok && data.success) {
        // Show success in UI instead of alert
        setRecordingDetails({
          filename: data.filename || 'recording.webm',
          size: data.size || 'Unknown',
          duration: data.duration || 'Unknown'
        });
        
        setTimeout(() => {
          setMeetUrl('');
          setStatus('idle');
        }, 5000);
      } else {
        setError(data.message || 'Failed to stop recording');
        setStatus('idle');
      }
    } catch {
      setError('Failed to stop recording. Check backend logs.');
      setStatus('idle');
    }
  };

  return (
    <main className="min-h-screen bg-black">
      {/* Header with bottom border */}
      <div className="border-b border-zinc-900 px-4 sm:px-8 py-4 sm:py-6">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-between gap-3">
            <div className="flex-1 min-w-0">
              <h1 className="text-2xl sm:text-3xl lg:text-4xl text-white font-bold mb-1 sm:mb-2 truncate">
                Meeting Recorder
              </h1>
              <p className="text-gray-500 text-xs sm:text-sm">Automated Google Meet recording bot</p>
            </div>
            
            <div className="flex items-center gap-2 flex-shrink-0">
              {/* Social Links */}
              {/* GitHub */}
              <a
                href="https://github.com/ketankauntia/Meeting-Sumarizer-ai"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1.5 sm:gap-2 px-2.5 sm:px-4 py-1.5 sm:py-2 bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 rounded-lg transition-colors duration-200 group"
                title="View on GitHub"
              >
                <svg className="w-4 h-4 sm:w-5 sm:h-5 text-gray-400 group-hover:text-white transition-colors" fill="currentColor" viewBox="0 0 24 24">
                  <path fillRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" clipRule="evenodd" />
                </svg>
                <span className="text-xs sm:text-sm text-gray-400 group-hover:text-white transition-colors hidden sm:inline">GitHub</span>
              </a>

              {/* X (Twitter) */}
              <a
                href="https://x.com/KauntiaKetan"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1.5 sm:gap-2 px-2.5 sm:px-4 py-1.5 sm:py-2 bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 rounded-lg transition-colors duration-200 group"
                title="Follow on X"
              >
                <svg className="w-4 h-4 sm:w-5 sm:h-5 text-gray-400 group-hover:text-white transition-colors" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                </svg>
                <span className="text-xs sm:text-sm text-gray-400 group-hover:text-white transition-colors hidden sm:inline">/ KauntiaKetan</span>
              </a>
            </div>
          </div>
          
          {/* Recording Status Badge - Below header on mobile, inline on desktop */}
          {status === 'recording' && (
            <div className="flex items-center gap-2 px-3 sm:px-4 py-1.5 sm:py-2 bg-red-500/10 border border-red-500/50 rounded-lg mt-3 w-fit">
              <span className="relative flex h-2.5 w-2.5 sm:h-3 sm:w-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 sm:h-3 sm:w-3 bg-red-500"></span>
              </span>
              <span className="text-red-400 font-medium text-xs sm:text-sm">Recording Live</span>
            </div>
          )}
        </div>
      </div>

      {/* Main Content */}
      <div className="p-4 sm:p-6 lg:p-8">
        <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
          {/* Left Side - Recording Controls */}
          <div className="lg:col-span-1 space-y-4 sm:space-y-6">
            {/* URL Input Card */}
            <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4 sm:p-6 shadow-2xl">
            <h2 className="text-base sm:text-lg text-white font-semibold mb-3 sm:mb-4 pb-3 sm:pb-4 border-b border-zinc-800">Meeting Setup</h2>

            <div className="space-y-3 sm:space-y-4 pt-2">
              <div>
                <label className="block text-xs sm:text-sm font-medium text-gray-400 mb-2">
                  Google Meet URL
                </label>
                <input
                  type="text"
                  value={meetUrl}
                  onChange={(e) => setMeetUrl(e.target.value)}
                  placeholder="https://meet.google.com/xxx-xxxx-xxx"
                  disabled={status === 'recording'}
                  className="w-full bg-black text-white text-sm sm:text-base px-3 sm:px-4 py-2.5 sm:py-3 border border-zinc-700 rounded-lg focus:outline-none focus:ring-1 focus:ring-white disabled:opacity-50 disabled:cursor-not-allowed outline-none transition placeholder:text-gray-600"
                />
              </div>

              {/* Error Message */}
              {error && (
                <div className="p-2.5 sm:p-3 bg-red-500/10 border border-red-500/50 rounded-lg">
                  <div className="flex justify-center items-center gap-2">
                    <span className="text-red-400 text-base sm:text-lg">⚠️</span>
                    <p className="text-red-400 text-xs sm:text-sm">{error}</p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Control Buttons Card */}
          <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4 sm:p-6 shadow-2xl">
            <h2 className="text-base sm:text-lg text-white font-semibold mb-3 sm:mb-4 pb-3 sm:pb-4 border-b border-zinc-800">Controls</h2>

            <div className="space-y-2.5 sm:space-y-3 pt-2">
              <button
                onClick={handleStart}
                disabled={status === 'recording'}
                className="w-full bg-white hover:bg-gray-200 text-black py-2.5 sm:py-3.5 px-4 rounded-lg text-sm sm:text-base font-semibold transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-white"
              >
                <span className="flex items-center justify-center gap-2">
                  <span>▶️</span>
                  Start Recording
                </span>
              </button>

              <button
                onClick={handleStop}
                disabled={status !== 'recording'}
                className="w-full bg-red-600 hover:bg-red-700 text-white py-2.5 sm:py-3.5 px-4 rounded-lg text-sm sm:text-base font-semibold transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-red-600"
              >
                <span className="flex items-center justify-center gap-2">
                  <span>⏹️</span>
                  Stop Recording
                </span>
              </button>
            </div>
          </div>

          {/* Recording Details Card */}
          {recordingDetails && (
            <div className="bg-zinc-900 border border-green-500/50 rounded-xl p-4 sm:p-6 shadow-2xl">
              <div className="flex items-center gap-2 mb-3 sm:mb-4">
                <span className="text-xl sm:text-2xl">✅</span>
                <h3 className="text-base sm:text-lg font-semibold text-green-400">Recording Saved!</h3>
              </div>
              <div className="space-y-2 sm:space-y-2.5 text-xs sm:text-sm">
                <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center p-2 bg-black rounded-lg gap-1">
                  <span className="text-gray-400">Filename</span>
                  <span className="text-white font-mono text-xs break-all">{recordingDetails.filename}</span>
                </div>
                <div className="flex justify-between items-center p-2 bg-black rounded-lg">
                  <span className="text-gray-400">Size</span>
                  <span className="text-white font-semibold">{recordingDetails.size}</span>
                </div>
                <div className="flex justify-between items-center p-2 bg-black rounded-lg">
                  <span className="text-gray-400">Duration</span>
                  <span className="text-white font-semibold">{recordingDetails.duration}</span>
                </div>
                <div className="mt-2 sm:mt-3 pt-2 sm:pt-3 border-t border-zinc-800">
                  <p className="text-xs text-gray-500 break-all">
                    📁 Location: <span className="text-gray-400 font-mono">spawner/recordings/</span>
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

         {/* Right Side - Activity Logs */}
         <div className="lg:col-span-2">
           <div className="bg-zinc-900 border border-zinc-800 rounded-xl shadow-2xl overflow-hidden h-[500px] sm:h-[600px] lg:h-[700px]">
            <div className="bg-black border-b border-zinc-800 px-4 sm:px-6 py-3 sm:py-4">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-base sm:text-lg text-white font-semibold">Activity Logs</h2>
                  <p className="text-xs text-gray-500">Real-time bot activity stream</p>
                </div>
                <div className="flex items-center gap-1.5 sm:gap-2">
                  <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 bg-green-400 rounded-full animate-pulse"></div>
                  <span className="text-xs text-gray-500">Live</span>
                </div>
              </div>
            </div>
            
            <div className="h-[calc(100%-60px)] sm:h-[calc(100%-72px)] overflow-y-auto p-4 sm:p-6 bg-black font-mono text-xs sm:text-sm">
              {logs.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-gray-600">
                  <div className="w-12 h-12 sm:w-16 sm:h-16 bg-zinc-900 rounded-full flex items-center justify-center mb-3 sm:mb-4">
                    <span className="text-2xl sm:text-3xl">💤</span>
                  </div>
                  <p className="text-center text-sm sm:text-base">No activity yet</p>
                  <p className="text-xs text-gray-700 mt-2 px-4 text-center">Start recording to see real-time logs...</p>
                </div>
              ) : (
                <div className="space-y-0.5 sm:space-y-1">
                  {logs.map((log, index) => (
                    <div 
                      key={index} 
                      className="text-gray-300 hover:bg-zinc-900/50 px-1.5 sm:px-2 py-0.5 sm:py-1 rounded transition-colors duration-150 break-all"
                    >
                      {log}
                    </div>
                  ))}
                  <div ref={logsEndRef} />
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
      </div>
    </main>
  );
}
