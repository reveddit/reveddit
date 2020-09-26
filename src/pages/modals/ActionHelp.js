import React from 'react'
import {ALL_ACTIONS_META} from 'pages/common/RemovedBy'

export default () => {
  console.log(ALL_ACTIONS_META)
  return (
    <>
      {
        Object.entries(ALL_ACTIONS_META).map(([key, meta]) =>
          <div key={key}>
            <h3>{meta.filter_text}</h3>
            <p>{meta.desc}</p>
          </div>
        )
      }
    </>
  )
}
