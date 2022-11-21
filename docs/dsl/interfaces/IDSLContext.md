## IDSLContext

### OpcodeLibNames

```solidity
enum OpcodeLibNames {
  ComparisonOpcodes,
  BranchingOpcodes,
  LogicalOpcodes,
  OtherOpcodes
}
```

### comparisonOpcodes

```solidity
function comparisonOpcodes() external view returns (address)
```

### branchingOpcodes

```solidity
function branchingOpcodes() external view returns (address)
```

### logicalOpcodes

```solidity
function logicalOpcodes() external view returns (address)
```

### otherOpcodes

```solidity
function otherOpcodes() external view returns (address)
```

### opCodeByName

```solidity
function opCodeByName(string _name) external view returns (bytes1 _opcode)
```

### selectorByOpcode

```solidity
function selectorByOpcode(bytes1 _opcode) external view returns (bytes4 _selecotor)
```

### numOfArgsByOpcode

```solidity
function numOfArgsByOpcode(string _name) external view returns (uint8 _numOfArgs)
```

### isCommand

```solidity
function isCommand(string _name) external view returns (bool _isCommand)
```

### opcodeLibNameByOpcode

```solidity
function opcodeLibNameByOpcode(bytes1 _opcode) external view returns (enum IDSLContext.OpcodeLibNames _name)
```

### asmSelectors

```solidity
function asmSelectors(string _name) external view returns (bytes4 _selecotor)
```

### opsPriors

```solidity
function opsPriors(string _name) external view returns (uint256 _priority)
```

### operators

```solidity
function operators(uint256 _index) external view returns (string _operator)
```

### branchSelectors

```solidity
function branchSelectors(string _baseOpName, bytes1 _branchCode) external view returns (bytes4 _selector)
```

### branchCodes

```solidity
function branchCodes(string _baseOpName, string _branchName) external view returns (bytes1 _branchCode)
```

### aliases

```solidity
function aliases(string _alias) external view returns (string _baseCmd)
```

### operatorsLen

```solidity
function operatorsLen() external view returns (uint256)
```

### setComparisonOpcodesAddr

```solidity
function setComparisonOpcodesAddr(address _opcodes) external
```

### setBranchingOpcodesAddr

```solidity
function setBranchingOpcodesAddr(address _opcodes) external
```

### setLogicalOpcodesAddr

```solidity
function setLogicalOpcodesAddr(address _opcodes) external
```

### setOtherOpcodesAddr

```solidity
function setOtherOpcodesAddr(address _opcodes) external
```

