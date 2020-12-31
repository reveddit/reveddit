import React from 'react'
import { connect } from 'state'
import { getPrettyTimeLength, replaceAmpGTLT, PATH_STR_USER } from 'utils'
import { showAccountInfo_global } from 'pages/modals/Settings'
import Flair from './Flair'

const now = Math.floor(new Date()/1000)

const Author = ({author, is_op, deleted, distinguished, subreddit, name,
                 author_flair_text, page_type, className='', global,
               }) => {
  const {moderators, moderated_subreddits, authors} = global.state
  const subreddit_lc = subreddit.toLowerCase()
  let link = `${PATH_STR_USER}/${author}/`
  if (deleted || author === '[deleted]') {
    author = '[deleted]'
    link = undefined
    is_op = false
  }
  const kind = name.slice(0,2)
  let age = ''
  const info = authors[author]
  if (showAccountInfo_global && info) {
    age = ' ['+getPrettyTimeLength(now-info.created_utc)+' | '
    const num = kind === 't1' ? info.comment_karma : info.link_karma
    age += Intl.NumberFormat('en-US').format(num)+']'
  }
  return (
    <span className={className}>
      <a
        href={link}
        className={'author '+
          (is_op ? 'submitter ' : '')+
          (distinguished ? 'distinguished '+distinguished+' ' : '')+
          ((moderators[subreddit_lc] || {})[author] || moderated_subreddits[subreddit_lc] ? 'is_moderator ' : '')
        }
      >
        {author+age}
        {deleted && kind === 't1' && ' (by user)'}
      </a>
      {
        author !== '[deleted]' && author_flair_text &&
          <Flair className='flair spaceLeft' field='author_flair_text'
                 globalVarName='user_flair' author_flair_text={author_flair_text} page_type={page_type}/>
      }
    </span>
  )
}

export default connect(Author)
