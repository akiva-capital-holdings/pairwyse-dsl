// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.0;

import { IDSLContext } from '../../interfaces/IDSLContext.sol';
import { IProgramContext } from '../../interfaces/IProgramContext.sol';
import { IERC20 } from '../../interfaces/IERC20.sol';
import { IcToken } from '../../interfaces/IcToken.sol';
import { IComptroller } from '../../interfaces/IComptroller.sol';
import { IMaximillion } from '../../interfaces/IMaximillion.sol';
import { IcTokenNative } from '../../interfaces/IcTokenNative.sol';
import { IERC20Mintable } from '../../interfaces/IERC20Mintable.sol';
import { UnstructuredStorage } from '../UnstructuredStorage.sol';
import { OpcodeHelpers } from './OpcodeHelpers.sol';
import { ErrorsGeneralOpcodes, ErrorsCompoundOpcodes } from '../Errors.sol';

import 'hardhat/console.sol';

library CompoundOpcodes {
    /************************
     * Compound Integration *
     ***********************/
    /**
     * @dev Master opcode to interact with Compound V2. Needs sub-commands to be executed
     * @param _ctxProgram ProgramContext contract address
     * @param _ctxDSL DSLContext contract address
     */
    function opCompound(address _ctxProgram, address _ctxDSL) public {
        _mustDelegateCall(_ctxProgram, _ctxDSL, 'compound');
    }

    /**
     * Sub-command of Compound V2. Makes a deposit tokens to Compound V2
     * @param _ctxProgram ProgramContext contract address
     */
    function opCompoundDeposit(address _ctxProgram, address) public {
        address payable token = payable(OpcodeHelpers.getAddress(_ctxProgram));
        bytes memory data = OpcodeHelpers.mustCall(
            IProgramContext(_ctxProgram).appAddr(),
            abi.encodeWithSignature('compounds(address)', token)
        );
        address cToken = address(uint160(uint256(bytes32(data))));
        uint256 balance = IERC20(token).balanceOf(address(this));
        // approve simple token to use it into the market
        IERC20(token).approve(cToken, balance);
        // supply assets into the market and receives cTokens in exchange
        IcToken(cToken).mint(balance);
        OpcodeHelpers.putToStack(_ctxProgram, 1);
    }

    /**
     * Sub-command of Compound V2. Makes a deposit funds to Compound V2
     * for native coin
     * @param _ctxProgram ProgramContext contract address
     */
    function opCompoundDepositNative(address _ctxProgram, address) public {
        address payable token = payable(OpcodeHelpers.getAddress(_ctxProgram));
        bytes memory data = OpcodeHelpers.mustCall(
            IProgramContext(_ctxProgram).appAddr(),
            abi.encodeWithSignature('compounds(address)', token)
        );
        address cToken = address(uint160(uint256(bytes32(data))));
        // TODO: check with Misha the architechture.
        // Native coin does not have underling token
        // tx example: https://goerli.etherscan.io/tx/0x961e5af434ef2804d4dc63f13ddee418b520884bffe383e3591610299ef9807e
        // adresses: https://docs.compound.finance/v2/#networks

        // supply assets into the market and receives cTokens in exchange
        IcTokenNative(cToken).mint{ value: address(this).balance }();
        OpcodeHelpers.putToStack(_ctxProgram, 1);
    }

    /**
     * Sub-command of Compound V2. Makes a withdrawal of all funds to Compound V2
     * @param _ctxProgram ProgramContext contract address
     */
    function opCompoundWithdrawMax(address _ctxProgram, address) public {
        address payable token = payable(OpcodeHelpers.getAddress(_ctxProgram));
        bytes memory data = OpcodeHelpers.mustCall(
            IProgramContext(_ctxProgram).appAddr(),
            abi.encodeWithSignature('compounds(address)', token)
        );
        address cToken = address(uint160(uint256(bytes32(data))));
        uint256 balance = IcToken(cToken).balanceOf(address(this));
        require(balance > 0, ErrorsCompoundOpcodes.COP1);
        IcToken(cToken).redeem(balance - 1);
        OpcodeHelpers.putToStack(_ctxProgram, 1);
    }

    /**
     * Sub-command of Compound V2. Makes a withdrawal funds to Compound V2
     * @param _ctxProgram ProgramContext contract address
     */
    function opCompoundWithdraw(address _ctxProgram) public {
        address payable token = payable(OpcodeHelpers.getAddress(_ctxProgram));
        // `token` can be used in the future for more different underluing tokens
        bytes memory data = OpcodeHelpers.mustCall(
            IProgramContext(_ctxProgram).appAddr(),
            abi.encodeWithSignature('compounds(address)', token)
        );
        bytes32 withdrawNameB32 = OpcodeHelpers.getNextBytes32(_ctxProgram, 4);
        bytes memory withdrawValue = OpcodeHelpers.mustCall(
            IProgramContext(_ctxProgram).appAddr(),
            abi.encodeWithSignature(
                'getStorageUint(bytes32)',
                withdrawNameB32 // withdraw value name
            )
        );
        address cToken = address(uint160(uint256(bytes32(data))));

        // redeems cTokens in exchange for the underlying asset (USDC)
        // amount - amount of cTokens
        IcToken(cToken).redeem(uint256(bytes32(withdrawValue)));

        OpcodeHelpers.putToStack(_ctxProgram, 1);
    }

    /**
     * TODO: might need to be removed
     * Sub-command of Compound V2. Makes a barrow of all USDC on cUSDC
     * @param _ctxProgram ProgramContext contract address
     */
    function opCompoundBorrowMax(address _ctxProgram, address) public {
        /*
        address comptrl = 0x05Df6C772A563FfB37fD3E04C1A279Fb30228621;
        address payable token = payable(OpcodeHelpers.getAddress(_ctxProgram));
        address payable borrowToken = payable(OpcodeHelpers.getAddress(_ctxProgram));
        // `token` can be used in the future for more different underluing tokens
        bytes memory data = OpcodeHelpers.mustCall(
            IProgramContext(_ctxProgram).appAddr(),
            abi.encodeWithSignature('compounds(address)', token)
        );
        bytes memory borrowCTokendata = OpcodeHelpers.mustCall(
            IProgramContext(_ctxProgram).appAddr(),
            abi.encodeWithSignature('compounds(address)', borrowToken)
        );
        address cToken = address(uint160(uint256(bytes32(data))));
        address borrowCToken = address(uint160(uint256(bytes32(borrowCTokendata))));
        console.log('token');
        console.log(token);
        console.log('borrowToken');
        console.log(borrowToken);
        console.log('cToken');
        console.log(cToken);
        console.log('borrowCToken');
        console.log(borrowCToken);
        uint256 balance = IcToken(cToken).balanceOf(address(this));
        // approve simple token to use it into the market
        IcToken(cToken).approve(borrowCToken, balance);
        uint256 numWeiToBorrow = (balance * 8) / 100; // 80% of balance
        // Borrow, then check the underlying balance for this contract's address
        address[] memory cTokens = new address[](2);
        cTokens[0] = cToken;
        cTokens[1] = borrowCToken;
        IComptroller(comptrl).enterMarkets(cTokens);
        uint256 kkk = IcToken(borrowCToken).balanceOf(address(this));
        console.log(kkk);
        uint256 borrows = IcToken(borrowCToken).borrowBalanceCurrent(address(this));
        */
        OpcodeHelpers.putToStack(_ctxProgram, 1 /* borrows*/);
    }

    /**
     * Sub-command of Compound V2. Makes a borrow from market
     * @param _ctxProgram ProgramContext contract address
     */
    function opCompoundBorrow(address _ctxProgram, address) public {
        // address compt = 0x3cBe63aAcF6A064D32072a630A3eab7545C54d78;
        address payable token = payable(OpcodeHelpers.getAddress(_ctxProgram));
        address payable borrowToken = payable(OpcodeHelpers.getAddress(_ctxProgram));
        uint256 borrowAmount = OpcodeHelpers.getUint256(_ctxProgram, address(0));

        // fixme: OH1 error occured
        // bytes memory data = OpcodeHelpers.mustCall(
        //     IProgramContext(_ctxProgram).appAddr(),
        //     abi.encodeWithSignature('unitroller')
        // );
        // address unitroller = address(uint160(uint256(bytes32(data))));

        address unitroller = 0x3cBe63aAcF6A064D32072a630A3eab7545C54d78;

        // `token` can be used in the future for more different underluing tokens
        bytes memory data = OpcodeHelpers.mustCall(
            IProgramContext(_ctxProgram).appAddr(),
            abi.encodeWithSignature('compounds(address)', token)
        );
        address cToken = address(uint160(uint256(bytes32(data))));
        data = OpcodeHelpers.mustCall(
            IProgramContext(_ctxProgram).appAddr(),
            abi.encodeWithSignature('compounds(address)', borrowToken)
        );
        address borrowCToken = address(uint160(uint256(bytes32(data))));
        // Borrow, then check the underlying balance for this contract's address
        address[] memory cTokens = new address[](1);
        cTokens[0] = cToken;
        // fixme: no need to enter more then one time. check with `markets.isListed`
        IComptroller(unitroller).enterMarkets(cTokens);
        IcToken(borrowCToken).borrow(borrowAmount); // < should be 80% of borrow token
        // Attention!!! borrowAmount is NOT cTOKEN

        OpcodeHelpers.putToStack(_ctxProgram, 1);
    }

    function opCompoundRepayNativeMax(address _ctxProgram, address) public {
        address maximillion = 0xD4936082B4F93D9D2B79418765854A00f320Defb;

        // fixme: OH1 error occured
        // bytes memory data = OpcodeHelpers.mustCall(
        //     IProgramContext(_ctxProgram).appAddr(),
        //     abi.encodeWithSignature('maximillion')
        // );
        // address maximillion = address(uint160(uint256(bytes32(data))));

        IMaximillion(maximillion).repayBehalf{ value: address(this).balance }(address(this));
        OpcodeHelpers.putToStack(_ctxProgram, 1);
    }

    function opCompoundRepayNative(address _ctxProgram, address) public {
        address maximillion = 0xD4936082B4F93D9D2B79418765854A00f320Defb;

        // fixme: OH1 error occured
        // bytes memory data = OpcodeHelpers.mustCall(
        //     IProgramContext(_ctxProgram).appAddr(),
        //     abi.encodeWithSignature('maximillion')
        // );
        // address maximillion = address(uint160(uint256(bytes32(data))));
        uint256 repayAmount = OpcodeHelpers.getUint256(_ctxProgram, address(0));
        IMaximillion(maximillion).repayBehalf{ value: repayAmount }(address(this));
        OpcodeHelpers.putToStack(_ctxProgram, 1);
    }

    function opCompoundRepayMax(address _ctxProgram, address) public {
        address payable token = payable(OpcodeHelpers.getAddress(_ctxProgram));
        // `token` can be used in the future for more different underluing tokens
        bytes memory data = OpcodeHelpers.mustCall(
            IProgramContext(_ctxProgram).appAddr(),
            abi.encodeWithSignature('compounds(address)', token)
        );

        address cToken = address(uint160(uint256(bytes32(data))));
        uint256 repayAmount = IERC20(token).balanceOf(address(this));
        IERC20(token).approve(cToken, repayAmount);
        IcToken(cToken).repayBorrow(repayAmount);

        OpcodeHelpers.putToStack(_ctxProgram, 1);
    }

    function opCompoundRepay(address _ctxProgram, address) public {
        address payable token = payable(OpcodeHelpers.getAddress(_ctxProgram));
        // `token` can be used in the future for more different underluing tokens
        bytes memory data = OpcodeHelpers.mustCall(
            IProgramContext(_ctxProgram).appAddr(),
            abi.encodeWithSignature('compounds(address)', token)
        );

        uint256 repayAmount = OpcodeHelpers.getUint256(_ctxProgram, address(0));
        address cToken = address(uint160(uint256(bytes32(data))));
        IERC20(token).approve(cToken, repayAmount);
        IcToken(cToken).repayBorrow(repayAmount);

        OpcodeHelpers.putToStack(_ctxProgram, 1);
    }

    /**
     * @dev Makes a delegate call and ensures it is successful
     * @param _ctxProgram ProgramContext contract address
     * @param _ctxDSL DSLContext contract address
     * @param _opcode Opcode string
     */
    function _mustDelegateCall(
        address _ctxProgram,
        address _ctxDSL,
        string memory _opcode
    ) internal {
        address libAddr = IDSLContext(_ctxDSL).otherOpcodes();
        bytes4 _selector = OpcodeHelpers.nextBranchSelector(_ctxDSL, _ctxProgram, _opcode);
        OpcodeHelpers.mustDelegateCall(
            libAddr,
            abi.encodeWithSelector(_selector, _ctxProgram, _ctxDSL)
        );
    }
}
