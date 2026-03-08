import React from 'react'

/**
 * Inline badge / pill.
 *
 * Wraps content in a styled span matching the existing `.bubble` convention.
 *
 * @param {{ size?: 'small'|'medium'|'big', color?: 'red'|'lightblue', className?: string, children: React.ReactNode }} props
 */
const Badge = ({ size = 'medium', color = 'red', className = '', children, ...rest }) => (
  <span className={`bubble ${size} ${color} ${className}`} {...rest}>
    {children}
  </span>
)

export default Badge
