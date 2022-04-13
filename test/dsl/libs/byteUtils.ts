import { expect } from 'chai';
import { ethers } from 'hardhat';
import { hex4Bytes } from '../../utils/utils';

import { ByteUtilsMock } from '../../../typechain';

describe('byteUtils', () => {
  let app: ByteUtilsMock;
  let data = hex4Bytes('0x000000000111'); // 0xb9fbdd9200000000000000000000000000000000000000000000000000000000

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
    expect(await app.slice(data, 2, 32)).to.equal('0xdd9200000000000000000000000000000000000000000000000000000000');
  });

  it('returns error if start index is greater than the end index', async () => {
    expect(app.slice(data, 5, 1)).to.be.revertedWith('ByteUtils: \'end\' index must be greater than \'start\'');
    expect(app.slice(data, 0, 0)).to.be.revertedWith('ByteUtils: \'end\' index must be greater than \'start\'');
    expect(app.slice(data, 32, 32)).to.be.revertedWith('ByteUtils: \'end\' index must be greater than \'start\'');
  });

  it('returns error if end index greater than array length', async () => {
    expect(app.slice(data, 4, 33)).to.be.revertedWith('ByteUtils: \'end\' is greater than the length of the array');
    expect(app.slice(data, 23, 67)).to.be.revertedWith('ByteUtils: \'end\' is greater than the length of the array');
    expect(app.slice(data, 0, 35)).to.be.revertedWith('ByteUtils: \'end\' is greater than the length of the array');
  });
});
