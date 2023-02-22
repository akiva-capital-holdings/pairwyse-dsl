## StringUtils

_Library that simplifies working with strings in Solidity_

### char

```solidity
function char(string _s, uint256 _index) public pure returns (string)
```

_Get character in string by index_

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| _s | string | Input string |
| _index | uint256 | Target index in the string |

#### Return Values

| Name | Type | Description |
| ---- | ---- | ----------- |
| [0] | string | Character by index |

### equal

```solidity
function equal(string _s1, string _s2) internal pure returns (bool)
```

_Compares two strings_

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| _s1 | string | One string |
| _s2 | string | Another string |

#### Return Values

| Name | Type | Description |
| ---- | ---- | ----------- |
| [0] | bool | Are string equal |

### length

```solidity
function length(string _s) internal pure returns (uint256)
```

_Gets length of the string_

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| _s | string | Input string |

#### Return Values

| Name | Type | Description |
| ---- | ---- | ----------- |
| [0] | uint256 | The lenght of the string |

### concat

```solidity
function concat(string _s1, string _s2) internal pure returns (string)
```

_Concats two strings_

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| _s1 | string | One string |
| _s2 | string | Another string |

#### Return Values

| Name | Type | Description |
| ---- | ---- | ----------- |
| [0] | string | The concatenation of the strings |

### substr

```solidity
function substr(string _str, uint256 _start, uint256 _end) public pure returns (string)
```

_Creates a substring from a string
Ex. substr('0x9A9f2CCfdE556A7E9Ff0848998Aa4a0CFD8863AE', 2, 42) => '9A9f2CCfdE556A7E9Ff0848998Aa4a0CFD8863AE'_

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| _str | string | Input string |
| _start | uint256 | Start index (inclusive) |
| _end | uint256 | End index (not inclusive) |

#### Return Values

| Name | Type | Description |
| ---- | ---- | ----------- |
| [0] | string | Substring |

### isIn

```solidity
function isIn(string _char, string _string) public pure returns (bool)
```

_Checks is _char is present in the _string
Ex. `_`.in('123_456') => true
Ex. `8`.in('123456') => false_

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| _char | string | Searched character |
| _string | string | String to search in |

#### Return Values

| Name | Type | Description |
| ---- | ---- | ----------- |
| [0] | bool | Is the character presented in the string |

### fromHex

```solidity
function fromHex(string s) public pure returns (bytes)
```

### toString

```solidity
function toString(uint256 _num) internal pure returns (string)
```

Inspired by OraclizeAPI's implementation - MIT licence
https://github.com/oraclize/ethereum-api/blob/b42146b063c7d6ee1358846c198246239e9360e8/oraclizeAPI_0.4.25.sol

_Converts a `uint256` to its ASCII `string` decimal representation_

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| _num | uint256 | Input number |

#### Return Values

| Name | Type | Description |
| ---- | ---- | ----------- |
| [0] | string | Number represented as a string |

### toUint256

```solidity
function toUint256(string _s) public pure returns (uint256 value)
```

_Converts a decimal number (provided as a string) to uint256_

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| _s | string | Input decimal number (provided as a string) |

#### Return Values

| Name | Type | Description |
| ---- | ---- | ----------- |
| value | uint256 | Unsigned integer from input string |

### parseScientificNotation

```solidity
function parseScientificNotation(string _s) public pure returns (string result)
```

_Converts a decimal number (provided as a string) with e symbol (1e18) to number (returned as a string)_

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| _s | string | Input decimal number (provided as a string) |

#### Return Values

| Name | Type | Description |
| ---- | ---- | ----------- |
| result | string | Unsigned integer in a string format |

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


