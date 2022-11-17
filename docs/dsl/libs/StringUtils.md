## StringUtils

### char

```solidity
function char(string s, uint256 index) public pure returns (string)
```

### equal

```solidity
function equal(string s1, string s2) internal pure returns (bool)
```

### length

```solidity
function length(string s) internal pure returns (uint256)
```

### concat

```solidity
function concat(string s1, string s2) internal pure returns (string)
```

### fromHex

```solidity
function fromHex(string s) public pure returns (bytes)
```

### fromHexBytes

```solidity
function fromHexBytes(bytes ss) public pure returns (bytes)
```

### toString

```solidity
function toString(uint256 value) internal pure returns (string)
```

_Converts a `uint256` to its ASCII `string` decimal representation._

### toUint256

```solidity
function toUint256(string s) public pure returns (uint256 value)
```

### getWei

```solidity
function getWei(string _s) public pure returns (string result)
```

### mayBeNumber

```solidity
function mayBeNumber(string _string) public pure returns (bool)
```

_If the string starts with a number, so we assume that it's a number._

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| _string | string | is a current string for checking |

#### Return Values

| Name | Type | Description |
| ---- | ---- | ----------- |
| [0] | bool | isNumber that is true if the string starts with a number, otherwise is false |

### mayBeAddress

```solidity
function mayBeAddress(string _string) public pure returns (bool)
```

_If the string starts with `0x` symbols, so we assume that it's an address._

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| _string | string | is a current string for checking |

#### Return Values

| Name | Type | Description |
| ---- | ---- | ----------- |
| [0] | bool | isAddress that is true if the string starts with `0x` symbols, otherwise is false |

### fromHexChar

```solidity
function fromHexChar(bytes1 c) public pure returns (uint8)
```

### isValidVarName

```solidity
function isValidVarName(string _s) public pure returns (bool)
```

_Checks is string is a valid DSL variable name (matches regexp /^([A-Z_$][A-Z\d_$]*)$/g)_

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| _s | string | is a current string to check |

#### Return Values

| Name | Type | Description |
| ---- | ---- | ----------- |
| [0] | bool | isCapital whether the string is a valid DSL variable name or not |

