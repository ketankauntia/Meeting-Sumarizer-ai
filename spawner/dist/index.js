"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.stopCaptionPulling = stopCaptionPulling;
const selenium_webdriver_1 = require("selenium-webdriver");
const chrome_1 = require("selenium-webdriver/chrome");
require("./server"); // Just run the server
const server_1 = require("./server");
// Store active driver globally
let activeDriver = null;
function openMeet(driver, meetUrl) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            yield driver.get(meetUrl);
            (0, server_1.broadcastLog)('🌐 Google Meet is loaded...');
            // broadcastLog('⏳ Waiting for page elements to load (10s)...');
            // waiting for the elements of the page to load
            yield driver.sleep(10000);
            (0, server_1.broadcastLog)('✅ Google Meet is loaded successfully ...');
            const popupButton = yield driver.wait(selenium_webdriver_1.until.elementLocated(selenium_webdriver_1.By.xpath("//span[contains(text(),'Got it')]")));
            popupButton.click();
            // broadcastLog('👆 Clicked "Got it" button');
            // const nameInput = await driver.wait(until.elementLocated(By.id("c11")), 10000);
            const nameInput = yield driver.wait(selenium_webdriver_1.until.elementLocated(selenium_webdriver_1.By.xpath('//input[@placeholder="Your name"]')), 10000);
            yield nameInput.clear();
            yield nameInput.click();
            yield nameInput.sendKeys('value', 'Meeting Rec Bot');
            (0, server_1.broadcastLog)('👤 Entering bot name ...');
            yield driver.sleep(2000);
            // await driver.wait(until.elementLocated(By.id('c12314')), 10000);
            const buttonElement = yield driver.wait(selenium_webdriver_1.until.elementLocated(selenium_webdriver_1.By.xpath("//span[contains(text(),'Ask to join')]")));
            yield buttonElement.click();
            (0, server_1.broadcastLog)('📞 Request to join meeting sent!');
            // await driver.wait(until.elementLocated(By.id('c12314')), 900000);
        }
        finally {
            // await driver.quit();
        }
    });
}
function getDriver() {
    return __awaiter(this, void 0, void 0, function* () {
        (0, server_1.broadcastLog)('📝 Starting Chrome...');
        // Let Selenium Manager automatically download the correct ChromeDriver
        const chromeOptions = new chrome_1.Options();
        chromeOptions.addArguments('--disable-blink-features=AutomationControlled');
        chromeOptions.addArguments('--use-fake-ui-for-media-stream');
        chromeOptions.addArguments('--window-size=1080,720');
        chromeOptions.addArguments('--enable-usermedia-screen-capturing');
        chromeOptions.addArguments('--no-sandbox');
        chromeOptions.addArguments('--disable-dev-shm-usage');
        chromeOptions.addArguments('--disable-gpu');
        let driver = yield new selenium_webdriver_1.Builder()
            .forBrowser(selenium_webdriver_1.Browser.CHROME)
            .setChromeOptions(chromeOptions)
            .build();
        (0, server_1.broadcastLog)('✅ Chrome ready!');
        return driver;
    });
}
function leaveMeeting(driver) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            (0, server_1.broadcastLog)('👋 Attempting to leave meeting...');
            // Click the "Leave call" button using the aria-label
            const leaveButton = yield driver.wait(selenium_webdriver_1.until.elementLocated(selenium_webdriver_1.By.xpath("//button[@aria-label='Leave call']")), 5000);
            yield leaveButton.click();
            (0, server_1.broadcastLog)('✅ Left the meeting successfully');
            // Wait a bit for cleanup
            yield driver.sleep(2000);
        }
        catch (error) {
            (0, server_1.broadcastLog)('⚠️ Error leaving meeting: ' + error);
            // If button not found, try alternative selector
            try {
                const altButton = yield driver.findElement(selenium_webdriver_1.By.css("button[aria-label='Leave call']"));
                yield altButton.click();
                (0, server_1.broadcastLog)('✅ Left meeting using alternative selector');
            }
            catch (e) {
                (0, server_1.broadcastLog)('❌ Could not find leave button');
            }
        }
    });
}
function enableCaptions(driver) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            (0, server_1.broadcastLog)('📝 Enabling captions...');
            // First wait for the meeting controls to be visible (class "axUSnc" is the controls bar)
            try {
                yield driver.wait(selenium_webdriver_1.until.elementLocated(selenium_webdriver_1.By.className("axUSnc")), 15000);
                (0, server_1.broadcastLog)('✅ Meeting controls visible');
            }
            catch (e) {
                (0, server_1.broadcastLog)('⚠️ Meeting controls not found, trying anyway...');
            }
            // Dismiss ALL popups - try multiple times and multiple selectors
            (0, server_1.broadcastLog)('🔍 Looking for popups to dismiss...');
            for (let i = 0; i < 3; i++) {
                yield driver.sleep(1000);
                // Try clicking "Got it" button in various ways
                try {
                    // Method 1: Find button containing "Got it" text
                    const buttons = yield driver.findElements(selenium_webdriver_1.By.xpath("//button[.//span[contains(text(),'Got it')]]"));
                    for (const btn of buttons) {
                        try {
                            yield driver.executeScript("arguments[0].click();", btn);
                            (0, server_1.broadcastLog)('✅ Clicked "Got it" button');
                            yield driver.sleep(500);
                        }
                        catch (e) { }
                    }
                }
                catch (e) { }
                try {
                    // Method 2: Find span with "Got it" and click it
                    const spans = yield driver.findElements(selenium_webdriver_1.By.xpath("//span[contains(text(),'Got it')]"));
                    for (const span of spans) {
                        try {
                            yield driver.executeScript("arguments[0].click();", span);
                            (0, server_1.broadcastLog)('✅ Clicked "Got it" span');
                            yield driver.sleep(500);
                        }
                        catch (e) { }
                    }
                }
                catch (e) { }
                try {
                    // Method 3: Look for any dismiss/close buttons
                    const closeButtons = yield driver.findElements(selenium_webdriver_1.By.css('[aria-label*="Close"], [aria-label*="Dismiss"]'));
                    for (const btn of closeButtons) {
                        try {
                            yield driver.executeScript("arguments[0].click();", btn);
                            yield driver.sleep(300);
                        }
                        catch (e) { }
                    }
                }
                catch (e) { }
            }
            yield driver.sleep(1000);
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
                    captionButton = yield driver.findElement(selenium_webdriver_1.By.css(selector));
                    if (captionButton) {
                        (0, server_1.broadcastLog)(`📝 Found caption button with: ${selector}`);
                        break;
                    }
                }
                catch (e) {
                    // Try next selector
                }
            }
            if (!captionButton) {
                (0, server_1.broadcastLog)('❌ Caption button not found with any selector');
                return;
            }
            // Use JavaScript click to avoid overlay issues
            yield driver.executeScript("arguments[0].click();", captionButton);
            (0, server_1.broadcastLog)('✅ Captions turned ON');
            // Wait for caption container to appear
            yield driver.sleep(3000);
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
            const initResult = yield driver.executeScript(captionBufferScript);
            (0, server_1.broadcastLog)('✅ Caption buffer script injected: ' + initResult);
            // Log current caption region status
            const regionCheck = yield driver.executeScript(`
      const region = document.querySelector('div[role="region"][aria-label="Captions"]');
      return region ? 'Caption region found' : 'Caption region NOT found';
    `);
            (0, server_1.broadcastLog)('📝 ' + regionCheck);
            // Start Node-side caption pulling interval
            startCaptionPulling(driver);
        }
        catch (error) {
            (0, server_1.broadcastLog)('⚠️ Could not enable captions: ' + error);
        }
    });
}
// Node-side interval to pull captions from browser buffer
let captionPullInterval = null;
function startCaptionPulling(driver) {
    (0, server_1.broadcastLog)('🔄 Starting Node-side caption pulling (every 2s)...');
    captionPullInterval = setInterval(() => __awaiter(this, void 0, void 0, function* () {
        try {
            // Pull captions from browser buffer
            const newCaptions = yield driver.executeScript(`
        const buf = window.__captionBuffer;
        if (!buf || buf.items.length === 0) return [];
        
        // Get items and clear buffer
        const items = buf.items.slice();
        buf.items.length = 0;
        return items;
      `);
            if (Array.isArray(newCaptions) && newCaptions.length > 0) {
                (0, server_1.broadcastLog)('📥 Pulled ' + newCaptions.length + ' captions from browser');
                for (const c of newCaptions) {
                    const caption = {
                        speaker: 'Participant',
                        text: c.text,
                        timestamp: new Date(c.timestamp).toISOString()
                    };
                    // Push to allCaptions storage
                    server_1.allCaptions.push(caption);
                    // Stream to UI via SSE
                    (0, server_1.broadcastCaption)(caption);
                    // Broadcast to Activity Logs
                    (0, server_1.broadcastLog)('🗣️ [' + caption.speaker + ']: "' + caption.text + '"');
                }
            }
        }
        catch (e) {
            // Driver might be closed, stop pulling
            if (captionPullInterval) {
                clearInterval(captionPullInterval);
                captionPullInterval = null;
            }
        }
    }), 2000);
}
// Export for cleanup
function stopCaptionPulling() {
    if (captionPullInterval) {
        clearInterval(captionPullInterval);
        captionPullInterval = null;
        (0, server_1.broadcastLog)('⏹️ Stopped caption pulling');
    }
}
function startScreenshare(driver) {
    return __awaiter(this, void 0, void 0, function* () {
        (0, server_1.broadcastLog)('🎬 Initializing screen recording...');
        // Create a button and click it to generate user gesture
        yield driver.executeScript(`
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
        yield driver.sleep(1000);
        // Click the button to generate user gesture
        const button = yield driver.findElement(selenium_webdriver_1.By.id('start-capture-btn'));
        yield button.click();
        // Now attach the click handler and trigger recording
        const response = yield driver.executeScript(`
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
            (0, server_1.broadcastLog)('🎥 Screen recording started successfully!');
        }
        else {
            (0, server_1.broadcastLog)('⚠️ Screen recording response: ' + response);
        }
        // Don't block forever - just wait a bit
        yield driver.sleep(2000);
    });
}
function stopRecordingAndLeave() {
    return __awaiter(this, void 0, void 0, function* () {
        if (!activeDriver) {
            (0, server_1.broadcastLog)('⚠️ No active driver to stop');
            return { success: false, message: 'No active recording' };
        }
        try {
            (0, server_1.broadcastLog)('🛑 Stopping recording and leaving meeting...');
            // Stop caption pulling first
            if (captionPullInterval) {
                clearInterval(captionPullInterval);
                captionPullInterval = null;
                (0, server_1.broadcastLog)('⏹️ Stopped caption pulling');
            }
            // Stop the recording by executing script in browser
            yield activeDriver.executeScript(`
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
            yield activeDriver.sleep(2000);
            // Leave the meeting
            yield leaveMeeting(activeDriver);
            // Clean up
            yield activeDriver.quit();
            activeDriver = null;
            (0, server_1.broadcastLog)('🔒 Chrome browser closed');
            return { success: true, message: 'Recording stopped and left meeting' };
        }
        catch (error) {
            (0, server_1.broadcastLog)('❌ Error stopping recording: ' + error);
            if (activeDriver) {
                try {
                    yield activeDriver.quit();
                }
                catch (e) {
                    // Ignore quit errors
                }
                activeDriver = null;
            }
            return { success: false, message: 'Error stopping recording' };
        }
    });
}
function main(meetUrl) {
    return __awaiter(this, void 0, void 0, function* () {
        // broadcastLog('🤖 Bot main function started');
        try {
            const driver = yield getDriver();
            activeDriver = driver; // Store globally
            //joining meet
            (0, server_1.broadcastLog)('🌐 Opening Google Meet...');
            yield openMeet(driver, meetUrl);
            (0, server_1.broadcastLog)('⏰ Waiting 20 seconds for host approval...');
            yield new Promise((x) => setTimeout(x, 20000));
            //wait until the admin approves the bot to join
            //enable captions
            yield enableCaptions(driver);
            //starting screensharing
            yield startScreenshare(driver);
        }
        catch (error) {
            (0, server_1.broadcastLog)('❌ Error in main function: ' + error);
            activeDriver = null;
        }
    });
}
// Register the bot functions with the server
const server_2 = require("./server");
server_2.botController.startBot = main;
server_2.botController.stopBot = stopRecordingAndLeave;
console.log('✅ Bot ready to receive commands from frontend');
// screen recording code checked in console
// window.navigator.mediaDevices.getDisplayMedia().then(stream=>{
//   const videoEl = document.createElement('video');
// videoEl.srcObject = stream;
//   videoEl.play();
// document.getElementsByClassName('qdOxv-fmcmS-yrriRe')[0].appendChild(videoEl);
// });
