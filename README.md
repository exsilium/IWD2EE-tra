# IWD2EE-tra
Icewind Dale II is a role-playing video game developed by Black Isle Studios and published by Interplay Entertainment. It was released in 2002.

[IWD2EE](https://github.com/RedChimera/IWD2EE) is a community lead Overhauld mod using [WeiDU](https://weidu.org/~thebigg/README-WeiDU.html) utilities that also includes the possibility to translate the game's text to other languages. WeiDU uses [TRA](https://weidu.org/~thebigg/README-WeiDU.html#sec17) translation files to manage text strings that get compiled to the Infinity Engine's [D](https://weidu.org/~thebigg/README-WeiDU.html#D)ialogue File Format.

Altough TRA files are simple key-value files that can be edited directly, it uses custom START/END (~) string notation that makes it challenging to use them with existing l10n frameworks and tooling.

This project aims to provide utility to:
1. Allow conversion of .TRA files to standard .JSON key-value based data structure;
2. A source for converted .JSON language files that can be further managed with a translation management system like [Mozilla Pontoon](https://github.com/mozilla/pontoon);
3. Allow conversion of .JSON files back to .TRA files so that the updated translations can be used in IWD2EE;

### Requirements
- Node.js v20+

### Bootstrapping l10n files
- Clone this repository and the IWD2EE repository to separate locations
- Build this project utility: `npm i; npm run build`
- Bootstrap l10n files from .TRA files in IWD2EE - `node dist/index.js -s <folder of IWD2EE>`. This will (re-)generate the location files to `l10n` directory.
- 