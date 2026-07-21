const { redisClient } = require("../config/redis");

async function getBalanceCache(accountId) {

  const balance = await redisClient.get(`balance:${accountId}`);
    if (balance == null) {
        console.log('cache miss');
        return null
    }
    console.log('cache hit');
    return parseFloat(balance);
}

async function setBalanceCache(accountId, value) {

  await redisClient.set(`balance:${accountId}`, value.toString());
}

async function deleteCache(accountId) {
  await redisClient.del(`balance:${accountId}`);
}

module.exports = {
    getBalanceCache,
    setBalanceCache,
    deleteCache
}