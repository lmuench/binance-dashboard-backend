const dbClient = require('../data/redis-client')
const fetch = require('node-fetch')

const binanceClient = {}  // exported by module

let oldPairs = {
  btc: [],
  eth: [],
  bnb: [],
  usdt: []
}

let updateInterval = null

// exported by module
binanceClient.setUpdateInterval = ms => { 
  updateInterval = setInterval(update, ms)
  binanceClient.updateIntervalInSeconds = Math.round(ms / 1000)
}

const update = async () => {
  const json = await fetchPrices()
  const pairs = extractPairs(json)
  
  addLastPriceChanges(pairs)
  addUsdtPrices(pairs)
  const id = await dbClient.incr('tradingpairs:id')
  await addHourlyChanges(pairs, id)
  
  oldPairs = pairs
  dbClient.setJson('tradingpairs:' + id, pairs)
}

const fetchPrices = async () => {
  const res = await fetch('https://api.binance.com/api/v3/ticker/price')
  console.log('Status: ' + res.status)
  if (res.status === 429) {
    clearInterval(updateInterval)
    console.log("WARNING - Binance returned 429 (too many requests)!")
  }
  const json = await res.json()
  return json
}

const extractPairs = json => {
  const pairs = {}
  pairs.btc = json.filter(coin => coin.symbol.endsWith('BTC'))
  pairs.eth = json.filter(coin => coin.symbol.endsWith('ETH'))
  pairs.bnb = json.filter(coin => coin.symbol.endsWith('BNB'))
  pairs.usdt = json.filter(coin => coin.symbol.endsWith('USDT'))
  return pairs
}

const addLastPriceChanges = newPairs => {
  addLastPriceChange(newPairs.btc, oldPairs.btc)
  addLastPriceChange(newPairs.eth, oldPairs.eth)
  addLastPriceChange(newPairs.bnb, oldPairs.bnb)
  addLastPriceChange(newPairs.usdt, oldPairs.usdt)
}

const addLastPriceChange = (newPairs, oldPairs) => {
  if (oldPairs.length != newPairs.length) {
    newPairs.forEach(coin => {
      coin.change = 0
    })
    return
  }
  for (let i = 0; i < newPairs.length; ++i) {
    newPairs[i].change = newPairs[i].price.localeCompare(oldPairs[i].price)
  }
}

const addUsdtPrices = pairs => {
  const btcUsdtPrice = pairs.usdt.find(pair => pair.symbol.startsWith('BTC')).price
  const ethUsdtPrice = pairs.usdt.find(pair => pair.symbol.startsWith('ETH')).price
  const bnbUsdtPrice = pairs.usdt.find(pair => pair.symbol.startsWith('BNB')).price
  addUsdtPrice(pairs.btc, btcUsdtPrice)
  addUsdtPrice(pairs.eth, ethUsdtPrice)
  addUsdtPrice(pairs.bnb, bnbUsdtPrice)
}

const addUsdtPrice = (pairs, usdtPrice) => {
  pairs.forEach(coin => {
    coin.usdt = Number(coin.price * usdtPrice).toFixed(2)
  })
}

const addHourlyChanges = async (newPairs, newId) => {
  const hourOldId = Math.round(newId - 3600 / binanceClient.updateIntervalInSeconds)

  if (hourOldId < 0) {
    console.log('No 1-hour-old data exists yet.')
    return
  }

  const oldPairs = await dbClient.getJson('tradingpairs:' + hourOldId)
  if (oldPairs === null) {
    console.log('No 1-hour-old data found.')
    return
  }

  addHourlyChange(newPairs.btc, oldPairs.btc, 'price')
  addHourlyChange(newPairs.eth, oldPairs.eth, 'price')
  addHourlyChange(newPairs.bnb, oldPairs.bnb, 'price')
  addHourlyChange(newPairs.usdt, oldPairs.usdt, 'price')

  addHourlyChange(newPairs.btc, oldPairs.btc, 'usdt')
  addHourlyChange(newPairs.eth, oldPairs.eth, 'usdt')
  addHourlyChange(newPairs.bnb, oldPairs.bnb, 'usdt')
}

const addHourlyChange = (newPairs, oldPairs, type) => {
  
  if (oldPairs.length != newPairs.length) return

  for (let i = 0; i < newPairs.length; ++i) {
    newPairs[i][type + 'HourlyChange'] = 
      Number(newPairs[i][type] / oldPairs[i][type] * 100 - 100).toFixed(2)
  }
}

module.exports = binanceClient