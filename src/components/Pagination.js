import React, {useState} from 'react'
import {SimpleURLSearchParams} from 'utils'
import { Spin } from 'components/Misc'
import { connect, create_qparams } from 'state'


const before_param = 'before', after_param = 'after'
const rate_less_param = 'rate_less', rate_more_param = 'rate_more'
const params = [before_param, after_param, rate_less_param, rate_more_param]


const timestampPagination_page_types =
  ['search', 'subreddit_posts', 'subreddit_comments', 'duplicate_posts', 'domain_posts', 'aggregations']

const createNavHref = (param, value) => {
  const queryParams = create_qparams()
  clearPaginationParams(queryParams)
  queryParams.set(param, value)
  return queryParams.toString()
}

export const clearPaginationParams = (queryParams) => {
  for (const p of params) {
    queryParams.delete(p)
  }
}

const Pagination = ({bottom, subreddit, page_type, global, children}) => {
  let content = <>{children}</>
  let prev, next
  const {loading, frontPage, items, oldestTimestamp, newestTimestamp,
         paginationMeta, sort, rate_least, rate_most,
        } = global.state
  const current_searchParams = create_qparams()
  const isAggregationsTopSort = page_type === 'aggregations' && sort === 'top' && rate_least != null
  const useTimestampPagination = (
    (oldestTimestamp || isAggregationsTopSort)
    &&
    (timestampPagination_page_types.includes(page_type) || (page_type === 'info' && current_searchParams.has('url'))))
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
      if (isAggregationsTopSort) {
        next = createNavHref(rate_less_param, rate_least)
        prev = createNavHref(rate_more_param, rate_most)
      } else {
        next = createNavHref(before_param, oldestTimestamp)
        prev = createNavHref(after_param, newestTimestamp)
      }
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
