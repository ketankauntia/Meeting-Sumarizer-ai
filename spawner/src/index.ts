import { Builder, Browser, By, Key, until, WebDriver } from 'selenium-webdriver';
import { Options } from 'selenium-webdriver/chrome';

async function openMeet(driver: WebDriver) {
  try {
    await driver.get('https://meet.google.com/foi-ujiv-tst');

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

async function startScreenShare(driver: WebDriver) {
  //
  console.log('############## screen Share entered ##############');
  // const response = await driver.executeScript(`
  //   window.navigator.mediaDevices.getDisplayMedia().then(stream=>{
  //   const videoEl = document.createElement('video');
  //   videoEl.srcObject = stream;
  //   videoEl.play();
  //   document.body.appendChild(videoEl);});
  //   `);
  const response = await driver.executeScript(`
    console.log("hi there");
    `);

  console.log(response);
  driver.sleep(900000);
}

async function main() {
  const driver = await getDriver();

  //joining meet
  await openMeet(driver);

  //wait until the admin approves the bot to join

  //starting screensharing
  await startScreenShare(driver);
}

main();

// screen recording code checked in console
// window.navigator.mediaDevices.getDisplayMedia().then(stream=>{
//   const videoEl = document.createElement('video');
// videoEl.srcObject = stream;
//   videoEl.play();
// document.getElementsByClassName('qdOxv-fmcmS-yrriRe')[0].appendChild(videoEl);

// });
