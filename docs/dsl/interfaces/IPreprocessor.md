## IPreprocessor

_Preprocessor of DSL code

One of the core contracts of the project. It can remove comments that were
created by user in the DSL code string. It transforms the users DSL code string
to the list of commands that can be used in a Parser contract.

DSL code in postfix notation as
user's string code -> Preprocessor -> each command is separated in the commands list_

### FuncParameter

```solidity
struct FuncParameter {
  string _type;
  string nameOfVariable;
  string value;
}
```

### PreprocessorInfo

```solidity
struct PreprocessorInfo {
  bool isFunc;
  bool isName;
  bool loadRemoteFlag;
  bool directUseUint256;
  bool isArrayStart;
  bool isStructStart;
  bool isLoopStart;
  uint256 loadRemoteVarCount;
  uint256 currencyMultiplier;
  uint256 insertStep;
  string name;
}
```

### transform

```solidity
function transform(address _ctxAddr, string _program) external returns (string[])
```

### cleanString

```solidity
function cleanString(string _program) external pure returns (string _cleanedProgram)
```

### split

```solidity
function split(string _program) external returns (string[])
```

### infixToPostfix

```solidity
function infixToPostfix(address _ctxAddr, string[] _code, contract StringStack _stack) external returns (string[])
```

