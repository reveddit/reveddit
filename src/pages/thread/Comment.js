import React, {useState} from 'react'
import { Link, withRouter } from 'react-router-dom'
import { prettyScore, parse, SimpleURLSearchParams,
         convertPathSub, PATH_STR_SUB, validAuthor,
         jumpToCurrentHash_ifNoScroll, jumpToCurrentHash, jumpToHash,
         copyToClipboard,
} from 'utils'
import Time from 'pages/common/Time'
import RemovedBy, {preserve_desc} from 'pages/common/RemovedBy'
import CommentBody from 'pages/common/CommentBody'
import Author from 'pages/common/Author'
import { connect } from 'state'
import { insertParent } from 'data_processing/thread'
import {MessageMods} from 'components/Misc'
import {AddUserItem, getUserCommentsForPost,
        addUserComments_and_updateURL,
} from 'data_processing/FindCommentViaAuthors'
import { QuestionMarkModal, Help, ExtensionLink } from 'components/Misc'
import { applySelectedSort } from './common'

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
const hide_all_others = ' and hides all other comments.'
const buttons_help = {content: <Help title='Comment links' content={
  <>
    <p><b>author-focus:</b> Shows only comments by this comment's author{hide_all_others}</p>
    <p><b>as-of:</b> Shows only comments created before this comment{hide_all_others} Scores are current and do not reflect values from the time this comment was created.</p>
    <p><b>update:</b> For removed comments, checks the author's user page to find any edits made after the comment was archived.</p>
    <p>{preserve_desc}</p>
    <p><b>message mods:</b> Prepares a message with a link to the comment addressed to the subreddit's moderators.</p>
    <p><b>subscribe:</b> When <ExtensionLink/> is installed, sends a notification when this comment is removed, approved, locked or unlocked.</p>
  </>
}/>}

const Comment = (props) => {
  const {
    global, history, //from HOC withRouter(connect(Comment))
    page_type, //from parent component
    id, parent_id, stickied, permalink, subreddit, link_id, score, created_utc, //from reddit comment data
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
         add_user, loading, localSort, localSortReverse,
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
  const thisHash = `#${name}`
  const replies_id = name+'_replies'
  const contextLink = permalink_nohash+searchParams.set('context', contextDefault).toString()+thisHash
  const permalink_with_hash = permalink_nohash+searchParams_nocontext+thisHash
  const Permalink = ({text}) =>
    <Link to={permalink_with_hash} onClick={(e) => {
      context_update(0, props).then(jumpToCurrentHash)
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
    const getReplies_or_continueLink = (replies, sort = false) => {
      if (sort) {
        applySelectedSort(replies, localSort, localSortReverse)
      }
      return (! limitCommentDepth || depth < maxCommentDepth) ?
        replies.map(createComment)
        : [<Permalink key='c' text='continue this thread⟶'/>]
    }
    const getRepliesCopy = () => getReplies_or_continueLink(replies_copy, true)
    const ShowHiddenRepliesLink = ({num_replies_text}) =>
      <Button_noHref onClick={() => {
        setRepliesMeta({showHiddenReplies: true, hideReplies: false})
        jumpToHash(`#${replies_id}`)
      }}>▾ show hidden replies{num_replies_text}</Button_noHref>
    if (replies_copy && replies_copy.length) {
      num_replies_text = ' ('+replies_copy.length+')'
    }
    if (showHiddenReplies && ! hideReplies) {
      replies_viewable = getRepliesCopy()
    } else if (replies && replies.length && ! hideReplies) {
      replies_viewable = getReplies_or_continueLink(replies)
      if (replies.length !== replies_copy.length) {
        replies_viewable.push(<ShowHiddenRepliesLink key={id+'_extra_replies'} num_replies_text={' ('+(replies_copy.length-replies.length)+')'}/>)
      }
    } else if ((replies_copy && replies_copy.length) || hideReplies) {
      replies_viewable = showHiddenReplies && ! hideReplies ?
        getRepliesCopy()
        : <ShowHiddenRepliesLink num_replies_text={num_replies_text}/>
    }
  }
  const ShowHideRepliesButton = ({hideReplies, ...other}) => {
    const show_hide = hideReplies ? 'hide' : 'show'
    return <Button_noHref onClick={() => setRepliesMeta({...repliesMeta, ...other, hideReplies})}>{show_hide} replies{num_replies_text}</Button_noHref>
  }
  const locallyClickableFilters_data = {
    user_flair: '',
    categoryFilter_author: author,
    thread_before: created_utc,
  }
  const locallyClickableFilters_set = (globalVarName) => {
    const value = locallyClickableFilters_data[globalVarName]
    const reset = Object.keys(locallyClickableFilters_data).filter(x => x !== globalVarName)
    return global.selection_set_reset({set: {[globalVarName]: value}, reset, page_type})
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
                    e.preventDefault()
                    finishPromise_then_jumpToHash(
                      insertParent(id, global)
                      .then(() => context_update(0, props, parent_link))
                    )
                  }}>parent</a>}
                />
                {! deleted &&
                  <LoadingOrButton Button={
                    <a href={contextLink} onClick={(e) => {
                      e.preventDefault()
                      finishPromise_then_jumpToHash(
                        insertParent(id, global)
                        // parent_id will never be t3_ b/c context link is not rendered for topmost comments
                        .then(() => insertParent(parent_id.substr(3), global))
                        .then(() => context_update(contextDefault, props, contextLink))
                      )
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
            <Button_noHref onClick={() =>
              locallyClickableFilters_set('categoryFilter_author')
              .then(() => jumpToHash(thisHash))
            }>author-focus</Button_noHref>
            <Button_noHref onClick={() =>
              locallyClickableFilters_set('thread_before')
              .then(() => jumpToHash(thisHash))
            }>as-of</Button_noHref>
            <UpdateButton post={threadPost} removed={removed} author={author}/>
            <PreserveButton post={threadPost} author={author} deleted={deleted}/>
            { ! deleted && removed &&
              <MessageMods {...props}/>
            }
          </span>
          <QuestionMarkModal modalContent={buttons_help} wh='15'/>
        </div>
        <div id={replies_id}>
          { replies_viewable }
        </div>
      </div>
    </div>
  )

}

const finishPromise_then_jumpToHash = (promise) => {
  const y = window.scrollY
  return promise.then(() => jumpToCurrentHash_ifNoScroll(y))
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

const PreserveButton = connect(({global, post, author, deleted}) => {
  if (deleted || ! validAuthor(author)) {
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
