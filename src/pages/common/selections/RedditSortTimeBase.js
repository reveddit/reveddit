import React from 'react'
import { connect, create_qparams, adjust_qparams_for_selection } from 'state'
import { Selection } from './SelectionBase'

const types = {
  user: {
    sort: ['new', 'top', 'hot', 'controversial'],
    t: ['hour', 'day', 'week', 'month', 'year', 'all'],
  },
  aggregations: {
    sort: ['top', 'new']
  },
}

const displayTypes = {
  user: {
    sort: {},
    t: {
      'all': 'all time',
      'day': 'past 24 hours',
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

const RedditSortTimeBase = ({global, page_type, globalVarName, className, title}) => {
  const selectedValue = global.state[globalVarName]
  const queryParams = create_qparams()
  return (
    <Selection className={className} title={title}>
      {
        types[page_type][globalVarName].map(type => {
          adjust_qparams_for_selection(page_type, queryParams, globalVarName, type)
          return (
            <div key={type}>
              <a className={type === selectedValue ? 'selected': ''}
                 href={`${window.location.pathname}${queryParams.toString()}`}>{displayTypes[page_type][globalVarName][type] || displayPrefixes[page_type][globalVarName]+type}</a>
            </div>
          )
        })
      }
    </Selection>
  )
}

export default connect(RedditSortTimeBase)
