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
function openMeet(driver) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            yield driver.get('https://meet.google.com/rza-tdqt-pne');
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
        //passing flags to selenium grid
        const chromeOptions = new chrome_1.Options({});
        chromeOptions.addArguments('--disable-blink-features=AutomationControlled');
        chromeOptions.addArguments('--use-fake-ui-for-media-stream');
        chromeOptions.addArguments('--window-size=1080,720');
        chromeOptions.addArguments('--auto-select-desktop-capture-source=[RECORD]');
        chromeOptions.addArguments('--auto-select-desktop-capture-source=[RECORD]');
        chromeOptions.addArguments('--enable-usermedia-screen-capturing');
        chromeOptions.addArguments('--auto-select-tab-capture-source-by-title="Meet"');
        chromeOptions.addArguments('--allow-running-insecure-content');
        //WebDriver instance with Chrome
        let driver = yield new selenium_webdriver_1.Builder()
            .forBrowser(selenium_webdriver_1.Browser.CHROME)
            .setChromeOptions(chromeOptions) //while building the chrome instance we need to set automation disabled.
            .build();
        return driver;
    });
}
function startScreenshare(driver) {
    return __awaiter(this, void 0, void 0, function* () {
        console.log('startScreenshare called');
        const response = yield driver.executeScript(`
      function wait(delayInMS) {
          return new Promise((resolve) => setTimeout(resolve, delayInMS));
      }

      async function startRecording(stream, lengthInMS) {
          let recorder = new MediaRecorder(stream);
          let data = [];

          recorder.ondataavailable = (event) => data.push(event.data);
          recorder.start();

          let stopped = new Promise((resolve, reject) => {
              recorder.onstop = resolve;
              recorder.onerror = (event) => reject(event.name);
          });

          let recorded = wait(lengthInMS).then(() => {
              if (recorder.state === "recording") {
                  recorder.stop();
              }
          });

          return Promise.all([stopped, recorded]).then(() => data);
      }

      console.log("before media devices");
      try {
          const screenStream = await window.navigator.mediaDevices.getDisplayMedia({
              video: { displaySurface: "browser" },
              audio: true,
              preferCurrentTab: true
          });

          console.log("before start recording");

          // Audio processing to mix multiple audio tracks into one
          const audioContext = new AudioContext();
          const screenAudioStream = audioContext.createMediaStreamSource(screenStream);

          // Connect audio elements to MediaStreamDestination
          const dest = audioContext.createMediaStreamDestination();
          const audioEl1 = document.querySelectorAll("audio")[0];
          const audioEl2 = document.querySelectorAll("audio")[1];
          const audioEl3 = document.querySelectorAll("audio")[2];

          if (audioEl1 && audioEl1.srcObject) {
              const audioElStream1 = audioContext.createMediaStreamSource(audioEl1.srcObject);
              audioElStream1.connect(dest);
          }
          if (audioEl2 && audioEl2.srcObject) {
              const audioElStream2 = audioContext.createMediaStreamSource(audioEl2.srcObject);
              audioElStream2.connect(dest);
          }
          if (audioEl3 && audioEl3.srcObject) {
              const audioElStream3 = audioContext.createMediaStreamSource(audioEl3.srcObject);
              audioElStream3.connect(dest);
          }
          screenAudioStream.connect(dest);

          // Combine screen and audio streams
          const combinedStream = new MediaStream([
              ...screenStream.getVideoTracks(),
              ...dest.stream.getAudioTracks()
          ]);

          // Create video element to display stream
          const videoElement = document.createElement('video');
          videoElement.srcObject = combinedStream;
          videoElement.autoplay = true;
          videoElement.controls = true;
          document.body.appendChild(videoElement);

          // WebSocket connection to backend
          const socket = new WebSocket("ws://localhost:8080");

          // Handle WebSocket errors
          socket.onerror = (error) => {
              console.error("WebSocket Error: ", error);
          };

          const mediaRecorder = new MediaRecorder(combinedStream);
          mediaRecorder.ondataavailable = (event) => {
              // Send chunks of data to backend via WebSocket
              socket.send(event.data);
          };

          // Start recording in chunks (5 seconds)
          mediaRecorder.start(5000);

          // Stop recording after a certain duration (60 seconds for demo)
          setTimeout(() => {
              mediaRecorder.stop();
              socket.close();
          }, 60000);  // Stop after 60 seconds for demonstration

      } catch (error) {
          console.error("Error during screen capture:", error);
      }
  `);
        console.log(response);
        driver.sleep(1000000);
    });
}
function main() {
    return __awaiter(this, void 0, void 0, function* () {
        const driver = yield getDriver();
        //joining meet
        yield openMeet(driver);
        yield new Promise((x) => setTimeout(x, 20000));
        //wait until the admin approves the bot to join
        //starting screensharing
        yield startScreenshare(driver);
    });
}
main();
// screen recording code checked in console
// window.navigator.mediaDevices.getDisplayMedia().then(stream=>{
//   const videoEl = document.createElement('video');
// videoEl.srcObject = stream;
//   videoEl.play();
// document.getElementsByClassName('qdOxv-fmcmS-yrriRe')[0].appendChild(videoEl);
// });
