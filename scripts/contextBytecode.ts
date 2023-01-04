import fs from 'fs';
import path from 'path';
import * as hre from 'hardhat';

async function main() {
  console.log(`Deploying from address ${(await hre.ethers.getSigners())[0].address}`);

  // Note: run this on the same node as Front End to actually deploy these libraries

  const contextContract = await hre.ethers.getContractFactory('Context');

  fs.writeFileSync(
    path.join(__dirname, '..', 'bytecodeFolder', 'context.bytecode'),
    contextContract.bytecode
  );
}

main();
