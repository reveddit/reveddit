import React from 'react'

/**
 * Spinner indicator.
 * Uses the `.spinner` CSS class defined in common.sass.
 *
 * @param {{ width?: string|number, inline?: boolean, style?: React.CSSProperties }} props
 */
const Spinner = ({ width, inline = false, style, ...rest }) => {
  const spinStyle = width ? { width, height: width, ...style } : style
  const spinner = <div className="spinner" style={spinStyle} {...rest} />
  if (inline) return spinner
  return <div className="non-item">{spinner}</div>
}

export default Spinner
