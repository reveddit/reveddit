import React from 'react'
import { convertPathSub, PATH_STR_SUB } from 'utils'
import { QuarantinedLabel } from 'components/common/RemovedBy'
import { MessageMods } from 'components/Misc'
import { NewWindowLink } from 'components/ui/Links'
import { AuthorFocus } from 'components/thread/Comment'
import { usePageType } from 'contexts/page'

const PostActions = ({
  post,
  permalink,
  paramString,
  num_comments,
  subreddit,
  id,
  num_crossposts,
  subreddit_index,
  directlink,
  domain_index,
  loading,
  setLocalLoading,
  userPageSort,
  userPageTime,
  author,
  deleted,
}: any) => {
  const page_type = usePageType()
  const rev_subreddit = PATH_STR_SUB + '/' + subreddit
  return (
    <div>
      <span className="total-comments post-links">
        <QuarantinedLabel {...post} />
        <a
          href={convertPathSub(permalink) + paramString}
          className="nowrap"
        >
          {num_comments} comments
        </a>
        <NewWindowLink reddit={permalink}>reddit</NewWindowLink>
        <a href={`${rev_subreddit}/duplicates/${id}`}>
          other-discussions
          {num_crossposts ? ` (${num_crossposts}+)` : ''}
        </a>
        {subreddit_index}
        {directlink && <a href={directlink}>directlink</a>}
        <MessageMods {...post} />
        {page_type === 'thread' && (
          <AuthorFocus
            post={post}
            author={author}
            deleted={deleted}
            {...{ loading, setLocalLoading, userPageSort, userPageTime }}
            text="op-focus"
            addIcon={true}
          />
        )}
        {domain_index}
      </span>
    </div>
  )
}

export default PostActions
