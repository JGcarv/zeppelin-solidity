import ether from './helpers/ether'
import {advanceBlock} from './helpers/advanceToBlock'
import {increaseTimeTo, duration} from './helpers/increaseTime'
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
    ceiling = ether(1000);
    rateFactor = 10000;
    startTime = latestTime() + duration.weeks(1);
    endTime = startTime + duration.weeks(1);

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

  })

  it('should start auction correctly', async ()  => {

  })

  it('should bid correctly with the Fallback function', async ()  => {

  })
  it('should bid correctly in the low level bid function', async ()  => {

  })
  it('should end auction correctly when the ceiling is reached' , async ()  => {

  })
  it('should end auction correctly when the end time is reached' , async ()  => {

  })

  it('should calculate price correctly ' , async ()  => {

  })

  it('should calculate the final price correctly' , async ()  => {

  })

  it('should mint the correct amount of tokens' , async ()  => {

  })

  it('Bidders can claim the tokes correctly' , async ()  => {

  })


})
