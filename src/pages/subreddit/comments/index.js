import React from 'react'
import { Link } from 'react-router-dom'
import { withRouter } from 'react-router'
import scrollToElement from 'scroll-to-element'
import {
  getRecentCommentsBySubreddit as getPushshiftCommentsBySubreddit
} from 'api/pushshift'
import { combinePushshiftAndRedditComments, getFullTitles } from 'dataProcessing'
import { connect, localSort_types, removedFilter_types } from 'state'
import Time from 'pages/common/Time'
import Comment from 'pages/common/Comment'
import Selections from 'pages/common/selections'
import ResultsSummary from 'pages/common/ResultsSummary'
import { REMOVAL_META, NOT_REMOVED, USER_REMOVED } from 'pages/common/RemovedBy'
import { getPrettyTimeLength } from 'utils'

const byScore = (a, b) => {
  return (b.score - a.score)
}
const byDate = (a, b) => {
  return (b.created_utc - a.created_utc)
}

const byControversiality1 = (a, b) => {
  let a_score_noneg = a.score < 0 ? 0 : a.score
  let b_score_noneg = b.score < 0 ? 0 : b.score
  return (a_score_noneg - b_score_noneg)
}
const byControversiality2 = (a, b) => {
  let a_score_abs = Math.abs(a.score)
  let b_score_abs = Math.abs(b.score)
  return (b.controversiality - a.controversiality) || (a_score_abs - b_score_abs)
}
const defaultN = 1000

class SubredditComments extends React.Component {
  state = {
    pushshiftComments: [],
    loadingComments: true
  }

  componentDidMount () {
    let { subreddit } = this.props.match.params
    document.title = `/r/${subreddit}/comments`
    this.props.global.setStateFromQueryParams(this.props.page_type,
                    new URLSearchParams(this.props.location.search))
    .then(result => {
      this.loadData()
    })
  }
  setBefore = (before, before_id, n) => {
    this.setState({pushshiftComments: []})
    this.props.global.upvoteRemovalRateHistory_update(before, before_id, n, this.props)
    .then(result => {
      this.loadData()
    })
  }
  loadData () {
    let { subreddit } = this.props.match.params
    this.props.global.setLoading('Loading comments from Pushshift...')
    const gs = this.props.global.state
    subreddit = subreddit.toLowerCase()
    // Get comment ids from pushshift
    getPushshiftCommentsBySubreddit(subreddit, gs.n, gs.before, gs.before_id)
    .then(pushshiftComments => {
      this.props.global.setLoading('Comparing comments to Reddit API...')
      const fullTitlePromise = getFullTitles(pushshiftComments)
      const combinePromise = combinePushshiftAndRedditComments(pushshiftComments)
      Promise.all([fullTitlePromise, combinePromise])
      .then(values => {
        const show_comments = []
        const full_titles = values[0]
        pushshiftComments.forEach(ps_comment => {
          if (full_titles && ps_comment.link_id in full_titles) {
            if ( ! (full_titles[ps_comment.link_id].whitelist_status == 'promo_adult_nsfw' &&
                     (ps_comment.removed || ps_comment.deleted))) {
              ps_comment.link_title = full_titles[ps_comment.link_id].title
              show_comments.push(ps_comment)
            }
          }
        })
        pushshiftComments = show_comments
        this.props.global.setSuccess()
        this.setState({
          pushshiftComments,
          loadingComments: false
        })
      })
    })
    .then(result => {
      this.jumpToHash()
    })
    .catch(this.props.global.setError)
  }

  jumpToHash () {
    const hash = this.props.history.location.hash;
    if (hash) {
      scrollToElement(hash, { offset: -10 });
    }
  }

  getVisibleItemsWithoutCategoryFilter() {
    const removedByFilterIsUnset = this.props.global.removedByFilterIsUnset()
    const visibleItems = []
    const gs = this.props.global.state
    this.state.pushshiftComments.forEach(item => {
      let itemIsOneOfSelectedRemovedBy = false
      if (gs.removedByFilter[USER_REMOVED] && item.deleted) {
        itemIsOneOfSelectedRemovedBy = true
      } else {
        for (let i = 0; i < Object.keys(REMOVAL_META).length; i++) {
          const type = Object.keys(REMOVAL_META)[i]
          if (gs.removedByFilter[type] && item.removedby && item.removedby === type) {
            itemIsOneOfSelectedRemovedBy = true
            break
          }
        }
      }

      if (
        (gs.removedFilter === removedFilter_types.all ||
          (
            gs.removedFilter === removedFilter_types.removed &&
            (item.deleted || item.removed || (item.removedby && item.removedby !== NOT_REMOVED))
          ) ||
          (gs.removedFilter === removedFilter_types.not_removed &&
            (! item.removed && item.removedby === NOT_REMOVED) )
        ) &&
        (removedByFilterIsUnset || itemIsOneOfSelectedRemovedBy)
      ) {
        visibleItems.push(item)
      }
    })
    return visibleItems
  }


  render () {
    const { subreddit } = this.props.match.params
    const removedFiltersAreUnset = this.props.global.removedFiltersAreUnset()
    const { pushshiftComments, loadingComments } = this.state
    const visibleItems = this.getVisibleItemsWithoutCategoryFilter()
    let category = 'link_title'
    let category_title = 'Post Title'
    let category_unique_field = 'link_id'
    if (subreddit.toLowerCase() === 'all') {
      category = 'subreddit'
      category_title = 'Subreddit'
      category_unique_field = 'subreddit'
    }
    let category_state = this.props.global.state['categoryFilter_'+category]
    const showAllCategories = category_state === 'all'
    const {localSort, localSortReverse} = this.props.global.state
    const gs = this.props.global.state

    const items_sorted = visibleItems


    if (localSort === localSort_types.date) {
      items_sorted.sort( byDate )
    } else if (localSort === localSort_types.score) {
      items_sorted.sort( byScore )
    } else if (localSort === localSort_types.controversiality1) {
      items_sorted.sort( byControversiality1 )
    } else if (localSort === localSort_types.controversiality2) {
      items_sorted.sort( byControversiality2 )
    }
    if (localSortReverse) {
      items_sorted.reverse()
    }

    return (
      <React.Fragment>
        {
          ! loadingComments &&
          <React.Fragment>
            <Selections page_type='subreddit_comments' visibleItems={visibleItems}
              allItems={pushshiftComments}
              category_type={category} category_title={category_title}
              category_unique_field={category_unique_field}
              setBefore={this.setBefore}/>
            <React.Fragment>
            {
              items_sorted.map(item => {
                let itemIsOneOfSelectedCategory = false
                if (category_state === item[category_unique_field]) {
                  itemIsOneOfSelectedCategory = true
                }
                if (showAllCategories || itemIsOneOfSelectedCategory) {
                  return <Comment
                    key={item.id}
                    {...item}
                    depth={0}
                  />
                }
              })
            }
            </React.Fragment>
          </React.Fragment>
        }
      </React.Fragment>
    )
  }
}

export default withRouter(connect(SubredditComments))
