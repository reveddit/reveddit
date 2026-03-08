import React from 'react'
import {
  prettyScore,
  PATH_STR_USER,
  PATH_STR_SUB,
  stripRedditLikeDomain,
} from 'utils'
import Time from 'components/common/Time'
import RemovedBy, { QuarantinedLabel } from 'components/common/RemovedBy'
import { ORPHANED } from 'components/common/RemovedBy'
import Author from 'components/common/Author'
import Flair from 'components/common/Flair'
import SubscribersCount from 'components/common/SubscribersCount'

/**
 * Renders the metadata header rows for a user-page comment:
 *   row 1 – flair · link title · "by author" · "in /r/sub" · subscriber count
 *   row 2 – comment author · score · timestamp · action labels
 *
 * Props are the same comment-object fields spread by the parent <Comment>.
 */
const CommentHead = ({
  displayBody,
  setDisplayBody,
  url,
  rev_link_permalink,
  post_parent_removed,
  ...props
}) => {
  const {
    author,
    score,
    subreddit,
    link_title,
    link_author,
  } = props

  const rev_subreddit = PATH_STR_SUB + '/' + subreddit

  return (
    <>
      <div className="comment-head">
        <a
          onClick={() => setDisplayBody(!displayBody)}
          className="collapseToggle spaceRight"
        >
          {displayBody ? '[–]' : '[+]'}
        </a>
        <Flair
          className="link-flair"
          field="link_flair_text"
          globalVarName="post_flair"
          {...props}
        />
        <a
          href={url ? stripRedditLikeDomain(url) : rev_link_permalink}
          className="title"
        >
          {link_title}
        </a>
        {'link_author' in props && (
          <>
            <span> by </span>
            <a href={`${PATH_STR_USER}/${link_author}`} className="author">
              {link_author}
            </a>
          </>
        )}
        {'subreddit' in props && (
          <>
            <span> in </span>
            <a
              href={rev_subreddit + '/'}
              className="subreddit-link subreddit"
              data-subreddit={subreddit}
            >
              {`/r/${subreddit}`}
            </a>{' '}
            <SubscribersCount {...props} />
          </>
        )}
      </div>
      <div className="comment-head subhead">
        <Author {...props} className="spaceRight" />
        <span className="comment-score spaceRight">
          {prettyScore(score)} point{score !== 1 && 's'}
        </span>
        <Time {...props} />
        <div>
          <RemovedBy
            style={{ display: 'inline', marginRight: '5px' }}
            {...props}
          />
          {post_parent_removed.length !== 0 && (
            <RemovedBy
              removedby={ORPHANED}
              orphaned_label={post_parent_removed.join(', ')}
              style={{ display: 'inline' }}
            />
          )}
        </div>
      </div>
    </>
  )
}

export default CommentHead
