import React, {useState} from 'react'
import {SimpleURLSearchParams} from 'utils'
import { Spin } from 'components/Misc'
import { connect, create_qparams } from 'state'


const before_param = 'before', after_param = 'after'
const opposite = {[after_param]: before_param, [before_param]: after_param}
const params = [before_param, after_param]

const timestampPagination_page_types =
  ['search', 'subreddit_posts', 'subreddit_comments', 'duplicate_posts', 'domain_posts']

const createNavHref = (param, value) => {
  const queryParams = create_qparams()
  queryParams.delete(opposite[param])
  queryParams.set(param, value)
  return queryParams.toString()
}

const Pagination = ({bottom, subreddit, page_type, global, children}) => {
  let content = <>{children}</>
  let prev, next
  const {loading, frontPage, items, oldestTimestamp, newestTimestamp,
         paginationMeta,
        } = global.state
  const current_searchParams = create_qparams()
  const useTimestampPagination = oldestTimestamp &&
    (timestampPagination_page_types.includes(page_type) || (page_type === 'info' && current_searchParams.has('url')))
  const usingRemovedditAPI = frontPage || subreddit === 'all'
  if (paginationMeta || useTimestampPagination || usingRemovedditAPI) {
    if (paginationMeta || usingRemovedditAPI) {
      const {page_number, num_pages} = paginationMeta || {page_number: parseInt(current_searchParams.get('page')) || 1}
      if ((paginationMeta && num_pages > 1) || usingRemovedditAPI) {
        const hasPrev = page_number > 1
        const hasNext = (usingRemovedditAPI && items.length >= 100) || (paginationMeta && page_number < num_pages)
        if (hasPrev) {
          prev =  page_number > 2 ?
            current_searchParams.set('page', page_number-1).toString() :
            window.location.pathname+current_searchParams.delete('page').toString()
        }
        if (hasNext) {
          next = current_searchParams.set('page', page_number+1).toString()
        }
      }
    } else if (useTimestampPagination) {
      next = createNavHref(before_param, oldestTimestamp)
      prev = createNavHref(after_param, newestTimestamp)
    }
    const buttons = prev || next ?
      <div className={`non-item pagination ${bottom ? 'bottom' : ''}`}>
        <a href={prev} className={`prev ${! prev ? 'disabled': 'lightblue bubble'}`}>&lt;- prev</a>
        {children}
        <a href={next} className={`next ${! next ? 'disabled': 'lightblue bubble'}`}>next -&gt;</a>
      </div>
    : <>{children}</>
    content = loading && bottom ? <Spin/> : buttons
  }
  return content
}

export default connect(Pagination)
