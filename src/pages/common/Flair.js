import React from 'react'
import { connect } from 'state'
import { replaceAmpGTLT, escapeRegExp } from 'utils'

const Flair = ({global, className = '', field, globalVarName, ...props}) => {
  if (props[field]) {
    return <span className={className + ' pointer'}
      onClick={(e) => {global.selection_update(globalVarName, '"^'+escapeRegExp(e.target.textContent)+'$"', 'page_type_na')}}
    >{replaceAmpGTLT(props[field])}</span>
  }
  return null
}

export default connect(Flair)
