import React from 'react'
import { Link } from 'react-router-dom'
import Post from 'pages/common/Post'
import { withFetch } from 'pages/RevdditFetcher'
import { connect, localSort_types } from 'state'
import { byScore, byDate, byNumComments, byControversiality, byNumCrossposts } from 'data_processing/posts'
import { reversible, getUrlWithTimestamp, copyLink, PATH_STR_USER,
         PATH_STR_SUB,
} from 'utils'
import Highlight from 'pages/common/Highlight'
import Pagination from 'components/Pagination'
import Notice from 'pages/common/Notice'


class SubredditPosts extends React.Component {

  render () {
    const { subreddit } = this.props.match.params
    const { page_type, viewableItems, selections, summary, archiveDelayMsg,
            oldestTimestamp, newestTimestamp,
          } = this.props
    const {items, loading, localSort, localSortReverse,
           hasVisitedUserPage, hasVisitedTopRemovedPage,
          } = this.props.global.state
    const noItemsFound = items.length === 0 && ! loading

    const items_sorted = viewableItems
    if (localSort === localSort_types.date) {
      items_sorted.sort( reversible(byDate, localSortReverse) )
    } else if (localSort === localSort_types.num_comments) {
      items_sorted.sort( reversible(byNumComments, localSortReverse) )
    } else if (localSort === localSort_types.score) {
      items_sorted.sort( reversible(byScore, localSortReverse) )
    } else if (localSort === localSort_types.controversiality) {
      items_sorted.sort( reversible(byControversiality, localSortReverse) )
    } else if (localSort === localSort_types.num_crossposts) {
      items_sorted.sort( reversible(byNumCrossposts, localSortReverse) )
    }

    const pagination = <Pagination oldestTimestamp={oldestTimestamp} newestTimestamp={newestTimestamp}
                                   bottom={true} subreddit={subreddit}/>
    let instructionalNotice = ''
    if (! hasVisitedUserPage) {
      instructionalNotice =
        <Notice className='userpage-note' message={
          <>
            Check if you have any removed comments.
          </>
        } htmlLink={<Link to={PATH_STR_USER+'/'}>view my removed comments</Link>}
        />
    } else if (! hasVisitedTopRemovedPage) {
      instructionalNotice =
        <Notice className='top-removed-note' message={
          <>
            Check the archive for top removed content.
          </>
        } htmlLink={<a href={PATH_STR_SUB+`/${subreddit}/top/`}>show top removed content</a>}
        />
    }
    return (
      <React.Fragment>
        <div className="revddit-sharing">
          <a href={getUrlWithTimestamp()} onClick={copyLink}>copy sharelink</a>
        </div>
        {selections}
        {summary}
        {instructionalNotice}
        <Highlight/>
        {archiveDelayMsg}
        {
          noItemsFound ?
          <p>No posts found</p> :
          items_sorted.map(item => {
            return <Post key={item.id} {...item} />
          })
        }
        {pagination}
      </React.Fragment>
    )
  }
}

export default connect(withFetch(SubredditPosts))
