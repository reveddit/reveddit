import React from 'react'
import { Link } from 'react-router-dom'
import Post from 'pages/common/Post'
import { withFetch } from 'pages/RevdditFetcher'
import { connect, localSort_types } from 'state'
import { byScore, byDate, byNumComments, byControversiality, byNumCrossposts } from 'data_processing/posts'
import { reversible, getUrlWithTimestamp, copyLink } from 'utils'
import Highlight from 'pages/common/Highlight'


class SubredditPosts extends React.Component {

  render () {
    const { subreddit } = this.props.match.params
    const { page_type, viewableItems, selections, archiveDelayMsg } = this.props
    const {items, loading, localSort, localSortReverse, hasVisitedUserPage} = this.props.global.state
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



    return (
      <React.Fragment>
        <div className="revddit-sharing">
          <a href={getUrlWithTimestamp()} onClick={copyLink}>copy sharelink</a>
        </div>
        {selections}
        {! hasVisitedUserPage &&
          <div className='notice-with-link userpage-note'>
            <div>{"Check if you have any removed comments."}</div>
            <Link to={'/user/'}>view my removed comments</Link>
          </div>
        }
        <Highlight/>
        {archiveDelayMsg}
        {
          noItemsFound ?
          <p>No posts found</p> :
          items_sorted.map(item => {
            return <Post key={item.id} {...item} />
          })
        }
      </React.Fragment>
    )
  }
}

export default connect(withFetch(SubredditPosts))
