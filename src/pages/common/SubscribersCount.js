import React from 'react'
import { prettyFormatBigNumber } from 'utils'

const SubscribersCount = ({subreddit_subscribers}) => {
  const summary_count = prettyFormatBigNumber(subreddit_subscribers)
  if (subreddit_subscribers !== undefined) {
    return <span title={summary_count+' subscribers'}>({summary_count})</span>
  }
  return null
}

export default SubscribersCount
