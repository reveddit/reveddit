import React from 'react'
import { Link } from 'react-router-dom'
import { connect } from 'state'

class Header extends React.Component {
  render() {
    const props = this.props
    const { page_type } = props
    let { user, subreddit = '', userSubreddit = ''} = props.match.params
    if (userSubreddit) {
      subreddit = 'u_'+userSubreddit
    }
    let link = ''
    if (['subreddit_posts','thread'].includes(page_type)) {
      link = `/r/${subreddit}`
    } else if (page_type === 'subreddit_comments') {
      link = `/r/${subreddit}/comments`
    } else if (user) {
      link = `/user/${user}`
    }
    return (
      <React.Fragment>
        <header>
          <div id='header'>
            <h1>
              <Link to='/about'>revddit</Link>
            </h1>
            <a className='subheading' href={link}>{link}</a>
          </div>
          <div id='status'>
            {props.global.state.statusText &&
            <p id='status-text'>{props.global.state.statusText}</p>}
            {props.global.state.statusImage &&
            <img id='status-image' src={props.global.state.statusImage} alt='status' />}
          </div>
        </header>
      </React.Fragment>
    )
  }
}

export default connect(Header)
