import 'dotenv/config';
import { GoogleGenAI } from "@google/genai";
import fs from 'fs';

async function testSummary() {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
        console.error('❌ No API Key found in .env');
        return;
    }

    const ai = new GoogleGenAI({ apiKey: apiKey });
    const modelName = 'gemini-3-flash-preview';

    const captionsPath = 'c:\\Users\\KIIT0001\\Desktop\\projects\\Meeting-Sumarizer-ai\\spawner\\recordings\\captions-cleaned-2026-01-20T19-45-34.json';

    if (!fs.existsSync(captionsPath)) {
        console.error('❌ Captions file not found!');
        return;
    }

    try {
        const data = JSON.parse(fs.readFileSync(captionsPath, 'utf8'));
        const transcript = data.captions.map(c => `${c.speaker}: ${c.text}`).join('\n');

        console.log(`🤖 Using model: ${modelName}`);
        console.log('🚀 Sending request to Gemini...');

        const response = await ai.models.generateContent({
            model: modelName,
            contents: [{
                role: "user",
                parts: [{ text: `Summarize this meeting transcript in markdown:\n\n${transcript}` }]
            }],
        });

        // --- SAFETY CHECKS ---
        if (!response.candidates || response.candidates.length === 0) {
            console.error('❌ Gemini returned no results. This happens if the content is blocked or the AI is confused.');
            console.log('Full Response Object:', JSON.stringify(response, null, 2));
            return;
        }

        const candidate = response.candidates[0];

        if (candidate.finishReason && candidate.finishReason !== 'STOP') {
            console.warn(`⚠️ Warning: Response finished with reason: ${candidate.finishReason}`);
        }

        if (!candidate.content || !candidate.content.parts) {
            console.error('❌ Response structure is missing content parts.');
            console.log('Candidate Data:', JSON.stringify(candidate, null, 2));
            return;
        }

        const summaryText = candidate.content.parts[0].text;

        console.log('\n✅ SUCCESS! Generated Summary:\n');
        console.log('--------------------------------------------------');
        console.log(summaryText);
        console.log('--------------------------------------------------');

    } catch (error) {
        console.error('❌ Error during execution:');
        console.error(error.message);
    }
}

testSummary();