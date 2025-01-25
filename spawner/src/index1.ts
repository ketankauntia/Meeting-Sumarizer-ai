// // screen recording upload to s3

// import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';

// async function uploadScreenRecordingToS3(combinedStream, options = {}) {
//   const {
//     bucketName,
//     objectKey = `screen-recording-${Date.now()}.webm`,
//     region = 'us-east-1',
//   } = options;

//   // Combine stream chunks into a single Blob
//   const recordedChunks = await startRecording(combinedStream, 30000); // 30 seconds recording
//   const recordedBlob = new Blob(recordedChunks, { type: 'video/webm' });

//   // Configure AWS S3 client
//   const s3Client = new S3Client({
//     region: region,
//     credentials: {
//       accessKeyId: process.env.AWS_ACCESS_KEY_ID,
//       secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
//     },
//   });

//   // Prepare upload command
//   const uploadParams = {
//     Bucket: bucketName,
//     Key: objectKey,
//     Body: await recordedBlob.arrayBuffer(),
//     ContentType: 'video/webm',
//   };

//   try {
//     const command = new PutObjectCommand(uploadParams);
//     const response = await s3Client.send(command);
//     console.log('Upload successful', response);
//     return response;
//   } catch (error) {
//     console.error('S3 Upload Error:', error);
//     throw error;
//   }
// }

// // Usage example
// async function captureAndUpload() {
//   try {
//     const screenStream = await navigator.mediaDevices.getDisplayMedia({
//       video: { displaySurface: 'browser' },
//       audio: true,
//       preferCurrentTab: true,
//     });

//     const audioContext = new AudioContext();
//     const screenAudioStream = audioContext.createMediaStreamSource(screenStream);

//     const dest = audioContext.createMediaStreamDestination();
//     screenAudioStream.connect(dest);

//     const combinedStream = new MediaStream([
//       ...screenStream.getVideoTracks(),
//       ...dest.stream.getAudioTracks(),
//     ]);

//     await uploadScreenRecordingToS3(combinedStream, {
//       bucketName: 'your-bucket-name',
//     });
//   } catch (error) {
//     console.error('Screen capture or upload failed:', error);
//   }
// }
