## E2EApp

### preprocessor

```solidity
address preprocessor
```

### parser

```solidity
address parser
```

### context

```solidity
address context
```

### receive

```solidity
receive() external payable
```

### constructor

```solidity
constructor(address _parserAddr, address _preprAddr, address _ctx) public
```

### parse

```solidity
function parse(string _program) external
```

### parseCode

```solidity
function parseCode(string[] _code) external
```

### execute

```solidity
function execute() external payable
```

### setupContext

```solidity
function setupContext() internal
```

