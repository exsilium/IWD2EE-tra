import OpenAI from 'openai';
import * as fs from 'fs';
import * as path from 'path';
import * as readline from 'readline';

interface batchRequest {
  custom_id: string;
  method: "POST";
  url: string;
  body: {
    model: string;
    messages: Array<{
      role: "system" | "user" | "assistant";
      content: string;
    }>;
  };
}

interface ApiResponse {
  id: string;
  custom_id: string;
  response: {
    status_code: number;
    request_id: string;
    body: any;
    error: any;
  };
}

const translateText = async (text: string, apiKey: string): Promise<string> => {
  const openai = new OpenAI({ apiKey });

  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4-turbo",
      messages: [
        { role: 'system', content: 'Translate to Estonian, Icewind Dale 2, keeping the tone. Be short and precise. If not possible to translate, start the response with "!$!$!$"' },
        { role: 'user', content: `${text}` }
      ]
    });

    // Extract and log token usage
    const usage = response.usage;
    if (usage) {
      console.log(`Total/Prompt/Completion Tokens: ${usage.total_tokens}/${usage.prompt_tokens}/${usage.completion_tokens}`);
    }

    const translatedText = response.choices[0].message?.content;

    if (translatedText && !translatedText.includes("!$!$!$")) {
      return translatedText;
    }
    else {
      return text; // Return the original text if the translation is unclear or indicates an error
    }
  } catch (error) {
    console.error('Failed to translate text:', error);
    return '';
  }
};

const translateFile = async (filePath: string, outputFilePath: string, apiKey: string, startIndex: number = 0, limit: number = Infinity): Promise<void> => {
  const rawData = fs.readFileSync(path.resolve(filePath), { encoding: 'utf-8' });
  const data = JSON.parse(rawData);
  const translations: Record<string, string> = {};

  const entries = Object.entries(data);
  const endIndex = Math.min(entries.length, startIndex + limit);  // Calculate end index based on limit

  for (let i = startIndex; i < endIndex; i++) {
    const [key, value] = entries[i];
    if((value as string).length > 0) {
      const parts = splitText(value as string);

      if(parts.mainText.length > 0) {
        const translatedText = await translateText(parts.mainText, apiKey);

        translations[key] = "";
        if(parts.startTag) {
          translations[key] = "[" + parts.startTag + "] ";
        }
        translations[key] += translatedText;

        if(parts.endTag) {
          translations[key] += " [" + parts.endTag + "]";
        }
        console.log("Translated: " + key + ": " + translations[key]);
      }
      else {
        translations[key] = value as string;
        console.log("Translation query skipped (empty textual part): " + key + ", \"" + translations[key] + "\"");
      }

    }
    else {
      translations[key] = "";
      console.log("Translation query skipped (empty string): " + key);
    }
  }

  const outputPath = path.resolve(outputFilePath);
  fs.appendFileSync(outputPath, JSON.stringify(translations, null, 2), 'utf-8');
  console.log('Finished translating the file.');
};

const translateFileOffline = async (filePath: string, outputFilePath: string, dictionaryFilePath: string, startIndex: number = 0, limit: number = Infinity): Promise<void> => {
  console.log("Attempting offline translation");
  const rawData = fs.readFileSync(path.resolve(filePath), { encoding: 'utf-8' });
  const data = JSON.parse(rawData);
  const dictionaryMap =  await loadJsonlToMap(dictionaryFilePath);
  const translations: Record<string, string> = {};

  const entries = Object.entries(data);
  const endIndex = Math.min(entries.length, startIndex + limit);  // Calculate end index based on limit

  for (let i = startIndex; i < endIndex; i++) {
    const [key, value] = entries[i];
    if((value as string).length > 0) {
      const parts = splitText(value as string);

      if(parts.mainText.length > 0) {
        const data = dictionaryMap.get(key);

        if (data) {
          console.log('Data found:', data.response.body.choices[0].message.content);
        } else {
          console.log('No data found for custom_id, aborting:', key);
          process.exit(1);
        }

        translations[key] = "";
        if(parts.startTag) {
          translations[key] = "[" + parts.startTag + "] ";
        }

        if(data.response.body.choices[0].message.content.includes("!$!$!$")) {
          translations[key] += parts.mainText;
        }
        else {
          translations[key] += data.response.body.choices[0].message.content;
        }

        if(parts.endTag) {
          translations[key] += " [" + parts.endTag + "]";
        }
        console.log("Translated: " + key + ": " + translations[key]);
      }
      else {
        translations[key] = value as string;
        console.log("Translation query skipped (empty textual part): " + key + ", \"" + translations[key] + "\"");
      }

    }
    else {
      translations[key] = "";
      console.log("Translation query skipped (empty string): " + key);
    }
  }

  const outputPath = path.resolve(outputFilePath);
  fs.appendFileSync(outputPath, JSON.stringify(translations, null, 2), 'utf-8');
  console.log('Finished translating the file.');
};

const writeBatch = async (filePath: string, outputFilePath: string, startIndex: number = 0, limit: number = Infinity): Promise<void> => {
  const rawData = fs.readFileSync(path.resolve(filePath), { encoding: 'utf-8' });
  const data = JSON.parse(rawData);
  const batchDataSet: batchRequest[] = [];

  const entries = Object.entries(data);
  const endIndex = Math.min(entries.length, startIndex + limit);  // Calculate end index based on limit

  for (let i = startIndex; i < endIndex; i++) {
    const [key, value] = entries[i];
    if((value as string).length > 0) {
      const parts = splitText(value as string);

      if(parts.mainText.length > 0) {
        const batchData: batchRequest = {
          custom_id: key,
          method: "POST",
          url: "/v1/chat/completions",
          body : {
            model: "gpt-4-turbo",
            messages: [
              {
                role: 'system',
                content: 'Translate to Estonian, Icewind Dale 2, keeping the tone. Be short and precise. If not possible to translate, start the response with "!$!$!$"'
              },
              {role: 'user', content: `${parts.mainText}`}
            ]
          }
        }
        batchDataSet.push(batchData);
      }
    }
  }

  const outputPath = path.resolve(outputFilePath);
  fs.writeFileSync(outputPath, batchDataSet.map(item => JSON.stringify(item)).join('\n'), 'utf-8');
  console.log('Finished writing the batch file.');
}

function splitText(inputString: string): { startTag?: string, mainText: string, endTag?: string } {
  // Define the regex pattern to capture the tags and the inner content
  const pattern = /^\[(.*?)\]\s*(.*?)\s*\[(.*?)\]$/;

  // Execute the pattern against the input string
  const match = inputString.match(pattern);

  if (match) {
    // Destructure the results to get tags and the main content
    const [, startTag, mainText, endTag] = match;

    // Return the parts as an object
    return { startTag, mainText, endTag };
  } else {
    // If no tags are found, return the entire string as mainText
    return { mainText: inputString };
  }
}

async function loadJsonlToMap(filePath: string): Promise<Map<string, ApiResponse>> {
  const fileStream = fs.createReadStream(filePath);
  const rl = readline.createInterface({
    input: fileStream,
    crlfDelay: Infinity
  });

  const dataMap = new Map<string, ApiResponse>();

  for await (const line of rl) {
    try {
      const record: ApiResponse = JSON.parse(line);
      dataMap.set(record.custom_id, record);
    } catch (error) {
      console.error('Error parsing line: ' + error);
    }
  }

  return dataMap;
}

export { translateFile, translateFileOffline, writeBatch }