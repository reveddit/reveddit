import React from 'react'
import { connect } from 'state'
import { BlankUser, BlankSubreddit } from 'pages/blank'

const About = props => {
  document.title = 'About revddit'
  if (props.global.state.statusImage !== undefined) {
    props.global.clearStatus()
  }

  return (
    <div id='main'>
      <div id='main-box'>
        <div className='about section'>
          <h2 className='about'>About</h2>
          <BlankUser/>
        </div>
        <div className='section'>
          <h2 className='about'>Feedback</h2>
          <ul>
            <li><a href='https://www.reddit.com/r/revddit/'>/r/revddit</a></li>
            <li><a href='https://github.com/revddit/revddit'>github.com/revddit/revddit</a></li>
          </ul>
        </div>
        <div className='section'>
          <h2 className='about'>Credits</h2>
          <p>
            Created by
            <a href='https://github.com/rhaksw/'> Rob Hawkins</a> using:</p>
              <ul>
                <li><a href='https://github.com/JubbeArt/removeddit'> Removeddit</a> by Jesper Wrang</li>
                <li><a href='https://www.reddit.com/r/pushshift/'>Pushshift</a> by Jason Baumgartner</li>
              </ul>
        </div>
        <div>
        <h2 className='about'>Advanced</h2>
          <p>Insert a <span className='v'>v</span> in the URL of any reddit page.</p>
            <ul>
              <li>a user page: <a href='/user/redditor_3975/'>https://www.re<span className='v'>v</span>ddit.com/user/redditor_3975</a></li>
              <li>r/all: <a href='/r/all/'>https://www.re<span className='v'>v</span>ddit.com/r/all</a></li>
              <li>a subreddit:
                <ul>
                  <li>posts: <a href='/r/cant_say_goodbye/'>https://www.re<span className='v'>v</span>ddit.com/r/cant_say_goodbye</a></li>
                  <li>comments: <a href='/r/cant_say_goodbye/comments'>https://www.re<span className='v'>v</span>ddit.com/r/cant_say_goodbye/comments</a></li>
                </ul>
              </li>
              <li>domain(s): <a href='/domain/reuters.com,economist.com'>https://www.re<span className='v'>v</span>ddit.com/domain/reuters.com,economist.com</a></li>
              <li>one post's comments: <a href='/r/cant_say_goodbye/comments/9ffoqz/comments_mentioning_goodbye_are_removed/'>https://www.re<span className='v'>v</span>ddit.com/r/cant_say_goodbye/comments/9ffoqz/...</a></li>
              <li>multiple subreddits:
                <ul>
                <li>posts: <a href='/r/cant_say_goodbye,rdevcoder/'>https://www.re<span className='v'>v</span>ddit.com/r/cant_say_goodbye,rdevcoder/</a></li>
                <li>comments: <a href='/r/cant_say_goodbye,rdevcoder/'>https://www.re<span className='v'>v</span>ddit.com/r/cant_say_goodbye,rdevcoder/comments</a></li>
                </ul>
              </li>
            </ul>
          <p>
            You can also use this bookmarklet
            <a className='bookmarklet' href="javascript:window.fetch('https://www.reddit.com/api/me.json').then(response => response.json()).then(response => { let name = response.data.name; if (name) {window.location.href = `http://revddit.com/user/${response.data.name}`} else {window.location.href = 'https://www.reddit.com/login'}})">
              revddit-user
            </a>
            to go from reddit to your revddit user page, or this one
            <a className='bookmarklet' href="javascript: document.location = document.URL.replace('reddit.com','revddit.com');">
              revddit
            </a>
            to go from any reddit page to its re<span className='v'>v</span>ddit version
          </p>
        </div>
      </div>
    </div>
  )
}

export default connect(About)
