// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.0;

import { IParser } from '../interfaces/IParser.sol';
import { IContext } from '../interfaces/IContext.sol';
import { Executor } from '../libs/Executor.sol';
import { StringUtils } from '../libs/StringUtils.sol';
import { UnstructuredStorage } from '../../dsl/libs/UnstructuredStorage.sol';

// import "hardhat/console.sol";

// TODO: do we need this contract actually? Will it be usable after making Roles?
contract App {
    using UnstructuredStorage for bytes32;
    using StringUtils for string;

    address public parser;
    address public ctx;
    address public preprocessor;

    // solhint-disable-next-line no-empty-blocks
    receive() external payable {}

    constructor(
        address _parser,
        address _ctx,
        address _preprocessor
    ) {
        parser = _parser;
        ctx = _ctx;
        preprocessor = _preprocessor;
        _setupContext();
    }

    function setStorageUint256(bytes32 position, uint256 data) public {
        position.setStorageUint256(data);
    }

    function parse(string memory _program) external {
        IParser(parser).parse(preprocessor, ctx, _program);
    }

    function execute() external payable {
        IContext(ctx).setMsgValue(msg.value);
        Executor.execute(ctx);
    }

    function _setupContext() internal {
        IContext(ctx).setMsgSender(msg.sender);
    }
}
