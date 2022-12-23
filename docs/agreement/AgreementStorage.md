## AgreementStorage

AgreementStorage used to manage all variables

### Variable

```solidity
struct Variable {
  string varName;
  enum AgreementStorage.ValueTypes valueType;
  bytes32 varHex;
  uint256 varId;
  address varCreator;
}
```

### variables

```solidity
mapping(uint256 => struct AgreementStorage.Variable) variables
```

### ValueTypes

```solidity
enum ValueTypes {
  ADDRESS,
  UINT256,
  BYTES32,
  BOOL
}
```

### isReserved

```solidity
modifier isReserved(string varName)
```

### doesVariableExist

```solidity
modifier doesVariableExist(string varName, enum AgreementStorage.ValueTypes valueType)
```

### varIds

```solidity
uint256[] varIds
```

### getStorageBool

```solidity
function getStorageBool(bytes32 position) external view returns (bool data)
```

### getStorageAddress

```solidity
function getStorageAddress(bytes32 position) external view returns (address data)
```

### getStorageUint256

```solidity
function getStorageUint256(bytes32 position) external view returns (uint256 data)
```

### setStorageBool

```solidity
function setStorageBool(string varName, bool data) external
```

### setStorageAddress

```solidity
function setStorageAddress(string varName, address data) external
```

### setStorageUint256

```solidity
function setStorageUint256(string varName, uint256 data) external
```

### _addNewVariable

```solidity
function _addNewVariable(string _varName, enum AgreementStorage.ValueTypes _valueType) internal returns (bytes32 position)
```

_Created and save new Variable of seted Value_

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| _varName | string | seted value name in type of string |
| _valueType | enum AgreementStorage.ValueTypes | seted value type number |

#### Return Values

| Name | Type | Description |
| ---- | ---- | ----------- |
| position | bytes32 | is a _varName in type of bytes32 |

