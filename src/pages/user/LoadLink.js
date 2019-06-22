import React from 'react'
import { Link } from 'react-router-dom'
import { connect } from 'state'
import { withRouter } from 'react-router';
import { getRevdditUserItems, getQueryParams } from 'data_processing/user'
import { SimpleURLSearchParams } from 'utils'

class LoadLink extends React.Component {

  render() {
    let userPage_after   = this.props.global.state.userNext
    let className = 'load-next'
    let text = 'view more'
    let to = this.props.location.pathname+this.props.location.search
    const qp = getQueryParams()
    if (this.props.loadAll) {
      qp.loadAll = true
      const queryParams_tmp = new SimpleURLSearchParams(this.props.location.search)
      queryParams_tmp.set('all', 'true')
      to = `${this.props.location.pathname}?${queryParams_tmp.toString()}`
      className = 'load-all'
      text = 'load all'
    }
    if (userPage_after && ! this.props.show) {
      return <Link className={className} to={to} onClick={() => {
        getRevdditUserItems(this.props.user,
                            this.props.kind,
                            qp,
                            this.props.global)
      }}>{text}</Link>
    } else {
      return ''
    }
  }
}
export default withRouter(connect(LoadLink))
