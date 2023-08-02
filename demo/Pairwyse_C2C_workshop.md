# Pairwyse Workshops

## 1.  Contract-to-Contract bylaw governance workshop

# Prelim 1 - Deploy Pairwyse development sandbox

[Follow instructions for smart contract and UI test dApp setup](https://github.com/akiva-capital-holdings/pairwyse-dsl/blob/workshops/demo/v2/FE-demo-v2.md)

# Prelim 2 - Deploy demo currency token

![]()

# Demo - DAO token-to-treasury-to-governance agreement interfacing

Step 1 - 

Step 2 - 

Step 3 - 

Step 4 - 

Step 5 - 

Step 6 - 

Step 7 - 

Step 8 - 

Step 9 - 

Step 10 - 

Step 11 - 


## 2.  Technical Workshop - DAO charter instrumentation

![]()

```
contract DAO is Agreement {

    uint256 vote_number;
    address governance_token;
    string governance_token_symbol;

    address ANYONE = 0xFFfFfFffFFfffFFfFFfFFFFFffFFFffffFfFFFfF;

    constructor(
        address _parser,
        address _dslContext,
        address _goverance_token
    ) {
        _checkZeroAddress(_parser);
        _checkZeroAddress(_dslContext);
	_checkZeroAddress(_ownerAddr);

        contextDSL = _dslContext;
	parser = _parser;  /* optional:  governance language model customisations */
        ownerAddr = address(this);

        governance_token = _goverance_token;		
        string governance_token_symbol = IERC20(governance_token).symbol();

        UnstructuredStorage.setStorageAddress(
            bytes4(keccak256(abi.encodePacked(governance_token_symbol))),
            governance_token
        );

        vote_number = 0;
    }

    function initiateVote(
        uint256 _record_id,
        address _target_agreement,
        uint256 _deadline,
    ) public {

        /* option:  enforcement of deadline requirements */

        uint256 memory vote_bylaw_id_1 = (vote_number * 4) + 1;
        uint256 memory vote_bylaw_id_2 = vote_bylaw_id_1 + 1;
        uint256 memory vote_bylaw_id_3 = vote_bylaw_id_2 + 1;
        uint256 memory vote_bylaw_id_4 = vote_bylaw_id_3 + 1;

        vote_number = vote_number + 1;

        string memory vote_number_suffix = _uintToString(vote_number);
        string memory _record_id_string = _uintToString(_record_id);
        string memory _target_agreement_string = _addressToString(_target_agreement);
        string memory _deadline_vote = string(abi.encodePacked("DEADLINE", "_", vote_number_suffix);

        UnstructuredStorage.setStorageUint256(
            bytes4(keccak256(abi.encodePacked(_deadline_vote))), // optional:  date-time converters
            _deadline
        );

        UnstructuredStorage.setStorageUint256(
            bytes4(keccak256(abi.encodePacked(_record_id_string))), // optional:  record id alias  
            _record_id
        );

        UnstructuredStorage.setStorageAddress(
            bytes4(keccak256(abi.encodePacked( _target_agreement_string ))),  // optional:  contract alias
            _target_agreement
        );

        string memory _voting_conditon = string(abi.encodePacked(
            "((balanceOf ", governance_token_symbol, " MSG_SENDER) > 0) and (time < ", _deadline_vote, ")"
        ));

        string memory _affirmative_vote_condition = string(abi.encodePacked(
            "((votersBalance ", governance_token_symbol, " YES_", vote_number_suffix,") > (votersBalance ", governance_token_symbol, " NO_", vote_number_suffix, ")) and (time > ", _deadline_vote,")"
        ));	

        string memory _bylaw_activation_transaction = string(abi.encodePacked(
            "enableRecords ", _record_id_string," at ", _target_agreement_string
        ));
	
        /* Constitution:  An existing token holder must second the vote in order for voting to be activated before the deadline */
        _setVoteParameters(
            vote_bylaw_id_1, // RECORD ID
            _voting_conditon // CONDITIONS
            string(abi.encodePacked(
                "declareArr address YES_", vote_number_suffix, " declareArr address NO_", vote_number_suffix // TRANSACTION	
            )); 
        );
 
        /* Constitution:  A record of affirmative votes will be registered before the deadline */
        _setVoteParameters(
            vote_bylaw_id_2, // RECORD ID
            _voting_conditon // CONDITIONS
            string(abi.encodePacked(
                "insert MSG_SENDER into YES_", vote_number_suffix // TRANSACTION
            )) 
        );

        /* Constitution:  A record of negative votes will be registered will be registered before the deadline */
        _setVoteParameters(
            vote_bylaw_id_3, // RECORD ID
            _voting_conditon, // CONDITIONS
            string(abi.encodePacked(
                "insert MSG_SENDER into NO_", vote_number_suffix // TRANSACTION
            )) 
        );

        // Constitution:  If the aggregate token balance for YES votes is greater than that of NO votes, the bylaw record at the target agreement will be officially enacted
        _setVoteParameters(
            vote_bylaw_id_4, // RECORD ID
            _affirmative_vote_condition, // CONDITIONS
            _bylaw_activation_transaction, // TRANSACTION
        );

        /* emit DAOVoteInitiated() // optional:  public notice of vote initiation */
    }

    function _uintToString(uint256 number) internal pure returns (string) { /* audited method or library of choice */ }

    function _addressToString(uint256 number) internal pure returns (string) { /* audited method or library of choice */ }

    function _setVoteParameters(
        uint256 _recordId,
        string memory _record,
        string memory _condition,
        uint256 _requiredRecordsLength
    ) internal {	
        /* can follow constitutional pattern of _setParameters in Governance.sol */
        /* optional:  rights protection and scope enforcement implementations */
        /* optional:  invoke votes for other token holder classes (e.g. users, depositors, creditors, etc)
    }
    /* optional:  governance contract ownership transfer protocol * /
    /* optional:  definition restrictions * /
    /* optional:  language restrictions * /
    
}
```

[![]()]() 

## 3.  Business Workshop - DAO Capital Instrument Basics

[![]()]() 

## 4.  Risk Workshop - Scope Enforcement Basics

[![]()]()

## 5.  BFT DAO genesis Workshop

![]()

[![]()]() 
