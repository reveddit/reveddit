import React from 'react'

export default ({is_comments_page = false}) => {
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
        <input type='submit' id='button_r' value='go' />
      </form>
    </div>
  )
}
