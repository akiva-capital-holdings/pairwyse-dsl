import { expect } from 'chai';
import { ethers } from 'hardhat';
import { ContextFactory as ContextFactoryType } from '../../typechain-types';

describe('ContextFactory', () => {
  let factory: ContextFactoryType;

  beforeEach(async () => {
    // Deploy ContextFactory
    factory = await (await ethers.getContractFactory('ContextFactory')).deploy();
  });

  it('deploy context', async () => {
    const returnedAddr = await factory.callStatic.deployContext();
    await factory.deployContext();
    const events = await factory.queryFilter(factory.filters.NewContext());
    const eventAddr = events[0].args.context;
    expect(returnedAddr).to.equal(eventAddr);
  });

  it('deployed length', async () => {
    await factory.deployContext();
    expect(await factory.getDeployedContextsLen()).to.equal(1);
    await factory.deployContext();
    expect(await factory.getDeployedContextsLen()).to.equal(2);
    await factory.deployContext();
    expect(await factory.getDeployedContextsLen()).to.equal(3);
  });
});
