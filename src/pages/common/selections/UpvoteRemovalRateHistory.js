import React from 'react'
import { withRouter } from 'react-router'
import { connect } from 'state'
import { Query } from 'react-apollo'
import gql from 'graphql-tag'
import * as d3 from 'd3'
import CommentPreview from 'pages/common/CommentPreview'
import PostPreview from 'pages/common/PostPreview'

class Sparkline extends React.PureComponent {
  constructor(props) {
    super(props);
    this.xScale = d3.scaleLinear();
    this.yScale = d3.scaleLinear();
    this.line = d3.line();
    this._updateDataTransforms(props);
  }
  componentDidMount() {
    const self = this;
    d3.select('svg')
    .on('mousemove', function() { self._onMouseMove(d3.mouse(this)[0]); })
    .on('click', function() { self._onMouseClick(d3.mouse(this)[0]); })
    .on('mouseleave', function() { self._onMouseMove(null); });
  }
  componentDidUpdate(newProps) {
    this._updateDataTransforms(newProps);
  }
  _updateDataTransforms(props) {
    const {xAccessor, yAccessor, width, height, data} = props;
    let len = data.length, min = Infinity, max = -Infinity
    while (len--) {
      const val = data[len].y.rate
      if (val < min) {
        min = val
      }
      if (val > max) {
        max = val
      }
    }
    this.xScale
      .domain([0, data.length])
      .range([0, width]);
    this.yScale
      .domain([min, max])
      .range([height, 0]);
    this.line
      .x((d, i) => this.xScale(xAccessor(d, i)))
      .y((d, i) => this.yScale(yAccessor(d, i)));
    this.bisectByX = d3.bisector(xAccessor).left;
  }
  _onMouseClick(xPixelPos) {
    const {data, onClick, xAccessor} = this.props;
    if (xPixelPos === null) {
      onClick(null, null);
    }
    else {
      const xValue = this.xScale.invert(xPixelPos);
      const i = this._findClosest(data, xValue, xAccessor);
      onClick(data[i], i);
    }
  }
  _onMouseMove(xPixelPos) {
    const {data, onHover, xAccessor} = this.props;
    if (xPixelPos === null) {
      onHover(null, null);
    }
    else {
      const xValue = this.xScale.invert(xPixelPos);
      const i = this._findClosest(data, xValue, xAccessor);
      onHover(data[i], i);
    }
  }
  _findClosest(array, value, accessor) {
    if (!array || !array.length) {
      return null;
    }

    const bisect = d3.bisector(accessor).right;
    const pointIndex = bisect(array, value);
    const left_i = pointIndex - 1
    const right_i = pointIndex
    const left = array[left_i], right = array[right_i];

    let i;

    // take the closer element
    if (left && right) {
      i = Math.abs(value - accessor(left)) < Math.abs(value - accessor(right)) ? left_i : right_i;
    } else if (left) {
      i = left_i;
    } else {
      i = right_i;
    }

    return i;
  }

  render() {
    const {data, width, height, xAccessor, hovered} = this.props;
    const hoveredRender = (hovered)
      ? (
        <line
          x1={this.xScale(xAccessor(hovered))}
          x2={this.xScale(xAccessor(hovered))}
          y0={0}
          y1={height}
          style={{strokeWidth: '2px', stroke: '#ddd'}}
        />
      )
      : null;
    return (
      <svg width={width} height={height} ref="svg">
        <path
          style={{fill: 'none', strokeWidth: '2px', stroke: '#828282'}}
          d={this.line(data)}
        />
        {hoveredRender}
      </svg>
    );
  }
}
Sparkline.defaultProps = {
  xAccessor: ({x}) => x,
  yAccessor: ({y}) => y.rate,
};



const numGraphPointsParamKey = 'rr_ngp'
const sortByParamKey = 'rr_sortby'
const numGraphPointsDefault = 50
const sortByDefault = 'rate'

class UpvoteRemovalRateHistory extends React.Component {
  state = {
    hovered: null,
    clicked: null,
    [numGraphPointsParamKey]: numGraphPointsDefault,
    [sortByParamKey]: sortByDefault
  }

  componentDidMount() {
    const queryParams = new URLSearchParams(this.props.location.search)
    const stateUpdate = {}
    let paramVal = queryParams.get(numGraphPointsParamKey)
    if (paramVal) {
      stateUpdate[numGraphPointsParamKey] = paramVal
    }
    paramVal = queryParams.get(sortByParamKey)
    if (paramVal) {
      stateUpdate[sortByParamKey] = paramVal
    }
    this.setState(stateUpdate)
  }

  updateStateAndURL = (paramKey, value, defaultValue) => {
    this.setState({[paramKey]: value})
    const queryParams = new URLSearchParams(this.props.location.search)
    if (value !== defaultValue) {
      queryParams.set(paramKey, value)
    } else {
      queryParams.delete(paramKey)
    }
    let to = `${this.props.location.pathname}?${queryParams.toString()}`
    this.props.history.push(to)
  }

  render() {
    const subreddit = this.props.match.params.subreddit.toLowerCase()
    const {setBefore, page_type} = this.props
    const {hovered, clicked} = this.state

    let value = ''
    if (hovered) {
      if (page_type === 'subreddit_posts') {
        value = <PostPreview {...hovered.y}/>
      } else {
        value = <CommentPreview {...hovered.y}/>
      }
    }

    return (
      <Query
        query={gql`
          {
            commentremovedratesview(where: {subreddit: {_eq: "${subreddit}"}},
                                    limit: ${this.state[numGraphPointsParamKey]},
                                    order_by: {${this.state[sortByParamKey]}: desc_nulls_last}) {
              body
              created_utc
              id_of_max_pos_removed_item
              last_created_utc
              last_id
              rate
              score
              subreddit
              title
              total_items
            }
            postremovedratesview(where: {subreddit: {_eq: "${subreddit}"}},
                                 limit: ${this.state[numGraphPointsParamKey]},
                                 order_by: {${this.state[sortByParamKey]}: desc_nulls_last}) {
              created_utc
              id_of_max_pos_removed_item
              last_created_utc
              last_id
              rate
              score
              subreddit
              title
              num_comments
              total_items
            }
          }
      `}
      >
        {({ loading, error, data }) => {
          if (loading) return <p>Loading...</p>;
          if (error) return <p>Error :(</p>;

          let selected_data = []
          if (page_type === 'subreddit_posts') {
            selected_data = data.postremovedratesview
          } else {
            selected_data = data.commentremovedratesview
          }
          return (
            <div className='upvoteRemovalRate selection'>
              <div className='title'>Upvote Removal Rate</div>
              <div className='filter-menu'>
                <label title="each graph point represents a period of either 1,000 comments or 1,000 posts">
                  # graph points</label>
                <select value={this.state[numGraphPointsParamKey]}
                        onChange={(e) =>
                            this.updateStateAndURL(numGraphPointsParamKey,
                                                   parseInt(e.target.value),
                                                   numGraphPointsDefault)}>
                {
                  [10,50,100,200,500,1000].map(n => {
                    let displayValue = Number(n).toLocaleString()
                    return (
                      <option key={n} value={n}>
                        {displayValue}
                      </option>
                    )
                  })
                }
                </select>
              </div>
              <div className='filter-menu'>
                <label title="sort order of database retrieval. results are resorted by date for graph display">
                  sort</label>
                <select value={this.state[sortByParamKey]}
                        onChange={(e) =>
                            this.updateStateAndURL(sortByParamKey,
                                                   e.target.value,
                                                   sortByDefault)}>
                  <option key='rate' value='rate'>top</option>
                  <option key='last_created_utc' value='last_created_utc'>new</option>
                </select>
              </div>
              <div>
                <Sparkline
                  data={selected_data.sort((a,b) => a.last_created_utc - b.last_created_utc).map((y, x) => { return {x, y}; })}
                  width={200}
                  height={50}
                  hovered={hovered}
                  onHover={(hovered, index) => this.setState({hovered})}
                  onClick={(clicked, index) => this.props.setBefore(clicked.y.last_created_utc, clicked.y.last_id, clicked.y.total_items)}
                />
                <div>
                  {value}
                </div>
              </div>
            </div>
          )
        }}
      </Query>

    )
  }
}

export default withRouter(connect(UpvoteRemovalRateHistory))
