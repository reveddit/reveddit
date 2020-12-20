import React from 'react'
import { withFetch } from 'pages/RevdditFetcher'
import { connect } from 'state'
import Preview from 'pages/common/Preview'
import { getAggregationsPeriodURL } from 'api/reveddit'
import Notice from 'pages/common/Notice'
import { urr_help } from 'pages/common/selections/UpvoteRemovalRateHistory'
import { QuestionMarkModal } from 'components/Misc'


const Aggregations = ({global, selections, summary, viewableItems, ...props}) => {
  const {content: type, n, sort} = global.state
  const {subreddit} = props.match.params
  const reddit_content_type = type === 'comments' ? '1' : '3'
  return (
    <>
      {selections}
      {summary}
      <Notice title={`top removed ${type}`} message={
        <>
          This page shows highly upvoted removed {type} for the given subreddit. <QuestionMarkModal modalContent={{content: urr_help}} text='more info'/>
        </>
      }/>
      {viewableItems.map((item, i) => {
        const url = getAggregationsPeriodURL({
          subreddit,
          type,
          numGraphPoints: n,
          sort,
          last_created_utc: item.last_created_utc,
          last_id: item.last_id,
          limit: item.total_items,
        })
        return <Preview key={i} type={type} subreddit={subreddit}
                        periodUrl={url+`#t${reddit_content_type}_${item.id_of_max_pos_removed_item}`}
                        {...item}/>
      })}
    </>
  )
}

export default connect(withFetch(Aggregations))
