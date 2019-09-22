import React from 'react'
import { Link } from 'react-router-dom'
import { SimpleURLSearchParams } from 'utils'

export class BlankUser extends React.Component {
  handleSubmitUser = (e) => {
    e.preventDefault()
    const data = new FormData(e.target)
    const queryParams = new SimpleURLSearchParams(window.location.search)
    queryParams.set('all', 'true')

    const val = data.get('username').trim().toLowerCase()
    if (val !== '') {
      window.location.href = `/user/${val}${queryParams.toString()}`
    }
  }

  render () {
    const text = this.props.text || "Enter a reddit username to view removed content:"

    return (
      <div className='blank_page'>
        <div className='non-item text'>
          {text}
        </div>
        <form onSubmit={this.handleSubmitUser}>
          <input type='text' name='username' placeholder='username' autoFocus='autoFocus'/>
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
      window.location.href = `/r/${val}?localSort=num_comments`
    }
  }
  render() {
    return (
      <div className='blank_page'>
        <div className='non-item text'>
          Enter a subreddit to view removed content:
        </div>
        <form onSubmit={this.handleSubmitSub}>
          <input type='text' name='subreddit' placeholder='subreddit' autoFocus='autoFocus'/>
          <input type='submit' id='button_s' value='go' />
        </form>
      </div>
    )
  }

}
