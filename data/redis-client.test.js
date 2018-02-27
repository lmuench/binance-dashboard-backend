const should = require('chai').should()
const client = require('../data/redis-client')

describe('redis-client', () => {
  const generateRandomKey = () => (Math.random() + 1).toString(36).substring(2)
  const testKey = generateRandomKey()
  const originalJson = {
    number: 1.2345,
    string: 'hello',
    array: [1, 2, 3],
    object: {
      foo: 'bar',
      seven: 7
    }
  }

  afterEach(async () => {
    // clean up DB
    client.del(testKey)
    const deletedValue = await client.getJson(testKey)
    should.equal(deletedValue, null)
  })

  it('should store json objects and retrieve them unaltered', async () => {
    client.setJson(testKey, originalJson)
    const returnedJson = await client.getJson(testKey)
    returnedJson.should.deep.equal(originalJson)
  })

  describe('#getJson()', () => {
    it('should return null on a non-JSON-parsable value', async () => {
      client.set(testKey, 'foo')
      const returnedJson = await client.getJson(testKey)
      should.equal(returnedJson, null)
    })
  })
})
