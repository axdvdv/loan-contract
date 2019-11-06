pragma solidity >=0.5.0 <0.6.0;

import '@openzeppelin/contracts/ownership/Ownable.sol';
import '@openzeppelin/contracts/utils/Address.sol';
import '@openzeppelin/contracts/cryptography/ECDSA.sol';

/// @title Contract for micro loans
contract LoanContract is Ownable {

    enum Status {Empty, Created, Approved, Canceled, Refused, Completed}
    using ECDSA for bytes32;

    struct Loan {
        uint256 amount;
        address payable receiver;
        uint256 ttl;
        Status  status;
    }

    event LoanRequested(bytes32 RequestId);
    event LoanApproved(bytes32 RequestId, uint256 amount);
    event LoanCanceled();
    event LoanRefused();
    event LoanTaken();

    mapping(bytes32 => Loan) public Loans;

    bytes4 constant RequestLoanSig = bytes4(keccak256('requestLoan(uint256,uint256)'));
    bytes4 constant takeLoanSig    = bytes4(keccak256('takeLoan(bytes32)'));
    bytes4 constant refuseLoanSig  = bytes4(keccak256('refuseLoan(bytes32)'));


    constructor() public {

    }

    /// @notice request a loan
    /// @param amount Requested amount ETH (in wei) 
    /// @param ttl The number of rings from dendrochronological sample
    /// @return unique id for loan
    function requestLoan(uint256 amount, uint256 ttl) public returns(bytes32 id) {
        return createLoan(amount, msg.sender, ttl);
    }

    /// @notice request a loan by sponsor
    /// @param amount Requested amount ETH (in wei) 
    /// @param ttl The number of rings from dendrochronological sample
    /// @param account Borrower' account
    /// @param signature Account's signature
    /// @return unique id for loan
    function sponsorshipRequestLoan(uint256 amount, uint256 ttl, address payable account, bytes memory signature) public returns(bytes32 id) {
        require(ttl > block.number, 'invalid ttl');
        bytes32 hash = keccak256(abi.encodePacked(amount, ttl));
        require(checkSponsorship(account, hash, signature), 'invalid sponsor signature');
        return createLoan(amount, account, ttl);
    }

    /// @notice Take approved loan
    /// @param loanId unique loan id
    function takeLoan(bytes32 loanId) public {
        Loan storage loan = Loans[loanId];
        require(loan.status == Status.Approved, 'loan is not approved');
        loan.status = Status.Completed;
        Address.sendValue(loan.receiver, loan.amount);
    }

    /// @notice take approved loan by sponsor
    /// @param loanId unique loan id
    /// @param account Borrower' account
    /// @param signature Account's signature
    function sponsorshipTakeLoan(bytes32 loanId, address account, bytes memory signature) public {
        bytes32 hash = keccak256(abi.encodeWithSelector(takeLoanSig, loanId));
        require(checkSponsorship(account, hash, signature), 'invalid sponsor signature');

        takeLoan(loanId);
    }

    /// @notice Refuse approved loan
    /// @param loanId unique loan id
    function refuseLoan(bytes32 loanId) public {
        Loan storage loan = Loans[loanId];
        require(loan.status == Status.Approved, 'loan is not approved');
        address payable owner = Address.toPayable(owner());
        loan.status = Status.Refused;
        Address.sendValue(owner, loan.amount);
    }

    /// @notice Refuse approved loan
    /// @param loanId unique loan id
    /// @param account Borrower' account
    /// @param signature Account's signature
    function sponsorshipRefuseLoan(bytes32 loanId, address account, bytes memory signature) public {
        bytes32 hash = keccak256(abi.encodeWithSelector(refuseLoanSig, loanId));
        require(checkSponsorship(account, hash, signature), 'invalid sponsor signature');

        refuseLoan(loanId);
    }

    /// @notice Approve a loan
    /// @param loanId unique loan id
    function approveLoan(bytes32 loanId) onlyOwner payable public {
        Loan storage loan = Loans[loanId];
        require(msg.value <= loan.amount, 'invalid amount');
        require(loan.ttl > block.number, 'loan is out of date');
        loan.amount = msg.value;
        loan.status = Status.Approved;
        emit LoanApproved(loanId, msg.value);
    }

    /// @notice Cancel a loan
    /// @param loanId unique loan id
    function cancelLoan(bytes32 loanId) onlyOwner public {
        Loan storage loan = Loans[loanId];
        loan.status = Status.Canceled;
        emit LoanCanceled();
    }

    function createLoan(uint256 amount, address payable account, uint256 ttl) internal returns(bytes32) {
        bytes32 id = keccak256(abi.encodePacked(amount, account, ttl, block.number));
        require(Loans[id].status == Status.Empty, 'Loan has already created');

        Loans[id] = Loan({
            amount   : amount,
            receiver : account,
            ttl      : ttl,
            status   : Status.Created
        });

        emit LoanRequested(id);
        return id;
    }

    function checkSponsorship(address account, bytes32 hash, bytes memory signature) internal pure returns(bool) {
        bytes32 messageHash = hash.toEthSignedMessageHash();
        address signer = messageHash.recover(signature);
        if(signer == account) {
            return true;
        } else {
            return false;
        }
    }
}