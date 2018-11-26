import React from 'react'
import { Link } from 'react-router-dom'
import { withRouter } from 'react-router'
import scrollToElement from 'scroll-to-element'
import {
  getPost,
  getComments as getRedditComments
} from '../../api/reddit'
import {
  getPost as getRemovedPost,
  getComments as getPushshiftComments
} from '../../api/pushshift'
import { isRemoved, isDeleted, commentIsRemoved, itemIsRemovedOrDeleted, postIsDeleted } from '../../utils'
import { connect, localSort_types } from '../../state'
import Post from '../common/Post'
import CommentSection from './CommentSection'
import CommentInfo from './CommentInfo'
import { AUTOMOD_REMOVED, AUTOMOD_REMOVED_MOD_APPROVED, MOD_OR_AUTOMOD_REMOVED, UNKNOWN_REMOVED, NOT_REMOVED } from '../common/RemovedBy'
import RemovedFilter from '../common/selections/RemovedFilter'
import RemovedByFilter from '../common/selections/RemovedByFilter'
import LocalSort from '../common/selections/LocalSort'

class Thread extends React.Component {
  state = {
    post: {},
    pushshiftComments: [],
    removed: [],
    deleted: [],
    loadingComments: true
  }

  componentDidMount () {
    const { subreddit, threadID } = this.props.match.params
    this.props.global.setLoading('Loading comments from Pushshift...')

    // Get thread from reddit
    getPost(subreddit, threadID)
      .then(post => {
        document.title = post.title
        // Fetch the thread from pushshift if it was deleted/removed
        if (itemIsRemovedOrDeleted(post)) {
          if (postIsDeleted(post)) {
            post.deleted = true
            post.selftext = ''
          } else {
            post.removed = true
          }
          this.setState({ post })
          if (! postIsDeleted(post) && post.is_self) {
            getRemovedPost(threadID)
            .then(removedPost => {
              post.selftext = removedPost.selftext
              this.setState({ post })
            })
          }
        } else {
          this.setState({ post })
        }
      })
      .catch(this.props.global.setError)

    // Get comment ids from pushshift
    getPushshiftComments(threadID)
      .then(pushshiftComments => {
        // Extract ids from pushshift response
        const ids = pushshiftComments.map(comment => comment.id)
        this.props.global.setLoading('Comparing comments to Reddit API...')
        // Get all the comments from reddit
        return getRedditComments(ids)
          .then(redditComments => {
            // Temporary lookup for updating score
            const redditCommentLookup = {}
            redditComments.forEach(comment => {
              redditCommentLookup[comment.id] = comment
            })

            // Replace pushshift score with reddit (its usually more accurate)
            pushshiftComments.forEach(ps_comment => {
              const retrievalLatency = ps_comment.retrieved_on-ps_comment.created_utc
              const redditComment = redditCommentLookup[ps_comment.id]
              if (redditComment !== undefined) {
                ps_comment.permalink = redditComment.permalink
                ps_comment.score = redditComment.score
                ps_comment.controversiality = redditComment.controversiality
                if (! commentIsRemoved(redditComment)) {
                  ps_comment.author = redditComment.author
                  ps_comment.body = redditComment.body
                  if (commentIsRemoved(ps_comment) && retrievalLatency <= 5) {
                    ps_comment.removedby = AUTOMOD_REMOVED_MOD_APPROVED
                  } else {
                    ps_comment.removedby = NOT_REMOVED
                  }
                } else {
                  if (commentIsRemoved(ps_comment)) {
                    if (retrievalLatency <= 5) {
                      ps_comment.removedby = AUTOMOD_REMOVED
                    } else {
                      ps_comment.removedby = UNKNOWN_REMOVED
                    }
                  } else {
                    ps_comment.removedby = MOD_OR_AUTOMOD_REMOVED
                  }
                }
              }
            })

            const removed = []
            const deleted = []

            // Check what as removed / deleted according to reddit
            redditComments.forEach(comment => {
              if (isRemoved(comment.body)) {
                removed.push(comment.id)
              } else if (isDeleted(comment.body)) {
                deleted.push(comment.id)
              }
            })

            console.log(`Pushshift: ${pushshiftComments.length} comments`)
            console.log(`Reddit: ${redditComments.length} comments`)

            this.props.global.setSuccess()
            this.setState({
              pushshiftComments,
              removed,
              deleted,
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
  render () {
    const { subreddit, id, author, permalink } = this.state.post
    const { commentID } = this.props.match.params
    const linkToRestOfComments = permalink
    const isSingleComment = (commentID !== undefined && ! this.props.history.location.hash)
    const root = isSingleComment ? commentID : id

    return (
      <React.Fragment>
        <Post {...this.state.post} />
        {
          (!this.state.loadingComments && root) &&
          <React.Fragment>
          <div className='selections'>
            <LocalSort page_type='thread' />
            <RemovedFilter page_type='thread' />
            <RemovedByFilter />
          </div>
            {isSingleComment &&
              <div className='view-rest-of-comment'>
                <div>{"you are viewing a single comment's thread."}</div>
                <Link to={linkToRestOfComments}>view the rest of the comments</Link>
              </div>
            }
            <CommentSection
              root={root}
              comments={this.state.pushshiftComments}
              removed={this.state.removed}
              deleted={this.state.deleted}
              link_author={author}
              isSingleComment={isSingleComment}
            />
          </React.Fragment>
        }
      </React.Fragment>
    )
  }
}

export default withRouter(connect(Thread))
