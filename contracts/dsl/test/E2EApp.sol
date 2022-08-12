// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.0;

import { Preprocessor } from '../Preprocessor.sol';
import { ParserMock } from '../mocks/ParserMock.sol';
import { IContext } from '../interfaces/IContext.sol';
import { Executor } from '../libs/Executor.sol';
import { Storage } from '../helpers/Storage.sol';

// import "hardhat/console.sol";

contract E2EApp is Storage {
    ParserMock public parser;
    IContext public ctx;
    address public preprAddr;

    // solhint-disable-next-line no-empty-blocks
    receive() external payable {}

    constructor(
        address _preprAddr,
        ParserMock _parser,
        IContext _ctx
    ) {
        preprAddr = _preprAddr;
        parser = _parser;
        ctx = _ctx;
        setupContext();
    }

    function parse(string memory _program) external {
        parser.parse(preprAddr, address(ctx), _program);
    }

    function parseCode(string[] memory _code) external {
        parser.parseCodeExt(address(ctx), _code);
    }

    function execute() external payable {
        ctx.setMsgValue(msg.value);
        Executor.execute(address(ctx));
    }

    function setupContext() internal {
        ctx.initOpcodes();
        ctx.setAppAddress(address(this));
        ctx.setMsgSender(msg.sender);
    }
}
