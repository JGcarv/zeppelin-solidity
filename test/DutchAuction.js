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

contract('Dutch Auction', (accounts) => {
  var dutchAuction, wallet, ceiling, rateFactor, startTime, endTime, token = {};

  before(async function() {
    //Advance to the next block to correctly read time in the solidity "now" function interpreted by testrpc
    await advanceBlock()
  })

  beforeEach(async () => {
    wallet = accounts[5];
    ceiling = ether(20);

    dutchAuction = await DutchAuction.new(wallet, ceiling);
    token = MintableToken.at(await dutchAuction.token())
  })

  it('should have deployed correctly', async ()  => {
    var cel = await dutchAuction.ceiling()
    var stage = await dutchAuction.stage();
    assert.equal(await dutchAuction.wallet(), wallet);
    assert.equal(cel.toNumber(), ceiling);
    assert.equal(stage.toNumber(), 0);
  })

  it('should setup auction correctly', async ()  => {
    var iniPrice = web3.toWei(2, 'ether');
    var decrRate = web3.toWei(0.0000033, 'ether');
    await dutchAuction.setup(7, iniPrice, decrRate);
    let stage = await dutchAuction.stage();
    assert.equal(stage.toNumber(),1);
  })

  it('should start auction correctly', async ()  => {
    var iniPrice = web3.toWei(2, 'ether');
    var decrRate = web3.toWei(0.0000033, 'ether');
    await dutchAuction.setup(7, iniPrice, decrRate);
    await dutchAuction.startAuction();
    let stage = await dutchAuction.stage();
    assert.equal(stage.toNumber(),2);
  })

  it('should bid correctly', async ()  => {
    var iniPrice = web3.toWei(2, 'ether');
    var decrRate = web3.toWei(0.0000033, 'ether');
    await dutchAuction.setup(7, iniPrice, decrRate);
    await dutchAuction.startAuction();
    let value = web3.toWei(10, 'ether');
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

  it('should end auction correctly when the ceiling is reached' , async ()  => {
    var iniPrice = web3.toWei(2, 'ether');
    var decrRate = web3.toWei(0.0000033, 'ether');
    await dutchAuction.setup(7, iniPrice, decrRate);
    await dutchAuction.startAuction();
    let value = web3.toWei(20, 'ether');
    await dutchAuction.bid(accounts[3], {value: value});
    let stage = await dutchAuction.stage();
    assert.equal(stage.toNumber(),3);

  })
  it('should end auction correctly when the end time is reached' , async ()  => {
    var iniPrice = web3.toWei(2, 'ether');
    var decrRate = web3.toWei(0.0000033, 'ether');
    await dutchAuction.setup(7, iniPrice, decrRate);
    await dutchAuction.startAuction();
    await dutchAuction.bid(accounts[4], {value: 1000000000000});
    await increaseTime(721200);
    await dutchAuction.bid(accounts[5], {value: 1000000000000});
    let stage = await dutchAuction.stage();
    assert.equal(stage.toNumber(),3);
  })

  it('should calculate price correctly ' , async ()  => {
    var iniPrice = web3.toWei(2, 'ether');
    var decrRate = web3.toWei(0.0000033, 'ether');
    await dutchAuction.setup(7, iniPrice, decrRate);
    await dutchAuction.startAuction();
    let price1 = await dutchAuction.calcTokenPrice();
    await increaseTime(100000);
    let price2 = await dutchAuction.calcTokenPrice();
    await increaseTime(400000);
    let price3 = await dutchAuction.calcTokenPrice();
    await increaseTime(200000);
    let price4 = await dutchAuction.calcTokenPrice();
    assert.isTrue(price1.toNumber() > price2.toNumber() && price2.toNumber() > price3.toNumber() && price3.toNumber() > price4.toNumber());
  })

  it('should calculate the final price correctly' , async ()  => {
    var iniPrice = web3.toWei(2, 'ether');
    var decrRate = web3.toWei(0.0000033, 'ether');
    await dutchAuction.setup(7, iniPrice, decrRate);
    await dutchAuction.startAuction();
    await increaseTime(604900);
    let price = await dutchAuction.calcTokenPrice();
    let p1 = web3.fromWei(price.toNumber(), 'ether');
    let p2 = 2 - (604800 * 0.0000033);
    assert.equal(p1, p2.toFixed(5));
  })

  it('should mint the correct amount of tokens' , async ()  => {
    var iniPrice = web3.toWei(2, 'ether');
    var decrRate = web3.toWei(0.0000033, 'ether');
    await dutchAuction.setup(7, iniPrice, decrRate);
    await dutchAuction.startAuction();
    await increaseTime(100000);
    await dutchAuction.bid(accounts[6], {value: web3.toWei(20, 'ether')});
    let price = await dutchAuction.calcTokenPrice();
    let finalPrice = web3.fromWei(price.toNumber(), 'ether');
    let balance = await token.balanceOf(dutchAuction.address);
    assert.equal(balance.toNumber(), Math.ceil(20 / finalPrice));

  })

  it('Bidders can claim the tokes correctly' , async ()  => {
    var iniPrice = web3.toWei(2, 'ether');
    var decrRate = web3.toWei(0.0000033, 'ether');
    await dutchAuction.setup(7, iniPrice, decrRate);
    await dutchAuction.startAuction();
    await increaseTime(300000);
    await dutchAuction.bid(accounts[6], {from: accounts[6], value: web3.toWei(10, 'ether')});
    await dutchAuction.bid(accounts[7], {from: accounts[7], value: web3.toWei(8, 'ether')});
    await dutchAuction.bid(accounts[8], {from: accounts[8], value: web3.toWei(3, 'ether')});
    await dutchAuction.claimTokens({from: accounts[6]});
    await dutchAuction.claimTokens({from: accounts[7]});
    await dutchAuction.claimTokens({from: accounts[8]});
    let price = await dutchAuction.calcTokenPrice();
    let finalPrice = web3.fromWei(price.toNumber(), 'ether');
    let balance6 = await token.balanceOf(accounts[6]);
    let balance7 = await token.balanceOf(accounts[7]);
    let balance8 = await token.balanceOf(accounts[8]);
    assert.equal(balance6.toNumber(), Math.ceil(10 / finalPrice));
    assert.equal(balance7.toNumber(), Math.ceil(8 / finalPrice));
    assert.equal(balance8.toNumber(), Math.ceil(2 / finalPrice));
  })


})
