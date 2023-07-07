import React from 'react'
import { connect } from 'state'
import Comment from 'pages/common/Comment'
import {UserPageTip} from 'pages/common/Notice'
import { withFetch } from 'pages/RevdditFetcher'
import { getUrlWithTimestamp } from 'utils'
import Highlight from 'pages/common/Highlight'
import Pagination from 'components/Pagination'
import { ShareLink } from 'components/Misc'

const SubredditComments = (props) => {
  const { subreddit } = props.match.params
  const { page_type, viewableItems, selections, summary,
          notShownMsg, topNotice, global,
        } = props
  const {items, loading, localSort, hasVisitedUserPage,
        } = global.state
  const noItemsFound = items.length === 0 && ! loading

  const pagination = <Pagination {...{page_type}} bottom={true} subreddit={subreddit}/>

  return (
    <React.Fragment>
      <ShareLink href={getUrlWithTimestamp()} useHref={false}/>
      {selections}
      {summary}
      {! hasVisitedUserPage &&
        <UserPageTip/>
      }
      <Highlight/>
      {topNotice}
      {notShownMsg}
      {
        noItemsFound ?
        <p>No comments found</p> :
        viewableItems.map(item => {
          return <Comment
            key={item.id}
            {...item}
            depth={0}
            page_type={page_type}
          />
        })
      }
      {pagination}
    </React.Fragment>
  )
}

export default connect(withFetch(SubredditComments))
