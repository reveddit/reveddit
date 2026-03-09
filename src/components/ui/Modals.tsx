import React from 'react'
import { QuestionMark } from 'components/common/svg'
import ModalContext from 'contexts/modal'

export const buttonClasses = 'pointer bubble medium lightblue'

export const QuestionMarkModal = ({
  modalContent,
  fill = undefined,
  text = undefined,
  wh = '20',
}: any) => {
  const modal = React.useContext(ModalContext)
  return (
    <a className="pointer" onClick={() => modal.openModal(modalContent)}>
      {text ? (
        text
      ) : (
        <QuestionMark style={{ marginLeft: '10px' }} wh={wh} fill={fill} />
      )}
    </a>
  )
}

export const ModalWithButton = ({
  text,
  title,
  buttonText,
  buttonFn,
  children,
}) => {
  const modal = React.useContext(ModalContext)
  return (
    <a
      className="pointer"
      onClick={() =>
        modal.openModal({
          content: (
            <StructuredContent
              {...{
                title: title || text,
                content: (
                  <>
                    {children}
                    <p style={{ textAlign: 'center' }}>
                      <a
                        className={buttonClasses}
                        onClick={() => {
                          modal.closeModal()
                          buttonFn()
                        }}
                      >
                        {buttonText}
                      </a>
                    </p>
                  </>
                ),
              }}
            />
          ),
        })
      }
    >
      {text}
    </a>
  )
}

export const HelpModal = ({ title = '', content = '', fill }) => {
  return (
    <QuestionMarkModal
      fill={fill}
      modalContent={{ content: <Help {...{ title, content }} /> }}
    />
  )
}

export const Help = ({ title = '', content = '' }) => {
  return <StructuredContent {...{ title: title + ' help', content }} />
}

const StructuredContent = ({ title = '', content = '' }) => {
  return (
    <div>
      <h3>{title}</h3>
      {content}
    </div>
  )
}
