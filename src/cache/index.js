const Redis = require('ioredis')

class Cache {
  constructor() {
    this.redis = new Redis({
      host: process.env.REDIS_URL,
      port: process.env.REDIS_PORT,
      password: process.env.REDIS_PASSWORD,
    })
  }

  async get(key) {
    const value = await this.redis.get(key)
    return value ? JSON.parse(value) : null
  }

  set(key, value, expiration) {
    return this.redis.set(key, JSON.stringify(value), 'EX', expiration)
  }

  del(key) {
    return this.redis.del(key)
  }
}

module.exports = new Cache()
