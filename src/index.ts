import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';
import figlet from 'figlet';
import { Command } from '@commander-js/extra-typings';
import { parseTraFile } from './tra.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const parentDir = path.dirname(__dirname);
const program = new Command();

console.log(figlet.textSync("IWD2EE-tra"));
console.log("IWD2EE Translation tool\n");

program
  .command("init", { isDefault: true })
  .description("default command, inits json translation files.")
  .action((source, destination) => {});

program
  .version("0.0.1")
  .description("Utility to Allow .TRA conversion to key-value based .JSON")
  .option("-s, --source <directory>", "IWD2EE Source Directory")
  .parse(process.argv);

const options = program.opts();

if ("source" in options) {
  const resolvedPath = path.resolve(process.cwd(), <string> options.source);
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