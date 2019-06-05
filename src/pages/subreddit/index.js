import React from 'react'
import Post from 'pages/common/Post'
import { withFetch } from 'pages/RevdditFetcher'
import { connect, localSort_types } from 'state'
import { byScore, byDate, byNumComments, byControversiality } from 'data_processing/posts'

class SubredditPosts extends React.Component {
  render () {
    const { subreddit } = this.props.match.params
    const { page_type, viewableItems, selections } = this.props
    const {items, loading, localSort, localSortReverse} = this.props.global.state
    const noItemsFound = items.length === 0 && ! loading

    const items_sorted = viewableItems

    if (localSort === localSort_types.date) {
      items_sorted.sort( byDate )
    } else if (localSort === localSort_types.num_comments) {
      items_sorted.sort( byNumComments )
    } else if (localSort === localSort_types.score) {
      items_sorted.sort( byScore )
    } else if (localSort === localSort_types.controversiality) {
      items_sorted.sort( byControversiality )
    }
    if (this.props.global.state.localSortReverse) {
      items_sorted.reverse()
    }

    return (
      <React.Fragment>
        {selections}
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
