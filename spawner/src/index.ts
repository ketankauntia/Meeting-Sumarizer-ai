import { Builder, Browser, By, Key, until } from "selenium-webdriver";
import { Options } from "selenium-webdriver/chrome";

async function main() {
  //passing flags to selenium grid
  const chromeOptions = new Options();
  chromeOptions.addArguments("--disable-blink-features=AutomationControlled");

  //WebDriver instance with Chrome
  let driver = await new Builder()
    .forBrowser(Browser.CHROME)
    .setChromeOptions(chromeOptions)
    .build();

  try {
    await driver.get("https://meet.google.com/nvm-osfi-gfa");
    // await driver.findElement(By.name("q")).sendKeys("webdriver", Key.RETURN);
    await driver.wait(until.titleIs("webdriver - Google Search"), 20000);
  } finally {
    await driver.quit();
  }
}

main();
