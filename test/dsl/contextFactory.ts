import { expect } from 'chai';
import { ethers, network } from 'hardhat';
import { ContextFactory } from '../../typechain-types';

describe('ContextFactory', () => {
  let factory: ContextFactory;
  let snapshotId: number;

  const agreementAddr = '0xc5a5C42992dECbae36851359345FE25997F5C42d'; // just example

  before(async () => {
    // Deploy ContextFactory
    factory = await (await ethers.getContractFactory('ContextFactory')).deploy();
    snapshotId = await network.provider.send('evm_snapshot');
  });

  afterEach(async () => {
    await network.provider.send('evm_revert', [snapshotId]);
  });

  it('deploy context', async () => {
    const returnedAddr = await factory.callStatic.deployContext(agreementAddr);
    await factory.deployContext(agreementAddr);
    const events = await factory.queryFilter(factory.filters.NewContext());
    const eventAddr = events[0].args.context;
    expect(returnedAddr).to.equal(eventAddr);
  });

  it('deployed length', async () => {
    await factory.deployContext(agreementAddr);
    expect(await factory.getDeployedContextsLen()).to.equal(1);
    await factory.deployContext(agreementAddr);
    expect(await factory.getDeployedContextsLen()).to.equal(2);
    await factory.deployContext(agreementAddr);
    expect(await factory.getDeployedContextsLen()).to.equal(3);
  });
});
