pragma solidity ^0.4.8;


///@title Ownable
contract Ownable {
  address public owner;

  //@dev The constructor sets the msg.sender as the contract owner
  function Ownable() {
    owner = msg.sender;
  }

  //@dev The modifier ensures that only the owner can execute the function.
  modifier onlyOwner() {
    if (msg.sender != owner) {
      throw;
    }
    _;
  }

  //@notice Transfer the ownership of the contract to the passed address.
  //@param address The address of the new owner.
  function transferOwnership(address newOwner) onlyOwner {
    if (newOwner != address(0)) {
      owner = newOwner;
    }
  }

}
