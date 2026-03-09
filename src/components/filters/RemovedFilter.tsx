import React from 'react'
import { useGlobalStore, removedFilter_types, removedFilter_text } from 'state'
import { Selection } from './SelectionBase'

const RemovedFilter = ({ page_type }) => {
  const global = useGlobalStore()
  const removedFilter = global.state.removedFilter
  const updateStateAndURL = global.removedFilter_update
  return (
    <Selection
      className="removalStatusFilter"
      isFilter={true}
      isSet={removedFilter !== removedFilter_types.all}
      title="Status"
    >
      {Object.keys(removedFilter_types).map(type => (
        <label key={type}>
          <input
            name="removedFilter_types"
            type="radio"
            value={removedFilter_types[type]}
            checked={removedFilter === removedFilter_types[type]}
            onChange={e => updateStateAndURL(e.target.value, page_type)}
          />
          <span>{removedFilter_text[type]}</span>
        </label>
      ))}
    </Selection>
  )
}

export default RemovedFilter
