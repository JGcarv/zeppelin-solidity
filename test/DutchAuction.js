import ether from './helpers/ether'
import {advanceBlock} from './helpers/advanceToBlock'
import increaseTime from './helpers/increaseTime'
import latestTime from './helpers/latestTime'
import EVMThrow from './helpers/EVMThrow'

const BigNumber = web3.BigNumber

const should = require('chai')
  .use(require('chai-as-promised'))
  .use(require('chai-bignumber')(BigNumber))
  .should()

const DutchAuction = artifacts.require('DutchAuction')
const MintableToken = artifacts.require('MintableToken')

const priceCalculator = (inicialPrice, decreaseRate, time) => {
  return inicialPrice - (time * decreaseRate)
}

contract('Dutch Auction', (accounts) => {
  var dutchAuction, wallet, ceiling, rateFactor, startTime, endTime = {};
  var finalPrice, token, iniPrice, decrRate = {};
  var randomTime = {};

  describe("General auction functionalities", async () => {
    before(async () => {
      wallet = accounts[5];
      ceiling = ether(20);

      dutchAuction = await DutchAuction.new(wallet, ceiling);
      token = MintableToken.at(await dutchAuction.token())

      iniPrice = web3.toWei(2, 'ether');
      decrRate = web3.toWei(0.0000033, 'ether');
    })

    it('should have deployed correctly', async ()  => {
      var cel = await dutchAuction.ceiling()
      var stage = await dutchAuction.stage();
      assert.equal(await dutchAuction.wallet(), wallet);
      assert.equal(cel.toNumber(), ceiling);
      assert.equal(stage.toNumber(), 0);
    })

    it('should setup auction correctly', async ()  => {
      await dutchAuction.setup(7, iniPrice, decrRate);
      let stage = await dutchAuction.stage();
      assert.equal(stage.toNumber(),1);
    })

    it('should start auction correctly', async ()  => {
      await dutchAuction.startAuction();
      let stage = await dutchAuction.stage();
      assert.equal(stage.toNumber(),2);
    })

    it('should calculate price correctly ' , async ()  => {
        let randomTime = Math.floor(Math.random() * (600000 - 1) + 1);
        await increaseTime(randomTime);
        let price = await dutchAuction.calcTokenPrice();
        let check = priceCalculator(iniPrice, decrRate, randomTime);
        assert.equal(price.toNumber(), check);
    })

    it('should bid correctly', async ()  => {
      let value = web3.toWei(5, 'ether');
      web3.eth.sendTransaction({from:accounts[4], to:dutchAuction.address, value:value}, (err, txHase) => {
        if(err){
          console.log(err);
        }
      })
      await dutchAuction.bid(accounts[3], {value: value});
      let bid = await dutchAuction.bids(accounts[3]);
      let bid2 = await dutchAuction.bids(accounts[4]);
      assert.equal(bid.toNumber(), value);
      assert.equal(bid2.toNumber(), value);
    })

  }) // describe


  describe("Auctions that reach the ether ceiling", async () => {

    before(async () =>{
      wallet = accounts[5];
      ceiling = web3.toWei(20, 'ether');

      dutchAuction = await DutchAuction.new(wallet, ceiling);
      token = MintableToken.at(await dutchAuction.token())

      iniPrice = web3.toWei(2, 'ether');
      decrRate = web3.toWei(0.0000033, 'ether');

      await dutchAuction.setup(7, iniPrice, decrRate);
      await dutchAuction.startAuction();

      randomTime = Math.floor(Math.random() * (600000 - 1) + 1);
      await increaseTime(randomTime);

    })

    it('should only bid the amount allowed to not reach the cap', async () => {
      let value = ether(25);
      await dutchAuction.bid(accounts[3], {value: value});
      let bid = await dutchAuction.bids(accounts[3]);
      assert.equal(bid.toNumber(), ceiling);
    })

    it('should end auction correctly when the ceiling is reached' , async ()  => {
      let stage = await dutchAuction.stage();
      assert.equal(stage.toNumber(),3);
    })

    it('should calculate final price correctly', async () => {
      finalPrice = await dutchAuction.calcTokenPrice();
      assert.closeTo(finalPrice.toNumber(), priceCalculator(iniPrice, decrRate, randomTime), 100);
    })

    it('should mint the correct amount of tokens' , async ()  => {
      let balance = await token.balanceOf(dutchAuction.address);
      assert.equal(balance.toNumber(), Math.ceil(ceiling * Math.pow(10,18)/ finalPrice));
    })

    it('bidders should claim the correct amount of tokens', async () => {
      let bid = await dutchAuction.bids(accounts[3]);
      await dutchAuction.claimTokens({from: accounts[3]});
      let balance = await token.balanceOf(accounts[3]);
      assert.equal(balance.toNumber(), Math.ceil(bid.toNumber() * Math.pow(10,18)/ finalPrice));
    })

  }) //describe


  describe("Auctions that reach the end time", async () => {

    before(async () =>{
      wallet = accounts[5];
      ceiling = web3.toWei(20, 'ether');

      dutchAuction = await DutchAuction.new(wallet, ceiling);
      token = MintableToken.at(await dutchAuction.token())

      iniPrice = web3.toWei(2, 'ether');
      decrRate = web3.toWei(0.0000033, 'ether');

      await dutchAuction.setup(7, iniPrice, decrRate);
      await dutchAuction.startAuction();

      randomTime = Math.floor(Math.random() * (600000 - 1) + 1);
      await increaseTime(randomTime);
    })

    it('should end auction correctly when the end time is reached' , async ()  => {
      await dutchAuction.bid(accounts[4], {value: ether(1)});
      await increaseTime(721200);
      await dutchAuction.bid(accounts[5], {value: ether(1)});
      let stage = await dutchAuction.stage();
      assert.equal(stage.toNumber(),3);
    })

    it('should calculate the final price correctly' , async ()  => {
      finalPrice = await dutchAuction.calcTokenPrice();
      assert.equal(finalPrice.toNumber(),priceCalculator(iniPrice, decrRate, 604800));
    })

    it('should mint the correct amount of tokens' , async ()  => {
      let balance = await token.balanceOf(dutchAuction.address);
      let totalRaised = await dutchAuction.totalReceived();
      assert.equal(balance.toNumber(), Math.ceil(totalRaised.toNumber() * Math.pow(10,18)/ finalPrice));
    })

    it('bidders should claim the correct amount of tokens', async () => {
      let bid = await dutchAuction.bids(accounts[4]);
      await dutchAuction.claimTokens({from: accounts[4]});
      let balance = await token.balanceOf(accounts[4]);
      assert.equal(balance.toNumber(), Math.ceil(bid.toNumber() * Math.pow(10,18)/ finalPrice));
    })

  }) //describe



  //
  // it('should mint the correct amount of tokens' , async ()  => {
  //   var iniPrice = web3.toWei(2, 'ether');
  //   var decrRate = web3.toWei(0.0000033, 'ether');
  //   await dutchAuction.setup(7, iniPrice, decrRate);
  //   await dutchAuction.startAuction();
  //   await increaseTime(100000);
  //   await dutchAuction.bid(accounts[6], {value: web3.toWei(20, 'ether')});
  //   let price = await dutchAuction.calcTokenPrice();
  //   let finalPrice = web3.fromWei(price.toNumber(), 'ether');
  //   let balance = await token.balanceOf(dutchAuction.address);
  //   assert.equal(balance.toNumber(), Math.ceil(20 / finalPrice));
  //
  // })
  //
  // it('Bidders can claim the tokes correctly' , async ()  => {
  //   var iniPrice = web3.toWei(2, 'ether');
  //   var decrRate = web3.toWei(0.0000033, 'ether');
  //   await dutchAuction.setup(7, iniPrice, decrRate);
  //   await dutchAuction.startAuction();
  //   await increaseTime(300000);
  //   await dutchAuction.bid(accounts[6], {from: accounts[6], value: web3.toWei(10, 'ether')});
  //   await dutchAuction.bid(accounts[7], {from: accounts[7], value: web3.toWei(8, 'ether')});
  //   await dutchAuction.bid(accounts[8], {from: accounts[8], value: web3.toWei(3, 'ether')});
  //   await dutchAuction.claimTokens({from: accounts[6]});
  //   await dutchAuction.claimTokens({from: accounts[7]});
  //   await dutchAuction.claimTokens({from: accounts[8]});
  //   let price = await dutchAuction.calcTokenPrice();
  //   let finalPrice = web3.fromWei(price.toNumber(), 'ether');
  //   let balance6 = await token.balanceOf(accounts[6]);
  //   let balance7 = await token.balanceOf(accounts[7]);
  //   let balance8 = await token.balanceOf(accounts[8]);
  //   assert.equal(balance6.toNumber(), Math.ceil(10 / finalPrice));
  //   assert.equal(balance7.toNumber(), Math.ceil(8 / finalPrice));
  //   assert.equal(balance8.toNumber(), Math.ceil(2 / finalPrice));
  // })

})
