// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.0;

import { IParser } from '../interfaces/IParser.sol';
import { IContext } from '../interfaces/IContext.sol';
import { Executor } from '../libs/Executor.sol';
import { StringUtils } from '../libs/StringUtils.sol';
import { LinkedList } from '../helpers/LinkedList.sol';
import { UnstructuredStorageMock } from '../mocks/UnstructuredStorageMock.sol';

// import 'hardhat/console.sol';

// TODO: do we need this contract actually? Will it be usable after making Roles?
contract App is UnstructuredStorageMock, LinkedList {
    using StringUtils for string;

    address public parser;
    address public ctx;
    address public preprocessor;

    // solhint-disable-next-line no-empty-blocks
    receive() external payable {}

    constructor(
        address _parser,
        address _preprocessor,
        address _ctx
    ) {
        parser = _parser;
        preprocessor = _preprocessor;
        ctx = _ctx;
        _setupContext();
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
