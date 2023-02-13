// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.0;

import { IDSLContext } from '../../interfaces/IDSLContext.sol';
import { IProgramContext } from '../../interfaces/IProgramContext.sol';
import { IERC20 } from '../../interfaces/IERC20.sol';
// import { IcToken } from '../../interfaces/IcToken.sol';
import { IERC20Mintable } from '../../interfaces/IERC20Mintable.sol';
import { StringUtils } from '../StringUtils.sol';
import { UnstructuredStorage } from '../UnstructuredStorage.sol';
import { OpcodeHelpers } from './OpcodeHelpers.sol';
import { ErrorsGeneralOpcodes } from '../Errors.sol';

// import 'hardhat/console.sol';

library OtherOpcodes {
    using UnstructuredStorage for bytes32;
    using StringUtils for string;

    function opBlockNumber(address _ctxProgram, address) public {
        OpcodeHelpers.putToStack(_ctxProgram, block.number);
    }

    function opBlockTimestamp(address _ctxProgram, address) public {
        OpcodeHelpers.putToStack(_ctxProgram, block.timestamp);
    }

    function opBlockChainId(address _ctxProgram, address) public {
        OpcodeHelpers.putToStack(_ctxProgram, block.chainid);
    }

    function opMsgSender(address _ctxProgram, address) public {
        OpcodeHelpers.putToStack(
            _ctxProgram,
            uint256(uint160(IProgramContext(_ctxProgram).msgSender()))
        );
    }

    function opMsgValue(address _ctxProgram, address) public {
        OpcodeHelpers.putToStack(
            _ctxProgram,
            uint256(uint160(IProgramContext(_ctxProgram).msgValue()))
        );
    }

    /**
     * @dev Sets boolean variable in the application contract.
     * The value of bool variable is taken from DSL code itself
     * @param _ctxProgram ProgramContext contract address
     */
    function opSetLocalBool(address _ctxProgram, address) public {
        bytes32 _varNameB32 = OpcodeHelpers.getNextBytes32(_ctxProgram, 4);
        bytes memory data = OpcodeHelpers.getNextBytes(_ctxProgram, 1);
        bool _boolVal = uint8(data[0]) == 1;
        // Set local variable by it's hex
        OpcodeHelpers.mustCall(
            IProgramContext(_ctxProgram).appAddr(),
            abi.encodeWithSignature('setStorageBool(bytes32,bool)', _varNameB32, _boolVal)
        );
        OpcodeHelpers.putToStack(_ctxProgram, 1);
    }

    /**
     * @dev Sets uint256 variable in the application contract. The value of the variable is taken from stack
     * @param _ctxProgram ProgramContext contract address
     */
    function opSetUint256(address _ctxProgram, address) public {
        bytes32 _varNameB32 = OpcodeHelpers.getNextBytes32(_ctxProgram, 4);
        uint256 _val = IProgramContext(_ctxProgram).stack().pop();

        // Set local variable by it's hex
        OpcodeHelpers.mustCall(
            IProgramContext(_ctxProgram).appAddr(),
            abi.encodeWithSignature('setStorageUint256(bytes32,uint256)', _varNameB32, _val)
        );
        OpcodeHelpers.putToStack(_ctxProgram, 1);
    }

    function opLoadLocalUint256(address _ctxProgram, address) public {
        opLoadLocal(_ctxProgram, 'getStorageUint256(bytes32)');
    }

    function opLoadLocalAddress(address _ctxProgram, address) public {
        opLoadLocal(_ctxProgram, 'getStorageAddress(bytes32)');
    }

    function opBool(address _ctxProgram, address) public {
        bytes memory data = OpcodeHelpers.getNextBytes(_ctxProgram, 1);
        OpcodeHelpers.putToStack(_ctxProgram, uint256(uint8(data[0])));
    }

    function opUint256(address _ctxProgram, address) public {
        OpcodeHelpers.putToStack(_ctxProgram, OpcodeHelpers.getUint256(_ctxProgram, address(0)));
    }

    function opSendEth(address _ctxProgram, address) public {
        address payable recipient = payable(OpcodeHelpers.getAddress(_ctxProgram));
        uint256 amount = OpcodeHelpers.getUint256(_ctxProgram, address(0));
        recipient.transfer(amount);
        OpcodeHelpers.putToStack(_ctxProgram, 1);
    }

    /****************
     * ERC20 Tokens *
     ***************/

    /**
     * @dev Calls IER20 transfer() function and puts to stack `1`
     * @param _ctxProgram ProgramContext contract address
     */
    function opTransfer(address _ctxProgram, address) public {
        address payable token = payable(OpcodeHelpers.getAddress(_ctxProgram));
        address payable recipient = payable(OpcodeHelpers.getAddress(_ctxProgram));
        uint256 amount = OpcodeHelpers.getUint256(_ctxProgram, address(0));
        IERC20(token).transfer(recipient, amount);
        OpcodeHelpers.putToStack(_ctxProgram, 1);
    }

    function opTransferVar(address _ctxProgram, address) public {
        address payable token = payable(OpcodeHelpers.getAddress(_ctxProgram));
        address payable recipient = payable(OpcodeHelpers.getAddress(_ctxProgram));
        uint256 amount = uint256(
            OpcodeHelpers.getLocalVar(_ctxProgram, 'getStorageUint256(bytes32)')
        );
        IERC20(token).transfer(recipient, amount);
        OpcodeHelpers.putToStack(_ctxProgram, 1);
    }

    function opTransferFrom(address _ctxProgram, address) public {
        address payable token = payable(OpcodeHelpers.getAddress(_ctxProgram));
        address payable from = payable(OpcodeHelpers.getAddress(_ctxProgram));
        address payable to = payable(OpcodeHelpers.getAddress(_ctxProgram));
        uint256 amount = OpcodeHelpers.getUint256(_ctxProgram, address(0));
        IERC20(token).transferFrom(from, to, amount);
        OpcodeHelpers.putToStack(_ctxProgram, 1);
    }

    function opTransferFromVar(address _ctxProgram, address) public {
        address payable token = payable(OpcodeHelpers.getAddress(_ctxProgram));
        address payable from = payable(OpcodeHelpers.getAddress(_ctxProgram));
        address payable to = payable(OpcodeHelpers.getAddress(_ctxProgram));
        uint256 amount = uint256(
            OpcodeHelpers.getLocalVar(_ctxProgram, 'getStorageUint256(bytes32)')
        );

        IERC20(token).transferFrom(from, to, amount);
        OpcodeHelpers.putToStack(_ctxProgram, 1);
    }

    function opBalanceOf(address _ctxProgram, address) public {
        address payable token = payable(OpcodeHelpers.getAddress(_ctxProgram));
        address payable user = payable(OpcodeHelpers.getAddress(_ctxProgram));
        OpcodeHelpers.putToStack(_ctxProgram, IERC20(token).balanceOf(user));
    }

    function opAllowance(address _ctxProgram, address) public {
        address payable token = payable(OpcodeHelpers.getAddress(_ctxProgram));
        address payable owner = payable(OpcodeHelpers.getAddress(_ctxProgram));
        address payable spender = payable(OpcodeHelpers.getAddress(_ctxProgram));
        uint256 allowance = IERC20(token).allowance(owner, spender);
        OpcodeHelpers.putToStack(_ctxProgram, allowance);
    }

    function opMint(address _ctxProgram, address) public {
        address payable token = payable(OpcodeHelpers.getAddress(_ctxProgram));
        address payable to = payable(OpcodeHelpers.getAddress(_ctxProgram));
        uint256 amount = uint256(
            OpcodeHelpers.getLocalVar(_ctxProgram, 'getStorageUint256(bytes32)')
        );
        IERC20Mintable(token).mint(to, amount);
        OpcodeHelpers.putToStack(_ctxProgram, 1);
    }

    function opBurn(address _ctxProgram, address) public {
        address payable token = payable(OpcodeHelpers.getAddress(_ctxProgram));
        address payable to = payable(OpcodeHelpers.getAddress(_ctxProgram));
        uint256 amount = uint256(
            OpcodeHelpers.getLocalVar(_ctxProgram, 'getStorageUint256(bytes32)')
        );
        IERC20Mintable(token).burn(to, amount);
        OpcodeHelpers.putToStack(_ctxProgram, 1);
    }

    /********************
     * end ERC20 Tokens *
     *******************/

    function opAddressGet(address _ctxProgram, address) public returns (address) {
        bytes32 contractAddrB32 = OpcodeHelpers.getNextBytes32(_ctxProgram, 20);
        /**
         * Shift bytes to the left so that
         * 0xe7f1725e7734ce288f8367e1bb143e90bb3f0512000000000000000000000000
         * transforms into
         * 0x000000000000000000000000e7f1725e7734ce288f8367e1bb143e90bb3f0512
         * This is needed to later conversion from bytes32 to address
         */
        contractAddrB32 >>= 96;

        return address(uint160(uint256(contractAddrB32)));
    }

    function opLoadLocal(address _ctxProgram, string memory funcSignature) public {
        bytes32 result = OpcodeHelpers.getLocalVar(_ctxProgram, funcSignature);

        OpcodeHelpers.putToStack(_ctxProgram, uint256(result));
    }

    function opEnableRecord(address _ctxProgram, address) public {
        uint256 recordId = uint256(
            OpcodeHelpers.getLocalVar(_ctxProgram, 'getStorageUint256(bytes32)')
        );
        address payable contractAddr = payable(OpcodeHelpers.getAddress(_ctxProgram));

        OpcodeHelpers.mustCall(
            contractAddr,
            abi.encodeWithSignature('activateRecord(uint256)', recordId)
        );
        OpcodeHelpers.putToStack(_ctxProgram, 1);
    }
}
