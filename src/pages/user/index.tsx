import React from 'react'
import { Link } from 'react-router-dom'
import Post from 'components/common/Post'
import Comment from 'components/comment/Comment'
import LoadLink from './LoadLink'
import { Notice, TipWithBackground } from 'components/common/Notice'
import { withFetch } from 'components/RevdditFetcher'
import { SimpleURLSearchParams, get, put, PATH_STR_SUB } from 'utils'
import Highlight from 'components/common/Highlight'
import ModalContext from 'contexts/modal'
import { Spin } from 'components/Misc'
import {
  RedditOrLocalLink,
  NewWindowLink,
  CopyButton,
} from 'components/ui/Links'
import { pinPostLink } from 'pages/about/faq'
import { ConnectErrorContent } from 'components/ConnectError'
import { RemovedCommentsNote } from './RemovedCommentsNote'
import { OVERVIEW, COMMENTS } from 'api/reddit'

const hidePinPostNotice_var = 'hidePinPostNotice'

const dismiss = () => {
  put(hidePinPostNotice_var, true)
  return true
}

const User = ({
  match,
  global,
  page_type: _page_type,
  viewableItems,
  selections,
  summary,
  notShownMsg,
}) => {
  const { user, kind = '' } = match.params
  const modal = React.useContext(ModalContext)
  const queryParams = new SimpleURLSearchParams(window.location.search)
  const {
    userNext,
    num_pages,
    loading,
    userIssueDescription,
    items,
    show: _show,
    after,
    hasVisitedUserPage_sortTop,
    hasVisitedSubredditPage,
    error,
  } = global.state
  let loadAllLink = '',
    nextLink = '',
    pagesLoaded = ''
  let errorMessage = '',
    status = '',
    instructionalNotice = ''
  let totalPages = 10
  let selectedItems = null
  if (!userNext) {
    totalPages = num_pages
  }

  let linkToRestOfComments = ''
  if (
    !queryParams.get('after') &&
    !queryParams.get('limit') &&
    queryParams.get('show')
  ) {
    linkToRestOfComments =
      window.location.pathname +
      new SimpleURLSearchParams(window.location.search).delete('show')
    selectedItems = queryParams.get('show').split(',')
  }
  if (!loading) {
    if (!after && userNext && !error) {
      loadAllLink = <LoadLink user={user} kind={kind} loadAll={true} />
    }
  }
  if (loading) {
    nextLink = <Spin />
  } else {
    if (userNext) {
      nextLink = (
        <div className="non-item">
          <LoadLink user={user} kind={kind} loadAll={false} />
        </div>
      )
    }
    if (userIssueDescription) {
      let message
      if (userIssueDescription === 'transport_failed') {
        message = <ConnectErrorContent />
      } else if (userIssueDescription.toLowerCase().startsWith('error')) {
        message = userIssueDescription
      } else if (userIssueDescription.includes('shadowbanned')) {
        const deleted_txt = userIssueDescription.includes('deleted')
          ? ' deleted or '
          : ''
        message = (
          <>
            <p>{`${user} may be ${deleted_txt}shadowbanned. `}</p>
            <p>
              Verify the URL, or check account status at{' '}
              <RedditOrLocalLink reddit={`/user/${user}`} rel="noopener">
                /u/{user}
              </RedditOrLocalLink>{' '}
              or{' '}
              <RedditOrLocalLink reddit="/r/ShadowBan" rel="noopener">
                /r/ShadowBan
              </RedditOrLocalLink>
              .
            </p>
          </>
        )
      } else {
        message = `${user} ${userIssueDescription}`
      }
      let suffix = <></>
      if (userIssueDescription.toLowerCase().includes('too many requests')) {
        // no "setup an API key" CTA here: reddit stopped issuing keys, so
        // that only helps people who already have one (settings still accepts
        // it; the transport_failed branch above mentions it)
        suffix = <>. Try again in 5 minutes.</>
      }
      errorMessage = (
        <div className="centered-note non-item text">
          <span>
            {message}
            {suffix}
          </span>
        </div>
      )
    }
  }
  if (items.length) {
    pagesLoaded = (
      <React.Fragment>
        <div
          id="pagesloaded"
          className="non-item text"
          data-pagesloaded={num_pages}
        >
          loaded pages {`${num_pages}/${totalPages}`}
        </div>
      </React.Fragment>
    )
  } else if (!loading && !error) {
    status = <p>Error loading data.</p>
  }

  const shownItems = []
  const constantProps = { kind }
  viewableItems.forEach(item => {
    if (
      !selectedItems ||
      (selectedItems && selectedItems.includes(item.name))
    ) {
      if (item.name.slice(0, 2) === 't3') {
        shownItems.push(<Post key={item.name} {...constantProps} {...item} />)
      } else {
        shownItems.push(
          <Comment key={item.name} {...constantProps} {...item} />
        )
      }
    }
  })
  const shareLink =
    window.location.origin +
    window.location.pathname.replace(/^\/user/, '/y') +
    window.location.search +
    window.location.hash

  if (!hasVisitedUserPage_sortTop) {
    instructionalNotice = (
      <TipWithBackground
        message="Sorting by top may show more results."
        htmlLink={<a href={'?sort=top&all=true'}>sort by top</a>}
      />
    )
  } else if (!get(hidePinPostNotice_var, false)) {
    instructionalNotice = (
      <Notice
        title="share reveddit"
        htmlLink={
          <div>
            <NewWindowLink
              old={true}
              reddit={pinPostLink}
              onClick={() => dismiss()}
            >
              create a post
            </NewWindowLink>
            , then select{' '}
            <a
              className="pointer"
              onClick={() =>
                modal.openModal({
                  content: (
                    <img
                      style={{ marginTop: '20px' }}
                      src="/images/pin-profile.png"
                    />
                  ),
                })
              }
            >
              pin to profile
            </a>
          </div>
        }
      />
    )
  } else if (!hasVisitedSubredditPage) {
    instructionalNotice = (
      <TipWithBackground
        message="Subreddit pages may summarize removal history prior to 2021/06."
        htmlLink={<Link to={PATH_STR_SUB + '/'}>view a subreddit</Link>}
      />
    )
  }
  // A page that can't connect shows only that error. The Overview and
  // Comments tabs say why removed comments aren't marked, in place of the
  // extension's pitch; the Posts tab still marks removed posts.
  const cantConnect = userIssueDescription === 'transport_failed'
  const showsComments = [OVERVIEW, COMMENTS, ''].includes(kind)
  const tips = !cantConnect && (
    <>
      {showsComments ? <RemovedCommentsNote user={user} /> : <Highlight />}
      {instructionalNotice}
    </>
  )
  return (
    <>
      <div className="userpage">
        <div className="top">
          <div className="top-selections">
            <div id="buttons-right">
              <div>
                <CopyButton url={shareLink}>copy sharelink</CopyButton>
              </div>
              <div>{loadAllLink}</div>
            </div>
            {selections}
            {summary}
          </div>
          {tips}
          {notShownMsg}
          {selectedItems && (
            <Notice
              message="showing selected items."
              htmlLink={<Link to={linkToRestOfComments}>view all items</Link>}
            />
          )}
          {shownItems}
          {errorMessage}
          {status}
        </div>
        <div className="footer">
          {pagesLoaded}
          {nextLink}
        </div>
      </div>
    </>
  )
}

export default withFetch(User)
