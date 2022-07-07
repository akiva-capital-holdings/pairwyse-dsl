import * as hre from 'hardhat';

const { ethers } = hre;

async function deploy() {
  // Deploy ContextFactory
  const ContextFactory = await ethers.getContractFactory('ContextFactory');
  const contextFactory = await ContextFactory.deploy();
  await contextFactory.deployed();

  console.log('ContextFactory address:', contextFactory.address);
}

deploy();
