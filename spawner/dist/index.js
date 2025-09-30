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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const selenium_webdriver_1 = require("selenium-webdriver");
const chrome_1 = require("selenium-webdriver/chrome");
const path_1 = __importDefault(require("path"));
require("./server"); // Just run the server
function openMeet(driver, meetUrl) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            yield driver.get(meetUrl);
            console.log('google link entered');
            console.log('driver sleep entered');
            // waiting for the elements of the page to load
            yield driver.sleep(10000);
            console.log('driver sleep done');
            const popupButton = yield driver.wait(selenium_webdriver_1.until.elementLocated(selenium_webdriver_1.By.xpath("//span[contains(text(),'Got it')]")));
            popupButton.click();
            // const nameInput = await driver.wait(until.elementLocated(By.id("c11")), 10000);
            const nameInput = yield driver.wait(selenium_webdriver_1.until.elementLocated(selenium_webdriver_1.By.xpath('//input[@placeholder="Your name"]')), 10000);
            yield nameInput.clear();
            yield nameInput.click();
            yield nameInput.sendKeys('value', 'Meeting Rec Bot');
            yield driver.sleep(2000);
            // await driver.wait(until.elementLocated(By.id('c12314')), 10000);
            const buttonElement = yield driver.wait(selenium_webdriver_1.until.elementLocated(selenium_webdriver_1.By.xpath("//span[contains(text(),'Ask to join')]")));
            yield buttonElement.click();
            console.log('############ Request to join meeting sent!! ###########');
            // await driver.wait(until.elementLocated(By.id('c12314')), 900000);
        }
        finally {
            // await driver.quit();
        }
    });
}
function getDriver() {
    return __awaiter(this, void 0, void 0, function* () {
        console.log('📝 Setting up Chrome options...');
        const chromeOptions = new chrome_1.Options();
        chromeOptions.addArguments('--disable-blink-features=AutomationControlled');
        chromeOptions.addArguments('--use-fake-ui-for-media-stream');
        chromeOptions.addArguments('--window-size=1080,720');
        chromeOptions.addArguments('--enable-usermedia-screen-capturing');
        chromeOptions.addArguments('--no-sandbox');
        chromeOptions.addArguments('--disable-dev-shm-usage');
        console.log('🚀 Building WebDriver with explicit ChromeDriver path...');
        // Use the locally installed chromedriver
        const chromedriverPath = path_1.default.join(__dirname, '../node_modules/chromedriver/lib/chromedriver/chromedriver.exe');
        console.log('ChromeDriver path:', chromedriverPath);
        const service = new chrome_1.ServiceBuilder(chromedriverPath);
        let driver = yield new selenium_webdriver_1.Builder()
            .forBrowser(selenium_webdriver_1.Browser.CHROME)
            .setChromeOptions(chromeOptions)
            .setChromeService(service)
            .build();
        console.log('✅ WebDriver built successfully!');
        return driver;
    });
}
function startScreenshare(driver) {
    return __awaiter(this, void 0, void 0, function* () {
        console.log('startScreenshare called');
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
        yield driver.sleep(2000);
    });
}
function main(meetUrl) {
    return __awaiter(this, void 0, void 0, function* () {
        console.log('🤖 Main function called with URL:', meetUrl);
        try {
            console.log('Creating Chrome driver...');
            const driver = yield getDriver();
            console.log('✅ Chrome driver created successfully');
            //joining meet
            console.log('Opening Meet URL...');
            yield openMeet(driver, meetUrl);
            yield new Promise((x) => setTimeout(x, 60000));
            //wait until the admin approves the bot to join
            //starting screensharing
            yield startScreenshare(driver);
        }
        catch (error) {
            console.error('❌ Error in main function:', error);
        }
    });
}
// Register the bot function with the server
const server_1 = require("./server");
server_1.botController.startBot = main;
console.log('✅ Bot ready to receive commands from frontend');
// screen recording code checked in console
// window.navigator.mediaDevices.getDisplayMedia().then(stream=>{
//   const videoEl = document.createElement('video');
// videoEl.srcObject = stream;
//   videoEl.play();
// document.getElementsByClassName('qdOxv-fmcmS-yrriRe')[0].appendChild(videoEl);
// });
