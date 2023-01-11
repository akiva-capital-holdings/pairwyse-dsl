import * as hre from 'hardhat';
import { deployContextDSL } from '../utils/deploy.utils';

export async function main() {
  console.log(`Deploying from address ${(await hre.ethers.getSigners())[0].address}`);
  const DSLcontextAddr = await deployContextDSL(hre);
  console.log(`\x1b[42m DSLcontext address \x1b[0m\x1b[32m ${DSLcontextAddr}\x1b[0m`);
}

main();
