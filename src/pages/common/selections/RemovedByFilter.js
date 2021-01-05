import React from 'react'
import { connect } from 'state'
import { REMOVAL_META, ANTI_EVIL_REMOVED, USER_REMOVED, USER_REMOVED_META,
         COLLAPSED, COLLAPSED_META, MISSING_IN_THREAD, MISSING_IN_THREAD_META,
         ORPHANED, ORPHANED_META
} from 'pages/common/RemovedBy'
import { Selection } from './SelectionBase'

const ex = 'exclude'
const RemovedByFilter = (props) => {
  const {page_type, global} = props
  const {removedByFilter, exclude_action} = global.state
  let removal_meta = REMOVAL_META
  if (page_type !== 'user') {
    removal_meta[USER_REMOVED] = USER_REMOVED_META
  }
  if (['thread', 'user', 'subreddit_comments', 'info', 'search'].includes(page_type)) {
    removal_meta[COLLAPSED] = COLLAPSED_META
  }
  if (['thread', 'subreddit_comments'].includes(page_type)) {
    delete removal_meta[ANTI_EVIL_REMOVED]
  }
  if (['thread', 'missing_comments', 'user'].includes(page_type)) {
    removal_meta[MISSING_IN_THREAD] = MISSING_IN_THREAD_META
  }
  if (['user', 'subreddit_comments', 'info', 'search', 'missing_comments'].includes(page_type)) {
    removal_meta[ORPHANED] = ORPHANED_META
  }
  return (
    <Selection className='removedbyFilter' isFilter={true} isSet={Object.keys(removedByFilter).length !== 0}
               title='Action' titleHelpModal={{hash:'action_help'}}>
      {
        Object.keys(removal_meta).map(type => {
          return (
            <div key={type}>
              <label title={removal_meta[type].desc}>
                <input id={type} type='checkbox'
                  checked={removedByFilter[type] !== undefined}
                  value={type}
                  onChange={(e) => global.removedByFilter_update(e.target, page_type)}
                />
                <span>{removal_meta[type].filter_text}</span>
              </label>
            </div>
          )
        })
      }
      <ExcludeLabel globalVarName='exclude_action' page_type={page_type} />
    </Selection>
  )

}

export const ExcludeLabel = connect(({global, globalVarName, page_type}) => {
  const value = global.state[globalVarName]
  return (
    <label title={ex}>
      <input className={ex} type='checkbox'
        checked={value}
        value={ex}
        onChange={(e) => global.selection_update(globalVarName, e.target.checked, page_type)}/>
      <span>{ex}</span>
    </label>
  )
})

export default connect(RemovedByFilter)
