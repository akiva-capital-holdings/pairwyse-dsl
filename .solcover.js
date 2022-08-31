module.exports = {
  skipFiles: [
    "agreement/AgreementFactory.sol",  // TODO: temporarily until we inherit AgreementFactoryMock from AgreementFactory
    "agreement/mocks/AgreementMock.sol",
    "agreement/mocks/ConditionalTxsMock.sol",
    "dsl/test/Agreement.sol",
    "dsl/test/App.sol",
    "dsl/test/ERC20.sol",
    "dsl/test/Token.sol",
    "dsl/test/E2EApp.sol",
    "dsl/test/ERC20Mintable.sol",
    "dsl/test/StorageWithRevert.sol",
    "dsl/mocks/opcodes/ComparisonOpcodesMock.sol",
    "dsl/mocks/opcodes/BranchingOpcodesMock.sol",
    "dsl/mocks/opcodes/LogicalOpcodesMock.sol",
    "dsl/mocks/opcodes/OtherOpcodesMock.sol",
    "dsl/mocks/opcodes/SetOpcodesMock.sol",
    "dsl/mocks/opcodes/OpcodeHelpersMock.sol",
    "dsl/mocks/ContextMock.sol",
    "dsl/mocks/ExecutorMock.sol",
    "dsl/mocks/OpcodesMock.sol",
    "dsl/mocks/StringUtilsMock.sol",
    "dsl/mocks/ParserMock.sol",
    "dsl/mocks/ByteUtilsMock.sol",
  ]
};