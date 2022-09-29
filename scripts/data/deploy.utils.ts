import '@nomiclabs/hardhat-ethers';
import * as hre from 'hardhat';

const { ethers } = hre;

export const deployOpcodeLibs = async () => {
  const opcodeHelpersLib = await (await ethers.getContractFactory('OpcodeHelpers')).deploy();
  const comparisonOpcodesLib = await (
    await ethers.getContractFactory('ComparisonOpcodes', {
      libraries: {
        OpcodeHelpers: opcodeHelpersLib.address,
      },
    })
  ).deploy();

  const branchingOpcodesLib = await (
    await ethers.getContractFactory('BranchingOpcodes', {
      libraries: {
        OpcodeHelpers: opcodeHelpersLib.address,
      },
    })
  ).deploy();

  const logicalOpcodesLib = await (
    await ethers.getContractFactory('LogicalOpcodes', {
      libraries: {
        OpcodeHelpers: opcodeHelpersLib.address,
      },
    })
  ).deploy();

  const otherOpcodesLib = await (
    await ethers.getContractFactory('OtherOpcodes', {
      libraries: {
        OpcodeHelpers: opcodeHelpersLib.address,
      },
    })
  ).deploy();
  return [
    comparisonOpcodesLib.address,
    branchingOpcodesLib.address,
    logicalOpcodesLib.address,
    otherOpcodesLib.address,
  ];
};

export const deployParser = async () => {
  // Deploy libraries
  const stringLib = await (await ethers.getContractFactory('StringUtils')).deploy();
  const byteLib = await (await ethers.getContractFactory('ByteUtils')).deploy();

  const parser = await (
    await ethers.getContractFactory('Parser', {
      libraries: { StringUtils: stringLib.address, ByteUtils: byteLib.address },
    })
  ).deploy();
  return parser.address;
};

export const deployExecutor = async () => {
  const executorLib = await (await ethers.getContractFactory('Executor')).deploy();
  return executorLib.address;
};

export const deployPreprocessor = async () => {
  const stringLib = await (await ethers.getContractFactory('StringUtils')).deploy();
  const preprocessor = await (
    await ethers.getContractFactory('Preprocessor', {
      libraries: { StringUtils: stringLib.address },
    })
  ).deploy();
  return preprocessor.address;
};

export const deployBase = async () => {
  const parserAddr = await deployParser();
  const executorLibAddr = await deployExecutor();
  const preprocessorAddr = await deployPreprocessor();

  return [parserAddr, executorLibAddr, preprocessorAddr];
};

export const deployAgreement = async (multisigAddr: string) => {
  const [
    comparisonOpcodesLibAddr,
    branchingOpcodesLibAddr,
    logicalOpcodesLibAddr,
    otherOpcodesLibAddr,
  ] = await deployOpcodeLibs();

  const [parserAddr, executorLibAddr] = await deployBase();

  const AgreementContract = await ethers.getContractFactory('Agreement', {
    libraries: {
      ComparisonOpcodes: comparisonOpcodesLibAddr,
      BranchingOpcodes: branchingOpcodesLibAddr,
      LogicalOpcodes: logicalOpcodesLibAddr,
      OtherOpcodes: otherOpcodesLibAddr,
      Executor: executorLibAddr,
    },
  });
  const agreement = await AgreementContract.deploy(parserAddr, multisigAddr);
  await agreement.deployed();

  return agreement.address;
};
