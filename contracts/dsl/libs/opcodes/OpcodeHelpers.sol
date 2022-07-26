// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.0;

import { IContext } from '../../interfaces/IContext.sol';
import { IStorage } from '../../interfaces/IStorage.sol';
import { IERC20 } from '../../interfaces/IERC20.sol';
import { StringUtils } from '../StringUtils.sol';
import { UnstructuredStorage } from '../UnstructuredStorage.sol';
import { OpcodeHelpers } from './OpcodeHelpers.sol';
import { StackValue } from '../../helpers/Stack.sol';

// import 'hardhat/console.sol';

/**
 * @title Opcode helper functions
 * @notice Opcode helper functions that are used in other opcode libraries
 * @dev Opcode libraries are: ComparisonOpcodes, BranchingOpcodes, LogicalOpcodes, and OtherOpcodes
 */
library OpcodeHelpers {
    using UnstructuredStorage for bytes32;
    using StringUtils for string;

    function putToStack(IContext _ctx, uint256 _value) public {
        StackValue resultValue = new StackValue();
        resultValue.setUint256(_value);
        _ctx.stack().push(resultValue);
    }

    // TODO: will be used these functions in the future?

    // function putToStack(IContext _ctx, string memory _value) public {
    //     StackValue resultValue = new StackValue();
    //     resultValue.setString(_value);
    //     _ctx.stack().push(resultValue);
    // }

    // function putToStack(IContext _ctx, address _value) public {
    //     StackValue resultValue = new StackValue();
    //     resultValue.setAddress(_value);
    //     _ctx.stack().push(resultValue);
    // }

    function nextBytes(IContext _ctx, uint256 size) public returns (bytes memory out) {
        out = _ctx.programAt(_ctx.pc(), size);
        _ctx.incPc(size);
    }

    function nextBytes1(IContext _ctx) public returns (bytes1) {
        return nextBytes(_ctx, 1)[0];
    }

    function nextBranchSelector(IContext _ctx, string memory baseOpName) public returns (bytes4) {
        bytes1 branchCode = nextBytes1(_ctx);
        return _ctx.branchSelectors(baseOpName, branchCode);
    }

    function mustCall(address addr, bytes memory data) public {
        (bool success, ) = addr.delegatecall(data);
        require(success, 'Opcodes: mustCall call not success');
    }

    function getNextBytes(IContext _ctx, uint256 _bytesNum) public returns (bytes32 varNameB32) {
        bytes memory varName = nextBytes(_ctx, _bytesNum);

        // Convert bytes to bytes32
        assembly {
            varNameB32 := mload(add(varName, 0x20))
        }
    }
}
