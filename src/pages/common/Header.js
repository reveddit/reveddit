import React from 'react'
import { Link } from 'react-router-dom'
import { connect } from 'state'

class Header extends React.Component {
  handleSubmitSub = (e) => {
    e.preventDefault()
    const data = new FormData(e.target)
    const val = data.get('subreddit').trim().toLowerCase()
    if (val !== '') {
      window.location.href = `/r/${val}`
    }
  }
  handleSubmitUser = (e) => {
    e.preventDefault()
    const data = new FormData(e.target)
    const val = data.get('username').trim().toLowerCase()
    if (val !== '') {
      window.location.href = `/user/${val}`
    }
  }
  render() {
    const props = this.props
    const { page_type } = props
    let { user, subreddit = '', userSubreddit = '', domain = ''} = props.match.params
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
    } else if (domain) {
      link = `/domain/${domain}`
    }
    let display = link
    const maxLen = 30
    if ((domain || subreddit) && link.length > maxLen) {
      display = link.substring(0,maxLen)+'...'
    }
    return (
      <React.Fragment>
        <header>
          <div id='header'>
            <div id='title_and_forms'>
              <h1>
                <Link to='/about'>revddit</Link>
              </h1>
              <div id='forms'>
                <form className="topForm" onSubmit={this.handleSubmitSub}>
                  <label>
                    /r/
                    <input type='text' name='subreddit' placeholder='subreddit'/>
                  </label>
                  <input type='submit' id='button_s' value='go' />
                </form>
                <form onSubmit={this.handleSubmitUser}>
                  <label>
                    /u/
                    <input type='text' name='username' placeholder='username'/>
                  </label>
                  <input type='submit' id='button_u' value='go' />
                </form>
              </div>
            </div>
            <a className='subheading' href={link}>{display}</a>
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
