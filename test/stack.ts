import { expect } from 'chai';
import { ethers } from 'hardhat';
import { StackType } from '../src/interfaces';
import { StackValue } from '../typechain';

describe('Stack', () => {
  let stackValue: StackValue;

  beforeEach(async () => {
    const StackValueCont = await ethers.getContractFactory('StackValue');
    stackValue = await StackValueCont.deploy();
  });

  describe('ArgType', () => {
    it('Uint256', async () => {
      await stackValue.setUint256(100);
      expect(await stackValue.getType()).to.equal(StackType.UINT256);
    });
  });

  describe('Uint256', () => {
    it('get/set Uint256', async () => {
      await stackValue.setUint256(100);
      expect(await stackValue.getUint256()).to.equal(100);
    });
  });
});
