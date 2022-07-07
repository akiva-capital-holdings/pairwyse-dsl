import * as hre from 'hardhat';

const { ethers } = hre;

async function main() {
  const resp = await hre.run('compile');

  const Greeter = await hre.ethers.getContractFactory('Greeter');
  const greeter = await Greeter.deploy('Hello, Hardhat!');
  await greeter.deployed();
}

main();
