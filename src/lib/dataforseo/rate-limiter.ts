class RateLimiter {
  private tokens: number
  private lastRefill: number
  private readonly maxTokens: number
  private readonly refillRate: number // tokens per ms

  constructor(requestsPerMinute = 50) {
    this.maxTokens = requestsPerMinute
    this.tokens = requestsPerMinute
    this.lastRefill = Date.now()
    this.refillRate = requestsPerMinute / 60000
  }

  async acquire(): Promise<void> {
    this.refill()
    if (this.tokens < 1) {
      const waitMs = (1 - this.tokens) / this.refillRate
      await new Promise((r) => setTimeout(r, Math.ceil(waitMs)))
      this.refill()
    }
    this.tokens -= 1
  }

  private refill() {
    const now = Date.now()
    const elapsed = now - this.lastRefill
    this.tokens = Math.min(this.maxTokens, this.tokens + elapsed * this.refillRate)
    this.lastRefill = now
  }
}

// Singleton — safe because Vercel Cron runs as a single serverless invocation
export const dataForSEORateLimiter = new RateLimiter(50)
