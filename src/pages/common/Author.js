import React from 'react'
import { connect } from 'state'
import { getPrettyTimeLength, replaceAmpGTLT } from 'utils'
import { showAccountInfo_global } from 'pages/common/Settings'

const now = Math.floor(new Date()/1000)

const Author = ({author, is_op, deleted, distinguished, subreddit, name, author_flair_text, global}) => {
  const {moderators, moderated_subreddits, authors} = global.state
  const subreddit_lc = subreddit.toLowerCase()
  let link = `/user/${author}/`
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
    <>
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
        <>
          <span className='space' />
          <span className='flair'>{replaceAmpGTLT(author_flair_text)}</span>
        </>
      }
    </>
  )
}

export default connect(Author)
