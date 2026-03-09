import React from 'react'
import { useGlobalStore, create_qparams, adjust_qparams_for_selection } from 'state'
import { Selection } from './SelectionBase'
import { clearPaginationParams } from 'components/Pagination'
import { usePageType } from 'contexts/page'

const types = {
  user: {
    sort: ['new', 'top', 'hot', 'controversial'],
    t: ['hour', 'day', 'week', 'month', 'year', 'all'],
  },
  aggregations: {
    sort: ['top', 'new'],
  },
}

const displayTypes = {
  user: {
    sort: {},
    t: {
      all: 'all time',
      day: 'past 24 hours',
    },
  },
  aggregations: {
    sort: {},
  },
}

const displayPrefixes = {
  user: {
    sort: '',
    t: 'past ',
  },
  aggregations: {
    sort: '',
  },
}

const RedditSortTimeBase = ({
  globalVarName,
  ...selectionProps
}) => {
  const global = useGlobalStore()
  const page_type = usePageType()
  const selectedValue = global.state[globalVarName]
  const sortIsHotOrControversial = ['top', 'controversial'].includes(
    global.state.sort
  )
  const queryParams = create_qparams()
  // clear params for aggregations pages
  clearPaginationParams(queryParams)
  return (
    <Selection {...selectionProps}>
      {types[page_type][globalVarName].map(type => {
        adjust_qparams_for_selection(
          page_type,
          queryParams,
          globalVarName,
          type
        )
        let href = window.location.pathname + queryParams.toString()
        let className = type === selectedValue ? 'selected' : ''
        if (globalVarName === 't' && !sortIsHotOrControversial) {
          href = null
          className = 'disabled'
        }
        return (
          <div key={type}>
            <a {...{ className, href }}>
              {displayTypes[page_type][globalVarName][type] ||
                displayPrefixes[page_type][globalVarName] + type}
            </a>
          </div>
        )
      })}
    </Selection>
  )
}

export default RedditSortTimeBase
