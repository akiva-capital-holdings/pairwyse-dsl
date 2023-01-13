import fs from 'fs';
import path from 'path';
import * as hre from 'hardhat';
import { checkOrCreateFolder } from '../../utils/utils';

async function main() {
  console.log(`Deploying from address ${(await hre.ethers.getSigners())[0].address}`);

  // Note: run this on the same node as Front End to actually deploy these libraries

  const tokenContract = await hre.ethers.getContractFactory('ERC20Mintable');
  const bytecodeFolder = path.join(__dirname, '../..', 'bytecode');

  checkOrCreateFolder(bytecodeFolder);
  fs.writeFileSync(path.join(bytecodeFolder, 'ERC20Mintable.bytecode'), tokenContract.bytecode);
}

main();
