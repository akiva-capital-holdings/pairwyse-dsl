import fs from 'fs';
import path from 'path';
import { HardhatRuntimeEnvironment } from 'hardhat/types';
import { getChainId, getPrettyDateTime } from '../../utils/utils';

export const deployOpcodeLibs = async (hre: HardhatRuntimeEnvironment) => {
  const opcodeHelpersLib = await (await hre.ethers.getContractFactory('OpcodeHelpers')).deploy();
  const comparisonOpcodesLib = await (
    await hre.ethers.getContractFactory('ComparisonOpcodes', {
      libraries: {
        OpcodeHelpers: opcodeHelpersLib.address,
      },
    })
  ).deploy();

  const branchingOpcodesLib = await (
    await hre.ethers.getContractFactory('BranchingOpcodes', {
      libraries: {
        OpcodeHelpers: opcodeHelpersLib.address,
      },
    })
  ).deploy();

  const logicalOpcodesLib = await (
    await hre.ethers.getContractFactory('LogicalOpcodes', {
      libraries: {
        OpcodeHelpers: opcodeHelpersLib.address,
      },
    })
  ).deploy();

  const otherOpcodesLib = await (
    await hre.ethers.getContractFactory('OtherOpcodes', {
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

export const deployContextFactory = async (hre: HardhatRuntimeEnvironment) => {
  const ContextFactory = await hre.ethers.getContractFactory('ContextFactory');
  const contextFactory = await ContextFactory.deploy();
  await contextFactory.deployed();
  return contextFactory.address;
};

export const deployParser = async (hre: HardhatRuntimeEnvironment) => {
  // Deploy libraries
  const stringLib = await (await hre.ethers.getContractFactory('StringUtils')).deploy();
  const byteLib = await (await hre.ethers.getContractFactory('ByteUtils')).deploy();

  const parser = await (
    await hre.ethers.getContractFactory('Parser', {
      libraries: { StringUtils: stringLib.address, ByteUtils: byteLib.address },
    })
  ).deploy();
  return parser.address;
};

export const deployPreprocessor = async (hre: HardhatRuntimeEnvironment) => {
  const stringLib = await (await hre.ethers.getContractFactory('StringUtils')).deploy();
  const preprocessor = await (
    await hre.ethers.getContractFactory('Preprocessor', {
      libraries: { StringUtils: stringLib.address },
    })
  ).deploy();
  return preprocessor.address;
};

export const deployExecutor = async (hre: HardhatRuntimeEnvironment) => {
  const executorLib = await (await hre.ethers.getContractFactory('Executor')).deploy();
  return executorLib.address;
};

export const deployBase = async (hre: HardhatRuntimeEnvironment) => {
  const parserAddr = await deployParser(hre);
  const executorLibAddr = await deployExecutor(hre);
  const preprocessorAddr = await deployPreprocessor(hre);

  return [parserAddr, executorLibAddr, preprocessorAddr];
};

export const deployAgreement = async (hre: HardhatRuntimeEnvironment, multisigAddr: string) => {
  const [
    comparisonOpcodesLibAddr,
    branchingOpcodesLibAddr,
    logicalOpcodesLibAddr,
    otherOpcodesLibAddr,
  ] = await deployOpcodeLibs(hre);

  const [parserAddr, executorLibAddr] = await deployBase(hre);

  const AgreementContract = await hre.ethers.getContractFactory('Agreement', {
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

  // Save Agreement bytecode into a file
  const toFile = {
    date: getPrettyDateTime(),
    chainId: await getChainId(hre),
    bytecode: AgreementContract.bytecode,
  };

  const outputDir = path.join(__dirname, '..', '..', 'output');
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir);
  }
  fs.writeFileSync(
    path.join(outputDir, `agreement.${hre.network.name}.json`),
    JSON.stringify(toFile, null, 2)
  );

  return agreement.address;
};
