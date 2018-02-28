const dbClient = require('../data/redis-client')
const fetch = require('node-fetch')

const client = {}

let oldBtcPairs = []
let oldBtcUsdt = {}

// let counter = 0 // TODO: store symbols + prices only with incrementing index every 60 seconds, overwriting every 24 hours

// store symbols seperately and only send the requested ones?

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

const processBtcUsdt = json => {
  const btcUsdt = json.find(coin => coin.symbol === 'BTCUSDT')
  btcUsdt.change = btcUsdt.price.localeCompare(oldBtcUsdt.price)
  return btcUsdt
}

const processBtcPairs = (json, btcUsdtPrice) => {
  const btcPairs = json.filter(coin => coin.symbol.endsWith('BTC'))
  addPriceChangeProperty(btcPairs)
  addUsdtPrice(btcPairs, btcUsdtPrice)
  return btcPairs

}

const updatePrices = async () => {
  const json = await fetchPrices()
  const btcUsdt = processBtcUsdt(json)
  oldBtcUsdt = btcUsdt
  dbClient.setJson('btcusdt', btcUsdt)
  const btcPairs = processBtcPairs(json, btcUsdt.price)
  oldBtcPairs = btcPairs
  dbClient.setJson('btcpairs', btcPairs)
}


const addPriceChangeProperty = newBtcPairs => {
  if (oldBtcPairs.length != newBtcPairs.length) {
    newBtcPairs.forEach(coin => {
      coin.change = 0
    })
    return
  }
  for (let i = 0; i < newBtcPairs.length; ++i) {
    newBtcPairs[i].change = newBtcPairs[i].price.localeCompare(oldBtcPairs[i].price)
  }
}

const addUsdtPrice = (btcPairs, btcUsdtPrice) => {
  btcPairs.forEach(coin => {
    coin.usdt = (coin.price * btcUsdtPrice).toString()
  })
}

let updatePricesInteval = null

client.setUpdateInterval = ms => {
  updatePricesInteval = setInterval(updatePrices, ms)
}

module.exports = client