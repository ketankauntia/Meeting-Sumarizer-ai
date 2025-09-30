import { Builder, Browser, By, Key, until, WebDriver } from 'selenium-webdriver';
import { Options } from 'selenium-webdriver/chrome';

import './server'; // Just run the server
import { broadcastLog } from './server';

// Store active driver globally
let activeDriver: WebDriver | null = null;

async function openMeet(driver: WebDriver, meetUrl: string) {
  try {
    await driver.get(meetUrl);

    broadcastLog('🌐 Google Meet is loaded...');
    // broadcastLog('⏳ Waiting for page elements to load (10s)...');
    // waiting for the elements of the page to load
    await driver.sleep(10000);

    broadcastLog('✅ Google Meet is loaded successfully ...');

    const popupButton = await driver.wait(
      until.elementLocated(By.xpath("//span[contains(text(),'Got it')]"))
    );
    popupButton.click();
    // broadcastLog('👆 Clicked "Got it" button');

    // const nameInput = await driver.wait(until.elementLocated(By.id("c11")), 10000);
    const nameInput = await driver.wait(
      until.elementLocated(By.xpath('//input[@placeholder="Your name"]')),
      10000
    );
    await nameInput.clear();
    await nameInput.click();
    await nameInput.sendKeys('value', 'Meeting Rec Bot');
    broadcastLog('👤 Entering bot name ...');
    await driver.sleep(2000);
    // await driver.wait(until.elementLocated(By.id('c12314')), 10000);

    const buttonElement = await driver.wait(
      until.elementLocated(By.xpath("//span[contains(text(),'Ask to join')]"))
    );

    await buttonElement.click();

    broadcastLog('📞 Request to join meeting sent!');
    // await driver.wait(until.elementLocated(By.id('c12314')), 900000);
  } finally {
    // await driver.quit();
  }
}

async function getDriver() {
  broadcastLog('📝 Starting Chrome...');
  
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
  
  // broadcastLog('🚗 Building Chrome WebDriver...');
  let driver = await new Builder()
    .forBrowser(Browser.CHROME)
    .setChromeOptions(chromeOptions)
    .setChromeService(service)
    .build();

  broadcastLog('✅ Chrome ready!');
  return driver;
}

async function leaveMeeting(driver: WebDriver) {
  try {
    broadcastLog('👋 Attempting to leave meeting...');
    
    // Click the "Leave call" button using the aria-label
    const leaveButton = await driver.wait(
      until.elementLocated(By.xpath("//button[@aria-label='Leave call']")),
      5000
    );
    await leaveButton.click();
    
    broadcastLog('✅ Left the meeting successfully');
    
    // Wait a bit for cleanup
    await driver.sleep(2000);
  } catch (error) {
    broadcastLog('⚠️ Error leaving meeting: ' + error);
    // If button not found, try alternative selector
    try {
      const altButton = await driver.findElement(By.css("button[aria-label='Leave call']"));
      await altButton.click();
      broadcastLog('✅ Left meeting using alternative selector');
    } catch (e) {
      broadcastLog('❌ Could not find leave button');
    }
  }
}

async function startScreenshare(driver: WebDriver) {
  broadcastLog('🎬 Initializing screen recording...');
  
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
          video: { 
            displaySurface: "browser"  // Force browser tab selection
          },
          audio: true,
          preferCurrentTab: true  // Auto-select current tab if possible
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

        // No video preview element - just record silently
        console.log('[bot] Recording started (no preview)');

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
  
  if (response === 'started') {
    broadcastLog('🎥 Screen recording started successfully!');
  } else {
    broadcastLog('⚠️ Screen recording response: ' + response);
  }

  // Don't block forever - just wait a bit
  await driver.sleep(2000);
}

async function stopRecordingAndLeave() {
  if (!activeDriver) {
    broadcastLog('⚠️ No active driver to stop');
    return { success: false, message: 'No active recording' };
  }

  try {
    broadcastLog('🛑 Stopping recording and leaving meeting...');
    
    // Stop the recording by executing script in browser
    await activeDriver.executeScript(`
      try {
        if (window.mediaRecorderInstance && window.mediaRecorderInstance.state === 'recording') {
          window.mediaRecorderInstance.stop();
          console.log('[bot] Recording stopped by user');
        }
        if (window.socketInstance) {
          window.socketInstance.close();
          console.log('[bot] WebSocket closed');
        }
      } catch (e) {
        console.error('[bot] Error stopping recording:', e);
      }
    `);

    // Wait for socket to close and save
    await activeDriver.sleep(2000);

    // Leave the meeting
    await leaveMeeting(activeDriver);

    // Clean up
    await activeDriver.quit();
    activeDriver = null;
    broadcastLog('🔒 Chrome browser closed');

    return { success: true, message: 'Recording stopped and left meeting' };
  } catch (error) {
    broadcastLog('❌ Error stopping recording: ' + error);
    if (activeDriver) {
      try {
        await activeDriver.quit();
      } catch (e) {
        // Ignore quit errors
      }
      activeDriver = null;
    }
    return { success: false, message: 'Error stopping recording' };
  }
}

async function main(meetUrl: string) {
  // broadcastLog('🤖 Bot main function started');
  
  try {
    const driver = await getDriver();
    activeDriver = driver; // Store globally

    //joining meet
    broadcastLog('🌐 Opening Google Meet...');
    await openMeet(driver, meetUrl);

    broadcastLog('⏰ Waiting 20 seconds for host approval...');
    await new Promise((x) => setTimeout(x, 20000));
    //wait until the admin approves the bot to join

    //starting screensharing
    await startScreenshare(driver);
  } catch (error) {
    broadcastLog('❌ Error in main function: ' + error);
    activeDriver = null;
  }
}

// Register the bot functions with the server
import { botController } from './server';
botController.startBot = main;
botController.stopBot = stopRecordingAndLeave;
console.log('✅ Bot ready to receive commands from frontend');

// screen recording code checked in console
// window.navigator.mediaDevices.getDisplayMedia().then(stream=>{
//   const videoEl = document.createElement('video');
// videoEl.srcObject = stream;
//   videoEl.play();
// document.getElementsByClassName('qdOxv-fmcmS-yrriRe')[0].appendChild(videoEl);

// });
