const client = require('../data/redis-client')

const rest = {}

// TODO: use redis list (so whole list can be retrieved)
// POST method
rest.post = async (key, json) => {
  const id = await client.incr(`${key}:id`)
  const ok = client.setJson(`${key}:${id}`, json)
  return ok ? id : null
}

// TODO: use redis list (so whole list can be retrieved)
// PUT method
rest.put = async (key, id, json) => {
  const ok = client.setJson(`${key}:${id}`, json)
  return ok ? id : null
}

// TODO: use redis list (so whole list can be retrieved)
// GET method with optional id param
rest.get = async (key, id) => {
  return id ? await client.getJson(`${key}:${id}`)
            : await client.getJson(key)
}

module.exports = rest
