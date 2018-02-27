const express = require('express')
const app = express()
const client = require('../data/redis-client')
const fetch = require('node-fetch')
const cors = require('cors')

app.use(cors())

let oldPrices = []

const storePrices = async () => {
  const res = await fetch('https://api.binance.com/api/v1/ticker/price')
  console.log('Status: ' + res.status)
  if (res.status === 429) {
    clearInterval(fetchPricesInteval)
    console.log("WARNING - Binance returned 429 (too many requests)!")
  }
  const json = await res.json()
  addPriceChangeProperty(json)
  client.setJson('prices', json)
  oldPrices = json
}

const fetchPricesInteval = setInterval(storePrices, 5000)

const addPriceChangeProperty = newPrices => {
  if (oldPrices.length - newPrices.length != 0) {
    newPrices.forEach(element => {
      element.change = 0
    })
    return
  }
  for (let i = 0; i < oldPrices.length; ++i) {
    if (newPrices[i].price > oldPrices[i].price) {
      newPrices[i].change = 1
    } else if (newPrices[i].price < oldPrices[i].price) {
      newPrices[i].change = -1
    } else {
      newPrices[i].change = 0
    }
  }
}


app.get('/prices', async (req, res) => {
  res.json(await client.getJson('prices'))
})

module.exports = app
