'use client';

import { useState } from 'react';

export default function Home() {
  const [meetUrl, setMeetUrl] = useState('');
  const [status, setStatus] = useState('idle'); // idle, recording, stopped

  const handleStart = () => {
    if (!meetUrl.trim()) {
      alert('Please enter a Google Meet URL');
      return;
    }
    setStatus('recording');
    console.log('Starting recording for:', meetUrl);
    // TODO: Connect to backend
  };

  const handleStop = () => {
    setStatus('stopped');
    console.log('Stopping recording');
    // TODO: Connect to backend
  };

  return (
    <main className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="bg-white p-8 rounded-lg shadow-lg w-full max-w-md">
        <h1 className="text-2xl text-black font-bold text-center mb-6">
          Meeting Recorder
        </h1>

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

        {/* Status */}
        {status !== 'idle' && (
          <div className={`mb-4 p-3 rounded-md text-center font-semibold ${
            status === 'recording' ? 'bg-green-100 text-black' : 'bg-red-100 text-black'
          }`}>
            {status === 'recording' ? 'Started Recording...' : 'Recording Stopped...'}
          </div>
        )}

        {/* Buttons */}
        <div className="space-y-3">
          <button
            onClick={handleStart}
            disabled={status === 'recording'}
            className="w-full bg-black text-white py-2 px-4 rounded-md hover:bg-black disabled:bg-gray-400 disabled:cursor-not-allowed font-semibold"
          >
            Start Recording
          </button>

          <button
            onClick={handleStop}
            disabled={status !== 'recording'}
            className="w-full bg-black text-white py-2 px-4 rounded-md hover:bg-black disabled:bg-gray-400 disabled:cursor-not-allowed font-semibold"
          >
            Stop Recording
          </button>
        </div>
      </div>
    </main>
  );
}
