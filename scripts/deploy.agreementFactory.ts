import '@nomiclabs/hardhat-ethers';
import * as hre from 'hardhat';

const { ethers } = hre;

async function deploy() {
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
  console.log(`\x1b[42m AgreementFactory address \x1b[0m\x1b[32m ${factory.address}\x1b[0m`);
}

deploy();
