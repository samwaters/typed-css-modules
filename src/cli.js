#!/usr/bin/env node

'use strict';

import path from 'path';
import chokidar from 'chokidar';
import glob from 'glob';
import yargs from 'yargs';
import chalk from 'chalk';
import {DtsCreator} from './dtsCreator';

let yarg = yargs.usage('Create .css.d.ts from CSS modules *.css files.\nUsage: $0 [options] <input directory>')
  .example('$0 src/styles')
  .example('$0 src -o dist')
  .example('$0 -p styles/**/*.icss -w')
  .detectLocale(false)
  .demand(['_'])
  .alias('c', 'camelCase').describe('c', 'Convert CSS class tokens to camelcase')
  .alias('o', 'outDir').describe('o', 'Output directory')
  .alias('p', 'pattern').describe('p', 'Glob pattern with css files')
  .alias('w', 'watch').describe('w', 'Watch input directory\'s css files or pattern').boolean('w')
  .alias('d', 'dropExtension').describe('d', 'Drop the input files extension').boolean('d')
  .alias('s', 'useSpaces').describe('s', 'Use spaces rather than tabs for indents').boolean('s')
  .alias('n', 'noSemicolons').describe('n', 'Don\'t add semicolons to generated lines').boolean('n')
  .alias('v', 'verbose').describe('v', 'Verbose mode').boolean('v')
  .alias('h', 'help').help('h')
  .version(() => require('../package.json').version)
let argv = yarg.argv;
let creator;

function writeFile(f) {
  creator.create(f, null, !!argv.w)
  .then(content => content.writeFile())
  .then(content => {
    console.log('Wrote ' + chalk.green(content.outputFilePath));
    if(argv.v) {
      content.messageList.forEach(message => {
        console.warn(chalk.yellow('[Warn] ' + message));
      });
    }
  })
  .catch(reason => console.error(chalk.red('[Error] ' + reason)));
};

let main = () => {
  let rootDir, searchDir;
  if(argv.h) {
    yarg.showHelp();
    return;
  }

  if(argv._ && argv._[0]) {
    searchDir = argv._[0];
  }else if(argv.p) {
    searchDir = './';
  }else{
    yarg.showHelp();
    return;
  }
  let filesPattern = path.join(searchDir, argv.p || '**/*.css');
  rootDir = process.cwd();
  creator = new DtsCreator({
    rootDir,
    searchDir,
    outDir: argv.o,
    camelCase: argv.c,
    dropExtension: argv.d,
    useSpaces: argv.s,
    noSemicolons: argv.n
  });

  if(!argv.w) {
    glob(filesPattern, null, (err, files) => {
      if(err) {
        console.error(err);
        return;
      }
      if(!files || !files.length) return;
      files.forEach(writeFile);
    });
  } else {
    console.log('Watch ' + filesPattern + '...');

    var watcher = chokidar.watch(filesPattern);
    watcher.on('add', writeFile);
    watcher.on('change', writeFile);
  }
};

main();
