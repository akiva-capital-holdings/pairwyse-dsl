import fs from 'fs';
import path from 'path';
import * as hre from 'hardhat';
import { deployBase } from '../utils/deploy.utils';
import { checkOrCreateFolder } from '../../utils/utils';

/**
 * Deploy libraries that are required by Agreement & generate Agreement bytecode with those
 * libraries
 */
export async function agreementBytecodeAndLibs() {
  console.log(`Deploying from address ${(await hre.ethers.getSigners())[0].address}`);
  // Note: run this on the same node as Front End to actually deploy these libraries

  const byteLib = await (await hre.ethers.getContractFactory('ByteUtils')).deploy();
  const stringUtilsLib = await (
    await hre.ethers.getContractFactory('StringUtils', {
      libraries: { ByteUtils: byteLib.address },
    })
  ).deploy();

  const [parserAddr, executorLibAddr, preprocessorAddr] = await deployBase(
    hre,
    stringUtilsLib.address
  );

  const AgreementContract = await hre.ethers.getContractFactory('Agreement', {
    libraries: {
      Executor: executorLibAddr,
    },
  });
  const bytecodeFolder = path.join(__dirname, '..', 'bytecode');

  console.log({
    parserAddr,
    preprocessorAddr,
  });

  checkOrCreateFolder(bytecodeFolder);
  fs.writeFileSync(path.join(bytecodeFolder, 'agreement.bytecode'), AgreementContract.bytecode);
}
