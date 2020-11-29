import React from 'react'
import {ALL_ACTIONS_META} from 'pages/common/RemovedBy'
import { RedditOrLocalLink } from 'components/Misc'

const ActionHelpEntry = ({meta}) =>
  <div>
    <h3>{meta.filter_text}</h3>
    <p>{meta.desc} <RedditOrLocalLink reddit={meta.reddit_link} to={meta.local_link}>More info</RedditOrLocalLink></p>
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
