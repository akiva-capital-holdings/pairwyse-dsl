import { expect } from 'chai';
import { ethers } from 'hardhat';
import { UnstructuredStorageMock } from '../../../typechain-types';
import { hex4Bytes } from '../../utils/utils';

describe('Unstructured Storage', () => {
  let storage: UnstructuredStorageMock;

  before(async () => {
    storage = await (await ethers.getContractFactory('UnstructuredStorageMock')).deploy();
  });

  it('setStorageWithType', async () => {
    const dataType = 1;
    const data = '0x1230000000000000000000000000000000000000000000000000000000000012';
    await storage.setStorageWithType(hex4Bytes('VAR'), dataType, data);
    const res = await storage.getStorageWithType(hex4Bytes('VAR'));

    // get first 32 bytes and parse as a number
    expect(parseInt(res.slice(0, 66), 16)).equal(dataType);
    // get second 32 bytes and prepend '0x' to compare with hex data
    expect(`0x${res.slice(66, 130)}`).equal(data);
  });
});
