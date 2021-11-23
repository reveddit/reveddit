import React, {useState, useEffect, useRef} from 'react'
import {ifNumParseInt, isCommentID, validAuthor, now,
        formatBytes, getPrettyTimeLength, normalizeTextForComparison,
        time_is_in_archive_storage_window, commentIsRemoved,
} from 'utils'
import {connect, urlParamKeys, create_qparams_and_adjust, updateURL} from 'state'
import { kindsReverse, queryUserPage } from 'api/reddit'
import { getWaybackComments } from 'api/reveddit'
import { Spin, QuestionMarkModal, Help, NewWindowLink, ModalWithButton, buttonClasses } from 'components/Misc'
import { copyFields, initializeComment, retrieveRedditComments_and_combineWithPushshiftComments } from 'data_processing/comments'
import { createCommentTree } from 'data_processing/thread'
import { RestoreIcon } from 'pages/common/svg'
import { getAuth } from 'api/reddit/auth'
import { getCommentsByThread as getPushshiftCommentsByThread } from 'api/pushshift'
import { unarchived_label_text } from 'pages/common/RemovedBy'
import { EXCLUDE_UNARCHIVED_REGEX } from 'pages/common/selections/TextFilter'

const MAX_AUTHORS_NEARBY_BY_DATE = 5
const MAX_AUTHORS_TO_SEARCH = 15

const ONE_MONTH_IN_SECONDS = 30*60*60*24
const ONE_YEAR_IN_SECONDS = 365*60*60*24
const MAX_TIME_FOR_NEW_SORT = 5*ONE_MONTH_IN_SECONDS
const MAX_SCORE_FOR_NEW_SORT = 5

const RESTORE_ALL_MS_PER_AUTHOR_QUERY = 1500
const MS_BETWEEN_AUTHOR_QUERIES = RESTORE_ALL_MS_PER_AUTHOR_QUERY*MAX_AUTHORS_NEARBY_BY_DATE

export const get_userPageSortAndTime = ({created_utc, score, controversiality}) => {
  let userPageSort = 'new', userPageTime = ''
  const created_seconds_ago = now - created_utc
  if (created_seconds_ago > MAX_TIME_FOR_NEW_SORT) {
    if (score < 2 || controversiality > 0) {
      userPageSort = 'controversial'
    } else if (score >= MAX_SCORE_FOR_NEW_SORT) {
      userPageSort = 'top'
    }
    if (userPageSort !== 'new' && created_seconds_ago < ONE_YEAR_IN_SECONDS) {
      userPageTime = 'year'
    }
  }
  return {userPageSort, userPageTime}
}

const addAuthorIfExists = (comment, set, alreadySearchedAuthors) => {
  if (comment && validAuthor(comment.author) && ! alreadySearchedAuthors[comment.author]) {
    set.add(comment.author)
  }
}

export const unarchived_search_button_word = 'Restore'
const unarchived_search_button_word_plus_all = unarchived_search_button_word + ' All'
const code_button = <code>{unarchived_search_button_word_plus_all}</code>
export const unarchived_search_button_word_code = <code>{unarchived_search_button_word}</code>

export const unarchived_search_see_more = <>
  See <NewWindowLink reddit={'/r/removeddit/comments/hy5z7g/_/g4xlrne/'}>search for unarchived comments</NewWindowLink> and <NewWindowLink reddit='/ih86wk'>{unarchived_label_text}</NewWindowLink> for more information.
</>

export const unarchived_search_help_content = (
  <>
    <p>Clicking {unarchived_search_button_word_code} searches for unarchived comments, adds them if they are found, and updates the URL to save their location so the results can be shared. Comments restored in this manner come from /user pages and are labeled <code>{unarchived_label_text}</code>.</p>
    <p>Note, this works best when the page loads from a link to all comments rather than a specific comment. If a page loads from a direct link to a comment, then some authors may not be visible to the search process.</p>
    <p>Restoring comments is useful because sometimes the archive service, called "Pushshift", does not archive data in time. If something is removed before it can be archived then it can only be found on the author's /user page. To find it you need to know the author first. Reveddit can search /user pages of nearby authors, such as the grandparent comment's author, to fill in some of these comments.</p>
    <p>Clicking {unarchived_search_button_word_code} performs this search once for a group of users who have successfully commented in the thread. If there is no result after the first click, clicking more times may yield a result.
       Clicking <code>author-focus</code>, <code>op-focus</code>, or <code>preserve</code> automatically searches for missing comments from the given author.</p>
    <p>Some new comments that can only be found on user pages may appear.
       This happens when a comment has not yet been archived and it has no replies, since
       removed comments that have no replies do not appear in Reddit's comment tree API.
    </p>
    <p>{unarchived_search_see_more}</p>
  </>
)

const search_comment_help = <Help title={unarchived_search_button_word+' Comment'} content={unarchived_search_help_content}/>

const Wrap = ({children}) => <div style={{padding: '8px 0', minHeight: '25px'}}>{children}</div>

export const getAddUserMeta = (props, distance_input, userPageSort, userPageTime, state = {}) => {
  const {itemsLookup, alreadySearchedAuthors, threadPost,
   itemsSortedByDate} = props.global?.state || state
   const grandparentComment = getAncestor(props, itemsLookup, 2)
   const grandchildComment = ((props.replies[0] || {}).replies || [])[0] || {}
   // START nearby authors
   const authors_nearbyByDate = new Set()
   let distance = distance_input
   if (itemsSortedByDate.length > 1 && 'by_date_i' in props) {
     const comment_i = props.by_date_i
     while (authors_nearbyByDate.size < MAX_AUTHORS_NEARBY_BY_DATE) {
       distance += 1
       addAuthorIfExists(itemsSortedByDate[comment_i - distance], authors_nearbyByDate, alreadySearchedAuthors)
       if (authors_nearbyByDate.size < MAX_AUTHORS_NEARBY_BY_DATE) {
         addAuthorIfExists(itemsSortedByDate[comment_i + distance], authors_nearbyByDate, alreadySearchedAuthors)
       }
       if (   (comment_i+distance+1) >= itemsSortedByDate.length
           && (comment_i-distance-1) < 0) {
         break
       }
     }
   }
   // END nearby authors
   const aug = new AddUserGroup({alreadySearchedAuthors, sort: userPageSort, time: userPageTime})
   //NOTE: Some previous logic here would search users found in add_user param.
   //      Removed this because it messed up rate limiting and was not likely to turn up new results
   //TODO:  breadth first search for grandchildren
   aug.add(grandparentComment.author,
           grandchildComment.author,
           threadPost.author,
           ...Array.from(authors_nearbyByDate),
          )
  return {aug, distance}
}

const RestoreComment = (props) => {
  const [localLoading, setLocalLoading] = useState(false)
  const [meta, setMeta] = useState({distance: 0, aug: null})
  const [searchAll, setSearchAll] = useState(false)
  const [archiveSearched, setArchiveSearched] = useState(false)
  const [waybackSearched, setWaybackSearched] = useState(false)

  let searchButton = ''
  const {global, id, created_utc, score, controversiality, retrieved_on, link_id} = props
  const {itemsLookup, alreadySearchedAuthors, threadPost,
         itemsSortedByDate, add_user, authors:globalAuthors,
         loading: globalLoading, items, commentTree, initialFocusCommentID,
         archiveTimes, add_user_on_page_load, ps_after,
        } = global.state

  const loading = localLoading || globalLoading
  const get_userPageSortAndTime_this = () => get_userPageSortAndTime({created_utc, score, controversiality})
  const isMounted = useRef(true)
  useEffect(() => {
    return () => {
      isMounted.current = false
    }
  }, [])
  const stopLocalLoading = async () => {
    if (isMounted.current) {
      return setLocalLoading(false)
    }
  }

  useEffect(() => {
    if (! loading) {
      const {userPageSort, userPageTime} = get_userPageSortAndTime_this();
      setMeta(getAddUserMeta(props, meta.distance, userPageSort, userPageTime))
    }
  // the result of this effect changes each time it runs b/c the output is used as input (distance)
  // it should only run once per comment per search
  // do not add 'add_user' as a dependency: it causes a separate state update
  }, [JSON.stringify(alreadySearchedAuthors), globalLoading])
  const countRemaining = ({alreadySearchedAuthors}) => Object.keys(global.state.authors).length - Object.keys(alreadySearchedAuthors).length
  useEffect(() => {
    let isCancelled = false
    if (searchAll) {
      const searchAllLoop = async () => {
        const {userPageSort, userPageTime} = get_userPageSortAndTime_this()
        let meta_var = meta
        let numRemaining = countRemaining(global.state)
        setLocalLoading(true)
        let needToSetSuccess = false
        // either numRemaining > 0 or meta_var.aug.length() > 0 would be enough without the other.
        // doing both in case to avoid bugs causing an infinite loop
        while (! isCancelled && numRemaining > 0 && meta_var.aug.length() > 0) {
          const start = new Date().getTime()
          const state = await searchFromMeta(meta_var)
          numRemaining = countRemaining(state)
          meta_var = getAddUserMeta(props, meta_var.distance, userPageSort, userPageTime)
          if (numRemaining > 0 && meta_var.aug.length() > 0) {
            needToSetSuccess = true
            await global.setLoading('', state)
            const elapsed = (new Date().getTime() - start)
            if (elapsed < MS_BETWEEN_AUTHOR_QUERIES) {
              const sleep = MS_BETWEEN_AUTHOR_QUERIES - elapsed
              await new Promise(r => setTimeout(r, sleep))
            }
          } else {
            needToSetSuccess = false
            global.setSuccess(state)
          }
        }
        await stopLocalLoading()
        if (needToSetSuccess) {
          await global.setSuccess()
        }
      }
      searchAllLoop()
    }
    return () => {
      isCancelled = true
    }
  }, [searchAll])

  const searchFromMeta = async (meta) => {
    const {alreadySearchedAuthors, add_user} = global.state
    const {userPageSort, userPageTime} = get_userPageSortAndTime_this()
    const {authors, promises} = await meta.aug.query()
    const {user_comments, newComments} = await Promise.all(promises).then(
      getUserCommentsForPost.bind(null, threadPost, itemsLookup))
    Object.assign(alreadySearchedAuthors, authors)
    const {new_commentTree, new_add_user} = await addUserComments_updateURL_createTreeIfNeeded({
      user_comments, itemsLookup, add_user, threadPost, newComments, items, commentTree, userPageSort, userPageTime})
    return {
      alreadySearchedAuthors,
      add_user: new_add_user || add_user,
      commentTree: new_commentTree || commentTree
    }
  }
  const comment_age_in_seconds = now - created_utc
  const ps_after_list = ps_after ? ps_after.split(',') : []
  const this_query_ps_after = (created_utc - 1).toString()
  const canRunArchiveSearch = (
      ! archiveSearched
      && ! retrieved_on
      // comment overwrites began some time prior to 1630649330
      && (created_utc < 1630649330 || time_is_in_archive_storage_window(created_utc, archiveTimes))
      && ! ps_after_list.includes(this_query_ps_after))
  const canRunWaybackSearch = ! waybackSearched && comment_age_in_seconds > 172800 // 2 days
  const search = async () => {
    let state = {}
    await setLocalLoading(true)
    const targetNotFound = () => (! itemsLookup[id] || commentIsRemoved(itemsLookup[id]))
    // ! retrieved_on means it hasn't been looked up in the archive yet
    if (canRunArchiveSearch) {
      const {comments: pushshiftComments} = await getPushshiftCommentsByThread(threadPost.id, this_query_ps_after)
      let new_ps_after = ps_after
      for (const c of Object.values(pushshiftComments)) {
        const currentCommentState = itemsLookup[c.id]
        if (! currentCommentState || commentIsRemoved(currentCommentState) && ! commentIsRemoved(c)) {
          new_ps_after = global.get_updated_ps_after(this_query_ps_after)
          break
        }
      }
      // only need to update global state if new data was found.
      if (new_ps_after != ps_after) {
        // updateArchiveComments retrieves reddit comments, which is not necessary, but simplifies code
        // b/c it reuses existing logic for state update and commentTree creation.
        // Recreating commentTree b/c loading more archive comments may reveal more 'missing parent' IDs
        const new_commentTree = await updateArchiveComments(
          {archiveComments: pushshiftComments, itemsLookup, items, threadPost, commentTree, authors: globalAuthors})
        state = {commentTree: new_commentTree || commentTree,
                 itemsLookup, items, authors: globalAuthors,
                 ps_after: new_ps_after,
                 add_user_on_page_load: add_user_on_page_load+1, // triggers re-render
                }
      }
      setArchiveSearched(true)
    }
    if (targetNotFound() && canRunWaybackSearch) {
      const known_removed_ids = []
      for (const c of Object.values(itemsLookup)) {
        if (c.score !== 1 && commentIsRemoved(c) && c.id !== id) {
          known_removed_ids.push(c.id)
        }
      }
      const comments = await getWaybackComments({
        link_id: link_id.substr(3),
        ids: [id],
        known_removed_ids,
      })
      if (Object.keys(comments).length) {
        for (const [id, comment] of Object.entries(comments)) {
          Object.assign(itemsLookup[id], comment)
          itemsLookup[id].archive_processed = true
        }
        state = {
          itemsLookup,
          add_user_on_page_load: add_user_on_page_load+1, // triggers re-render
        }
      }
      setWaybackSearched(true)
    }
    if (targetNotFound()) {
      state = await searchFromMeta(meta)
    }
    await setLocalLoading(false)
    return global.setSuccess(state)
  }

  //states:
  //  loading && needToFindAuthors (! aug) => show spin
  //  loading && ! needToFindAuthors (aug)
  //     hasAuthors => show spin
  //     noAuthors => show nothing
  //  ! loading && hasAuthors => show button
  //  ! loading && noAuthors => show nothing
  const numAuthorsRemaining = countRemaining({alreadySearchedAuthors})
  const timeRemaining = getPrettyTimeLength(numAuthorsRemaining*(RESTORE_ALL_MS_PER_AUTHOR_QUERY/1000), true)
  // Check for > 0 b/c globalAuthors is not populated until end of page load
  const numAuthorsRemainingDiv = (
    numAuthorsRemaining > 0 ?
      <div style={{marginTop:'10px'}}>
        <span> ({numAuthorsRemaining.toLocaleString()} users left{loading && searchAll ? <>, {timeRemaining}</> : <></>})</span>
      </div>
    : <></>
  )
  if (loading) {
    const cancel = searchAll ? <a className={buttonClasses} style={{marginLeft:'5px'}} onClick={() => setSearchAll(false)}>cancel</a> : <></>
    if (! meta.aug || meta.aug.length()) {
      searchButton = <Wrap><Spin width='20px'/>{cancel}{numAuthorsRemainingDiv}</Wrap>
    }
  } else if ((meta.aug?.length() && numAuthorsRemaining)
            || canRunArchiveSearch || canRunWaybackSearch) {
    searchButton = (
      <Wrap>
        <div>
          <a className={buttonClasses} onClick={search}><RestoreIcon/> {unarchived_search_button_word}</a>
          <QuestionMarkModal modalContent={{content:search_comment_help}} fill='white'/>
        </div>
        <div style={{marginTop: '10px'}}>
          {numAuthorsRemaining ?
            <>
              <>{numAuthorsRemainingDiv}</>
              <BodyButton>
                <ModalWithButton text={unarchived_search_button_word_plus_all} title='WARNING'
                  buttonText={unarchived_search_button_word_plus_all}
                  buttonFn={() => setSearchAll(true)}>
                  <>
                    <p>{code_button} searches every known commenter's last 100 comments for this comment. It may use excessive bandwidth. Estimated usage for {numAuthorsRemaining} user queries:</p>
                    <ul>
                      <li>{formatBytes(30720*numAuthorsRemaining)}</li>
                      <li>{timeRemaining}</li>
                    </ul>
                    {comment_age_in_seconds > ONE_MONTH_IN_SECONDS ?
                      <p>This comment is {getPrettyTimeLength(comment_age_in_seconds)} old. It may not be recoverable if it is no longer among the author's most recent 100 comments.</p>
                      : <></>}
                    <p>{initialFocusCommentID ?
                      <>This page was loaded through a comment's direct link. Loading the <a href={window.location.pathname.split('/',6).join('/')+'/'+ window.location.search + '#t1_' + id}>full comments page</a> first may yield more results. </>
                      : <></>
                    }To continue, click {code_button}.</p>
                  </>
                </ModalWithButton>
              </BodyButton>
            </>
          : <></>
          }
          <HideUnarchivedComments global={global}/>
        </div>
      </Wrap>
    )
  } else {
    searchButton = <HideUnarchivedComments global={global}/>
  }
  return searchButton
}

export const HideUnarchivedComments = ({global}) => {
  return <BodyButton>
    <a className='pointer' onClick={() => {
      global.selection_update('keywords', EXCLUDE_UNARCHIVED_REGEX, 'thread')
    }}>Hide Unarchived</a>
  </BodyButton>
}

//currently expects 1 child. use React.Children.map if a group is needed
const BodyButton = ({children}) => {
  return (
    <code style={{marginRight:'10px', wordBreak:'break-all'}}>
      {children}
    </code>
  )
}

class AddUserGroup {
  constructor({alreadySearchedAuthors = {}, max = MAX_AUTHORS_TO_SEARCH, sort, time} = {}) {
    this.alreadySearchedAuthors = alreadySearchedAuthors
    this.max = max
    this.sort = sort
    this.time = time
    this.authorsToSearch = {}
    this.itemsToSearch = []
  }
  length() {
    return this.itemsToSearch.length
  }
  getAlreadySearchedAuthors() {
    return this.alreadySearchedAuthors
  }
  add(...authors) {
    let allAdded = true
    for (const author of authors) {
      if (   validAuthor(author)
          && ! (author in this.alreadySearchedAuthors)
          && ! (author in this.authorsToSearch)
          && this.itemsToSearch.length < this.max) {
        this.itemsToSearch.push(new AddUserItem({author, kind: 'c', sort: this.sort, time: this.time}))
        this.authorsToSearch[author] = true
      } else {
        allAdded = false
      }
    }
    return allAdded
  }
  async query() {
    await getAuth()
    return {
      promises: this.itemsToSearch.map(i => i.query()),
      authors: this.authorsToSearch,
    }
  }
}

//AddUserItem represents properties used on thread pages to load data from a user page
const ADDUSERITEM_SEPARATOR = '.'
const ADDUSER_PROPS = ['author', 'limit', 'kind', 'sort', 'time', 'before', 'after']
export class AddUserItem {
  constructor({string = '', ...props}) {
    if (string) {
      this.setPropsFromString(string)
    } else {
      Object.assign(this, props)
      this.kind = kindsReverse[this.kind]
    }
  }
  getOrderedProps() {
    return ADDUSER_PROPS.map(p => this[p])
  }
  setPropsFromString(string) {
    const parts = string.split(ADDUSERITEM_SEPARATOR)
    for (let i = 0; i < parts.length; i++) {
      this[ADDUSER_PROPS[i]] = ifNumParseInt(parts[i])
    }
  }
  query() {
    return queryUserPage(this.author, this.kind || '', this.sort, this.before, this.after, this.time, this.limit || 100)
  }
  toString() {
    return this.getOrderedProps().join(ADDUSERITEM_SEPARATOR)
  }
}

const getAncestor = (props, itemsLookup, n) => {
  if (n === 0) {
    return props
  } else {
    const [type, id] = props.parent_id.split('_')
    const parent = itemsLookup[id]
    if (isCommentID(type) && parent) {
      return getAncestor(parent, itemsLookup, n-1)
    } else {
      return props
    }
  }
}

const ADDUSERPARAM_SEPARATOR = ','
export class AddUserParam {
  constructor({string, items} = {}) {
    if (string) {
      this.items = string.split(ADDUSERPARAM_SEPARATOR).map(i => new AddUserItem({string: i}))
    } else if (items) {
      this.items = items
    } else {
      this.items = []
    }
  }
  addItems(...items) {
    for (const item of items) {
      this.addItem(item)
    }
  }
  addItem(item) {
    if (item instanceof AddUserItem) {
      this.items.push(item)
    } else {
      this.items.push(new AddUserItem(item))
    }
  }
  getItems() {
    return this.items
  }
  getAuthors() {
    return this.items.map(i => i.author.toString())
  }
  toString() {
    if (this.items) {
      const itemKeys = this.items.map(i => i.toString())
      const uniqueItemKeys = [...new Set(itemKeys)]
      return urlParamKeys.add_user+'='+uniqueItemKeys.join(ADDUSERPARAM_SEPARATOR)
    }
    return ''
  }
}

const addUserFields = [
  'body', 'edited', 'author', 'author_fullname', 'author_flair_text',
  'is_op',
]
export const addUserComments = (user_comments, commentsLookup) => {
  const changed = [], changedAuthors = {}
  for (const user_comment of user_comments) {
    const comment = commentsLookup[user_comment.id]
    user_comment.from_add_user = true
    if (comment) {
      comment.also_in_add_user = true
      if (normalizeTextForComparison(comment.body) !== normalizeTextForComparison(user_comment.body)) {
        comment.from_add_user = true
        changed.push(user_comment)
        changedAuthors[user_comment.author] = user_comment
      }
      copyFields(addUserFields, user_comment, comment)
    } else {
      commentsLookup[user_comment.id] = user_comment
      changed.push(user_comment)
      changedAuthors[user_comment.author] = user_comment
    }
  }
  return {changed, changedAuthors}
}

const updateUrlFromChangedAuthors = (changedAuthors, add_user, userPageSort, userPageTime) => {
  if (Object.keys(changedAuthors).length) {
    const aup = new AddUserParam({string: add_user})
    for (const [author, comment] of Object.entries(changedAuthors)) {
      const item = new AddUserItem({author, kind: 'c',
                                    sort: userPageSort,
                                    time: userPageTime,
                                    ...(userPageSort === 'new' ? comment.before_after : {}),
                                  })
      const item_str = item.toString()
//      if (! add_user.match(new RegExp('(^|,)'+author+'\\b'))) {

      if (! add_user.includes(item_str)) {
        aup.addItem(item)
      }
    }
    const [paramName, value] = aup.toString().split('=')
    updateURL(create_qparams_and_adjust('', paramName, value))
    return value
  }
  return undefined
}

export const addUserComments_and_updateURL = (user_comments, itemsLookup, add_user, userPageSort = 'new', userPageTime = 'all') => {
  const {changed, changedAuthors} = addUserComments(user_comments, itemsLookup)
  const new_add_user = updateUrlFromChangedAuthors(changedAuthors, add_user, userPageSort, userPageTime)
  return {new_add_user, changed}
}

//existingIDs: IDs already looked up via api/info
//newComments: Comments found via user page that do not appear in existingIDs
export const getUserCommentsForPost = (post, existingIDs, userPages) => {
  const user_comments = []
  const newComments = {}
  for (const userPage of userPages) {
    const comments = userPage.items || []
    let last_comment, first_comment
    const this_user_this_link_comments = []
    for (const [i, c] of comments.entries()) {
      if (i > 0) {
        c.prev = comments[i-1].name
      }
      if ((i+1) < comments.length) {
        c.next = comments[i+1].name
      }
      if (post.name === c.link_id) {
        initializeComment(c, post)
        user_comments.push(c)
        this_user_this_link_comments.push(c)
        if (! (c.id in existingIDs)) {
          newComments[c.id] = c
        }
        if (! first_comment) {
          first_comment = c
        }
        last_comment = c
      }
    }
    if (last_comment) {
      const before = last_comment.next || ''
      const after = first_comment.prev || ''
      const before_after = before ? {before} : {after}
      for (const c of this_user_this_link_comments) {
        c.before_after = before_after
      }
    }
  }
  return {user_comments, newComments}
}

const updateArchiveComments = async ({archiveComments, itemsLookup, items, threadPost, commentTree, authors = {}}) => {
  let new_commentTree
  if (Object.keys(archiveComments).length) {
    const combinedComments = await retrieveRedditComments_and_combineWithPushshiftComments(archiveComments)
    for (const comment of Object.values(combinedComments)) {
      itemsLookup[comment.id] = comment
      if (! itemsLookup[comment.id]) {
        items.push(comment)
      }
      authors[comment.author] = comment.author_fullname
    }
    //itemsSortedByDate could also be resorted here to get accurate time summary
    //but it's not worth the cost for large threads
    const rootCommentID = window.location.pathname.split('/')[6] ? commentTree[0].id : undefined
    new_commentTree = createCommentTree(threadPost.id, rootCommentID, itemsLookup)[0]
  }
  return new_commentTree
}

export const addUserComments_updateURL_createTreeIfNeeded = async ({user_comments, itemsLookup, add_user,
  threadPost, newComments, items, commentTree, userPageSort, userPageTime}) => {
  const {new_add_user} = addUserComments_and_updateURL(user_comments, itemsLookup, add_user, userPageSort, userPageTime)
  const new_commentTree = await updateArchiveComments({archiveComments: newComments, itemsLookup, items, threadPost, commentTree})
  return {new_add_user, new_commentTree}
}



export default connect(RestoreComment)
