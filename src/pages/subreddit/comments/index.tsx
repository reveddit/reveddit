import React from 'react'
import Comment from 'components/comment/Comment'
import { UserPageTip } from 'components/common/Notice'
import { withFetch } from 'components/RevdditFetcher'
import { getUrlWithTimestamp } from 'utils'
import Highlight from 'components/common/Highlight'
import Pagination from 'components/Pagination'
import { ShareLink } from 'components/ui/Links'

const SubredditComments = props => {
  const { subreddit } = props.match.params
  const {
    page_type,
    viewableItems,
    selections,
    summary,
    notShownMsg,
    topNotice,
    global,
  } = props
  const { items, loading, localSort, hasVisitedUserPage } = global.state
  const noItemsFound = items.length === 0 && !loading

  const pagination = (
    <Pagination bottom={true} subreddit={subreddit} />
  )

  return (
    <React.Fragment>
      <ShareLink href={getUrlWithTimestamp()} useHref={false} />
      {selections}
      {summary}
      {!hasVisitedUserPage && <UserPageTip />}
      <Highlight />
      {topNotice}
      {notShownMsg}
      {noItemsFound ? (
        <p>No comments found</p>
      ) : (
        viewableItems.map(item => {
          return (
            <Comment key={item.id} {...item} depth={0} />
          )
        })
      )}
      {pagination}
    </React.Fragment>
  )
}

export default withFetch(SubredditComments)
