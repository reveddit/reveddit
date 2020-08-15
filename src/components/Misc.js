import React from 'react'

export const Spin = ({width}) => {
  const spin = <img className='spin' width={width} src='/images/spin.gif'/>
  if (! width) {
    return <div className='non-item'>{spin}</div>
  }
  return spin
}
