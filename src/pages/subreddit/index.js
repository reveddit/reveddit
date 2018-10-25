import React from 'react'
import { Link } from 'react-router-dom'
import { getRemovedThreadIDs } from '../../api/removeddit'
import { getRecentPostsBySubreddit } from '../../api/pushshift'
import { getThreads, getItems } from '../../api/reddit'
import Post from '../common/Post'
import {connect} from '../../state'
import { itemIsRemovedOrDeleted, postIsDeleted } from '../../utils'
import Time from '../common/Time'
import { AUTOMOD_REMOVED, AUTOMOD_REMOVED_MOD_APPROVED, MOD_OR_AUTOMOD_REMOVED, UNKNOWN_REMOVED, NOT_REMOVED } from '../common/RemovedBy'

var numDeletedNotShown = 0
class Subreddit extends React.Component {
  state = {
    threads: [],
    loading: true,
    n: 1000
  }

  componentDidMount () {
    const { subreddit = 'all' } = this.props.match.params
    this.getRemovedThreads(subreddit)
  }

  // Check if the subreddit has changed in the url, and fetch threads accordingly
  componentDidUpdate (prevProps) {
    const { subreddit: newSubreddit = 'all' } = this.props.match.params
    const { subreddit = 'all' } = prevProps.match.params

    if (subreddit !== newSubreddit) {
      this.getRemovedThreads(newSubreddit)
    }
  }

  // Download thread IDs from removeddit API, then thread info from reddit API
  getRemovedThreads (subreddit) {
    document.title = `/r/${subreddit}`
    this.setState({ threads: [], loading: true })
    this.props.global.setLoading('Loading removed threads...')
    subreddit = subreddit.toLowerCase()
    const n = 1000
    this.setState({n: n})
    if (subreddit === 'all') {
      getRemovedThreadIDs(subreddit)
      .then(threadIDs => getThreads(threadIDs))
      .then(threads => {
        threads.forEach(thread => {
          thread.selftext = ''
          if (postIsDeleted(thread)) {
            thread.deleted = true
          } else {
            thread.removed = true
          }
        })
        this.setState({ threads, loading: false })
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
                show_posts.push(post)
              }
              //show_posts.push(post)
            }
          })

          return show_posts
        })
        .then(posts => {
          this.setState({ threads: posts, loading: false })
          this.props.global.setSuccess()
        })
      })
    }
  }

  render () {
    const { subreddit = 'all' } = this.props.match.params
    const noThreadsFound = this.state.threads.length === 0 && !this.state.loading
    let lastTimeLoaded = ''
    let numPostsTitle = ''
    if (numDeletedNotShown) {
      numPostsTitle = `${numDeletedNotShown} user-deleted posts that have no comments are not shown`
    }

    if (this.state.threads.length) {
      let oldest_time = 99999999999
      this.state.threads.forEach(post => {
        if (post.created_utc < oldest_time) {
          oldest_time = post.created_utc
        }
      })
      lastTimeLoaded = (
                          <React.Fragment>
                            <div className='non-item text'>since <Time created_utc={oldest_time} /></div>
                            {subreddit !== 'all' ?
                              <React.Fragment>
                                <div className='non-item text' title={numPostsTitle}>of {this.state.n.toLocaleString()} posts</div>
                              </React.Fragment>
                            : ''}
                          </React.Fragment>
                       )
    }

    const threads_sorted = this.state.threads.sort( (a, b) => {
      return (b.score - a.score) || (b.num_comments - a.num_comments)
    })

    return (
      <React.Fragment>
        <div className='subreddit-box'>
          <Link to={`/r/${subreddit}`} className='subreddit-title'>/r/{subreddit}</Link>
          <span className='space' />
          <a href={`https://www.reddit.com/r/${subreddit}`} className='subreddit-title-link'>reddit</a>
          <span className='space' />
          <a href={`https://snew.github.io/r/${subreddit}`} className='subreddit-title-link'>ceddit</a>
        </div>
        {lastTimeLoaded}
        {
          noThreadsFound
            ? <p>No removed threads found for /r/{subreddit}</p>
            :
            threads_sorted.map(thread => (
              <Post key={thread.id} {...thread} />
            ))
        }
      </React.Fragment>
    )
  }
}

export default connect(Subreddit)
