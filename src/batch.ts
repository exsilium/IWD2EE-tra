import OpenAI from 'openai';
import * as fs from 'fs';
import * as path from 'path';

const createBatch = async (fileId: string, apiKey: string): Promise<void> => {
  const openai = new OpenAI({ apiKey });
  try {
    const result = await openai.batches.create({
      input_file_id: fileId,
      endpoint: "/v1/chat/completions",
      completion_window: "24h"
    });

    console.log(result);
  } catch (error) {
    console.error('Failed to create batch:', error);
    return;
  }
};

const listBatches = async (apiKey: string): Promise<void> => {
  const openai = new OpenAI({ apiKey });
  try {
    const result = await openai.batches.list();
    for await (const batch of result) {
      console.log(batch);
    }
  } catch (error) {
    console.error('Failed to query batch list:', error);
    return;
  }
};

const queryBatch = async (batchId: string, apiKey: string): Promise<void> => {
  const openai = new OpenAI({ apiKey });
  try {
    const result = await openai.batches.retrieve(batchId);
    console.log(result);
  } catch (error) {
    console.error('Failed to query batch status:', error);
    return;
  }
};

const saveBatch = async (fileId: string, apiKey: string): Promise<void> => {
  const openai = new OpenAI({ apiKey });
  try {
    const result = await openai.files.content(fileId);
    const fileContents = await result.text();
    fs.writeFileSync('results.jsonl', decodeUnicodeEscapes(fileContents), 'utf-8');
    console.log("Results saved as results.jsonl");
  } catch (error) {
    console.error('Failed to save batch:', error);
    return;
  }
};

const terminateBatch = async (batchId: string, apiKey: string): Promise<void> => {
  const openai = new OpenAI({ apiKey });
  try {
    const result = await openai.batches.cancel(batchId);
    console.log(result);
  } catch (error) {
    console.error('Failed to terminate batch:', error);
    return;
  }
};

const uploadBatch = async (filePath: string, apiKey: string): Promise<void> => {
  const openai = new OpenAI({ apiKey });

  try {
    const result = await openai.files.create({
      file: fs.createReadStream(path.resolve(filePath)),
      purpose: "batch",
    });

    console.log(result);
  } catch (error) {
    console.error('Failed to upload batch:', error);
    return;
  }
};

// Helpers
function decodeUnicodeEscapes(str: string): string {
  return str.replace(/\\u([\dA-F]{4})/gi, (match, grp) => String.fromCharCode(parseInt(grp, 16)));
}

export { createBatch, listBatches, queryBatch, saveBatch, terminateBatch, uploadBatch }