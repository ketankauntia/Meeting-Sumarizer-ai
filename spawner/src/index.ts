import { Builder, Browser, By, Key, until, WebDriver } from 'selenium-webdriver';
import { Options } from 'selenium-webdriver/chrome';

import './server'; // Just run the server

async function openMeet(driver: WebDriver, meetUrl: string) {
  try {
    await driver.get(meetUrl);

    console.log('google link entered');
    console.log('driver sleep entered');
    // waiting for the elements of the page to load
    await driver.sleep(10000);

    console.log('driver sleep done');

    const popupButton = await driver.wait(
      until.elementLocated(By.xpath("//span[contains(text(),'Got it')]"))
    );
    popupButton.click();

    // const nameInput = await driver.wait(until.elementLocated(By.id("c11")), 10000);
    const nameInput = await driver.wait(
      until.elementLocated(By.xpath('//input[@placeholder="Your name"]')),
      10000
    );
    await nameInput.clear();
    await nameInput.click();
    await nameInput.sendKeys('value', 'Meeting Rec Bot');
    await driver.sleep(2000);
    // await driver.wait(until.elementLocated(By.id('c12314')), 10000);

    const buttonElement = await driver.wait(
      until.elementLocated(By.xpath("//span[contains(text(),'Ask to join')]"))
    );

    await buttonElement.click();

    console.log('############ Request to join meeting sent!! ###########');
    // await driver.wait(until.elementLocated(By.id('c12314')), 900000);
  } finally {
    // await driver.quit();
  }
}

async function getDriver() {
  console.log('📝 Setting up Chrome options...');
  
  const chrome = require('selenium-webdriver/chrome');
  const service = new chrome.ServiceBuilder(require('chromedriver').path);
  
  const chromeOptions = new Options();
  chromeOptions.addArguments('--disable-blink-features=AutomationControlled');
  chromeOptions.addArguments('--use-fake-ui-for-media-stream');
  chromeOptions.addArguments('--window-size=1080,720');
  chromeOptions.addArguments('--enable-usermedia-screen-capturing');
  chromeOptions.addArguments('--no-sandbox');
  chromeOptions.addArguments('--disable-dev-shm-usage');
  chromeOptions.addArguments('--disable-gpu');
  
  console.log('🚀 Building WebDriver with explicit ChromeDriver path...');
  let driver = await new Builder()
    .forBrowser(Browser.CHROME)
    .setChromeOptions(chromeOptions)
    .setChromeService(service)
    .build();

  console.log('✅ WebDriver built successfully!');
  return driver;
}

async function startScreenshare(driver: WebDriver) {
  console.log('startScreenshare called');
  
  // Create a button and click it to generate user gesture
  await driver.executeScript(`
    const btn = document.createElement('button');
    btn.id = 'start-capture-btn';
    btn.textContent = 'Start Screen Share';
    btn.style.position = 'fixed';
    btn.style.top = '10px';
    btn.style.left = '10px';
    btn.style.zIndex = '999999';
    btn.style.padding = '20px';
    btn.style.fontSize = '16px';
    btn.style.backgroundColor = '#4CAF50';
    btn.style.color = 'white';
    btn.style.border = 'none';
    btn.style.borderRadius = '5px';
    btn.style.cursor = 'pointer';
    document.body.appendChild(btn);
  `);
  
  // Wait for button to be clickable
  await driver.sleep(1000);
  
  // Click the button to generate user gesture
  const button = await driver.findElement(By.id('start-capture-btn'));
  await button.click();
  
  // Now attach the click handler and trigger recording
  const response = await driver.executeScript(`
    (async function(){
      const btn = document.getElementById('start-capture-btn');
      try {
        console.log('[bot] requesting display media...');
        const screenStream = await navigator.mediaDevices.getDisplayMedia({
          video: true,
          audio: true
        });

        console.log('[bot] got display stream, creating audio graph...');

        // Create audio context and destination
        const audioContext = new AudioContext();
        const dest = audioContext.createMediaStreamDestination();

        // If the display stream has audio tracks, connect them
        try {
          if (screenStream.getAudioTracks().length > 0) {
            const screenAudioSource = audioContext.createMediaStreamSource(screenStream);
            screenAudioSource.connect(dest);
          }
        } catch (e) {
          console.warn('[bot] no audio on display stream', e);
        }

        // Try to grab audio elements on page (Meet uses them)
        const audEls = Array.from(document.querySelectorAll('audio'));
        for (let i = 0; i < audEls.length; ++i) {
          const el = audEls[i];
          try {
            if (el && el.srcObject) {
              const src = audioContext.createMediaStreamSource(el.srcObject);
              src.connect(dest);
              console.log('[bot] connected audio element', i);
            }
          } catch (e) {
            console.warn('[bot] could not connect audio', i);
          }
        }

        // Build combined stream
        const combinedStream = new MediaStream([
          ...screenStream.getVideoTracks(),
          ...dest.stream.getAudioTracks()
        ]);

        // Create video element for preview
        const videoElement = document.createElement('video');
        videoElement.srcObject = combinedStream;
        videoElement.autoplay = true;
        videoElement.controls = true;
        videoElement.style.position = 'fixed';
        videoElement.style.right = '10px';
        videoElement.style.bottom = '10px';
        videoElement.style.width = '320px';
        videoElement.style.zIndex = '999999';
        document.body.appendChild(videoElement);

        // WebSocket connection - wait for open
        const socket = new WebSocket('ws://localhost:8080');
        socket.binaryType = 'arraybuffer';

        await new Promise((resolve, reject) => {
          const timer = setTimeout(() => reject(new Error('WebSocket timeout')), 10000);
          socket.onopen = () => {
            clearTimeout(timer);
            console.log('[bot] websocket open');
            resolve();
          };
          socket.onerror = (err) => {
            clearTimeout(timer);
            reject(err);
          };
        });

        // Create MediaRecorder
        const mediaRecorder = new MediaRecorder(combinedStream, { mimeType: 'video/webm; codecs=vp8,opus' });
        mediaRecorder.ondataavailable = async (event) => {
          if (!event.data || event.data.size === 0) return;
          try {
            const ab = await event.data.arrayBuffer();
            socket.send(ab);
          } catch (err) {
            console.error('[bot] error sending chunk', err);
          }
        };

        mediaRecorder.onstop = () => console.log('[bot] recorder stopped');
        mediaRecorder.onerror = (ev) => console.error('[bot] recorder error', ev);

        // Start recording with 5s chunks
        mediaRecorder.start(5000);
        console.log('[bot] recording started');

        // Store for later stop
        window.mediaRecorderInstance = mediaRecorder;
        window.socketInstance = socket;

        // Auto-stop after 60s (optional)
        setTimeout(() => {
          try {
            if (mediaRecorder.state === 'recording') mediaRecorder.stop();
            socket.close();
          } catch (e) {
            console.warn('[bot] stop error', e);
          }
        }, 60000);

        // Hide the button
        if (btn) btn.style.display = 'none';
        
        return 'started';
      } catch (err) {
        console.error('[bot] screen capture failed', err);
        return 'error:' + (err && err.message ? err.message : String(err));
      }
    })();
  `);
  console.log('startScreenshare executeScript returned:', response);

  // Don't block forever - just wait a bit
  await driver.sleep(2000);
}

async function main(meetUrl: string) {
  console.log('🤖 Main function called with URL:', meetUrl);
  
  try {
    console.log('Creating Chrome driver...');
    const driver = await getDriver();
    console.log('✅ Chrome driver created successfully');

    //joining meet
    console.log('Opening Meet URL...');
    await openMeet(driver, meetUrl);

    await new Promise((x) => setTimeout(x, 60000));
    //wait until the admin approves the bot to join

    //starting screensharing
    await startScreenshare(driver);
  } catch (error) {
    console.error('❌ Error in main function:', error);
  }
}

// Register the bot function with the server
import { botController } from './server';
botController.startBot = main;
console.log('✅ Bot ready to receive commands from frontend');

// screen recording code checked in console
// window.navigator.mediaDevices.getDisplayMedia().then(stream=>{
//   const videoEl = document.createElement('video');
// videoEl.srcObject = stream;
//   videoEl.play();
// document.getElementsByClassName('qdOxv-fmcmS-yrriRe')[0].appendChild(videoEl);

// });
