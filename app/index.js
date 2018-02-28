const express = require('express')
const app = express()
const dbClient = require('../data/redis-client')
const cors = require('cors')
const binanceClient = require('../app/binance-client')

const updateInterval = 2000

binanceClient.setUpdateInterval(updateInterval)

app.use(cors())

app.get('/updateinterval', async (req, res) => {
  res.json({ milliseconds: updateInterval })
})

app.get('/tradingpairs', async (req, res) => {
  res.json(await dbClient.getJson('tradingpairs'))
})

module.exports = app
