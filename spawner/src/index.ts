import { Builder, Browser, By, Key, until, WebDriver } from 'selenium-webdriver';
import { Options } from 'selenium-webdriver/chrome';

import './server'; // Just run the server
import { broadcastLog, allCaptions, broadcastCaption } from './server';

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
  
  // Let Selenium Manager automatically download the correct ChromeDriver
  const chromeOptions = new Options();
  chromeOptions.addArguments('--disable-blink-features=AutomationControlled');
  chromeOptions.addArguments('--use-fake-ui-for-media-stream');
  chromeOptions.addArguments('--window-size=1080,720');
  chromeOptions.addArguments('--enable-usermedia-screen-capturing');
  chromeOptions.addArguments('--no-sandbox');
  chromeOptions.addArguments('--disable-dev-shm-usage');
  chromeOptions.addArguments('--disable-gpu');
  
  let driver = await new Builder()
    .forBrowser(Browser.CHROME)
    .setChromeOptions(chromeOptions)
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

async function enableCaptions(driver: WebDriver) {
  try {
    broadcastLog('📝 Enabling captions...');
    
    // First wait for the meeting controls to be visible (class "axUSnc" is the controls bar)
    try {
      await driver.wait(until.elementLocated(By.className("axUSnc")), 15000);
      broadcastLog('✅ Meeting controls visible');
    } catch (e) {
      broadcastLog('⚠️ Meeting controls not found, trying anyway...');
    }
    
    // Dismiss ALL popups - try multiple times and multiple selectors
    broadcastLog('🔍 Looking for popups to dismiss...');
    for (let i = 0; i < 3; i++) {
      await driver.sleep(1000);
      
      // Try clicking "Got it" button in various ways
      try {
        // Method 1: Find button containing "Got it" text
        const buttons = await driver.findElements(By.xpath("//button[.//span[contains(text(),'Got it')]]"));
        for (const btn of buttons) {
          try {
            await driver.executeScript("arguments[0].click();", btn);
            broadcastLog('✅ Clicked "Got it" button');
            await driver.sleep(500);
          } catch (e) {}
        }
      } catch (e) {}
      
      try {
        // Method 2: Find span with "Got it" and click it
        const spans = await driver.findElements(By.xpath("//span[contains(text(),'Got it')]"));
        for (const span of spans) {
          try {
            await driver.executeScript("arguments[0].click();", span);
            broadcastLog('✅ Clicked "Got it" span');
            await driver.sleep(500);
          } catch (e) {}
        }
      } catch (e) {}
      
      try {
        // Method 3: Look for any dismiss/close buttons
        const closeButtons = await driver.findElements(By.css('[aria-label*="Close"], [aria-label*="Dismiss"]'));
        for (const btn of closeButtons) {
          try {
            await driver.executeScript("arguments[0].click();", btn);
            await driver.sleep(300);
          } catch (e) {}
        }
      } catch (e) {}
    }
    
    await driver.sleep(1000);
    
    // Find the caption button - try multiple selectors
    let captionButton = null;
    const selectors = [
      'button[aria-label="Turn on captions"]',
      'button[aria-label="Turn on captions (c)"]',
      'button[data-tooltip-id*="caption"]',
      '[aria-label*="caption" i]'
    ];
    
    for (const selector of selectors) {
      try {
        captionButton = await driver.findElement(By.css(selector));
        if (captionButton) {
          broadcastLog(`📝 Found caption button with: ${selector}`);
          break;
        }
      } catch (e) {
        // Try next selector
      }
    }
    
    if (!captionButton) {
      broadcastLog('❌ Caption button not found with any selector');
      return;
    }
    
    // Use JavaScript click to avoid overlay issues
    await driver.executeScript("arguments[0].click();", captionButton);
    broadcastLog('✅ Captions turned ON');
    
    // Wait for caption container to appear
    await driver.sleep(3000);
    
    // Inject ONLY a lightweight buffer in the browser - NO FETCH (blocked by CSP)
    // Node will pull captions via executeScript
    const captionBufferScript = `
    (function() {
      if (window.__captionBuffer) return 'already initialized';
      
      console.log('[Caption] Initializing browser-side caption buffer...');
      
      window.__captionBuffer = {
        lastText: '',
        items: []
      };
      
      // Poll every 500ms and store in buffer
      setInterval(() => {
        const region = document.querySelector('div[role="region"][aria-label="Captions"]');
        if (!region) return;
        
        const text = region.innerText?.trim() || '';
        if (!text || text === window.__captionBuffer.lastText) return;
        
        // Extract delta (new text)
        let delta = text;
        if (text.startsWith(window.__captionBuffer.lastText)) {
          delta = text.slice(window.__captionBuffer.lastText.length).trim();
        }
        
        // Filter garbage
        if (delta && 
            delta.length > 2 && 
            !delta.toLowerCase().includes('jump to') &&
            !delta.toLowerCase().includes('arrow_downward')) {
          window.__captionBuffer.items.push({
            text: delta,
            timestamp: Date.now()
          });
          console.log('[Caption] 📝 Buffered:', delta.substring(0, 50) + '...');
        }
        
        window.__captionBuffer.lastText = text;
      }, 500);
      
      return 'initialized';
    })();
    `;
    
    const initResult = await driver.executeScript(captionBufferScript);
    broadcastLog('✅ Caption buffer script injected: ' + initResult);
    
    // Log current caption region status
    const regionCheck = await driver.executeScript(`
      const region = document.querySelector('div[role="region"][aria-label="Captions"]');
      return region ? 'Caption region found' : 'Caption region NOT found';
    `);
    broadcastLog('📝 ' + regionCheck);
    
    // Start Node-side caption pulling interval
    startCaptionPulling(driver);
    
  } catch (error) {
    broadcastLog('⚠️ Could not enable captions: ' + error);
  }
}

// Node-side interval to pull captions from browser buffer
let captionPullInterval: NodeJS.Timeout | null = null;

function startCaptionPulling(driver: WebDriver) {
  broadcastLog('🔄 Starting Node-side caption pulling (every 2s)...');
  
  captionPullInterval = setInterval(async () => {
    try {
      // Pull captions from browser buffer
      const newCaptions = await driver.executeScript(`
        const buf = window.__captionBuffer;
        if (!buf || buf.items.length === 0) return [];
        
        // Get items and clear buffer
        const items = buf.items.slice();
        buf.items.length = 0;
        return items;
      `);
      
      if (Array.isArray(newCaptions) && newCaptions.length > 0) {
        broadcastLog('📥 Pulled ' + newCaptions.length + ' captions from browser');
        
        for (const c of newCaptions) {
          const caption = {
            speaker: 'Participant',
            text: c.text,
            timestamp: new Date(c.timestamp).toISOString()
          };
          
          // Push to allCaptions storage
          allCaptions.push(caption);
          
          // Stream to UI via SSE
          broadcastCaption(caption);
          
          // Broadcast to Activity Logs
          broadcastLog('🗣️ [' + caption.speaker + ']: "' + caption.text + '"');
        }
      }
    } catch (e) {
      // Driver might be closed, stop pulling
      if (captionPullInterval) {
        clearInterval(captionPullInterval);
        captionPullInterval = null;
      }
    }
  }, 2000);
}

// Export for cleanup
export function stopCaptionPulling() {
  if (captionPullInterval) {
    clearInterval(captionPullInterval);
    captionPullInterval = null;
    broadcastLog('⏹️ Stopped caption pulling');
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
    
    // Stop caption pulling first
    if (captionPullInterval) {
      clearInterval(captionPullInterval);
      captionPullInterval = null;
      broadcastLog('⏹️ Stopped caption pulling');
    }
    
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

    //enable captions
    await enableCaptions(driver);

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
