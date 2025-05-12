import React from 'react'
import { Link } from 'react-router-dom'
import Post from 'pages/common/Post'
import Comment from 'pages/common/Comment'
import LoadLink from './LoadLink'
import {Notice, TipWithBackground} from 'pages/common/Notice'
import { connect } from 'state'
import { withFetch } from 'pages/RevdditFetcher'
import { SimpleURLSearchParams, copyLink, get, put, PATH_STR_SUB, getCustomClientID } from 'utils'
import Highlight from 'pages/common/Highlight'
import ModalContext from 'contexts/modal'
import { Spin, RedditOrLocalLink } from 'components/Misc'
import { NewWindowLink } from 'components/Misc'
import {pinPostLink} from 'pages/about/faq'

const hidePinPostNotice_var = 'hidePinPostNotice'

const dismiss = () => {
  put(hidePinPostNotice_var, true)
  return true
}

const User = ({match, global, page_type, viewableItems, selections, summary, notShownMsg}) => {
  const { user, kind = ''} = match.params
  const modal = React.useContext(ModalContext)
  const queryParams = new SimpleURLSearchParams(window.location.search)
  const {userNext, num_pages, loading, userIssueDescription, items, show, after,
         hasVisitedUserPage_sortTop, hasVisitedSubredditPage, hasClickedRemovedUserCommentContext,
         error,
        } = global.state
  let loadAllLink = '', nextLink = '', pagesLoaded = ''
  let errorMessage = '', status = '', instructionalNotice = '', removedCommentsLink = ''
  let totalPages = 10
  let selectedItems = null
  if (! userNext) {
    totalPages = num_pages
  }

  let linkToRestOfComments = ''
  if (! queryParams.get('after') && ! queryParams.get('limit') && queryParams.get('show')) {
    linkToRestOfComments = window.location.pathname + (new SimpleURLSearchParams(window.location.search)).delete('show')
    selectedItems = queryParams.get('show').split(',')
  }
  if (! loading) {
    if (! after && userNext && ! error) {
      loadAllLink = <LoadLink user={user}
                     kind={kind}
                     loadAll={true}/>
    }
  }
  if (loading) {
    nextLink = <Spin/>
  } else {
    if (userNext) {
      nextLink = <div className='non-item'>
        <LoadLink user={user}
        kind={kind}
        loadAll={false}/></div>
    }
    if (userIssueDescription) {
      let message
      if (userIssueDescription.toLowerCase().startsWith('error')) {
        message = userIssueDescription
      } else if (userIssueDescription.includes('shadowbanned')) {
        const deleted_txt = userIssueDescription.includes('deleted') ? " deleted or ": ""
        message = <>
          <p>{`${user} may be ${deleted_txt}shadowbanned. `}</p>
          <p>Verify the URL, or check account status at <RedditOrLocalLink reddit={`/user/${user}`} rel="noopener">/u/{user}</RedditOrLocalLink> or <RedditOrLocalLink reddit="/r/ShadowBan" rel="noopener">/r/ShadowBan</RedditOrLocalLink>.</p>
        </>
      } else {
        message = `${user} ${userIssueDescription}`
      }
      let suffix = <></>
      if (userIssueDescription.toLowerCase().includes('too many requests')) {
        let api_key_message = ''
        if (! getCustomClientID()) {
          api_key_message = <> or <Link to="#settings" onClick={() => modal.openModal({hash:'settings'})}>setup an API key</Link></>
        }
        suffix = <>. Try again in 5 minutes{api_key_message}.</>
      }
      errorMessage = <div className='centered-note non-item text'><span>{message}{suffix}</span></div>
    }
  }
  if (items.length) {
    pagesLoaded = <React.Fragment>
                    <div id='pagesloaded' className='non-item text' data-pagesloaded={num_pages}>loaded pages {`${num_pages}/${totalPages}`}</div>
                  </React.Fragment>
  } else if (! loading && ! error) {
    status = <p>Error loading data.</p>
  }

  const shownItems = []
  const removedCommentIDs = []
  const constantProps = {page_type, kind}
  viewableItems.forEach(item => {
    if (! selectedItems || (selectedItems && selectedItems.includes(item.name))) {
      if (item.name.slice(0,2) === 't3') {
        shownItems.push(<Post key={item.name} {...constantProps} {...item} />)
      } else {
        shownItems.push(<Comment key={item.name} {...constantProps} {...item} />)
        if (item.removed) {
          removedCommentIDs.push(item.name)
        }
      }
    }
  })
  const shareLink = window.location.pathname.replace(/^\/user/,'/y')+window.location.search+window.location.hash

  if (! hasVisitedUserPage_sortTop) {
    instructionalNotice = <TipWithBackground message="Sorting by top may show more results."
      htmlLink={<a href={'?sort=top&all=true'}>sort by top</a>}
    />
  } else if (! hasClickedRemovedUserCommentContext) {
    instructionalNotice = <TipWithBackground message="The context links of removed comments now show the comment in context even if the comment was not archived."/>
  } else if (! get(hidePinPostNotice_var, false)) {
    instructionalNotice = <Notice title='share reveddit'
      htmlLink={<div><NewWindowLink old={true} reddit={pinPostLink} onClick={() => dismiss()}>create a post</NewWindowLink>, then select <a className='pointer' onClick={() => modal.openModal({content: <img style={{marginTop: '20px'}}src='/images/pin-profile.png'/>})}>pin to profile</a></div>}/>
  } else if (! hasVisitedSubredditPage) {
    instructionalNotice = <TipWithBackground message="Subreddit pages may summarize removal history prior to 2021/06."
      htmlLink={<Link to={PATH_STR_SUB+'/'}>view a subreddit</Link>}
    />
  }
  if (removedCommentIDs.length > 0) {
    removedCommentsLink = '/api/info?id='+removedCommentIDs.slice(0,100).join(',')
  }
  const createRemovedCommentsLink = (text) => {
    return <NewWindowLink old={true} reddit={removedCommentsLink}>{text}</NewWindowLink>
  }
  return (
    <>
      <div className='userpage'>
        <div className='top'>
          <div className='top-selections'>
            <div id="buttons-right">
              <div><a href={shareLink} onClick={(e) => copyLink(e, true)}>copy sharelink</a></div>
              <div>{loadAllLink}</div>
            </div>
            {selections}
            {summary}
          </div>
          <Highlight/>
          {instructionalNotice}
          {notShownMsg}
          { removedCommentsLink &&
            <Notice message={<>Some comments have been removed. To view that on reddit, open {createRemovedCommentsLink('this link')} in an incognito window or while logged out. Note: <Link to='/about/faq/#user-deleted'>user-deleted content</Link> does not appear on reveddit.</>}
              htmlLink={createRemovedCommentsLink('view removed comments on reddit')}
            />
          }
          {selectedItems &&
            <Notice message="showing selected items."
              htmlLink={<Link to={linkToRestOfComments}>view all items</Link>}
            />
          }
          {
            shownItems
          }
          {errorMessage}
          {status}
        </div>
        <div className='footer'>
          {pagesLoaded}
          {nextLink}
        </div>
      </div>
    </>
  )
}


export default connect(withFetch(User))
