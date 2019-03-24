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
import { REMOVAL_META, NOT_REMOVED } from 'pages/common/RemovedBy'

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

class SubredditComments extends React.Component {
  state = {
    pushshiftComments: [],
    loadingComments: true,
    n: 1000
  }

  componentDidMount () {
    let { subreddit } = this.props.match.params
    this.props.global.setLoading('Loading comments from Pushshift...')
    document.title = `/r/${subreddit}/comments`
    const queryParams = new URLSearchParams(this.props.location.search)
    const paramValueN = queryParams.get('n')
    let n = this.state.n
    const maxN = 60000
    if (paramValueN) {
      if (paramValueN > maxN) {
        n = maxN
      } else {
        n = paramValueN
      }
    }
    const paramValueBefore = queryParams.get('before')
    let before = ''
    if (paramValueBefore) {
      before = paramValueBefore
    }
    const paramValueBeforeID = queryParams.get('before_id')
    let before_id = ''
    if (paramValueBeforeID) {
      before_id = paramValueBeforeID
    }

    subreddit = subreddit.toLowerCase()
    // Get comment ids from pushshift
    getPushshiftCommentsBySubreddit(subreddit, n, before, before_id)
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
    this.state.pushshiftComments.forEach(item => {
      let itemIsOneOfSelectedRemovedBy = false
      Object.keys(REMOVAL_META).forEach(type => {
        if (this.props.global.state.removedByFilter[type] && item.removedby && item.removedby === type) {
          itemIsOneOfSelectedRemovedBy = true
        }
      })
      if (
        (this.props.global.state.removedFilter === removedFilter_types.all ||
          (
            this.props.global.state.removedFilter === removedFilter_types.removed &&
            (item.deleted || item.removed || (item.removedby && item.removedby !== NOT_REMOVED))
          ) ||
          (this.props.global.state.removedFilter === removedFilter_types.not_removed &&
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
    const { pushshiftComments, loadingComments, n } = this.state
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
    if (this.props.global.state.localSortReverse) {
      items_sorted.reverse()
    }

    let lastTimeLoaded = ''

    if (pushshiftComments.length) {
      let oldest_time = 99999999999
      pushshiftComments.forEach(item => {
        if (item.created_utc < oldest_time) {
          oldest_time = item.created_utc
        }
      })
      let num_showing = visibleItems.length.toLocaleString()
      if (! showAllCategories) {
        num_showing = (visibleItems.filter(item =>
          item[category] === category_state)
          .length)
      }
      lastTimeLoaded = (
        <React.Fragment>
          <div className='non-item text'>since <Time created_utc={oldest_time} /></div>
          <div className='non-item text'>{num_showing} of {pushshiftComments.length.toLocaleString()} comments</div>
        </React.Fragment>
      )
    }


    return (
      <React.Fragment>
        {
          ! loadingComments &&
          <React.Fragment>
            <Selections page_type='subreddit_comments' visibleItems={visibleItems}
              allItems={this.state.pushshiftComments}
              category_type={category} category_title={category_title}
              category_unique_field={category_unique_field}/>
            {lastTimeLoaded}
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
