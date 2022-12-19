import { expect } from 'chai';
import * as hre from 'hardhat';
import { Array } from '../../typechain-types';

const { ethers, network } = hre;

describe.only('Array', () => {
  let array: Array;
  let snapshotId: number;

  before(async () => {
    array = await (await ethers.getContractFactory('Array')).deploy();
  });

  beforeEach(async () => {
    snapshotId = await network.provider.send('evm_snapshot');
  });

  afterEach(async () => {
    await network.provider.send('evm_revert', [snapshotId]);
  });

  describe('set array head', () => {
    it('success', async () => {
      const isArray = true;
      const elemsType = 1; // type: number
      const nextPrt = '0x12345678';
      await array.setStorage('NUMBERS', isArray, elemsType, nextPrt);
      const [isArrayReal, elemsTypeReal, nextPrtReal] = await array.getStorage('NUMBERS');

      expect(isArrayReal).equal(isArray);
      expect(elemsTypeReal).equal(elemsType);
      expect(nextPrtReal).equal(nextPrt);
    });
  });
});
