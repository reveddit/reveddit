import React from 'react'
import { connect, create_qparams, adjust_qparams_for_selection } from 'state'
import { Selection } from './SelectionBase'

const types = {
  sort: ['new', 'top', 'hot', 'controversial'],
  t: ['hour', 'day', 'week', 'month', 'year', 'all'],
}

const displayTypes = {
  sort: {},
  t: {
    'all': 'all time',
    'day': 'past 24 hours',
  },
}

const displayPrefixes = {
  sort: '',
  t: 'past ',
}

const RedditSortTimeBase = ({global, globalVarName, className, title}) => {
  const selectedValue = global.state[globalVarName]
  const queryParams = create_qparams()

  return (
    <Selection className={className} title={title}>
      {
        types[globalVarName].map(type => {
          adjust_qparams_for_selection('user', queryParams, globalVarName, type)
          return (
            <div key={type}>
              <a className={type === selectedValue ? 'selected': ''}
                 href={`${window.location.pathname}${queryParams.toString()}`}>{displayTypes[globalVarName][type] || displayPrefixes[globalVarName]+type}</a>
            </div>
          )
        })
      }
    </Selection>
  )
}

export default connect(RedditSortTimeBase)
