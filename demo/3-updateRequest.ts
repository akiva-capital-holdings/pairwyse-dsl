import { SignerWithAddress } from '@nomiclabs/hardhat-ethers/signers';
import { ethers } from 'hardhat';
import { TxObject } from '../test/types';
import { Agreement, ContextFactory } from '../typechain';

// TODO: update `agreementAddr`
const agreementAddr = '0xC2bEf244bf5B15Fa2cCEE0cFCb31C7144D0E642c';
const txId = 1;
const REACT_APP_CONTEXT_FACTORY = '0xD6E2E9999e6Edcc13040E6f84ee5DF9748d9C2b8';

const addSteps = async (
  agreementContract: Agreement,
  contextFactory: ContextFactory,
  steps: TxObject[],
  deployer: SignerWithAddress
) => {
  console.log('`addSteps` function call');

  for await (const step of steps) {
    console.log(`\n---\n\n🧩 Adding Term #${step.txId} to Agreement`);
    await contextFactory.connect(deployer).deployContext();
    let contextsLen = parseInt((await contextFactory.getDeployedContextsLen()).toString(), 10);
    console.log({ contextsLen });
    const transactionContextAddr = await contextFactory.deployedContexts(contextsLen - 1);
    console.log({ transactionContextAddr });
    const conditionsContextAddrs = [];

    console.log('\nTerm Conditions');

    for (let j = 0; j < step.conditions.length; j++) {
      console.log({ j });
      const deployCtxTx = await contextFactory.connect(deployer).deployContext();
      console.log({ deployCtxTx });
      contextsLen = parseInt((await contextFactory.getDeployedContextsLen()).toString(), 10);
      console.log({ contextsLen });
      const conditionContextAddr = await contextFactory.deployedContexts(contextsLen - 1);
      console.log({ conditionContextAddr });
      conditionsContextAddrs.push(conditionContextAddr);

      console.log(`Parsing a condition #${j}`);
      const agrParseTx = await agreementContract
        .connect(deployer)
        .parse(step.conditions[j], conditionContextAddr);
      console.log({ agrParseTx });
      console.log(
        `\n\taddress: \x1b[35m${conditionContextAddr}\x1b[0m\n\tcondition ${j + 1}:\n\t\x1b[33m${
          step.conditions[j]
        }\x1b[0m`
      );
    }

    console.log('Parsing transaction');
    await agreementContract.connect(deployer).parse(step.transaction, transactionContextAddr);
    console.log('\nTerm transaction');
    console.log(`\n\taddress: \x1b[35m${transactionContextAddr}\x1b[0m`);
    console.log(`\t\x1b[33m${step.transaction}\x1b[0m`);
    const agrUpdate = await agreementContract
      .connect(deployer)
      .update(
        step.txId,
        step.requiredTxs,
        step.signatories,
        step.transaction,
        step.conditions,
        transactionContextAddr,
        conditionsContextAddrs
      );
    console.log(`\nAgreement update transaction hash: \n\t\x1b[35m${agrUpdate.hash}\x1b[0m`);
  }
};

const updateAgreement = async (
  _dslId: number,
  _agreementAddr: string,
  _signatory: string,
  _condition: string,
  _transaction: string,
  _deployer: SignerWithAddress
) => {
  console.log('`updateAgreement` function call');

  console.log({
    _dslId,
    _agreementAddr,
    _signatory,
    _condition,
    _transaction,
  });

  const agreementContract = await ethers.getContractAt('Agreement', _agreementAddr);
  const contextFactory = await ethers.getContractAt('ContextFactory', REACT_APP_CONTEXT_FACTORY);

  console.log({ txsAddr: await agreementContract.txs() });
  console.log({ ctxdeployedLen: await contextFactory.getDeployedContextsLen() });

  await addSteps(
    agreementContract,
    contextFactory,
    [
      {
        txId: _dslId,
        requiredTxs: [],
        signatories: [_signatory],
        conditions: [_condition],
        transaction: _transaction,
      },
    ],
    _deployer
  );
};

(async () => {
  const [deployer, alice] = await ethers.getSigners();
  // TODO: update `agreementAddr`
  await updateAgreement(
    txId,
    agreementAddr,
    alice.address, // signatory
    'bool true', // condition
    'sendEth RECEIVER 100000000000000000', // transaction
    deployer
  );
})();
