import '@nomiclabs/hardhat-ethers';
import * as hre from 'hardhat';

const { ethers } = hre;

async function deployParser() {
  // Deploy libraries
  const stringLib = await (await ethers.getContractFactory('StringUtils')).deploy();
  const byteLib = await (await ethers.getContractFactory('ByteUtils')).deploy();

  // Deploy Parser
  const parser = await (
    await ethers.getContractFactory('Parser', {
      libraries: { StringUtils: stringLib.address, ByteUtils: byteLib.address },
    })
  ).deploy();
  console.log('Parser address:', parser.address);
}

deployParser();
