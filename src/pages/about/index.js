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
        Review removed content on reddit user pages
        and discover whether it was removed by <span className='removedby'>automod</span> or by a <span className='removedby'>mod</span>.
        </p>
        <p>
          <b>Usage</b>: Drag this bookmarklet
          <a className='bookmarklet' href="javascript:window.fetch('https://www.reddit.com/api/me.json').then(response => response.json()).then(response => { let name = response.data.name; if (name) {window.location.href = `http://revddit.com/user/${response.data.name}`} else {window.location.href = 'https://www.reddit.com/login'}})">
          revddit
          </a>
        to your bookmark bar and use it to get from reddit to your user page on revddit.
          <br /><br />
        Alternatively, you can manually insert a <i>v</i> in the URL.
          <br />
        E.g. <a href='/user/redditor_3975/'>https://www.revddit.com/user/redditor_3975</a>
        </p>
        <p>
        Created by
          <a href='https://github.com/rhaksw/'> Rob Hawkins</a>, leveraging Jesper Wrang{"'"}s
          <a href='https://github.com/JubbeArt/removeddit'> removeddit</a> framework, and
          Jason Baumgartner{"'"}s <a href='https://pushshift.io/'>Pushshift</a> service for determining if content was removed by automod or a mod.
        </p>
        <h2 className='todo'>TODO</h2>
        <ul>
          <li><del>Collapsing comments</del> Done</li>
          <li><del>Maybe for specific users</del> Done</li>
          <li>...</li>
        </ul>
        <h2 className='contact'>Links/Contact</h2>
        <p style={{ marginBottom: '8px' }}>For feedback and bug reports:</p>
        <ul>
          <li>reddit: <a href='https://www.reddit.com/user/rhaksw/'>/u/rhaksw</a></li>
          <li><a href='https://github.com/rhaksw/revddit'>Code on Github</a></li>
        </ul>
        <p>
        </p>
      </div>
    </div>
  )
}

export default connect(About)
