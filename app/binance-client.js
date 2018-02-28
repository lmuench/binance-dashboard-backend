const dbClient = require('../data/redis-client')
const fetch = require('node-fetch')

const client = {}  // exported by module
let oldPairs = {
  btc: [],
  eth: [],
  bnb: [],
  usdt: []
}
let updatePricesInteval = null

// exported by module
client.setUpdateInterval = ms => { 
  updatePricesInteval = setInterval(updatePrices, ms)
}

const updatePrices = async () => {
  const json = await fetchPrices()
  const pairs = extractPairs(json)

  addPriceChange(pairs.btc, oldPairs.btc)
  addPriceChange(pairs.eth, oldPairs.eth)
  addPriceChange(pairs.bnb, oldPairs.bnb)
  addPriceChange(pairs.usdt, oldPairs.usdt)

  const btcUsdtPrice = pairs.usdt.find(pair => pair.symbol.startsWith('BTC')).price
  const ethUsdtPrice = pairs.usdt.find(pair => pair.symbol.startsWith('ETH')).price
  const bnbUsdtPrice = pairs.usdt.find(pair => pair.symbol.startsWith('BNB')).price
  addUsdtPrice(pairs.btc, btcUsdtPrice)
  addUsdtPrice(pairs.eth, ethUsdtPrice)
  addUsdtPrice(pairs.bnb, bnbUsdtPrice)

  dbClient.setJson('tradingpairs', pairs)
  oldPairs = pairs
}

const fetchPrices = async () => {
  const res = await fetch('https://api.binance.com/api/v3/ticker/price')
  console.log('Status: ' + res.status)
  if (res.status === 429) {
    clearInterval(updatePricesInteval)
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

const addPriceChange = (newPairs, oldPairs) => {
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

const addUsdtPrice = (pairs, usdtPrice) => {
  pairs.forEach(coin => {
    coin.usdt = (coin.price * usdtPrice).toString() // TODO: do .toString() client-side
  })
}

module.exports = client