import React from 'react'
import { connect } from 'state'
import { replaceAmpGTLT, escapeRegExp } from 'utils'

const reset = ['categoryFilter_author', 'thread_before'] // reset for threads

const Flair = ({global, className = '', field, globalVarName, ...props}) => {
  if (props[field]) {
    return <span className={className + ' pointer'}
      onClick={(e) => {
        const escapedFlairRegex = '"^'+escapeRegExp(e.target.textContent).replaceAll('"', '.')+'$"'
        return global.selection_set_reset({set: {[globalVarName]: escapedFlairRegex},
                                           reset,
                                           page_type: 'page_type_na',
                                         })
      }
    }>{replaceAmpGTLT(props[field])}</span>
  }
  return null
}

export default connect(Flair)
