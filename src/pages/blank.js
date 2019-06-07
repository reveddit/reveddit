import React from 'react'
import { Link } from 'react-router-dom'

export class BlankUser extends React.Component {
  handleSubmitUser = (e) => {
    e.preventDefault()
    const data = new FormData(e.target)
    const val = data.get('username').trim().toLowerCase()
    if (val !== '') {
      window.location.href = `/user/${val}`
    }
  }

  render () {
    return (
      <div className='blank_page'>
        <div className='non-item text'>
          Enter a reddit username to view removed content:
        </div>
        <form onSubmit={this.handleSubmitUser}>
          <input type='text' name='username' placeholder='username'/>
          <input type='submit' id='button_u' value='go' />
        </form>
      </div>
    )
  }
}

export class BlankSubreddit extends React.Component {
  handleSubmitSub = (e) => {
    e.preventDefault()
    const data = new FormData(e.target)
    const val = data.get('subreddit').trim().toLowerCase()
    if (val !== '') {
      window.location.href = `/r/${val}`
    }
  }
  render() {
    return (
      <div className='blank_page'>
        <div className='non-item text'>
          Enter a subreddit to view removed content:
        </div>
        <form onSubmit={this.handleSubmitSub}>
          <input type='text' name='subreddit' placeholder='subreddit'/>
          <input type='submit' id='button_s' value='go' />
        </form>
      </div>
    )
  }

}
