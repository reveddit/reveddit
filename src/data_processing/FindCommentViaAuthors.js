import React from 'react'
import {ifNumParseInt, isCommentID, validAuthor} from 'utils'
import {connect, urlParamKeys, create_qparams_and_adjust, updateURL} from 'state'
import { kindsReverse, queryUserPage } from 'api/reddit'
import { Spin } from 'components/Misc'
import { copyFields } from 'data_processing/comments'

const FindCommentViaAuthors = (props) => {
  const search = async (targetComment) => {
    props.global.setLoading()
    const {itemsLookup, alreadySearchedAuthors} = props.global.state
    let {add_user} = props.global.state
    const grandparentComment = getAncestor(props, itemsLookup, 2)
    const grandchildComment = ((props.replies[0] || {}).replies || [])[0] || {}

    //TODO: find and sort authors
    //PREREQ: sort all comments by date
    // grandparent, grandchild, any author in URL Param, OP, highest karma
           // only add these for search *if they are not in alreadySearchedAuthors*
    // authors who commented around the same time anywhere in the thread
    // is_mod LAST
    //const {grandparentAuthor, grandchildAuthors, urlParamAuthors} = scanAuthors()
    const aug = new AddUserGroup({alreadySearchedAuthors})
    aug.add(grandparentComment.author, grandchildComment.author)

    const {authors, promises} = aug.query()
    const {user_comments, newIDs} = await Promise.all(promises).then(
      getUserCommentsForPost.bind(null, props.link_id, itemsLookup))
    Object.assign(alreadySearchedAuthors, authors)
    //TODO: if there are newIDs:
    //   combinePushshiftAndRedditComments - only the new ones
    //   add the new ones to itemsLookup
    //   createCommentTree - or make another version that only add new items
    if (Object.keys(newIDs).length) {
      // console.log('comment tree must be updated')
    }
    const {changed, changedAuthors} = addUserComments(user_comments, itemsLookup)
    if (changedAuthors.length) {
      const aup = new AddUserParam({string: add_user})
      aup.addItems(...changedAuthors.map(author => ({author, kind: 'c', sort: 'new'})))
      const [paramName, value] = aup.toString().split('=')
      updateURL(create_qparams_and_adjust('', paramName, value))
      add_user = value
    }
    //TODO: set AddUserParam
    // PREREQ: a lookup for all userPage data showing the order
    // sort changed by author, created_utc asc
    // for each author, find first and last comment for the thread
    // set before/after using prev/next comment from that author
    //      (note: Need a lookup for all userPage data)
    // unlikely worst case: the 1st and 100th comment in user history is in the same thread
    //        in that case: can set two params for the same user
    //                  or: single comment (set no before/after)

    //TODO: If failed for clicked item, change messaging
    //         authors remain: try again
    //      no authors remain: remove button
    props.global.setSuccess({alreadySearchedAuthors, add_user})
  }
  return(
    <div style={{padding: '15px 0', minHeight: '25px'}}>
      {props.global.state.loading ?
        <Spin width='20px'/>
        : <a className='pointer bubble big lightblue' onClick={search}
          >search for comment via nearby users</a>}
    </div>)
}

class AddUserGroup {
  constructor({alreadySearchedAuthors = {}, max = 10} = {}) {
    this.alreadySearchedAuthors = alreadySearchedAuthors
    this.max = max
    this.authorsToSearch = {}
    this.itemsToSearch = []
  }
  getAlreadySearchedAuthors() {
    return this.alreadySearchedAuthors
  }
  add(...authors) {
    let allAdded = true
    for (const author of authors) {
      if (validAuthor(author) && ! (author in this.alreadySearchedAuthors) && this.itemsToSearch.length < this.max) {
        this.itemsToSearch.push(new AddUserItem({props: {author, kind: 'c', sort: 'new'}}))
        this.authorsToSearch[author] = true
      } else {
        allAdded = false
      }
    }
    return allAdded
  }
  query() {
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
  constructor({string = '', props}) {
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
    for (const props of items) {
      this.items.push(new AddUserItem({props}))
    }
  }
  getItems() {
    return this.items
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

const addUserFields = ['body', 'edited', 'author', 'author_fullname']
export const addUserComments = (user_comments, commentsLookup) => {
  const changed = [], changedAuthors = {}
  for (const user_comment of user_comments) {
    const comment = commentsLookup[user_comment.id]
    if (comment) {
      if (comment.body !== user_comment.body) {
        changed.push(user_comment)
        changedAuthors[user_comment.author] = 1
      }
      copyFields(addUserFields, user_comment, comment)
    } else {
      commentsLookup[user_comment.id] = user_comment
      changed.push(user_comment)
      changedAuthors[user_comment.author] = 1
    }
  }
  return {changed, changedAuthors: Object.keys(changedAuthors)}
}

//existingIDs: IDs already looked up via api/info
//newIDs: IDs found via user page that do not appear in existingIDs
export const getUserCommentsForPost = (link_id, existingIDs, userPages) => {
  const user_comments = []
  const newIDs = {}
  for (const userPage of userPages) {
    const comments = userPage.items || []
    for (const c of comments) {
      if (link_id === c.link_id) {
        user_comments.push(c)
        if (! (c.id in existingIDs)) {
          newIDs[c.id] = 1
        }
      }
    }
  }
  return {user_comments, newIDs}
}


export default connect(FindCommentViaAuthors)
