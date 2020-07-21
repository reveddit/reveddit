import React, {useState} from 'react'
import {SimpleURLSearchParams} from 'utils'

const before_param = 'before'
const prev_before_param = 'prev_before'
const params = [before_param, prev_before_param]

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

export default ({prev, next, oldestTimestamp, newestTimestamp}) => {
  if (! prev && oldestTimestamp && newestTimestamp) {
    const current_searchParams = new SimpleURLSearchParams(window.location.search)
    const next_searchParams = clearParams(new SimpleURLSearchParams(window.location.search))
    const prev_searchParams = clearParams(new SimpleURLSearchParams(window.location.search))
    next_searchParams.set(before_param, oldestTimestamp)
    if (current_searchParams.get(before_param)) {
      setPrevParams(current_searchParams, prev_searchParams, before_param)
      prev = window.location.pathname+prev_searchParams.toString()
      setNextParams(current_searchParams, next_searchParams, before_param, oldestTimestamp)
    }
    next = window.location.pathname+next_searchParams.toString()
  }
  return (
    <div className='non-item pagination'>
      <a href={prev} className={`prev ${! prev && 'disabled'}`}>&lt;- previous</a>
      <a href={next} className={`next ${! next && 'disabled'}`}>next -&gt;</a>
    </div>
  )
}
