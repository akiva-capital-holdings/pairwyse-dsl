import '@nomiclabs/hardhat-ethers';
import * as hre from 'hardhat';
import { deployExecutor, deployOpcodeLibs, deployPreprocessor } from './deploy.utils';

const { ethers } = hre;

export const deployParserMock = async () => {
  // Deploy libraries
  const stringLib = await (await ethers.getContractFactory('StringUtils')).deploy();
  const byteLib = await (await ethers.getContractFactory('ByteUtils')).deploy();

  const ParserMockContract = await ethers.getContractFactory('ParserMock', {
    libraries: { StringUtils: stringLib.address, ByteUtils: byteLib.address },
  });
  const parser = await ParserMockContract.deploy();
  return parser.address;
};

export const deployBaseMock = async () => {
  const parserAddr = await deployParserMock();
  const executorLibAddr = await deployExecutor();
  const preprocessorAddr = await deployPreprocessor();

  return [parserAddr, executorLibAddr, preprocessorAddr];
};

export const deployAgreementMock = async () => {
  const [
    comparisonOpcodesLibAddr,
    branchingOpcodesLibAddr,
    logicalOpcodesLibAddr,
    otherOpcodesLibAddr,
  ] = await deployOpcodeLibs();

  const [parserAddr, executorLibAddr] = await deployBaseMock();

  const MockContract = await ethers.getContractFactory('AgreementMock', {
    libraries: {
      ComparisonOpcodes: comparisonOpcodesLibAddr,
      BranchingOpcodes: branchingOpcodesLibAddr,
      LogicalOpcodes: logicalOpcodesLibAddr,
      OtherOpcodes: otherOpcodesLibAddr,
      Executor: executorLibAddr,
    },
  });
  const mock = await MockContract.deploy(parserAddr);
  await mock.deployed();

  console.log(`\x1b[32m AgreementMock address \x1b[0m\x1b[32m ${mock.address}\x1b[0m`);

  return mock.address;
};
