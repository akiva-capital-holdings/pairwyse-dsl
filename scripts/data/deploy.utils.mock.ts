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

export const deployConditionalTxsMock = async (agreementAddress: string) => {
  // TODO: Deploy only ConditionalTxs without libraries
  const [
    comparisonOpcodesLibAddr,
    branchingOpcodesLibAddr,
    logicalOpcodesLibAddr,
    otherOpcodesLibAddr,
  ] = await deployOpcodeLibs();

  const executorLibAddr = await deployExecutor();
  const context = await (
    await ethers.getContractFactory('ContextMock', {
      libraries: {
        ComparisonOpcodes: comparisonOpcodesLibAddr,
        BranchingOpcodes: branchingOpcodesLibAddr,
        LogicalOpcodes: logicalOpcodesLibAddr,
        OtherOpcodes: otherOpcodesLibAddr,
        Executor: executorLibAddr,
      },
    })
  ).deploy();
  await context.setAppAddress(agreementAddress);

  return context.address;
};
