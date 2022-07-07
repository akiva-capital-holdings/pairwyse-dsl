// import '@nomiclabs/hardhat-ethers';
import * as hre from 'hardhat';

const { ethers } = hre;

async function main() {
  // Deploy libraries
  const stringLib = await (await ethers.getContractFactory('StringUtils')).deploy();
  const byteLib = await (await ethers.getContractFactory('ByteUtils')).deploy();

  console.log({
    stringLibAddr: stringLib.address,
    byteLibAddr: byteLib.address,
  });

  // Deploy Parser
  // const parser = await (
  const Parser = await ethers.getContractFactory('Parser', {
    libraries: { StringUtils: stringLib.address, ByteUtils: byteLib.address },
  });
  // ).deploy();
  const parser = await Parser.deploy();
  await parser.deployed();

  console.log('Parser address:', parser.address);
}

main();
