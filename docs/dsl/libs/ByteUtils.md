## ByteUtils

Library to simplify working with bytes

### slice

```solidity
function slice(bytes _data, uint256 _start, uint256 _end) public pure returns (bytes)
```

### fromHexBytes

```solidity
function fromHexBytes(bytes ss) public pure returns (bytes)
```

Convert an hexadecimal string in bytes (without "0x" prefix) to raw bytes

### fromHexChar

```solidity
function fromHexChar(bytes1 c) public pure returns (uint8)
```

_Convert an hexadecimal character to their value_

