Ownable
=============================================

A contract that provides an authorization layer, allowing for specific
actions to be restricted to a specific account or group of accounts. It's
usually used as an extension to other contracts.


Interface
=============================================

function Ownable( )
----------
Sets the creator(message sender) of the contract as the owner.

modifier onlyOwner( )
----------------------
Prevents the execution if it's called by anyone but
the owner.

function transfer(address newOwner) onlyOwner
----------------------------------------------
Transfer the ownership of the contrat to the provived address.
It can only be called by the current owner.


Maturity
=============================================

It's widely used and considered safe.


Extensions
=============================================

Here's the list of all Zeppelin contracts the make use of the Ownable.sol
contract.

- `Claimable.sol<https://github.com/OpenZeppelin/zeppelin-solidity/blob/master/contracts/ownership/Claimable.sol>`_
      A contract where the ownership needs to be claimed.

- `Contactable.sol<https://github.com/OpenZeppelin/zeppelin-solidity/blob/master/contracts/ownership/Contactable.sol>`_
      A contract that provides the author's contact information.

- `DelayedClaimable.sol<https://github.com/OpenZeppelin/zeppelin-solidity/blob/master/contracts/ownership/DelayedClaimable.sol>`_
      Extension for the Claimable contract, where the ownership needs to be claimed before/after certain block number.

- `Destructible.sol<https://github.com/OpenZeppelin/zeppelin-solidity/blob/master/contracts/lifecycle/Destructible.sol>`_
      Base contract that can be destroyed by owner. All funds in contract will be sent to the owner.
      
- `MintableToken.sol<https://github.com/OpenZeppelin/zeppelin-solidity/blob/master/contracts/token/MintableToken.sol>`_
      Simple ERC20 Token example, with mintable token creation

- `Pausable.sol<https://github.com/OpenZeppelin/zeppelin-solidity/blob/master/contracts/lifecycle/Pausable.sol>`_
      Abstract contract that allows children to implement an emergency stop mechanism.

- `TokenDestructible.sol<https://github.com/OpenZeppelin/zeppelin-solidity/blob/master/contracts/lifecycle/TokenDestructible.sol>`_
      Base contract that can be destroyed by owner. All funds in contract including listed tokens will be sent to the owner.
