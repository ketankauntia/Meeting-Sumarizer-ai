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
    console.log('🔌 Connecting to SSE log stream...');
    const eventSource = new EventSource('http://localhost:3001/logs');
    eventSourceRef.current = eventSource;
    
    eventSource.onopen = () => {
      console.log('✅ SSE connection opened');
    };
    
    eventSource.onmessage = (event) => {
      console.log('📨 Received SSE message:', event.data);
      const data = JSON.parse(event.data);
      setLogs(prev => [...prev, data.log]);
    };
    
    eventSource.onerror = (error) => {
      console.error('❌ SSE Error:', error);
      console.error('EventSource readyState:', eventSource.readyState);
    };
    
    return () => {
      console.log('🔌 Closing SSE connection');
      eventSource.close();
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
    <main className="min-h-screen bg-gray-50 p-8">
      <h1 className="text-3xl text-black font-bold text-center mb-8">
        Meeting Recorder
      </h1>

      <div className="max-w-7xl mx-auto flex gap-6">
        {/* Left Side - Recording Controls */}
        <div className="bg-white p-6 rounded-lg shadow-lg w-96 h-fit">
          <h2 className="text-xl text-black font-semibold mb-4">Recording Controls</h2>

          {/* URL Input */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Google Meet URL
            </label>
            <input
              type="text"
              value={meetUrl}
              onChange={(e) => setMeetUrl(e.target.value)}
              placeholder="https://meet.google.com/xxx-xxxx-xxx"
              disabled={status === 'recording'}
              className="w-full text-black outline-none px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-black focus:border-black disabled:bg-gray-100"
            />
          </div>

          {/* Error Message */}
          {error && (
            <div className="mb-4 p-3 bg-red-100 text-red-800 rounded-md text-sm">
              {error}
            </div>
          )}

          {/* Status */}
          {status !== 'idle' && (
            <div className={`mb-4 p-3 rounded-md text-center font-semibold ${
              status === 'recording' ? 'bg-green-100 text-green-800' : 'bg-blue-100 text-blue-800'
            }`}>
              {status === 'recording' ? '🎥 Recording Active' : '✅ Recording Complete'}
            </div>
          )}

          {/* Buttons */}
          <div className="space-y-3">
            <button
              onClick={handleStart}
              disabled={status === 'recording'}
              className="w-full bg-black text-white py-3 px-4 rounded-md hover:bg-gray-800 disabled:bg-gray-400 disabled:cursor-not-allowed font-semibold transition"
            >
              Start Recording
            </button>

            <button
              onClick={handleStop}
              disabled={status !== 'recording'}
              className="w-full bg-red-600 text-white py-3 px-4 rounded-md hover:bg-red-700 disabled:bg-gray-400 disabled:cursor-not-allowed font-semibold transition"
            >
              Stop Recording
            </button>
          </div>

          {/* Recording Details */}
          {recordingDetails && (
            <div className="mt-6 p-4 bg-green-50 border border-green-200 rounded-md">
              <h3 className="font-semibold text-green-800 mb-2">📁 Recording Saved!</h3>
              <div className="text-sm text-gray-700 space-y-1">
                <p><span className="font-medium">File:</span> {recordingDetails.filename}</p>
                <p><span className="font-medium">Size:</span> {recordingDetails.size}</p>
                <p><span className="font-medium">Duration:</span> {recordingDetails.duration}</p>
                <p className="text-xs text-gray-500 mt-2">Location: spawner/recordings/</p>
              </div>
            </div>
          )}
        </div>

        {/* Right Side - Logs */}
        <div className="flex-1 bg-white rounded-lg shadow-lg overflow-hidden flex flex-col" style={{ height: '600px' }}>
          <div className="bg-gray-800 text-white px-6 py-3 font-semibold">
            📋 Activity Logs
          </div>
          <div className="flex-1 overflow-y-auto p-6 bg-gray-900 font-mono text-sm">
            {logs.length === 0 ? (
              <div className="text-gray-500 text-center mt-10">
                No activity yet. Start recording to see logs...
              </div>
            ) : (
              <div className="space-y-2">
                {logs.map((log, index) => (
                  <div key={index} className="text-green-400">
                    {log}
                  </div>
                ))}
                <div ref={logsEndRef} />
              </div>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}
