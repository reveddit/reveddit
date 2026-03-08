import React from 'react'

/**
 * Skeleton shimmer placeholder.
 * Uses the `.skeleton` CSS class defined in common.sass.
 *
 * @param {{ width?: string|number, height?: string|number, style?: React.CSSProperties, className?: string }} props
 */
const Skeleton = ({ width = '100%', height = 14, style, className = '', ...rest }) => (
  <div
    className={`skeleton ${className}`}
    style={{ width, height, ...style }}
    {...rest}
  />
)

export default Skeleton
