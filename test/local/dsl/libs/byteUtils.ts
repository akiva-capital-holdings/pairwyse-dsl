import { expect } from 'chai';
import { ethers } from 'hardhat';
import { hex4Bytes } from '../../../utils/utils';

import { ByteUtilsMock } from '../../../../typechain-types';

describe('Byte Utils', () => {
  let app: ByteUtilsMock;
  const data = hex4Bytes('0x000000000111');

  before(async () => {
    const byteLib = await (await ethers.getContractFactory('ByteUtils')).deploy();
    app = await (
      await ethers.getContractFactory('ByteUtilsMock', {
        libraries: { ByteUtils: byteLib.address },
      })
    ).deploy();
  });

  it('should slice if start index are valid', async () => {
    expect(await app.slice(data, 1, 5)).to.equal('0xfbdd9200');
    expect(await app.slice(data, 0, 1)).to.equal('0xb9');
    expect(await app.slice(data, 5, 10)).to.equal('0x0000000000');
    expect(await app.slice(data, 2, 16)).to.equal('0xdd92000000000000000000000000');
    expect(await app.slice(data, 2, 32)).to.equal(
      '0xdd9200000000000000000000000000000000000000000000000000000000'
    );
  });

  it('returns error if start index is greater than the end index', async () => {
    const msg = 'BUT1';
    expect(app.slice(data, 5, 1)).to.be.revertedWith(msg);
    expect(app.slice(data, 0, 0)).to.be.revertedWith(msg);
    expect(app.slice(data, 32, 32)).to.be.revertedWith(msg);
  });

  it('returns error if end index greater than array length', async () => {
    const msg = 'BUT2';
    expect(app.slice(data, 4, 33)).to.be.revertedWith(msg);
    expect(app.slice(data, 23, 67)).to.be.revertedWith(msg);
    expect(app.slice(data, 0, 35)).to.be.revertedWith(msg);
  });

  it('fromHexChar', async () => {
    expect(await app.fromHexChar(Buffer.from('0'))).to.equal(0);
    expect(await app.fromHexChar(Buffer.from('1'))).to.equal(1);
    expect(await app.fromHexChar(Buffer.from('a'))).to.equal(10);
    expect(await app.fromHexChar(Buffer.from('f'))).to.equal(15);
    expect(await app.fromHexChar(Buffer.from('A'))).to.equal(10);
    expect(await app.fromHexChar(Buffer.from('F'))).to.equal(15);
    await expect(app.fromHexChar(Buffer.from('k'))).to.be.revertedWith('BUT3');
    await expect(app.fromHexChar(Buffer.from('Z'))).to.be.revertedWith('BUT3');
    await expect(app.fromHexChar(Buffer.from('K'))).to.be.revertedWith('BUT3');
  });
});
