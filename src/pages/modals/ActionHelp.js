import React from 'react'
import {ALL_ACTIONS_META} from 'pages/common/RemovedBy'

const ActionHelpEntry = ({meta}) =>
  <div>
    <h3>{meta.filter_text}</h3>
    <p>{meta.desc}{meta.morelink && <> <a target='_blank' href={meta.morelink}>More info</a></>}</p>
  </div>

export default ({action}) => {
  if (action && ALL_ACTIONS_META[action]) {
    return <ActionHelpEntry meta={ALL_ACTIONS_META[action]}/>
  }
  return (
    <>
      {
        Object.entries(ALL_ACTIONS_META).map(([key, meta]) =>
          <ActionHelpEntry key={key} meta={meta}/>
        )
      }
    </>
  )
}
