// Compatibility shim: recreates the v5 withRouter() HOC using v6 hooks.
// This lets class components and legacy function components keep receiving
// match / location / history as props without being rewritten.
import React from 'react'
import { useParams, useLocation, useNavigate } from 'react-router-dom'

export const withRouter = Component => {
  return function WithRouterWrapper(props) {
    const params = useParams()
    const location = useLocation()
    const navigate = useNavigate()
    const match = { params }
    const history = {
      push: (to, state) => navigate(to, { state }),
      replace: (to, state) => navigate(to, { replace: true, state }),
    }
    return <Component {...props} match={match} location={location} history={history} />
  }
}
