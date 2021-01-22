import React from 'react'
import { connect, localSort_types } from 'state'
import Post from 'pages/common/Post'
import Comment from 'pages/common/Comment'
import { withFetch } from 'pages/RevdditFetcher'
import { reversible, copyLink } from 'utils'
import {byScore, byDate, byNumComments, byControversiality,
        byNumReplies, bySubredditSubscribers} from 'data_processing/info'
import { byNumCrossposts } from 'data_processing/posts'
import Highlight from 'pages/common/Highlight'
import Pagination from 'components/Pagination'
import {useSort} from 'hooks/sort'

const sortFnMap = {
  [localSort_types.date]: byDate,
  [localSort_types.score]: byScore,
  [localSort_types.controversiality]: byControversiality,
  [localSort_types.num_comments]: byNumComments,
  [localSort_types.num_crossposts]: byNumCrossposts,
  [localSort_types.num_replies]: byNumReplies,
  [localSort_types.subreddit_subscribers]: bySubredditSubscribers,
}
const Info = (props) => {
  const { page_type, viewableItems, selections, summary, archiveDelayMsg,
          oldestTimestamp, newestTimestamp, global,
        } = props
  const {items, loading, localSort, localSortReverse} = global.state
  const noItemsFound = items.length === 0 && ! loading && window.location.search !== ''
  useSort(global, viewableItems, sortFnMap[localSort])

  const ids = viewableItems.map(o => o.name)
  const shareLink = page_type === 'search' ? (
    <div className="revddit-sharing">
      <a href={'/info?id='+ids.join(',')} onClick={(e) => copyLink(e, true)}>copy sharelink</a>
    </div>
  ) : ''

  let pagination = ''
  if (page_type === 'search') {
    pagination = <Pagination oldestTimestamp={oldestTimestamp} newestTimestamp={newestTimestamp}
                             bottom={true}/>
  }

  return (
    <div className='infopage'>
      {shareLink}
      {selections}
      {summary}
      <Highlight/>
      {archiveDelayMsg}
      {
        noItemsFound ?
        <p>No items found</p> :
        viewableItems.map(item => {
          if (item.name.slice(0,2) === 't3') {
            return <Post key={item.name} {...item} page_type={page_type} />
          } else {
            return <Comment key={item.name} {...item} page_type={page_type} />
          }
        })
      }
      {pagination}
    </div>
  )
}

export default connect(withFetch(Info))
