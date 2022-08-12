import { expect } from 'chai';
import { ethers } from 'hardhat';
import { parseUnits } from 'ethers/lib/utils';
import { BigNumber } from 'ethers';
import { StringUtilsMock } from '../../../typechain-types';

describe('StringUtils', () => {
  let app: StringUtilsMock;

  before(async () => {
    const stringLib = await (await ethers.getContractFactory('StringUtils')).deploy();
    app = await (
      await ethers.getContractFactory('StringUtilsMock', {
        libraries: { StringUtils: stringLib.address },
      })
    ).deploy();
  });

  it('char', async () => {
    expect(await app.char('abcdef', 0)).to.equal('a');
    expect(await app.char('abcdef', 5)).to.equal('f');
    await expect(app.char('abcdef', 6)).to.be.revertedWith('SUT1');
  });

  it('equal', async () => {
    expect(await app.equal('', '')).to.equal(true);
    expect(await app.equal('.', '.')).to.equal(true);
    expect(await app.equal('abcd', 'abcd')).to.equal(true);
    expect(await app.equal('abcde', 'abcdf')).to.equal(false);
  });

  it('length', async () => {
    expect(await app.length('')).to.equal(0);
    expect(await app.length(' ')).to.equal(1);
    expect(await app.length('hello')).to.equal(5);
  });

  it('concat', async () => {
    expect(await app.concat('', '')).to.equal('');
    expect(await app.concat('', 'a')).to.equal(await app.concat('a', ''));
    expect(await app.concat('a', 'b')).to.equal('ab');
    expect(await app.concat('123', 'abc')).to.equal('123abc');
  });

  it('fromHex', async () => {
    const [addrFull] = await ethers.getSigners();
    const addr = addrFull.address.substring(2);

    await expect(app.fromHex('1')).to.be.revertedWith('SUT2');
    expect(await app.fromHex('')).to.equal('0x');
    expect(await app.fromHex('01')).to.equal('0x01');
    expect(await app.fromHex('1234')).to.equal('0x1234');
    expect(await app.fromHex(addr)).to.equal(addrFull.address.toLowerCase());
  });

  it('toUint256', async () => {
    const num = '123456789012345678901234567890';
    // hex 0x29
    await expect(app.toUint256('/')).to.be.revertedWith('SUT3');
    // hex 0x3A
    await expect(app.toUint256(':')).to.be.revertedWith('SUT3');
    expect(await app.toUint256('')).to.equal('0');
    expect(await app.toUint256('0')).to.equal('0');
    expect(await app.toUint256('9')).to.equal('9');
    expect(await app.toUint256(num)).to.equal(num);
  });

  it('toString', async () => {
    const num = '123456789012345678901234567890';
    expect(await app.fromUint256toString(5)).to.equal('5');
    expect(await app.fromUint256toString(0)).to.equal('0');
    expect(await app.fromUint256toString(0xdfd9)).to.equal('57305');
    expect(await app.fromUint256toString(BigNumber.from(num))).to.equal(num);
  });

  it('fromHexChar', async () => {
    expect(await app.fromHexChar(Buffer.from('0'))).to.equal(0);
    expect(await app.fromHexChar(Buffer.from('1'))).to.equal(1);
    expect(await app.fromHexChar(Buffer.from('a'))).to.equal(10);
    expect(await app.fromHexChar(Buffer.from('f'))).to.equal(15);
    expect(await app.fromHexChar(Buffer.from('A'))).to.equal(10);
    expect(await app.fromHexChar(Buffer.from('F'))).to.equal(15);
    await expect(app.fromHexChar(Buffer.from('k'))).to.be.revertedWith('SUT8');
    await expect(app.fromHexChar(Buffer.from('Z'))).to.be.revertedWith('SUT8');
    await expect(app.fromHexChar(Buffer.from('K'))).to.be.revertedWith('SUT8');
  });

  it('getWei', async () => {
    expect(await app.getWei('1e18')).to.equal(parseUnits('1', 18));
    expect(await app.getWei('123e18')).to.equal(parseUnits('123', 18));
    expect(await app.getWei('1e36')).to.equal(parseUnits('1', 36));
    expect(await app.getWei('1000000000000000e18')).to.equal(parseUnits('1000000000000000', 18));
    expect(await app.getWei('146e10')).to.equal(parseUnits('146', 10));
    expect(await app.getWei('1000000000000000e10')).to.equal(parseUnits('1000000000000000', 10));
    expect(await app.getWei('123e0')).to.equal('123');
    expect(await app.getWei('1000000000000000e0')).to.equal('1000000000000000');
    await expect(app.getWei('10000000e00000000e18')).to.be.revertedWith('SUT5');
    await expect(app.getWei('10000000a18')).to.be.revertedWith('SUT5');
    await expect(app.getWei('10000000E18')).to.be.revertedWith('SUT5');
    await expect(app.getWei('45e')).to.be.revertedWith('SUT6');
    await expect(app.getWei('45eb6')).to.be.revertedWith('SUT5');
    await expect(app.getWei('45ee6')).to.be.revertedWith('SUT5');
    await expect(app.getWei('e18')).to.be.revertedWith('SUT4');
  });

  it('mayBeNumber', async () => {
    await expect(app.mayBeNumber('')).to.be.revertedWith('SUT7');
    expect(await app.mayBeNumber('}34')).to.be.equal(false);
    expect(await app.mayBeNumber('12345')).to.be.equal(true);
    expect(await app.mayBeNumber(' !')).to.be.equal(false);
    expect(await app.mayBeNumber('e')).to.be.equal(false);
    expect(await app.mayBeNumber('F543')).to.be.equal(false);
  });
});
