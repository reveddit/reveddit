import React from 'react'
import { withRouter } from 'react-router'
import { Link } from 'react-router-dom'
import Post from 'pages/common/Post'
import Comment from 'pages/common/Comment'
import LoadLink from './LoadLink'
import Selections from 'pages/common/selections'
import scrollToElement from 'scroll-to-element'
import { connect, removedFilter_types } from 'state'
import Time from 'pages/common/Time'
import { withFetch } from 'pages/RevdditFetcher'
import { getQueryParams } from 'data_processing/user'
import { SimpleURLSearchParams } from 'utils'

class User extends React.Component {
  render () {
    const { user, kind = ''} = this.props.match.params
    const { page_type, viewableItems, selections } = this.props
    const qp_with_defaults = getQueryParams()
    const queryParams = new SimpleURLSearchParams(window.location.search)
    const gs = this.props.global.state
    let loadAllLink = ''
    let nextLink = ''
    let lastTimeLoaded = ''
    let error = ''
    let totalPages = 10
    let selectedItems = null
    if (! gs.userNext) {
      totalPages = gs.num_pages
    }

    let linkToRestOfComments = ''
    if (! queryParams.get('after') && ! queryParams.get('limit') && queryParams.get('show')) {
      linkToRestOfComments = window.location.pathname + '?' + (new SimpleURLSearchParams(window.location.search)).delete('show')
      selectedItems = queryParams.get('show').split(',')
    }
    if (! gs.loading) {
      if (! qp_with_defaults.after && gs.userNext) {
        loadAllLink = <LoadLink user={user}
                       kind={kind}
                       show={qp_with_defaults.show}
                       loadAll={true}/>
      }
    }
    if (gs.loading) {
      nextLink = <div className='non-item'><img className='spin' src='/images/spin.gif'/></div>
    } else if (gs.userNext) {
      nextLink = <div className='non-item'>
        <LoadLink user={user}
         kind={kind}
         show={qp_with_defaults.show}
         loadAll={false}/></div>
    } else if (gs.userIssueDescription) {
      error = <div className='non-item text'>{user} {gs.userIssueDescription}</div>
    }
    if (gs.items.length) {
      lastTimeLoaded = <React.Fragment>
                         <div className='non-item text'>since <Time created_utc={gs.items.slice(-1)[0].created_utc} /></div>
                         <div id='pagesloaded' className='non-item text' data-pagesloaded={gs.num_pages}>loaded pages {`${gs.num_pages}/${totalPages}`}</div>
                       </React.Fragment>
    }
    return (
      <div className='userpage'>
        <div className='subreddit-box'>
          {loadAllLink}
        </div>
        {selections}
        <div className='note quarantine'>
          <p>To view <span className='quarantined'>quarantined</span> content, install the <a href="https://chrome.google.com/webstore/detail/revddit-quarantined/cmfgeilnphkjendelakiniceinhjonfh">Chrome</a> or <a href="https://addons.mozilla.org/en-US/firefox/addon/revddit-quarantined/">Firefox</a> extension.</p>
        </div>
        {! gs.hasVisitedUserPage_sortTop &&
          <div className='notice-with-link'>
            <div>{"Sorting by top may show more results."}</div>
            <a href={'?sort=top&all=true'}>sort by top</a>
          </div>
        }
        {gs.hasVisitedUserPage_sortTop && ! gs.hasVisitedSubredditPage &&
          <div className='notice-with-link'>
            <div>{"Subreddit pages work too."}</div>
            <Link to={'/r/'}>view a subreddit</Link>
          </div>
        }
        {selectedItems &&
          <div className='notice-with-link'>
            <div>{"showing selected items."}</div>
            <Link to={linkToRestOfComments}>view all items</Link>
          </div>
        }
        {
          viewableItems.map(item => {
            if (! selectedItems || (selectedItems && selectedItems.includes(item.name))) {
              if (item.name.slice(0,2) === 't3') {
                return <Post key={item.name} {...item} sort={qp_with_defaults.sort} />
              } else {
                return <Comment key={item.name} {...item} sort={qp_with_defaults.sort}/>
              }
            }
          })
        }
        {lastTimeLoaded}
        {nextLink}
        {error}
      </div>
    )
  }
}

export default connect(withFetch(User))
