//SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.0;

import "../Parser.sol";

contract ParserMock is Parser {
  function parseCode(string[] memory code) public override {
        delete program;
        cmdIdx = 0;
        cmds = code;
        // ctx.stack().clean();
        // ctx.setPc(0);

        while(cmdIdx < cmds.length) {
            parseOpcodeWithParams();
        }

        ctx.setProgram(program);
    }

    function reset() public {
        ctx.stack().clean();
        ctx.setPc(0);
    }
}
