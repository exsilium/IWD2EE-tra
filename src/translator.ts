import OpenAI from 'openai';
import * as fs from 'fs';
import * as path from 'path';

const translateText = async (text: string, apiKey: string): Promise<string> => {
  const openai = new OpenAI({ apiKey });

  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        { role: 'system', content: 'Translate from English to Estonian, a Dungeons & Dragons Forgotten Realms Icewind Dale 2 text, keeping the tone.' },
        { role: 'user', content: `${text}` }
      ]
    });

    const translatedText = response.choices[0].message?.content;

    if (translatedText && !translatedText.includes("Please provide the text you'd like to translate")) {
      return translatedText;
    } else {
      return text; // Return the original text if the translation is unclear or indicates an error
    }
  } catch (error) {
    console.error('Failed to translate text:', error);
    return '';
  }
};

const translateFile = async (filePath: string, apiKey: string, startIndex: number = 0, limit: number = Infinity): Promise<void> => {
  const rawData = fs.readFileSync(path.resolve(filePath), { encoding: 'utf-8' });
  const data = JSON.parse(rawData);
  const translations: Record<string, string> = {};

  const entries = Object.entries(data);
  const endIndex = Math.min(entries.length, startIndex + limit);  // Calculate end index based on limit

  for (let i = startIndex; i < endIndex; i++) {
    const [key, value] = entries[i];
    if((value as string).length > 0) {
      const translatedText = await translateText(value as string, apiKey);
      translations[key] = translatedText;
      console.log("Translated: " + key + ": " + translatedText);
    }
    else {
      translations[key] = "";
      console.log("Translation query skipped (empty string): " + key);
    }
  }

  const outputPath = path.resolve('./translated_file.json');
  fs.appendFileSync(outputPath, JSON.stringify(translations, null, 2), 'utf-8');
  console.log('Finished translating the file.');
};

export { translateFile }