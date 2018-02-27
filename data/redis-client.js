const redis = require('redis')
const redisClient = redis.createClient()
const { promisify } = require('util')
const getAsync = promisify(redisClient.get).bind(redisClient)
const incrAsync = promisify(redisClient.incr).bind(redisClient)

const client = {}

// deletes value
client.del = key => {
  redisClient.del(key)
}

// stores value
client.set = (key, value) => {
  redisClient.set(key, value)
}

// returns value
client.get = async key => {
  return await getAsync(key)
}

// stringifies and stores json
// returns false if json param is null or not an object
client.setJson = (key, json) => {
  if (json === null || typeof json !== 'object') return false
  const stringifiedJson = JSON.stringify(json)
  client.set(key, stringifiedJson)
  return true
}

// returns json or null if value is not parsable
client.getJson = async key => {
  const stringifiedJson = await client.get(key)
  try {
    const json = JSON.parse(stringifiedJson)
    return json
  } catch (e) {
    return null
  }
}

// returns incremented counter or creates it and returns 0
client.incr = async key => {
  return await incrAsync(key)
}

module.exports = client
