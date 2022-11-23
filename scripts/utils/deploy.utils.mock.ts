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

  const [parserAddr, executorLibAddr] = await deployBaseMock(hre);

  const MockContract = await hre.ethers.getContractFactory('AgreementMock', {
    libraries: {
      ComparisonOpcodes: comparisonOpcodesLibAddr,
      BranchingOpcodes: branchingOpcodesLibAddr,
      LogicalOpcodes: logicalOpcodesLibAddr,
      OtherOpcodes: otherOpcodesLibAddr,
      Executor: executorLibAddr,
    },
  });
  const mock = await MockContract.deploy(parserAddr, multisigAddr);
  await mock.deployed();

  console.log(`\x1b[32m AgreementMock address \x1b[0m\x1b[32m ${mock.address}\x1b[0m`);

  return mock.address;
};
