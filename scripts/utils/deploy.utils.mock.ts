import '@nomiclabs/hardhat-ethers';
import { HardhatRuntimeEnvironment } from 'hardhat/types';
import { deployExecutor, deployOpcodeLibs, deployPreprocessor } from './deploy.utils';

export const deployParserMock = async (hre: HardhatRuntimeEnvironment) => {
  // Deploy libraries
  const byteLib = await (await hre.ethers.getContractFactory('ByteUtils')).deploy();
  const stringLib = await (
    await hre.ethers.getContractFactory('StringUtils', {
      libraries: { ByteUtils: byteLib.address },
    })
  ).deploy();

  const ParserMockContract = await hre.ethers.getContractFactory('ParserMock', {
    libraries: { StringUtils: stringLib.address, ByteUtils: byteLib.address },
  });
  const parser = await ParserMockContract.deploy();
  return parser.address;
};

export const deployBaseMock = async (hre: HardhatRuntimeEnvironment) => {
  const parserAddr = await deployParserMock(hre);
  const executorLibAddr = await deployExecutor(hre);
  const preprocessorAddr = await deployPreprocessor(hre);

  return [parserAddr, executorLibAddr, preprocessorAddr];
};

export const deployAgreementMock = async (hre: HardhatRuntimeEnvironment, multisigAddr: string) => {
  const [
    comparisonOpcodesLibAddr,
    branchingOpcodesLibAddr,
    logicalOpcodesLibAddr,
    otherOpcodesLibAddr,
  ] = await deployOpcodeLibs(hre);

  const contextDSL = await (
    await hre.ethers.getContractFactory('DSLContextMock')
  ).deploy(
    comparisonOpcodesLibAddr,
    branchingOpcodesLibAddr,
    logicalOpcodesLibAddr,
    otherOpcodesLibAddr
  );
  const [parserAddr, executorLibAddr, preprocessorAddr] = await deployBaseMock(hre);

  const AgreementContract = await hre.ethers.getContractFactory('AgreementMock', {
    libraries: { Executor: executorLibAddr },
  });
  const agreement = await AgreementContract.deploy(parserAddr, multisigAddr, contextDSL.address);
  await agreement.deployed();

  console.log(`\x1b[32m AgreementMock address \x1b[0m\x1b[32m ${agreement.address}\x1b[0m`);

  return [agreement.address, parserAddr, executorLibAddr, preprocessorAddr];
};
