const express = require('express')
const app = express()
const client = require('../data/redis-client')
const cors = require('cors')
const setUpdatePricesIntervalInSeconds = require('./update-prices')

setUpdatePricesIntervalInSeconds(1)

app.use(cors())

app.get('/btcpairs', async (req, res) => {
  res.json(await client.getJson('btcpairs'))
})

app.get('/btcusdt', async (req, res) => {
  res.json(await client.getJson('btcusdt'))
})

module.exports = app
