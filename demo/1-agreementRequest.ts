import { ethers } from 'hardhat';

const REACT_APP_PARSER = '0x2777a314be30dfc80794565f37f292955029ce13';

const createAgreement = async () => {
  const [deployer] = await ethers.getSigners();

  // Deploy libraries
  const opcodeHelpersLib = await (await ethers.getContractFactory('OpcodeHelpers')).deploy();
  const comparatorOpcodesLib = await (
    await ethers.getContractFactory('ComparatorOpcodes', {
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
  const setOpcodesLib = await (
    await ethers.getContractFactory('SetOpcodes', {
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
  const executorLib = await (await ethers.getContractFactory('Executor')).deploy();

  // Deploy AgreementFactory
  const factory = await (
    await ethers.getContractFactory('AgreementFactory', {
      libraries: {
        ComparatorOpcodes: comparatorOpcodesLib.address,
        LogicalOpcodes: logicalOpcodesLib.address,
        SetOpcodes: setOpcodesLib.address,
        OtherOpcodes: otherOpcodesLib.address,
        Executor: executorLib.address,
      },
    })
  ).deploy();

  const tx = await factory.connect(deployer).deployAgreement(REACT_APP_PARSER);
  console.log({ tx });

  const agrLen = parseInt((await factory.getDeployedAgreementsLen()).toString(), 10);
  console.log({ agrLen });

  const lastAgrAddr = await factory.deployedAgreements(agrLen - 1);
  console.log({ lastAgrAddr });
};

createAgreement();
