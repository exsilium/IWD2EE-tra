import * as fs from 'fs';
import * as path from 'path';
import * as readline from 'readline';
import iconv from 'iconv-lite';

interface JsonOutput {
  [key: string]: string;
}

async function parseTraFile(inputFilePath: string, outputFilePath: string, encoding: string = 'utf-8'): Promise<void> {
  const fileStream = fs.createReadStream(inputFilePath);

  // We check if we should use decoded Stream of just a fileStream
  const enableDecode = ['win1251', 'windows-1251', 'cp1251'].includes(encoding.toLowerCase());
  const input = enableDecode ? fileStream.pipe(iconv.decodeStream(encoding)) : fileStream;

  const rl = readline.createInterface({
    input: input,
    crlfDelay: Infinity
  });

  const jsonOutput: JsonOutput = {};
  let currentKey: string | null = null;
  let currentValue: string[] = [];
  let recording: boolean = false;

  for await (const line of rl) {
    if (!line.trim() || line.trim().startsWith('//')) continue;

    if (!recording && line.trim().match(/^@\d+/)) {
      const match = line.match(/^@(\d+) *= *~/);
      if (match) {
        recording = true;
        currentKey = match[1];
        currentValue = [];
        const startOfValue = line.indexOf('~', match[0].length - 1) + 1;
        const linePart = line.substring(startOfValue).trimStart();
        if (linePart.endsWith('~')) {
          currentValue.push(linePart.slice(0, -1).trimEnd());
          finalizeKeyValue();
        } else {
          currentValue.push(linePart);
        }
      }
    } else if (recording) {
      const lineTrim = line.trimEnd();
      if (lineTrim.endsWith('~')) {
        currentValue.push(lineTrim.slice(0, -1));
        finalizeKeyValue();
      } else {
        currentValue.push(line);
      }
    }
  }

  function finalizeKeyValue() {
    if (currentKey !== null) {
      const fullValue = currentValue.join('\n').replace(/~~/g, '~');
      jsonOutput[currentKey] = fullValue;
    }
    recording = false;
    currentKey = null;
    currentValue = [];
  }

  safeWriteFileSync(outputFilePath, JSON.stringify(jsonOutput, null, 2));
  console.log('Conversion completed successfully - ' + inputFilePath);
}

function safeWriteFileSync(filePath: string, data: string): void {
  // Ensure the directory exists
  const dirPath = path.dirname(filePath);
  if (!fs.existsSync(dirPath)) {
    // Recursive true to create all directories in the path if needed
    fs.mkdirSync(dirPath, { recursive: true });
  }

  // Write the file
  fs.writeFileSync(filePath, data);
}

export { parseTraFile };