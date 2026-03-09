import React from 'react'
import { replaceAmpGTLT, PATH_STR_SUB } from 'utils'
import Time from 'components/common/Time'
import RemovedBy from 'components/common/RemovedBy'
import Author from 'components/common/Author'
import Flair from './Flair'
import SubscribersCount from './SubscribersCount'

const PostHeader = (props: any) => {
  const { url, title, domain, subreddit } = props
  const rev_subreddit = PATH_STR_SUB + '/' + subreddit
  return (
    <>
      <Flair
        className="link-flair"
        field="link_flair_text"
        globalVarName="post_flair"
        {...props}
      />
      <a className="thread-title" href={url}>
        {replaceAmpGTLT(title)}
      </a>
      <span className="domain">({domain})</span>
      <div className="thread-info">
        submitted <Time {...props} /> by <Author {...props} /> to{' '}
        <a className="subreddit-link" href={rev_subreddit + '/'}>
          /r/{subreddit}
        </a>{' '}
        <SubscribersCount {...props} />
        <div>
          <RemovedBy {...props} />
        </div>
      </div>
    </>
  )
}

export default PostHeader
