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

    dutchAuction = await DutchAuction.new(wallet, ceiling, rateFactor, startTime, endTime);
    token = MintableToken.at(await dutchAuction.token())
  })

  it('should have deployed correctly', async ()  => {
    assert.equal(await dutchAuction.wallet(), wallet);
    var cel = await dutchAuction.ceiling()
    assert.equal(cel.toNumber(), ceiling);
    assert.equal(await dutchAuction.startTime(), startTime);
    assert.equal(await dutchAuction.endTime(), endTime);
  })

  it('should avoid', async ()  => {

  })
  it('should', async ()  => {

  })
  it('should', async ()  => {

  })

})
