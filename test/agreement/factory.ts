import { expect } from 'chai';
import { ethers } from 'hardhat';
import { AgreementFactory } from '../../typechain-types';

describe.skip('Agreement Factory', () => {
  let factory: AgreementFactory;

  beforeEach(async () => {
    // Deploy AgreementFactory
    factory = await (await ethers.getContractFactory('AgreementFactoryMock')).deploy();
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
