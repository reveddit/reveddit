import React from 'react'
import { connect } from 'state'
import { BlankUser, BlankSubreddit } from 'pages/blank'
import Comment from 'pages/common/Comment'
import Time from 'pages/common/Time'
import { getComments } from 'api/reddit'
import { itemIsRemovedOrDeleted, SimpleURLSearchParams } from 'utils'
export class About extends React.Component {
  state = {
    comments: [],
    singleDisplayIndex: 0
  }
  changeView = (index) => {
    this.setState({singleDisplayIndex: index})
  }
  componentDidMount() {
    getComments(
      [
        'eq7b6sh', 'eq96jfe', 'eqhix9c', 'eq3x4jv', 'eqrjqha', 'eqxphke', 'eq73d6e',
        'eg5kla2', 'eg58nc9', 'eg4u1rr', 'eg4tkcu', 'eg4szw5', 'eg4mxqb', 'eg4cech',
        'eg3ueep', 'eg3bgki', 'eg33rjm', 'eg33ki6', 'eg30s12', 'eg300eo', 'eg2zjb9',
        'eg2xgjc', 'eg2x1kt', 'eg2vm27', 'eg2vamc', 'eg2ugkf', 'eg2ub8f', 'eg2t4zp',
        'eg2s3gf', 'eg2pxd8', 'eg2pa9c', 'eg2oymq', 'eg2nqjz', 'eg2ksrf', 'eg2jrvb',
        'eg2hdg2', 'eg2giv2', 'esloe21'
      ].sort(() => 0.5 - Math.random()))
    .then( comments => {
      const unedited = comments.filter(c => ! itemIsRemovedOrDeleted(c) && (! c.edited || c.edited < 1560668305))
      this.setState({comments: unedited})
    })
  }
  render() {
    const props = this.props
    document.title = 'About revddit'
    if (props.global.state.statusImage !== undefined) {
      props.global.clearStatus()
    }
    let singleDisplayComment = null
    let hasNext = false, hasPrev = false
    let nextAttr = {}, prevAttr = {}
    if (this.state.singleDisplayIndex >= 0) {
      singleDisplayComment = this.state.comments[this.state.singleDisplayIndex]
      if (this.state.singleDisplayIndex > 0) {
        hasPrev = true
        prevAttr = {onClick: (e) => this.changeView(this.state.singleDisplayIndex-1)}
      }
      if (this.state.singleDisplayIndex < this.state.comments.length-1) {
        hasNext = true
        nextAttr = {onClick: (e) => this.changeView(this.state.singleDisplayIndex+1)}
      }
    }
    const status = new SimpleURLSearchParams(window.location.search).get('status') || ''
    let message = ''
    if (status === 'donate-success') {
      message = 'Thank you for your donation!'
    } else if (status === 'donate-cancel') {
      message = 'Your donation has been cancelled.'
    }
    return (
      <div id='main'>
        <div id='main-box'>
          <div className='about section'>
            {message &&
              <div className='message'>
                {message}
              </div>
            }
            <h2 className='about'>About</h2>
            <BlankUser/>
            <div className='note quarantine'>
              <div>To view <span className='quarantined'>quarantined</span> content, install the <a href="https://chrome.google.com/webstore/detail/revddit-quarantined/cmfgeilnphkjendelakiniceinhjonfh">Chrome</a> or <a href="https://addons.mozilla.org/en-US/firefox/addon/revddit-quarantined/">Firefox</a> extension.</div>
            </div>
          </div>
          <div className='section'>
            <h2 className='about'>What people say</h2>
            {this.state.comments.length ?
              singleDisplayComment ?
                <React.Fragment>
                  <div className='non-item'>
                    <a  {...prevAttr}
                       className={`collapseToggle prev ${hasPrev ? 'active':'disabled'}`}>&lt;- previous</a>
                    <a {...nextAttr}
                            className={`collapseToggle next ${hasNext ? 'active':'disabled'}`}>next -&gt;</a>
                  </div>
                  <Comment key={singleDisplayComment.id} {...singleDisplayComment}/>
                  <div className='non-item'><a onClick={(e) => this.changeView(-1)}
                          className='collapseToggle'>[+] view all</a>
                  </div>
                </React.Fragment>
                :
                <React.Fragment>
                  <div className='non-item'><a onClick={(e) => this.changeView(0)}
                          className='collapseToggle'>[–] show less</a>
                  </div>
                  {this.state.comments.map(c => <Comment key={c.id} {...c}/>)}
                  <div className='non-item'><a onClick={(e) => this.changeView(0)}
                          className='collapseToggle'>[–] show less</a>
                  </div>
                </React.Fragment>
            : ''}
          </div>
          <div className='sections'>
            <div className='section half'>
              <h2 className='about'>News</h2>
              <ul className='news'>
                <li><a href='https://www.reddit.com/r/shortcuts/comments/ct64s6/is_it_possible_to_modify_a_copied_link/exkas2j/?context=3'>revddit shortcut for iOS</a>
                  <ul><li><Time created_utc='1566381957'/></li></ul></li>
                <li><a href='https://www.reddit.com/r/revddit/comments/cmcw3y/revddit_quarantined_a_desktop_browser_extension/'>revddit quarantined extension</a>
                  <ul><li><Time created_utc='1565021148'/></li></ul></li>
                <li><a href='https://www.reddit.com/r/revddit/comments/clwnxg/revddit_linker_a_desktop_browser_extension_for/'>revddit linker extension</a>
                  <ul><li><Time created_utc='1564927561'/></li></ul></li>
              </ul>
            </div>
            <div className='section half'>
              <h2 className='about'>Extra tools</h2>
              <ul>
              <li>revddit quarantined - enables viewing quarantined content via re<span className="v red">v</span>ddit
                <ul>
                  <li><a href="https://chrome.google.com/webstore/detail/revddit-quarantined/cmfgeilnphkjendelakiniceinhjonfh">Chrome</a></li>
                  <li><a href="https://addons.mozilla.org/en-US/firefox/addon/revddit-quarantined/">Firefox</a></li>
                </ul>
              </li>
                <li>revddit linker - provides a button and context menu item to switch between reddit and re<span className="v red">v</span>ddit views
                  <ul>
                    <li><a href="https://chrome.google.com/webstore/detail/revddit-linker/jgnigeenijnjlahckhfomimnjadmkmah">Chrome</a></li>
                    <li><a href="https://addons.mozilla.org/en-US/firefox/addon/revddit-linker/">Firefox</a></li>
                  </ul>
                </li>
                  <li><a href="https://www.icloud.com/shortcuts/62bc7570613c42cb8b851fad264136df">revddit shortcut</a> - iOS shortcut</li>
              </ul>
            </div>
          </div>
          <div className='sections'>
            <div className='section half'>
              <h2 className='about'>Feedback</h2>
              <ul>
                <li><a href='https://www.reddit.com/r/revddit/'>/r/revddit</a></li>
                <li><a href='https://github.com/revddit/revddit'>github.com/revddit/revddit</a></li>
              </ul>
            </div>
            <div className='section half'>
              <h2 className='about'>Credits</h2>
              <p>
                Created by
                <a href='https://github.com/rhaksw/'> Rob Hawkins</a> using:</p>
                  <ul>
                    <li><a href='https://github.com/JubbeArt/removeddit'> Removeddit</a> by Jesper Wrang</li>
                    <li><a href='https://www.reddit.com/r/pushshift/'>Pushshift</a> by Jason Baumgartner</li>
                  </ul>
            </div>
          </div>
          <div className='sections'>
            <div className='section half'>
              <h2 className='about'>Donate</h2>
              <p>re<span className="v red">v</span>ddit is free and ad-free. You can support work like this with a <a className="pointer" onClick={this.props.openDonateModal}>donation</a>, feedback, or code fixes.</p>
              <p>Thank you!</p>
            </div>
            <div className='section half'>
              <h2 className='about'>Site usage</h2>
              <p>Insert a <span className='v'>v</span> in the URL of any reddit page.</p>
                <ul>
                  <li><a href='/user/redditor_3975/'>user/redditor_3975</a></li>
                  <li><a href='/r/all/'>r/all</a></li>
                  <li><a href='/r/cant_say_goodbye/'>r/cant_say_goodbye</a></li>
                  <li><a href='/r/cant_say_goodbye/comments'>r/.../comments</a></li>
                  <li><a href='/r/cant_say_goodbye/comments/9ffoqz/comments_mentioning_goodbye_are_removed/'>r/.../comments/9ffoqz/</a></li>
                  <li><a href='/domain/cnn.com+foxnews.com'>domain/cnn.com+foxnews.com</a></li>
                  <li><a href='/r/news+worldnews/'>r/news+worldnews/</a></li>
                </ul>
              <p>
                You can also use this bookmarklet
                <a className='bookmarklet' href="javascript:window.fetch('https://www.reddit.com/api/me.json').then(response => response.json()).then(response => { let name = response.data.name; if (name) {window.location.href = `http://revddit.com/user/${response.data.name}`} else {window.location.href = 'https://www.reddit.com/login'}})">
                  revddit-user
                </a>
                to go from reddit to your revddit user page, or the <a href="https://www.reddit.com/r/revddit/comments/clwnxg/revddit_linker_a_desktop_browser_extension_for/">revddit linker extension </a>
                to go from any reddit page to its re<span className='v'>v</span>ddit version.
              </p>
            </div>
          </div>
          <div className='sections'>
            <div className='section half'>
              <h2 className='about'>Credo</h2>
              <p>Secretly removing content is within reddit's free speech rights, and so is revealing said removals.</p>
            </div>
          </div>
        </div>
      </div>
    )
  }
}

export default connect(About)
