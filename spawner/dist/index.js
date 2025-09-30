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
        const chrome = require('selenium-webdriver/chrome');
        const service = new chrome.ServiceBuilder(require('chromedriver').path);
        const chromeOptions = new chrome_1.Options();
        chromeOptions.addArguments('--disable-blink-features=AutomationControlled');
        chromeOptions.addArguments('--use-fake-ui-for-media-stream');
        chromeOptions.addArguments('--window-size=1080,720');
        chromeOptions.addArguments('--enable-usermedia-screen-capturing');
        chromeOptions.addArguments('--no-sandbox');
        chromeOptions.addArguments('--disable-dev-shm-usage');
        chromeOptions.addArguments('--disable-gpu');
        // broadcastLog('🚗 Building Chrome WebDriver...');
        let driver = yield new selenium_webdriver_1.Builder()
            .forBrowser(selenium_webdriver_1.Browser.CHROME)
            .setChromeOptions(chromeOptions)
            .setChromeService(service)
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
