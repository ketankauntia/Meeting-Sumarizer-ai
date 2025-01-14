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
function openMeet(driver) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            yield driver.get('https://meet.google.com/gmy-cnvh-whq');
            // waiting for the elements of the page to load
            yield driver.sleep(3000);
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
        chromeOptions.addArguments('--use-fake-ui-for-media-stream'); //to enable mic and camera :)
        chromeOptions.addArguments('--disable-blink-features=AutomationControlled');
        chromeOptions.addArguments('--window-aize=1080,720');
        chromeOptions.addArguments('--auto-select-desktop-capture-source=[RECORD]');
        chromeOptions.addArguments('--enable-usermedia-screen-capturing');
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
        console.log('startScreensharecalled');
        const response = yield driver.executeScript(`
      function wait(delayInMS) {
          return new Promise((resolve) => setTimeout(resolve, delayInMS));
      }
      function startRecording(stream, lengthInMS) {
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
    
      console.log("before mediadevices")
      window.navigator.mediaDevices.getDisplayMedia({
          video: {
            displaySurface: "browser"
          },
          audio: true,
          preferCurrentTab: true
      }).then(async stream => {
          // stream should be streamed via WebRTC to a server
          console.log("before start recording")
          const recordedChunks = await startRecording(stream, 20000);
          console.log("after start recording")
          let recordedBlob = new Blob(recordedChunks, { type: "video/webm" });
          const recording = document.createElement("video");
          recording.src = URL.createObjectURL(recordedBlob);
          const downloadButton = document.createElement("a");
          downloadButton.href = recording.src;
          downloadButton.download = "RecordedVideo.webm";    
          downloadButton.click();
          console.log("after download button click")
      })
      
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
