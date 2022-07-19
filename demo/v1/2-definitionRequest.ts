import { SignerWithAddress } from '@nomiclabs/hardhat-ethers/signers';
import { expect } from 'chai';
import { ethers } from 'hardhat';
import { hex4Bytes } from '../test/utils/utils';

// TODO: update `agreementAddr`
const agreementAddr = '0xC2bEf244bf5B15Fa2cCEE0cFCb31C7144D0E642c';

const defineVariable = async (_varName: string, _varValue: string, deployer: SignerWithAddress) => {
  const definition = _varName;
  const specification = _varValue;

  console.log({
    agreementAddr,
    definition,
    specification,
  });

  const agreement = await ethers.getContractAt('Agreement', agreementAddr);
  const txsAddr = await agreement.txs();
  console.log({ txsAddr });

  const txs = await ethers.getContractAt('ConditionalTxs', txsAddr);
  const tx = await txs.connect(deployer).setStorageAddress(hex4Bytes(definition), specification);
  console.log({ tx });
  // Check that the variable was set
  const value = await txs.getStorageAddress(hex4Bytes(definition));
  expect(value).to.equal(_varValue);
};

(async () => {
  const [deployer, , bob] = await ethers.getSigners();
  // Set variables
  await defineVariable('RECEIVER', bob.address, deployer);
})();
