const express = require('express')
const app = express()
const dbClient = require('../data/redis-client')
const cors = require('cors')
const exClient = require('../app/binance-client')

const updateInterval = 5000

exClient.setUpdateInterval(updateInterval)

app.use(cors())

app.get('/updateinterval', async (req, res) => {
  res.json({ milliseconds: updateInterval })
})

app.get('/btcpairs', async (req, res) => {
  res.json(await dbClient.getJson('btcpairs'))
})

app.get('/btcusdt', async (req, res) => {
  res.json(await dbClient.getJson('btcusdt'))
})

module.exports = app
