import React from 'react'
import { Link } from 'react-router-dom'
import { useGlobalStore } from 'state'
import { getRevdditUserItems } from 'data_processing/user'
import { SimpleURLSearchParams } from 'utils'

const LoadLink = ({ loadAll, user, kind }) => {
  const global = useGlobalStore()
  const { userNext, show } = global.state
  let className = 'load-next'
  let text = 'view more'
  let to = window.location.pathname + window.location.search
  const otherState: Record<string, any> = {}
  if (loadAll) {
    otherState.all = true
    const queryParams_tmp = new SimpleURLSearchParams(window.location.search)
    queryParams_tmp.set('all', 'true')
    to = `${window.location.pathname}${queryParams_tmp.toString()}`
    className = 'load-all'
    text = 'load all'
  }
  if (userNext && !show) {
    return (
      <Link
        className={className}
        to={to}
        onClick={() => {
          global.setLoading('', otherState).then(() => {
            getRevdditUserItems(user, kind, global, false)
          })
        }}
      >
        {text}
      </Link>
    )
  } else {
    return ''
  }
}
export default LoadLink
