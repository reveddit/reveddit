import React from 'react'
import { Link, Redirect } from 'react-router-dom'
import { SimpleURLSearchParams } from 'utils'
import { Shuffle } from 'pages/common/svg'

export class BlankUser extends React.Component {
  state = {
    random: false
  }
  handleSubmitUser = (e) => {
    e.preventDefault()
    const data = new FormData(e.target)
    const queryParams = new SimpleURLSearchParams(window.location.search)
    queryParams.set('all', 'true')

    const val = data.get('username').trim().toLowerCase()
    if (val !== '') {
      window.location.href = `/user/${val}/${queryParams.toString()}`
    } else {
      this.setState({random: true})
    }
  }


  render () {
    const text = this.props.text || "Enter a reddit username to view removed content (blank for random):"
    if (this.state.random) {
      return <Redirect to='/random'/>
    }
    return (
      <div className='blank_page'>
        <div className='text'>
          {text}
        </div>
        <form id='user-form' onSubmit={this.handleSubmitUser}>
          <input type='text' name='username' placeholder='username' autoFocus='autoFocus'/>
          <input type='submit' id='button_u' value='go' />
          <button title="Look up a random redditor" id='button_shuffle'
            onClick={(e) => {
              e.preventDefault()
              this.setState({random:true})
            }}>
            <Shuffle/>
          </button>
        </form>
      </div>
    )
  }
}

export const BlankSubreddit = ({is_comments_page = false}) => {
  const handleSubmitSub = (e) => {
    e.preventDefault()
    const data = new FormData(e.target)
    const val = data.get('subreddit').trim().toLowerCase()
    if (val !== '') {
      if (is_comments_page) {
        window.location.href = `/r/${val}/comments/?removedby=automod-rem-mod-app,mod`
      } else {
        window.location.href = `/r/${val}/?localSort=num_comments`
      }
    }
  }
  return (
    <div className='blank_page'>
      <div className='text'>
        Enter a subreddit to view removed content:
      </div>
      <form onSubmit={handleSubmitSub}>
        <input type='text' name='subreddit' placeholder='subreddit' autoFocus='autoFocus'/>
        <input type='submit' id='button_s' value='go' />
      </form>
    </div>
  )
}
