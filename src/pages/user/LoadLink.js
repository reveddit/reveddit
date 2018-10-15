import React from 'react'
import { Link } from 'react-router-dom'
import { connect } from '../../state'
import { withRouter } from 'react-router';


class LoadLink extends React.Component {

  render() {
    let userPage_after   = this.props.global.state.userNext
    let className = 'load-next'
    let text = 'view more'
    let to = this.props.location.pathname+this.props.location.search

    if (this.props.loadAll) {
      const queryParams = new URLSearchParams(this.props.location.search)
      queryParams.set('all', '')
      to = `${this.props.location.pathname}?${queryParams.toString()}`
      className = 'load-all'
      text = 'load all'
    }
    if (userPage_after && ! this.props.show) {
      return <Link className={className} to={to} onClick={() => {

        this.props.this.getItems_wrapper(this.props.user, this.props.kind, this.props.sort, '', userPage_after, this.props.limit, this.props.loadAll)
      }}>{text}</Link>
    } else {
      return ''
    }
  }
}
export default withRouter(connect(LoadLink))
