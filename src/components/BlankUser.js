import React, {useState} from 'react'
import { Link, Redirect } from 'react-router-dom'
import { SimpleURLSearchParams, useFocus } from 'utils'
import { Shuffle } from 'pages/common/svg'
import { LinkWithCloseModal } from 'components/Misc'


export default () => {
  const [random, setRandom] = useState(false)
  const [input, setInput] = useState('')
  const [inputRef, setInputFocus] = useFocus()

  if (random) {
    return <Redirect to='/random'/>
  }
  const handleSubmitUser = (e) => {
    e.preventDefault()
    const data = new FormData(e.target)
    const queryParams = new SimpleURLSearchParams(window.location.search)
    queryParams.set('all', 'true')

    const val = data.get('username').trim().replace(/^u(?:ser)?\//i, '')
    // remove amp from user-entered URLs
    const val_noamp = val.replace(/^(https?:\/\/)www.google.com\/amp(\/[^.]*)*\/(amp\.)?/i,"$1")
    let url = '/'
    if (val === '') {
      setRandom(true)
    } else {
      const sub = val.match(/^\/?r\/([^/]+)(\/c[^/]*)?(\/[^/]+)?/)
      const domain = val.match(/^(?!https?:\/\/)([^./ ]+\.[^/ ]+)\/*$/i)
      const link = val_noamp.match(/^(?:https?:\/\/)?([^./]+\.[^/]+)\/?(.+)/i)
      if (sub) {
        url += `r/${sub[1]}/`
        if (sub[3]) {
          url += sub[2]+sub[3]
        } else if (sub[2]) {
          url += 'comments/?removedby=collapsed,locked,automod-rem-mod-app,mod'
        } else {
          url += '?localSort=num_comments'
        }
      } else if (val.match(/^\//)) {
        url = val
      } else if (domain) {
        url += `domain/${domain[1]}/`
      } else if (link) {
        if (link[1].match(/reddit\.com$/)) {
          url += link[2]
        } else {
          url += `info/?url=`+encodeURIComponent(val_noamp)
        }
      } else if (! val.match(/[./]/)) {
        url += `user/${val.toLowerCase()}/${queryParams.toString()}`
      } else {
        // invalid entry
      }
      if (url !== '/') {
        window.location.href = url
      }
    }
  }

  return (
    <div className='blank_page'>
      <div className='text'>
        Reveal reddit's removed content. Search by username, subreddit <a className='pointer' onClick={() => {setInput('r/'); setInputFocus()}}>(r/)</a>, link or domain:
      </div>
      <form id='user-form' onSubmit={handleSubmitUser}>
        <label htmlFor='search' className='hide-element'>search</label>
        <input ref={inputRef} id='search' type='text' name='username' placeholder='user, r/sub or url' autoFocus='autoFocus'
          value={input} onChange={(e) => setInput(e.target.value)}/>
        <input type='submit' id='button_u' value='go' />
        <button title="Look up a random redditor" id='button_shuffle'
          onClick={(e) => {
            e.preventDefault()
            setRandom(true)
          }}>
          <Shuffle/>
        </button>
      </form>
      <div className='text'>
        <LinkWithCloseModal to='/about/faq/#why'>F.A.Q. - Why do I need this?</LinkWithCloseModal>
      </div>
    </div>
  )

}
