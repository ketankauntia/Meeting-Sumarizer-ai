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
            yield driver.get('https://meet.google.com/foi-ujiv-tst');
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
            yield driver.wait(selenium_webdriver_1.until.elementLocated(selenium_webdriver_1.By.id('c12314')), 900000);
        }
        finally {
            yield driver.quit();
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
function startScreenShare(driver) {
    //
    driver.sleep(900000);
}
function main() {
    return __awaiter(this, void 0, void 0, function* () {
        const driver = yield getDriver();
        //joining meet
        yield openMeet(driver);
        //wait until the admin approves the bot to join
        //starting screensharing
        yield startScreenShare(driver);
    });
}
main();
// screen recording code checked in console
// window.navigator.mediaDevices.getUserMedia().then((stream) => {
//   const videoEl = document.createElement('video');
//   videoEl.srcObject = stream;
//   document.getElementsByClassName('qdOxv-fmcmS-wGMbrd')[0].appendChild(videoEl);
// });
