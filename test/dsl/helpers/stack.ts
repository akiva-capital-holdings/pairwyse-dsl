import { SignerWithAddress } from '@nomiclabs/hardhat-ethers/signers';
import { expect } from 'chai';
import { ethers } from 'hardhat';
import { Stack, StackValue__factory } from '../../../typechain';

describe('Stack', () => {
  let stack: Stack;
  let StackValueCont: StackValue__factory;
  let first: SignerWithAddress;

  before(async () => {
    [first] = await ethers.getSigners();
    stack = await (await ethers.getContractFactory('Stack')).deploy();
    StackValueCont = await ethers.getContractFactory('StackValue');
  });

  it('push & length & seeLast & pop & clear', async () => {
    // uint256
    const svUint256 = await StackValueCont.deploy();
    await stack.push(svUint256.address);
    await svUint256.setUint256(1);
    expect(await stack.length()).to.equal(1);
    expect(await stack.seeLast()).to.equal(svUint256.address);
    expect(await svUint256.getUint256()).to.equal(1);

    // string
    const svString = await StackValueCont.deploy();
    await stack.push(svString.address);
    await svString.setString('hey');
    expect(await stack.length()).to.equal(2);
    expect(await stack.seeLast()).to.equal(svString.address);
    expect(await svString.getString()).to.equal('hey');

    // address
    const svAddress = await StackValueCont.deploy();
    await stack.push(svAddress.address);
    await svAddress.setAddress(first.address);
    expect(await stack.length()).to.equal(3);
    expect(await stack.seeLast()).to.equal(svAddress.address);
    expect(await svAddress.getAddress()).to.equal(first.address);

    // pop
    let sv = await stack.callStatic.pop();
    expect(sv).to.equal(svAddress.address);
    expect(await svAddress.getAddress()).to.equal(first.address);
    await stack.pop();
    expect(await stack.length()).to.equal(2);

    sv = await stack.callStatic.pop();
    expect(sv).to.equal(svString.address);
    expect(await svString.getString()).to.equal('hey');
    await stack.pop();
    expect(await stack.length()).to.equal(1);

    sv = await stack.callStatic.pop();
    expect(sv).to.equal(svUint256.address);
    expect(await svUint256.getUint256()).to.equal(1);
    await stack.pop();
    expect(await stack.length()).to.equal(0);

    // clear
    await stack.push((await StackValueCont.deploy()).address);
    await stack.push((await StackValueCont.deploy()).address);
    expect(await stack.length()).to.equal(2);
    await stack.clear();
    expect(await stack.length()).to.equal(0);
  });
});