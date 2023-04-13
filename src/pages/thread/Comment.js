import React, {useState, useEffect, useRef} from 'react'
import { Link, withRouter } from 'react-router-dom'
import { prettyScore, parse, SimpleURLSearchParams,
         convertPathSub, PATH_STR_SUB, validAuthor,
         jumpToCurrentHash_ifNoScroll, jumpToCurrentHash, jumpToHash,
         copyToClipboard, reversible,
} from 'utils'
import Time from 'pages/common/Time'
import RemovedBy, {preserve_desc} from 'pages/common/RemovedBy'
import CommentBody from 'pages/common/CommentBody'
import Author from 'pages/common/Author'
import { connect } from 'state'
import { insertParent } from 'data_processing/thread'
import {MessageMods} from 'components/Misc'
import {AddUserItem, getUserCommentsForPost, addUserComments_and_updateURL,
        addUserComments_updateURL_createTreeIfNeeded, get_userPageSortAndTime,
} from 'data_processing/RestoreComment'
import { QuestionMarkModal, Help, ExtensionLink } from 'components/Misc'
import { getSortFn } from './common'
import { RestoreIcon } from 'pages/common/svg'

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

const localAlreadySearchedAuthors = {}

const CommentButtonsHelp = <QuestionMarkModal modalContent={{content: <Help title='Comment links' content={
  <>
    <p><b>author-focus:</b> Shows only comments by this comment's author{hide_all_others} This may also insert unarchived comments as described in <b>preserve</b>.</p>
    <p><b>as-of:</b> Shows only comments created before this comment{hide_all_others} Scores are current and do not reflect values from the time this comment was created.</p>
    <p>{preserve_desc} The preserve button may also,</p>
    <ul>
      <li>update the body of removed comments with any edits made after archival, and</li>
      <li>insert unarchived comments found via the author's user page.</li>
    </ul>
    <p><b>message mods:</b> Prepares a message with a link to the comment addressed to the subreddit's moderators.</p>
    <p><b>subscribe:</b> When <ExtensionLink/> is installed, sends a notification when this comment is removed, approved, locked or unlocked.</p>
  </>
}/>}} wh='15'/>

// list of filters to reset when a comment-clickable filter (flair, as-of, or author-focus) is clicked
export const threadFiltersToReset = [
  'user_flair', 'categoryFilter_author', 'thread_before',
  'removedFilter', 'removedByFilter', 'keywords', 'tagsFilter',
]

const Comment = withRouter(connect((props) => {
  const {
    global, history, //from HOC withRouter(connect(Comment))
    page_type, setShowSingleRoot, contextAncestors, focusCommentID, visibleComments, is_root, //from parent component
    id, parent_id, stickied, permalink, subreddit, link_id, score, created_utc, //from reddit comment data
    removed, deleted, locked, depth, //from reveddit post processing
    ancestors, replies, //from reveddit post processing
  } = props
  let {author} = props
  const {showContext, limitCommentDepth, itemsLookup, threadPost,
         add_user, loading: globalLoading, localSort, localSortReverse,
         categoryFilter_author,
        } = global.state
  const [localLoading, setLocalLoading] = useState(false)
  const loading = localLoading || globalLoading
  const {selection_update: updateStateAndURL, context_update} = global
  const name = `t1_${id}` //some older pushshift data does not have name
  const visibleReplies = visibleComments[name] || []
  const [repliesMeta, setRepliesMeta] = useState({
    showHiddenReplies: false,
    hideReplies: ! visibleReplies.length && replies.length,
  })
  const {showHiddenReplies, hideReplies} = repliesMeta
  const [displayBody, setDisplayBody] = useState(
    ! stickied || ! limitCommentDepth ||
      contextAncestors[id] ||
      id === focusCommentID)
  const {userPageSort, userPageTime} = get_userPageSortAndTime(props)
  const maxCommentDepth = getMaxCommentDepth()
  let even_odd = ''
  if (! removed && ! deleted) {
    even_odd = depth % 2 === 0 ? 'comment-even' : 'comment-odd'
  }

  if (deleted) {
    author = '[deleted]'
  }
  // per https://stackoverflow.com/questions/55647287/how-to-send-request-on-click-react-hooks-way/55647571#55647571
  const isMounted = useRef(true)
  useEffect(() => {
    return () => {
      isMounted.current = false
    }
  }, [])
  const stopLocalLoading = () => {
    if (isMounted.current) {
      return setLocalLoading(false)
    }
  }
  const permalink_nohash = permalink ? convertPathSub(permalink)
    : `${PATH_STR_SUB}/${subreddit}/comments/${link_id}/_/${id}/`

  const searchParams = new SimpleURLSearchParams(window.location.search).delete('context').delete('showContext').delete('showFilters')
  const searchParams_nocontext = searchParams.toString()
  const thisCommentHash = `#${name}`
  const replies_id = name+'_replies'
  const contextLink = permalink_nohash+searchParams.set('context', contextDefault).toString()+thisCommentHash
  const permalink_with_hash = permalink_nohash+searchParams_nocontext+thisCommentHash
  const Permalink = ({text, onClick}) =>
    <Link to={permalink_with_hash} onClick={(e) => {
      context_update(0, page_type, history)
      .then(onClick)
      .then(jumpToCurrentHash)
    }}>{text}</Link>
  let parent_link = undefined
  if ('parent_id' in props && parent_id.substr(0,2) === 't1') {
    parent_link = permalink_nohash.split('/').slice(0,6).join('/')+'/'+
                  parent_id.substr(3)+'/'+searchParams_nocontext+'#'+parent_id
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
      page_type,
      focusCommentID,
      contextAncestors,
      setShowSingleRoot,
      visibleComments,
    }
    const showReplies = (! limitCommentDepth || depth < maxCommentDepth)
    const continue_link = [<Permalink key='c' text='continue this thread⟶' onClick={() => setShowSingleRoot(true)}/>]
    const createComment = (comment) => <Comment
      key={[comment.id, comment.removedby, (visibleComments[comment.name] || []).length.toString()].join('|')}
      {...comment} {...rest}/>
    let showingContinueLink = false
    const getReplies_or_continueLink = (visibleReplies) => {
      if (showReplies) {
        return visibleReplies.map(c => createComment(c))
      } else {
        showingContinueLink = true
        return continue_link
      }
    }
    const sortFn = getSortFn(localSort)
    // [...replies] so that state is not modified
    const getAllReplies = () => getReplies_or_continueLink([...replies].sort(reversible(sortFn, localSortReverse)))
    const ShowHiddenRepliesLink = ({num_replies_text}) =>
      <Button_noHref onClick={() => {
        setRepliesMeta({showHiddenReplies: true, hideReplies: false})
        jumpToHash(`#${replies_id}`)
      }}>▾ show hidden replies{num_replies_text}</Button_noHref>
    if (replies && replies.length) {
      num_replies_text = ' ('+replies.length+')'
    }
    if (showHiddenReplies && ! hideReplies) {
      replies_viewable = getAllReplies()
    } else if (visibleReplies.length && ! hideReplies) {
      replies_viewable = getReplies_or_continueLink(visibleReplies)
      if (! showingContinueLink) {
        const extra_key = id+'_extra_replies'
        // must check visibleReplies.length < replies.length b/c replies can be empty when it is reset and repopulated in createCommentTree()
        // temp fix, later will get rid of createCommentTree and replace with something that incrementally updates instead of recreating the tree
        if (visibleReplies.length < replies.length) {
          replies_viewable.push(<ShowHiddenRepliesLink key={extra_key} num_replies_text={' ('+(replies.length - visibleReplies.length)+')'}/>)
        }
      }
    } else if ((replies && replies.length) || hideReplies) {
      replies_viewable = showHiddenReplies && ! hideReplies ?
        getAllReplies()
        : showReplies ?
          <ShowHiddenRepliesLink num_replies_text={num_replies_text}/>
          : continue_link
    }
  }
  const ShowHideRepliesButton = ({hideReplies, ...other}) => {
    const show_hide = hideReplies ? 'hide' : 'show'
    return <Button_noHref onClick={() => setRepliesMeta({...repliesMeta, ...other, hideReplies})}>{show_hide} replies{num_replies_text}</Button_noHref>
  }
  const locallyClickableFilters_data = {
    categoryFilter_author: author,
    thread_before: created_utc,
  }
  const locallyClickableFilters_set = (globalVarName) => {
    const value = locallyClickableFilters_data[globalVarName]
    return global.resetFilters(page_type, {[globalVarName]: value})
  }
  return (
    <div id={name} className={`comment
          ${removed ? 'removed':''}
          ${deleted ? 'deleted':''}
          ${locked ? 'locked':''}
          ${even_odd}
          ${   (categoryFilter_author !== 'all' && author === categoryFilter_author)
            || (categoryFilter_author === 'all' && id === focusCommentID) ? 'focus':''}
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
                <LoadingOrButton loading={loading} Button={
                  <a href={parent_link} onClick={(e) => {
                    setLocalLoading(true)
                    e.preventDefault()
                    finishPromise_then_jumpToHash(
                      insertParent(id, global)
                      .then(stopLocalLoading)
                      .then(() => {
                        const to = window.location.pathname+window.location.search+'#'+parent_id
                        if (! is_root) {
                          history.replace(to)
                          jumpToCurrentHash()
                        } else {
                          context_update(0, page_type, history, parent_link)
                        }
                      })
                    )
                  }}>parent</a>}
                />
                {! deleted &&
                  <LoadingOrButton loading={loading} Button={
                    <a href={contextLink} onClick={(e) => {
                      setLocalLoading(true)
                      e.preventDefault()
                      finishPromise_then_jumpToHash(
                        insertParent(id, global)
                        // parent_id will never be t3_ b/c context link is not rendered for topmost comments
                        .then(() => insertParent(parent_id.substr(3), global))
                        .then(stopLocalLoading)
                        .then(() => context_update(2, page_type, history, contextLink))
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
            <AuthorFocus post={threadPost} author={author} deleted={deleted} {...{loading, setLocalLoading, thisCommentHash, userPageSort, userPageTime}}/>
            <Button_noHref onClick={() =>
              locallyClickableFilters_set('thread_before')
              .then(() => jumpToHash(thisCommentHash))
            }>as-of</Button_noHref>
            <PreserveButton post={threadPost} author={author} deleted={deleted} {...{loading, setLocalLoading, userPageSort, userPageTime}}/>
            { ! deleted && removed &&
              <MessageMods {...props}/>
            }
          </span>
          {CommentButtonsHelp}
        </div>
        <div id={replies_id}>
          { replies_viewable }
        </div>
      </div>
    </div>
  )

}))

const finishPromise_then_jumpToHash = (promise) => {
  const y = window.scrollY
  return promise.then(() => jumpToCurrentHash_ifNoScroll(y))
}

const LoadingOrButton = ({loading, Button}) => {
  let result
  if (loading) {
    result = <a className='dark'>{Button.props.children}</a>
  } else {
    result = Button
  }
  //wrapping in <span> maintains the position of the element so that the real-time extension's subscribe button is always added to the end
  return <span>{result}</span>
}


const Button_noHref = ({onClick, children}) => {
  return <a className='pointer' onClick={onClick}>{children}</a>
}

export const AuthorFocus = connect(({thisCommentHash, text = 'author-focus', addIcon = false, ...props}) => {
  return <PreserveButton {...props} {...{text, addIcon}} forceUrlUpdate={false}
    beforeFunc={() => {
      return props.global.resetFilters('thread', {categoryFilter_author: props.author})
      .then(() => {
        if (thisCommentHash) {
          jumpToHash(thisCommentHash)
        }
      })
    }}
  />
})

const PreserveButton = connect(({global, post, author, deleted, loading, setLocalLoading,
                                 text = 'preserve', addIcon = true, beforeFunc = () => Promise.resolve(),
                                 forceUrlUpdate = true, userPageSort, userPageTime,
                                }) => {
  if (deleted || ! validAuthor(author)) {
    return null
  }
  // per https://stackoverflow.com/questions/55647287/how-to-send-request-on-click-react-hooks-way/55647571#55647571
  const isMounted = useRef(true)
  useEffect(() => {
    return () => {
      isMounted.current = false
    }
  }, [])

  return (
    <LoadingOrButton loading={loading} Button={
      <Button_noHref onClick={() => {
        const stateUpdate_promise = beforeFunc()
        const {add_user, itemsLookup, threadPost, items, commentTree, alreadySearchedAuthors} = global.state
        if (forceUrlUpdate || (! alreadySearchedAuthors[author] && ! localAlreadySearchedAuthors[author])) {
          setLocalLoading(true)
          localAlreadySearchedAuthors[author] = true
          // the idea of setting userPageSort to something other than 'new' here is, if the thread is old and the comment's score is high or low,
          // then maybe the score of a removed comment from the same author is high/low, so change sort to 'top' or 'controversial'
          const aui = new AddUserItem({author, sort: userPageSort, time: userPageTime})
          aui.query().then(userPage => getUserCommentsForPost(post, itemsLookup, [userPage]))
          .then(async ({user_comments, newComments}) => {
            const {new_commentTree, new_add_user} = await addUserComments_updateURL_createTreeIfNeeded({
              user_comments, itemsLookup, add_user, threadPost, newComments, items, commentTree, userPageSort, userPageTime})
            let add_user_for_preserve
            if (forceUrlUpdate) {
              // passing an empty itemsLookup allows the url to update even when removed or new comments are not found
              // this reruns one of the functions encapsulated above but it's short and only happens when user clicks
              ({new_add_user: add_user_for_preserve} = addUserComments_and_updateURL(user_comments, {}, new_add_user || add_user, userPageSort, userPageTime))
            }
            copyToClipboard(window.location.href)
            if (isMounted.current) {
              await setLocalLoading(false)
            }
            await stateUpdate_promise
            const final_add_user = add_user_for_preserve || new_add_user || add_user
            const final_commentTree = new_commentTree || commentTree
            if (final_add_user !== add_user || final_commentTree !== commentTree) {
              global.setSuccess({add_user: final_add_user,
                                 commentTree: final_commentTree})
            }
          })
          .catch((e) => {
            console.error(e)
            global.setError()
          })
        }
      }}>{text}{addIcon && <> <RestoreIcon wh='12' fill={loading ? '#4c4949': '#828282'}/></>}
      </Button_noHref>}
    />)
})


export default Comment
