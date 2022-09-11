import { deployPreprocessor } from './data/deploy.utils';

async function main() {
  const preprocAddr = await deployPreprocessor();
  console.log(`\x1b[42m Preprocessor address \x1b[0m\x1b[32m ${preprocAddr}\x1b[0m`);
}

main();
