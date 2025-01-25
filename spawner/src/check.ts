// // function wait(delayInMS) {
// //   return new Promise((resolve) => setTimeout(resolve, delayInMS));
// // }

// // function startRecording(stream, lengthInMS) {
// //   let recorder = new MediaRecorder(stream);
// //   let data = [];

// //   recorder.ondataavailable = (event) => data.push(event.data);
// //   recorder.start();

// //   let stopped = new Promise((resolve, reject) => {
// //     recorder.onstop = resolve;
// //     recorder.onerror = (event) => reject(event.name);
// //   });

// //   let recorded = wait(lengthInMS).then(() => {
// //     if (recorder.state === 'recording') {
// //       recorder.stop();
// //     }
// //   });

// //   return Promise.all([stopped, recorded]).then(() => data);
// // }

// console.log('before mediadevices');
// window.navigator.mediaDevices
//   .getDisplayMedia({
//     video: {
//       displaySurface: 'browser',
//     },
//     audio: true,
//     preferCurrentTab: true,
//   })
//   .then(async (screenStream) => {
//     console.log('before start recording');

//     // Added audio processing to mix multiple audio tracks into one
//     const audioContext = new AudioContext();
//     const screenAudioStream = audioContext.createMediaStreamSource(screenStream);

//     // Extract audio elements if they exist
//     const audioEl1 = document.querySelectorAll('audio')[0];
//     const audioEl2 = document.querySelectorAll('audio')[1];
//     const audioEl3 = document.querySelectorAll('audio')[2];

//     // Connect audio elements to MediaStreamDestination
//     const dest = audioContext.createMediaStreamDestination();
//     if (audioEl1 && audioEl1.srcObject) {
//       const audioElStream1 = audioContext.createMediaStreamSource(audioEl1.srcObject);
//       audioElStream1.connect(dest);
//     }
//     if (audioEl2 && audioEl2.srcObject) {
//       const audioElStream2 = audioContext.createMediaStreamSource(audioEl2.srcObject);
//       audioElStream2.connect(dest);
//     }
//     if (audioEl3 && audioEl3.srcObject) {
//       const audioElStream3 = audioContext.createMediaStreamSource(audioEl3.srcObject);
//       audioElStream3.connect(dest);
//     }
//     screenAudioStream.connect(dest);

//     // Combine screen and audio streams
//     const combinedStream = new MediaStream([
//       ...screenStream.getVideoTracks(),
//       ...dest.stream.getAudioTracks(),
//     ]);

//     // Stream should be streamed via WebRTC to a server

//     // Create a video element to display the stream
//     // const videoElement = document.createElement('video');
//     // videoElement.srcObject = combinedStream;
//     // videoElement.autoplay = true;
//     // videoElement.controls = true;
//     // document.body.appendChild(videoElement); // Add the video to the DOM

//     // Optionally, start streaming the media to the backend (WebRTC or WebSocket)
//     // For example, if you want to send it via WebSocket:
//     const socket = new WebSocket('ws://your-backend-server');

//     const mediaRecorder = new MediaRecorder(combinedStream);
//     mediaRecorder.ondataavailable = (event) => {
//       // Send the chunk of data to the backend
//       socket.send(event.data);
//     };

//     // Start recording in chunks (e.g., 5 seconds)
//     mediaRecorder.start(5000);

//     // Stop recording after a certain duration or user interaction
//     setTimeout(() => {
//       mediaRecorder.stop();
//       socket.close();
//     }, 60000); // Stop after 60 seconds for demonstration
//   })
//   .catch((error) => {
//     console.error('Error during screen capture:', error); // Error handling
//   });
