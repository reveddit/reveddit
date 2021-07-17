import Bottleneck from "bottleneck"

export const redditLimiter = new Bottleneck({
  reservoir: 30, // 30 requests per minute for add_user calls in threads should keep api usage under 60 requests/minute
  reservoirRefreshAmount: 30,
  reservoirRefreshInterval: 60 * 1000, // ms, must be divisible by 250
  maxConcurrent: 10,
})
