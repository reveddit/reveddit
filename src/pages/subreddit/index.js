import React from 'react'
import { Link } from 'react-router-dom'
import scrollToElement from 'scroll-to-element'
import { getRemovedPostIDs } from '../../api/removeddit'
import { getRecentPostsBySubreddit } from '../../api/pushshift'
import { getPosts, getItems } from '../../api/reddit'
import Post from '../common/Post'
import {connect, removedFilter_types, localSort_types} from '../../state'
import { itemIsRemovedOrDeleted, postIsDeleted } from '../../utils'
import Time from '../common/Time'
import { REMOVAL_META, AUTOMOD_REMOVED, AUTOMOD_REMOVED_MOD_APPROVED, MOD_OR_AUTOMOD_REMOVED, UNKNOWN_REMOVED, NOT_REMOVED } from '../common/RemovedBy'
import RemovedFilter from '../common/selections/RemovedFilter'
import RemovedByFilter from '../common/selections/RemovedByFilter'
import LocalSort from '../common/selections/LocalSort'

var numDeletedNotShown = 0

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


class Subreddit extends React.Component {
  state = {
    posts: [],
    loading: true,
    n: 1000
  }

  componentDidMount () {
    const { subreddit = 'all' } = this.props.match.params
    this.getRemovedPosts(subreddit)
  }

  // Check if the subreddit has changed in the url, and fetch posts accordingly
  componentDidUpdate (prevProps) {
    const { subreddit: newSubreddit = 'all' } = this.props.match.params
    const { subreddit = 'all' } = prevProps.match.params

    if (subreddit !== newSubreddit) {
      this.getRemovedPosts(newSubreddit)
    }
  }
  jumpToHash () {
    const hash = this.props.history.location.hash;
    if (hash) {
      scrollToElement(hash, { offset: -10 });
    }
  }
  // Download post IDs from removeddit API, then post info from reddit API
  getRemovedPosts (subreddit) {
    document.title = `/r/${subreddit}`
    this.setState({ posts: [], loading: true })
    this.props.global.setLoading('Loading removed posts...')
    subreddit = subreddit.toLowerCase()
    const n = 1000
    this.setState({n: n})
    if (subreddit === 'all') {
      getRemovedPostIDs(subreddit)
      .then(postIDs => getPosts(postIDs))
      .then(posts => {
        posts.forEach(post => {
          post.selftext = ''
          if (postIsDeleted(post)) {
            post.deleted = true
          } else {
            post.removed = true
          }
        })
        this.setState({ posts, loading: false }, this.jumpToHash)
        this.props.global.setSuccess()
      })
      .catch(this.props.global.setError)
    } else {
      getRecentPostsBySubreddit(subreddit, n)
      .then(posts_pushshift => {
        if (posts_pushshift.length < this.state.n) {
          this.setState({n: posts_pushshift.length})
        }
        const ids = []
        const posts_pushshift_lookup = {}
        posts_pushshift.forEach(post => {
          ids.push(post.name)
          posts_pushshift_lookup[post.id] = post
        })

        getItems(ids)
        .then(posts_reddit => {
          const show_posts = []
          posts_reddit.forEach(post => {
            post.selftext = ''
            const ps_item = posts_pushshift_lookup[post.id]
            const retrievalLatency = ps_item.retrieved_on-ps_item.created_utc
            if (itemIsRemovedOrDeleted(post)) {
              if (postIsDeleted(post)) {
                if (post.num_comments > 0) {
                  post.deleted = true
                  show_posts.push(post)
                } else {
                  // not showing deleted posts with 0 comments
                  numDeletedNotShown += 1
                }
              } else {
                post.removed = true
                if (! ps_item.is_crosspostable) {
                  if (retrievalLatency <= 5) {
                    post.removedby = AUTOMOD_REMOVED
                  } else {
                    post.removedby = UNKNOWN_REMOVED
                  }
                } else {
                  post.removedby = MOD_OR_AUTOMOD_REMOVED
                }
                show_posts.push(post)
              }
            } else {
              // not-removed posts
              if (! ps_item.is_crosspostable && retrievalLatency <= 5) {
                post.removedby = AUTOMOD_REMOVED_MOD_APPROVED
                //show_posts.push(post)
              } else {
                post.removedby = NOT_REMOVED
              }
              show_posts.push(post)
            }
          })

          return show_posts
        })
        .then(posts => {
          this.setState({ posts: posts, loading: false }, this.jumpToHash)
          this.props.global.setSuccess()
        })
      })
    }
  }

  render () {
    const { subreddit = 'all' } = this.props.match.params
    const removedByFilterIsUnset = this.props.global.removedByFilterIsUnset()
    const localSort = this.props.global.state.localSort
    const noPostsFound = this.state.posts.length === 0 && !this.state.loading
    let lastTimeLoaded = ''
    let numPostsTitle = ''
    if (numDeletedNotShown) {
      numPostsTitle = `${numDeletedNotShown} user-deleted posts that have no comments are not shown`
    }

    const posts_sorted = this.state.posts
    if (localSort === localSort_types.date) {
      posts_sorted.sort( byDate )
    } else if (localSort === localSort_types.num_comments) {
      posts_sorted.sort( byNumComments )
    } else if (localSort === localSort_types.score) {
      posts_sorted.sort( byScore )
    } else if (localSort === localSort_types.controversiality) {
      posts_sorted.sort( byControversiality )
    }
    if (this.props.global.state.localSortReverse) {
      posts_sorted.reverse()
    }

    const visible = []
    posts_sorted.forEach(post => {
      let itemIsOneOfSelectedRemovedBy = false
      Object.keys(REMOVAL_META).forEach(type => {
        if (this.props.global.state.removedByFilter[type] && post.removedby && post.removedby === type) {
          itemIsOneOfSelectedRemovedBy = true
        }
      })
      if (
        (this.props.global.state.removedFilter === removedFilter_types.all ||
          (
            this.props.global.state.removedFilter === removedFilter_types.removed &&
            (post.deleted || post.removed || (post.removedby && post.removedby !== NOT_REMOVED))
          ) ||
          (this.props.global.state.removedFilter === removedFilter_types.not_removed &&
            (! post.removed && post.removedby === NOT_REMOVED) )
        ) &&
        (removedByFilterIsUnset || itemIsOneOfSelectedRemovedBy)
      ) {
        visible.push(post)
      }
    })


    if (this.state.posts.length) {
      let oldest_time = 99999999999
      this.state.posts.forEach(post => {
        if (post.created_utc < oldest_time) {
          oldest_time = post.created_utc
        }
      })
      lastTimeLoaded = (
        <React.Fragment>
          <div className='non-item text'>since <Time created_utc={oldest_time} /></div>
          {subreddit !== 'all' ?
            <React.Fragment>
              <div className='non-item text' title={numPostsTitle}>{visible.length.toLocaleString()} of {this.state.n.toLocaleString()} posts</div>
            </React.Fragment>
          : ''}
        </React.Fragment>
      )
    }



    return (
      <React.Fragment>
        <div className='subreddit-box'>
          <Link to={`/r/${subreddit}`} className='subreddit-title'>/r/{subreddit}</Link>
          <span className='space' />
          <a href={`https://www.reddit.com/r/${subreddit}`} className='subreddit-title-link'>reddit</a>
          <span className='space' />
          <a href={`https://snew.github.io/r/${subreddit}`} className='subreddit-title-link'>ceddit</a>
        </div>
        <div className='selections'>
          <LocalSort defaultSort={localSort_types.date}/>
          <RemovedFilter />
          <RemovedByFilter />
        </div>
        {lastTimeLoaded}
        {
          noPostsFound
            ? <p>No removed posts found for /r/{subreddit}</p>
            :
            visible.map(post => {
              return <Post key={post.id} {...post} />
            })
        }
      </React.Fragment>
    )
  }
}

export default connect(Subreddit)
