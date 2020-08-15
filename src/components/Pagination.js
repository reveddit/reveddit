import React, {useState} from 'react'
import {SimpleURLSearchParams} from 'utils'
import { Spin } from 'components/Misc'
import { connect, create_qparams } from 'state'


const before_param = 'before'
const prev_before_param = 'prev_before'
const params = [before_param, prev_before_param]

const timestampPagination_page_types =
  ['search', 'subreddit_posts', 'subreddit_comments', 'duplicate_posts', 'domain_posts']

const clearParams = (searchParams) => {
  for (const name of params) searchParams.delete(name)
  return searchParams
}

const getLastAndRemainder = (searchParams, param_name) => {
  const val = searchParams.get(param_name) || ''
  const list = val.split(',')
  return [list.slice(-1)[0], list.slice(0,-1).join(',')]
}

const getPrevParamName = (param_name) => 'prev_'+param_name

const setPrevParams = (current_searchParams, prev_searchParams, param_name) => {
  const prev_param_name = getPrevParamName(param_name)
  const [last, remainder] = getLastAndRemainder(current_searchParams, prev_param_name)
  if (last) {
    prev_searchParams.set(param_name, last)
    if (remainder) {
      prev_searchParams.set(prev_param_name, remainder)
    }
  }
}

const setNextParams = (current_searchParams, next_searchParams, param_name, timestamp) => {
  const prev_param_name = getPrevParamName(param_name)
  const prev_val = current_searchParams.get(prev_param_name) || ''
  next_searchParams.set(prev_param_name, (prev_val ? prev_val + ',' : '') + current_searchParams.get(param_name))
}

const Pagination = ({paginationMeta, oldestTimestamp, newestTimestamp,
                     bottom, subreddit, page_type, global, children}) => {
  let content = <>{children}</>
  let prev, next
  const {loading, frontPage, items} = global.state
  const current_searchParams = create_qparams()
  const useTimestampPagination = oldestTimestamp &&
    (timestampPagination_page_types.includes(page_type) || page_type === 'info' && current_searchParams.has('url'))
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
      const next_searchParams = clearParams(create_qparams())
      const prev_searchParams = clearParams(create_qparams())
      next_searchParams.set(before_param, oldestTimestamp)
      if (current_searchParams.get(before_param)) {
        setPrevParams(current_searchParams, prev_searchParams, before_param)
        prev = window.location.pathname+prev_searchParams.toString()
        setNextParams(current_searchParams, next_searchParams, before_param, oldestTimestamp)
      }
      next_searchParams.delete('after')
      next = window.location.pathname+next_searchParams.toString()
    }
    const prevOrNext = prev || next
    const buttons = prevOrNext ?
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
