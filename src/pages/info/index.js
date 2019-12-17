import React from 'react'
import { connect, localSort_types } from 'state'
import Post from 'pages/common/Post'
import Comment from 'pages/common/Comment'
import { withFetch } from 'pages/RevdditFetcher'
import { reversible, copyLink } from 'utils'
import {byScore, byDate, byNumComments, byControversiality} from 'data_processing/info'
import Highlight from 'pages/common/Highlight'

export class Info extends React.Component {

  render() {
    const { page_type, viewableItems, selections } = this.props
    const {items, loading, localSort, localSortReverse} = this.props.global.state
    const noItemsFound = items.length === 0 && ! loading
    const items_sorted = viewableItems
    if (localSort === localSort_types.date) {
      items_sorted.sort( reversible(byDate, localSortReverse) )
    } else if (localSort === localSort_types.score) {
      items_sorted.sort( reversible(byScore, localSortReverse) )
    } else if (localSort === localSort_types.controversiality) {
      items_sorted.sort( reversible(byControversiality, localSortReverse) )
    } else if (localSort === localSort_types.num_comments) {
      items_sorted.sort( reversible(byNumComments, localSortReverse) )
    }
    const ids = items_sorted.map(o => o.name)
    const shareLink = '/info?id='+ids.join(',')

    return (
      <div className='infopage'>
        <div className="revddit-sharing">
          <a href={shareLink} onClick={copyLink}>copy sharelink</a>
        </div>
        {selections}
        <Highlight/>
        {
          noItemsFound ?
          <p>No items found</p> :
          items_sorted.map(item => {
            if (item.name.slice(0,2) === 't3') {
              return <Post key={item.name} {...item} />
            } else {
              return <Comment key={item.name} {...item} />
            }
          })
        }
      </div>
    )

  }
}

export default connect(withFetch(Info))
