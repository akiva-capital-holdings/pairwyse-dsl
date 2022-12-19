## AgreementStore

Financial Agreement written in DSL between two or more users

Agreement contract that is used to implement any custom logic of a
financial agreement. Ex. lender-borrower agreement

### parser

```solidity
contract IParser parser
```

### context

```solidity
contract IContext context
```

### ownerAddr

```solidity
address ownerAddr
```

### ValueTypes

```solidity
enum ValueTypes {
  UINT256,
  BYTES32,
  BOOL,
  ADDRESS
}
```

### Parsed

```solidity
event Parsed(address preProccessor, address context, string code)
```

### RecordArchived

```solidity
event RecordArchived(uint256 recordId)
```

### RecordUnarchived

```solidity
event RecordUnarchived(uint256 recordId)
```

### RecordActivated

```solidity
event RecordActivated(uint256 recordId)
```

### RecordDeactivated

```solidity
event RecordDeactivated(uint256 recordId)
```

### isReserved

```solidity
modifier isReserved(string varName)
```

### doesVariableExist

```solidity
modifier doesVariableExist(string varName, enum AgreementStore.ValueTypes valueType)
```

### onlyOwner

```solidity
modifier onlyOwner()
```

### Variable

```solidity
struct Variable {
  string varName;
  enum AgreementStore.ValueTypes valueType;
  bytes32 varHex;
  uint256 varId;
  address varCreator;
}
```

### variables

```solidity
mapping(uint256 => struct AgreementStore.Variable) variables
```

### conditionContexts

```solidity
mapping(uint256 => address[]) conditionContexts
```

### conditionStrings

```solidity
mapping(uint256 => string[]) conditionStrings
```

### signatories

```solidity
mapping(uint256 => address[]) signatories
```

### requiredRecords

```solidity
mapping(uint256 => uint256[]) requiredRecords
```

### isExecutedBySignatory

```solidity
mapping(uint256 => mapping(address => bool)) isExecutedBySignatory
```

### recordIds

```solidity
uint256[] recordIds
```

### varIds

```solidity
uint256[] varIds
```

### constructor

```solidity
constructor(address _parser, address _ownerAddr) public
```

Sets parser address, creates new Context instance, and setups Context

### setStorage

```solidity
function setStorage(uint256 varType, string varName, address[] data) external
```

### getStorage

```solidity
function getStorage(string varName) external returns (bytes32 varType, bytes arrType, bytes32 name)
```

### _addNewVariable

```solidity
function _addNewVariable(string _varName, enum AgreementStore.ValueTypes _valueType) internal returns (bytes32 position)
```

_Created and save new Variable of seted Value_

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| _varName | string | seted value name in type of string |
| _valueType | enum AgreementStore.ValueTypes | seted value type number |

#### Return Values

| Name | Type | Description |
| ---- | ---- | ----------- |
| position | bytes32 | return _varName in type of bytes32 |

