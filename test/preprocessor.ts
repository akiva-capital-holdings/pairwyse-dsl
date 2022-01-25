import { expect } from "chai";
import { ethers } from "hardhat";
import { Preprocessor } from "../typechain";
import { Testcase } from "./types";

describe("Preprocessor", () => {
  let app: Preprocessor;

  const jsTransform = (expr: string) =>
    expr
      .replaceAll("(", "@(@")
      .replaceAll(")", "@)@")
      .split(/[@ \n]/g)
      .filter((x: string) => !!x);

  before(async () => {
    // Deploy StringUtils library
    const stringLib = await (await ethers.getContractFactory("StringUtils")).deploy();

    // Deploy Preprocessor
    app = await (
      await ethers.getContractFactory("Preprocessor", { libraries: { StringUtils: stringLib.address } })
    ).deploy();

    // Setup operators & priorities
    await app.addOperator("!", 4);

    await app.addOperator("swap", 3);
    await app.addOperator("and", 3);

    await app.addOperator("xor", 2);
    await app.addOperator("or", 2);

    await app.addOperator("==", 1);
    await app.addOperator("<", 1);
    await app.addOperator(">", 1);
    await app.addOperator("<=", 1);
    await app.addOperator(">=", 1);
    await app.addOperator("!=", 1);
  });

  describe("infix to postfix", () => {
    const tests: Testcase[] = [
      {
        name: "simple",
        expr: "loadLocal address SENDER == msgSender",
        expected: ["loadLocal", "address", "SENDER", "msgSender", "=="],
      },
      {
        name: "complex",
        expr: `
        (blockTimestamp > loadLocal uint256 INIT)
          and
        (blockTimestamp < loadLocal uint256 EXPIRY)
          or
        (loadLocal bool RISK != bool true)
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

    const infixToPostfixTest = ({ name, expr, expected }: Testcase) => {
      it(name, async () => {
        const stack = await (await ethers.getContractFactory("Stack")).deploy();
        const inputArr = jsTransform(expr);
        const res = await app.callStatic.infixToPostfix(inputArr, stack.address);
        expect(res).to.eql(expected);
      });
    };

    tests.forEach((testcase) => infixToPostfixTest(testcase));
  });

  describe("split", () => {
    it("simple case", async () => {
      const input = "loadLocal address SENDER == msgSender";
      const res = await app.callStatic.split(input);
      expect(res).to.eql(jsTransform(input));
    });

    it("extra spaces", async () => {
      const input = "loadLocal      address SENDER == msgSender";
      const res = await app.callStatic.split(input);
      expect(res).to.eql(jsTransform(input));
    });

    it("parenthesis", async () => {
      const input = "(((uint256 1 or uint256 5) or uint256 7) and uint256 0)";
      const res = await app.callStatic.split(input);
      expect(res).to.eql(jsTransform(input));
    });

    it("new line symbol", async () => {
      const input = `
          loadLocal address SENDER
            ==
          msgSender
        `;
      const res = await app.callStatic.split(input);
      expect(res).to.eql(jsTransform(input));
    });

    it("all together", async () => {
      const input = `
        (
          (
            blockTimestamp > loadLocal uint256 INIT
          )
            and
          (
            blockTimestamp < loadLocal uint256 EXPIRY
              or
            (
              loadLocal bool RISK != bool true
            )
          )
        )
        `;
      const res = await app.callStatic.split(input);
      expect(res).to.eql(jsTransform(input));
    });
  });

  describe("Execute high-level DSL", () => {
    it("parenthesis", async () => {
      const cmds = await app.callStatic.transform("(((uint256 1 or uint256 5) or uint256 7) and uint256 1)");
      const expected = ["uint256", "1", "uint256", "5", "or", "uint256", "7", "or", "uint256", "1", "and"];
      expect(cmds).to.eql(expected);
    });

    describe("parenthesis matter", () => {
      it("first", async () => {
        const cmds = await app.callStatic.transform("uint256 1 or uint256 0 or uint256 1 and uint256 0");
        const expected = ["uint256", "1", "uint256", "0", "or", "uint256", "1", "uint256", "0", "and", "or"];

        expect(cmds).to.eql(expected);
      });

      it("second", async () => {
        const cmds = await app.callStatic.transform("((uint256 1 or uint256 0) or uint256 1) and uint256 0");
        const expected = ["uint256", "1", "uint256", "0", "or", "uint256", "1", "or", "uint256", "0", "and"];

        expect(cmds).to.eql(expected);
      });

      it("third", async () => {
        const cmds = await app.callStatic.transform("(uint256 1 or uint256 0) or (uint256 1 and uint256 0)");
        const expected = ["uint256", "1", "uint256", "0", "or", "uint256", "1", "uint256", "0", "and", "or"];

        expect(cmds).to.eql(expected);
      });
    });

    it("complex expression", async () => {
      const program = `
        (((loadLocal uint256 TIMESTAMP >    loadLocal uint256 INIT)
          and
        (loadLocal uint256 TIMESTAMP <   loadLocal uint256 EXPIRY))
          or
        loadLocal bool RISK != bool true)`;

      const cmds = await app.callStatic.transform(program);
      const expected = [
        "loadLocal",
        "uint256",
        "TIMESTAMP",
        "loadLocal",
        "uint256",
        "INIT",
        ">",
        "loadLocal",
        "uint256",
        "TIMESTAMP",
        "loadLocal",
        "uint256",
        "EXPIRY",
        "<",
        "and",
        "loadLocal",
        "bool",
        "RISK",
        "or",
        "bool",
        "true",
        "!=",
      ];
      expect(cmds).to.eql(expected);
    });
  });
});
