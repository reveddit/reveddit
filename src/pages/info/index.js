import React from 'react'
import { connect, localSort_types } from 'state'
import Post from 'pages/common/Post'
import Comment from 'pages/common/Comment'
import { withFetch } from 'pages/RevdditFetcher'
import { reversible } from 'utils'
import Highlight from 'pages/common/Highlight'
import Pagination from 'components/Pagination'
import { ShareLink } from 'components/Misc'

const Info = (props) => {
  const { page_type, viewableItems, selections, summary, archiveDelayMsg,
          oldestTimestamp, newestTimestamp, global,
        } = props
  const {items, loading, localSort, localSortReverse} = global.state
  const noItemsFound = items.length === 0 && ! loading && window.location.search !== ''

  const ids = viewableItems.map(o => o.name)
  const shareLink = ids.length && page_type === 'search' ? (
    <ShareLink href={'/info?id='+ids.join(',')}/>
  ) : ''

  let pagination = ''
  if (page_type === 'search') {
    pagination = <Pagination {...{page_type, oldestTimestamp, newestTimestamp}}
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
