/**
 * (c) 2023 Pairwyse Foundation.  All Rights Reserved.
 * 
 * For LICENSE details, please visit:
 * https://github.com/akiva-capital-holdings/pairwyse-dsl/blob/master/LICENSE
 *
 */
 
pragma solidity ^0.8.0;

import { IProgramContext } from '../../interfaces/IProgramContext.sol';
import { IERC20 } from '../../interfaces/IERC20.sol';
import { StringUtils } from '../StringUtils.sol';
import { UnstructuredStorage } from '../UnstructuredStorage.sol';
import { OpcodeHelpers } from './OpcodeHelpers.sol';
import { ErrorsGeneralOpcodes } from '../Errors.sol';

// import 'hardhat/console.sol';

/**
 * @title Comparator operator opcodes
 * @notice Opcodes for comparator operators such as >, <, =, !, etc.
 */
library ComparisonOpcodes {
    using UnstructuredStorage for bytes32;
    using StringUtils for string;

    /**
     * @dev Compares two values in the stack. Put 1 to the stack if they are equal.
     * @param _ctxProgram Context contract address
     */
    function opEq(address _ctxProgram, address) public {
        uint256 last = IProgramContext(_ctxProgram).stack().pop();
        uint256 prev = IProgramContext(_ctxProgram).stack().pop();
        IProgramContext(_ctxProgram).stack().push(last == prev ? 1 : 0);
    }

    /**
     * @dev Compares two values in the stack. Put 1 to the stack if they are not equal.
     * @param _ctxProgram Context contract address
     */
    function opNotEq(address _ctxProgram, address) public {
        uint256 last = IProgramContext(_ctxProgram).stack().pop();
        uint256 prev = IProgramContext(_ctxProgram).stack().pop();
        OpcodeHelpers.putToStack(_ctxProgram, last != prev ? 1 : 0);
    }

    /**
     * @dev Compares two values in the stack. Put 1 to the stack if value1 < value2
     * @param _ctxProgram Context contract address
     */
    function opLt(address _ctxProgram, address) public {
        uint256 last = IProgramContext(_ctxProgram).stack().pop();
        uint256 prev = IProgramContext(_ctxProgram).stack().pop();
        OpcodeHelpers.putToStack(_ctxProgram, prev < last ? 1 : 0);
    }

    /**
     * @dev Compares two values in the stack. Put 1 to the stack if value1 > value2
     * @param _ctxProgram Context contract address
     */
    function opGt(address _ctxProgram, address) public {
        opSwap(_ctxProgram, address(0));
        opLt(_ctxProgram, address(0));
    }

    /**
     * @dev Compares two values in the stack. Put 1 to the stack if value1 <= value2
     * @param _ctxProgram Context contract address
     */
    function opLe(address _ctxProgram, address) public {
        opGt(_ctxProgram, address(0));
        opNot(_ctxProgram, address(0));
    }

    /**
     * @dev Compares two values in the stack. Put 1 to the stack if value1 >= value2
     * @param _ctxProgram Context contract address
     */
    function opGe(address _ctxProgram, address) public {
        opLt(_ctxProgram, address(0));
        opNot(_ctxProgram, address(0));
    }

    /**
     * @dev Revert last value in the stack
     * @param _ctxProgram Context contract address
     */
    function opNot(address _ctxProgram, address) public {
        uint256 last = IProgramContext(_ctxProgram).stack().pop();
        OpcodeHelpers.putToStack(_ctxProgram, last == 0 ? 1 : 0);
    }

    /**
     * @dev Swaps two last element in the stack
     * @param _ctxProgram Context contract address
     */
    function opSwap(address _ctxProgram, address) public {
        uint256 last = IProgramContext(_ctxProgram).stack().pop();
        uint256 prev = IProgramContext(_ctxProgram).stack().pop();
        IProgramContext(_ctxProgram).stack().push(last);
        IProgramContext(_ctxProgram).stack().push(prev);
    }
}
