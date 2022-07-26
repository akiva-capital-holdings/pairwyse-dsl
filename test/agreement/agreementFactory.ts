import { expect } from 'chai';
import { ethers } from 'hardhat';
import { AgreementFactoryMock } from '../../typechain-types/agreement/mocks/AgreementFactoryMock';

describe('AgreementFactory', () => {
  let factory: AgreementFactoryMock;

  beforeEach(async () => {
    // Deploy libraries
    const opcodeHelpersLib = await (await ethers.getContractFactory('OpcodeHelpers')).deploy();
    const executorLib = await (await ethers.getContractFactory('Executor')).deploy();
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

    // Deploy AgreementFactory
    factory = await (
      await ethers.getContractFactory('AgreementFactoryMock', {
        libraries: {
          ComparatorOpcodes: comparatorOpcodesLib.address,
          LogicalOpcodes: logicalOpcodesLib.address,
          SetOpcodes: setOpcodesLib.address,
          OtherOpcodes: otherOpcodesLib.address,
          Executor: executorLib.address,
        },
      })
    ).deploy();
  });

  it('deploy agreement', async () => {
    const returnedAddr = await factory.callStatic.deployAgreement(ethers.constants.AddressZero);
    await factory.deployAgreement(ethers.constants.AddressZero);
    const events = await factory.queryFilter(factory.filters.NewAgreement());
    const eventAddr = events[0].args.agreement;
    expect(returnedAddr).to.equal(eventAddr);
  });

  it('deployed length', async () => {
    await factory.deployAgreement(ethers.constants.AddressZero);
    expect(await factory.getDeployedAgreementsLen()).to.equal(1);
    await factory.deployAgreement(ethers.constants.AddressZero);
    expect(await factory.getDeployedAgreementsLen()).to.equal(2);
    await factory.deployAgreement(ethers.constants.AddressZero);
    expect(await factory.getDeployedAgreementsLen()).to.equal(3);
  });
});
