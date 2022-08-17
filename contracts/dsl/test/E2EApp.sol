// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.0;

import { Preprocessor } from '../Preprocessor.sol';
import { IParserMock } from '../interfaces/IParserMock.sol';
import { IContext } from '../interfaces/IContext.sol';
import { Executor } from '../libs/Executor.sol';

// import { Storage } from '../helpers/Storage.sol';

// import "hardhat/console.sol";

// TODO: do we need this contract actually? Will it be usable after making Roles?
contract E2EApp {
    address public preprocessor;
    address public parser;
    address public context;

    // solhint-disable-next-line no-empty-blocks
    receive() external payable {}

    constructor(
        address _preprAddr,
        address _parserAddr,
        address _ctx
    ) {
        preprocessor = _preprAddr;
        parser = _parserAddr;
        context = _ctx;
        setupContext();
    }

    function parse(string memory _program) external {
        IParserMock(parser).parse(preprocessor, context, _program);
    }

    function parseCode(string[] memory _code) external {
        IParserMock(parser).parseCodeExt(context, _code);
    }

    function execute() external payable {
        IContext(context).setMsgValue(msg.value);
        Executor.execute(context);
    }

    function setupContext() internal {
        IContext(context).setMsgSender(msg.sender);
    }
}
