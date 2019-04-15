import React from 'react'
import Post from 'pages/common/Post'
import { withFetch } from 'pages/RevdditFetcher'
import { connect, localSort_types } from 'state'

const byScore = (a, b) => {
  return (b.score - a.score) || (b.num_comments - a.num_comments)
}
const byDate = (a, b) => {
  return (b.created_utc - a.created_utc) || (b.num_comments - a.num_comments)
}
const byNumComments = (a, b) => {
  return (b.num_comments - a.num_comments) || (b.created_utc - a.created_utc)
}
const byControversiality = (a, b) => {
  return (a.score - b.score) || (b.num_comments - a.num_comments)
}

class SubredditPosts extends React.Component {
  render () {
    const { subreddit } = this.props.match.params
    const { items, loading, page_type, viewableItems } = this.props
    const {localSort, localSortReverse} = this.props.global.state
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
