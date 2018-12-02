import React from 'react'
import { Link } from 'react-router-dom'
import { connect } from 'state'
import { getSettings } from 'pages/user'

class Header extends React.Component {
  getSortLink(sort) {
    const { user, kind = ''} = this.props.match.params
    const s = getSettings()
    return <a key={sort} className={sort === s.sort ? 'selected': ''} href={`/user/${user}/${kind}?sort=${sort}`}>{sort}</a>
  }
  render() {
    const props = this.props
    const { page_type } = props
    const { user, kind = '', subreddit = ''} = props.match.params
    let link = ''
    let sublink = ''
    let subtext = ''
    let nav = ''
    if (['subreddit_posts','thread'].includes(page_type)) {
      link = `/r/${subreddit}`
      sublink = `/r/${subreddit}/comments`
      subtext = 'view comments'
    } else if (page_type === 'subreddit_comments') {
      link = `/r/${subreddit}/comments`
      sublink = `/r/${subreddit}/`
      subtext = 'view posts'
    } else if (user) {
      link = `/user/${user}`
      nav = (
        <React.Fragment>
            <nav>
              <a className={kind === 'overview' || kind === '' ? 'selected': ''} href={`${link}/`}>overview</a>
              <a className={kind === 'comments' ? 'selected': ''} href={`${link}/comments`}>comments</a>
              <a className={kind === 'submitted' ? 'selected': ''} href={`${link}/submitted`}>submitted</a>
            <br/>
              {this.getSortLink('new')}
              {this.getSortLink('top')}
              {this.getSortLink('hot')}
              {this.getSortLink('controversial')}
            </nav>
        </React.Fragment>
      )
    }
    return (
      <React.Fragment>
        <header>
          <div id='header'>
            <h1>
              <Link to='/about'>revddit</Link>
            </h1>
            <a className='subheading' href={link}>{link}</a>
            {sublink &&
              <div className='tempNav'><a className='subheading' href={sublink}>{subtext}</a></div>
            }
          </div>
          <div id='status'>
            {props.global.state.statusText &&
            <p id='status-text'>{props.global.state.statusText}</p>}
            {props.global.state.statusImage &&
            <img id='status-image' src={props.global.state.statusImage} alt='status' />}
          </div>
        </header>
        {nav}
      </React.Fragment>
    )
  }
}

export default connect(Header)
