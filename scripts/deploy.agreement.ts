import '@nomiclabs/hardhat-ethers';
import * as hre from "hardhat";
const { ethers } = hre;
const fs = require("fs");


async function deploy() {
  const opcodeHelpersLib = await (await ethers.getContractFactory('OpcodeHelpers')).deploy();
  const stringLib = await (await ethers.getContractFactory('StringUtils')).deploy();
  const byteLib = await (await ethers.getContractFactory('ByteUtils')).deploy();

  const comparatorOpcodesLib = await (
      await ethers.getContractFactory('ComparatorOpcodes', {
        libraries: {
          OpcodeHelpers: opcodeHelpersLib.address,
        },
      })
    ).deploy();

  const logicalOpcodesLib = await (
      await ethers.getContractFactory('LogicalOpcodes', {
        libraries: {
          OpcodeHelpers: opcodeHelpersLib.address,
        },
      })
    ).deploy();

  const setOpcodesLib = await (
      await ethers.getContractFactory('SetOpcodes', {
        libraries: {
          OpcodeHelpers: opcodeHelpersLib.address,
        },
      })
    ).deploy();

  const otherOpcodesLib = await (
      await ethers.getContractFactory('OtherOpcodes', {
        libraries: {
          OpcodeHelpers: opcodeHelpersLib.address,
        },
      })
    ).deploy();

  const ParserCont = await ethers.getContractFactory('Parser', {
    libraries: { StringUtils: stringLib.address, ByteUtils: byteLib.address },
  });
  const parser = await ParserCont.deploy();

  const executorLib = await (await ethers.getContractFactory('Executor')).deploy();
  const AgreementContract = await ethers.getContractFactory(
    'Agreement', {
        libraries: {
          ComparatorOpcodes: comparatorOpcodesLib.address,
          LogicalOpcodes: logicalOpcodesLib.address,
          SetOpcodes: setOpcodesLib.address,
          OtherOpcodes: otherOpcodesLib.address,
          Executor: executorLib.address,
        },
    });
  const agreement = await AgreementContract.deploy(parser.address);;
  await agreement.deployed();

  await hre.tenderly.persistArtifacts({
    name: "Agreement",
    address: agreement.address,
  })

  const agreementObj = { 'address': agreement.address };
  fs.writeFile("./test/data/agreement.json", JSON.stringify(agreementObj, null, 2), (err: any) => {
    if (err) {  console.error(err);  return; };
      console.log("File has been updated");
    });
}

deploy()