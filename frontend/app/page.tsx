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
    <main className="min-h-screen bg-black p-8">
      {/* Header */}
      <div className="max-w-7xl mx-auto mb-10">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-4xl text-white font-bold mb-2">
              Meeting Recorder
            </h1>
            <p className="text-gray-500 text-sm">Automated Google Meet recording bot</p>
          </div>
          {status === 'recording' && (
            <div className="flex items-center gap-2 px-4 py-2 bg-red-500/10 border border-red-500/50 rounded-lg">
              <span className="relative flex h-3 w-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span>
              </span>
              <span className="text-red-400 font-medium text-sm">Recording Live</span>
            </div>
          )}
        </div>
      </div>

      <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Side - Recording Controls */}
        <div className="lg:col-span-1 space-y-6">
          {/* URL Input Card */}
          <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6 shadow-2xl">
            <h2 className="text-lg text-white font-semibold mb-4">Meeting Setup</h2>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-2">
                  Google Meet URL
                </label>
                <input
                  type="text"
                  value={meetUrl}
                  onChange={(e) => setMeetUrl(e.target.value)}
                  placeholder="https://meet.google.com/xxx-xxxx-xxx"
                  disabled={status === 'recording'}
                  className="w-full bg-black text-white px-4 py-3 border border-zinc-700 rounded-lg focus:outline-none focus:ring-1 focus:ring-white disabled:opacity-50 disabled:cursor-not-allowed outline-none transition placeholder:text-gray-600 focus:border-1"
                />
              </div>

              {/* Error Message */}
              {error && (
                <div className="p-3 bg-red-500/10 border border-red-500/50 rounded-lg">
                  <div className="flex justify-center items-center gap-2">
                    <span className="text-red-400 text-lg">⚠️</span>
                    <p className="text-red-400 text-sm">{error}</p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Control Buttons Card */}
          <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6 shadow-2xl">
            <h2 className="text-lg text-white font-semibold mb-4">Controls</h2>

            <div className="space-y-3">
              <button
                onClick={handleStart}
                disabled={status === 'recording'}
                className="w-full bg-white hover:bg-gray-200 text-black py-3.5 px-4 rounded-lg font-semibold transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-white"
              >
                <span className="flex items-center justify-center gap-2">
                  <span>▶️</span>
                  Start Recording
                </span>
              </button>

              <button
                onClick={handleStop}
                disabled={status !== 'recording'}
                className="w-full bg-black border-gray-200 text-white py-3.5 px-4 rounded-lg font-semibold transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed border-1 hover:border-solid"
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
            <div className="bg-zinc-900 border border-green-500/50 rounded-xl p-6 shadow-2xl">
              <div className="flex items-center gap-2 mb-4">
                <span className="text-2xl">✅</span>
                <h3 className="text-lg font-semibold text-green-400">Recording Saved!</h3>
              </div>
              <div className="space-y-2.5 text-sm">
                <div className="flex justify-between items-center p-2 bg-black rounded-lg">
                  <span className="text-gray-400">Filename</span>
                  <span className="text-white font-mono text-xs">{recordingDetails.filename}</span>
                </div>
                <div className="flex justify-between items-center p-2 bg-black rounded-lg">
                  <span className="text-gray-400">Size</span>
                  <span className="text-white font-semibold">{recordingDetails.size}</span>
                </div>
                <div className="flex justify-between items-center p-2 bg-black rounded-lg">
                  <span className="text-gray-400">Duration</span>
                  <span className="text-white font-semibold">{recordingDetails.duration}</span>
                </div>
                <div className="mt-3 pt-3 border-t border-zinc-800">
                  <p className="text-xs text-gray-500">
                    📁 Location: <span className="text-gray-400 font-mono">spawner/recordings/</span>
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Right Side - Activity Logs */}
        <div className="lg:col-span-2">
          <div className="bg-zinc-900 border border-zinc-800 rounded-xl shadow-2xl overflow-hidden" style={{ height: '700px' }}>
            <div className="bg-black border-b border-zinc-800 px-6 py-4">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-lg text-white font-semibold">Activity Logs</h2>
                  <p className="text-xs text-gray-500">Real-time bot activity stream</p>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                  <span className="text-xs text-gray-500">Live</span>
                </div>
              </div>
            </div>
            
            <div className="h-[calc(100%-72px)] overflow-y-auto p-6 bg-black font-mono text-sm">
              {logs.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-gray-600">
                  <div className="w-16 h-16 bg-zinc-900 rounded-full flex items-center justify-center mb-4">
                    <span className="text-3xl">💤</span>
                  </div>
                  <p className="text-center">No activity yet</p>
                  <p className="text-xs text-gray-700 mt-2">Start recording to see real-time logs...</p>
                </div>
              ) : (
                <div className="space-y-1">
                  {logs.map((log, index) => (
                    <div 
                      key={index} 
                      className="text-gray-300 hover:bg-zinc-900/50 px-2 py-1 rounded transition-colors duration-150"
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
    </main>
  );
}
