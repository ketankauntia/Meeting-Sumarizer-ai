import { useState } from 'react';
import './App.css';
import ScreenStream from './ScreenStream';

function App() {
  return (
    <div>
      <ScreenStream />
      {/* <div className='video-cont'>
        Video Container
        <video></video>
      </div>
      <button>Start Recording</button>
      <button>Download Recording</button> */}
    </div>
  );
}

export default App;
