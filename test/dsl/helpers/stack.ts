// import { SignerWithAddress } from '@nomiclabs/hardhat-ethers/signers';
import { expect } from 'chai';
import { ethers } from 'hardhat';
import { Stack } from '../../../typechain-types';

describe('Stack', () => {
  let stack: Stack;
  // let first: SignerWithAddress;

  before(async () => {
    // [first] = await ethers.getSigners();
    stack = await (await ethers.getContractFactory('Stack')).deploy();
  });

  it('push & length & seeLast & pop & clear', async () => {
    // uint256
    await stack.push(1);
    expect(await stack.length()).to.equal(1);
    expect(await stack.seeLast()).to.equal(1);

    // pop
    await stack.push(8);
    await stack.push(9);
    expect(await stack.callStatic.pop()).to.equal(9);
    await stack.pop();
    expect(await stack.length()).to.equal(2);

    await stack.callStatic.pop();
    await stack.pop();
    expect(await stack.length()).to.equal(1);

    expect(await stack.callStatic.pop()).to.equal(1);
    await stack.pop();
    expect(await stack.length()).to.equal(0);

    // clear
    await stack.push(5);
    await stack.push(7);
    expect(await stack.length()).to.equal(2);
    await stack.clear();
    expect(await stack.length()).to.equal(0);
  });

  it('returns an error if tries to see an empty stack', async () => {
    await stack.push(1);
    await stack.pop();
    expect(await stack.length()).to.equal(0);
    expect(stack.seeLast()).to.be.revertedWith('STK4');
  });

  it('stack is not empty if pushed a zero value', async () => {
    await stack.push(0);
    expect(await stack.length()).to.equal(1);
    await stack.clear();
  });
});
