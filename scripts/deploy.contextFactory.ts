import * as hre from 'hardhat';

const { ethers } = hre;

async function deploy() {
  // Deploy ContextFactory
  const ContextFactory = await ethers.getContractFactory('ContextFactory');
  const contextFactory = await ContextFactory.deploy();
  await contextFactory.deployed();

  console.log(`\x1b[42m ContextFactory address \x1b[0m\x1b[32m ${contextFactory.address}\x1b[0m`);
}

deploy();
