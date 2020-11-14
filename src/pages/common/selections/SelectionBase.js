import React from 'react'
import { QuestionMarkModal } from 'components/Misc'
import SortIcon from 'svg/sort.svg'

export const Selection = ({children, className = '', title = null, titleTitle = null,
                           isSet = false, isFilter = false, isSort = false, titleHelpModal = null }) => {
  const classes = []
  if (isSet) classes.push('set')
  if (isFilter) classes.push('filter')
  let titleChildren = [title]
  if (titleHelpModal) {
    titleChildren.push(
      <QuestionMarkModal key='q' modalContent={titleHelpModal}/>
    )
  }
  if (isSort) {
    titleChildren.unshift(
      <img key='s' src={SortIcon} alt="Sort icon" style={{verticalAlign: 'middle', height: '20px', width: '20px', marginRight: '15px'}} />,
    )
  }
  return (
    <div className={className+' selection '+classes.join(' ')}>
      {title &&
        <Title title={titleTitle}>{titleChildren}</Title>
      }
      {children}
    </div>
  )
}

const Title = ({children, ...props}) => {
  return (
    <div className='title nowrap' {...props}>
      {children}
    </div>
  )
}
