import React from 'react'
import { connect } from 'state'
import { replaceAmpGTLT, escapeRegExp } from 'utils'

const Flair = ({page_type, global, className = '', field, globalVarName, ...props}) => {
  if (props[field]) {
    return <span className={className + ' pointer'}
      onClick={(e) => {
        const escapedFlairRegex = '"^'+escapeRegExp(e.target.textContent).replaceAll('"', '.')+'$"'
        return global.resetFilters(page_type, {[globalVarName]: escapedFlairRegex})
      }
    }>{replaceAmpGTLT(props[field])}</span>
  }
  return null
}

export default connect(Flair)
