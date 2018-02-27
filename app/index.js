const express = require('express')
const app = express()
const client = require('../data/redis-client')
const fetch = require('node-fetch')
const cors = require('cors')

app.use(cors())

let oldBtcPairs = []
let oldBtcUsdt = {}

const fetchPrices = async () => {
  const res = await fetch('https://api.binance.com/api/v3/ticker/price')
  console.log('Status: ' + res.status)
  if (res.status === 429) {
    clearInterval(fetchPricesInteval)
    console.log("WARNING - Binance returned 429 (too many requests)!")
  }
  const json = await res.json()
  const btcUsdt = json.find(coin => coin.symbol === 'BTCUSDT')
  const btcPairs = json.filter(coin => coin.symbol.endsWith('BTC'))
  addPriceChangeProperty(btcPairs)
  addUsdtPrice(btcPairs, btcUsdt.price)
  client.setJson('btcpairs', btcPairs)
  oldBtcPairs = btcPairs
  btcUsdt.change = btcUsdt.price.localeCompare(oldBtcUsdt.price)
  client.setJson('btcusdt', btcUsdt)
  oldBtcUsdt = btcUsdt
}

const fetchPricesInteval = setInterval(fetchPrices, 1000)

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


app.get('/btcpairs', async (req, res) => {
  res.json(await client.getJson('btcpairs'))
})

app.get('/btcusdt', async (req, res) => {
  res.json(await client.getJson('btcusdt'))
})

module.exports = app
