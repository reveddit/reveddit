import React from 'react'
import {ALL_ACTIONS_META} from 'pages/common/RemovedBy'
import { RedditOrLocalLink } from 'components/Misc'

const ActionHelpEntry = ({meta}) =>
  <div>
    <h4>{meta.filter_text}</h4>
    <p>{meta.jsx_desc || meta.desc} {meta.reddit_link || meta.local_link ?
                      <RedditOrLocalLink reddit={meta.reddit_link} to={meta.local_link}>More info</RedditOrLocalLink>
                    : meta.jsx_link}</p>
  </div>
const desc = 'cludes items matching any of the checked actions.'
export default ({action}) => {
  if (action && ALL_ACTIONS_META[action]) {
    return <ActionHelpEntry meta={ALL_ACTIONS_META[action]}/>
  }
  return (
    <>
      <h3>Action help</h3>
      <p>In{desc}</p>
      <p><b>exclude</b>: Ex{desc}</p>
      {
        Object.entries(ALL_ACTIONS_META).map(([key, meta]) =>
          <ActionHelpEntry key={key} meta={meta}/>
        )
      }
    </>
  )
}
