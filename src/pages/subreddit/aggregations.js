import React from 'react'
import { withFetch } from 'pages/RevdditFetcher'
import { connect } from 'state'
import CommentPreview from 'pages/common/CommentPreview'
import PostPreview from 'pages/common/PostPreview'
import { getAggregationsPeriodURL } from 'api/reveddit'

const Aggregations = ({global, ...props}) => {
  const {items, content: type, n, sort} = global.state
  const {subreddit} = props.match.params
  const Preview = type === 'comments' ? CommentPreview : PostPreview
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
        return <a key={i} className='no_underline' href={url}><Preview {...item}/></a>
      })}
    </>
  )
}

export default connect(withFetch(Aggregations))
