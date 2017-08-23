pragma solidity ^0.4.14;

import '../token/MintableToken.sol';
import '../math/SafeMath.sol';
import '../ownership/Ownable.sol'

/**
 * @title DutchAuction
 * @notice Dutch Auction Crowdsale
 */
 contract DutchAuction is Ownable{
     /*
      *  Events
      */
     event BidSubmission(address indexed sender, uint256 amount);

     /*
      *  Storage
      */
     MintableToken public token;
     address public wallet;
     uint public ceiling;
     uint public priceFactor;
     uint public startBlock;
     uint public endBlock;
     uint public totalReceived;
     uint public finalPrice;
     mapping (address => uint) public bids;
     Stages public stage;

     enum Stages {
         AuctionDeployed,
         AuctionStarted,
         AuctionEnded,
         TradingStarted
     }

     /*
      *  Modifiers
      */
     modifier atStage(Stages _stage) {
         if (stage != _stage)
             // Contract not in expected state
             revert();
         _;
     }

     modifier validPurchase() {
       require(msg.value > 0);
       require(block.number >= startBlock && block.number <= endBlock)
     }


     /*
      *  Public functions
      */
     /// @dev Contract constructor function sets owner
     /// @param _wallet address Destination wallet
     /// @param _ceiling uint Auction ceiling
     /// @param _priceFactor uint Auction price factor
     function DutchAuction(address _wallet, uint _ceiling, uint _priceFactor)
         public
     {
         if (_wallet == 0 || _ceiling == 0 || _priceFactor == 0)
             // Arguments are null
             revert();
         owner = msg.sender;
         token = createTokenContract();
         wallet = _wallet;
         ceiling = _ceiling;
         priceFactor = _priceFactor;
         stage = Stages.AuctionDeployed;
     }



     /// @dev Starts auction and sets startBlock
     function startAuction()
         public
         onlyOwner
         atStage(Stages.AuctionDeployed)
     {
         stage = Stages.AuctionStarted;
         startBlock = block.number;
     }

     /// @dev Calculates current token price
     /// @return Returns token price
     function calcCurrentTokenPrice()
         public
         returns (uint)
     {
         if (stage == Stages.AuctionEnded || stage == Stages.TradingStarted)
             return finalPrice;
         return calcTokenPrice();
     }

     /// @dev Returns correct stage, ehas not yet been called yet
     /// @return Returns current auction stage
     function updateStage()
         public
         onlyOwner
     {
         stage = Stages(uint(stage) + 1);
     }

     /*
      *  Fallback function
      */
     /// @dev If the auction is active, make a bid for msg.sender
     function()
         public
     {
         if(stage != Stages.AuctionStarted)
           revert();
         bid(msg.sender);
     }

     /// @dev Allows to send a bid to the auction
     /// @param receiver address Bid will be assigned to this address
     function bid(address receiver)
         public
         payable
         atStage(Stages.AuctionStarted)
         validPurchase()
         returns (uint amount)
     {
         if(hasReachedEndBlock)
             finalizeAuction();

         receiver = msg.sender;
         amount = msg.value;

         uint maxWeiBasedOnTotalReceived = ceiling - totalReceived;
         // Only invest maximum possible amount
         if (amount > maxWeiBasedOnTotalReceived) {
             amount = maxWeiBasedOnTotalReceived;
             // Send change back to receiver address.
             receiver.transfer(msg.value - amount);
         }
         wallet.transfer(this.amount);
         bids[receiver] += amount;
         totalReceived = totalReceived + amount;
         if (maxWeiBasedOnTotalReceived == amount)
             // When maxWei is equal to the big amount the auction is ended and finalizeAuction is triggered
             finalizeAuction();
         BidSubmission(receiver, amount);
     }

     /// @dev Claims tokens for bidder after auction
     /// @param receiver Tokens will be assigned to this address if set
     function claimTokens(address receiver)
         public
         atStage(Stages.TradingStarted)
     {

         receiver = msg.sender;
         uint tokenCount = bids[receiver] * 10**18 / finalPrice;
         bids[receiver] = 0;
         token.transfer(receiver, tokenCount);
     }

     /// @notice The price function calculates the token price in the current block.
     /// @return Returns token price
     function calcTokenPrice()
         constant
         public
         returns (uint)
     {
         if(block.number <= endBlock){
            return priceFactor * 10**18 / (block.number - startBlock + 10000) + 1;
         } else {
            return priceFactor * 10**18 / (endBlock - startBlock + 10000) + 1;
         }

     }

     /// @dev Allow to start trading period
     function beginTradingPeriod()
         public
         onlyOwner
         atStage(Stages.AuctionEnded)
     {
         stage = Stages.TradingStarted;
     }

     /*
      *  Private functions
      */
     function finalizeAuction()
         private
     {
         stage = Stages.AuctionEnded;
         finalPrice = calcTokenPrice();
         // Crowdsale must be an authorized token minter
         token.mint(this, totalReceived / finalPrice + 1);
     }

     // creates the token to be sold.
     // override this method to have crowdsale of a specific mintable token.
     function createTokenContract() internal returns (MintableToken) {
       return new MintableToken();
     }

     function hasReachedEndBlock() internal returns(bool) {
       return block.number > endBlock;
     }
 }
