import { SignerWithAddress } from '@nomiclabs/hardhat-ethers/signers';
import { expect } from 'chai';
import { ethers } from 'hardhat';
import { StackType } from '../../../src/interfaces';
import { StackValue } from '../../../typechain-types';

describe('StackValue', () => {
  let stackValue: StackValue;
  let first: SignerWithAddress;

  before(async () => {
    [first] = await ethers.getSigners();
  });

  beforeEach(async () => {
    stackValue = (await (await ethers.getContractFactory('StackValue')).deploy()) as StackValue;
  });

  it('get/set Uint256', async () => {
    await stackValue.setUint256(100);
    expect(await stackValue.getUint256()).to.equal(100);
    expect(await stackValue.getType()).to.equal(StackType.UINT256);
    await expect(stackValue.getString()).to.be.revertedWith('STK2');
    await expect(stackValue.getAddress()).to.be.revertedWith('STK3');
  });

  it('get/set string', async () => {
    await stackValue.setString('hey');
    expect(await stackValue.getString()).to.equal('hey');
    expect(await stackValue.getType()).to.equal(StackType.STRING);
    await expect(stackValue.getUint256()).to.be.revertedWith('STK1');
    await expect(stackValue.getAddress()).to.be.revertedWith('STK3');
  });

  it('get/set address', async () => {
    await stackValue.setAddress(first.address);
    expect(await stackValue.getAddress()).to.equal(first.address);
    expect(await stackValue.getType()).to.equal(StackType.ADDRESS);
    await expect(stackValue.getUint256()).to.be.revertedWith('STK1');
    await expect(stackValue.getString()).to.be.revertedWith('STK2');
  });
});
