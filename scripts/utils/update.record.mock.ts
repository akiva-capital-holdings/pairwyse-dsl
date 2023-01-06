import { expect } from 'chai';
import * as hre from 'hardhat';

import { AgreementMock, ProgramContextMock } from '../../typechain-types';
import { ParserMock } from '../../typechain-types/dsl/mocks';
import { MultisigMock } from '../../typechain-types/agreement/mocks/MultisigMock';
import { Records } from '../../test/types';

export const activateRecord = async (
  _app: AgreementMock,
  _multisig: MultisigMock,
  _recordId: number
) => {
  const { data } = await _app.populateTransaction.activateRecord(_recordId);
  return _multisig.executeTransaction(_app.address, data as string, 0);
};

export const deactivateRecord = async (
  _app: AgreementMock,
  _multisig: MultisigMock,
  _recordId: number
) => {
  const { data } = await _app.populateTransaction.deactivateRecord(_recordId);
  return _multisig.executeTransaction(_app.address, data as string, 0);
};

export const archiveRecord = async (
  _app: AgreementMock,
  _multisig: MultisigMock,
  _recordId: number
) => {
  const { data } = await _app.populateTransaction.archiveRecord(_recordId);
  return _multisig.executeTransaction(_app.address, data as string, 0);
};

export const unarchiveRecord = async (
  _app: AgreementMock,
  _multisig: MultisigMock,
  _recordId: number
) => {
  const { data } = await _app.populateTransaction.unarchiveRecord(_recordId);
  return _multisig.executeTransaction(_app.address, data as string, 0);
};

export const setRecord = async (data: any, app: AgreementMock) => {
  const { recordId, requiredRecords, signatories, conditionStrings, transactionStr } = data;
  await app.update(recordId, requiredRecords, signatories, transactionStr, conditionStrings);
};

export const setRecords = async (records: Records[], app: AgreementMock) => {
  for (let i = 0; i < records.length; i++) {
    await setRecord(records[i], app);
  }
};

export const parse = async (app: AgreementMock, preprAddr: string) => {
  let parseFinished = await app.parseFinished();
  while (!parseFinished) {
    await app.parse(preprAddr);
    parseFinished = await app.parseFinished();
  }
};

export const setApp = async (ctx: ProgramContextMock, app: AgreementMock, sender: string) => {
  await ctx.setMsgSender(sender);
};
