import React, { useState, useRef, useEffect } from 'react'
import { useGlobalStore, adjust_qparams_for_selection, updateURL } from 'state'
import Preview from 'components/common/Preview'
import {
  prettyFormatBigNumber,
  SimpleURLSearchParams,
  ifNumParseInt,
  truthyOrUndefined,
} from 'utils'
import { Fetch } from 'hooks/fetch'
import { Selection } from './SelectionBase'
import { QuestionMarkModal } from 'components/ui/Modals'
import { urr_help, urr_title, own_page_text } from 'components/filters/urr-help'
import {
  getAggregationsURL,
  numGraphPointsParamKey,
  sortByParamKey,
  contentTypeParamKey,
  aggregationPeriodParams,
  agg_defaults_for_page,
} from 'api/reveddit'
import { pageTypes } from 'components/layout/DefaultLayout'
import { usePageType } from 'contexts/page'

// ── Inline helpers (replace d3) ──────────────────────────────────────

const linearScale = (domain: [number, number], range: [number, number]) => {
  const [d0, d1] = domain
  const [r0, r1] = range
  const scale = (v: number) => r0 + ((v - d0) / (d1 - d0)) * (r1 - r0)
  scale.invert = (v: number) => d0 + ((v - r0) / (r1 - r0)) * (d1 - d0)
  return scale
}

const buildLinePath = (
  data: any[],
  xFn: (d: any, i: number) => number,
  yFn: (d: any, i: number) => number
) =>
  data.map((d, i) => `${i === 0 ? 'M' : 'L'}${xFn(d, i)},${yFn(d, i)}`).join('')

const bisectRight = (
  array: any[],
  value: number,
  accessor: (d: any) => number
) => {
  let lo = 0,
    hi = array.length
  while (lo < hi) {
    const mid = (lo + hi) >>> 1
    if (accessor(array[mid]) <= value) lo = mid + 1
    else hi = mid
  }
  return lo
}

/** Convert a mouse event's clientX/Y into SVG user-space coordinates. */
const clientToSVGPoint = (
  svg: SVGSVGElement,
  clientX: number,
  clientY: number
) => {
  const pt = svg.createSVGPoint()
  pt.x = clientX
  pt.y = clientY
  const ctm = svg.getScreenCTM()
  return ctm ? pt.matrixTransform(ctm.inverse()) : pt
}

// ─────────────────────────────────────────────────────────────────────

const defaultXAccessor = ({ x }: any, _i?: number) => x
const defaultYAccessor = ({ y }: any, _i?: number) => y.rate

const Sparkline = ({
  data,
  width,
  height,
  hovered,
  onHover,
  onClick,
  xAccessor = defaultXAccessor,
  yAccessor = defaultYAccessor,
}) => {
  const svgRef = useRef<SVGSVGElement>(null)

  // Compute scales every render (data/dimensions may change)
  let min = Infinity,
    max = -Infinity
  for (let k = 0; k < data.length; k++) {
    const val = data[k].y.rate
    if (val < min) min = val
    if (val > max) max = val
  }
  const xScale = linearScale([0, data.length], [0, width])
  const yScale = linearScale([min, max], [height, 0])

  const pathD = buildLinePath(
    data,
    (d, i) => xScale(xAccessor(d, i)),
    (d, i) => yScale(yAccessor(d, i))
  )

  const findClosest = (array: any[], value: number) => {
    if (!array || !array.length) return null
    const idx = bisectRight(array, value, xAccessor)
    const left_i = idx - 1
    const right_i = idx
    const left = array[left_i],
      right = array[right_i]
    if (left && right) {
      return Math.abs(value - xAccessor(left)) <
        Math.abs(value - xAccessor(right))
        ? left_i
        : right_i
    }
    return left ? left_i : right_i
  }

  // Native mouse handlers using SVG coordinate conversion
  useEffect(() => {
    const svgEl = svgRef.current
    if (!svgEl) return () => {}

    const getIndex = (e: MouseEvent) => {
      const svgPt = clientToSVGPoint(svgEl, e.clientX, e.clientY)
      const xValue = xScale.invert(svgPt.x)
      return findClosest(data, xValue)
    }

    const handleMove = (e: MouseEvent) => {
      const i = getIndex(e)
      if (i !== null && data[i]) onHover(data[i], i)
    }
    const handleClick = (e: MouseEvent) => {
      const i = getIndex(e)
      if (i !== null && data[i]) onClick(data[i], i)
    }
    const handleLeave = () => onHover(null, null)

    svgEl.addEventListener('mousemove', handleMove)
    svgEl.addEventListener('click', handleClick)
    svgEl.addEventListener('mouseleave', handleLeave)
    return () => {
      svgEl.removeEventListener('mousemove', handleMove)
      svgEl.removeEventListener('click', handleClick)
      svgEl.removeEventListener('mouseleave', handleLeave)
    }
  })

  let resolvedHovered = hovered
  const before_id = new SimpleURLSearchParams(window.location.search).get(
    'before_id'
  )
  if (before_id) {
    data.forEach(point => {
      if (point.y.last_id == before_id && !resolvedHovered) {
        resolvedHovered = point
      }
    })
  }
  const hoveredRender = resolvedHovered ? (
    <line
      x1={xScale(xAccessor(resolvedHovered))}
      x2={xScale(xAccessor(resolvedHovered))}
      y1={0}
      y2={height}
      style={{ strokeWidth: '2px', stroke: 'red', opacity: 0.65 }}
    />
  ) : null
  return (
    <svg
      ref={svgRef}
      viewBox={`0 0 ${width} ${height}`}
      preserveAspectRatio="none"
      style={{ width: '100%', height: `${height}px`, cursor: 'crosshair' }}
    >
      <rect width={width} height={height} fill="transparent" />
      <path
        style={{ fill: 'none', strokeWidth: '2px', stroke: '#828282' }}
        d={pathD}
      />
      {hoveredRender}
    </svg>
  )
}

const _commonFields = [
  'created_utc',
  'id_of_max_pos_removed_item',
  'last_created_utc',
  'last_id',
  'rate',
  'score',
  'subreddit',
  'title',
  'total_items',
]

const UpvoteRemovalRateHistory = ({ subreddit }) => {
  const global = useGlobalStore()
  const page_type = usePageType()
  const queryParams_init = new SimpleURLSearchParams(window.location.search)
  const initState = { ...aggregationPeriodParams }
  Object.keys(aggregationPeriodParams).forEach(param => {
    const paramVal = queryParams_init.get(param)
    if (paramVal) {
      initState[param] = ifNumParseInt(paramVal)
    }
  })

  const [hovered, setHovered] = useState(null)
  const [_clicked, _setClicked] = useState(null)
  const [displayOptions, setDisplayOptions] = useState(false)
  const [aggParams, setAggParams] = useState(initState)

  const { over18, threadPost } = global.state
  if (
    (page_type !== 'thread' && truthyOrUndefined(over18)) ||
    threadPost.over_18
  ) {
    return null
  }

  const toggleDisplayOptions = () => setDisplayOptions(!displayOptions)
  const getDisplayOptionsText = () =>
    displayOptions ? '[–] options' : '[+] options'

  const updateStateAndURL = (paramKey, value, defaultValue) => {
    setAggParams(prev => ({ ...prev, [paramKey]: value }))
    const queryParams = new SimpleURLSearchParams(window.location.search)
    if (value !== defaultValue) {
      queryParams.set(paramKey, value)
    } else {
      queryParams.delete(paramKey)
    }
    updateURL(queryParams)
  }

  let sort = 'top'
  let type = 'comments'
  const limit = aggParams[numGraphPointsParamKey]
  if (aggParams[sortByParamKey] === 'last_created_utc') {
    sort = 'new'
  }
  if (aggParams[contentTypeParamKey] === 'posts') {
    type = 'posts'
  }
  const queryParams = new SimpleURLSearchParams()
  adjust_qparams_for_selection(
    pageTypes.aggregations,
    queryParams,
    'content',
    type
  )
  if (limit > agg_defaults_for_page.limit) {
    adjust_qparams_for_selection(
      pageTypes.aggregations,
      queryParams,
      'n',
      limit
    )
  }
  adjust_qparams_for_selection(
    pageTypes.aggregations,
    queryParams,
    'sort',
    sort
  )
  const own_page = `/r/${subreddit}/history/` + queryParams.toString()
  return (
    <Fetch
      url={getAggregationsURL({ type, subreddit, limit, sort })}
      render={({ loading, error, data }) => {
        if (loading)
          return (
            <div
              className="skeleton"
              style={{ width: '100%', height: 80, marginTop: 8 }}
            />
          )
        if (error) return <p>Error :(</p>
        data = data.data
          .sort((a, b) => a.last_created_utc - b.last_created_utc)
          .map((y, x) => {
            return { x, y }
          })
        const before_id = new SimpleURLSearchParams(window.location.search).get(
          'before_id'
        )
        let resolvedHovered = hovered
        if (!resolvedHovered && before_id) {
          data.forEach(point => {
            if (point.y.last_id == before_id) {
              resolvedHovered = point
            }
          })
        }
        return (
          <Selection
            className="upvoteRemovalRate"
            title={urr_title}
            titleTitle="percentage karma removed over time"
          >
            <div className="toggleOptions">
              <a onClick={toggleDisplayOptions} className="collapseToggle">
                {getDisplayOptionsText()}
              </a>
              <QuestionMarkModal modalContent={{ content: urr_help }} />
            </div>
            {displayOptions && (
              <div className="options">
                <div className="filter-menu">
                  <label
                    className="filter-name"
                    title="each graph point represents a period of either 1,000 comments or 1,000 posts"
                  >
                    size
                  </label>
                  {[10, 50, 500, 1000].map(n => {
                    const displayValue = prettyFormatBigNumber(n)
                    return (
                      <label key={n}>
                        <input
                          type="radio"
                          value={n}
                          checked={limit == n}
                          onChange={e =>
                            updateStateAndURL(
                              numGraphPointsParamKey,
                              parseInt(e.target.value),
                              aggregationPeriodParams[numGraphPointsParamKey]
                            )
                          }
                        />
                        <span>{displayValue}</span>
                      </label>
                    )
                  })}
                </div>
                <div className="filter-menu">
                  <label
                    className="filter-name"
                    title="sort order of database retrieval. results are resorted by date for graph display"
                  >
                    sort
                  </label>
                  <label>
                    <input
                      type="radio"
                      value="rate"
                      checked={sort == 'top'}
                      onChange={e =>
                        updateStateAndURL(
                          sortByParamKey,
                          e.target.value,
                          aggregationPeriodParams[sortByParamKey]
                        )
                      }
                    />
                    <span>top</span>
                  </label>
                  <label>
                    <input
                      type="radio"
                      value="last_created_utc"
                      checked={sort == 'new'}
                      onChange={e =>
                        updateStateAndURL(
                          sortByParamKey,
                          e.target.value,
                          aggregationPeriodParams[sortByParamKey]
                        )
                      }
                    />
                    <span>new</span>
                  </label>
                </div>
                <div className="filter-menu">
                  <label className="filter-name">type</label>
                  <label>
                    <input
                      type="radio"
                      value="comments"
                      checked={type === 'comments'}
                      onChange={e =>
                        updateStateAndURL(
                          contentTypeParamKey,
                          e.target.value,
                          aggregationPeriodParams[contentTypeParamKey]
                        )
                      }
                    />
                    <span>comments</span>
                  </label>
                  <label>
                    <input
                      type="radio"
                      value="posts"
                      checked={type === 'posts'}
                      onChange={e =>
                        updateStateAndURL(
                          contentTypeParamKey,
                          e.target.value,
                          aggregationPeriodParams[contentTypeParamKey]
                        )
                      }
                    />
                    <span>posts</span>
                  </label>
                </div>
              </div>
            )}
            <div className="graph">
              <Sparkline
                data={data}
                width={200}
                height={50}
                hovered={resolvedHovered}
                onHover={(hovered, _index) => setHovered(hovered)}
                onClick={(clicked, _index) =>
                  (window.location.href =
                    own_page + '#' + clicked.y.id_of_max_pos_removed_item)
                }
              />
              <div>
                <a href={own_page}>{own_page_text}</a>
              </div>
              <div>
                {resolvedHovered ? (
                  <Preview type={type} {...resolvedHovered.y} />
                ) : null}
              </div>
            </div>
          </Selection>
        )
      }}
    />
  )
}

export default UpvoteRemovalRateHistory
