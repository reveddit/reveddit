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
import { isRemoved, isDeleted, itemIsRemovedOrDeleted, postIsDeleted } from '../../utils'
import { connect } from '../../state'
import Post from '../common/Post'
import CommentSection from './CommentSection'
import SortBy from './SortBy'
import CommentInfo from './CommentInfo'

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
            pushshiftComments.forEach(comment => {
              const redditComment = redditCommentLookup[comment.id]
              if (redditComment !== undefined) {
                comment.score = redditComment.score
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
    const { subreddit, id, author } = this.state.post
    const { commentID } = this.props.match.params
    const linkToRestOfComments = `/r/${subreddit}/comments/${id}/_/`
    const isSingleComment = (commentID !== undefined && ! this.props.history.location.hash)
    const root = isSingleComment ? commentID : id

    return (
      <React.Fragment>
        <Post {...this.state.post} />
        {
          (!this.state.loadingComments && root) &&
          <React.Fragment>
            <SortBy />
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
