import React, {useContext} from 'react'
import { Link } from 'react-router-dom'
import Post from 'pages/common/Post'
import Comment from 'pages/common/Comment'
import LoadLink from './LoadLink'
import Notice from 'pages/common/Notice'
import Selections from 'pages/common/selections'
import scrollToElement from 'scroll-to-element'
import { connect, removedFilter_types } from 'state'
import Time from 'pages/common/Time'
import { withFetch } from 'pages/RevdditFetcher'
import { SimpleURLSearchParams, copyLink, get, put, PATH_STR_SUB } from 'utils'
import Highlight from 'pages/common/Highlight'
import ModalContext from 'contexts/modal'
import { Spin } from 'components/Misc'
import { NewWindowLink } from 'components/Misc'

const hidePinPostNotice_var = 'hidePinPostNotice'
export const pinPostLink = '/user/me/submit?title=See+which+comments+of+yours+have+been+removed&url=https%3A%2F%2Fwww.reveddit.com%2Fabout%2F'

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
        } = global.state
  let loadAllLink = '', nextLink = '', pagesLoaded = ''
  let error = '', status = '', instructionalNotice = '', removedCommentsLink = ''
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
    if (! after && userNext) {
      loadAllLink = <LoadLink user={user}
                     kind={kind}
                     loadAll={true}/>
    }
  }
  if (loading) {
    nextLink = <Spin/>
  } else if (userNext) {
    nextLink = <div className='non-item'>
      <LoadLink user={user}
       kind={kind}
       loadAll={false}/></div>
  } else if (userIssueDescription) {
    error = <div className='non-item text' dangerouslySetInnerHTML={{ __html: user +' '+ userIssueDescription }}></div>
  }
  if (items.length) {
    pagesLoaded = <React.Fragment>
                    <div id='pagesloaded' className='non-item text' data-pagesloaded={num_pages}>loaded pages {`${num_pages}/${totalPages}`}</div>
                  </React.Fragment>
  } else if (! loading) {
    status = <p>No comments or posts were found.</p>
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
    instructionalNotice = <Notice message="Sorting by top may show more results."
      htmlLink={<a href={'?sort=top&all=true'}>sort by top</a>}
    />
  } else if (! hasVisitedSubredditPage) {
    instructionalNotice = <Notice message="Subreddit pages work too."
      htmlLink={<Link to={PATH_STR_SUB+'/'}>view a subreddit</Link>}
    />
  } else if (! hasClickedRemovedUserCommentContext) {
    instructionalNotice = <Notice message={
      <div><span className="quarantined">Tip</span> The context links of removed comments now show the comment in context even if the comment was not archived.</div>
    }/>
  } else if (! get(hidePinPostNotice_var, false)) {
    instructionalNotice = <Notice title='share reveddit'
      htmlLink={<div><NewWindowLink old={true} reddit={pinPostLink} onClick={() => dismiss()}>create a post</NewWindowLink>, then select <a className='pointer' onClick={() => modal.openModal({content: <img style={{marginTop: '20px'}}src='/images/pin-profile.png'/>})}>pin to profile</a></div>}/>
  }
  if (removedCommentIDs.length > 0) {
    removedCommentsLink = '/api/info?id='+removedCommentIDs.join(',')
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
            <Notice message={<>Some comments have been removed. To view that on reddit, open <NewWindowLink reddit={removedCommentsLink}>this link</NewWindowLink> in an incognito window or while logged out. Note: <Link to='/about/faq/#user-deleted'>user-deleted content</Link> does not appear on reveddit.</>}
              htmlLink={<NewWindowLink reddit={removedCommentsLink}>view removed comments on reddit</NewWindowLink>}
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
          {error}
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
