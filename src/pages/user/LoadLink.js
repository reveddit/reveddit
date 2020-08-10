import React from 'react'
import { Link } from 'react-router-dom'
import { connect } from 'state'
import { getRevdditUserItems, getQueryParams } from 'data_processing/user'
import { SimpleURLSearchParams } from 'utils'

class LoadLink extends React.Component {

  render() {
    let userPage_after   = this.props.global.state.userNext
    let className = 'load-next'
    let text = 'view more'
    let to = window.location.pathname+window.location.search
    const qp = getQueryParams()
    if (this.props.loadAll) {
      qp.loadAll = true
      const queryParams_tmp = new SimpleURLSearchParams(window.location.search)
      queryParams_tmp.set('all', 'true')
      to = `${window.location.pathname}${queryParams_tmp.toString()}`
      className = 'load-all'
      text = 'load all'
    }
    if (userPage_after && ! this.props.show) {
      return <Link className={className} to={to} onClick={() => {
        this.props.global.setLoading('')
        .then(() => {
          getRevdditUserItems(this.props.user,
                              this.props.kind,
                              qp,
                              this.props.global)
        })
      }}>{text}</Link>
    } else {
      return ''
    }
  }
}
export default connect(LoadLink)
