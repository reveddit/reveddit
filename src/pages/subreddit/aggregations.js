import React from 'react'
import { withFetch } from 'pages/RevdditFetcher'
import { connect } from 'state'
import Preview from 'pages/common/Preview'
import { getAggregationsPeriodURL } from 'api/reveddit'

const Aggregations = ({global, ...props}) => {
  const {items, content: type, n, sort} = global.state
  const {subreddit} = props.match.params
  return (
    <>
      {items.map((item, i) => {
        const url = getAggregationsPeriodURL({
          subreddit,
          type,
          numGraphPoints: n,
          sort,
          last_created_utc: item.last_created_utc,
          last_id: item.last_id,
          limit: item.total_items,
        })
        return <Preview key={i} type={type} subreddit={subreddit} periodUrl={url} {...item}/>
      })}
    </>
  )
}

export default connect(withFetch(Aggregations))
