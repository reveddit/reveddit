import React from 'react'
import { Link } from 'react-router-dom'
import { connect, item_filter } from '../../state'
import { withRouter } from 'react-router';
import { REMOVAL_META, AUTOMOD_REMOVED, AUTOMOD_REMOVED_MOD_APPROVED, MOD_OR_AUTOMOD_REMOVED, UNKNOWN_REMOVED } from '../common/RemovedBy'


class Selections extends React.Component {
  isChecked(filterType) {
    return this.props.global.state.userPageItemFilter === filterType
  }
  set_itemFilter(event) {
    this.props.global.setItemFilter(event.target.value)
    const queryParams = new URLSearchParams(this.props.location.search)
    if (event.target.value === item_filter.all) {
      queryParams.set('removal_status', 'all')
    } else if (event.target.value === item_filter.not_removed) {
      queryParams.set('removal_status', 'not_removed')
    } else {
      queryParams.delete('removal_status')
    }
    let to = `${this.props.location.pathname}?${queryParams.toString()}`
    this.props.history.push(to)
  }
  set_removedByFilter(event) {
    this.props.global.setRemovedByFilter(event.target.value, event.target.checked)
    // TODO: Change query params based on checked values
    const queryParams = new URLSearchParams(this.props.location.search)
    let removedby_str = queryParams.get('removedby')
    if (! removedby_str) {
      removedby_str = ''
    }
    const removedby_settings = {}
    removedby_str.split(',').forEach(type => {
      if (type.trim()) {
        removedby_settings[type.trim()] = true
      }
    })
    if (event.target.checked) {
      removedby_settings[event.target.value] = true
    } else {
      delete removedby_settings[event.target.value]
    }

    removedby_str = Object.keys(removedby_settings).join()
    if (removedby_str) {
      queryParams.set('removedby', removedby_str)
    } else {
      queryParams.delete('removedby')
    }
    let to = `${this.props.location.pathname}?${queryParams.toString()}`
    this.props.history.push(to)
  }
  set_subredditFilter(event) {
    const subreddit = event.target.value
    this.props.global.setUserSubredditFilter(subreddit)
    const queryParams = new URLSearchParams(this.props.location.search)
    if (subreddit !== 'all') {
      queryParams.set('subreddit', subreddit)
    } else {
      queryParams.delete('subreddit')
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
    const userPageItemFilter = this.props.global.state.userPageItemFilter
    const userPageRemovedByFilter = this.props.global.state.userPageRemovedByFilter
    let userSubredditFilter = this.props.global.state.userSubredditFilter
    if (! userSubredditFilter) {
      userSubredditFilter = 'all'
    }

    return (
      <div className='selections'>
        <div className={`removalStatusFilter filter ${userPageItemFilter !== item_filter.all ? 'set': ''}`}>
          <div className='title'>Removal Status</div>
          <label>
            <input name='item_filter' type='radio' value={item_filter.all}
              checked={this.isChecked(item_filter.all)} onChange={this.set_itemFilter.bind(this)}/>
            all
          </label>
          <label>
            <input name='item_filter' type='radio' value={item_filter.removed}
              checked={this.isChecked(item_filter.removed)} onChange={this.set_itemFilter.bind(this)}/>
            removed
          </label>
          <label>
            <input name='item_filter' type='radio' value={item_filter.not_removed}
              checked={this.isChecked(item_filter.not_removed)} onChange={this.set_itemFilter.bind(this)}/>
            not removed
          </label>
        </div>
        <div className={`removedbyFilter filter ${Object.keys(userPageRemovedByFilter).length !== 0 ? 'set': ''}`}>
          <div className='title'>Removed By</div>
          {
            Object.keys(REMOVAL_META).map(type => {
              return (
                <div key={type}>
                  <label title={REMOVAL_META[type].desc}>
                    <input id={type} type='checkbox' checked={userPageRemovedByFilter[type] !== undefined} value={type} onChange={this.set_removedByFilter.bind(this)}/>
                    {REMOVAL_META[type].filter_text}
                  </label>
                </div>
              )
            })
          }
        </div>
        <div className={`subredditFilter filter ${userSubredditFilter !== 'all'? 'set': ''}`}>
          <div className='title'>Subreddit</div>
          <select value={userSubredditFilter} onChange={this.set_subredditFilter.bind(this)}>
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
      </div>
    )
  }
}

export default withRouter(connect(Selections))
