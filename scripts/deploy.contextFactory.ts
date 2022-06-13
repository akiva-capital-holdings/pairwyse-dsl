import '@nomiclabs/hardhat-ethers';
import * as hre from 'hardhat';

const { ethers } = hre;

async function deploy() {
  // Deploy ContextFactory
  const factory = await (await ethers.getContractFactory('ContextFactory')).deploy();
  console.log('ContextFactory address:', factory.address);
}

deploy();
