import React, {useState} from 'react'
import { prettyScore, parse,
         PATH_STR_USER, PATH_STR_SUB, convertPathSub, stripRedditLikeDomain,
} from 'utils'
import Time from 'pages/common/Time'
import RemovedBy, {QuarantinedLabel} from 'pages/common/RemovedBy'
import { NOT_REMOVED, ORPHANED } from 'pages/common/RemovedBy'
import CommentBody from 'pages/common/CommentBody'
import Author from 'pages/common/Author'
import { connect, hasClickedRemovedUserCommentContext, urlParamKeys } from 'state'
import {AddUserParam} from 'data_processing/FindCommentViaAuthors'
import {MessageMods} from 'components/Misc'
import {www_reddit, old_reddit} from 'api/reddit'
import Flair from './Flair'
import SubscribersCount from './SubscribersCount'

const Comment = (props) => {
  const [displayBody, setDisplayBody] = useState(true)
  const {t, sort, userCommentsByPost} = props.global.state
  const {author, name, created_utc, locked, link_id, subreddit, score, permalink, //from reddit comment data
         quarantine, url, num_comments, //from reddit post data
         link_title, link_author, //from reddit post data, renamed
         removed, deleted, is_op, num_replies, //from reveddit post processing
         rev_position, //from reveddit post processing
         prev, next, parent_context, parent_removed_label, post_removed_label, link_permalink, //from reveddit post processing
         kind, //from parent component
        } = props
  let classNames = ['comment', 'user']
  let submitter = ''
  if (is_op) {
    submitter = ' submitter'+' '
  }
  if (removed) {
    classNames.push('removed')
  } else if (deleted) {
    classNames.push('deleted')
  } else {
    classNames.push('comment-even')
  }
  quarantine && classNames.push('quarantine')
  locked && classNames.push('locked')

  let directlink = ''
  let after_before = '', after = '', before = ''
  let add_user = ''
  if (prev) {
    after_before = `after=${prev}&`
    after = prev
  } else if (next) {
    after_before = `before=${next}&`
    before = next
  }
  // after_before only has a value for user pages
  if (after_before) {
    directlink = '?'+after_before+`limit=1&sort=${sort}&show=${name}&removal_status=all`
    const addUserParam = new AddUserParam()
    const samePost_comments = userCommentsByPost[link_id]
    const samePost_lastComment = samePost_comments[samePost_comments.length -1]
    const samePost_firstComment = samePost_comments[0]
    const addUser_afterBefore = {}
    if (rev_position - samePost_lastComment.rev_position < 100 && samePost_lastComment.next) {
      addUser_afterBefore.before = samePost_lastComment.next
    } else if (samePost_firstComment.rev_position - rev_position < 100 && samePost_firstComment.prev) {
      addUser_afterBefore.after = samePost_firstComment.prev
    } else if (next) {
      addUser_afterBefore.before = next
    } else if (prev) {
      addUser_afterBefore.after = prev
    }
    addUserParam.addItems({
      author: author,
      ...(kind && {kind}),
      ...(sort && {sort}),
      ...(t && {time: t}),
      ...addUser_afterBefore,
    })
    add_user = addUserParam.toString()
  }
  let post_parent_removed = []
  if (parent_removed_label) {
    post_parent_removed.push('parent '+parent_removed_label)
  }
  if (post_removed_label) {
    post_parent_removed.push('link '+post_removed_label)
  }
  const rev_subreddit = PATH_STR_SUB+'/'+subreddit
  let rev_link_permalink = '', rev_link_permalink_with_add_user = ''
  if (link_permalink) {
    rev_link_permalink = convertPathSub(link_permalink.replace(/^https:\/\/[^/]*/,''))
    rev_link_permalink_with_add_user = rev_link_permalink + '?' + add_user
  }
  return (
    <div id={name} className={classNames.join(' ')} data-fullname={name} data-created_utc={created_utc}>
      <div className='comment-head'>
        <a onClick={() => setDisplayBody(! displayBody)} className='collapseToggle spaceRight'>{displayBody ? '[–]' : '[+]'}</a>
        <Flair className='link-flair' field='link_flair_text' globalVarName='post_flair' {...props} />
        <a href={url ? stripRedditLikeDomain(url) : rev_link_permalink} className='title'
          >{link_title}</a>
        {'link_author' in props &&
          <>
            <span> by </span>
            <a
              href={`${PATH_STR_USER}/${link_author}`}
              className='author'>
              {link_author}
            </a>
          </>
        }
        {'subreddit' in props &&
          <>
            <span> in </span>
            <a
              href={rev_subreddit+'/'}
              className='subreddit-link subreddit'
              data-subreddit={subreddit}
            >
              {`/r/${subreddit}`}
            </a> <SubscribersCount {...props}/>
          </>
        }
      </div>
      <div className='comment-head subhead'>
        <Author {...props} className='spaceRight'/>
        <span className='comment-score spaceRight'>{prettyScore(score)} point{(score !== 1) && 's'}</span>
        <Time {...props}/>
        <div>
          <RemovedBy style={{display:'inline', marginRight: '5px'}} {...props} />
          {post_parent_removed.length !== 0 &&
            <RemovedBy removedby={ORPHANED} orphaned_label={post_parent_removed.join(', ')} style={{display:'inline'}}/>
          }
        </div>
      </div>
      <div className='comment-body-and-links' style={displayBody ? {} : {display: 'none'}}>
        <CommentBody {...props}/>
        <div className='comment-links'>
          { ! deleted &&
            <>
              <QuarantinedLabel {...props}/>
              { parent_context ?
                <>
                  <a href={parent_context+'?removedby=missing'}>reveddit-parent</a>
                  <a href={www_reddit+parent_context}>reddit-parent</a>
                  <a href={www_reddit+permalink+'?context=1'}>reddit-permalink</a>
                </>
                :
                  <a href={permalink+'?context=3&'+add_user+'#'+name}
                     onClick={(removed && add_user) ? hasClickedRemovedUserCommentContext: null}
                  >context{num_replies && `(${num_replies})`}</a>
              }
              {rev_link_permalink &&
                <>
                  <a href={rev_link_permalink_with_add_user}>full comments
                    {'num_comments' in props && `(${num_comments})`}</a>
                  <a href={rev_link_permalink_with_add_user+'&'+urlParamKeys.author+'='+author}>full comments(author)</a>
                </>
              }
              <a href={old_reddit+permalink+'?context=3'}>reddit</a>
              { directlink && <a href={directlink}>directlink</a>}
              { ! parent_context &&
                <MessageMods {...props}/>
              }
            </>
          }
        </div>
      </div>
    </div>
  )

}

export default connect(Comment)
