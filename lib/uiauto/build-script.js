import path from 'path';
import { fs } from 'appium-support';
import _ from 'lodash';


let rootDir = path.resolve(__dirname, '..', '..', '..', 'uiauto');
if (!__dirname.match(/build\/lib\/uiauto/)) {
  rootDir = path.resolve(__dirname, 'uiauto');
}

// this regex helps us get the file path of an import
const importRe = /^#import ('|")([^('|")]+)('|")$/mg;

async function getDepsForFile (file, filesExamined, extraImports = []) {
  // make sure we don't have a cycle in our dependencies
  if (_.includes(filesExamined, file)) {
    throw new Error(`Re-examining file ${file}; you need to make sure ` +
                    `the graph is set up so we do not require files twice`);
  }

  // save the file so we don't look at it again
  filesExamined.push(file);
  let data = await fs.readFile(file, 'utf8');
  let deps = {
    [file]: []
  };

  // check for import statements in the file, and make a list of them
  let imports = [];
  let match = importRe.exec(data);
  while (match) {
    if (match) {
      imports.push(match[2]);
    }
    match = importRe.exec(data);
  }
  // add in any extra imports sent in
  imports = extraImports.concat(imports);

  // go through all the imports for the file, and do the same process
  for (let importedFile of imports) {
    let importedPath = path.resolve(path.dirname(file), importedFile);
    // recursively get dependencies for imported files
    let importedDeps = await getDepsForFile(importedPath, filesExamined);
    deps[file].push(importedDeps);
  }

  return deps;
}

async function buildScriptFromDeps (deps) {
  let script = '';
  // go through all the dependencies and recursively
  // add them to our script string
  for (let [file, subDepsArray] of _.toPairs(deps)) {
    for (let subDeps of subDepsArray) {
      script += await buildScriptFromDeps(subDeps);
    }
    let fileContents = await fs.readFile(file, 'utf8');
    let newFileData = stripImports(fileContents);

    let fileWithoutRoot = file.replace(`${rootDir}/`, '');
    script += `\n/* begin file: ${fileWithoutRoot} */\n`;
    script += newFileData;
    script += `\n/* end file: ${fileWithoutRoot} */\n`;
  }
  return script;
}

function stripImports (data) {
  // get rid of the import statements from the string
  data = data.replace(importRe, '');
  data = data.trim();
  return data;
}

async function buildScript (entryPoint, extraImports = []) {
  // keep a list of files we examine for the purposes of making sure we're
  // not adding the same file to the collated version twice
  let filesExamined = [];

  let deps = await getDepsForFile(entryPoint, filesExamined, extraImports);
  let script =  await buildScriptFromDeps(deps);
  return script;
}

export default buildScript;
