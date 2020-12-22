import React, {useState} from 'react'
import { Link, withRouter } from 'react-router-dom'
import { prettyScore, parse, jumpToHash, SimpleURLSearchParams,
         convertPathSub, PATH_STR_SUB,
} from 'utils'
import Time from 'pages/common/Time'
import RemovedBy from 'pages/common/RemovedBy'
import CommentBody from 'pages/common/CommentBody'
import Author from 'pages/common/Author'
import { connect } from 'state'
import { insertParent } from 'data_processing/thread'
import {MessageMods} from 'components/Misc'
import { validAuthor } from 'utils'
import {AddUserItem, getUserCommentsForPost,
        addUserComments_and_updateURL,
} from 'data_processing/FindCommentViaAuthors'
import { QuestionMarkModal, Help } from 'components/Misc'

const contextDefault = 3
const MIN_COMMENT_DEPTH = 4
const MAX_COMMENT_DEPTH = 9

export const getMaxCommentDepth = () => {
  let depth = Math.round(window.screen.availWidth / 100)
  if (depth < MIN_COMMENT_DEPTH) {
    depth = MIN_COMMENT_DEPTH
  } else if (depth > MAX_COMMENT_DEPTH) {
    depth = MAX_COMMENT_DEPTH
  }
  return depth
}

const buttons_help = {content: <Help title='Comment links' content={
  <>
    <p><b>author-focus:</b> Shows only comments by this comment's author and hides all other comments.</p>
    <p><b>update:</b> Checks the author's user page to find any edits made after the comment was archived. Only for for removed comments that have been archived.</p>
    <p><b>message mods:</b> Prepares a message with a link to the comment addressed to the subreddit's moderators.</p>
  </>
}/>}

const Comment = (props) => {
  const {
    global, history, //from HOC withRouter(connect(Comment))
    page_type, //from parent component
    id, parent_id, stickied, permalink, subreddit, link_id, score, //from reddit comment data
    removed, deleted, locked, depth, //from reveddit post processing
    contextAncestors, focusCommentID, ancestors, replies, replies_copy, //from reveddit post processing
  } = props
  const name = `t1_${id}` //some older pushshift data does not have name
  let {author} = props
  const [displayBody, setDisplayBody] = useState(
    ! stickied ||
      contextAncestors[id] ||
      id === focusCommentID)
  const [repliesMeta, setRepliesMeta] = useState({
    showHiddenReplies: false,
    hideReplies: ! replies.length && replies_copy.length,
  })
  const {showHiddenReplies, hideReplies} = repliesMeta
  const {showContext, limitCommentDepth, itemsLookup, threadPost,
         add_user, loading,
        } = global.state
  const {selection_update: updateStateAndURL, context_update} = global
  const maxCommentDepth = getMaxCommentDepth()
  let even_odd = ''
  if (! removed && ! deleted) {
    even_odd = depth % 2 === 0 ? 'comment-even' : 'comment-odd'
  }

  if (deleted) {
    author = '[deleted]'
  }

  const permalink_nohash = permalink ? convertPathSub(permalink)
    : `${PATH_STR_SUB}/${subreddit}/comments/${link_id}/_/${id}/`

  const searchParams = new SimpleURLSearchParams(window.location.search).delete('context').delete('showFilters')
  const searchParams_nocontext = searchParams.toString()
  const contextLink = permalink_nohash+searchParams.set('context', contextDefault).toString()+`#${name}`
  const permalink_with_hash = permalink_nohash+searchParams_nocontext+`#${name}`
  const getPermalink = (text) => {
    return <Link to={permalink_with_hash} onClick={(e) => {
      context_update(0, props)
      .then(() => jumpToHash(window.location.hash))
    }}>{text}</Link>
  }
  let parent_link = undefined
  if ('parent_id' in props && parent_id.substr(0,2) === 't1') {
    parent_link = permalink_nohash.split('/').slice(0,6).join('/')+'/'+
                  parent_id.substr(3)+'/'+searchParams_nocontext+'#'+parent_id
  }
  if (Object.keys(contextAncestors).length &&
      id != focusCommentID &&
      ! contextAncestors[id] &&
      ! ancestors[focusCommentID]
      ) {
    return <></>
  }
  let expandIcon = '[+]', hidden = 'hidden'
  if (displayBody) {
    expandIcon = '[–]'
    hidden = ''
  }
  let replies_viewable = null, num_replies_text = ''
  if (showContext) {
    const rest = {
      depth: depth + 1,
      global,
      history,
      page_type,
      focusCommentID,
      contextAncestors,
    }
    const createComment = (comment) => <Comment key={comment.id} {...comment} {...rest} />
    const getReplies_or_continueLink = (replies) => {
      return (! limitCommentDepth || depth < maxCommentDepth) ?
        replies.map(createComment)
        : getPermalink('continue this thread⟶')
    }
    const ShowHiddenRepliesLink = ({num_replies_text}) =>
      <a className='pointer' onClick={() => setRepliesMeta({showHiddenReplies: true, hideReplies: false})}>▾ show hidden replies{num_replies_text}</a>
    if (replies_copy && replies_copy.length) {
      num_replies_text = ' ('+replies_copy.length+')'
    }
    if (showHiddenReplies && ! hideReplies) {
      replies_viewable = getReplies_or_continueLink(replies_copy)
    } else if (replies && replies.length && ! hideReplies) {
      replies_viewable = getReplies_or_continueLink(replies)
      if (replies.length !== replies_copy.length) {
        replies_viewable.push(<ShowHiddenRepliesLink key={id+'_extra_replies'} num_replies_text={' ('+(replies_copy.length-replies.length)+')'}/>)
      }
    } else if ((replies_copy && replies_copy.length) || hideReplies) {
      replies_viewable = showHiddenReplies && ! hideReplies ?
        getReplies_or_continueLink(replies_copy)
        : <ShowHiddenRepliesLink num_replies_text={num_replies_text}/>
    }
  }
  const ShowHideRepliesButton = ({hideReplies, ...other}) => {
    const show_hide = hideReplies ? 'hide' : 'show'
    return <a className='pointer' onClick={() => setRepliesMeta({...repliesMeta, ...other, hideReplies})}>{show_hide} replies{num_replies_text}</a>
  }
  return (
    <div id={name} className={`comment
          ${removed ? 'removed':''}
          ${deleted ? 'deleted':''}
          ${locked ? 'locked':''}
          ${even_odd}
          ${id === focusCommentID ? 'focus':''}
    `}>
      <div className='comment-head'>
        <a onClick={() => setDisplayBody(! displayBody)} className={`collapseToggle spaceRight ${hidden}`}>{expandIcon}</a>
        <Author {...props} className='spaceRight'/>
        <span className='comment-score spaceRight'>{prettyScore(score)} point{(score !== 1) && 's'}</span>
        <Time {...props}/>
        <RemovedBy {...props} />
      </div>
      <div className='comment-body-and-links' style={displayBody ? {} : {display: 'none'}}>
        <CommentBody {...props} page_type={page_type}/>
        <div className='comment-links'>
          { ! deleted &&
            <>
              {getPermalink('permalink')}
            </>
          }
          {parent_link &&
              // using <a> instead of <Link> for parent & context links b/c
              // <Link> causes comments to disappear momentarily when inserting a parent
              <>
                <a href={parent_link} onClick={(e) => {
                  e.preventDefault()
                  insertParent(id, global)
                  .then(() => context_update(0, props, parent_link))
                  .then(() => jumpToHash(window.location.hash))
                }}>parent</a>
                {! deleted &&
                  <a href={contextLink} onClick={(e) => {
                    e.preventDefault()
                    insertParent(id, global)
                    // parent_id will never be t3_ b/c context link is not rendered for topmost comments
                    .then(() => insertParent(parent_id.substr(3), global))
                    .then(() => context_update(contextDefault, props, contextLink))
                    .then(() => jumpToHash(window.location.hash))
                  }}>context</a>
                }
              </>
          }
          {num_replies_text ?
            hideReplies ?
              <ShowHideRepliesButton hideReplies={false} showHiddenReplies={true}/>
              : <ShowHideRepliesButton hideReplies={true}/>
            : null}
          <a className='pointer' onClick={() => global.selection_update('author', author, page_type)}>author-focus</a>
          <UpdateButton post={threadPost} removed={removed} author={author}/>
          { ! deleted && removed &&
            <MessageMods {...props}/>
          }
          <QuestionMarkModal modalContent={buttons_help} wh='15'/>
        </div>
        <div>
          { replies_viewable }
        </div>
      </div>
    </div>
  )

}

export const UpdateButton = connect(({global, post, removed, author}) => {
  if (! removed || ! validAuthor(author)) {
    return null
  }
  const {loading, itemsLookup, add_user} = global.state
  if (loading) {
    return <a>.....</a>
  }
  return (
    <a className='pointer' onClick={() => {
      global.setLoading('')
      const aui = new AddUserItem({author})
      aui.query().then(userPage => getUserCommentsForPost(post, itemsLookup, [userPage]))
      .then(({user_comments, newIDs}) => {
        const new_add_user = addUserComments_and_updateURL(user_comments, itemsLookup, add_user)
        global.setSuccess({itemsLookup, add_user: new_add_user || add_user})
      })
      .catch(() => global.setError(''))
    }}>update</a>
  )
})

export default withRouter(connect(Comment))
