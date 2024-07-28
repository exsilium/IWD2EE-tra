import * as fs from 'fs';
import * as path from 'path';
import iconv from 'iconv-lite';

interface JsonInput {
  [key: string]: string;
}

async function parseJsonFile(inputFilePath: string, outputFilePath: string, encoding: string = 'utf-8'): Promise<void> {
  const rawData = fs.readFileSync(inputFilePath, 'utf8');
  const jsonData: JsonInput = JSON.parse(rawData);

  const enableEncode = ['win1251', 'windows-1251', 'cp1251'].includes(encoding.toLowerCase());
  const outputStream = fs.createWriteStream(outputFilePath);
  const encodedStream = enableEncode ? iconv.encodeStream(encoding) : outputStream;

  if (enableEncode) {
    outputStream.pipe(encodedStream);
  }

  for (const key in jsonData) {
    if (jsonData.hasOwnProperty(key)) {
      let value = jsonData[key].replace(/~/g, '~~');
      const tagMatch = value.match(/\[[A-Z0-9]+\]$/); // Updated regex to match specific end tag
      if (tagMatch) {
        value = value.substring(0, value.lastIndexOf('[')); // Remove the tag for processing
      }
      const formattedValue = `@${key} = ~${value.trim()}~ ${tagMatch ? tagMatch[0] : ''}\n`;

      if (enableEncode) {
        encodedStream.write(formattedValue);
      } else {
        outputStream.write(formattedValue);
      }
    }
  }

  if (enableEncode) {
    encodedStream.end();
  } else {
    outputStream.end();
  }

  console.log('Conversion to .TRA completed successfully - ' + outputFilePath);
}

export { parseJsonFile };