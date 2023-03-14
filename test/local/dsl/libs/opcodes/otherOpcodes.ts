import * as hre from 'hardhat';
import { expect } from 'chai';
/* eslint-disable camelcase */
import { parseEther } from 'ethers/lib/utils';
import {
  Stack__factory,
  ProgramContextMock,
  DSLContextMock,
  Stack,
  OtherOpcodesMock,
  ERC20Mintable,
  BaseStorage,
} from '../../../../../typechain-types';
import {
  checkStack,
  checkStackTail,
  hex4Bytes,
  uint256StrToHex,
  pushToStack,
} from '../../../../utils/utils';
import { deployOpcodeLibs } from '../../../../../scripts/utils/deploy.utils';

const { ethers, network } = hre;

describe('Other opcodes', () => {
  let StackCont: Stack__factory;
  /* eslint-enable camelcase */
  let app: OtherOpcodesMock;
  let clientApp: BaseStorage;
  let ctxDSL: DSLContextMock;
  let ctxDSLAddr: string;
  let ctxProgram: ProgramContextMock;
  let ctxProgramAddr: string;
  let stack: Stack;
  let testERC20: ERC20Mintable;
  let uint256type: string;
  let addressType: string;
  let structType: string;
  let snapshotId: number;
  let comparisonOpcodesLibAddr: string;
  let branchingOpcodesLibAddr: string;
  let logicalOpcodesLibAddr: string;
  let otherOpcodesLibAddr: string;
  let complexOpcodesLibAddr: string;
  const testAmount = '1000';
  const zero32bytes = `0x${new Array(65).join('0')}`;

  before(async () => {
    // Deploy libraries
    [
      comparisonOpcodesLibAddr,
      branchingOpcodesLibAddr,
      logicalOpcodesLibAddr,
      otherOpcodesLibAddr,
      complexOpcodesLibAddr,
    ] = await deployOpcodeLibs(hre);
    StackCont = await ethers.getContractFactory('Stack');
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
      await ethers.getContractFactory('OtherOpcodesMock', {
        libraries: { OtherOpcodes: otherOpcodesLibAddr },
      })
    ).deploy();
    // Setup
    await ctxProgram.setAppAddress(clientApp.address);

    // Deploy test ERC20 and mint some to ctxProgram
    testERC20 = await (await ethers.getContractFactory('ERC20Mintable')).deploy('Test', 'TST', 18);

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

  describe('block', () => {
    it('blockNumber', async () => {
      const ctxStackAddress = await ctxProgram.stack();
      StackCont.attach(ctxStackAddress);

      // 0x05 is NUMBER
      await ctxProgram.setProgram('0x15');

      const opBlockResult = await app.opBlockNumber(ctxProgramAddr, ethers.constants.AddressZero);

      // stack size is 1
      expect(await stack.length()).to.equal(1);

      expect(await stack.seeLast()).to.equal(opBlockResult.blockNumber);
    });

    // Block timestamp doesn't work because Hardhat doesn't return timestamp
    it('blockTimestamp', async () => {
      const ctxStackAddress = await ctxProgram.stack();
      StackCont.attach(ctxStackAddress);

      // 0x16 is Timestamp
      await ctxProgram.setProgram('0x16');

      await app.opBlockTimestamp(ctxProgramAddr, ethers.constants.AddressZero);

      // stack size is 1
      expect(await stack.length()).to.equal(1);

      const lastBlockTimestamp = (
        await ethers.provider.getBlock(
          // eslint-disable-next-line no-underscore-dangle
          ethers.provider._lastBlockNumber /* it's -2 but the resulting block number is correct */
        )
      ).timestamp;

      expect((await stack.seeLast()).toNumber()).to.be.approximately(lastBlockTimestamp, 1000);
    });

    // Block time doesn't work because Hardhat doesn't return timestamp
    it('time', async () => {
      // time is an alias for blockTimestamp
      const ctxStackAddress = await ctxProgram.stack();
      StackCont.attach(ctxStackAddress);

      // 0x30 is time
      await ctxProgram.setProgram('0x30');

      await app.opBlockTimestamp(ctxProgramAddr, ethers.constants.AddressZero);

      // stack size is 1
      expect(await stack.length()).to.equal(1);

      const lastBlockTimestamp = (
        await ethers.provider.getBlock(
          // eslint-disable-next-line no-underscore-dangle
          ethers.provider._lastBlockNumber /* it's -2 but the resulting block number is correct */
        )
      ).timestamp;

      expect((await stack.seeLast()).toNumber()).to.be.approximately(lastBlockTimestamp, 1000);
    });

    it('blockChainId', async () => {
      const ctxStackAddress = await ctxProgram.stack();
      StackCont.attach(ctxStackAddress);

      // 0x17 is ChainID
      await ctxProgram.setProgram('0x17');

      const opBlockResult = await app.opBlockChainId(ctxProgramAddr, ethers.constants.AddressZero);

      // stack size is 1
      expect(await stack.length()).to.equal(1);

      expect(await stack.seeLast()).to.equal(opBlockResult.chainId);
    });
  });

  it('opMsgSender', async () => {
    const [first, second] = await ethers.getSigners();

    await app.opMsgSender(ctxProgramAddr, ethers.constants.AddressZero);
    await checkStack(stack, 1, 0);
    await stack.clear();

    await ctxProgram.setMsgSender(first.address);
    await app.opMsgSender(ctxProgramAddr, ethers.constants.AddressZero);
    await checkStack(stack, 1, first.address);
    await stack.clear();

    await ctxProgram.setMsgSender(second.address);
    await app.opMsgSender(ctxProgramAddr, ethers.constants.AddressZero);
    await checkStack(stack, 1, second.address);
  });

  it('opMsgValue', async () => {
    await app.opMsgValue(ctxProgramAddr, ethers.constants.AddressZero);
    await checkStack(stack, 1, 0);
    await stack.clear();

    await ctxProgram.setMsgValue(10);
    await app.opMsgValue(ctxProgramAddr, ethers.constants.AddressZero);
    await checkStack(stack, 1, 10);
    await stack.clear();

    await ctxProgram.setMsgValue(25);
    await app.opMsgValue(ctxProgramAddr, ethers.constants.AddressZero);
    await checkStack(stack, 1, 25);
  });

  describe('opSetLocalBool', async () => {
    const bytes32VarName = hex4Bytes('BOOL_VAR');
    const bytesVarName = bytes32VarName.substring(2, 10);

    it('error: opSetLocal call not success', async () => {
      await ctxProgram.setProgram(`0x${bytesVarName}01`);
      const badContract = await (await ethers.getContractFactory('StorageWithRevert')).deploy();
      await ctxProgram.setAppAddress(badContract.address);
      await expect(
        app.opSetLocalBool(ctxProgramAddr, ethers.constants.AddressZero)
      ).to.be.revertedWith('OPH1');
      await ctxProgram.setAppAddress(clientApp.address);
    });

    it('success', async () => {
      await ctxProgram.setProgram(`0x${bytesVarName}01`);
      await app.opSetLocalBool(ctxProgramAddr, ethers.constants.AddressZero);
      expect(await clientApp.getStorageBool(bytes32VarName)).to.equal(true);

      await ctxProgram.setProgram(`0x${bytesVarName}00`);
      await app.opSetLocalBool(ctxProgramAddr, ethers.constants.AddressZero);
      expect(await clientApp.getStorageBool(bytes32VarName)).to.equal(false);
    });
  });

  describe('opSetUint256', async () => {
    const bytes32VarName = hex4Bytes('UINT256_VAR');
    const bytesVarName = bytes32VarName.substring(2, 10);

    it('error: opSetLocal call not success', async () => {
      await pushToStack(ctxProgram, StackCont, [15]);
      await ctxProgram.setProgram(`0x${bytesVarName}`);

      const badContract = await (await ethers.getContractFactory('StorageWithRevert')).deploy();

      await ctxProgram.setAppAddress(badContract.address);
      await expect(
        app.opSetUint256(ctxProgramAddr, ethers.constants.AddressZero)
      ).to.be.revertedWith('OPH1');
      await ctxProgram.setAppAddress(clientApp.address);
    });

    it('success: regular number', async () => {
      await pushToStack(ctxProgram, StackCont, [15]);
      await ctxProgram.setProgram(`0x${bytesVarName}`);
      await app.opSetUint256(ctxProgramAddr, ethers.constants.AddressZero);
      expect(await clientApp.getStorageUint256(bytes32VarName)).to.equal(15);
    });

    it('success: big number', async () => {
      await pushToStack(ctxProgram, StackCont, [ethers.utils.parseEther('100')]);
      await ctxProgram.setProgram(`0x${bytesVarName}`);
      await app.opSetUint256(ctxProgramAddr, ethers.constants.AddressZero);
      expect(await clientApp.getStorageUint256(bytes32VarName)).to.equal(
        ethers.utils.parseEther('100')
      );
    });
  });

  it('opLoadLocalUint256', async () => {
    const testValue = 1;
    const bytes32TestValueName = hex4Bytes('NUMBER');

    await clientApp['setStorageUint256(bytes32,uint256)'](bytes32TestValueName, testValue);

    const number = bytes32TestValueName.substring(2, 10);
    await ctxProgram.setProgram(`0x${number}`);

    await checkStackTail(stack, []);
    await app.opLoadLocalUint256(ctxProgramAddr, ethers.constants.AddressZero);
    await checkStackTail(stack, [testValue]);
  });

  it('opBool', async () => {
    await ctxProgram.setProgram('0x01');
    await app.opBool(ctxProgramAddr, ethers.constants.AddressZero);
    await checkStackTail(stack, ['0x01']);
  });

  it('opUint256', async () => {
    await ctxProgram.setProgram(
      '0x0000000000000000000000000000000000000000000000000000000000000001'
    );
    await checkStackTail(stack, []);
    await app.opUint256(ctxProgramAddr, ethers.constants.AddressZero);
    await checkStackTail(stack, ['1']);
  });

  it('opSendEth', async () => {
    const [receiver] = await ethers.getSigners();

    const fundAmountUint = 1e8;
    const fundAmountHex = uint256StrToHex(fundAmountUint);

    await (
      await receiver.sendTransaction({
        from: receiver.address,
        to: app.address,
        value: `0x${fundAmountHex}`,
      })
    ).wait();

    const testAddress = receiver.address;

    const bytes32TestAddressName = hex4Bytes('ADDRESS');

    await clientApp['setStorageAddress(bytes32,address)'](bytes32TestAddressName, testAddress);

    const address = bytes32TestAddressName.substring(2, 10);
    await ctxProgram.setProgram(`0x${address}${fundAmountHex}`);
    await checkStackTail(stack, []);
    await expect(() =>
      app.opSendEth(ctxProgramAddr, ethers.constants.AddressZero)
    ).to.changeEtherBalance(receiver, fundAmountUint);
    await checkStackTail(stack, ['1']);
  });

  it('opTransfer', async () => {
    const [receiver] = await ethers.getSigners();

    await testERC20.mint(app.address, testAmount);

    const bytes32TokenAddr = hex4Bytes('TOKEN_ADDR');
    const bytes32ReceiverAddr = hex4Bytes('RECEIVER');

    await clientApp['setStorageAddress(bytes32,address)'](bytes32TokenAddr, testERC20.address);
    await clientApp['setStorageAddress(bytes32,address)'](bytes32ReceiverAddr, receiver.address);

    const tokenAddress = bytes32TokenAddr.substring(2, 10);
    const receiverAddress = bytes32ReceiverAddr.substring(2, 10);
    await ctxProgram.setProgram(
      `0x${tokenAddress}${receiverAddress}${uint256StrToHex(testAmount)}`
    );

    await checkStackTail(stack, []);
    await app.opTransfer(ctxProgramAddr, ethers.constants.AddressZero);
    await checkStackTail(stack, ['1']);

    const balanceOfReceiver = await testERC20.balanceOf(receiver.address);

    expect(balanceOfReceiver).to.be.equal(testAmount);
  });

  it('opTransferVar', async () => {
    const [receiver] = await ethers.getSigners();
    await testERC20.mint(app.address, testAmount);

    const bytes32TokenAddr = hex4Bytes('TOKEN_ADDR');
    const bytes32ReceiverAddr = hex4Bytes('RECEIVER');
    const bytes32TestAmount = hex4Bytes('AMOUNT');

    await clientApp['setStorageAddress(bytes32,address)'](bytes32TokenAddr, testERC20.address);
    await clientApp['setStorageAddress(bytes32,address)'](bytes32ReceiverAddr, receiver.address);
    await clientApp['setStorageUint256(bytes32,uint256)'](bytes32TestAmount, 1000);

    const tokenAddress = bytes32TokenAddr.substring(2, 10);
    const receiverAddress = bytes32ReceiverAddr.substring(2, 10);
    const amountVar = bytes32TestAmount.substring(2, 10);
    await ctxProgram.setProgram(`0x${tokenAddress}${receiverAddress}${amountVar}`);

    await checkStackTail(stack, []);
    await app.opTransferVar(ctxProgramAddr, ethers.constants.AddressZero);
    await checkStackTail(stack, ['1']);

    const balanceOfReceiver = await testERC20.balanceOf(receiver.address);
    expect(balanceOfReceiver).to.be.equal(testAmount);
  });

  it('opTransferFrom', async () => {
    const [sender, receiver] = await ethers.getSigners();

    await testERC20.mint(sender.address, testAmount);
    await testERC20.approve(app.address, testAmount, { from: sender.address });

    const bytes32TokenAddr = hex4Bytes('TOKEN_ADDR');
    const bytes32SenderAddr = hex4Bytes('SENDER');
    const bytes32ReceiverAddr = hex4Bytes('RECEIVER');

    await clientApp['setStorageAddress(bytes32,address)'](bytes32TokenAddr, testERC20.address);
    await clientApp['setStorageAddress(bytes32,address)'](bytes32SenderAddr, sender.address);
    await clientApp['setStorageAddress(bytes32,address)'](bytes32ReceiverAddr, receiver.address);

    const tokenAddress = bytes32TokenAddr.substring(2, 10);
    const senderAddress = bytes32SenderAddr.substring(2, 10);
    const receiverAddress = bytes32ReceiverAddr.substring(2, 10);

    await ctxProgram.setProgram(
      `0x${tokenAddress}${senderAddress}${receiverAddress}${uint256StrToHex(testAmount)}`
    );

    await checkStackTail(stack, []);
    await app.opTransferFrom(ctxProgramAddr, ethers.constants.AddressZero);
    await checkStackTail(stack, ['1']);

    const balanceOfReceiver = await testERC20.balanceOf(receiver.address);
    expect(balanceOfReceiver).to.be.equal(testAmount);
  });

  it('opTransferFromVar', async () => {
    const [sender, receiver] = await ethers.getSigners();

    await testERC20.mint(sender.address, testAmount);
    await testERC20.approve(app.address, testAmount, { from: sender.address });

    const bytes32TokenAddr = hex4Bytes('TOKEN_ADDR');
    const bytes32SenderAddr = hex4Bytes('SENDER');
    const bytes32ReceiverAddr = hex4Bytes('RECEIVER');
    const bytes32TestAmount = hex4Bytes('RECEIVER_AMOUNT');

    await clientApp['setStorageAddress(bytes32,address)'](bytes32TokenAddr, testERC20.address);
    await clientApp['setStorageAddress(bytes32,address)'](bytes32SenderAddr, sender.address);
    await clientApp['setStorageAddress(bytes32,address)'](bytes32ReceiverAddr, receiver.address);
    await clientApp['setStorageUint256(bytes32,uint256)'](bytes32TestAmount, testAmount);

    const tokenAddress = bytes32TokenAddr.substring(2, 10);
    const senderAddress = bytes32SenderAddr.substring(2, 10);
    const receiverAddress = bytes32ReceiverAddr.substring(2, 10);
    const amountVar = bytes32TestAmount.substring(2, 10);

    await ctxProgram.setProgram(`0x${tokenAddress}${senderAddress}${receiverAddress}${amountVar}`);
    let balanceOfReceiver = await testERC20.balanceOf(receiver.address);
    expect(balanceOfReceiver).to.be.equal(0);

    await checkStackTail(stack, []);
    await app.opTransferFromVar(ctxProgramAddr, ethers.constants.AddressZero);
    await checkStackTail(stack, ['1']);

    balanceOfReceiver = await testERC20.balanceOf(receiver.address);
    expect(balanceOfReceiver).to.be.equal(testAmount);
  });

  it('opBalanceOf', async () => {
    const [, receiver] = await ethers.getSigners();

    await testERC20.mint(receiver.address, testAmount);

    const bytes32TokenAddr = hex4Bytes('TOKEN_ADDR');
    const bytes32ReceiverAddr = hex4Bytes('RECEIVER');

    await clientApp['setStorageAddress(bytes32,address)'](bytes32TokenAddr, testERC20.address);
    await clientApp['setStorageAddress(bytes32,address)'](bytes32ReceiverAddr, receiver.address);

    const tokenAddress = bytes32TokenAddr.substring(2, 10);
    const receiverAddress = bytes32ReceiverAddr.substring(2, 10);

    await ctxProgram.setProgram(`0x${tokenAddress}${receiverAddress}`);

    await checkStackTail(stack, []);
    await app.opBalanceOf(ctxProgramAddr, ethers.constants.AddressZero);
    await checkStackTail(stack, [testAmount]);
  });

  it('opAllowance', async () => {
    const [, owner, spender] = await ethers.getSigners();
    const expectedAllowance = parseEther('150');

    await testERC20.mint(owner.address, expectedAllowance);
    await testERC20.connect(owner).approve(spender.address, expectedAllowance);

    const bytes32TokenAddr = hex4Bytes('TOKEN_ADDR');
    const bytes32OwnerAddr = hex4Bytes('OWNER');
    const bytes32SpenderAddr = hex4Bytes('SPENDER');

    await clientApp['setStorageAddress(bytes32,address)'](bytes32TokenAddr, testERC20.address);
    await clientApp['setStorageAddress(bytes32,address)'](bytes32OwnerAddr, owner.address);
    await clientApp['setStorageAddress(bytes32,address)'](bytes32SpenderAddr, spender.address);

    const tokenAddress = bytes32TokenAddr.substring(2, 10);
    const ownerAddress = bytes32OwnerAddr.substring(2, 10);
    const spenderAddress = bytes32SpenderAddr.substring(2, 10);

    await ctxProgram.setProgram(`0x${tokenAddress}${ownerAddress}${spenderAddress}`);

    await checkStackTail(stack, []);
    await app.opAllowance(ctxProgramAddr, ethers.constants.AddressZero);
    await checkStackTail(stack, [expectedAllowance]);
  });

  it('opMint', async () => {
    const [from, to] = await ethers.getSigners();
    const amount = parseEther('150');

    expect(await testERC20.balanceOf(to.address)).to.equal(0);

    const bytes32TokenAddr = hex4Bytes('TOKEN_ADDR');
    const bytes32ToAddr = hex4Bytes('TO');
    const bytes32Amount = hex4Bytes('AMOUNT');

    await clientApp['setStorageAddress(bytes32,address)'](bytes32TokenAddr, testERC20.address);
    await clientApp['setStorageAddress(bytes32,address)'](bytes32ToAddr, to.address);
    await clientApp['setStorageUint256(bytes32,uint256)'](bytes32Amount, amount);

    const tokenAddress = bytes32TokenAddr.substring(2, 10);
    const toAddress = bytes32ToAddr.substring(2, 10);
    const amountVar = bytes32Amount.substring(2, 10);

    await ctxProgram.setProgram(`0x${tokenAddress}${toAddress}${amountVar}`);

    await checkStackTail(stack, []);
    await app.connect(from).opMint(ctxProgramAddr, ethers.constants.AddressZero);
    expect(await testERC20.balanceOf(to.address)).to.equal(amount);
    await checkStackTail(stack, [1]);
  });

  it('opBurn', async () => {
    const [, to] = await ethers.getSigners();
    const amount = parseEther('150');

    await testERC20.mint(to.address, amount);
    expect(await testERC20.balanceOf(to.address)).to.equal(amount);

    const bytes32TokenAddr = hex4Bytes('TOKEN_ADDR');
    const bytes32ToAddr = hex4Bytes('TO');
    const bytes32Amount = hex4Bytes('AMOUNT');

    await clientApp['setStorageAddress(bytes32,address)'](bytes32TokenAddr, testERC20.address);
    await clientApp['setStorageAddress(bytes32,address)'](bytes32ToAddr, to.address);
    await clientApp['setStorageUint256(bytes32,uint256)'](bytes32Amount, amount);

    const tokenAddress = bytes32TokenAddr.substring(2, 10);
    const toAddress = bytes32ToAddr.substring(2, 10);
    const amountVar = bytes32Amount.substring(2, 10);

    await ctxProgram.setProgram(`0x${tokenAddress}${toAddress}${amountVar}`);

    await checkStackTail(stack, []);
    await app.opBurn(ctxProgramAddr, ethers.constants.AddressZero);
    expect(await testERC20.balanceOf(to.address)).to.equal(0);
    await checkStackTail(stack, [1]);
  });

  it('opAddressGet', async () => {
    const [someAccount] = await ethers.getSigners();
    const testAddress = someAccount.address;

    await ctxProgram.setProgram(`0x${testAddress.substring(2)}`);

    const result = await app.callStatic.opAddressGet(ctxProgramAddr, ethers.constants.AddressZero);

    expect(result).to.be.equal(testAddress);
  });

  it('opLoadLocal', async () => {
    const testValue = hex4Bytes('TEST_VALUE');
    const bytes32TestValueName = hex4Bytes('BYTES32');
    const testSignature = 'getStorageBytes32(bytes32)';

    const bytes = bytes32TestValueName.substring(2, 10);
    await ctxProgram.setProgram(`0x${bytes}`);

    await clientApp.setStorageBytes32(bytes32TestValueName, testValue);

    await checkStackTail(stack, []);
    await app.opLoadLocal(ctxProgramAddr, testSignature);
    checkStackTail(stack, [testValue]);
  });
});
