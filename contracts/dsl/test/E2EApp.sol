// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.0;

import { Preprocessor } from '../Preprocessor.sol';
import { ParserMock } from '../mocks/ParserMock.sol';
import { IContext } from '../interfaces/IContext.sol';
import { Executor } from '../libs/Executor.sol';
import { LinkedList } from '../helpers/LinkedList.sol';
import { UnstructuredStorageMock } from '../mocks/UnstructuredStorageMock.sol';

// import "hardhat/console.sol";

contract E2EApp is UnstructuredStorageMock, LinkedList {
    address public preprocessor;
    address public parser;
    address public context;

    // solhint-disable-next-line no-empty-blocks
    receive() external payable {}

    constructor(
        address _parserAddr,
        address _preprAddr,
        address _ctx
    ) {
        parser = _parserAddr;
        preprocessor = _preprAddr;
        context = _ctx;
        setupContext();
    }

    function parse(string memory _program) external {
        ParserMock(parser).parse(preprocessor, context, _program);
    }

    function parseCode(string[] memory _code) external {
        ParserMock(parser).parseCodeExt(context, _code);
    }

    function execute() external payable {
        IContext(context).setMsgValue(msg.value);
        Executor.execute(context);
    }

    function setupContext() internal {
        IContext(context).setMsgSender(msg.sender);
    }
}
