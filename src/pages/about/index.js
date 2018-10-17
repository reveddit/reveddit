import React from 'react'
import { connect } from '../../state'

const About = props => {
  document.title = 'About revddit'
  if (props.global.state.statusImage !== undefined) {
    props.global.clearStatus()
  }

  return (
    <div id='main'>
      <div id='main-box'>
        <h2 className='about'>About</h2>
        <p className='space'>
        Review removed content on reddit user pages and subreddit pages
        to discover removals and whether they were removed by <span className='removedby'>automod</span> or by a <span className='removedby'>mod</span>.
        </p>
        <p>
          <b>Usage</b>: Drag this bookmarklet
          <a className='bookmarklet' href="javascript:window.fetch('https://www.reddit.com/api/me.json').then(response => response.json()).then(response => { let name = response.data.name; if (name) {window.location.href = `http://revddit.com/user/${response.data.name}`} else {window.location.href = 'https://www.reddit.com/login'}})">
          revddit
          </a>
        to your bookmark bar and use it to get from reddit to your user page on revddit.
          <br /><br />
        Alternatively, you can manually insert a <i>v</i> in the URL, for example</p>
          <ul>
            <li><a href='/user/redditor_3975/'>https://www.re<span className='v'>v</span>ddit.com/user/redditor_3975</a></li>
            <li><a href='/r/cant_say_goodbye/'>https://www.re<span className='v'>v</span>ddit.com/r/cant_say_goodbye</a></li>
          </ul>

        <h2 className='contact'>Credits</h2>
        <p>
        Created by
          <a href='https://github.com/rhaksw/'> Rob Hawkins</a> using:</p>
            <ul>
              <li><a href='https://github.com/JubbeArt/removeddit'> Removeddit</a> by Jesper Wrang</li>
              <li><a href='https://www.reddit.com/r/pushshift/'>Pushshift</a> by Jason Baumgartner</li>
            </ul>
        <p style={{ marginBottom: '8px' }}>For feedback and bug reports:</p>
        <ul>
          <li><a href='https://www.reddit.com/user/rhaksw/'>/u/rhaksw</a></li>
          <li><a href='https://github.com/rhaksw/revddit'>revddit on Github</a></li>
        </ul>
        <p>
        </p>
      </div>
    </div>
  )
}

export default connect(About)
