// postProcessCaptions.ts
// Cleans, dedupes, and merges raw captions for better summarization

import fs from "fs";
import path from "path";

/**
 * Raw caption entry as captured from Meet
 */
export interface RawCaption {
  timestamp: string;
  speaker?: string;
  text: string;
}

/**
 * Cleaned caption entry
 */
export interface ProcessedCaption {
  timestamp: string;
  speaker: string;
  text: string;
}

/**
 * STEP 1: Split speaker name from caption text if present.
 * Google Meet format: <Speaker Name>\n<caption text>
 */
function splitSpeaker(rawText: string): { speaker: string; text: string } {
  const lines = rawText
    .split("\n")
    .map(l => l.trim())
    .filter(Boolean);

  if (lines.length >= 2) {
    return {
      speaker: lines[0],
      text: lines.slice(1).join(" ")
    };
  }

  return {
    speaker: "Participant",
    text: rawText.trim()
  };
}

/**
 * STEP 2: Merge progressive caption expansions.
 * Example:
 *  "So are the captions?"
 *  "So are the captions being sent?"
 * Keep only the final version.
 */
function mergeExpansions(captions: ProcessedCaption[]): ProcessedCaption[] {
  const merged: ProcessedCaption[] = [];

  for (const c of captions) {
    const last = merged[merged.length - 1];

    if (last && last.speaker === c.speaker && c.text.startsWith(last.text)) {
      // Overwrite with refined caption
      last.text = c.text;
      last.timestamp = c.timestamp;
    } else {
      merged.push({ ...c });
    }
  }

  return merged;
}

/**
 * STEP 3: Merge consecutive captions by same speaker into paragraphs.
 */
function mergeSpeakerBlocks(captions: ProcessedCaption[]): ProcessedCaption[] {
  const merged: ProcessedCaption[] = [];

  for (const c of captions) {
    const last = merged[merged.length - 1];

    if (last && last.speaker === c.speaker) {
      last.text += " " + c.text;
    } else {
      merged.push({ ...c });
    }
  }

  return merged;
}

/**
 * MAIN PIPELINE - Clean raw captions for summarization
 */
export function postProcessCaptions(rawCaptions: RawCaption[]): ProcessedCaption[] {
  // 1️⃣ Normalize speaker + text
  const normalized: ProcessedCaption[] = rawCaptions
    .map(rc => {
      const { speaker, text } = splitSpeaker(rc.text);
      return {
        speaker: rc.speaker && rc.speaker !== 'Participant' && rc.speaker !== 'raw' 
          ? rc.speaker 
          : speaker,
        text,
        timestamp: rc.timestamp
      };
    })
    .filter(c => c.text.length > 0);

  // 2️⃣ Merge incremental caption expansions
  const deduped = mergeExpansions(normalized);

  // 3️⃣ Merge same-speaker blocks
  const finalTranscript = mergeSpeakerBlocks(deduped);

  return finalTranscript;
}

/**
 * CLI Usage: ts-node postProcessCaptions.ts input.json output.json
 */
if (require.main === module) {
  const [, , inputFile, outputFile] = process.argv;

  if (!inputFile || !outputFile) {
    console.error("Usage: ts-node postProcessCaptions.ts raw.json cleaned.json");
    process.exit(1);
  }

  const rawData = JSON.parse(fs.readFileSync(path.resolve(inputFile), "utf-8"));

  if (!rawData.captions || !Array.isArray(rawData.captions)) {
    throw new Error("Invalid input format: captions[] missing");
  }

  const cleaned = postProcessCaptions(rawData.captions);

  fs.writeFileSync(
    path.resolve(outputFile),
    JSON.stringify({
      processedAt: new Date().toISOString(),
      totalCaptions: cleaned.length,
      captions: cleaned
    }, null, 2)
  );

  console.log(`✅ Post-processing complete: ${cleaned.length} captions written`);
}
