import React from 'react'
import {ALL_ACTIONS_META} from 'pages/common/RemovedBy'

export default () => {
  return (
    <>
      {
        Object.entries(ALL_ACTIONS_META).map(([key, meta]) =>
          <div key={key}>
            <h3>{meta.filter_text}</h3>
            <p>{meta.desc}{meta.morelink && <> <a target='_blank' href={meta.morelink}>More info</a></>}</p>
          </div>
        )
      }
    </>
  )
}
