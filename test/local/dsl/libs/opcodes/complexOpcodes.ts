import * as hre from 'hardhat';
import { expect } from 'chai';
/* eslint-disable camelcase */
import { BigNumber } from 'ethers';
import {
  ProgramContextMock,
  DSLContextMock,
  Stack,
  ComplexOpcodesMock,
  BaseStorage,
} from '../../../../../typechain-types';
import { checkStack, checkStackTail, hex4Bytes, uint256StrToHex } from '../../../../utils/utils';
import { deployOpcodeLibs } from '../../../../../scripts/utils/deploy.utils';

const { ethers, network } = hre;

describe('Complex opcodes', () => {
  /* eslint-enable camelcase */
  let app: ComplexOpcodesMock;
  let clientApp: BaseStorage;
  let ctxDSL: DSLContextMock;
  let ctxDSLAddr: string;
  let ctxProgram: ProgramContextMock;
  let ctxProgramAddr: string;
  let stack: Stack;
  let uint256type: string;
  let addressType: string;
  let structType: string;
  let snapshotId: number;
  let comparisonOpcodesLibAddr: string;
  let branchingOpcodesLibAddr: string;
  let logicalOpcodesLibAddr: string;
  let otherOpcodesLibAddr: string;
  let complexOpcodesLibAddr: string;
  let opcodeHelpersLibAddr: string;
  const zero32bytes = `0x${new Array(65).join('0')}`;

  before(async () => {
    // Deploy libraries
    [
      comparisonOpcodesLibAddr,
      branchingOpcodesLibAddr,
      logicalOpcodesLibAddr,
      otherOpcodesLibAddr,
      complexOpcodesLibAddr,
      opcodeHelpersLibAddr,
    ] = await deployOpcodeLibs(hre);
    ctxDSL = await (
      await ethers.getContractFactory('DSLContextMock')
    ).deploy(
      comparisonOpcodesLibAddr,
      branchingOpcodesLibAddr,
      logicalOpcodesLibAddr,
      otherOpcodesLibAddr,
      complexOpcodesLibAddr
    );
    ctxDSLAddr = ctxDSL.address;
    ctxProgram = await (await ethers.getContractFactory('ProgramContextMock')).deploy();
    ctxProgramAddr = ctxProgram.address;

    // Create Stack instance
    const stackAddr = await ctxProgram.stack();
    stack = await ethers.getContractAt('Stack', stackAddr);

    // Deploy Storage contract to simulate another app (needed for testing loadRemote opcodes)
    clientApp = await (await ethers.getContractFactory('BaseStorage')).deploy();
    app = await (
      await ethers.getContractFactory('ComplexOpcodesMock', {
        libraries: { ComplexOpcodes: complexOpcodesLibAddr, OpcodeHelpers: opcodeHelpersLibAddr },
      })
    ).deploy();
    // Setup
    await ctxProgram.setAppAddress(clientApp.address);

    uint256type = await ctxDSL.branchCodes('declareArr', 'uint256');
    addressType = await ctxDSL.branchCodes('declareArr', 'address');
    structType = await ctxDSL.branchCodes('declareArr', 'struct');
  });

  beforeEach(async () => {
    // Make a snapshot
    snapshotId = await network.provider.send('evm_snapshot');
  });

  afterEach(async () => {
    // Return to the snapshot
    await network.provider.send('evm_revert', [snapshotId]);
  });

  it('opLoadRemoteAny', async () => {
    await ctxProgram.setProgram('0x1a');
    await expect(app.opLoadRemoteAny(ctxProgramAddr, ctxDSLAddr)).to.be.revertedWith('OPH2');
  });

  it('opLoadRemoteUint256', async () => {
    const testValue = 1;
    const bytes32TestValueName = hex4Bytes('NUMBER');

    await clientApp['setStorageUint256(bytes32,uint256)'](bytes32TestValueName, testValue);

    const number = bytes32TestValueName.substring(2, 10);

    await ctxProgram.setProgram(`0x${number}${clientApp.address.substring(2)}`);
    await checkStackTail(stack, []);
    await app.opLoadRemoteUint256(ctxProgramAddr, ethers.constants.AddressZero);
    await checkStackTail(stack, [testValue]);
  });

  it('opLoadRemoteBytes32', async () => {
    const testValue = hex4Bytes('123456');
    const bytes32TestValueName = hex4Bytes('BYTES');

    await clientApp.setStorageBytes32(bytes32TestValueName, testValue);

    const bytes = bytes32TestValueName.substring(2, 10);
    await ctxProgram.setProgram(`0x${bytes}${clientApp.address.substring(2)}`);
    await checkStackTail(stack, []);
    await app.opLoadRemoteBytes32(ctxProgramAddr, ethers.constants.AddressZero);
    await checkStackTail(stack, [testValue]);
  });

  it('opLoadRemoteBool', async () => {
    const testValue = true;
    const bytes32TestValueName = hex4Bytes('BOOLEAN');

    await clientApp['setStorageBool(bytes32,bool)'](bytes32TestValueName, testValue);

    const bool = bytes32TestValueName.substring(2, 10);
    await ctxProgram.setProgram(`0x${bool}${clientApp.address.substring(2)}`);
    await checkStackTail(stack, []);
    await app.opLoadRemoteBool(ctxProgramAddr, ethers.constants.AddressZero);
    await checkStackTail(stack, [+testValue]);
  });

  it('opLoadRemoteAddress', async () => {
    const [addr1] = await ethers.getSigners();
    const testValue = addr1.address;
    const bytes32TestValueName = hex4Bytes('ADDRESS');

    await clientApp['setStorageAddress(bytes32,address)'](bytes32TestValueName, testValue);

    const addr = bytes32TestValueName.substring(2, 10);
    await ctxProgram.setProgram(`0x${addr}${clientApp.address.substring(2)}`);
    await checkStackTail(stack, []);
    await app.opLoadRemoteAddress(ctxProgramAddr, ethers.constants.AddressZero);
    await checkStackTail(stack, [testValue]);
  });

  it('opLoadRemote', async () => {
    const testValue = hex4Bytes('123456');
    const bytes32TestValueName = hex4Bytes('BYTES');
    const testSignature = 'getStorageBytes32(bytes32)';

    await clientApp.setStorageBytes32(bytes32TestValueName, testValue);

    const bytes = bytes32TestValueName.substring(2, 10);
    await ctxProgram.setProgram(`0x${bytes}${clientApp.address.substring(2)}`);

    await checkStackTail(stack, []);
    await app.opLoadRemote(ctxProgramAddr, testSignature);
    await checkStackTail(stack, [testValue]);
  });

  it('opStruct', async () => {
    const LAST_PAYMENT = hex4Bytes('BOB.lastPayment');
    const ACCOUNT = hex4Bytes('BOB.account');
    const ADDRESS = '47f8a90ede3d84c7c0166bd84a4635e4675accfc000000000000000000000000';
    const THREE = new Array(64).join('0') + 3;

    await ctxProgram.setProgram(
      '0x' +
        '4a871642' + // BOB.lastPayment
        `${THREE}` + // 3
        '2215b81f' + // BOB.account
        `${ADDRESS}` + // the address for account
        'cb398fe1' // endStruct
    );

    expect(await clientApp.getStorageUint256(LAST_PAYMENT)).equal(0);
    expect(await clientApp.getStorageUint256(ACCOUNT)).equal(BigNumber.from(zero32bytes));
    await app.opStruct(ctxProgramAddr, ethers.constants.AddressZero);
    expect(await clientApp.getStorageUint256(LAST_PAYMENT)).equal(3);
    expect(await clientApp.getStorageUint256(ACCOUNT)).equal(BigNumber.from(`0x${ADDRESS}`));
  });

  describe('Arrays', () => {
    const ONE = new Array(64).join('0') + 1;
    const THREE = new Array(64).join('0') + 3;
    const FIVE = new Array(64).join('0') + 5;
    const NUMBERS = hex4Bytes('NUMBERS');
    const PARTNERS = hex4Bytes('PARTNERS');
    const INDEXES = hex4Bytes('INDEXES');
    const BOB = hex4Bytes('BOB');
    const MAX = hex4Bytes('MAX');
    const ADDRESS_MARY = 'e7f8a90ede3d84c7c0166bd84a4635e4675accfc000000000000000000000000';
    const ADDRESS_MAX = 'f7f8a90ede3d84c7c0166bd84a4635e4675accfc000000000000000000000000';

    describe('opDeclare', () => {
      it('uint256 type', async () => {
        expect(await clientApp.getType(NUMBERS)).to.be.equal('0x00');

        await ctxProgram.setProgram(
          '0x' +
            '01' + // uint256
            '1fff709e' // bytecode for NUMBERS
        );

        await app.opDeclare(ctxProgramAddr, ctxDSLAddr);
        expect(await clientApp.getType(NUMBERS)).to.be.equal('0x01');
      });

      it('struct type', async () => {
        await ctxProgram.setProgram(
          '0x' +
            '02' + // struct
            '3c8423ff' // bytecode for PARTNERS
        );
        expect(await clientApp.getType(PARTNERS)).to.be.equal('0x00');
        await app.opDeclare(ctxProgramAddr, ethers.constants.AddressZero);
        expect(await clientApp.getType(PARTNERS)).to.be.equal('0x02');
      });

      it('address type', async () => {
        await ctxProgram.setProgram(
          '0x' +
            '03' + // address
            '257b3678' // bytecode for INDEXES
        );
        expect(await clientApp.getType(INDEXES)).to.be.equal('0x00');
        await app.opDeclare(ctxProgramAddr, ethers.constants.AddressZero);
        expect(await clientApp.getType(INDEXES)).to.be.equal('0x03');
      });
    });

    describe('opPush', () => {
      it('uint256 type', async () => {
        await clientApp.declare(uint256type, NUMBERS);
        expect(await clientApp.getLength(NUMBERS)).to.be.equal(0);
        await ctxProgram.setProgram(
          '0x' +
            `${THREE}` + // 3
            '1fff709e' // bytecode for NUMBERS
        );

        await app.opPush(ctxProgramAddr, ethers.constants.AddressZero);

        expect(await clientApp.getLength(NUMBERS)).to.be.equal(1);
        expect(await clientApp.get(0, NUMBERS)).to.be.equal(`0x${THREE}`);
      });

      it('struct type', async () => {
        await clientApp.declare(structType, INDEXES);
        expect(await clientApp.getLength(INDEXES)).to.be.equal(0);

        await ctxProgram.setProgram(
          `${BOB}` + // bytecode for BOB
            '257b3678' // bytecode for INDEXES
        );
        await app.opPush(ctxProgramAddr, ethers.constants.AddressZero);

        expect(await clientApp.getLength(INDEXES)).to.be.equal(1);
        expect(await clientApp.get(0, INDEXES)).to.be.equal(`${BOB}`);
      });

      it('address type', async () => {
        await clientApp.declare(addressType, PARTNERS);
        expect(await clientApp.getLength(PARTNERS)).to.be.equal(0);
        await ctxProgram.setProgram(
          '0x' +
            `${ADDRESS_MARY}` + // an address
            '3c8423ff' // bytecode for PARTNERS
        );
        await app.opPush(ctxProgramAddr, ethers.constants.AddressZero);

        expect(await clientApp.getLength(PARTNERS)).to.be.equal(1);
        expect(await clientApp.get(0, PARTNERS)).to.be.equal(`0x${ADDRESS_MARY}`);
      });
    });

    describe('opGet', () => {
      it('uint256 type', async () => {
        await clientApp.declare(uint256type, NUMBERS);
        await clientApp.addItem(`0x${THREE}`, NUMBERS);

        await ctxProgram.setProgram(
          `${zero32bytes}` + // 0x + 0 index
            '1fff709e' // bytecode for NUMBERS
        );

        await app.opGet(ctxProgramAddr, ethers.constants.AddressZero);
        // returned 3 as a value stored in NUMBERS with 0 index
        await checkStack(stack, 1, 3);
      });

      it('struct type', async () => {
        await clientApp.declare(addressType, INDEXES);
        await clientApp.addItem(MAX, INDEXES);

        await ctxProgram.setProgram(
          `${zero32bytes}` + // 0x + 0 index
            '257b3678' // bytecode for INDEXES
        );
        await app.opGet(ctxProgramAddr, ethers.constants.AddressZero);
        // returns bytecode for MAX struct name
        await checkStack(stack, 1, MAX);
      });

      it('address type', async () => {
        await clientApp.declare(addressType, PARTNERS);
        await clientApp.addItem(`0x${ADDRESS_MARY}`, PARTNERS);

        await ctxProgram.setProgram(
          `${zero32bytes}` + // 0x + 0 index
            '3c8423ff' // bytecode for PARTNERS
        );

        await checkStackTail(stack, []);
        await app.opGet(ctxProgramAddr, ethers.constants.AddressZero);
        await checkStack(
          stack,
          1,
          BigNumber.from(`0x${ADDRESS_MARY}`) // a number from ADDRESS_MARY address
        );
      });
    });

    describe('opSumOf', () => {
      it('uint256 type', async () => {
        await clientApp.declare(uint256type, NUMBERS);
        await clientApp.addItem(`0x${THREE}`, NUMBERS);
        await clientApp.addItem(`0x${FIVE}`, NUMBERS);

        await ctxProgram.setProgram(
          '0x1fff709e' // bytecode for NUMBERS
        );

        await checkStackTail(stack, []);
        await app.opSumOf(ctxProgramAddr, ctxDSLAddr);
        // returned 8 as a result of sum for two values (3 and 5) that stored in NUMBERS
        await checkStack(stack, 1, 8);
      });

      it('struct type', async () => {
        await clientApp.declare(structType, INDEXES);
        await clientApp.addItem(MAX, INDEXES);
        await clientApp.addItem(BOB, INDEXES);
        await clientApp['setStorageUint256(bytes32,uint256)'](hex4Bytes('BOB.balance'), 55);
        await clientApp['setStorageUint256(bytes32,uint256)'](hex4Bytes('MAX.balance'), 33);
        await ctxProgram.setStructVars('BOB', 'balance', 'BOB.balance');
        await ctxProgram.setStructVars('MAX', 'balance', 'MAX.balance');

        await ctxProgram.setProgram(
          '0x257b3678' + // bytecode for INDEXES
            'ea06f38f' // bytecode for balance
        );

        await checkStackTail(stack, []);
        await app.opSumThroughStructs(ctxProgramAddr, ctxDSLAddr);
        // returned 8 as a result of sum for two values (3 and 5)
        // that stored in 'BOB.balance' & 'MAX.balance'
        await checkStack(stack, 1, 88);
      });
    });

    describe('opLengthOf', () => {
      it('uint256 type', async () => {
        await clientApp.declare(uint256type, NUMBERS);
        await clientApp.addItem(`0x${THREE}`, NUMBERS);
        await clientApp.addItem(`0x${FIVE}`, NUMBERS);
        await clientApp.addItem(`0x${ONE}`, NUMBERS);
        await ctxProgram.setProgram(
          '0x1fff709e' // bytecode for NUMBERS
        );

        await checkStackTail(stack, []);
        await app.opLengthOf(ctxProgramAddr, ethers.constants.AddressZero);
        // returned 3 as a length of items that stored in NUMBERS
        await checkStack(stack, 1, 3);
      });

      it('struct type', async () => {
        await clientApp.declare(structType, INDEXES);
        await clientApp.addItem(BOB, INDEXES);
        await clientApp.addItem(MAX, INDEXES);
        await ctxProgram.setProgram(
          '0x257b3678' // bytecode for INDEXES
        );

        await checkStackTail(stack, []);
        await app.opLengthOf(ctxProgramAddr, ethers.constants.AddressZero);
        // returned 2 as a length of items that stored in INDEXES
        await checkStack(stack, 1, 2);
      });

      it('address type', async () => {
        await clientApp.declare(addressType, PARTNERS);
        await clientApp.addItem(`0x${ADDRESS_MARY}`, PARTNERS);
        await clientApp.addItem(`0x${ADDRESS_MAX}`, PARTNERS);
        await ctxProgram.setProgram(
          '0x3c8423ff' // bytecode for PARTNERS
        );

        await checkStackTail(stack, []);
        await app.opLengthOf(ctxProgramAddr, ethers.constants.AddressZero);
        // returned 2 as a length of items that stored in PARTNERS
        await checkStack(stack, 1, 2);
      });
    });
  });

  // TODO: fix the test. It should test `opEnableRecord` function
  describe('opEnableRecord', () => {
    it.skip('check that record 54 was activated', async () => {
      // // can not be testet right now directly
      // // here shouldd be the storage for RECORD_ID and AGREEMENT_ADDR in the executable agreement
      // /*
      //   `agreement` is the contract that stores record number 34, it has own _ctxAgreement
      //   _ctxExecutive - context uses to execute record number 34 from `agreement`
      //   _ctxCondition - context-helper just to set a context for the recordContext in agreement
      // */
      // // app is the owner of agreement (non-usable in prod)
      // // it sets just to check that onlyOwner modifier works well
      // const ID = 34;
      // const recordId32data = hex4Bytes('RECORD_ID');
      // const agr32data = hex4Bytes('AGREEMENT_ADDR');
      // const agreementAddr = await deployAgreementMock(hre, app.address);
      // const agreement = await ethers.getContractAt('AgreementMock', agreementAddr);
      // const ctxAgreement = await (await ethers.getContractFactory('ProgramContextMock')).deploy();
      // const ctxCondition = await (await ethers.getContractFactory('ProgramContextMock')).deploy();
      // const ctxExecutive = await (await ethers.getContractFactory('ProgramContextMock')).deploy();
      // // Setup
      // await ctxAgreement.setAppAddress(app.address);
      // await ctxAgreement.setOtherOpcodesAddr(otherOpcodesLibAddr);
      // await agreement.setStorageUint256(recordId32data, ID);
      // await agreement.setStorageAddress(agr32data, agreementAddr);
      // await agreement.setRecordContext(ID, ctxCondition.address);
      // await ctxExecutive.setProgram(`0x${recordId32data.substring(2)}${agr32data.substring(2)}`);
      // let record = await agreement.records(ID);
      // expect(record.isActive).to.be.equal(false);
      // await app.opEnableRecord(ctxExecutive.address);
      // record = await agreement.records(ID);
      // expect(record.isActive).to.be.equal(true);
    });
  });
});
