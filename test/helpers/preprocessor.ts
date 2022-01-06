import { expect } from "chai";
import { ethers } from "hardhat";
import { Preprocessor } from "../../typechain";
import { Testcase } from "../types";

describe("Preprocessor", () => {
  let app: Preprocessor;

  const transform = (expr: string) => expr
    .replaceAll("(", "@(@")
    .replaceAll(")", "@)@")
    .split(/[@ \n]/g)
    .filter((x: string) => !!x);

  before(async () => {
    app = await (await ethers.getContractFactory("Preprocessor")).deploy();
  });

  const tests: Testcase[] = [
    {
      name: "simple",
      expr: "loadLocal address SENDER == msgSender",
      expected: ["loadLocal", "address", "SENDER", "msgSender", "=="],
    },
    {
      name: "complex",
      expr: `
      blockTimestamp > loadLocal uint256 INIT
        and
      blockTimestamp < loadLocal uint256 EXPIRY
        or
      loadLocal bool RISK != bool true
    `,
      expected: [
        "blockTimestamp",
        "loadLocal",
        "uint256",
        "INIT",
        ">", // A

        "blockTimestamp",
        "loadLocal",
        "uint256",
        "EXPIRY",
        "<", // B

        "and",

        "loadLocal",
        "bool",
        "RISK",
        "bool",
        "true",
        "!=", // C

        "or",
      ],
    },
    {
      name: "parenthesis",
      expr: "(((uint256 1 or uint256 5) or uint256 7) and uint256 0)",
      expected: ["uint256", "1", "uint256", "5", "or", "uint256", "7", "or", "uint256", "0", "and"],
    },
  ];

  function testit({ name, expr, expected }: Testcase) {
    it(name, async () => {
      const inputArr = transform(expr);
      const res = await app.callStatic.infixToPostfix(inputArr);
      expect(res).to.eql(expected);
    });
  }

  tests.forEach((testcase) => testit(testcase));
});
