import { expect } from 'chai';
import { ethers } from 'hardhat';
import { AgreementFactoryMock } from '../../typechain-types/agreement/mocks/AgreementFactoryMock';
import { deployAgreementFactory } from '../../scripts/data/deploy.utils';

describe('AgreementFactory', () => {
  let factory: AgreementFactoryMock;

  beforeEach(async () => {
    // Deploy AgreementFactory
    const factoryAddr = await deployAgreementFactory();
    factory = await ethers.getContractAt('AgreementFactoryMock', factoryAddr);
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
