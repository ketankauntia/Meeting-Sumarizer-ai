# Meeting Summarizer - Spawner

A Selenium-based bot that joins Google Meet calls to record and summarize meetings.

## Prerequisites

- Node.js v18+
- Google Chrome (latest version)
- ChromeDriver (must match your Chrome version)

## Installation

```bash
npm install
```

## Usage

```bash
npm run dev
```

---

## 🔧 Troubleshooting: ChromeDriver Version Mismatch

### The Error

If you see an error like this:

```
SessionNotCreatedError: session not created: This version of ChromeDriver only supports Chrome version 134
Current browser version is 143.0.7499.193 with binary path C:\Program Files\Google\Chrome\Application\chrome.exe
```

This means **ChromeDriver and Chrome versions don't match**. Selenium requires both to have the same major version.

---

### Step 1: Check Your Chrome Version

Open Chrome and go to `chrome://version` or check:
```bash
# Windows (PowerShell)
(Get-Item "C:\Program Files\Google\Chrome\Application\chrome.exe").VersionInfo.FileVersion

# Or check in browser: chrome://settings/help
```

Note your Chrome major version (e.g., **143**).

---

### Step 2: Check Your ChromeDriver Version

```bash
chromedriver --version
```

If the major version doesn't match Chrome, you need to update ChromeDriver.

---

### Step 3: Find Where ChromeDriver Is Installed

```bash
# Windows (Git Bash / CMD)
where chromedriver

# macOS/Linux
which chromedriver
```

Common locations:
- Windows: `C:\webdrivers\chromedriver.exe`
- macOS: `/usr/local/bin/chromedriver`
- Linux: `/usr/bin/chromedriver`

---

### Step 4: Download the Correct ChromeDriver

Go to [Chrome for Testing](https://googlechromelabs.github.io/chrome-for-testing/) and download the ChromeDriver matching your Chrome version.

**Direct download links for ChromeDriver 143** (replace version as needed):

| Platform | Download Link |
|----------|---------------|
| Windows 64-bit | `https://storage.googleapis.com/chrome-for-testing-public/143.0.7499.192/win64/chromedriver-win64.zip` |
| Windows 32-bit | `https://storage.googleapis.com/chrome-for-testing-public/143.0.7499.192/win32/chromedriver-win32.zip` |
| macOS ARM64 | `https://storage.googleapis.com/chrome-for-testing-public/143.0.7499.192/mac-arm64/chromedriver-mac-arm64.zip` |
| macOS x64 | `https://storage.googleapis.com/chrome-for-testing-public/143.0.7499.192/mac-x64/chromedriver-mac-x64.zip` |
| Linux 64-bit | `https://storage.googleapis.com/chrome-for-testing-public/143.0.7499.192/linux64/chromedriver-linux64.zip` |

---

### Step 5: Replace the Old ChromeDriver

**Windows (Git Bash):**
```bash
# Download
curl -L -o chromedriver.zip "https://storage.googleapis.com/chrome-for-testing-public/143.0.7499.192/win64/chromedriver-win64.zip"

# Extract
unzip chromedriver.zip

# Replace (adjust path as needed)
cp chromedriver-win64/chromedriver.exe /c/webdrivers/chromedriver.exe
```

**macOS/Linux:**
```bash
# Download (example for macOS ARM64)
curl -L -o chromedriver.zip "https://storage.googleapis.com/chrome-for-testing-public/143.0.7499.192/mac-arm64/chromedriver-mac-arm64.zip"

# Extract
unzip chromedriver.zip

# Replace
sudo mv chromedriver-mac-arm64/chromedriver /usr/local/bin/chromedriver
sudo chmod +x /usr/local/bin/chromedriver
```

---

### Step 6: Verify the Fix

```bash
chromedriver --version
# Should show: ChromeDriver 143.x.x.x (matching your Chrome)
```

Then run the app:
```bash
npm run dev
```

---

### Alternative: Let Selenium Manager Handle It

Instead of managing ChromeDriver manually, you can let Selenium handle it automatically:

1. **Remove ChromeDriver from your PATH** (rename or delete the old `chromedriver.exe`)

2. **Clear Selenium cache:**
   ```bash
   # Windows
   rm -rf $LOCALAPPDATA/selenium
   
   # macOS/Linux
   rm -rf ~/.cache/selenium
   ```

3. **Run the app** - Selenium Manager will download the correct ChromeDriver automatically

> ⚠️ **Note:** This approach requires Selenium to have internet access on first run.

---

### Why Does This Happen?

- Chrome auto-updates frequently (every ~4 weeks)
- ChromeDriver doesn't auto-update
- When Chrome updates to a new major version, the old ChromeDriver becomes incompatible

**Pro tip:** Check for ChromeDriver updates whenever you see Chrome updated in the browser.

---

## Project Structure

```
spawner/
├── src/
│   ├── index.ts      # Main entry point - joins Google Meet
│   └── server.ts     # WebSocket server for streaming
├── dist/             # Compiled JavaScript
├── package.json
└── tsconfig.json
```

## License

ISC
