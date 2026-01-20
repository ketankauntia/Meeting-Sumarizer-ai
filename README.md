UI : <img width="1920" height="859" alt="image" src="https://github.com/user-attachments/assets/6c6dbc6e-0e08-4043-b91c-1a8ff4553797" />
<img width="536" height="390" alt="Meet Summarizer Ai" src="https://github.com/user-attachments/assets/93a143d2-c335-4d77-8fbb-ec118e25c24f" />

```
note: summary will be shown in a modal. (the below ss is of a random 5-10sec converstaion.)
```
<img width="533" height="641" alt="image" src="https://github.com/user-attachments/assets/66b5dfdb-4295-49cf-957a-987c47f6715a" />


1. Open 2 terminals and Install all packages 
```
    cd frontend
    npm i
```

```
    cd spawner
    npm i
```

2. Create .env File & add your gemini api key

```for bash,
    cd spawner
    touch .env
```

```for cmd,
    cd spawner
    echo. > .env
```

Add teh gemini api key there :- 
```env
GEMINI_API_KEY=your_actual_api_key_here
```


3. open two new terminals and paste the following in each terminal

```
    cd frontend
    npm run dev
```

```
    cd spawner
    npm run dev
```

4. now you can test the application.

---

## 🔧 Troubleshooting

If you encounter a **ChromeDriver version mismatch error** like:
```
SessionNotCreatedError: session not created: This version of ChromeDriver only supports Chrome version X
```

See the detailed troubleshooting guide in [`spawner/README.md`](./spawner/README.md#-troubleshooting-chromedriver-version-mismatch).
