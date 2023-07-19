import React, {useState} from 'react'
import { SimpleURLSearchParams, useFocus } from 'utils'
import { LinkWithCloseModal } from 'components/Misc'

const sub_regex = /^\/?[rv]\/([^/]+)(\/c[^/]*)?(\/[^/]+)?/
//const defaultPlaceholder = 'user, r/sub or url'
const defaultPlaceholder = 'user or r/sub'

export default ({message, bottomMessage, placeholder}) => {
  const [random, setRandom] = useState(false)
  const [input, setInput] = useState('')
  const [inputRef, setInputFocus] = useFocus()
  if (random) {
    const sub = input.match(sub_regex) || window.location.pathname.match(sub_regex)
    let path = '/r/all/x'
    if (sub) {
      path = `/r/${sub[1]}/x/`+window.location.search
    }
    // can't use history.push here b/c it won't reset state
    window.location.href = path
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
      const sub = val.match(sub_regex)
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
        {message ? message :
          //<>Reveal Reddit's removed content. Search by username, subreddit <a className='pointer' onClick={() => {setInput('r/'); setInputFocus()}}>(r/)</a>, link or domain:</>
          <>Reveal Reddit's secretly<LinkWithCloseModal to='/about/faq/#need'><sup>*</sup></LinkWithCloseModal> removed content. Search by username or subreddit <a className='pointer' onClick={() => {setInput('r/'); setInputFocus()}}>(r/)</a>:</>
        }
      </div>
      <form id='user-form' onSubmit={handleSubmitUser}>
        <label htmlFor='search' className='hide-element'>search</label>
        <input ref={inputRef} id='search' type='text' name='username' placeholder={placeholder || defaultPlaceholder} autoFocus='autoFocus'
          value={input} onChange={(e) => setInput(e.target.value)}/>
        <input type='submit' id='button_u' value='go' />
        <div>
          <button title="Look up a random redditor" id='button_shuffle'
            onClick={(e) => {
              e.preventDefault()
              setRandom(true)
            }}>
            random
          </button>
        </div>

      </form>
      {bottomMessage ? bottomMessage :
        <div className='text'>
          <LinkWithCloseModal to='/about/faq/#need'>F.A.Q. - Why do I need this?</LinkWithCloseModal>
        </div>
      }
    </div>
  )

}
