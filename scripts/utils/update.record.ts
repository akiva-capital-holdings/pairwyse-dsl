import { expect } from 'chai';
import * as hre from 'hardhat';

import { Agreement } from '../../typechain-types';
import { MultisigMock } from '../../typechain-types/agreement/mocks/MultisigMock';

const executeTransaction = async (_appAddr: string, _multisig: MultisigMock, _data: string) => {
  await _multisig.executeTransaction(_appAddr, _data, 0);
};

export const activateRecord = async (
  _app: Agreement,
  _multisig: MultisigMock,
  _recordId: number
) => {
  const { data } = await _app.populateTransaction.activateRecord(_recordId);
  return await executeTransaction(_app.address, _multisig, data as string);
};

export const parse = async (app: Agreement, preprAddr: string) => {
  let parseFinished = await app.parseFinished();
  while (!parseFinished) {
    await app.parse(preprAddr);
    parseFinished = await app.parseFinished();
  }
};
