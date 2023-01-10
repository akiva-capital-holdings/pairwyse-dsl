// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.0;

import { IParser } from '../dsl/interfaces/IParser.sol';
import { IProgramContext } from '../dsl/interfaces/IProgramContext.sol';
import { ProgramContext } from '../dsl/ProgramContext.sol';
import { ErrorsAgreement } from '../dsl/libs/Errors.sol';
import { UnstructuredStorage } from '../dsl/libs/UnstructuredStorage.sol';
import { Executor } from '../dsl/libs/Executor.sol';
import { StringUtils } from '../dsl/libs/StringUtils.sol';
import { Agreement } from '../agreement/Agreement.sol';
import { ERC20Token } from '../dsl/ERC20Token.sol';
import { IERC20 } from '../dsl/interfaces/IERC20.sol';

import 'hardhat/console.sol';

// TODO: automatically make sure that no contract exceeds the maximum contract size

/**
 * Financial Agreement written in DSL between two or more users
 * Agreement contract that is used to implement any custom logic of a
 * financial agreement. Ex. lender-borrower agreement
 */
contract MultiTranche is Agreement {
    using UnstructuredStorage for bytes32;
    uint256 public deadline;
    address token;
    ERC20Token public wrappedUSDC1;

    mapping(uint256 => bool) public baseRecord; // recordId => true/false

    /**
     * Sets parser address, creates new Context instance, and setups Context
     */
    constructor(
        address _parser,
        address _ownerAddr,
        address _token,
        address _dslContext,
        uint256 _deadline,
        address _agreement,
        address _investor
    ) Agreement(_parser, _ownerAddr, _dslContext) {
        // Agreement multiAgr = Agreement(payable( _agreement));
        require(_deadline > block.timestamp, ErrorsAgreement.AGR15);
        require(
            _parser != address(0) &&
                _ownerAddr != address(0) &&
                _token != address(0) &&
                _dslContext != address(0),
            ErrorsAgreement.AGR12
        );

        deadline = _deadline;
        token = _token;
        ownerAddr = _ownerAddr;
        uint supply = 1e20;
        wrappedUSDC1 = new ERC20Token('WrappedUSDC1', 'USDC1', supply);
        // uint[] memory activeRecords
        // (bool success, bytes memory b)= _agreement.call(abi.encodeWithSignature('getActiveRecords()'));
        // console.logBytes(b);
        // console.logBool(success);
        // uint256 recordId = 1;
        //  for (uint256 i = 0; i < activeRecords.length; i++) {
        //     if (activeRecords[i] == recordId
        //     ) {
        //         recordId++;
        //     }
        // }

        // (bool successx, bytes memory addr)=_agreement.call(abi.encodeWithSignature('ownerAddr()'));
        // console.logBytes(addr);
        // (bool successa, bytes memory a)=_agreement.call(abi.encodeWithSignature('setStorageAddress(bytes32, address)',
        // 0x00a5a52900000000000000000000000000000000000000000000000000000000,token));
        // (bool successb, bytes memory b)=_agreement.call(abi.encodeWithSignature('setStorageAddress(bytes32, address)',
        // 0x9ff50c8800000000000000000000000000000000000000000000000000000000,address(this)));
        // (bool successc, bytes memory c)=_agreement.call(abi.encodeWithSignature('setStorageAddress(bytes32, address)',
        // 0xeb57cbdc00000000000000000000000000000000000000000000000000000000, address(wrappedUSDC1)));
        // (bool successd, bytes memory d)=_agreement.call(abi.encodeWithSignature('setStorageUint256(bytes32, uint256)',
        // 0x3a289c6100000000000000000000000000000000000000000000000000000000, 100));
        // console.logBool(successx);
        // console.logBool(successa);
        // console.logBool(successb);
        // console.logBool(successc);
        // console.logBool(successd);

        // uint256[] memory requiredRecords;
        // address[] memory signatories = new address[](1);
        // signatories[1]=_investor;
        // string memory transactionStr = 'transferFrom USDC_ADDR MSG_SENDER MULTI_TRANCHE_ADDR _ALLOWANCE';
        // string[] memory conditionStrings = new string[](1);
        // conditionStrings[1]='bool true';
        (bool success, bytes memory b) = _agreement.call(
            abi.encodeWithSignature(
                'update(uint256, uint256[], address[], string, string[])',
                1,
                [0],
                [_investor],
                'transferFrom USDC_ADDR MSG_SENDER MULTI_TRANCHE_ADDR _ALLOWANCE',
                ['bool true']
            )
        );
        console.logBytes(b);
        console.logBool(success);
        // multiAgr.update(recordId,requiredRecords,signatories,transactionStr,conditionStrings);

        // bytes memory setStorageAddress = abi.encodeWithSignature(
        //     'setStorageAddress(bytes32 ,address)',);
        // _agreement.call(setStorageAddress);
    }

    // function mintWrappedUSDC() external {
    //     uint amount = ERC20Token(token).allowance(msg.sender, address(this));
    //     require(ERC20Token(token).balanceOf(msg.sender)>= amount, 'not enough monet');
    //     ERC20Token(token).transfer(address(this), amount);
    //     wrappedUSDC1.transfer(msg.sender, amount);

    // }
}
