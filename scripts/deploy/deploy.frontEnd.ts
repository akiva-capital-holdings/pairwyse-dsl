import * as hre from 'hardhat';
import { agreementBytecodeAndLibs } from '../bytecodes/agreementBytecodeAndLibs';
import { deployContextDSL } from '../utils/deploy.utils';

const deployFrontEnd = async () => {
  await agreementBytecodeAndLibs();
  const dslContextAddr = await deployContextDSL(hre);
  console.log({ dslContextAddr });
};

deployFrontEnd();
