import React, { useEffect, useRef } from 'react';

const ScreenStream = () => {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const socketRef = useRef<WebSocket | null>(null);

  useEffect(() => {
    // Create the WebSocket connection to the backend
    socketRef.current = new WebSocket('ws://localhost:8080');

    socketRef.current.onopen = () => {
      console.log('WebSocket connection established');
    };

    socketRef.current.onmessage = (event) => {
      // Convert incoming chunk of data (video data) to a Blob
      const videoBlob = new Blob([event.data], { type: 'video/webm' });
      const videoObjectURL = URL.createObjectURL(videoBlob);

      // Update the video element with the new stream chunk
      if (videoRef.current) {
        videoRef.current.src = videoObjectURL;
        videoRef.current.play(); // Start playing the video
      }
    };

    socketRef.current.onerror = (error) => {
      console.error('WebSocket Error:', error);
    };

    socketRef.current.onclose = () => {
      console.log('WebSocket connection closed');
    };

    // Clean up the WebSocket connection when the component unmounts
    return () => {
      if (socketRef.current) {
        socketRef.current.close(); // Close WebSocket connection on cleanup
      }
    };
  }, []);

  return (
    <div>
      <h1>Live Stream</h1>
      <video ref={videoRef} style={{ width: '100%' }} controls />
    </div>
  );
};

export default ScreenStream;
