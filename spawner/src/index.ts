import { Builder, Browser, By, Key, until, WebDriver } from 'selenium-webdriver';
import { Options } from 'selenium-webdriver/chrome';

async function openMeet(driver: WebDriver) {
  try {
    await driver.get('https://meet.google.com/gmy-cnvh-whq');

    // waiting for the elements of the page to load
    await driver.sleep(3000);

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
  //passing flags to selenium grid
  const chromeOptions = new Options({});
  chromeOptions.addArguments('--use-fake-ui-for-media-stream'); //to enable mic and camera :)
  chromeOptions.addArguments('--disable-blink-features=AutomationControlled');
  chromeOptions.addArguments('--window-aize=1080,720');
  chromeOptions.addArguments('--auto-select-desktop-capture-source=[RECORD]');
  chromeOptions.addArguments('--enable-usermedia-screen-capturing');

  //WebDriver instance with Chrome
  let driver = await new Builder()
    .forBrowser(Browser.CHROME)
    .setChromeOptions(chromeOptions) //while building the chrome instance we need to set automation disabled.
    .build();

  return driver;
}

async function startScreenshare(driver: WebDriver) {
  console.log('startScreensharecalled');
  const response = await driver.executeScript(`
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
}

async function main() {
  const driver = await getDriver();

  //joining meet
  await openMeet(driver);

  //wait until the admin approves the bot to join

  //starting screensharing
  await startScreenshare(driver);
}

main();

// screen recording code checked in console
// window.navigator.mediaDevices.getDisplayMedia().then(stream=>{
//   const videoEl = document.createElement('video');
// videoEl.srcObject = stream;
//   videoEl.play();
// document.getElementsByClassName('qdOxv-fmcmS-yrriRe')[0].appendChild(videoEl);

// });
