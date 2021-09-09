import React from 'react'
import {PATH_STR_SUB} from 'utils'
import { create_qparams } from 'state'

export default ({is_comments_page = false}) => {
  const handleSubmitSub = (e) => {
    e.preventDefault()
    const data = new FormData(e.target)
    const val = data.get('subreddit').trim().toLowerCase()
    if (val !== '') {
      const queryParams = create_qparams()
      let path = `${PATH_STR_SUB}/${val}/`
      if (is_comments_page) {
        path += 'comments/?removedby=collapsed,locked,automod-rem-mod-app,mod'
      } else {
        if (['top', 'history'].includes(queryParams.get('contentType'))) {
          path += 'history/'
        } else {
          path += '?localSort=num_comments'
        }
      }
      window.location.href = path
    }
  }
  return (
    <div className='blank_page'>
      <div className='text'>
        Enter a subreddit to view removed content:
      </div>
      <form onSubmit={handleSubmitSub}>
        <label htmlFor='subreddit' className='hide-element'>subreddit</label>
        <input id='subreddit' type='text' name='subreddit' placeholder='subreddit' autoFocus='autoFocus'/>
        <input type='submit' id='button_r' value='go' />
      </form>
    </div>
  )
}
