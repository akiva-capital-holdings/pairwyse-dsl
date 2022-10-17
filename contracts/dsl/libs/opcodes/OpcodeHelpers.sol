// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.0;

import { IContext } from '../../interfaces/IContext.sol';
import { StringUtils } from '../StringUtils.sol';
import { UnstructuredStorage } from '../UnstructuredStorage.sol';
import { ErrorsOpcodeHelpers } from '../Errors.sol';

// import 'hardhat/console.sol';

/**
 * @title Opcode helper functions
 * @notice Opcode helper functions that are used in other opcode libraries
 * @dev Opcode libraries are: ComparisonOpcodes, BranchingOpcodes, LogicalOpcodes, and OtherOpcodes
 */
library OpcodeHelpers {
    using UnstructuredStorage for bytes32;
    using StringUtils for string;

    // TODO: get rid of putToStack function
    function putToStack(address _ctx, uint256 _value) public {
        IContext(_ctx).stack().push(_value);
    }

    function nextBytes(address _ctx, uint256 size) public returns (bytes memory out) {
        out = IContext(_ctx).programAt(IContext(_ctx).pc(), size);
        IContext(_ctx).incPc(size);
    }

    function nextBytes1(address _ctx) public returns (bytes1) {
        return nextBytes(_ctx, 1)[0];
    }

    function readBytesSlice(
        address _ctx,
        uint256 start,
        uint256 end
    ) public view returns (bytes32 resB32) {
        bytes memory slice = IContext(_ctx).programAt(start, end - start);
        // Convert bytes to bytes32
        assembly {
            resB32 := mload(add(slice, 0x20))
        }
    }

    function nextBranchSelector(address _ctx, string memory baseOpName) public returns (bytes4) {
        bytes1 branchCode = nextBytes1(_ctx);
        return IContext(_ctx).branchSelectors(baseOpName, branchCode);
    }

    function mustCall(address addr, bytes memory data) public {
        (bool success, ) = addr.delegatecall(data);
        require(success, ErrorsOpcodeHelpers.OPH1);
    }

    function getNextBytes(address _ctx, uint256 _bytesNum) public returns (bytes32 varNameB32) {
        bytes memory varName = nextBytes(_ctx, _bytesNum);

        // Convert bytes to bytes32
        assembly {
            varNameB32 := mload(add(varName, 0x20))
        }
    }
}
