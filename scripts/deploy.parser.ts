import * as hre from 'hardhat';

const { ethers } = hre;

async function main() {
  // Deploy libraries
  const stringLib = await (await ethers.getContractFactory('StringUtils')).deploy();
  const byteLib = await (await ethers.getContractFactory('ByteUtils')).deploy();

  // Deploy Parser
  const Parser = await ethers.getContractFactory('Parser', {
    libraries: { StringUtils: stringLib.address, ByteUtils: byteLib.address },
  });
  const parser = await Parser.deploy();
  await parser.deployed();

  console.log(`\x1b[42m Parser address \x1b[0m\x1b[32m ${parser.address}\x1b[0m`);
}

main();
