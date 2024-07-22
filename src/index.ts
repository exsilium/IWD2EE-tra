import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';
import figlet from 'figlet';
import { Command } from '@commander-js/extra-typings';
import * as commander from 'commander';
import { parseTraFile } from './tra.js';
import { translateFile } from "./translator.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const parentDir = path.dirname(__dirname);
const program = new Command();

console.log(figlet.textSync("IWD2EE-tra"));
console.log("IWD2EE Translation tool\n");

program
  .command("init", { isDefault: true })
  .description("Default command, inits json translation files.")
  .action((source, destination) => {});

program
  .command("translate <source_json> <target_json>")
  .description("Experimental translation of .json file using OpenAI (English->Estonian)")
  .option("-k --key <openapi_key>", "OpenAPI Key for remote translate queries")
  .option("-l --limit <limit>", "Limit number of items to be translated, defaults to Infinity", parseInteger)
  .option("-s --start <startIndex>", "Start from the n-1'th element in the source json file", parseInteger)
  .action((source_json, target_json, options) => {
    if(!("key" in options)) {
      console.log("Please provide OpenAI API Key in command call (-k)");
      process.exit(1);
    }
    console.log("Translate command called");
    console.log("Source .json: " + source_json);
    console.log("Target .json: " + target_json);

    const resolvedInputFile = path.resolve(process.cwd(), <string> source_json);
    const resolvedOutputFile = path.resolve(process.cwd(), target_json);

    // Check that the file exists
    checkFileExists(resolvedInputFile).then(exists => {
      console.log("Input file " + (exists ? 'exists' : 'does not exist'));
    }).catch(error => {
      console.error('Failed to check the input file:', error);
    });

    const startIndex = options.start || 0;
    const limit = options.limit || Infinity;

    translateFile(resolvedInputFile, resolvedOutputFile, options.key as string, startIndex, limit);
  });

program
  .version("0.0.1")
  .description("Utility to allow .TRA conversion to key-value based .JSON")
  .option("-i --input <file>", "Input .tra file, the output file will append .json")
  .option("-d, --directory <directory>", "IWD2EE Source Directory")
  .parse(process.argv);

const options = program.opts();

if ("input" in options) {
  const resolvedInputFile = path.resolve(process.cwd(), <string> options.input);

  // Check that the file exists
  checkFileExists(resolvedInputFile).then(exists => {
    console.log("Input file " + (exists ? 'exists' : 'does not exist'));
  }).catch(error => {
    console.error('Failed to check the input file:', error);
  });

  parseTraFile(resolvedInputFile, resolvedInputFile + '.json');
}

if ("directory" in options) {
  const resolvedPath = path.resolve(process.cwd(), <string> options.directory);
  console.log("Source Path: " + resolvedPath);

  // Check for existing English directory
  checkTraDirExists(resolvedPath, "English").then(exists => {
    console.log("English " + (exists ? 'directory exists' : 'directory does not exist'));
  }).catch(error => {
    console.error('Failed to check the directory:', error);
  });

  // Check for existing Italian directory
  checkTraDirExists(resolvedPath, "Italian").then(exists => {
    console.log("Italian " + (exists ? 'directory exists' : 'directory does not exist'));
  }).catch(error => {
    console.error('Failed to check the directory:', error);
  });

  // Check for existing Russian directory
  checkTraDirExists(resolvedPath, "Russian").then(exists => {
    console.log("Russian " + (exists ? 'directory exists' : 'directory does not exist'));
  }).catch(error => {
    console.error('Failed to check the directory:', error);
  });

  const traLanguages = [ ['English', 'en'], ['Italian', 'it'], ['Russian', 'ru']];

  const traFiles = ['setup.tra', 'class_revisions.tra', 'loose_alignment.tra', 'spell_revise.tra', 'spell_focus.tra',
    'item_revisions.tra', 'creature_rebalancing.tra', 'faster_areas.tra', 'z_concoct_potions.tra', 'npc_core.tra',
    'revised_battle_square.tra', 'lua.tra', 'racial_enemies.tra', 'misc.tra', 'more_persuasion_options.tra',
    'new_strings_after_release.tra'];

  // Convert .tra files to .json
  traLanguages.forEach((language) => {
    traFiles.forEach((traFile) => {
      let encoding = 'utf-8';
      if(language[1] === 'ru') {
        encoding = 'win1251';
      }
      parseTraFile(path.join(resolvedPath, 'iwd2ee', 'tra', language[0], traFile), path.join(parentDir, 'l10n', language[1], traFile + '.json'), encoding);
    });
  });

}

async function checkTraDirExists(baseDir: string, language: string): Promise<boolean> {
  // Construct the full path in a platform-independent manner
  const fullPath = path.join(baseDir, 'iwd2ee', 'tra', language);

  try {
    await fs.promises.access(fullPath, fs.constants.F_OK);
    return true;
  } catch {
    return false;
  }
}

async function checkFileExists(file: string): Promise<boolean> {
  try {
    await fs.promises.access(file, fs.constants.F_OK);
    return true;
  } catch {
    return false;
  }
}

function parseInteger(value: string): number {
  const parsedValue = parseInt(value, 10);
  if (isNaN(parsedValue)) {
    throw new commander.InvalidOptionArgumentError('Limit must be a valid integer');
  }
  return parsedValue;
}