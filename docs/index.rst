Solidity API
============

Agreement
---------

Financial Agreement written in DSL between two or more users

Agreement contract that is used to implement any custom logic of a
financial agreement. Ex. lender-borrower agreement

parser
~~~~~~

.. code:: solidity

   contract IParser parser

context
~~~~~~~

.. code:: solidity

   contract IContext context

ownerAddr
~~~~~~~~~

.. code:: solidity

   address ownerAddr

NewRecord
~~~~~~~~~

.. code:: solidity

   event NewRecord(uint256 recordId, uint256[] requiredRecords, address[] signatories, string transaction, string[] conditionStrings)

isReserved
~~~~~~~~~~

.. code:: solidity

   modifier isReserved(bytes32 position)

onlyOwner
~~~~~~~~~

.. code:: solidity

   modifier onlyOwner()

Record
~~~~~~

.. code:: solidity

   struct Record {
     address recordContext;
     bool isExecuted;
     bool isArchived;
     bool isActive;
     string transactionString;
   }

records
~~~~~~~

.. code:: solidity

   mapping(uint256 => struct Agreement.Record) records

conditionContexts
~~~~~~~~~~~~~~~~~

.. code:: solidity

   mapping(uint256 => address[]) conditionContexts

conditionStrings
~~~~~~~~~~~~~~~~

.. code:: solidity

   mapping(uint256 => string[]) conditionStrings

signatories
~~~~~~~~~~~

.. code:: solidity

   mapping(uint256 => address[]) signatories

requiredRecords
~~~~~~~~~~~~~~~

.. code:: solidity

   mapping(uint256 => uint256[]) requiredRecords

isExecutedBySignatory
~~~~~~~~~~~~~~~~~~~~~

.. code:: solidity

   mapping(uint256 => mapping(address => bool)) isExecutedBySignatory

recordIds
~~~~~~~~~

.. code:: solidity

   uint256[] recordIds

constructor
~~~~~~~~~~~

.. code:: solidity

   constructor(address _parser, address _ownerAddr) public

Sets parser address, creates new Context instance, and setups Context

getStorageBool
~~~~~~~~~~~~~~

.. code:: solidity

   function getStorageBool(bytes32 position) external view returns (bool data)

getStorageAddress
~~~~~~~~~~~~~~~~~

.. code:: solidity

   function getStorageAddress(bytes32 position) external view returns (address data)

getStorageUint256
~~~~~~~~~~~~~~~~~

.. code:: solidity

   function getStorageUint256(bytes32 position) external view returns (uint256 data)

setStorageBool
~~~~~~~~~~~~~~

.. code:: solidity

   function setStorageBool(bytes32 position, bool data) external

setStorageAddress
~~~~~~~~~~~~~~~~~

.. code:: solidity

   function setStorageAddress(bytes32 position, address data) external

setStorageBytes32
~~~~~~~~~~~~~~~~~

.. code:: solidity

   function setStorageBytes32(bytes32 position, bytes32 data) external

setStorageUint256
~~~~~~~~~~~~~~~~~

.. code:: solidity

   function setStorageUint256(bytes32 position, uint256 data) external

conditionContextsLen
~~~~~~~~~~~~~~~~~~~~

.. code:: solidity

   function conditionContextsLen(uint256 _recordId) external view returns (uint256)

*Based on Record ID returns the number of condition Context instances*

Parameters
^^^^^^^^^^

========== ======= ===========
Name       Type    Description
========== ======= ===========
\_recordId uint256 Record ID
========== ======= ===========

Return Values
^^^^^^^^^^^^^

==== ======= ===================================================
Name Type    Description
==== ======= ===================================================
[0]  uint256 Number of condition Context instances of the Record
==== ======= ===================================================

signatoriesLen
~~~~~~~~~~~~~~

.. code:: solidity

   function signatoriesLen(uint256 _recordId) external view returns (uint256)

*Based on Record ID returns the number of signatures*

.. _parameters-1:

Parameters
^^^^^^^^^^

========== ======= ===========
Name       Type    Description
========== ======= ===========
\_recordId uint256 Record ID
========== ======= ===========

.. _return-values-1:

Return Values
^^^^^^^^^^^^^

==== ======= ===============================
Name Type    Description
==== ======= ===============================
[0]  uint256 Number of signatures in records
==== ======= ===============================

requiredRecordsLen
~~~~~~~~~~~~~~~~~~

.. code:: solidity

   function requiredRecordsLen(uint256 _recordId) external view returns (uint256)

*Based on Record ID returns the number of required records*

.. _parameters-2:

Parameters
^^^^^^^^^^

========== ======= ===========
Name       Type    Description
========== ======= ===========
\_recordId uint256 Record ID
========== ======= ===========

.. _return-values-2:

Return Values
^^^^^^^^^^^^^

==== ======= ==========================
Name Type    Description
==== ======= ==========================
[0]  uint256 Number of required records
==== ======= ==========================

conditionStringsLen
~~~~~~~~~~~~~~~~~~~

.. code:: solidity

   function conditionStringsLen(uint256 _recordId) external view returns (uint256)

*Based on Record ID returns the number of condition strings*

.. _parameters-3:

Parameters
^^^^^^^^^^

========== ======= ===========
Name       Type    Description
========== ======= ===========
\_recordId uint256 Record ID
========== ======= ===========

.. _return-values-3:

Return Values
^^^^^^^^^^^^^

==== ======= =========================================
Name Type    Description
==== ======= =========================================
[0]  uint256 Number of Condition strings of the Record
==== ======= =========================================

getActiveRecords
~~~~~~~~~~~~~~~~

.. code:: solidity

   function getActiveRecords() external view returns (uint256[])

*Sorted all records and return array of active records in Agreement*

.. _return-values-4:

Return Values
^^^^^^^^^^^^^

==== ========= ==================================================
Name Type      Description
==== ========= ==================================================
[0]  uint256[] activeRecords array of active records in Agreement
==== ========= ==================================================

getRecord
~~~~~~~~~

.. code:: solidity

   function getRecord(uint256 _recordId) external view returns (uint256[] _requiredRecords, address[] _signatories, string[] _conditions, string _transaction, bool _isActive)

*return valuses for preview record before execution*

.. _parameters-4:

Parameters
^^^^^^^^^^

========== ======= ===========
Name       Type    Description
========== ======= ===========
\_recordId uint256 Record ID
========== ======= ===========

.. _return-values-5:

Return Values
^^^^^^^^^^^^^

+--------------+--------------+----------------------------------------+
| Name         | Type         | Description                            |
+==============+==============+========================================+
| \_req        | uint256[]    | array of required records in the       |
| uiredRecords |              | record                                 |
+--------------+--------------+----------------------------------------+
| \            | address[]    | array of signatories in the record     |
| _signatories |              |                                        |
+--------------+--------------+----------------------------------------+
| \_conditions | string[]     | array of conditions in the record      |
+--------------+--------------+----------------------------------------+
| \            | string       | string of transaction                  |
| _transaction |              |                                        |
+--------------+--------------+----------------------------------------+
| \_isActive   | bool         | true if the record is active           |
+--------------+--------------+----------------------------------------+

archiveRecord
~~~~~~~~~~~~~

.. code:: solidity

   function archiveRecord(uint256 _recordId) external

*archived any of the existing records by recordId.*

.. _parameters-5:

Parameters
^^^^^^^^^^

========== ======= ===========
Name       Type    Description
========== ======= ===========
\_recordId uint256 Record ID
========== ======= ===========

unarchiveRecord
~~~~~~~~~~~~~~~

.. code:: solidity

   function unarchiveRecord(uint256 _recordId) external

*unarchive any of the existing records by recordId*

.. _parameters-6:

Parameters
^^^^^^^^^^

========== ======= ===========
Name       Type    Description
========== ======= ===========
\_recordId uint256 Record ID
========== ======= ===========

activateRecord
~~~~~~~~~~~~~~

.. code:: solidity

   function activateRecord(uint256 _recordId) external

*activates the existing records by recordId, only awailable for
ownerAddr*

.. _parameters-7:

Parameters
^^^^^^^^^^

========== ======= ===========
Name       Type    Description
========== ======= ===========
\_recordId uint256 Record ID
========== ======= ===========

deactivateRecord
~~~~~~~~~~~~~~~~

.. code:: solidity

   function deactivateRecord(uint256 _recordId) external

*deactivates the existing records by recordId, only awailable for
ownerAddr*

.. _parameters-8:

Parameters
^^^^^^^^^^

========== ======= ===========
Name       Type    Description
========== ======= ===========
\_recordId uint256 Record ID
========== ======= ===========

parse
~~~~~

.. code:: solidity

   function parse(string _code, address _context, address _preProc) external

*Parse DSL code from the user and set the program bytecode in Context
contract*

.. _parameters-9:

Parameters
^^^^^^^^^^

========= ======= ============================
Name      Type    Description
========= ======= ============================
\_code    string  DSL code input from the user
\_context address Context address
\_preProc address Preprocessor address
========= ======= ============================

update
~~~~~~

.. code:: solidity

   function update(uint256 _recordId, uint256[] _requiredRecords, address[] _signatories, string _transactionString, string[] _conditionStrings, address _recordContext, address[] _conditionContexts) external

execute
~~~~~~~

.. code:: solidity

   function execute(uint256 _recordId) external payable

receive
~~~~~~~

.. code:: solidity

   receive() external payable

\_checkSignatories
~~~~~~~~~~~~~~~~~~

.. code:: solidity

   function _checkSignatories(address[] _signatories) internal view

\_Checks input *signatures that only one ‘anyone’ address exists in the
list or that ‘anyone’ address does not exist in signatures at all*

.. _parameters-10:

Parameters
^^^^^^^^^^

============= ========= =====================
Name          Type      Description
============= ========= =====================
\_signatories address[] the list of addresses
============= ========= =====================

\_verify
~~~~~~~~

.. code:: solidity

   function _verify(uint256 _recordId) internal view returns (bool)

Verify that the user who wants to execute the record is amoung the
signatories for this Record

.. _parameters-11:

Parameters
^^^^^^^^^^

========== ======= ================
Name       Type    Description
========== ======= ================
\_recordId uint256 ID of the record
========== ======= ================

.. _return-values-6:

Return Values
^^^^^^^^^^^^^

+--------------+--------------+----------------------------------------+
| Name         | Type         | Description                            |
+==============+==============+========================================+
| [0]          | bool         | true if the user is allowed to execute |
|              |              | the record, false - otherwise          |
+--------------+--------------+----------------------------------------+

\_validateRequiredRecords
~~~~~~~~~~~~~~~~~~~~~~~~~

.. code:: solidity

   function _validateRequiredRecords(uint256 _recordId) internal view returns (bool)

Check that all records required by this records were executed

.. _parameters-12:

Parameters
^^^^^^^^^^

========== ======= ================
Name       Type    Description
========== ======= ================
\_recordId uint256 ID of the record
========== ======= ================

.. _return-values-7:

Return Values
^^^^^^^^^^^^^

+--------------+--------------+----------------------------------------+
| Name         | Type         | Description                            |
+==============+==============+========================================+
| [0]          | bool         | true all the required records were     |
|              |              | executed, false - otherwise            |
+--------------+--------------+----------------------------------------+

\_addRecordBlueprint
~~~~~~~~~~~~~~~~~~~~

.. code:: solidity

   function _addRecordBlueprint(uint256 _recordId, uint256[] _requiredRecords, address[] _signatories) internal

*Define some basic values for a new record*

.. _parameters-13:

Parameters
^^^^^^^^^^

+--------------+--------------+----------------------------------------+
| Name         | Type         | Description                            |
+==============+==============+========================================+
| \_recordId   | uint256      | is the ID of a transaction             |
+--------------+--------------+----------------------------------------+
| \_req        | uint256[]    | transactions ids that have to be       |
| uiredRecords |              | executed                               |
+--------------+--------------+----------------------------------------+
| \            | address[]    | addresses that can execute the chosen  |
| _signatories |              | transaction                            |
+--------------+--------------+----------------------------------------+

\_addRecordCondition
~~~~~~~~~~~~~~~~~~~~

.. code:: solidity

   function _addRecordCondition(uint256 _recordId, string _conditionStr, address _conditionCtx) internal

*Conditional Transaction: Append a condition to already existing
conditions inside Record*

.. _parameters-14:

Parameters
^^^^^^^^^^

+--------------+--------------+----------------------------------------+
| Name         | Type         | Description                            |
+==============+==============+========================================+
| \_recordId   | uint256      | Record ID                              |
+--------------+--------------+----------------------------------------+
| \_           | string       | DSL code for condition                 |
| conditionStr |              |                                        |
+--------------+--------------+----------------------------------------+
| \_           | address      | Context contract address for block of  |
| conditionCtx |              | DSL code for ``_conditionStr``         |
+--------------+--------------+----------------------------------------+

\_addRecordTransaction
~~~~~~~~~~~~~~~~~~~~~~

.. code:: solidity

   function _addRecordTransaction(uint256 _recordId, string _transactionString, address _recordContext) internal

*Adds a transaction that should be executed if all conditions inside
Record are met*

\_validateConditions
~~~~~~~~~~~~~~~~~~~~

.. code:: solidity

   function _validateConditions(uint256 _recordId, uint256 _msgValue) internal returns (bool)

\_fulfill
~~~~~~~~~

.. code:: solidity

   function _fulfill(uint256 _recordId, uint256 _msgValue, address _signatory) internal returns (bool)

*Fulfill Record*

.. _parameters-15:

Parameters
^^^^^^^^^^

+--------------+--------------+----------------------------------------+
| Name         | Type         | Description                            |
+==============+==============+========================================+
| \_recordId   | uint256      | Record ID to execute                   |
+--------------+--------------+----------------------------------------+
| \_msgValue   | uint256      | Value that were sent along with        |
|              |              | function execution // TODO: possibly   |
|              |              | remove this argument                   |
+--------------+--------------+----------------------------------------+
| \_signatory  | address      | The user that is executing the Record  |
+--------------+--------------+----------------------------------------+

.. _return-values-8:

Return Values
^^^^^^^^^^^^^

+--------------+--------------+----------------------------------------+
| Name         | Type         | Description                            |
+==============+==============+========================================+
| [0]          | bool         | Boolean whether the record was         |
|              |              | successfully executed or not           |
+--------------+--------------+----------------------------------------+

\_activeRecordsLen
~~~~~~~~~~~~~~~~~~

.. code:: solidity

   function _activeRecordsLen() internal view returns (uint256)

*return length of active records for getActiveRecords*

.. _return-values-9:

Return Values
^^^^^^^^^^^^^

==== ======= ====================================
Name Type    Description
==== ======= ====================================
[0]  uint256 count length of active records array
==== ======= ====================================

AgreementMock
-------------

.. _constructor-1:

constructor
~~~~~~~~~~~

.. code:: solidity

   constructor(address _parser, address _ownerAddr) public

.. _verify-1:

verify
~~~~~~

.. code:: solidity

   function verify(uint256 _recordId) public view returns (bool)

.. _validaterequiredrecords-1:

validateRequiredRecords
~~~~~~~~~~~~~~~~~~~~~~~

.. code:: solidity

   function validateRequiredRecords(uint256 _recordId) public view returns (bool)

.. _validateconditions-1:

validateConditions
~~~~~~~~~~~~~~~~~~

.. code:: solidity

   function validateConditions(uint256 _recordId, uint256 _msgValue) public returns (bool)

.. _addrecordblueprint-1:

addRecordBlueprint
~~~~~~~~~~~~~~~~~~

.. code:: solidity

   function addRecordBlueprint(uint256 _recordId, uint256[] _requiredRecords, address[] _signatories) external

.. _addrecordcondition-1:

addRecordCondition
~~~~~~~~~~~~~~~~~~

.. code:: solidity

   function addRecordCondition(uint256 _recordId, string _conditionStr, address _conditionCtx) public

.. _addrecordtransaction-1:

addRecordTransaction
~~~~~~~~~~~~~~~~~~~~

.. code:: solidity

   function addRecordTransaction(uint256 _recordId, string _transactionString, address _recordContext) public

.. _fulfill-1:

fulfill
~~~~~~~

.. code:: solidity

   function fulfill(uint256 _recordId, uint256 _msgValue, address _signatory) external returns (bool)

setRecordContext
~~~~~~~~~~~~~~~~

.. code:: solidity

   function setRecordContext(uint256 _recordId, address _context) external

MultisigMock
------------

This is the contract that simulates Multisig. The contract just executes
any transaction given to it without any checks

executeTransaction
~~~~~~~~~~~~~~~~~~

.. code:: solidity

   function executeTransaction(address _targetContract, bytes _payload, uint256 _value) external

Execute any transaction to any contract

.. _parameters-16:

Parameters
^^^^^^^^^^

+--------------+--------------+----------------------------------------+
| Name         | Type         | Description                            |
+==============+==============+========================================+
| \_ta         | address      | Contract which function should be      |
| rgetContract |              | called                                 |
+--------------+--------------+----------------------------------------+
| \_payload    | bytes        | Raw unsigned contract function call    |
|              |              | data with parameters                   |
+--------------+--------------+----------------------------------------+
| \_value      | uint256      | Optional value to send via the         |
|              |              | delegate call                          |
+--------------+--------------+----------------------------------------+

.. _context-1:

Context
-------

\_Context of DSL code

One of the core contracts of the project. It contains opcodes and
aliases for commands. It provides additional information about program
state and point counter (pc). During creating Context contract executes
the ``initOpcodes`` function that provides basic working opcodes\_

anyone
~~~~~~

.. code:: solidity

   address anyone

stack
~~~~~

.. code:: solidity

   contract Stack stack

program
~~~~~~~

.. code:: solidity

   bytes program

pc
~~

.. code:: solidity

   uint256 pc

nextpc
~~~~~~

.. code:: solidity

   uint256 nextpc

appAddr
~~~~~~~

.. code:: solidity

   address appAddr

msgSender
~~~~~~~~~

.. code:: solidity

   address msgSender

comparisonOpcodes
~~~~~~~~~~~~~~~~~

.. code:: solidity

   address comparisonOpcodes

branchingOpcodes
~~~~~~~~~~~~~~~~

.. code:: solidity

   address branchingOpcodes

logicalOpcodes
~~~~~~~~~~~~~~

.. code:: solidity

   address logicalOpcodes

otherOpcodes
~~~~~~~~~~~~

.. code:: solidity

   address otherOpcodes

msgValue
~~~~~~~~

.. code:: solidity

   uint256 msgValue

opCodeByName
~~~~~~~~~~~~

.. code:: solidity

   mapping(string => bytes1) opCodeByName

selectorByOpcode
~~~~~~~~~~~~~~~~

.. code:: solidity

   mapping(bytes1 => bytes4) selectorByOpcode

opcodeLibNameByOpcode
~~~~~~~~~~~~~~~~~~~~~

.. code:: solidity

   mapping(bytes1 => enum IContext.OpcodeLibNames) opcodeLibNameByOpcode

asmSelectors
~~~~~~~~~~~~

.. code:: solidity

   mapping(string => bytes4) asmSelectors

opsPriors
~~~~~~~~~

.. code:: solidity

   mapping(string => uint256) opsPriors

operators
~~~~~~~~~

.. code:: solidity

   string[] operators

branchSelectors
~~~~~~~~~~~~~~~

.. code:: solidity

   mapping(string => mapping(bytes1 => bytes4)) branchSelectors

branchCodes
~~~~~~~~~~~

.. code:: solidity

   mapping(string => mapping(string => bytes1)) branchCodes

aliases
~~~~~~~

.. code:: solidity

   mapping(string => string) aliases

isStructVar
~~~~~~~~~~~

.. code:: solidity

   mapping(string => bool) isStructVar

structParams
~~~~~~~~~~~~

.. code:: solidity

   mapping(bytes4 => mapping(bytes4 => bytes4)) structParams

forLoopIterationsRemaining
~~~~~~~~~~~~~~~~~~~~~~~~~~

.. code:: solidity

   uint256 forLoopIterationsRemaining

nonZeroAddress
~~~~~~~~~~~~~~

.. code:: solidity

   modifier nonZeroAddress(address _addr)

.. _constructor-2:

constructor
~~~~~~~~~~~

.. code:: solidity

   constructor() public

initOpcodes
~~~~~~~~~~~

.. code:: solidity

   function initOpcodes() internal

*Creates a list of opcodes and its aliases with information about each
of them: - name - selectors of opcode functions, - used library for each
of opcode for Executor contract - asm selector of function that uses in
Parser contract Function contains simple opcodes as arithmetic,
comparison and bitwise. In additional to that it contains complex
opcodes that can load data (variables with different types) from memory
and helpers like transfer tokens or native coins to the address or
opcodes branching and internal DSL functions.*

operatorsLen
~~~~~~~~~~~~

.. code:: solidity

   function operatorsLen() external view returns (uint256)

*Returns the amount of stored operators*

setComparisonOpcodesAddr
~~~~~~~~~~~~~~~~~~~~~~~~

.. code:: solidity

   function setComparisonOpcodesAddr(address _comparisonOpcodes) public

*Sets the new address of the ComparisonOpcodes library*

.. _parameters-17:

Parameters
^^^^^^^^^^

=================== ======= =================================
Name                Type    Description
=================== ======= =================================
\_comparisonOpcodes address is the new address of the library
=================== ======= =================================

setBranchingOpcodesAddr
~~~~~~~~~~~~~~~~~~~~~~~

.. code:: solidity

   function setBranchingOpcodesAddr(address _branchingOpcodes) public

*Sets the new address of the BranchingOpcodes library*

.. _parameters-18:

Parameters
^^^^^^^^^^

================== ======= =================================
Name               Type    Description
================== ======= =================================
\_branchingOpcodes address is the new address of the library
================== ======= =================================

setLogicalOpcodesAddr
~~~~~~~~~~~~~~~~~~~~~

.. code:: solidity

   function setLogicalOpcodesAddr(address _logicalOpcodes) public

*Sets the new address of the LogicalOpcodes library*

.. _parameters-19:

Parameters
^^^^^^^^^^

================ ======= =================================
Name             Type    Description
================ ======= =================================
\_logicalOpcodes address is the new address of the library
================ ======= =================================

setOtherOpcodesAddr
~~~~~~~~~~~~~~~~~~~

.. code:: solidity

   function setOtherOpcodesAddr(address _otherOpcodes) public

*Sets the new address of the OtherOpcodes library*

.. _parameters-20:

Parameters
^^^^^^^^^^

============== ======= =================================
Name           Type    Description
============== ======= =================================
\_otherOpcodes address is the new address of the library
============== ======= =================================

addOpcode
~~~~~~~~~

.. code:: solidity

   function addOpcode(string _name, bytes1 _opcode, bytes4 _opSelector, bytes4 _asmSelector, enum IContext.OpcodeLibNames _libName) public

*Adds the opcode for the DSL command*

.. _parameters-21:

Parameters
^^^^^^^^^^

+--------------+--------------+----------------------------------------+
| Name         | Type         | Description                            |
+==============+==============+========================================+
| \_name       | string       | is the name of the command             |
+--------------+--------------+----------------------------------------+
| \_opcode     | bytes1       | is the opcode of the command           |
+--------------+--------------+----------------------------------------+
| \_opSelector | bytes4       | is the selector of the function for    |
|              |              | this opcode from onle of library in    |
|              |              | ``contracts/libs/opcodes/*``           |
+--------------+--------------+----------------------------------------+
| \            | bytes4       | is the selector of the function from   |
| _asmSelector |              | the Parser for that opcode             |
+--------------+--------------+----------------------------------------+
| \_libName    | enum         | is the name of library that is used    |
|              | IContext.Op  | fot the opcode                         |
|              | codeLibNames |                                        |
+--------------+--------------+----------------------------------------+

setProgram
~~~~~~~~~~

.. code:: solidity

   function setProgram(bytes _data) public

*ATTENTION! Works only during development! Will be removed. Sets the
final version of the program.*

.. _parameters-22:

Parameters
^^^^^^^^^^

====== ===== ===================================
Name   Type  Description
====== ===== ===================================
\_data bytes is the bytecode of the full program
====== ===== ===================================

programAt
~~~~~~~~~

.. code:: solidity

   function programAt(uint256 _index, uint256 _step) public view returns (bytes)

*Returns the slice of the current program using the index and the step
values*

.. _parameters-23:

Parameters
^^^^^^^^^^

======= ======= ===========================
Name    Type    Description
======= ======= ===========================
\_index uint256 is a last byte of the slice
\_step  uint256 is the step of the slice
======= ======= ===========================

.. _return-values-10:

Return Values
^^^^^^^^^^^^^

==== ===== ========================================================
Name Type  Description
==== ===== ========================================================
[0]  bytes the slice of stored bytecode in the ``program`` variable
==== ===== ========================================================

programSlice
~~~~~~~~~~~~

.. code:: solidity

   function programSlice(bytes _payload, uint256 _index, uint256 _step) public pure returns (bytes)

*Returns the slice of the program using a step value*

.. _parameters-24:

Parameters
^^^^^^^^^^

========= ======= ==========================================
Name      Type    Description
========= ======= ==========================================
\_payload bytes   is bytecode of program that will be sliced
\_index   uint256 is a last byte of the slice
\_step    uint256 is the step of the slice
========= ======= ==========================================

.. _return-values-11:

Return Values
^^^^^^^^^^^^^

==== ===== ========================================
Name Type  Description
==== ===== ========================================
[0]  bytes the slice of provided \_payload bytecode
==== ===== ========================================

setPc
~~~~~

.. code:: solidity

   function setPc(uint256 _pc) public

*Sets the current point counter for the program*

.. _parameters-25:

Parameters
^^^^^^^^^^

==== ======= ==========================
Name Type    Description
==== ======= ==========================
\_pc uint256 is the new value of the pc
==== ======= ==========================

setNextPc
~~~~~~~~~

.. code:: solidity

   function setNextPc(uint256 _nextpc) public

*Sets the next point counter for the program*

.. _parameters-26:

Parameters
^^^^^^^^^^

======== ======= ==============================
Name     Type    Description
======== ======= ==============================
\_nextpc uint256 is the new value of the nextpc
======== ======= ==============================

incPc
~~~~~

.. code:: solidity

   function incPc(uint256 _val) public

*Increases the current point counter with the provided value and saves
the sum*

.. _parameters-27:

Parameters
^^^^^^^^^^

+--------------+--------------+----------------------------------------+
| Name         | Type         | Description                            |
+==============+==============+========================================+
| \_val        | uint256      | is the new value that is used for      |
|              |              | summing it and the current pc value    |
+--------------+--------------+----------------------------------------+

setAppAddress
~~~~~~~~~~~~~

.. code:: solidity

   function setAppAddress(address _appAddr) external

*Sets/Updates application Address by the provided value*

.. _parameters-28:

Parameters
^^^^^^^^^^

+--------------+--------------+----------------------------------------+
| Name         | Type         | Description                            |
+==============+==============+========================================+
| \_appAddr    | address      | is the new application Address, can    |
|              |              | not be a zero address                  |
+--------------+--------------+----------------------------------------+

setMsgSender
~~~~~~~~~~~~

.. code:: solidity

   function setMsgSender(address _msgSender) public

*Sets/Updates msgSender by the provided value*

.. _parameters-29:

Parameters
^^^^^^^^^^

=========== ======= ====================
Name        Type    Description
=========== ======= ====================
\_msgSender address is the new msgSender
=========== ======= ====================

setMsgValue
~~~~~~~~~~~

.. code:: solidity

   function setMsgValue(uint256 _msgValue) public

*Sets/Updates msgValue by the provided value*

.. _parameters-30:

Parameters
^^^^^^^^^^

========== ======= ===================
Name       Type    Description
========== ======= ===================
\_msgValue uint256 is the new msgValue
========== ======= ===================

setStructVars
~~~~~~~~~~~~~

.. code:: solidity

   function setStructVars(string _structName, string _varName, string _fullName) public

*Sets the full name depends on structure variables*

.. _parameters-31:

Parameters
^^^^^^^^^^

+--------------+--------------+----------------------------------------+
| Name         | Type         | Description                            |
+==============+==============+========================================+
| \_structName | string       | is the name of the structure           |
+--------------+--------------+----------------------------------------+
| \_varName    | string       | is the name of the structure variable  |
+--------------+--------------+----------------------------------------+
| \_fullName   | string       | is the full string of the name of the  |
|              |              | structure and its variables            |
+--------------+--------------+----------------------------------------+

setForLoopIterationsRemaining
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

.. code:: solidity

   function setForLoopIterationsRemaining(uint256 _forLoopIterationsRemaining) external

*Sets the number of iterations for the for-loop that is being executed*

.. _parameters-32:

Parameters
^^^^^^^^^^

+--------------+--------------+----------------------------------------+
| Name         | Type         | Description                            |
+==============+==============+========================================+
| \_fo         | uint256      | The number of iterations of the loop   |
| rLoopIterati |              |                                        |
| onsRemaining |              |                                        |
+--------------+--------------+----------------------------------------+

\_addOpcodeForOperator
~~~~~~~~~~~~~~~~~~~~~~

.. code:: solidity

   function _addOpcodeForOperator(string _name, bytes1 _opcode, bytes4 _opSelector, bytes4 _asmSelector, enum IContext.OpcodeLibNames _libName, uint256 _priority) internal

*Adds the opcode for the operator*

.. _parameters-33:

Parameters
^^^^^^^^^^

+--------------+--------------+----------------------------------------+
| Name         | Type         | Description                            |
+==============+==============+========================================+
| \_name       | string       | is the name of the operator            |
+--------------+--------------+----------------------------------------+
| \_opcode     | bytes1       | is the opcode of the operator          |
+--------------+--------------+----------------------------------------+
| \_opSelector | bytes4       | is the selector of the function for    |
|              |              | this operator from onle of library in  |
|              |              | ``contracts/libs/opcodes/*``           |
+--------------+--------------+----------------------------------------+
| \            | bytes4       | is the selector of the function from   |
| _asmSelector |              | the Parser for this operator           |
+--------------+--------------+----------------------------------------+
| \_libName    | enum         | is the name of library that is used    |
|              | IContext.Op  | fot the operator                       |
|              | codeLibNames |                                        |
+--------------+--------------+----------------------------------------+
| \_priority   | uint256      | is the priority for the opcode         |
+--------------+--------------+----------------------------------------+

\_addOpcodeBranch
~~~~~~~~~~~~~~~~~

.. code:: solidity

   function _addOpcodeBranch(string _baseOpName, string _branchName, bytes1 _branchCode, bytes4 _selector) internal

\_As branched (complex) DSL commands have their own name, types and
values the *addOpcodeBranch provides adding opcodes using additional
internal branch opcodes.*

.. _parameters-34:

Parameters
^^^^^^^^^^

+--------------+--------------+----------------------------------------+
| Name         | Type         | Description                            |
+==============+==============+========================================+
| \_baseOpName | string       | is the name of the command             |
+--------------+--------------+----------------------------------------+
| \_branchName | string       | is the type for the value              |
+--------------+--------------+----------------------------------------+
| \_branchCode | bytes1       | is the code for the certain name and   |
|              |              | its type                               |
+--------------+--------------+----------------------------------------+
| \_selector   | bytes4       | is the selector of the function from   |
|              |              | the Parser for this command            |
+--------------+--------------+----------------------------------------+

\_addOperator
~~~~~~~~~~~~~

.. code:: solidity

   function _addOperator(string _op, uint256 _priority) internal

*Adds the operator by its priority Note: bigger number => bigger
priority*

.. _parameters-35:

Parameters
^^^^^^^^^^

========== ======= ===============================
Name       Type    Description
========== ======= ===============================
\_op       string  is the name of the operator
\_priority uint256 is the priority of the operator
========== ======= ===============================

\_addAlias
~~~~~~~~~~

.. code:: solidity

   function _addAlias(string _baseCmd, string _alias) internal

*Adds an alias to the already existing DSL command*

.. _parameters-36:

Parameters
^^^^^^^^^^

========= ====== ==============================================
Name      Type   Description
========= ====== ==============================================
\_baseCmd string is the name of the command
\_alias   string is the alias command name for the base command
========= ====== ==============================================

ContextFactory
--------------

deployedContexts
~~~~~~~~~~~~~~~~

.. code:: solidity

   address[] deployedContexts

NewContext
~~~~~~~~~~

.. code:: solidity

   event NewContext(address context)

deployContext
~~~~~~~~~~~~~

.. code:: solidity

   function deployContext(address _app) external returns (address _contextAddr)

Deploy new Context contract

.. _parameters-37:

Parameters
^^^^^^^^^^

===== ======= ==============================
Name  Type    Description
===== ======= ==============================
\_app address Address of the end application
===== ======= ==============================

.. _return-values-12:

Return Values
^^^^^^^^^^^^^

============= ======= ==================================
Name          Type    Description
============= ======= ==================================
\_contextAddr address Address of a newly created Context
============= ======= ==================================

getDeployedContextsLen
~~~~~~~~~~~~~~~~~~~~~~

.. code:: solidity

   function getDeployedContextsLen() external view returns (uint256)

.. _parser-1:

Parser
------

\_Parser of DSL code This contract is a singleton and should not be
deployed more than once

One of the core contracts of the project. It parses DSL expression that
comes from user. After parsing code in Parser a bytecode of the DSL
program is generated as stored in Context

DSL code in postfix notation as string -> Parser -> raw bytecode\_

.. _program-1:

program
~~~~~~~

.. code:: solidity

   bytes program

cmds
~~~~

.. code:: solidity

   string[] cmds

cmdIdx
~~~~~~

.. code:: solidity

   uint256 cmdIdx

labelPos
~~~~~~~~

.. code:: solidity

   mapping(string => uint256) labelPos

.. _parse-1:

parse
~~~~~

.. code:: solidity

   function parse(address _preprAddr, address _ctxAddr, string _codeRaw) external

*Transform DSL code from array in infix notation to raw bytecode*

.. _parameters-38:

Parameters
^^^^^^^^^^

=========== ======= ========================================
Name        Type    Description
=========== ======= ========================================
\_preprAddr address 
\_ctxAddr   address Context contract interface address
\_codeRaw   string  Input code as a string in infix notation
=========== ======= ========================================

asmSetLocalBool
~~~~~~~~~~~~~~~

.. code:: solidity

   function asmSetLocalBool() public

\_Updates the program with the bool value

Example of a command:

::

   bool true
   ```_

   ### asmSetUint256

   ```solidity
   function asmSetUint256() public

\_Updates the program with the local variable value

Example of a command:

::

   (uint256 5 + uint256 7) setUint256 VARNAME
   ```_

   ### asmDeclare

   ```solidity
   function asmDeclare(address _ctxAddr) public

\_Updates the program with the name(its position) of the array

Example of a command:

::

   declare ARR_NAME
   ```_

   ### asmGet

   ```solidity
   function asmGet() public

\_Updates the program with the element by index from the provived
array’s name

Example of a command:

::

   get 3 USERS
   ```_

   ### asmPush

   ```solidity
   function asmPush() public

\_Updates the program with the new item for the array, can be
``uint256``, ``address`` and ``struct name`` types.

Example of a command:

::

   push ITEM ARR_NAME
   ```_

   ### asmVar

   ```solidity
   function asmVar() public

\_Updates the program with the loadLocal variable

Example of command:

::

   var NUMBER
   ```_

   ### asmLoadRemote

   ```solidity
   function asmLoadRemote(address _ctxAddr) public

\_Updates the program with the loadRemote variable

Example of a command:

::

   loadRemote bool MARY_ADDRESS 9A676e781A523b5d0C0e43731313A708CB607508
   ```_

   ### asmBool

   ```solidity
   function asmBool() public

*Concatenates and updates previous ``program`` with the ``0x01``
bytecode of ``true`` value otherwise ``0x00`` for ``false``*

asmUint256
~~~~~~~~~~

.. code:: solidity

   function asmUint256() public

*Concatenates and updates previous ``program`` with the bytecode of
uint256 value*

asmSend
~~~~~~~

.. code:: solidity

   function asmSend() public

\_Updates previous ``program`` with the amount that will be send (in
wei)

Example of a command:

::

   sendEth RECEIVER 1234
   ```_

   ### asmTransfer

   ```solidity
   function asmTransfer() public

\_Updates previous ``program`` with the amount of tokens that will be
transfer to reciever(in wei). The ``TOKEN`` and ``RECEIVER`` parameters
should be stored in smart contract

Example of a command:

::

   transfer TOKEN RECEIVER 1234
   ```_

   ### asmTransferVar

   ```solidity
   function asmTransferVar() public

\_Updates previous ``program`` with the amount of tokens that will be
transfer to reciever(in wei). The ``TOKEN``, ``RECEIVER``, ``AMOUNT``
parameters should be stored in smart contract

Example of a command:

::

   transferVar TOKEN RECEIVER AMOUNT
   ```_

   ### asmTransferFrom

   ```solidity
   function asmTransferFrom() public

\_Updates previous ``program`` with the amount of tokens that will be
transfer from the certain address to reciever(in wei). The ``TOKEN``,
``FROM``, ``TO`` address parameters should be stored in smart contract

Example of a command:

::

   transferFrom TOKEN FROM TO 1234
   ```_

   ### asmTransferFromVar

   ```solidity
   function asmTransferFromVar() public

\_Updates previous ``program`` with the amount of tokens that will be
transfer from the certain address to reciever(in wei). The ``TOKEN``,
``FROM``, ``TO``, ``AMOUNT`` parameters should be stored in smart
contract

Example of a command:

::

   transferFromVar TOKEN FROM TO AMOUNT
   ```_

   ### asmBalanceOf

   ```solidity
   function asmBalanceOf() public

\_Updates previous ``program`` with getting the amount of tokens The
``TOKEN``, ``USER`` address parameters should be stored in smart
contract

Example of a command:

::

   balanceOf TOKEN USER
   ```_

   ### asmLengthOf

   ```solidity
   function asmLengthOf() public

\_Updates previous ``program`` with getting the length of the dsl array
by its name The command return non zero value only if the array name was
declared and have at least one value. Check: ``declareArr`` and ``push``
commands for DSL arrays

Example of a command:

::

   lengthOf ARR_NAME
   ```_

   ### asmSumOf

   ```solidity
   function asmSumOf() public

\_Updates previous ``program`` with the name of the dsl array that will
be used to sum uint256 variables

Example of a command:

::

   sumOf ARR_NAME
   ```_

   ### asmSumThroughStructs

   ```solidity
   function asmSumThroughStructs() public

\_Updates previous ``program`` with the name of the dsl array and name
of variable in the DSL structure that will be used to sum uint256
variables

Example of a command:

::

   struct BOB {
     lastPayment: 3
   }

   struct ALISA {
     lastPayment: 300
   }

   sumOf USERS.lastPayment
   ```_

   ### asmIfelse

   ```solidity
   function asmIfelse() public

\_Updates previous ``program`` for positive and negative branch position

Example of a command:

::

   6 > 5 // condition is here must return true or false
   ifelse AA BB
   end

   branch AA {
     // code for `positive` branch
   }

   branch BB {
     // code for `negative` branch
   }
   ```_

   ### asmIf

   ```solidity
   function asmIf() public

\_Updates previous ``program`` for positive branch position

Example of a command:

::

   6 > 5 // condition is here must return true or false
   if POSITIVE_ACTION
   end

   POSITIVE_ACTION {
     // code for `positive` branch
   }
   ```_

   ### asmFunc

   ```solidity
   function asmFunc() public

\_Updates previous ``program`` for function code

Example of a command:

::

   func NAME_OF_FUNCTION

   NAME_OF_FUNCTION {
     // code for the body of function
   }
   ```_

   ### asmStruct

   ```solidity
   function asmStruct(address _ctxAddr) public

\_Updates previous ``program`` for DSL struct. This function rebuilds
variable parameters using a name of the structure, dot symbol and the
name of each parameter in the structure

Example of DSL command:

::

   struct BOB {
     account: 0x47f8a90ede3d84c7c0166bd84a4635e4675accfc,
     lastPayment: 3
   }

Example of commands that uses for this functions:
``cmds = ['struct', 'BOB', 'lastPayment', '3', 'account', '0x47f..', 'endStruct']``

``endStruct`` word is used as an indicator for the ending loop for the
structs parameters\_

asmForLoop
~~~~~~~~~~

.. code:: solidity

   function asmForLoop() public

*Parses variable names in for-loop & skip the unnecessary ``in``
parameter Ex. [‘for’, ‘LP_INITIAL’, ‘in’, ‘LPS_INITIAL’]*

asmEnableRecord
~~~~~~~~~~~~~~~

.. code:: solidity

   function asmEnableRecord() public

*Parses the ``record id`` and the ``agreement address`` parameters Ex.
[‘enable’, ‘56’, ‘for’, ‘9A676e781A523b5d0C0e43731313A708CB607508’]*

\_isLabel
~~~~~~~~~

.. code:: solidity

   function _isLabel(string _name) internal view returns (bool)

*returns ``true`` if the name of ``if/ifelse branch`` or ``function``
exists in the labelPos list otherwise returns ``false``*

\_parseCode
~~~~~~~~~~~

.. code:: solidity

   function _parseCode(address _ctxAddr, string[] code) internal

*Сonverts a list of commands to bytecode*

\_parseOpcodeWithParams
~~~~~~~~~~~~~~~~~~~~~~~

.. code:: solidity

   function _parseOpcodeWithParams(address _ctxAddr) internal

*Updates the bytecode ``program`` in dependence on commands that were
provided in ``cmds`` list*

\_nextCmd
~~~~~~~~~

.. code:: solidity

   function _nextCmd() internal returns (string)

*Returns next commad from the cmds list, increases the command index
``cmdIdx`` by 1*

.. _return-values-13:

Return Values
^^^^^^^^^^^^^

==== ====== ==============
Name Type   Description
==== ====== ==============
[0]  string nextCmd string
==== ====== ==============

\_parseVariable
~~~~~~~~~~~~~~~

.. code:: solidity

   function _parseVariable() internal

*Updates previous ``program`` with the next provided command*

\_parseBranchOf
~~~~~~~~~~~~~~~

.. code:: solidity

   function _parseBranchOf(address _ctxAddr, string baseOpName) internal

*Updates previous ``program`` with the branch name, like ``loadLocal``
or ``loadRemote`` of command and its additional used type*

\_parseAddress
~~~~~~~~~~~~~~

.. code:: solidity

   function _parseAddress() internal

*Updates previous ``program`` with the address command that is a value*

Preprocessor
------------

\_Preprocessor of DSL code This contract is a singleton and should not
be deployed more than once

TODO: add description about Preprocessor as a single contract of the
project It can remove comments that were created by user in the DSL code
string. It transforms the users DSL code string to the list of commands
that can be used in a Parser contract.

DSL code in postfix notation as user’s string code -> Preprocessor ->
each command is separated in the commands list\_

.. _parameters-39:

parameters
~~~~~~~~~~

.. code:: solidity

   mapping(uint256 => struct IPreprocessor.FuncParameter) parameters

result
~~~~~~

.. code:: solidity

   string[] result

strStack
~~~~~~~~

.. code:: solidity

   contract StringStack strStack

DOT_SYMBOL
~~~~~~~~~~

.. code:: solidity

   bytes1 DOT_SYMBOL

.. _constructor-3:

constructor
~~~~~~~~~~~

.. code:: solidity

   constructor() public

transform
~~~~~~~~~

.. code:: solidity

   function transform(address _ctxAddr, string _program) external returns (string[])

\_The main function that transforms the user’s DSL code string to the
list of commands.

Example: The user’s DSL code string is

::

   uint256 6 setUint256 A

The end result after executing a ``transform()`` function is

::

   ['uint256', '6', 'setUint256', 'A']
   ```_

   #### Parameters

   | Name | Type | Description |
   | ---- | ---- | ----------- |
   | _ctxAddr | address | is a context contract address |
   | _program | string | is a user's DSL code string |

   #### Return Values

   | Name | Type | Description |
   | ---- | ---- | ----------- |
   | [0] | string[] | the list of commands that storing `result` |

   ### cleanString

   ```solidity
   function cleanString(string _program) public pure returns (string _cleanedProgram)

\_Searches the comments in the program and removes comment lines
Example: The user’s DSL code string is

::

    bool true
    // uint256 2 * uint256 5

The end result after executing a ``cleanString()`` function is

::

   bool true
   ```_

   #### Parameters

   | Name | Type | Description |
   | ---- | ---- | ----------- |
   | _program | string | is a current program string |

   #### Return Values

   | Name | Type | Description |
   | ---- | ---- | ----------- |
   | _cleanedProgram | string | new string program that contains only clean code without comments |

   ### split

   ```solidity
   function split(string _program) public returns (string[])

\_Splits the user’s DSL code string to the list of commands avoiding
several symbols: - removes additional and useless symbols as ’ ‘,
``\\n`` - defines and adding help ’end’ symbol for the ifelse condition
- defines and cleans the code from ``{`` and ``}`` symbols

Example: The user’s DSL code string is

::

   (var TIMESTAMP > var INIT)

The end result after executing a ``split()`` function is

::

   ['var', 'TIMESTAMP', '>', 'var', 'INIT']
   ```_

   #### Parameters

   | Name | Type | Description |
   | ---- | ---- | ----------- |
   | _program | string | is a user's DSL code string |

   #### Return Values

   | Name | Type | Description |
   | ---- | ---- | ----------- |
   | [0] | string[] | the list of commands that storing in `result` |

   ### infixToPostfix

   ```solidity
   function infixToPostfix(address _ctxAddr, string[] _code, contract StringStack _stack) public returns (string[])

\_Rebuild and transforms the user’s DSL commands (can be prepared by the
``split()`` function) to the list of commands.

Example: The user’s DSL command contains

::

   ['1', '+', '2']

The result after executing a ``infixToPostfix()`` function is

::

   ['uint256', '1', 'uint256', '2', '+']
   ```_

   #### Parameters

   | Name | Type | Description |
   | ---- | ---- | ----------- |
   | _ctxAddr | address | is a context contract address |
   | _code | string[] | is a DSL command list |
   | _stack | contract StringStack |  |

   #### Return Values

   | Name | Type | Description |
   | ---- | ---- | ----------- |
   | [0] | string[] | _stack uses for getting and storing temporary string data rebuild the list of commands |

   ### _getMultiplier

   ```solidity
   function _getMultiplier(string _chunk) internal pure returns (uint256)

*checks the value, and returns the corresponding multiplier. If it is
Ether, then it returns 1000000000000000000, If it is GWEI, then it
returns 1000000000*

.. _parameters-40:

Parameters
^^^^^^^^^^

======= ====== ==================================
Name    Type   Description
======= ====== ==================================
\_chunk string is a command from DSL command list
======= ====== ==================================

.. _return-values-14:

Return Values
^^^^^^^^^^^^^

==== ======= =====================================
Name Type    Description
==== ======= =====================================
[0]  uint256 returns the corresponding multiplier.
==== ======= =====================================

\_getNames
~~~~~~~~~~

.. code:: solidity

   function _getNames(string _chunk) internal view returns (bool success, string arrName, string structVar)

*Searching for a ``.`` (dot) symbol and returns names status for complex
string name. Ex. ``USERS.balance``: Where ``success`` =
true\ ``,``\ arrName\ ``=``\ USERS\ ``,``\ structVar\ ``=``\ balance\ ``; otherwise it returns``\ success\ ``= false``
with empty string results*

.. _parameters-41:

Parameters
^^^^^^^^^^

======= ====== ==================================
Name    Type   Description
======= ====== ==================================
\_chunk string is a command from DSL command list
======= ====== ==================================

.. _return-values-15:

Return Values
^^^^^^^^^^^^^

+--------------+--------------+----------------------------------------+
| Name         | Type         | Description                            |
+==============+==============+========================================+
| success      | bool         | if user provides complex name, result  |
|              |              | is true                                |
+--------------+--------------+----------------------------------------+
| arrName      | string       | if user provided complex name, result  |
|              |              | is the name of structure               |
+--------------+--------------+----------------------------------------+
| structVar    | string       | if user provided complex name, result  |
|              |              | is the name of structure variable      |
+--------------+--------------+----------------------------------------+

\_parseChunk
~~~~~~~~~~~~

.. code:: solidity

   function _parseChunk(string _chunk, uint256 _currencyMultiplier) internal pure returns (string)

*returned parsed chunk, values can be address with 0x parameter or be
uint256 type*

.. _parameters-42:

Parameters
^^^^^^^^^^

==================== ======= =================================
Name                 Type    Description
==================== ======= =================================
\_chunk              string  provided string
\_currencyMultiplier uint256 provided number of the multiplier
==================== ======= =================================

.. _return-values-16:

Return Values
^^^^^^^^^^^^^

==== ====== ===============================================
Name Type   Description
==== ====== ===============================================
[0]  string updated \_chunk value in dependence on its type
==== ====== ===============================================

\_parseNumber
~~~~~~~~~~~~~

.. code:: solidity

   function _parseNumber(string _chunk, uint256 _currencyMultiplier) internal pure returns (string updatedChunk)

*As the string of values can be simple and complex for DSL this function
returns a number in Wei regardless of what type of number parameter was
provided by the user. For example: ``uint256 1000000`` - simple
``uint256 1e6 - complex``*

.. _parameters-43:

Parameters
^^^^^^^^^^

==================== ======= =================================
Name                 Type    Description
==================== ======= =================================
\_chunk              string  provided number
\_currencyMultiplier uint256 provided number of the multiplier
==================== ======= =================================

.. _return-values-17:

Return Values
^^^^^^^^^^^^^

============ ====== =======================================
Name         Type   Description
============ ====== =======================================
updatedChunk string amount in Wei of provided \_chunk value
============ ====== =======================================

\_isCurrencySymbol
~~~~~~~~~~~~~~~~~~

.. code:: solidity

   function _isCurrencySymbol(string _chunk) internal pure returns (bool)

*Check is chunk is a currency symbol*

.. _parameters-44:

Parameters
^^^^^^^^^^

======= ====== ===========================================
Name    Type   Description
======= ====== ===========================================
\_chunk string is a current chunk from the DSL string code
======= ====== ===========================================

.. _return-values-18:

Return Values
^^^^^^^^^^^^^

+--------------+--------------+----------------------------------------+
| Name         | Type         | Description                            |
+==============+==============+========================================+
| [0]          | bool         | true or false based on whether chunk   |
|              |              | is a currency symbol or not            |
+--------------+--------------+----------------------------------------+

\_updateUINT256param
~~~~~~~~~~~~~~~~~~~~

.. code:: solidity

   function _updateUINT256param() internal

*Pushes additional ‘uint256’ string to results in case, if there are no
types provided for uint256 values or loadRemote command, is not in the
processing or the last chunk that was added to results is not ‘uint256’*

\_parseFuncParams
~~~~~~~~~~~~~~~~~

.. code:: solidity

   function _parseFuncParams(string _chunk, string _currentName, bool _isFunc) internal returns (bool)

*Checks parameters and updates DSL code depending on what kind of
function was provided. This internal function expects ‘func’ that can be
with and without parameters.*

.. _parameters-45:

Parameters
^^^^^^^^^^

============= ====== ===========================================
Name          Type   Description
============= ====== ===========================================
\_chunk       string is a current chunk from the DSL string code
\_currentName string is a current name of function
\_isFunc      bool   describes if the func opcode was occured
============= ====== ===========================================

\_parseFuncMainData
~~~~~~~~~~~~~~~~~~~

.. code:: solidity

   function _parseFuncMainData(string _chunk, string _currentName, bool _isFunc, bool _isName) internal pure returns (bool, bool, string)

*Returns updated parameters for the ``func`` opcode processing Pushes
the command that saves parameter in the smart contract instead of the
parameters that were provided for parsing. The function will store the
command like ``uint256 7 setUint256 NUMBER_VAR`` and remove the
parameter like ``uint256 7``. The DSL command will be stored before the
function body. For the moment it works only with uint256 type.*

.. _parameters-46:

Parameters
^^^^^^^^^^

+--------------+--------------+----------------------------------------+
| Name         | Type         | Description                            |
+==============+==============+========================================+
| \_chunk      | string       | is a current chunk from the DSL string |
|              |              | code                                   |
+--------------+--------------+----------------------------------------+
| \            | string       | is a current name of function          |
| _currentName |              |                                        |
+--------------+--------------+----------------------------------------+
| \_isFunc     | bool         | describes if the func opcode was       |
|              |              | occured                                |
+--------------+--------------+----------------------------------------+
| \_isName     | bool         | describes if the name for the function |
|              |              | was already set                        |
+--------------+--------------+----------------------------------------+

.. _return-values-19:

Return Values
^^^^^^^^^^^^^

==== ====== ========================================================
Name Type   Description
==== ====== ========================================================
[0]  bool   isFunc the new state of \_isFunc for function processing
[1]  bool   isName the new state of \_isName for function processing
[2]  string name the new name of the function
==== ====== ========================================================

\_rebuildParameters
~~~~~~~~~~~~~~~~~~~

.. code:: solidity

   function _rebuildParameters(uint256 _paramsCount, string _nameOfFunc) internal

*Rebuilds parameters to DSL commands in result’s list. Pushes the
command that saves parameter in the smart contract instead of the
parameters that were provided for parsing. The function will store the
command like ``uint256 7 setUint256 NUMBER_VAR`` and remove the
parameter like ``uint256 7``. The DSL command will be stored before the
function body. For the moment it works only with uint256 type.*

.. _parameters-47:

Parameters
^^^^^^^^^^

+--------------+--------------+----------------------------------------+
| Name         | Type         | Description                            |
+==============+==============+========================================+
| \            | uint256      | is an amount of parameters that        |
| _paramsCount |              | provided after the name of function    |
+--------------+--------------+----------------------------------------+
| \_nameOfFunc | string       | is a name of function that is used to  |
|              |              | generate the name of variables         |
+--------------+--------------+----------------------------------------+

\_pushParameters
~~~~~~~~~~~~~~~~

.. code:: solidity

   function _pushParameters(uint256 _count) internal

*Pushes parameters to result’s list depend on their type for each value*

.. _parameters-48:

Parameters
^^^^^^^^^^

+--------------+--------------+----------------------------------------+
| Name         | Type         | Description                            |
+==============+==============+========================================+
| \_count      | uint256      | is an amount of parameters provided    |
|              |              | next to the name of func               |
+--------------+--------------+----------------------------------------+

\_saveParameter
~~~~~~~~~~~~~~~

.. code:: solidity

   function _saveParameter(uint256 _index, string _type, string _value, string _nameOfFunc) internal

*Saves parameters in mapping checking/using valid type for each value*

.. _parameters-49:

Parameters
^^^^^^^^^^

+--------------+--------------+----------------------------------------+
| Name         | Type         | Description                            |
+==============+==============+========================================+
| \_index      | uint256      | is a current chunk index from          |
|              |              | temporary chunks                       |
+--------------+--------------+----------------------------------------+
| \_type       | string       | is a type of the parameter             |
+--------------+--------------+----------------------------------------+
| \_value      | string       | is a value of the parameter            |
+--------------+--------------+----------------------------------------+
| \_nameOfFunc | string       | is a name of function that is used to  |
|              |              | generate the name of the current       |
|              |              | variable                               |
+--------------+--------------+----------------------------------------+

\_cleanCode
~~~~~~~~~~~

.. code:: solidity

   function _cleanCode(uint256 _count) internal

*Clears useless variables from the DSL code string as all needed
parameters are already stored in chunks list*

.. _parameters-50:

Parameters
^^^^^^^^^^

+--------------+--------------+----------------------------------------+
| Name         | Type         | Description                            |
+==============+==============+========================================+
| \_count      | uint256      | is an amount of parameters provided    |
|              |              | next to the name of func. As           |
|              |              | parameters are stored with their       |
|              |              | types, the \_count variable was        |
|              |              | already multiplied to 2                |
+--------------+--------------+----------------------------------------+

\_rebuildParameter
~~~~~~~~~~~~~~~~~~

.. code:: solidity

   function _rebuildParameter(string _type, string _value, string _variableName) internal

*Preparing and pushes the DSL command to results. The comand will save
this parameter and its name in the smart contract. For example:
``uint256 7 setUint256 NUMBER_VAR`` For the moment it works only with
uint256 types.*

.. _parameters-51:

Parameters
^^^^^^^^^^

+--------------+--------------+----------------------------------------+
| Name         | Type         | Description                            |
+==============+==============+========================================+
| \_type       | string       | is a type of the parameter             |
+--------------+--------------+----------------------------------------+
| \_value      | string       | is a value of the parameter            |
+--------------+--------------+----------------------------------------+
| \_           | string       | is a name of variable that was         |
| variableName |              | generated before                       |
+--------------+--------------+----------------------------------------+

\_pushFuncName
~~~~~~~~~~~~~~

.. code:: solidity

   function _pushFuncName(string _name) internal

*Pushes the func opcode and the name of the function*

.. _parameters-52:

Parameters
^^^^^^^^^^

====== ====== =================================
Name   Type   Description
====== ====== =================================
\_name string is a current name of the function
====== ====== =================================

\_isOperator
~~~~~~~~~~~~

.. code:: solidity

   function _isOperator(address _ctxAddr, string op) internal view returns (bool)

\_isAlias
~~~~~~~~~

.. code:: solidity

   function _isAlias(address _ctxAddr, string _cmd) internal view returns (bool)

*Checks if a string is an alias to a command from DSL*

\_getCommentSymbol
~~~~~~~~~~~~~~~~~~

.. code:: solidity

   function _getCommentSymbol(uint256 _index, string _program, string char) internal pure returns (uint256, uint256, bool)

\_Checks if a symbol is a comment, then increases *index to the next
no-comment symbol avoiding an additional iteration*

.. _parameters-53:

Parameters
^^^^^^^^^^

+--------------+--------------+----------------------------------------+
| Name         | Type         | Description                            |
+==============+==============+========================================+
| \_index      | uint256      | is a current index of a char that      |
|              |              | might be changed                       |
+--------------+--------------+----------------------------------------+
| \_program    | string       | is a current program string            |
+--------------+--------------+----------------------------------------+
| char         | string       |                                        |
+--------------+--------------+----------------------------------------+

.. _return-values-20:

Return Values
^^^^^^^^^^^^^

==== ======= =================
Name Type    Description
==== ======= =================
[0]  uint256 new index
[1]  uint256 searchedSymbolLen
[2]  bool    isCommeted
==== ======= =================

\_getEndCommentSymbol
~~~~~~~~~~~~~~~~~~~~~

.. code:: solidity

   function _getEndCommentSymbol(uint256 _ssl, uint256 _i, string _p, string char) internal pure returns (uint256, bool)

\_Checks if a symbol is an end symbol of a comment, then increases
*index to the next no-comment symbol avoiding an additional iteration*

.. _parameters-54:

Parameters
^^^^^^^^^^

===== ======= ==================================================
Name  Type    Description
===== ======= ==================================================
\_ssl uint256 is a searched symbol len that might be 0, 1, 2
\_i   uint256 is a current index of a char that might be changed
\_p   string  is a current program string
char  string  
===== ======= ==================================================

.. _return-values-21:

Return Values
^^^^^^^^^^^^^

==== ======= ==============================
Name Type    Description
==== ======= ==============================
[0]  uint256 index is a new index of a char
[1]  bool    isCommeted
==== ======= ==============================

\_canGetSymbol
~~~~~~~~~~~~~~

.. code:: solidity

   function _canGetSymbol(uint256 _index, string _program) internal pure returns (bool)

\_Checks if it is possible to get next char from a *program*

.. _parameters-55:

Parameters
^^^^^^^^^^

========= ======= ============================
Name      Type    Description
========= ======= ============================
\_index   uint256 is a current index of a char
\_program string  is a current program string
========= ======= ============================

.. _return-values-22:

Return Values
^^^^^^^^^^^^^

==== ==== =======================================================
Name Type Description
==== ==== =======================================================
[0]  bool true if program has the next symbol, otherwise is false
==== ==== =======================================================

\_isDirectUseUint256
~~~~~~~~~~~~~~~~~~~~

.. code:: solidity

   function _isDirectUseUint256(bool _directUseUint256, bool _isStruct, string _chunk) internal pure returns (bool _isDirect)

*This function is used to check if ‘transferFrom’, ‘sendEth’ and
‘transfer’ functions(opcodes) won’t use ‘uint256’ opcode during code
execution directly. So it needs to be sure that executed code won’t mess
up parameters for the simple number and a number that be used for these
functions.*

.. _parameters-56:

Parameters
^^^^^^^^^^

+--------------+--------------+----------------------------------------+
| Name         | Type         | Description                            |
+==============+==============+========================================+
| \_dire       | bool         | set by default from the outer          |
| ctUseUint256 |              | function. Allows to keep current state |
|              |              | of a contract                          |
+--------------+--------------+----------------------------------------+
| \_isStruct   | bool         |                                        |
+--------------+--------------+----------------------------------------+
| \_chunk      | string       | is a current chunk from the outer      |
|              |              | function                               |
+--------------+--------------+----------------------------------------+

.. _return-values-23:

Return Values
^^^^^^^^^^^^^

+--------------+--------------+----------------------------------------+
| Name         | Type         | Description                            |
+==============+==============+========================================+
| \_isDirect   | bool         | is true if a chunk is matched one from |
|              |              | the opcode list, otherwise is false    |
+--------------+--------------+----------------------------------------+

\_updateRemoteParams
~~~~~~~~~~~~~~~~~~~~

.. code:: solidity

   function _updateRemoteParams(bool _loadRemoteFlag, uint256 _loadRemoteVarCount, string _chunk) internal pure returns (bool _flag, uint256 _count)

*As a ‘loadRemote’ opcode has 4 parameters in total and two of them are
numbers, so it is important to be sure that executed code under
‘loadRemote’ won’t mess parameters with the simple uint256 numbers.*

.. _parameters-57:

Parameters
^^^^^^^^^^

+--------------+--------------+----------------------------------------+
| Name         | Type         | Description                            |
+==============+==============+========================================+
| \_lo         | bool         | is used to check if it was started the |
| adRemoteFlag |              | set of parameters for ‘loadRemote’     |
|              |              | opcode                                 |
+--------------+--------------+----------------------------------------+
| \_loadRe     | uint256      | is used to check if it was finished    |
| moteVarCount |              | the set of parameters for ‘loadRemote’ |
|              |              | opcode                                 |
+--------------+--------------+----------------------------------------+
| \_chunk      | string       | is a current chunk from the outer      |
|              |              | function                               |
+--------------+--------------+----------------------------------------+

.. _return-values-24:

Return Values
^^^^^^^^^^^^^

+--------------+--------------+----------------------------------------+
| Name         | Type         | Description                            |
+==============+==============+========================================+
| \_flag       | bool         | is an updated or current value of      |
|              |              | \_loadRemoteFlag                       |
+--------------+--------------+----------------------------------------+
| \_count      | uint256      | is an updated or current value of      |
|              |              | \_loadRemoteVarCount                   |
+--------------+--------------+----------------------------------------+

LinkedList
----------

EMPTY
~~~~~

.. code:: solidity

   bytes32 EMPTY

heads
~~~~~

.. code:: solidity

   mapping(bytes32 => bytes32) heads

types
~~~~~

.. code:: solidity

   mapping(bytes32 => bytes1) types

lengths
~~~~~~~

.. code:: solidity

   mapping(bytes32 => uint256) lengths

getType
~~~~~~~

.. code:: solidity

   function getType(bytes32 _arrName) external view returns (bytes1)

*Returns length of the array*

.. _parameters-58:

Parameters
^^^^^^^^^^

========= ======= ===============================
Name      Type    Description
========= ======= ===============================
\_arrName bytes32 is a bytecode of the array name
========= ======= ===============================

getLength
~~~~~~~~~

.. code:: solidity

   function getLength(bytes32 _arrName) external view returns (uint256)

*Returns length of the array*

.. _parameters-59:

Parameters
^^^^^^^^^^

========= ======= ===============================
Name      Type    Description
========= ======= ===============================
\_arrName bytes32 is a bytecode of the array name
========= ======= ===============================

get
~~~

.. code:: solidity

   function get(uint256 _index, bytes32 _arrName) public view returns (bytes32 data)

*Returns the item data from the array by its index*

.. _parameters-60:

Parameters
^^^^^^^^^^

+--------------+--------------+----------------------------------------+
| Name         | Type         | Description                            |
+==============+==============+========================================+
| \_index      | uint256      | is an index of the item in the array   |
|              |              | that starts from 0                     |
+--------------+--------------+----------------------------------------+
| \_arrName    | bytes32      | is a bytecode of the array name        |
+--------------+--------------+----------------------------------------+

.. _return-values-25:

Return Values
^^^^^^^^^^^^^

+--------------+--------------+----------------------------------------+
| Name         | Type         | Description                            |
+==============+==============+========================================+
| data         | bytes32      | is a bytecode of the item from the     |
|              |              | array or empty bytes if no item exists |
|              |              | by this index                          |
+--------------+--------------+----------------------------------------+

declare
~~~~~~~

.. code:: solidity

   function declare(bytes1 _type, bytes32 _arrName) external

*Declares the new array in dependence of its type*

.. _parameters-61:

Parameters
^^^^^^^^^^

+--------------+--------------+----------------------------------------+
| Name         | Type         | Description                            |
+==============+==============+========================================+
| \_type       | bytes1       | is a bytecode type of the array.       |
|              |              | Bytecode of each type can be find in   |
|              |              | Context contract                       |
+--------------+--------------+----------------------------------------+
| \_arrName    | bytes32      | is a bytecode of the array name        |
+--------------+--------------+----------------------------------------+

addItem
~~~~~~~

.. code:: solidity

   function addItem(bytes32 _item, bytes32 _arrName) external

*Pushed item to the end of the array. Increases the length of the array*

.. _parameters-62:

Parameters
^^^^^^^^^^

+--------------+--------------+----------------------------------------+
| Name         | Type         | Description                            |
+==============+==============+========================================+
| \_item       | bytes32      | is a bytecode type of the array.       |
|              |              | Bytecode of each type can be find in   |
|              |              | Context contract                       |
+--------------+--------------+----------------------------------------+
| \_arrName    | bytes32      | is a bytecode of the array name        |
+--------------+--------------+----------------------------------------+

getHead
~~~~~~~

.. code:: solidity

   function getHead(bytes32 _arrName) public view returns (bytes32)

*Returns the head position of the array: - ``bytes32(0x0)`` value if
array has not declared yet, - ``bytes32(type(uint256).max`` if array was
just declared but it is empty - ``other bytecode`` with a position of
the first element of the array*

.. _parameters-63:

Parameters
^^^^^^^^^^

========= ======= ===============================
Name      Type    Description
========= ======= ===============================
\_arrName bytes32 is a bytecode of the array name
========= ======= ===============================

\_insertItem
~~~~~~~~~~~~

.. code:: solidity

   function _insertItem(bytes32 _position, bytes32 _item) internal

*Insert item in the array by provided position. Updates new storage
pointer for the future inserting*

\_updateLinkToNextItem
~~~~~~~~~~~~~~~~~~~~~~

.. code:: solidity

   function _updateLinkToNextItem(bytes32 _position, bytes32 _nextPosition) internal

*Updates the next position for the provided(current) position*

\_getEmptyMemoryPosition
~~~~~~~~~~~~~~~~~~~~~~~~

.. code:: solidity

   function _getEmptyMemoryPosition() internal view returns (bytes32 position)

\_Uses 0x40 position as free storage pointer that returns value of
current free position. In this contract it 0x40 position value updates
by *insertItem function anfter adding new item in the array. See: mload
- free memory pointer in the doc*

.. _return-values-26:

Return Values
^^^^^^^^^^^^^

+--------------+--------------+----------------------------------------+
| Name         | Type         | Description                            |
+==============+==============+========================================+
| position     | bytes32      | is a value that stores in the 0x40     |
|              |              | position in the storage                |
+--------------+--------------+----------------------------------------+

\_getData
~~~~~~~~~

.. code:: solidity

   function _getData(bytes32 _position) internal view returns (bytes32 data, bytes32 nextPosition)

*Returns the value of current position and the position(nextPosition) to
the next object in array*

.. _parameters-64:

Parameters
^^^^^^^^^^

========== ======= =======================================
Name       Type    Description
========== ======= =======================================
\_position bytes32 is a current item position in the array
========== ======= =======================================

.. _return-values-27:

Return Values
^^^^^^^^^^^^^

+--------------+--------------+----------------------------------------+
| Name         | Type         | Description                            |
+==============+==============+========================================+
| data         | bytes32      | is a current data stored in the        |
|              |              | \_position                             |
+--------------+--------------+----------------------------------------+
| nextPosition | bytes32      | is a next position to the next item in |
|              |              | the array                              |
+--------------+--------------+----------------------------------------+

.. _stack-1:

Stack
-----

.. _stack-2:

stack
~~~~~

.. code:: solidity

   uint256[] stack

length
~~~~~~

.. code:: solidity

   function length() external view returns (uint256)

seeLast
~~~~~~~

.. code:: solidity

   function seeLast() external view returns (uint256)

push
~~~~

.. code:: solidity

   function push(uint256 data) external

pop
~~~

.. code:: solidity

   function pop() external returns (uint256)

clear
~~~~~

.. code:: solidity

   function clear() external

.. _length-1:

\_length
~~~~~~~~

.. code:: solidity

   function _length() internal view returns (uint256)

.. _seelast-1:

\_seeLast
~~~~~~~~~

.. code:: solidity

   function _seeLast() internal view returns (uint256)

StringStack
-----------

.. _stack-3:

stack
~~~~~

.. code:: solidity

   string[] stack

.. _length-2:

length
~~~~~~

.. code:: solidity

   function length() external view returns (uint256)

.. _seelast-2:

seeLast
~~~~~~~

.. code:: solidity

   function seeLast() external view returns (string)

.. _push-1:

push
~~~~

.. code:: solidity

   function push(string data) external

.. _pop-1:

pop
~~~

.. code:: solidity

   function pop() external returns (string)

.. _clear-1:

clear
~~~~~

.. code:: solidity

   function clear() external

.. _length-3:

\_length
~~~~~~~~

.. code:: solidity

   function _length() internal view returns (uint256)

.. _seelast-3:

\_seeLast
~~~~~~~~~

.. code:: solidity

   function _seeLast() internal view returns (string)

IContext
--------

OpcodeLibNames
~~~~~~~~~~~~~~

.. code:: solidity

   enum OpcodeLibNames {
     ComparisonOpcodes,
     BranchingOpcodes,
     LogicalOpcodes,
     OtherOpcodes
   }

.. _anyone-1:

anyone
~~~~~~

.. code:: solidity

   function anyone() external view returns (address)

.. _stack-4:

stack
~~~~~

.. code:: solidity

   function stack() external view returns (contract Stack)

.. _program-2:

program
~~~~~~~

.. code:: solidity

   function program() external view returns (bytes)

.. _pc-1:

pc
~~

.. code:: solidity

   function pc() external view returns (uint256)

.. _nextpc-1:

nextpc
~~~~~~

.. code:: solidity

   function nextpc() external view returns (uint256)

.. _appaddr-1:

appAddr
~~~~~~~

.. code:: solidity

   function appAddr() external view returns (address)

.. _msgsender-1:

msgSender
~~~~~~~~~

.. code:: solidity

   function msgSender() external view returns (address)

.. _comparisonopcodes-1:

comparisonOpcodes
~~~~~~~~~~~~~~~~~

.. code:: solidity

   function comparisonOpcodes() external view returns (address)

.. _branchingopcodes-1:

branchingOpcodes
~~~~~~~~~~~~~~~~

.. code:: solidity

   function branchingOpcodes() external view returns (address)

.. _logicalopcodes-1:

logicalOpcodes
~~~~~~~~~~~~~~

.. code:: solidity

   function logicalOpcodes() external view returns (address)

.. _otheropcodes-1:

otherOpcodes
~~~~~~~~~~~~

.. code:: solidity

   function otherOpcodes() external view returns (address)

.. _msgvalue-1:

msgValue
~~~~~~~~

.. code:: solidity

   function msgValue() external view returns (uint256)

.. _opcodebyname-1:

opCodeByName
~~~~~~~~~~~~

.. code:: solidity

   function opCodeByName(string _name) external view returns (bytes1 _opcode)

.. _selectorbyopcode-1:

selectorByOpcode
~~~~~~~~~~~~~~~~

.. code:: solidity

   function selectorByOpcode(bytes1 _opcode) external view returns (bytes4 _selecotor)

.. _opcodelibnamebyopcode-1:

opcodeLibNameByOpcode
~~~~~~~~~~~~~~~~~~~~~

.. code:: solidity

   function opcodeLibNameByOpcode(bytes1 _opcode) external view returns (enum IContext.OpcodeLibNames _name)

.. _asmselectors-1:

asmSelectors
~~~~~~~~~~~~

.. code:: solidity

   function asmSelectors(string _name) external view returns (bytes4 _selecotor)

.. _opspriors-1:

opsPriors
~~~~~~~~~

.. code:: solidity

   function opsPriors(string _name) external view returns (uint256 _priority)

.. _operators-1:

operators
~~~~~~~~~

.. code:: solidity

   function operators(uint256 _index) external view returns (string _operator)

.. _branchselectors-1:

branchSelectors
~~~~~~~~~~~~~~~

.. code:: solidity

   function branchSelectors(string _baseOpName, bytes1 _branchCode) external view returns (bytes4 _selector)

.. _branchcodes-1:

branchCodes
~~~~~~~~~~~

.. code:: solidity

   function branchCodes(string _baseOpName, string _branchName) external view returns (bytes1 _branchCode)

.. _aliases-1:

aliases
~~~~~~~

.. code:: solidity

   function aliases(string _alias) external view returns (string _baseCmd)

.. _isstructvar-1:

isStructVar
~~~~~~~~~~~

.. code:: solidity

   function isStructVar(string _varName) external view returns (bool)

.. _forloopiterationsremaining-1:

forLoopIterationsRemaining
~~~~~~~~~~~~~~~~~~~~~~~~~~

.. code:: solidity

   function forLoopIterationsRemaining() external view returns (uint256)

.. _operatorslen-1:

operatorsLen
~~~~~~~~~~~~

.. code:: solidity

   function operatorsLen() external view returns (uint256)

.. _setcomparisonopcodesaddr-1:

setComparisonOpcodesAddr
~~~~~~~~~~~~~~~~~~~~~~~~

.. code:: solidity

   function setComparisonOpcodesAddr(address _opcodes) external

.. _setbranchingopcodesaddr-1:

setBranchingOpcodesAddr
~~~~~~~~~~~~~~~~~~~~~~~

.. code:: solidity

   function setBranchingOpcodesAddr(address _opcodes) external

.. _setlogicalopcodesaddr-1:

setLogicalOpcodesAddr
~~~~~~~~~~~~~~~~~~~~~

.. code:: solidity

   function setLogicalOpcodesAddr(address _opcodes) external

.. _setotheropcodesaddr-1:

setOtherOpcodesAddr
~~~~~~~~~~~~~~~~~~~

.. code:: solidity

   function setOtherOpcodesAddr(address _opcodes) external

.. _setprogram-1:

setProgram
~~~~~~~~~~

.. code:: solidity

   function setProgram(bytes _data) external

.. _programat-1:

programAt
~~~~~~~~~

.. code:: solidity

   function programAt(uint256 _index, uint256 _step) external view returns (bytes)

.. _programslice-1:

programSlice
~~~~~~~~~~~~

.. code:: solidity

   function programSlice(bytes _payload, uint256 _index, uint256 _step) external view returns (bytes)

.. _setpc-1:

setPc
~~~~~

.. code:: solidity

   function setPc(uint256 _pc) external

.. _setnextpc-1:

setNextPc
~~~~~~~~~

.. code:: solidity

   function setNextPc(uint256 _nextpc) external

.. _incpc-1:

incPc
~~~~~

.. code:: solidity

   function incPc(uint256 _val) external

.. _setappaddress-1:

setAppAddress
~~~~~~~~~~~~~

.. code:: solidity

   function setAppAddress(address _addr) external

.. _setmsgsender-1:

setMsgSender
~~~~~~~~~~~~

.. code:: solidity

   function setMsgSender(address _msgSender) external

.. _setmsgvalue-1:

setMsgValue
~~~~~~~~~~~

.. code:: solidity

   function setMsgValue(uint256 _msgValue) external

.. _setstructvars-1:

setStructVars
~~~~~~~~~~~~~

.. code:: solidity

   function setStructVars(string _structName, string _varName, string _fullName) external

.. _structparams-1:

structParams
~~~~~~~~~~~~

.. code:: solidity

   function structParams(bytes4 _structName, bytes4 _varName) external view returns (bytes4 _fullName)

.. _setforloopiterationsremaining-1:

setForLoopIterationsRemaining
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

.. code:: solidity

   function setForLoopIterationsRemaining(uint256 _forLoopIterationsRemaining) external

IERC20
------

*Interface of the ERC20 standard as defined in the EIP.*

totalSupply
~~~~~~~~~~~

.. code:: solidity

   function totalSupply() external view returns (uint256)

*Returns the amount of tokens in existence.*

balanceOf
~~~~~~~~~

.. code:: solidity

   function balanceOf(address account) external view returns (uint256)

*Returns the amount of tokens owned by ``account``.*

transfer
~~~~~~~~

.. code:: solidity

   function transfer(address recipient, uint256 amount) external returns (bool)

\_Moves ``amount`` tokens from the caller’s account to ``recipient``.

Returns a boolean value indicating whether the operation succeeded.

Emits a {Transfer} event.\_

allowance
~~~~~~~~~

.. code:: solidity

   function allowance(address owner, address spender) external view returns (uint256)

\_Returns the remaining number of tokens that ``spender`` will be
allowed to spend on behalf of ``owner`` through {transferFrom}. This is
zero by default.

This value changes when {approve} or {transferFrom} are called.\_

approve
~~~~~~~

.. code:: solidity

   function approve(address spender, uint256 amount) external returns (bool)

\_Sets ``amount`` as the allowance of ``spender`` over the caller’s
tokens.

Returns a boolean value indicating whether the operation succeeded.

IMPORTANT: Beware that changing an allowance with this method brings the
risk that someone may use both the old and the new allowance by
unfortunate transaction ordering. One possible solution to mitigate this
race condition is to first reduce the spender’s allowance to 0 and set
the desired value afterwards:
https://github.com/ethereum/EIPs/issues/20#issuecomment-263524729

Emits an {Approval} event.\_

transferFrom
~~~~~~~~~~~~

.. code:: solidity

   function transferFrom(address sender, address recipient, uint256 amount) external returns (bool)

\_Moves ``amount`` tokens from ``sender`` to ``recipient`` using the
allowance mechanism. ``amount`` is then deducted from the caller’s
allowance.

Returns a boolean value indicating whether the operation succeeded.

Emits a {Transfer} event.\_

.. _transfer-1:

Transfer
~~~~~~~~

.. code:: solidity

   event Transfer(address from, address to, uint256 value)

\_Emitted when ``value`` tokens are moved from one account (``from``) to
another (``to``).

Note that ``value`` may be zero.\_

Approval
~~~~~~~~

.. code:: solidity

   event Approval(address owner, address spender, uint256 value)

*Emitted when the allowance of a ``spender`` for an ``owner`` is set by
a call to {approve}. ``value`` is the new allowance.*

ILinkedList
-----------

.. _gettype-1:

getType
~~~~~~~

.. code:: solidity

   function getType(bytes32 _arrName) external view returns (bytes1)

.. _getlength-1:

getLength
~~~~~~~~~

.. code:: solidity

   function getLength(bytes32 _arrName) external view returns (uint256)

.. _get-1:

get
~~~

.. code:: solidity

   function get(uint256 _index, bytes32 _arrName) external view returns (bytes32 data)

IParser
-------

ExecRes
~~~~~~~

.. code:: solidity

   event ExecRes(bool result)

NewConditionalTx
~~~~~~~~~~~~~~~~

.. code:: solidity

   event NewConditionalTx(address txObj)

.. _parse-2:

parse
~~~~~

.. code:: solidity

   function parse(address _preprAddr, address _ctxAddr, string _codeRaw) external

.. _asmsetlocalbool-1:

asmSetLocalBool
~~~~~~~~~~~~~~~

.. code:: solidity

   function asmSetLocalBool() external

asmSetUint256
~~~~~~~~~~~~~

.. code:: solidity

   function asmSetUint256() external

asmVar
~~~~~~

.. code:: solidity

   function asmVar() external

asmLoadRemote
~~~~~~~~~~~~~

.. code:: solidity

   function asmLoadRemote(address _ctxAddr) external

asmDeclare
~~~~~~~~~~

.. code:: solidity

   function asmDeclare(address _ctxAddr) external

asmBool
~~~~~~~

.. code:: solidity

   function asmBool() external

.. _asmuint256-1:

asmUint256
~~~~~~~~~~

.. code:: solidity

   function asmUint256() external

.. _asmsend-1:

asmSend
~~~~~~~

.. code:: solidity

   function asmSend() external

asmTransfer
~~~~~~~~~~~

.. code:: solidity

   function asmTransfer() external

asmTransferVar
~~~~~~~~~~~~~~

.. code:: solidity

   function asmTransferVar() external

asmTransferFrom
~~~~~~~~~~~~~~~

.. code:: solidity

   function asmTransferFrom() external

asmBalanceOf
~~~~~~~~~~~~

.. code:: solidity

   function asmBalanceOf() external

asmLengthOf
~~~~~~~~~~~

.. code:: solidity

   function asmLengthOf() external

asmSumOf
~~~~~~~~

.. code:: solidity

   function asmSumOf() external

asmSumThroughStructs
~~~~~~~~~~~~~~~~~~~~

.. code:: solidity

   function asmSumThroughStructs() external

asmTransferFromVar
~~~~~~~~~~~~~~~~~~

.. code:: solidity

   function asmTransferFromVar() external

asmIfelse
~~~~~~~~~

.. code:: solidity

   function asmIfelse() external

asmIf
~~~~~

.. code:: solidity

   function asmIf() external

asmFunc
~~~~~~~

.. code:: solidity

   function asmFunc() external

asmGet
~~~~~~

.. code:: solidity

   function asmGet() external

asmPush
~~~~~~~

.. code:: solidity

   function asmPush() external

asmStruct
~~~~~~~~~

.. code:: solidity

   function asmStruct(address _ctxAddr) external

.. _asmforloop-1:

asmForLoop
~~~~~~~~~~

.. code:: solidity

   function asmForLoop() external

.. _asmenablerecord-1:

asmEnableRecord
~~~~~~~~~~~~~~~

.. code:: solidity

   function asmEnableRecord() external

IPreprocessor
-------------

\_Preprocessor of DSL code

One of the core contracts of the project. It can remove comments that
were created by user in the DSL code string. It transforms the users DSL
code string to the list of commands that can be used in a Parser
contract.

DSL code in postfix notation as user’s string code -> Preprocessor ->
each command is separated in the commands list\_

FuncParameter
~~~~~~~~~~~~~

.. code:: solidity

   struct FuncParameter {
     string _type;
     string nameOfVariable;
     string value;
   }

PreprocessorInfo
~~~~~~~~~~~~~~~~

.. code:: solidity

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

.. _transform-1:

transform
~~~~~~~~~

.. code:: solidity

   function transform(address _ctxAddr, string _program) external returns (string[])

cleanString
~~~~~~~~~~~

.. code:: solidity

   function cleanString(string _program) external pure returns (string _cleanedProgram)

split
~~~~~

.. code:: solidity

   function split(string _program) external returns (string[])

infixToPostfix
~~~~~~~~~~~~~~

.. code:: solidity

   function infixToPostfix(address _ctxAddr, string[] _code, contract StringStack _stack) external returns (string[])

IStack
------

.. _stack-5:

stack
~~~~~

.. code:: solidity

   function stack(uint256) external returns (uint256)

.. _length-4:

length
~~~~~~

.. code:: solidity

   function length() external view returns (uint256)

.. _push-2:

push
~~~~

.. code:: solidity

   function push(uint256 data) external

.. _pop-2:

pop
~~~

.. code:: solidity

   function pop() external returns (uint256)

IStorage
--------

.. _getstoragebool-1:

getStorageBool
~~~~~~~~~~~~~~

.. code:: solidity

   function getStorageBool(bytes32 position) external view returns (bool data)

.. _getstorageaddress-1:

getStorageAddress
~~~~~~~~~~~~~~~~~

.. code:: solidity

   function getStorageAddress(bytes32 position) external view returns (address data)

getStorageBytes32
~~~~~~~~~~~~~~~~~

.. code:: solidity

   function getStorageBytes32(bytes32 position) external view returns (bytes32 data)

.. _getstorageuint256-1:

getStorageUint256
~~~~~~~~~~~~~~~~~

.. code:: solidity

   function getStorageUint256(bytes32 position) external view returns (uint256 data)

.. _setstoragebool-1:

setStorageBool
~~~~~~~~~~~~~~

.. code:: solidity

   function setStorageBool(bytes32 position, bool data) external

.. _setstorageaddress-1:

setStorageAddress
~~~~~~~~~~~~~~~~~

.. code:: solidity

   function setStorageAddress(bytes32 position, address data) external

.. _setstoragebytes32-1:

setStorageBytes32
~~~~~~~~~~~~~~~~~

.. code:: solidity

   function setStorageBytes32(bytes32 position, bytes32 data) external

.. _setstorageuint256-1:

setStorageUint256
~~~~~~~~~~~~~~~~~

.. code:: solidity

   function setStorageUint256(bytes32 position, uint256 data) external

IStorageUniversal
-----------------

.. _setstoragebool-2:

setStorageBool
~~~~~~~~~~~~~~

.. code:: solidity

   function setStorageBool(bytes32 position, bytes32 data) external

.. _setstorageaddress-2:

setStorageAddress
~~~~~~~~~~~~~~~~~

.. code:: solidity

   function setStorageAddress(bytes32 position, bytes32 data) external

.. _setstorageuint256-2:

setStorageUint256
~~~~~~~~~~~~~~~~~

.. code:: solidity

   function setStorageUint256(bytes32 position, bytes32 data) external

ByteUtils
---------

slice
~~~~~

.. code:: solidity

   function slice(bytes _data, uint256 _start, uint256 _end) public pure returns (bytes)

ErrorsAgreement
---------------

AGR1
~~~~

.. code:: solidity

   string AGR1

AGR2
~~~~

.. code:: solidity

   string AGR2

AGR3
~~~~

.. code:: solidity

   string AGR3

AGR4
~~~~

.. code:: solidity

   string AGR4

AGR5
~~~~

.. code:: solidity

   string AGR5

AGR6
~~~~

.. code:: solidity

   string AGR6

AGR7
~~~~

.. code:: solidity

   string AGR7

AGR8
~~~~

.. code:: solidity

   string AGR8

AGR9
~~~~

.. code:: solidity

   string AGR9

AGR10
~~~~~

.. code:: solidity

   string AGR10

AGR11
~~~~~

.. code:: solidity

   string AGR11

AGR12
~~~~~

.. code:: solidity

   string AGR12

AGR13
~~~~~

.. code:: solidity

   string AGR13

AGR14
~~~~~

.. code:: solidity

   string AGR14

AGR15
~~~~~

.. code:: solidity

   string AGR15

ErrorsContext
-------------

CTX1
~~~~

.. code:: solidity

   string CTX1

CTX2
~~~~

.. code:: solidity

   string CTX2

CTX3
~~~~

.. code:: solidity

   string CTX3

CTX4
~~~~

.. code:: solidity

   string CTX4

CTX5
~~~~

.. code:: solidity

   string CTX5

ErrorsStack
-----------

STK1
~~~~

.. code:: solidity

   string STK1

STK2
~~~~

.. code:: solidity

   string STK2

STK3
~~~~

.. code:: solidity

   string STK3

STK4
~~~~

.. code:: solidity

   string STK4

ErrorsGeneralOpcodes
--------------------

OP1
~~~

.. code:: solidity

   string OP1

OP2
~~~

.. code:: solidity

   string OP2

OP3
~~~

.. code:: solidity

   string OP3

OP4
~~~

.. code:: solidity

   string OP4

OP5
~~~

.. code:: solidity

   string OP5

OP6
~~~

.. code:: solidity

   string OP6

OP8
~~~

.. code:: solidity

   string OP8

ErrorsBranchingOpcodes
----------------------

BR1
~~~

.. code:: solidity

   string BR1

BR2
~~~

.. code:: solidity

   string BR2

BR3
~~~

.. code:: solidity

   string BR3

ErrorsParser
------------

PRS1
~~~~

.. code:: solidity

   string PRS1

PRS2
~~~~

.. code:: solidity

   string PRS2

ErrorsPreprocessor
------------------

PRP1
~~~~

.. code:: solidity

   string PRP1

PRP2
~~~~

.. code:: solidity

   string PRP2

ErrorsOpcodeHelpers
-------------------

OPH1
~~~~

.. code:: solidity

   string OPH1

ErrorsByteUtils
---------------

BUT1
~~~~

.. code:: solidity

   string BUT1

BUT2
~~~~

.. code:: solidity

   string BUT2

ErrorsExecutor
--------------

EXC1
~~~~

.. code:: solidity

   string EXC1

EXC2
~~~~

.. code:: solidity

   string EXC2

EXC3
~~~~

.. code:: solidity

   string EXC3

ErrorsStringUtils
-----------------

SUT1
~~~~

.. code:: solidity

   string SUT1

SUT2
~~~~

.. code:: solidity

   string SUT2

SUT3
~~~~

.. code:: solidity

   string SUT3

SUT4
~~~~

.. code:: solidity

   string SUT4

SUT5
~~~~

.. code:: solidity

   string SUT5

SUT6
~~~~

.. code:: solidity

   string SUT6

SUT7
~~~~

.. code:: solidity

   string SUT7

SUT8
~~~~

.. code:: solidity

   string SUT8

SUT9
~~~~

.. code:: solidity

   string SUT9

Executor
--------

.. _execute-1:

execute
~~~~~~~

.. code:: solidity

   function execute(address _ctx) public

StringUtils
-----------

char
~~~~

.. code:: solidity

   function char(string s, uint256 index) public pure returns (string)

equal
~~~~~

.. code:: solidity

   function equal(string s1, string s2) internal pure returns (bool)

.. _length-5:

length
~~~~~~

.. code:: solidity

   function length(string s) internal pure returns (uint256)

concat
~~~~~~

.. code:: solidity

   function concat(string s1, string s2) internal pure returns (string)

fromHex
~~~~~~~

.. code:: solidity

   function fromHex(string s) public pure returns (bytes)

fromHexBytes
~~~~~~~~~~~~

.. code:: solidity

   function fromHexBytes(bytes ss) public pure returns (bytes)

toString
~~~~~~~~

.. code:: solidity

   function toString(uint256 value) internal pure returns (string)

*Converts a ``uint256`` to its ASCII ``string`` decimal representation.*

toUint256
~~~~~~~~~

.. code:: solidity

   function toUint256(string s) public pure returns (uint256 value)

getWei
~~~~~~

.. code:: solidity

   function getWei(string _s) public pure returns (string result)

mayBeNumber
~~~~~~~~~~~

.. code:: solidity

   function mayBeNumber(string _string) public pure returns (bool)

*If the string starts with a number, so we assume that it’s a number.*

.. _parameters-65:

Parameters
^^^^^^^^^^

======== ====== ================================
Name     Type   Description
======== ====== ================================
\_string string is a current string for checking
======== ====== ================================

.. _return-values-28:

Return Values
^^^^^^^^^^^^^

+--------------+--------------+----------------------------------------+
| Name         | Type         | Description                            |
+==============+==============+========================================+
| [0]          | bool         | isNumber that is true if the string    |
|              |              | starts with a number, otherwise is     |
|              |              | false                                  |
+--------------+--------------+----------------------------------------+

mayBeAddress
~~~~~~~~~~~~

.. code:: solidity

   function mayBeAddress(string _string) public pure returns (bool)

*If the string starts with ``0x`` symbols, so we assume that it’s an
address.*

.. _parameters-66:

Parameters
^^^^^^^^^^

======== ====== ================================
Name     Type   Description
======== ====== ================================
\_string string is a current string for checking
======== ====== ================================

.. _return-values-29:

Return Values
^^^^^^^^^^^^^

+--------------+--------------+----------------------------------------+
| Name         | Type         | Description                            |
+==============+==============+========================================+
| [0]          | bool         | isAddress that is true if the string   |
|              |              | starts with ``0x`` symbols, otherwise  |
|              |              | is false                               |
+--------------+--------------+----------------------------------------+

fromHexChar
~~~~~~~~~~~

.. code:: solidity

   function fromHexChar(bytes1 c) public pure returns (uint8)

isValidVarName
~~~~~~~~~~~~~~

.. code:: solidity

   function isValidVarName(string _s) public pure returns (bool)

\_Checks is string is a valid DSL variable name (matches regexp
/^([A-Z\_\ :math:`][A-Z\d_`]*)$/g)\_

.. _parameters-67:

Parameters
^^^^^^^^^^

==== ====== ============================
Name Type   Description
==== ====== ============================
\_s  string is a current string to check
==== ====== ============================

.. _return-values-30:

Return Values
^^^^^^^^^^^^^

+--------------+--------------+----------------------------------------+
| Name         | Type         | Description                            |
+==============+==============+========================================+
| [0]          | bool         | isCapital whether the string is a      |
|              |              | valid DSL variable name or not         |
+--------------+--------------+----------------------------------------+

UnstructuredStorage
-------------------

.. _getstoragebool-2:

getStorageBool
~~~~~~~~~~~~~~

.. code:: solidity

   function getStorageBool(bytes32 position) internal view returns (bool data)

.. _getstorageaddress-2:

getStorageAddress
~~~~~~~~~~~~~~~~~

.. code:: solidity

   function getStorageAddress(bytes32 position) internal view returns (address data)

.. _getstoragebytes32-1:

getStorageBytes32
~~~~~~~~~~~~~~~~~

.. code:: solidity

   function getStorageBytes32(bytes32 position) internal view returns (bytes32 data)

.. _getstorageuint256-2:

getStorageUint256
~~~~~~~~~~~~~~~~~

.. code:: solidity

   function getStorageUint256(bytes32 position) internal view returns (uint256 data)

.. _setstoragebool-3:

setStorageBool
~~~~~~~~~~~~~~

.. code:: solidity

   function setStorageBool(bytes32 position, bytes32 data) internal

.. _setstoragebool-4:

setStorageBool
~~~~~~~~~~~~~~

.. code:: solidity

   function setStorageBool(bytes32 position, bool data) internal

.. _setstorageaddress-3:

setStorageAddress
~~~~~~~~~~~~~~~~~

.. code:: solidity

   function setStorageAddress(bytes32 position, bytes32 data) internal

.. _setstorageaddress-4:

setStorageAddress
~~~~~~~~~~~~~~~~~

.. code:: solidity

   function setStorageAddress(bytes32 position, address data) internal

.. _setstoragebytes32-2:

setStorageBytes32
~~~~~~~~~~~~~~~~~

.. code:: solidity

   function setStorageBytes32(bytes32 position, bytes32 data) internal

.. _setstorageuint256-3:

setStorageUint256
~~~~~~~~~~~~~~~~~

.. code:: solidity

   function setStorageUint256(bytes32 position, bytes32 data) internal

.. _setstorageuint256-4:

setStorageUint256
~~~~~~~~~~~~~~~~~

.. code:: solidity

   function setStorageUint256(bytes32 position, uint256 data) internal

.. _branchingopcodes-2:

BranchingOpcodes
----------------

Opcodes for logical operators such as if/esle, switch/case

opIfelse
~~~~~~~~

.. code:: solidity

   function opIfelse(address _ctx) public

opIf
~~~~

.. code:: solidity

   function opIf(address _ctx) public

opFunc
~~~~~~

.. code:: solidity

   function opFunc(address _ctx) public

opForLoop
~~~~~~~~~

.. code:: solidity

   function opForLoop(address _ctx) external

*For loop setup. Responsible for checking iterating array existence, set
the number of iterations*

.. _parameters-68:

Parameters
^^^^^^^^^^

===== ======= ========================
Name  Type    Description
===== ======= ========================
\_ctx address Context contract address
===== ======= ========================

opStartLoop
~~~~~~~~~~~

.. code:: solidity

   function opStartLoop(address _ctx) public

*Does the real iterating process over the body of the for-loop*

.. _parameters-69:

Parameters
^^^^^^^^^^

===== ======= ========================
Name  Type    Description
===== ======= ========================
\_ctx address Context contract address
===== ======= ========================

opEndLoop
~~~~~~~~~

.. code:: solidity

   function opEndLoop(address _ctx) public

*This function is responsible for getting of the body of the for-loop*

.. _parameters-70:

Parameters
^^^^^^^^^^

===== ======= ========================
Name  Type    Description
===== ======= ========================
\_ctx address Context contract address
===== ======= ========================

opEnd
~~~~~

.. code:: solidity

   function opEnd(address _ctx) public

getUint16
~~~~~~~~~

.. code:: solidity

   function getUint16(address _ctx) public returns (uint16)

.. _comparisonopcodes-2:

ComparisonOpcodes
-----------------

Opcodes for comparator operators such as >, <, =, !, etc.

opEq
~~~~

.. code:: solidity

   function opEq(address _ctx) public

*Compares two values in the stack. Put 1 to the stack if they are
equal.*

.. _parameters-71:

Parameters
^^^^^^^^^^

===== ======= ========================
Name  Type    Description
===== ======= ========================
\_ctx address Context contract address
===== ======= ========================

opNotEq
~~~~~~~

.. code:: solidity

   function opNotEq(address _ctx) public

*Compares two values in the stack. Put 1 to the stack if they are not
equal.*

.. _parameters-72:

Parameters
^^^^^^^^^^

===== ======= ========================
Name  Type    Description
===== ======= ========================
\_ctx address Context contract address
===== ======= ========================

opLt
~~~~

.. code:: solidity

   function opLt(address _ctx) public

*Compares two values in the stack. Put 1 to the stack if value1 <
value2*

.. _parameters-73:

Parameters
^^^^^^^^^^

===== ======= ========================
Name  Type    Description
===== ======= ========================
\_ctx address Context contract address
===== ======= ========================

opGt
~~~~

.. code:: solidity

   function opGt(address _ctx) public

*Compares two values in the stack. Put 1 to the stack if value1 >
value2*

.. _parameters-74:

Parameters
^^^^^^^^^^

===== ======= ========================
Name  Type    Description
===== ======= ========================
\_ctx address Context contract address
===== ======= ========================

opLe
~~~~

.. code:: solidity

   function opLe(address _ctx) public

*Compares two values in the stack. Put 1 to the stack if value1 <=
value2*

.. _parameters-75:

Parameters
^^^^^^^^^^

===== ======= ========================
Name  Type    Description
===== ======= ========================
\_ctx address Context contract address
===== ======= ========================

opGe
~~~~

.. code:: solidity

   function opGe(address _ctx) public

*Compares two values in the stack. Put 1 to the stack if value1 >=
value2*

.. _parameters-76:

Parameters
^^^^^^^^^^

===== ======= ========================
Name  Type    Description
===== ======= ========================
\_ctx address Context contract address
===== ======= ========================

opNot
~~~~~

.. code:: solidity

   function opNot(address _ctx) public

*Revert last value in the stack*

.. _parameters-77:

Parameters
^^^^^^^^^^

===== ======= ========================
Name  Type    Description
===== ======= ========================
\_ctx address Context contract address
===== ======= ========================

opSwap
~~~~~~

.. code:: solidity

   function opSwap(address _ctx) public

*Swaps two last element in the stack*

.. _parameters-78:

Parameters
^^^^^^^^^^

===== ======= ========================
Name  Type    Description
===== ======= ========================
\_ctx address Context contract address
===== ======= ========================

.. _logicalopcodes-2:

LogicalOpcodes
--------------

Opcodes for set operators such as AND, OR, XOR

opAnd
~~~~~

.. code:: solidity

   function opAnd(address _ctx) public

*Compares two values in the stack. Put 1 if both of them are 1, put 0
otherwise*

.. _parameters-79:

Parameters
^^^^^^^^^^

===== ======= ========================
Name  Type    Description
===== ======= ========================
\_ctx address Context contract address
===== ======= ========================

opOr
~~~~

.. code:: solidity

   function opOr(address _ctx) public

*Compares two values in the stack. Put 1 if either one of them is 1, put
0 otherwise*

.. _parameters-80:

Parameters
^^^^^^^^^^

===== ======= ========================
Name  Type    Description
===== ======= ========================
\_ctx address Context contract address
===== ======= ========================

opXor
~~~~~

.. code:: solidity

   function opXor(address _ctx) public

*Compares two values in the stack. Put 1 if the values ​ ​are different
and 0 if they are the same*

.. _parameters-81:

Parameters
^^^^^^^^^^

===== ======= ========================
Name  Type    Description
===== ======= ========================
\_ctx address Context contract address
===== ======= ========================

opAdd
~~~~~

.. code:: solidity

   function opAdd(address _ctx) public

*Add two values and put result in the stack.*

.. _parameters-82:

Parameters
^^^^^^^^^^

===== ======= ========================
Name  Type    Description
===== ======= ========================
\_ctx address Context contract address
===== ======= ========================

opSub
~~~~~

.. code:: solidity

   function opSub(address _ctx) public

*Subtracts one value from enother and put result in the stack.*

.. _parameters-83:

Parameters
^^^^^^^^^^

===== ======= ========================
Name  Type    Description
===== ======= ========================
\_ctx address Context contract address
===== ======= ========================

opMul
~~~~~

.. code:: solidity

   function opMul(address _ctx) public

*Multiplies values and put result in the stack.*

.. _parameters-84:

Parameters
^^^^^^^^^^

===== ======= ========================
Name  Type    Description
===== ======= ========================
\_ctx address Context contract address
===== ======= ========================

opDiv
~~~~~

.. code:: solidity

   function opDiv(address _ctx) public

Divide two numbers from the top of the stack

*This is an integer division. Example: 5 / 2 = 2*

.. _parameters-85:

Parameters
^^^^^^^^^^

===== ======= ===============
Name  Type    Description
===== ======= ===============
\_ctx address Context address
===== ======= ===============

OpcodeHelpers
-------------

Opcode helper functions that are used in other opcode libraries

*Opcode libraries are: ComparisonOpcodes, BranchingOpcodes,
LogicalOpcodes, and OtherOpcodes*

putToStack
~~~~~~~~~~

.. code:: solidity

   function putToStack(address _ctx, uint256 _value) public

nextBytes
~~~~~~~~~

.. code:: solidity

   function nextBytes(address _ctx, uint256 size) public returns (bytes out)

nextBytes1
~~~~~~~~~~

.. code:: solidity

   function nextBytes1(address _ctx) public returns (bytes1)

readBytesSlice
~~~~~~~~~~~~~~

.. code:: solidity

   function readBytesSlice(address _ctx, uint256 _start, uint256 _end) public view returns (bytes32 res)

*Reads the slice of bytes from the raw program Warning! The maximum
slice size can only be 32 bytes!*

.. _parameters-86:

Parameters
^^^^^^^^^^

======= ======= ========================
Name    Type    Description
======= ======= ========================
\_ctx   address Context contract address
\_start uint256 Start position to read
\_end   uint256 End position to read
======= ======= ========================

.. _return-values-31:

Return Values
^^^^^^^^^^^^^

==== ======= ================================
Name Type    Description
==== ======= ================================
res  bytes32 Bytes32 slice of the raw program
==== ======= ================================

nextBranchSelector
~~~~~~~~~~~~~~~~~~

.. code:: solidity

   function nextBranchSelector(address _ctx, string baseOpName) public returns (bytes4)

mustCall
~~~~~~~~

.. code:: solidity

   function mustCall(address addr, bytes data) public

getNextBytes
~~~~~~~~~~~~

.. code:: solidity

   function getNextBytes(address _ctx, uint256 _bytesNum) public returns (bytes32 varNameB32)

.. _otheropcodes-2:

OtherOpcodes
------------

opLoadRemoteAny
~~~~~~~~~~~~~~~

.. code:: solidity

   function opLoadRemoteAny(address _ctx) public

opBlockNumber
~~~~~~~~~~~~~

.. code:: solidity

   function opBlockNumber(address _ctx) public

opBlockTimestamp
~~~~~~~~~~~~~~~~

.. code:: solidity

   function opBlockTimestamp(address _ctx) public

opBlockChainId
~~~~~~~~~~~~~~

.. code:: solidity

   function opBlockChainId(address _ctx) public

opMsgSender
~~~~~~~~~~~

.. code:: solidity

   function opMsgSender(address _ctx) public

opMsgValue
~~~~~~~~~~

.. code:: solidity

   function opMsgValue(address _ctx) public

opSetLocalBool
~~~~~~~~~~~~~~

.. code:: solidity

   function opSetLocalBool(address _ctx) public

*Sets boolean variable in the application contract. The value of bool
variable is taken from DSL code itself*

opSetUint256
~~~~~~~~~~~~

.. code:: solidity

   function opSetUint256(address _ctx) public

*Sets uint256 variable in the application contract. The value of the
variable is taken from stack*

opGet
~~~~~

.. code:: solidity

   function opGet(address _ctx) public

*Gets an element by its index in the array*

.. _parameters-87:

Parameters
^^^^^^^^^^

===== ======= =================================
Name  Type    Description
===== ======= =================================
\_ctx address Context contract instance address
===== ======= =================================

opSumOf
~~~~~~~

.. code:: solidity

   function opSumOf(address _ctx) public

*Sums uin256 elements from the array (array name should be provided)*

.. _parameters-88:

Parameters
^^^^^^^^^^

===== ======= =================================
Name  Type    Description
===== ======= =================================
\_ctx address Context contract instance address
===== ======= =================================

opSumThroughStructs
~~~~~~~~~~~~~~~~~~~

.. code:: solidity

   function opSumThroughStructs(address _ctx) public

*Sums struct variables values from the ``struct type`` array*

.. _parameters-89:

Parameters
^^^^^^^^^^

===== ======= =================================
Name  Type    Description
===== ======= =================================
\_ctx address Context contract instance address
===== ======= =================================

opStruct
~~~~~~~~

.. code:: solidity

   function opStruct(address _ctx) public

*Inserts items to DSL structures using mixed variable name (ex.
``BOB.account``). Struct variable names already contain a name of a DSL
structure, ``.`` dot symbol, the name of variable. ``endStruct`` word
(0xcb398fe1) is used as an indicator for the ending loop for the structs
parameters*

.. _parameters-90:

Parameters
^^^^^^^^^^

===== ======= =================================
Name  Type    Description
===== ======= =================================
\_ctx address Context contract instance address
===== ======= =================================

opPush
~~~~~~

.. code:: solidity

   function opPush(address _ctx) public

*Inserts an item to array*

.. _parameters-91:

Parameters
^^^^^^^^^^

===== ======= =================================
Name  Type    Description
===== ======= =================================
\_ctx address Context contract instance address
===== ======= =================================

opDeclare
~~~~~~~~~

.. code:: solidity

   function opDeclare(address _ctx) public

*Declares an empty array*

.. _parameters-92:

Parameters
^^^^^^^^^^

===== ======= =================================
Name  Type    Description
===== ======= =================================
\_ctx address Context contract instance address
===== ======= =================================

opLoadLocalUint256
~~~~~~~~~~~~~~~~~~

.. code:: solidity

   function opLoadLocalUint256(address _ctx) public

opLoadLocalAddress
~~~~~~~~~~~~~~~~~~

.. code:: solidity

   function opLoadLocalAddress(address _ctx) public

opLoadRemoteUint256
~~~~~~~~~~~~~~~~~~~

.. code:: solidity

   function opLoadRemoteUint256(address _ctx) public

opLoadRemoteBytes32
~~~~~~~~~~~~~~~~~~~

.. code:: solidity

   function opLoadRemoteBytes32(address _ctx) public

opLoadRemoteBool
~~~~~~~~~~~~~~~~

.. code:: solidity

   function opLoadRemoteBool(address _ctx) public

opLoadRemoteAddress
~~~~~~~~~~~~~~~~~~~

.. code:: solidity

   function opLoadRemoteAddress(address _ctx) public

opBool
~~~~~~

.. code:: solidity

   function opBool(address _ctx) public

opUint256
~~~~~~~~~

.. code:: solidity

   function opUint256(address _ctx) public

opSendEth
~~~~~~~~~

.. code:: solidity

   function opSendEth(address _ctx) public

opTransfer
~~~~~~~~~~

.. code:: solidity

   function opTransfer(address _ctx) public

opTransferVar
~~~~~~~~~~~~~

.. code:: solidity

   function opTransferVar(address _ctx) public

opTransferFrom
~~~~~~~~~~~~~~

.. code:: solidity

   function opTransferFrom(address _ctx) public

opBalanceOf
~~~~~~~~~~~

.. code:: solidity

   function opBalanceOf(address _ctx) public

opLengthOf
~~~~~~~~~~

.. code:: solidity

   function opLengthOf(address _ctx) public

opTransferFromVar
~~~~~~~~~~~~~~~~~

.. code:: solidity

   function opTransferFromVar(address _ctx) public

opUint256Get
~~~~~~~~~~~~

.. code:: solidity

   function opUint256Get(address _ctx) public returns (uint256)

opLoadLocalGet
~~~~~~~~~~~~~~

.. code:: solidity

   function opLoadLocalGet(address _ctx, string funcSignature) public returns (bytes32 result)

opAddressGet
~~~~~~~~~~~~

.. code:: solidity

   function opAddressGet(address _ctx) public returns (address)

opLoadLocal
~~~~~~~~~~~

.. code:: solidity

   function opLoadLocal(address _ctx, string funcSignature) public

opLoadRemote
~~~~~~~~~~~~

.. code:: solidity

   function opLoadRemote(address _ctx, string funcSignature) public

opEnableRecord
~~~~~~~~~~~~~~

.. code:: solidity

   function opEnableRecord(address _ctx) public

\_sumOfStructVars
~~~~~~~~~~~~~~~~~

.. code:: solidity

   function _sumOfStructVars(address _ctx, bytes32 _arrNameB32, bytes4 _varName, bytes32 _length) internal returns (uint256 total)

*Sums struct variables values from the ``struct type`` array*

.. _parameters-93:

Parameters
^^^^^^^^^^

============ ======= =================================
Name         Type    Description
============ ======= =================================
\_ctx        address Context contract instance address
\_arrNameB32 bytes32 Array’s name in bytecode
\_varName    bytes4  Struct’s name in bytecode
\_length     bytes32 Array’s length in bytecode
============ ======= =================================

.. _return-values-32:

Return Values
^^^^^^^^^^^^^

+--------------+--------------+----------------------------------------+
| Name         | Type         | Description                            |
+==============+==============+========================================+
| total        | uint256      | Total sum of each element in the       |
|              |              | ``struct`` type of array               |
+--------------+--------------+----------------------------------------+

\_getItem
~~~~~~~~~

.. code:: solidity

   function _getItem(address _ctx, uint256 _index, bytes32 _arrNameB32) internal returns (bytes)

*Returns the element from the array*

.. _parameters-94:

Parameters
^^^^^^^^^^

============ ======= =================================
Name         Type    Description
============ ======= =================================
\_ctx        address Context contract instance address
\_index      uint256 Array’s index
\_arrNameB32 bytes32 Array’s name in bytecode
============ ======= =================================

.. _return-values-33:

Return Values
^^^^^^^^^^^^^

==== ===== =====================================
Name Type  Description
==== ===== =====================================
[0]  bytes item Item from the array by its index
==== ===== =====================================

\_sumOfVars
~~~~~~~~~~~

.. code:: solidity

   function _sumOfVars(address _ctx, bytes32 _arrNameB32, bytes32 _length) internal returns (uint256 total)

*Sums uin256 elements from the array (array name should be provided)*

.. _parameters-95:

Parameters
^^^^^^^^^^

============ ======= =================================
Name         Type    Description
============ ======= =================================
\_ctx        address Context contract instance address
\_arrNameB32 bytes32 Array’s name in bytecode
\_length     bytes32 Array’s length in bytecode
============ ======= =================================

.. _return-values-34:

Return Values
^^^^^^^^^^^^^

+--------------+--------------+----------------------------------------+
| Name         | Type         | Description                            |
+==============+==============+========================================+
| total        | uint256      | Total sum of each element in the       |
|              |              | ``uint256`` type of array              |
+--------------+--------------+----------------------------------------+

\_checkArrType
~~~~~~~~~~~~~~

.. code:: solidity

   function _checkArrType(address _ctx, bytes32 _arrNameB32, string _typeName) internal

*Checks the type for array*

.. _parameters-96:

Parameters
^^^^^^^^^^

+--------------+--------------+----------------------------------------+
| Name         | Type         | Description                            |
+==============+==============+========================================+
| \_ctx        | address      | Context contract instance address      |
+--------------+--------------+----------------------------------------+
| \_arrNameB32 | bytes32      | Array’s name in bytecode               |
+--------------+--------------+----------------------------------------+
| \_typeName   | string       | Type of the array, ex. ``uint256``,    |
|              |              | ``address``, ``struct``                |
+--------------+--------------+----------------------------------------+

\_getArrLength
~~~~~~~~~~~~~~

.. code:: solidity

   function _getArrLength(address _ctx, bytes32 _arrNameB32) internal returns (bytes32)

*Returns array’s length*

.. _parameters-97:

Parameters
^^^^^^^^^^

============ ======= =================================
Name         Type    Description
============ ======= =================================
\_ctx        address Context contract instance address
\_arrNameB32 bytes32 Array’s name in bytecode
============ ======= =================================

.. _return-values-35:

Return Values
^^^^^^^^^^^^^

==== ======= ==========================
Name Type    Description
==== ======= ==========================
[0]  bytes32 Array’s length in bytecode
==== ======= ==========================

ByteUtilsMock
-------------

.. _slice-1:

slice
~~~~~

.. code:: solidity

   function slice(bytes _data, uint256 _start, uint256 _end) public pure returns (bytes)

ContextMock
-----------

addOpcodeBranchExt
~~~~~~~~~~~~~~~~~~

.. code:: solidity

   function addOpcodeBranchExt(string _baseOpName, string _branchName, bytes1 _branchCode, bytes4 _selector) external

addOperatorExt
~~~~~~~~~~~~~~

.. code:: solidity

   function addOperatorExt(string _op, uint256 _priority) external

addOpcodeForOperatorExt
~~~~~~~~~~~~~~~~~~~~~~~

.. code:: solidity

   function addOpcodeForOperatorExt(string _name, bytes1 _opcode, bytes4 _opSelector, bytes4 _asmSelector, enum IContext.OpcodeLibNames _libName, uint256 _priority) external

ExecutorMock
------------

.. _execute-2:

execute
~~~~~~~

.. code:: solidity

   function execute(address _ctxAddr) public

ParserMock
----------

.. _constructor-4:

constructor
~~~~~~~~~~~

.. code:: solidity

   constructor() public

parseCodeExt
~~~~~~~~~~~~

.. code:: solidity

   function parseCodeExt(address _ctxAddr, string[] _code) external

asmLoadRemoteExt
~~~~~~~~~~~~~~~~

.. code:: solidity

   function asmLoadRemoteExt(address _ctxAddr) external

StringUtilsMock
---------------

.. _char-1:

char
~~~~

.. code:: solidity

   function char(string _s, uint256 _index) public pure returns (string)

.. _equal-1:

equal
~~~~~

.. code:: solidity

   function equal(string _s1, string _s2) public pure returns (bool)

.. _length-6:

length
~~~~~~

.. code:: solidity

   function length(string _s) public pure returns (uint256)

.. _concat-1:

concat
~~~~~~

.. code:: solidity

   function concat(string _s1, string _s2) public pure returns (string)

.. _fromhex-1:

fromHex
~~~~~~~

.. code:: solidity

   function fromHex(string _s) public pure returns (bytes)

.. _touint256-1:

toUint256
~~~~~~~~~

.. code:: solidity

   function toUint256(string _s) public pure returns (uint256)

fromUint256toString
~~~~~~~~~~~~~~~~~~~

.. code:: solidity

   function fromUint256toString(uint256 _s) public pure returns (string)

.. _fromhexchar-1:

fromHexChar
~~~~~~~~~~~

.. code:: solidity

   function fromHexChar(bytes1 _c) public pure returns (uint8)

.. _getwei-1:

getWei
~~~~~~

.. code:: solidity

   function getWei(string _s) public pure returns (string)

.. _maybenumber-1:

mayBeNumber
~~~~~~~~~~~

.. code:: solidity

   function mayBeNumber(string _s) public pure returns (bool isNumber)

UnstructuredStorageMock
-----------------------

.. _getstoragebool-3:

getStorageBool
~~~~~~~~~~~~~~

.. code:: solidity

   function getStorageBool(bytes32 position) public view returns (bool data)

.. _getstorageaddress-3:

getStorageAddress
~~~~~~~~~~~~~~~~~

.. code:: solidity

   function getStorageAddress(bytes32 position) public view returns (address data)

.. _getstoragebytes32-2:

getStorageBytes32
~~~~~~~~~~~~~~~~~

.. code:: solidity

   function getStorageBytes32(bytes32 position) public view returns (bytes32 data)

.. _getstorageuint256-3:

getStorageUint256
~~~~~~~~~~~~~~~~~

.. code:: solidity

   function getStorageUint256(bytes32 position) public view returns (uint256 data)

.. _setstoragebool-5:

setStorageBool
~~~~~~~~~~~~~~

.. code:: solidity

   function setStorageBool(bytes32 position, bool data) public

.. _setstoragebool-6:

setStorageBool
~~~~~~~~~~~~~~

.. code:: solidity

   function setStorageBool(bytes32 position, bytes32 data) public

.. _setstorageaddress-5:

setStorageAddress
~~~~~~~~~~~~~~~~~

.. code:: solidity

   function setStorageAddress(bytes32 position, address data) public

.. _setstorageaddress-6:

setStorageAddress
~~~~~~~~~~~~~~~~~

.. code:: solidity

   function setStorageAddress(bytes32 position, bytes32 data) public

.. _setstoragebytes32-3:

setStorageBytes32
~~~~~~~~~~~~~~~~~

.. code:: solidity

   function setStorageBytes32(bytes32 position, bytes32 data) public

.. _setstorageuint256-5:

setStorageUint256
~~~~~~~~~~~~~~~~~

.. code:: solidity

   function setStorageUint256(bytes32 position, uint256 data) public

.. _setstorageuint256-6:

setStorageUint256
~~~~~~~~~~~~~~~~~

.. code:: solidity

   function setStorageUint256(bytes32 position, bytes32 data) public

BranchingOpcodesMock
--------------------

.. _opifelse-1:

opIfelse
~~~~~~~~

.. code:: solidity

   function opIfelse(address _ctx) public

.. _opif-1:

opIf
~~~~

.. code:: solidity

   function opIf(address _ctx) public

.. _opend-1:

opEnd
~~~~~

.. code:: solidity

   function opEnd(address _ctx) public

.. _getuint16-1:

getUint16
~~~~~~~~~

.. code:: solidity

   function getUint16(address _ctx) public returns (uint16)

.. _opfunc-1:

opFunc
~~~~~~

.. code:: solidity

   function opFunc(address _ctx) public

ComparisonOpcodesMock
---------------------

.. _opeq-1:

opEq
~~~~

.. code:: solidity

   function opEq(address _ctx) public

*Compares two values in the stack. Put 1 to the stack if they are
equal.*

.. _opnoteq-1:

opNotEq
~~~~~~~

.. code:: solidity

   function opNotEq(address _ctx) public

*Compares two values in the stack. Put 1 to the stack if they are not
equal.*

.. _oplt-1:

opLt
~~~~

.. code:: solidity

   function opLt(address _ctx) public

*Compares two values in the stack. Put 1 to the stack if value1 <
value2*

.. _opgt-1:

opGt
~~~~

.. code:: solidity

   function opGt(address _ctx) public

*Compares two values in the stack. Put 1 to the stack if value1 >
value2*

.. _ople-1:

opLe
~~~~

.. code:: solidity

   function opLe(address _ctx) public

*Compares two values in the stack. Put 1 to the stack if value1 <=
value2*

.. _opge-1:

opGe
~~~~

.. code:: solidity

   function opGe(address _ctx) public

*Compares two values in the stack. Put 1 to the stack if value1 >=
value2*

.. _opswap-1:

opSwap
~~~~~~

.. code:: solidity

   function opSwap(address _ctx) public

*Swaps two last element in the stack*

.. _opnot-1:

opNot
~~~~~

.. code:: solidity

   function opNot(address _ctx) public

*Revert last value in the stack*

LogicalOpcodesMock
------------------

.. _opand-1:

opAnd
~~~~~

.. code:: solidity

   function opAnd(address _ctx) public

*Compares two values in the stack. Put 1 if both of them are 1, put 0
otherwise*

.. _opor-1:

opOr
~~~~

.. code:: solidity

   function opOr(address _ctx) public

*Compares two values in the stack. Put 1 if either one of them is 1, put
0 otherwise*

.. _opxor-1:

opXor
~~~~~

.. code:: solidity

   function opXor(address _ctx) public

.. _opadd-1:

opAdd
~~~~~

.. code:: solidity

   function opAdd(address _ctx) public

.. _opsub-1:

opSub
~~~~~

.. code:: solidity

   function opSub(address _ctx) public

.. _opmul-1:

opMul
~~~~~

.. code:: solidity

   function opMul(address _ctx) public

.. _opdiv-1:

opDiv
~~~~~

.. code:: solidity

   function opDiv(address _ctx) public

OpcodeHelpersMock
-----------------

.. _puttostack-1:

putToStack
~~~~~~~~~~

.. code:: solidity

   function putToStack(address _ctx, uint256 _value) public

.. _nextbytes-1:

nextBytes
~~~~~~~~~

.. code:: solidity

   function nextBytes(address _ctx, uint256 _size) public returns (bytes)

.. _nextbytes1-1:

nextBytes1
~~~~~~~~~~

.. code:: solidity

   function nextBytes1(address _ctx) public returns (bytes1)

.. _nextbranchselector-1:

nextBranchSelector
~~~~~~~~~~~~~~~~~~

.. code:: solidity

   function nextBranchSelector(address _ctx, string _baseOpName) public returns (bytes4)

.. _mustcall-1:

mustCall
~~~~~~~~

.. code:: solidity

   function mustCall(address _addr, bytes _data) public

.. _getnextbytes-1:

getNextBytes
~~~~~~~~~~~~

.. code:: solidity

   function getNextBytes(address _ctx, uint256 _bytesNum) public returns (bytes32)

OtherOpcodesMock
----------------

.. _receive-1:

receive
~~~~~~~

.. code:: solidity

   receive() external payable

.. _oploadremoteany-1:

opLoadRemoteAny
~~~~~~~~~~~~~~~

.. code:: solidity

   function opLoadRemoteAny(address _ctx) public

.. _opblocknumber-1:

opBlockNumber
~~~~~~~~~~~~~

.. code:: solidity

   function opBlockNumber(address _ctx) public

.. _opblocktimestamp-1:

opBlockTimestamp
~~~~~~~~~~~~~~~~

.. code:: solidity

   function opBlockTimestamp(address _ctx) public

.. _opblockchainid-1:

opBlockChainId
~~~~~~~~~~~~~~

.. code:: solidity

   function opBlockChainId(address _ctx) public

.. _opmsgsender-1:

opMsgSender
~~~~~~~~~~~

.. code:: solidity

   function opMsgSender(address _ctx) public

.. _opmsgvalue-1:

opMsgValue
~~~~~~~~~~

.. code:: solidity

   function opMsgValue(address _ctx) public

.. _opsetlocalbool-1:

opSetLocalBool
~~~~~~~~~~~~~~

.. code:: solidity

   function opSetLocalBool(address _ctx) public

.. _opsetuint256-1:

opSetUint256
~~~~~~~~~~~~

.. code:: solidity

   function opSetUint256(address _ctx) public

.. _optransfervar-1:

opTransferVar
~~~~~~~~~~~~~

.. code:: solidity

   function opTransferVar(address _ctx) public

.. _opbalanceof-1:

opBalanceOf
~~~~~~~~~~~

.. code:: solidity

   function opBalanceOf(address _ctx) public

.. _optransferfromvar-1:

opTransferFromVar
~~~~~~~~~~~~~~~~~

.. code:: solidity

   function opTransferFromVar(address _ctx) public

.. _oploadlocaluint256-1:

opLoadLocalUint256
~~~~~~~~~~~~~~~~~~

.. code:: solidity

   function opLoadLocalUint256(address _ctx) public

.. _oploadremoteuint256-1:

opLoadRemoteUint256
~~~~~~~~~~~~~~~~~~~

.. code:: solidity

   function opLoadRemoteUint256(address _ctx) public

.. _oploadremotebytes32-1:

opLoadRemoteBytes32
~~~~~~~~~~~~~~~~~~~

.. code:: solidity

   function opLoadRemoteBytes32(address _ctx) public

.. _oploadremotebool-1:

opLoadRemoteBool
~~~~~~~~~~~~~~~~

.. code:: solidity

   function opLoadRemoteBool(address _ctx) public

.. _oploadremoteaddress-1:

opLoadRemoteAddress
~~~~~~~~~~~~~~~~~~~

.. code:: solidity

   function opLoadRemoteAddress(address _ctx) public

.. _opbool-1:

opBool
~~~~~~

.. code:: solidity

   function opBool(address _ctx) public

.. _opuint256-1:

opUint256
~~~~~~~~~

.. code:: solidity

   function opUint256(address _ctx) public

.. _opsendeth-1:

opSendEth
~~~~~~~~~

.. code:: solidity

   function opSendEth(address _ctx) public

.. _optransfer-1:

opTransfer
~~~~~~~~~~

.. code:: solidity

   function opTransfer(address _ctx) public

.. _optransferfrom-1:

opTransferFrom
~~~~~~~~~~~~~~

.. code:: solidity

   function opTransferFrom(address _ctx) public

.. _opuint256get-1:

opUint256Get
~~~~~~~~~~~~

.. code:: solidity

   function opUint256Get(address _ctx) public returns (uint256)

.. _oploadlocalget-1:

opLoadLocalGet
~~~~~~~~~~~~~~

.. code:: solidity

   function opLoadLocalGet(address _ctx, string funcSignature) public returns (bytes32 result)

.. _opaddressget-1:

opAddressGet
~~~~~~~~~~~~

.. code:: solidity

   function opAddressGet(address _ctx) public returns (address)

.. _oploadlocal-1:

opLoadLocal
~~~~~~~~~~~

.. code:: solidity

   function opLoadLocal(address _ctx, string funcSignature) public

.. _oploadremote-1:

opLoadRemote
~~~~~~~~~~~~

.. code:: solidity

   function opLoadRemote(address _ctx, string funcSignature) public

.. _opdeclare-1:

opDeclare
~~~~~~~~~

.. code:: solidity

   function opDeclare(address _ctx) public

.. _oppush-1:

opPush
~~~~~~

.. code:: solidity

   function opPush(address _ctx) public

.. _opget-1:

opGet
~~~~~

.. code:: solidity

   function opGet(address _ctx) public

.. _opsumof-1:

opSumOf
~~~~~~~

.. code:: solidity

   function opSumOf(address _ctx) public

.. _opsumthroughstructs-1:

opSumThroughStructs
~~~~~~~~~~~~~~~~~~~

.. code:: solidity

   function opSumThroughStructs(address _ctx) public

.. _opstruct-1:

opStruct
~~~~~~~~

.. code:: solidity

   function opStruct(address _ctx) public

.. _oplengthof-1:

opLengthOf
~~~~~~~~~~

.. code:: solidity

   function opLengthOf(address _ctx) public

.. _openablerecord-1:

opEnableRecord
~~~~~~~~~~~~~~

.. code:: solidity

   function opEnableRecord(address _ctx) public

App
---

.. _parser-2:

parser
~~~~~~

.. code:: solidity

   address parser

ctx
~~~

.. code:: solidity

   address ctx

.. _preprocessor-1:

preprocessor
~~~~~~~~~~~~

.. code:: solidity

   address preprocessor

.. _receive-2:

receive
~~~~~~~

.. code:: solidity

   receive() external payable

.. _constructor-5:

constructor
~~~~~~~~~~~

.. code:: solidity

   constructor(address _parser, address _preprocessor, address _ctx) public

.. _parse-3:

parse
~~~~~

.. code:: solidity

   function parse(string _program) external

.. _execute-3:

execute
~~~~~~~

.. code:: solidity

   function execute() external payable

\_setupContext
~~~~~~~~~~~~~~

.. code:: solidity

   function _setupContext() internal

BaseStorage
-----------

E2EApp
------

.. _preprocessor-2:

preprocessor
~~~~~~~~~~~~

.. code:: solidity

   address preprocessor

.. _parser-3:

parser
~~~~~~

.. code:: solidity

   address parser

.. _context-2:

context
~~~~~~~

.. code:: solidity

   address context

.. _receive-3:

receive
~~~~~~~

.. code:: solidity

   receive() external payable

.. _constructor-6:

constructor
~~~~~~~~~~~

.. code:: solidity

   constructor(address _parserAddr, address _preprAddr, address _ctx) public

.. _parse-4:

parse
~~~~~

.. code:: solidity

   function parse(string _program) external

.. _parsecode-1:

parseCode
~~~~~~~~~

.. code:: solidity

   function parseCode(string[] _code) external

.. _execute-4:

execute
~~~~~~~

.. code:: solidity

   function execute() external payable

.. _setupcontext-1:

setupContext
~~~~~~~~~~~~

.. code:: solidity

   function setupContext() internal

ERC20
-----

\_Implementation of the {IERC20} interface.

This implementation is agnostic to the way tokens are created. This
means that a supply mechanism has to be added in a derived contract
using {_mint}. For a generic mechanism see {ERC20PresetMinterPauser}.

TIP: For a detailed writeup see our guide
https://forum.zeppelin.solutions/t/how-to-implement-erc20-supply-mechanisms/226[How
to implement supply mechanisms].

We have followed general OpenZeppelin guidelines: functions revert
instead of returning ``false`` on failure. This behavior is nonetheless
conventional and does not conflict with the expectations of ERC20
applications.

Additionally, an {Approval} event is emitted on calls to {transferFrom}.
This allows applications to reconstruct the allowance for all accounts
just by listening to said events. Other implementations of the EIP may
not emit these events, as it isn’t required by the specification.

Finally, the non-standard {decreaseAllowance} and {increaseAllowance}
functions have been added to mitigate the well-known issues around
setting allowances. See {IERC20-approve}.\_

\_balances
~~~~~~~~~~

.. code:: solidity

   mapping(address => uint256) _balances

\_allowances
~~~~~~~~~~~~

.. code:: solidity

   mapping(address => mapping(address => uint256)) _allowances

.. _totalsupply-1:

\_totalSupply
~~~~~~~~~~~~~

.. code:: solidity

   uint256 _totalSupply

\_name
~~~~~~

.. code:: solidity

   string _name

\_symbol
~~~~~~~~

.. code:: solidity

   string _symbol

.. _constructor-7:

constructor
~~~~~~~~~~~

.. code:: solidity

   constructor(string name_, string symbol_) public

\_Sets the values for {name} and {symbol}.

The defaut value of {decimals} is 18. To select a different value for
{decimals} you should overload it.

All three of these values are immutable: they can only be set once
during construction.\_

.. _name-1:

name
~~~~

.. code:: solidity

   function name() public view virtual returns (string)

*Returns the name of the token.*

.. _symbol-1:

symbol
~~~~~~

.. code:: solidity

   function symbol() public view virtual returns (string)

*Returns the symbol of the token, usually a shorter version of the
name.*

decimals
~~~~~~~~

.. code:: solidity

   function decimals() public view virtual returns (uint8)

\_Returns the number of decimals used to get its user representation.
For example, if ``decimals`` equals ``2``, a balance of ``505`` tokens
should be displayed to a user as ``5,05`` (``505 / 10 ** 2``).

Tokens usually opt for a value of 18, imitating the relationship between
Ether and Wei. This is the value {ERC20} uses, unless this function is
overloaded;

NOTE: This information is only used for *display* purposes: it in no way
affects any of the arithmetic of the contract, including
{IERC20-balanceOf} and {IERC20-transfer}.\_

.. _totalsupply-2:

totalSupply
~~~~~~~~~~~

.. code:: solidity

   function totalSupply() public view virtual returns (uint256)

*See {IERC20-totalSupply}.*

.. _balanceof-1:

balanceOf
~~~~~~~~~

.. code:: solidity

   function balanceOf(address account) public view virtual returns (uint256)

*See {IERC20-balanceOf}.*

.. _transfer-2:

transfer
~~~~~~~~

.. code:: solidity

   function transfer(address recipient, uint256 amount) public virtual returns (bool)

\_See {IERC20-transfer}.

Requirements:

-  ``recipient`` cannot be the zero address.
-  the caller must have a balance of at least ``amount``.\_

.. _allowance-1:

allowance
~~~~~~~~~

.. code:: solidity

   function allowance(address owner, address spender) public view virtual returns (uint256)

*See {IERC20-allowance}.*

.. _approve-1:

approve
~~~~~~~

.. code:: solidity

   function approve(address spender, uint256 amount) public virtual returns (bool)

\_See {IERC20-approve}.

Requirements:

-  ``spender`` cannot be the zero address.\_

.. _transferfrom-1:

transferFrom
~~~~~~~~~~~~

.. code:: solidity

   function transferFrom(address sender, address recipient, uint256 amount) public virtual returns (bool)

\_See {IERC20-transferFrom}.

Emits an {Approval} event indicating the updated allowance. This is not
required by the EIP. See the note at the beginning of {ERC20}.

Requirements:

-  ``sender`` and ``recipient`` cannot be the zero address.
-  ``sender`` must have a balance of at least ``amount``.
-  the caller must have allowance for ``sender``\ ’s tokens of at least
   ``amount``.\_

increaseAllowance
~~~~~~~~~~~~~~~~~

.. code:: solidity

   function increaseAllowance(address spender, uint256 addedValue) public virtual returns (bool)

\_Atomically increases the allowance granted to ``spender`` by the
caller.

This is an alternative to {approve} that can be used as a mitigation for
problems described in {IERC20-approve}.

Emits an {Approval} event indicating the updated allowance.

Requirements:

-  ``spender`` cannot be the zero address.\_

decreaseAllowance
~~~~~~~~~~~~~~~~~

.. code:: solidity

   function decreaseAllowance(address spender, uint256 subtractedValue) public virtual returns (bool)

\_Atomically decreases the allowance granted to ``spender`` by the
caller.

This is an alternative to {approve} that can be used as a mitigation for
problems described in {IERC20-approve}.

Emits an {Approval} event indicating the updated allowance.

Requirements:

-  ``spender`` cannot be the zero address.
-  ``spender`` must have allowance for the caller of at least
   ``subtractedValue``.\_

.. _transfer-3:

\_transfer
~~~~~~~~~~

.. code:: solidity

   function _transfer(address sender, address recipient, uint256 amount) internal virtual

\_Moves tokens ``amount`` from ``sender`` to ``recipient``.

This is internal function is equivalent to {transfer}, and can be used
to e.g. implement automatic token fees, slashing mechanisms, etc.

Emits a {Transfer} event.

Requirements:

-  ``sender`` cannot be the zero address.
-  ``recipient`` cannot be the zero address.
-  ``sender`` must have a balance of at least ``amount``.\_

\_mint
~~~~~~

.. code:: solidity

   function _mint(address account, uint256 amount) internal virtual

\_Creates ``amount`` tokens and assigns them to ``account``, increasing
the total supply.

Emits a {Transfer} event with ``from`` set to the zero address.

Requirements:

-  ``to`` cannot be the zero address.\_

\_burn
~~~~~~

.. code:: solidity

   function _burn(address account, uint256 amount) internal virtual

\_Destroys ``amount`` tokens from ``account``, reducing the total
supply.

Emits a {Transfer} event with ``to`` set to the zero address.

Requirements:

-  ``account`` cannot be the zero address.
-  ``account`` must have at least ``amount`` tokens.\_

.. _approve-2:

\_approve
~~~~~~~~~

.. code:: solidity

   function _approve(address owner, address spender, uint256 amount) internal virtual

\_Sets ``amount`` as the allowance of ``spender`` over the ``owner`` s
tokens.

This internal function is equivalent to ``approve``, and can be used to
e.g. set automatic allowances for certain subsystems, etc.

Emits an {Approval} event.

Requirements:

-  ``owner`` cannot be the zero address.
-  ``spender`` cannot be the zero address.\_

\_beforeTokenTransfer
~~~~~~~~~~~~~~~~~~~~~

.. code:: solidity

   function _beforeTokenTransfer(address from, address to, uint256 amount) internal virtual

\_Hook that is called before any transfer of tokens. This includes
minting and burning.

Calling conditions:

-  when ``from`` and ``to`` are both non-zero, ``amount`` of
   ``from``\ ’s tokens will be to transferred to ``to``.
-  when ``from`` is zero, ``amount`` tokens will be minted for ``to``.
-  when ``to`` is zero, ``amount`` of ``from``\ ’s tokens will be
   burned.
-  ``from`` and ``to`` are never both zero.

To learn more about hooks, head to
xref:ROOT:extending-contracts.adoc#using-hooks[Using Hooks].\_

.. _erc20-1:

ERC20
-----

.. _transfer-4:

Transfer
~~~~~~~~

.. code:: solidity

   event Transfer(address from, address to, uint256 value)

\_Emitted when ``value`` tokens are moved from one account (``from``) to
another (``to``).

Note that ``value`` may be zero.\_

.. _approval-1:

Approval
~~~~~~~~

.. code:: solidity

   event Approval(address owner, address spender, uint256 value)

*Emitted when the allowance of a ``spender`` for an ``owner`` is set by
a call to {approve}. ``value`` is the new allowance.*

.. _balances-1:

\_balances
~~~~~~~~~~

.. code:: solidity

   mapping(address => uint256) _balances

.. _allowances-1:

\_allowances
~~~~~~~~~~~~

.. code:: solidity

   mapping(address => mapping(address => uint256)) _allowances

.. _totalsupply-3:

\_totalSupply
~~~~~~~~~~~~~

.. code:: solidity

   uint256 _totalSupply

.. _name-2:

\_name
~~~~~~

.. code:: solidity

   string _name

.. _symbol-2:

\_symbol
~~~~~~~~

.. code:: solidity

   string _symbol

.. _constructor-8:

constructor
~~~~~~~~~~~

.. code:: solidity

   constructor(string name_, string symbol_) public

\_Sets the values for {name} and {symbol}.

The default value of {decimals} is 18. To select a different value for
{decimals} you should overload it.

All two of these values are immutable: they can only be set once during
construction.\_

.. _name-3:

name
~~~~

.. code:: solidity

   function name() public view virtual returns (string)

*Returns the name of the token.*

.. _symbol-3:

symbol
~~~~~~

.. code:: solidity

   function symbol() public view virtual returns (string)

*Returns the symbol of the token, usually a shorter version of the
name.*

.. _decimals-1:

decimals
~~~~~~~~

.. code:: solidity

   function decimals() public view virtual returns (uint8)

\_Returns the number of decimals used to get its user representation.
For example, if ``decimals`` equals ``2``, a balance of ``505`` tokens
should be displayed to a user as ``5.05`` (``505 / 10 ** 2``).

Tokens usually opt for a value of 18, imitating the relationship between
Ether and Wei. This is the value {ERC20} uses, unless this function is
overridden;

NOTE: This information is only used for *display* purposes: it in no way
affects any of the arithmetic of the contract, including
{IERC20-balanceOf} and {IERC20-transfer}.\_

.. _totalsupply-4:

totalSupply
~~~~~~~~~~~

.. code:: solidity

   function totalSupply() public view virtual returns (uint256)

*See {IERC20-totalSupply}.*

.. _balanceof-2:

balanceOf
~~~~~~~~~

.. code:: solidity

   function balanceOf(address account) public view virtual returns (uint256)

*See {IERC20-balanceOf}.*

.. _transfer-5:

transfer
~~~~~~~~

.. code:: solidity

   function transfer(address to, uint256 amount) public virtual returns (bool)

\_See {IERC20-transfer}.

Requirements:

-  ``to`` cannot be the zero address.
-  the caller must have a balance of at least ``amount``.\_

.. _allowance-2:

allowance
~~~~~~~~~

.. code:: solidity

   function allowance(address owner, address spender) public view virtual returns (uint256)

*See {IERC20-allowance}.*

.. _approve-3:

approve
~~~~~~~

.. code:: solidity

   function approve(address spender, uint256 amount) public virtual returns (bool)

\_See {IERC20-approve}.

NOTE: If ``amount`` is the maximum ``uint256``, the allowance is not
updated on ``transferFrom``. This is semantically equivalent to an
infinite approval.

Requirements:

-  ``spender`` cannot be the zero address.\_

.. _transferfrom-2:

transferFrom
~~~~~~~~~~~~

.. code:: solidity

   function transferFrom(address from, address to, uint256 amount) public virtual returns (bool)

\_See {IERC20-transferFrom}.

Emits an {Approval} event indicating the updated allowance. This is not
required by the EIP. See the note at the beginning of {ERC20}.

NOTE: Does not update the allowance if the current allowance is the
maximum ``uint256``.

Requirements:

-  ``from`` and ``to`` cannot be the zero address.
-  ``from`` must have a balance of at least ``amount``.
-  the caller must have allowance for ``from``\ ’s tokens of at least
   ``amount``.\_

.. _increaseallowance-1:

increaseAllowance
~~~~~~~~~~~~~~~~~

.. code:: solidity

   function increaseAllowance(address spender, uint256 addedValue) public virtual returns (bool)

\_Atomically increases the allowance granted to ``spender`` by the
caller.

This is an alternative to {approve} that can be used as a mitigation for
problems described in {IERC20-approve}.

Emits an {Approval} event indicating the updated allowance.

Requirements:

-  ``spender`` cannot be the zero address.\_

.. _decreaseallowance-1:

decreaseAllowance
~~~~~~~~~~~~~~~~~

.. code:: solidity

   function decreaseAllowance(address spender, uint256 subtractedValue) public virtual returns (bool)

\_Atomically decreases the allowance granted to ``spender`` by the
caller.

This is an alternative to {approve} that can be used as a mitigation for
problems described in {IERC20-approve}.

Emits an {Approval} event indicating the updated allowance.

Requirements:

-  ``spender`` cannot be the zero address.
-  ``spender`` must have allowance for the caller of at least
   ``subtractedValue``.\_

.. _transfer-6:

\_transfer
~~~~~~~~~~

.. code:: solidity

   function _transfer(address from, address to, uint256 amount) internal virtual

\_Moves ``amount`` of tokens from ``sender`` to ``recipient``.

This internal function is equivalent to {transfer}, and can be used to
e.g. implement automatic token fees, slashing mechanisms, etc.

Emits a {Transfer} event.

Requirements:

-  ``from`` cannot be the zero address.
-  ``to`` cannot be the zero address.
-  ``from`` must have a balance of at least ``amount``.\_

.. _mint-1:

\_mint
~~~~~~

.. code:: solidity

   function _mint(address account, uint256 amount) internal virtual

\_Creates ``amount`` tokens and assigns them to ``account``, increasing
the total supply.

Emits a {Transfer} event with ``from`` set to the zero address.

Requirements:

-  ``account`` cannot be the zero address.\_

.. _burn-1:

\_burn
~~~~~~

.. code:: solidity

   function _burn(address account, uint256 amount) internal virtual

\_Destroys ``amount`` tokens from ``account``, reducing the total
supply.

Emits a {Transfer} event with ``to`` set to the zero address.

Requirements:

-  ``account`` cannot be the zero address.
-  ``account`` must have at least ``amount`` tokens.\_

.. _approve-4:

\_approve
~~~~~~~~~

.. code:: solidity

   function _approve(address owner, address spender, uint256 amount) internal virtual

\_Sets ``amount`` as the allowance of ``spender`` over the ``owner`` s
tokens.

This internal function is equivalent to ``approve``, and can be used to
e.g. set automatic allowances for certain subsystems, etc.

Emits an {Approval} event.

Requirements:

-  ``owner`` cannot be the zero address.
-  ``spender`` cannot be the zero address.\_

\_spendAllowance
~~~~~~~~~~~~~~~~

.. code:: solidity

   function _spendAllowance(address owner, address spender, uint256 amount) internal virtual

\_Spend ``amount`` form the allowance of ``owner`` toward ``spender``.

Does not update the allowance amount in case of infinite allowance.
Revert if not enough allowance is available.

Might emit an {Approval} event.\_

.. _beforetokentransfer-1:

\_beforeTokenTransfer
~~~~~~~~~~~~~~~~~~~~~

.. code:: solidity

   function _beforeTokenTransfer(address from, address to, uint256 amount) internal virtual

\_Hook that is called before any transfer of tokens. This includes
minting and burning.

Calling conditions:

-  when ``from`` and ``to`` are both non-zero, ``amount`` of
   ``from``\ ’s tokens will be transferred to ``to``.
-  when ``from`` is zero, ``amount`` tokens will be minted for ``to``.
-  when ``to`` is zero, ``amount`` of ``from``\ ’s tokens will be
   burned.
-  ``from`` and ``to`` are never both zero.

To learn more about hooks, head to
xref:ROOT:extending-contracts.adoc#using-hooks[Using Hooks].\_

\_afterTokenTransfer
~~~~~~~~~~~~~~~~~~~~

.. code:: solidity

   function _afterTokenTransfer(address from, address to, uint256 amount) internal virtual

\_Hook that is called after any transfer of tokens. This includes
minting and burning.

Calling conditions:

-  when ``from`` and ``to`` are both non-zero, ``amount`` of
   ``from``\ ’s tokens has been transferred to ``to``.
-  when ``from`` is zero, ``amount`` tokens have been minted for ``to``.
-  when ``to`` is zero, ``amount`` of ``from``\ ’s tokens have been
   burned.
-  ``from`` and ``to`` are never both zero.

To learn more about hooks, head to
xref:ROOT:extending-contracts.adoc#using-hooks[Using Hooks].\_

ERC20Mintable
-------------

.. _constructor-9:

constructor
~~~~~~~~~~~

.. code:: solidity

   constructor(string _name, string _symbol) public

.. _mint-2:

mint
~~~~

.. code:: solidity

   function mint(address _to, uint256 _amount) external

.. _burn-2:

burn
~~~~

.. code:: solidity

   function burn(address _to, uint256 _amount) external

StorageWithRevert
-----------------

.. _setstoragebool-7:

setStorageBool
~~~~~~~~~~~~~~

.. code:: solidity

   function setStorageBool(bytes32, uint256) public pure

.. _setstorageuint256-7:

setStorageUint256
~~~~~~~~~~~~~~~~~

.. code:: solidity

   function setStorageUint256(bytes32, uint256) public pure

Token
-----

.. _constructor-10:

constructor
~~~~~~~~~~~

.. code:: solidity

   constructor(uint256 totalSupply) public

Governance
----------

Financial Agreement written in DSL between two or more users

Agreement contract that is used to implement any custom logic of a
financial agreement. Ex. lender-borrower agreement

.. _parser-4:

parser
~~~~~~

.. code:: solidity

   contract IParser parser

.. _context-3:

context
~~~~~~~

.. code:: solidity

   contract IContext context

conditionContext
~~~~~~~~~~~~~~~~

.. code:: solidity

   contract IContext conditionContext

deadline
~~~~~~~~

.. code:: solidity

   uint256 deadline

.. _owneraddr-1:

ownerAddr
~~~~~~~~~

.. code:: solidity

   address ownerAddr

.. _newrecord-1:

NewRecord
~~~~~~~~~

.. code:: solidity

   event NewRecord(uint256 recordId, uint256[] requiredRecords, address[] signatories, string transaction, string[] conditionStrings)

.. _isreserved-1:

isReserved
~~~~~~~~~~

.. code:: solidity

   modifier isReserved(bytes32 position)

.. _onlyowner-1:

onlyOwner
~~~~~~~~~

.. code:: solidity

   modifier onlyOwner()

isUpgradableRecord
~~~~~~~~~~~~~~~~~~

.. code:: solidity

   modifier isUpgradableRecord(uint256 _recordId)

.. _record-1:

Record
~~~~~~

.. code:: solidity

   struct Record {
     address recordContext;
     bool isExecuted;
     bool isArchived;
     bool isActive;
     string transactionString;
   }

.. _records-1:

records
~~~~~~~

.. code:: solidity

   mapping(uint256 => struct Governance.Record) records

baseRecord
~~~~~~~~~~

.. code:: solidity

   mapping(uint256 => bool) baseRecord

.. _conditioncontexts-1:

conditionContexts
~~~~~~~~~~~~~~~~~

.. code:: solidity

   mapping(uint256 => address[]) conditionContexts

.. _conditionstrings-1:

conditionStrings
~~~~~~~~~~~~~~~~

.. code:: solidity

   mapping(uint256 => string[]) conditionStrings

.. _signatories-1:

signatories
~~~~~~~~~~~

.. code:: solidity

   mapping(uint256 => address[]) signatories

.. _requiredrecords-1:

requiredRecords
~~~~~~~~~~~~~~~

.. code:: solidity

   mapping(uint256 => uint256[]) requiredRecords

.. _isexecutedbysignatory-1:

isExecutedBySignatory
~~~~~~~~~~~~~~~~~~~~~

.. code:: solidity

   mapping(uint256 => mapping(address => bool)) isExecutedBySignatory

.. _recordids-1:

recordIds
~~~~~~~~~

.. code:: solidity

   uint256[] recordIds

.. _constructor-11:

constructor
~~~~~~~~~~~

.. code:: solidity

   constructor(address _parser, address _ownerAddr, address _token, uint256 _deadline) public

Sets parser address, creates new Context instance, and setups Context

.. _getstoragebool-4:

getStorageBool
~~~~~~~~~~~~~~

.. code:: solidity

   function getStorageBool(bytes32 position) external view returns (bool data)

.. _getstorageaddress-4:

getStorageAddress
~~~~~~~~~~~~~~~~~

.. code:: solidity

   function getStorageAddress(bytes32 position) external view returns (address data)

.. _getstorageuint256-4:

getStorageUint256
~~~~~~~~~~~~~~~~~

.. code:: solidity

   function getStorageUint256(bytes32 position) external view returns (uint256 data)

.. _setstoragebool-8:

setStorageBool
~~~~~~~~~~~~~~

.. code:: solidity

   function setStorageBool(bytes32 position, bool data) external

.. _setstorageaddress-7:

setStorageAddress
~~~~~~~~~~~~~~~~~

.. code:: solidity

   function setStorageAddress(bytes32 position, address data) external

.. _setstoragebytes32-4:

setStorageBytes32
~~~~~~~~~~~~~~~~~

.. code:: solidity

   function setStorageBytes32(bytes32 position, bytes32 data) external

.. _setstorageuint256-8:

setStorageUint256
~~~~~~~~~~~~~~~~~

.. code:: solidity

   function setStorageUint256(bytes32 position, uint256 data) external

.. _conditioncontextslen-1:

conditionContextsLen
~~~~~~~~~~~~~~~~~~~~

.. code:: solidity

   function conditionContextsLen(uint256 _recordId) external view returns (uint256)

*Based on Record ID returns the number of condition Context instances*

.. _parameters-98:

Parameters
^^^^^^^^^^

========== ======= ===========
Name       Type    Description
========== ======= ===========
\_recordId uint256 Record ID
========== ======= ===========

.. _return-values-36:

Return Values
^^^^^^^^^^^^^

==== ======= ===================================================
Name Type    Description
==== ======= ===================================================
[0]  uint256 Number of condition Context instances of the Record
==== ======= ===================================================

.. _signatorieslen-1:

signatoriesLen
~~~~~~~~~~~~~~

.. code:: solidity

   function signatoriesLen(uint256 _recordId) external view returns (uint256)

*Based on Record ID returns the number of signatures*

.. _parameters-99:

Parameters
^^^^^^^^^^

========== ======= ===========
Name       Type    Description
========== ======= ===========
\_recordId uint256 Record ID
========== ======= ===========

.. _return-values-37:

Return Values
^^^^^^^^^^^^^

==== ======= ===============================
Name Type    Description
==== ======= ===============================
[0]  uint256 Number of signatures in records
==== ======= ===============================

.. _requiredrecordslen-1:

requiredRecordsLen
~~~~~~~~~~~~~~~~~~

.. code:: solidity

   function requiredRecordsLen(uint256 _recordId) external view returns (uint256)

*Based on Record ID returns the number of required records*

.. _parameters-100:

Parameters
^^^^^^^^^^

========== ======= ===========
Name       Type    Description
========== ======= ===========
\_recordId uint256 Record ID
========== ======= ===========

.. _return-values-38:

Return Values
^^^^^^^^^^^^^

==== ======= ==========================
Name Type    Description
==== ======= ==========================
[0]  uint256 Number of required records
==== ======= ==========================

.. _conditionstringslen-1:

conditionStringsLen
~~~~~~~~~~~~~~~~~~~

.. code:: solidity

   function conditionStringsLen(uint256 _recordId) external view returns (uint256)

*Based on Record ID returns the number of condition strings*

.. _parameters-101:

Parameters
^^^^^^^^^^

========== ======= ===========
Name       Type    Description
========== ======= ===========
\_recordId uint256 Record ID
========== ======= ===========

.. _return-values-39:

Return Values
^^^^^^^^^^^^^

==== ======= =========================================
Name Type    Description
==== ======= =========================================
[0]  uint256 Number of Condition strings of the Record
==== ======= =========================================

.. _getactiverecords-1:

getActiveRecords
~~~~~~~~~~~~~~~~

.. code:: solidity

   function getActiveRecords() external view returns (uint256[])

*Sorted all records and return array of active records in Agreement*

.. _return-values-40:

Return Values
^^^^^^^^^^^^^

==== ========= ==================================================
Name Type      Description
==== ========= ==================================================
[0]  uint256[] activeRecords array of active records in Agreement
==== ========= ==================================================

.. _getrecord-1:

getRecord
~~~~~~~~~

.. code:: solidity

   function getRecord(uint256 _recordId) external view returns (uint256[] _requiredRecords, address[] _signatories, string[] _conditions, string _transaction, bool _isActive)

*return valuses for preview record before execution*

.. _parameters-102:

Parameters
^^^^^^^^^^

========== ======= ===========
Name       Type    Description
========== ======= ===========
\_recordId uint256 Record ID
========== ======= ===========

.. _return-values-41:

Return Values
^^^^^^^^^^^^^

+--------------+--------------+----------------------------------------+
| Name         | Type         | Description                            |
+==============+==============+========================================+
| \_req        | uint256[]    | array of required records in the       |
| uiredRecords |              | record                                 |
+--------------+--------------+----------------------------------------+
| \            | address[]    | array of signatories in the record     |
| _signatories |              |                                        |
+--------------+--------------+----------------------------------------+
| \_conditions | string[]     | array of conditions in the record      |
+--------------+--------------+----------------------------------------+
| \            | string       | string of transaction                  |
| _transaction |              |                                        |
+--------------+--------------+----------------------------------------+
| \_isActive   | bool         | true if the record is active           |
+--------------+--------------+----------------------------------------+

.. _archiverecord-1:

archiveRecord
~~~~~~~~~~~~~

.. code:: solidity

   function archiveRecord(uint256 _recordId) external

*archived any of the existing records by recordId.*

.. _parameters-103:

Parameters
^^^^^^^^^^

========== ======= ===========
Name       Type    Description
========== ======= ===========
\_recordId uint256 Record ID
========== ======= ===========

.. _unarchiverecord-1:

unarchiveRecord
~~~~~~~~~~~~~~~

.. code:: solidity

   function unarchiveRecord(uint256 _recordId) external

*unarchive any of the existing records by recordId*

.. _parameters-104:

Parameters
^^^^^^^^^^

========== ======= ===========
Name       Type    Description
========== ======= ===========
\_recordId uint256 Record ID
========== ======= ===========

.. _activaterecord-1:

activateRecord
~~~~~~~~~~~~~~

.. code:: solidity

   function activateRecord(uint256 _recordId) external

*activates the existing records by recordId, only awailable for
ownerAddr*

.. _parameters-105:

Parameters
^^^^^^^^^^

========== ======= ===========
Name       Type    Description
========== ======= ===========
\_recordId uint256 Record ID
========== ======= ===========

.. _deactivaterecord-1:

deactivateRecord
~~~~~~~~~~~~~~~~

.. code:: solidity

   function deactivateRecord(uint256 _recordId) external

*deactivates the existing records by recordId, only awailable for
ownerAddr*

.. _parameters-106:

Parameters
^^^^^^^^^^

========== ======= ===========
Name       Type    Description
========== ======= ===========
\_recordId uint256 Record ID
========== ======= ===========

.. _parse-5:

parse
~~~~~

.. code:: solidity

   function parse(string _code, address _context, address _preProc) external

*Parse DSL code from the user and set the program bytecode in Context
contract*

.. _parameters-107:

Parameters
^^^^^^^^^^

========= ======= ============================
Name      Type    Description
========= ======= ============================
\_code    string  DSL code input from the user
\_context address Context address
\_preProc address Preprocessor address
========= ======= ============================

.. _update-1:

update
~~~~~~

.. code:: solidity

   function update(uint256 _recordId, uint256[] _requiredRecords, address[] _signatories, string _transactionString, string[] _conditionStrings, address _recordContext, address[] _conditionContexts) public

.. _execute-5:

execute
~~~~~~~

.. code:: solidity

   function execute(uint256 _recordId) external payable

.. _receive-4:

receive
~~~~~~~

.. code:: solidity

   receive() external payable

.. _checksignatories-1:

\_checkSignatories
~~~~~~~~~~~~~~~~~~

.. code:: solidity

   function _checkSignatories(address[] _signatories) internal view

\_Checks input *signatures that only one ‘anyone’ address exists in the
list or that ‘anyone’ address does not exist in signatures at all*

.. _parameters-108:

Parameters
^^^^^^^^^^

============= ========= =====================
Name          Type      Description
============= ========= =====================
\_signatories address[] the list of addresses
============= ========= =====================

.. _verify-2:

\_verify
~~~~~~~~

.. code:: solidity

   function _verify(uint256 _recordId) internal view returns (bool)

Verify that the user who wants to execute the record is amoung the
signatories for this Record

.. _parameters-109:

Parameters
^^^^^^^^^^

========== ======= ================
Name       Type    Description
========== ======= ================
\_recordId uint256 ID of the record
========== ======= ================

.. _return-values-42:

Return Values
^^^^^^^^^^^^^

+--------------+--------------+----------------------------------------+
| Name         | Type         | Description                            |
+==============+==============+========================================+
| [0]          | bool         | true if the user is allowed to execute |
|              |              | the record, false - otherwise          |
+--------------+--------------+----------------------------------------+

.. _validaterequiredrecords-2:

\_validateRequiredRecords
~~~~~~~~~~~~~~~~~~~~~~~~~

.. code:: solidity

   function _validateRequiredRecords(uint256 _recordId) internal view returns (bool)

Check that all records required by this records were executed

.. _parameters-110:

Parameters
^^^^^^^^^^

========== ======= ================
Name       Type    Description
========== ======= ================
\_recordId uint256 ID of the record
========== ======= ================

.. _return-values-43:

Return Values
^^^^^^^^^^^^^

+--------------+--------------+----------------------------------------+
| Name         | Type         | Description                            |
+==============+==============+========================================+
| [0]          | bool         | true all the required records were     |
|              |              | executed, false - otherwise            |
+--------------+--------------+----------------------------------------+

.. _addrecordblueprint-2:

\_addRecordBlueprint
~~~~~~~~~~~~~~~~~~~~

.. code:: solidity

   function _addRecordBlueprint(uint256 _recordId, uint256[] _requiredRecords, address[] _signatories) internal

*Define some basic values for a new record*

.. _parameters-111:

Parameters
^^^^^^^^^^

+--------------+--------------+----------------------------------------+
| Name         | Type         | Description                            |
+==============+==============+========================================+
| \_recordId   | uint256      | is the ID of a transaction             |
+--------------+--------------+----------------------------------------+
| \_req        | uint256[]    | transactions ids that have to be       |
| uiredRecords |              | executed                               |
+--------------+--------------+----------------------------------------+
| \            | address[]    | addresses that can execute the chosen  |
| _signatories |              | transaction                            |
+--------------+--------------+----------------------------------------+

.. _addrecordcondition-2:

\_addRecordCondition
~~~~~~~~~~~~~~~~~~~~

.. code:: solidity

   function _addRecordCondition(uint256 _recordId, string _conditionStr, address _conditionCtx) internal

*Conditional Transaction: Append a condition to already existing
conditions inside Record*

.. _parameters-112:

Parameters
^^^^^^^^^^

+--------------+--------------+----------------------------------------+
| Name         | Type         | Description                            |
+==============+==============+========================================+
| \_recordId   | uint256      | Record ID                              |
+--------------+--------------+----------------------------------------+
| \_           | string       | DSL code for condition                 |
| conditionStr |              |                                        |
+--------------+--------------+----------------------------------------+
| \_           | address      | Context contract address for block of  |
| conditionCtx |              | DSL code for ``_conditionStr``         |
+--------------+--------------+----------------------------------------+

.. _addrecordtransaction-2:

\_addRecordTransaction
~~~~~~~~~~~~~~~~~~~~~~

.. code:: solidity

   function _addRecordTransaction(uint256 _recordId, string _transactionString, address _recordContext) internal

*Adds a transaction that should be executed if all conditions inside
Record are met*

.. _validateconditions-2:

\_validateConditions
~~~~~~~~~~~~~~~~~~~~

.. code:: solidity

   function _validateConditions(uint256 _recordId, uint256 _msgValue) internal returns (bool)

.. _fulfill-2:

\_fulfill
~~~~~~~~~

.. code:: solidity

   function _fulfill(uint256 _recordId, uint256 _msgValue, address _signatory) internal returns (bool)

*Fulfill Record*

.. _parameters-113:

Parameters
^^^^^^^^^^

+--------------+--------------+----------------------------------------+
| Name         | Type         | Description                            |
+==============+==============+========================================+
| \_recordId   | uint256      | Record ID to execute                   |
+--------------+--------------+----------------------------------------+
| \_msgValue   | uint256      | Value that were sent along with        |
|              |              | function execution // TODO: possibly   |
|              |              | remove this argument                   |
+--------------+--------------+----------------------------------------+
| \_signatory  | address      | The user that is executing the Record  |
+--------------+--------------+----------------------------------------+

.. _return-values-44:

Return Values
^^^^^^^^^^^^^

+--------------+--------------+----------------------------------------+
| Name         | Type         | Description                            |
+==============+==============+========================================+
| [0]          | bool         | Boolean whether the record was         |
|              |              | successfully executed or not           |
+--------------+--------------+----------------------------------------+

getActiveRecordsLen
~~~~~~~~~~~~~~~~~~~

.. code:: solidity

   function getActiveRecordsLen() public view returns (uint256)

*return length of active records for getActiveRecords*

.. _return-values-45:

Return Values
^^^^^^^^^^^^^

==== ======= ====================================
Name Type    Description
==== ======= ====================================
[0]  uint256 count length of active records array
==== ======= ====================================

\_updateRecord
~~~~~~~~~~~~~~

.. code:: solidity

   function _updateRecord(uint256 _recordId, string _record) internal

*Uploads pre-defined records to Governance contract directly. Uses a
simple condition string ``bool true``. Records that are uploaded using
``_updateRecord`` still have to be parsed using a preprocessor before
execution. Such record becomes non-upgradable. Check
``isUpgradableRecord`` modifier*

.. _parameters-114:

Parameters
^^^^^^^^^^

========== ======= =================================
Name       Type    Description
========== ======= =================================
\_recordId uint256 Record ID
\_record   string  the DSL code string of the record
========== ======= =================================

\_setBaseRecords
~~~~~~~~~~~~~~~~

.. code:: solidity

   function _setBaseRecords() internal

*Sets 4 pre-defined records for Governance contract*

GovernanceMock
--------------

.. _constructor-12:

constructor
~~~~~~~~~~~

.. code:: solidity

   constructor(address _parser, address _onlyOwner, address _token, uint256 _deadline) public
