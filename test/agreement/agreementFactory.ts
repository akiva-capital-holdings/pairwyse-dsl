import { expect } from 'chai';
import { ethers } from 'hardhat';
import { AgreementFactoryMock } from '../../typechain-types/agreement/mocks/AgreementFactoryMock';
import { deployOpcodeLibs } from '../../scripts/data/deploy.utils';

describe('AgreementFactory', () => {
  let factory: AgreementFactoryMock;

  beforeEach(async () => {
    // Deploy libraries
    let comparisonOpcodesLibAddr;
    let branchingOpcodesLibAddr;
    let logicalOpcodesLibAddr;
    let otherOpcodesLibAddr;

    [
      comparisonOpcodesLibAddr,
      branchingOpcodesLibAddr,
      logicalOpcodesLibAddr,
      otherOpcodesLibAddr,
    ] = await deployOpcodeLibs();
    const executorLib = await (await ethers.getContractFactory('Executor')).deploy();

    // Deploy AgreementFactory
    factory = await (
      await ethers.getContractFactory('AgreementFactoryMock', {
        libraries: {
          ComparisonOpcodes: comparisonOpcodesLibAddr,
          BranchingOpcodes: branchingOpcodesLibAddr,
          LogicalOpcodes: logicalOpcodesLibAddr,
          OtherOpcodes: otherOpcodesLibAddr,
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
