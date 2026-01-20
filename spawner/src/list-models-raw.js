import https from 'https';
import fs from 'fs';
import path from 'path';

// Use the key provided by the user
const apiKey = process.env.GEMINI_API_KEY || 'AIzaSyBpy8JQob8WPA0cv4z40XYfwjCDFK1uboY';
const url = `https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`;

console.log('Fetching models from:', url.replace(apiKey, 'HIDDEN_KEY'));

https.get(url, (res) => {
    let data = '';
    res.on('data', chunk => data += chunk);
    res.on('end', () => {
        if (res.statusCode === 200) {
            const json = JSON.parse(data);
            console.log('\n--- AVAILABLE MODELS ---');
            json.models.filter(m => m.supportedGenerationMethods.includes('generateContent')).forEach(m => {
                console.log(m.name);
            });
            console.log('------------------------\n');
        } else {
            console.error(`Error: ${res.statusCode} - ${data}`);
        }
    });
}).on('error', e => console.error(e));
