import React from 'react'

const ModalContext = React.createContext()

export default ModalContext

export const ModalConsumer = ModalContext.Consumer
export const ModalProvider = ModalContext.Provider
