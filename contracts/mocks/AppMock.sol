// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.0;

import { Parser } from "../Parser.sol";
import { Context } from "../Context.sol";
import { Executor } from "../Executor.sol";
import { Storage } from "../helpers/Storage.sol";

// import "hardhat/console.sol";

contract AppMock is Storage {
    Parser public parser;
    Executor public executor;

    receive() external payable {
        payable(parser.opcodes()).transfer(msg.value);
    }

    constructor(Parser _parser, Executor _executor) {
        parser = _parser;
        executor = _executor;
    }

    function parse(Context _ctx, string memory _program) external {
        parser.initOpcodes(_ctx);
        _ctx.setAppAddress(address(this));
        _ctx.setMsgSender(msg.sender);
        parser.parse(_ctx, _program);
    }

    function execute(Context _ctx) external {
        executor.execute(_ctx);
    }
}
