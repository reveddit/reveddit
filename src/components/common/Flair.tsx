import React from 'react'
import { useGlobalStore } from 'state'
import { replaceAmpGTLT, escapeRegExp } from 'utils'

const Flair = ({
  page_type = '',
  className = '',
  field,
  globalVarName,
  ...props
}) => {
  const global = useGlobalStore()
  if (props[field]) {
    return (
      <span
        className={className + ' pointer'}
        onClick={e => {
          const escapedFlairRegex =
            '"^' + escapeRegExp(e.target.textContent).replace(/"/g, '.') + '$"'
          return global.resetFilters(page_type, {
            [globalVarName]: escapedFlairRegex,
          })
        }}
      >
        {replaceAmpGTLT(props[field])}
      </span>
    )
  }
  return null
}

export default Flair
