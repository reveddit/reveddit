import React from 'react'
import { withRouter } from 'react-router';
import { connect } from '../../../state'

const paramKey = 'subreddit'

class SubredditFilter extends React.Component {

  componentDidMount() {
    const queryParams = new URLSearchParams(this.props.location.search)

    if (queryParams.get(paramKey)) {
      this.props.global.setSubredditFilter(queryParams.get(paramKey))
    }
  }

  updateStateAndURL = (event) => {
    const subreddit = event.target.value
    this.props.global.setSubredditFilter(subreddit)
    const queryParams = new URLSearchParams(this.props.location.search)
    if (subreddit !== 'all') {
      queryParams.set(paramKey, subreddit)
    } else {
      queryParams.delete(paramKey)
    }
    let to = `${this.props.location.pathname}?${queryParams.toString()}`
    this.props.history.push(to)
  }

  render() {
    const subreddit_visible_counts = {}
    const subreddit_counts = {}
    this.props.allItems.forEach(item => {
      subreddit_visible_counts[item.subreddit] = 0
      if (item.subreddit in subreddit_counts) {
        subreddit_counts[item.subreddit] += 1
      } else {
        subreddit_counts[item.subreddit] = 1
      }
    })
    this.props.visibleItems.forEach(item => {
      subreddit_visible_counts[item.subreddit] += 1
    })
    const subs_ordered = Object.keys(subreddit_visible_counts).sort((a,b) => {
      let alpha = a.toLowerCase() < b.toLowerCase() ? -1 : 1
      return (subreddit_visible_counts[b] - subreddit_visible_counts[a]) || alpha
    })
    let subredditFilter = this.props.global.state.subredditFilter
    if (! subredditFilter) {
      subredditFilter = 'all'
    }

    return (
      <div className={`subredditFilter selection filter ${subredditFilter !== 'all'? 'set': ''}`}>
        <div className='title'>Subreddit</div>
        <select value={subredditFilter} onChange={this.updateStateAndURL}>
          <option key='all' value='all'>all</option>
          {
            subs_ordered.map(subreddit => {
              return (
                <option key={subreddit} value={subreddit}>
                  {subreddit} ({`${subreddit_visible_counts[subreddit]} / ${subreddit_counts[subreddit]}`})
                </option>
              )
            })
          }
        </select>
      </div>
    )
  }
}

export default withRouter(connect(SubredditFilter))
