1. Install all packages
```
    cd frontend
    npm i

    cd ..

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

**Example:**
```env
GEMINI_API_KEY=AIzaSyC1234567890abcdefghijklmnopqrstuvwx
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