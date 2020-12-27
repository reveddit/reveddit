import React, {useState} from 'react'
import { Link, withRouter } from 'react-router-dom'
import { prettyScore, parse, jumpToCurrentHash_ifNoScroll, SimpleURLSearchParams,
         convertPathSub, PATH_STR_SUB, validAuthor, copyToClipboard,
} from 'utils'
import Time from 'pages/common/Time'
import RemovedBy from 'pages/common/RemovedBy'
import CommentBody from 'pages/common/CommentBody'
import Author from 'pages/common/Author'
import { connect } from 'state'
import { insertParent } from 'data_processing/thread'
import {MessageMods} from 'components/Misc'
import {AddUserItem, getUserCommentsForPost,
        addUserComments_and_updateURL,
} from 'data_processing/FindCommentViaAuthors'
import { QuestionMarkModal, Help, ExtensionLink } from 'components/Misc'

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
    <p><b>update:</b> For removed comments, checks the author's user page to find any edits made after the comment was archived.</p>
    <p><b>preserve:</b> Stores the location of the comment in the URL and copies the new URL to the clipboard. If the comment is later removed by a moderator then it can be viewed with this URL even if the archive service is unavailable.</p>
    <p><b>message mods:</b> Prepares a message with a link to the comment addressed to the subreddit's moderators.</p>
    <p><b>subscribe:</b> When <ExtensionLink/> is installed, sends a notification when this comment is removed, approved, locked or unlocked.</p>
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
  const Permalink = ({text}) =>
    <Link to={permalink_with_hash} onClick={(e) => {
      const y = window.scrollY
      context_update(0, props)
      .then(() => jumpToCurrentHash_ifNoScroll(y))
    }}>{text}</Link>
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
  let replies_viewable = [], num_replies_text = ''
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
        : [<Permalink key='c' text='continue this thread⟶'/>]
    }
    const ShowHiddenRepliesLink = ({num_replies_text}) =>
      <Button_noHref onClick={() => setRepliesMeta({showHiddenReplies: true, hideReplies: false})}>▾ show hidden replies{num_replies_text}</Button_noHref>
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
    return <Button_noHref onClick={() => setRepliesMeta({...repliesMeta, ...other, hideReplies})}>{show_hide} replies{num_replies_text}</Button_noHref>
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
        <div>
          <span className='comment-links'>
            { ! deleted &&
              <>
                {<Permalink text='permalink'/>}
              </>
            }
            {parent_link &&
              // using <a> instead of <Link> for parent & context links b/c
              // <Link> causes comments to disappear momentarily when inserting a parent
              <>
                <LoadingOrButton Button={
                  <a href={parent_link} onClick={(e) => {
                    const y = window.scrollY
                    e.preventDefault()
                    insertParent(id, global)
                    .then(() => context_update(0, props, parent_link))
                    .then(() => jumpToCurrentHash_ifNoScroll(y))
                  }}>parent</a>}
                />
                {! deleted &&
                  <LoadingOrButton Button={
                    <a href={contextLink} onClick={(e) => {
                      const y = window.scrollY
                      e.preventDefault()
                      insertParent(id, global)
                      // parent_id will never be t3_ b/c context link is not rendered for topmost comments
                      .then(() => insertParent(parent_id.substr(3), global))
                      .then(() => context_update(contextDefault, props, contextLink))
                      .then(() => jumpToCurrentHash_ifNoScroll(y))
                    }}>context</a>}
                  />
                }
              </>
            }
            {num_replies_text ?
              hideReplies ?
                <ShowHideRepliesButton hideReplies={false} showHiddenReplies={true}/>
                : <ShowHideRepliesButton hideReplies={true}/>
              : null}
            <Button_noHref onClick={() => global.selection_update('author', author, page_type)}>author-focus</Button_noHref>
            <UpdateButton post={threadPost} removed={removed} author={author}/>
            <PreserveButton post={threadPost} author={author} deleted={deleted} removed={removed}/>
            { ! deleted && removed &&
              <MessageMods {...props}/>
            }
          </span>
          <QuestionMarkModal modalContent={buttons_help} wh='15'/>
        </div>
        <div>
          { replies_viewable }
        </div>
      </div>
    </div>
  )

}

const LoadingOrButton = connect(({global, Button}) => {
  let result
  if (global.state.loading) {
    result = <a>.....</a>
  } else {
    result = Button
  }
  //wrapping in <span> maintains the position of the element so that the real-time extension's subscribe button is always added to the end
  return <span>{result}</span>
})

const PreserveButton = connect(({global, post, author, deleted, removed}) => {
  if (deleted || removed) {
    return null
  }
  return (
    <LoadingOrButton Button={
      <Button_noHref onClick={() => {
        const {add_user} = global.state
        //passing empty itemsLookup here allows the URL to be updated w/this comment's user page location without modifying state
        getLatestVersionOfComment(global, post, author, {})
        .then(result => {
          if (! result.error) {
            copyToClipboard(window.location.href)
            global.setSuccess({add_user: result.new_add_user || add_user})
          }
        })
      }}>preserve</Button_noHref>}
    />)
})

const Button_noHref = ({onClick, children}) => {
  return <a className='pointer' onClick={onClick}>{children}</a>
}

const getLatestVersionOfComment = (global, post, author, itemsLookup = {}) => {
  const {add_user} = global.state
  global.setLoading('')
  const aui = new AddUserItem({author})
  return aui.query().then(userPage => getUserCommentsForPost(post, itemsLookup, [userPage]))
  .then(({user_comments, newIDs}) => {
    const new_add_user = addUserComments_and_updateURL(user_comments, itemsLookup, add_user)
    return {new_add_user}
  })
  .catch(() => {
    global.setError('')
    return {error: true}
  })
}

export const UpdateButton = connect(({global, post, removed, author}) => {
  if (! removed || ! validAuthor(author)) {
    return null
  }
  const {itemsLookup, add_user} = global.state
  return (
    <LoadingOrButton Button={
      <Button_noHref onClick={() => {
        getLatestVersionOfComment(global, post, author, itemsLookup)
        .then(result => {
          if (! result.error) {
            global.setSuccess({itemsLookup, add_user: result.new_add_user || add_user})
          }
        })
      }}>update</Button_noHref>}
    />
  )
})

export default withRouter(connect(Comment))
