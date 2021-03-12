const StarNotary = artifacts.require("StarNotary");

var accounts;
var owner;
const testTimeout = 10000;

contract('StarNotary', (accs) => {
    accounts = accs;
    owner = accounts[0];
});

it('can Create a Star', async() => {
    let tokenId = 1;
    let instance = await StarNotary.deployed();
    await instance.createStar('Awesome Star!', tokenId, {from: accounts[0]})
    assert.equal(await instance.tokenIdToStarInfo.call(tokenId), 'Awesome Star!')
});

it('lets user1 put up their star for sale', async() => {
    let instance = await StarNotary.deployed();
    let user1 = accounts[1];
    let starId = 2;
    let starPrice = web3.utils.toWei(".01", "ether");
    await instance.createStar('awesome star', starId, {from: user1});
    await instance.putStarUpForSale(starId, starPrice, {from: user1});
    assert.equal(await instance.starsForSale.call(starId), starPrice);
});

it('lets user1 get the funds after the sale', async() => {
    let instance = await StarNotary.deployed();
    let user1 = accounts[1];
    let user2 = accounts[2];
    let starId = 3;
    let starPrice = web3.utils.toWei(".01", "ether");
    let balance = web3.utils.toWei(".05", "ether");
    await instance.createStar('awesome star', starId, {from: user1});
    await instance.putStarUpForSale(starId, starPrice, {from: user1});
    let balanceOfUser1BeforeTransaction = await web3.eth.getBalance(user1);
    await instance.approve(user2, starId, {from: user1, gasPrice:0});
    await instance.buyStar(starId, {from: user2, value: balance});
    let balanceOfUser1AfterTransaction = await web3.eth.getBalance(user1);
    let value1 = Number(balanceOfUser1BeforeTransaction) + Number(starPrice);
    let value2 = Number(balanceOfUser1AfterTransaction);
    assert.equal(value1, value2);
}).timeout(testTimeout);

it('lets user2 buy a star, if it is put up for sale', async() => {
    let instance = await StarNotary.deployed();
    let user1 = accounts[1];
    let user2 = accounts[2];
    let starId = 4;
    let starPrice = web3.utils.toWei(".01", "ether");
    let balance = web3.utils.toWei(".05", "ether");
    await instance.createStar('awesome star', starId, {from: user1});
    await instance.putStarUpForSale(starId, starPrice, {from: user1});
    let balanceOfUser1BeforeTransaction = await web3.eth.getBalance(user2);
    await instance.approve(user2, starId, {from: user1, gasPrice:0});
    await instance.buyStar(starId, {from: user2, value: balance});
    assert.equal(await instance.ownerOf.call(starId), user2);
}).timeout(testTimeout);

it('lets user2 buy a star and decreases its balance in ether', async() => {
    let instance = await StarNotary.deployed();
    let user1 = accounts[1];
    let user2 = accounts[2];
    let starId = 5;
    let starPrice = web3.utils.toWei(".01", "ether");
    let balance = web3.utils.toWei(".05", "ether");
    await instance.createStar('awesome star', starId, {from: user1});
    await instance.putStarUpForSale(starId, starPrice, {from: user1});
    let balanceOfUser1BeforeTransaction = await web3.eth.getBalance(user2);
    const balanceOfUser2BeforeTransaction = await web3.eth.getBalance(user2);
    await instance.approve(user2, starId, {from: user1, gasPrice:0});
    await instance.buyStar(starId, {from: user2, value: balance, gasPrice:0});
    const balanceAfterUser2BuysStar = await web3.eth.getBalance(user2);
    let value = Number(balanceOfUser2BeforeTransaction) - Number(balanceAfterUser2BuysStar);
    assert.equal(value, starPrice);
}).timeout(testTimeout);

// Implement Task 2 Add supporting unit tests

it('can add the star name and star symbol properly', async() => {
    const aTokenName = "Star Ken";
    const aTokenSymbol = "STAR";
    let differentTokenId = 123;
    let user = accounts[0];
    let instance = await StarNotary.new(aTokenName, aTokenSymbol);
    // 1. create a Star with different tokenId
    await instance.createStar('Star', differentTokenId, {from: user});
    //2. Call the name and symbol properties in your Smart Contract and compare with the name and symbol provided
    assert.equal(aTokenName, await instance.name());
    assert.equal(aTokenSymbol, await instance.symbol());
}).timeout(testTimeout);

it('lets 2 users exchange stars', async() => {
    let tokenId1 = 1001;
    let tokenId2 = 1002;
    let firstUser = accounts[0];
    let secondUser = accounts[1];
    let instance = await StarNotary.deployed();
    // 1. create 2 Stars with different tokenId
    await instance.createStar('First Star!', tokenId1, {from: firstUser});
    await instance.createStar('2nd Star', tokenId2, {from: secondUser});
    // 2. Call the exchangeStars functions implemented in the Smart Contract
    await instance.approve(secondUser, tokenId1, {from: firstUser, gasPrice:0});
    await instance.approve(firstUser, tokenId2, {from: secondUser, gasPrice:0});
    await instance.exchangeStars(tokenId1, tokenId2, {from: firstUser});
    // 3. Verify that the owners changed
    assert.equal(await instance.ownerOf.call(tokenId1), secondUser);
    assert.equal(await instance.ownerOf.call(tokenId2), firstUser);
}).timeout(testTimeout);

it('lets a user transfer a star', async() => {
    let differentTokenId = 9901;
    let fromUser = accounts[0];
    let toUser = accounts[1];
    let instance = await StarNotary.deployed();
    // 1. create a Star with different tokenId
    await instance.createStar('Discovered Star', differentTokenId, {from: fromUser});
    // 2. use the transferStar function implemented in the Smart Contract
    await instance.approve(toUser, differentTokenId, {from: fromUser, gasPrice:0});
    await instance.transferStar(toUser, differentTokenId, {from: fromUser});
    // 3. Verify the star owner changed.
    assert.notEqual(await instance.ownerOf.call(differentTokenId), fromUser);
    assert.equal(await instance.ownerOf.call(differentTokenId), toUser);
}).timeout(testTimeout);

it('lookUptokenIdToStarInfo test', async() => {
    let differentTokenId = 2099;
    let user = accounts[0];
    let starNameInput = "Stern";
    let instance = await StarNotary.deployed();
    // 1. create a Star with different tokenId
    await instance.createStar(starNameInput, differentTokenId, {from: user});
    // 2. Call your method lookUptokenIdToStarInfo
    let starNameOutput = await instance.lookUptokenIdToStarInfo(differentTokenId);
    // 3. Verify if you Star name is the same
    assert.equal(starNameInput, starNameOutput);
});