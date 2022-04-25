import React from 'react'
import { Link, withRouter } from 'react-router-dom'
import { connect } from 'state'
import { get, put } from 'utils'
import { Shuffle, TwitterWhite } from 'pages/common/svg'

const getEntityName = (params) => {
  const { user, subreddit = '', domain = ''} = params
  return (user || subreddit || domain).toLowerCase()
}

class Header extends React.Component {
  state = {
    entity_name: '',
    random: false
  }
  welcome = () => {
    this.props.openGenericModal({hash: 'welcome'})
  }
  componentDidMount() {
    const entity_name = getEntityName(this.props.match.params)
    this.setState({entity_name})

    const hasVisitedSite = 'hasVisitedSite'
    setTimeout(() => {
      if (! get('hasNotifierExtension', false) && ! get(hasVisitedSite, false)) {
        this.welcome()
      }
      put(hasVisitedSite, true)
    }, 1000)
  }
  componentDidUpdate(prevProps) {
    const entity_name = getEntityName(this.props.match.params)
    const prev_entity_name = getEntityName(prevProps.match.params)
    if (entity_name !== prev_entity_name) {
      this.setState({entity_name})
    }
  }
  getForm = (value, display, path_type, item_type, path_suffix, opposite=false) => {
    let text_input_actions = {}
    let form_attributes = { className: `opposite ${path_type}` }
    if (! opposite) {
      form_attributes = {className: path_type}
      text_input_actions = {
        onClick: (e) => this.onClick(e, value),
        onBlur: (e) =>  this.onBlur(e, value),
        value: this.state.entity_name,
        onChange: this.handleNameChange
      }
    }

    return (
      <form {...form_attributes} onSubmit={(e) => this.handleSubmit(e, value)}>
        <span className='subheading'>{display}</span>
        <label htmlFor={item_type} className='hide-element'>{item_type}</label>
        <input id={item_type} type='text' {...text_input_actions}
        name={path_type} placeholder={item_type}/>
        {path_suffix &&
          <span className='subheading'>{`/${path_suffix}/`}</span>
        }
        <input type='submit' id='button' value='go' />
        {path_type === 'user' &&
          <button title="Look up a random redditor" id='button_shuffle'
            onClick={(e) => {
              e.preventDefault()
              this.setState({random:true})
            }}>
            <Shuffle wh='15'/>
          </button>
        }
      </form>
    )
  }

  handleSubmit = (e, defaultValue) => {
    e.preventDefault()
    const data = new FormData(e.target)
    const pair = Array.from(data.entries())[0]
    const key = pair[0], val = pair[1].trim().toLowerCase()
    if (val !== '' && (this.props.page_type === 'thread' || val !== defaultValue)) {
      this.setState({entity_name: val})
      window.location.href = `/${key}/${val}`
    }
  }
  onClick = (e, defaultValue) => {
    const val = e.target.value.trim().toLowerCase()
    if (val === defaultValue) {
      e.target.value = ''
    }
  }
  onBlur = (e, defaultValue) => {
    const val = e.target.value.trim().toLowerCase()
    if (val === '') {
      e.target.value = defaultValue
    }
  }
  handleNameChange = (e) => {
    this.setState({entity_name: e.target.value})
  }
  settings = () => {
    this.props.openGenericModal({hash: 'settings'})
  }
  render() {
    const props = this.props
    const { page_type } = props
    const { x_subreddit } = props.global.state
    if (this.state.random) {
      const sub = x_subreddit || 'all'
      const path = `/r/${sub}/x/`
      props.history.push(path)
    }
    let { user, subreddit = '', domain = ''} = props.match.params
    let path_type = '', value = '', path_suffix = '', item_type = '', display = ''
    if (['subreddit_posts','thread'].includes(page_type)) {
      path_type = 'r'
      value = subreddit
      item_type = 'subreddit'
    } else if (page_type === 'subreddit_comments') {
      path_type = 'r'
      value = subreddit
      path_suffix = 'comments'
      item_type = 'subreddit'
    } else if (user) {
      path_type = 'user'
      display = 'u/'
      value = user
      item_type = 'username'
    } else if (domain) {
      path_type = 'domain'
      value = domain
      item_type = 'domain'
    }
    value = value.toLowerCase()
    if (! display) {
      display = `${path_type}/`
    }

    return (
      <React.Fragment>
        <header>
          <div id='header'>
            <div id='site-name'><Link to="/about/">about <span className='rev'>rev</span>eddit</Link></div>
            <div id='nav'>
              <a href="#settings" onClick={this.settings}>⚙</a>
              <span> | </span>
              <Link to="/about/faq/">F.A.Q.</Link>
              <span> | </span>
              <Link to="/add-ons/">add-ons</Link>
              <span> | </span>
              <TwitterWhite/>
            </div>
            {value &&
              <div id='subheading'>
                {this.getForm(value, display, path_type, item_type, path_suffix, false)}
              </div>
            }
          </div>
          <div id='status'>
            {props.global.state.statusText &&
            <p id='status-text'>{props.global.state.statusText}</p>}
            {props.global.state.statusImage &&
            <img id='status-image' src={props.global.state.statusImage} alt='status' />}
          </div>
        </header>
      </React.Fragment>
    )
  }
}

export default connect(withRouter(Header))
