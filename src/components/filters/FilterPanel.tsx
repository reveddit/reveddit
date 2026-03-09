import React, { useEffect, useRef } from 'react'
import { useIsMobile } from 'hooks/mobile'
import { useGlobalStore, filter_pageType_defaults } from 'state'
import { usePageType } from 'contexts/page'

/**
 * Get the default value for a filter, respecting per-page-type overrides.
 */
const getDefault = (key: string, pageType: string) => {
  const def = filter_pageType_defaults[key]
  if (def === undefined) return undefined
  if (typeof def === 'object' && def !== null) {
    return def[pageType] ?? def[Object.keys(def)[0]]
  }
  return def
}

/**
 * Counts the number of active filters in global state.
 */
export const useActiveFilterCount = () => {
  const global = useGlobalStore()
  const page_type = usePageType()
  const {
    removedFilter,
    removedByFilter,
    categoryFilter_author,
    tagsFilter,
    keywords,
    post_flair,
    user_flair,
    filter_url,
    localSort,
    thread_before,
  } = global.state
  let count = 0
  const defaultRemovedFilter = getDefault('removedFilter', page_type)
  if (removedFilter && removedFilter !== defaultRemovedFilter) count++
  if (removedByFilter && Object.keys(removedByFilter).length) count++
  if (categoryFilter_author && categoryFilter_author !== 'all') count++
  if (tagsFilter && Object.keys(tagsFilter).length) count++
  if (keywords) count++
  if (post_flair) count++
  if (user_flair) count++
  if (filter_url) count++
  const defaultSort = getDefault('localSort', page_type)
  if (localSort && localSort !== defaultSort) count++
  if (thread_before) count++
  return count
}

/**
 * Mobile: Slide-out drawer from the right.
 * Desktop: Sticky collapsible bar inline with content.
 */
const FilterPanel = ({ children, showFilters, onToggle, saveResetButtons }) => {
  const isMobile = useIsMobile()
  const activeCount = useActiveFilterCount()

  if (isMobile) {
    return (
      <MobileDrawer
        showFilters={showFilters}
        onToggle={onToggle}
        activeCount={activeCount}
        saveResetButtons={saveResetButtons}
      >
        {children}
      </MobileDrawer>
    )
  }

  return (
    <DesktopBar
      showFilters={showFilters}
      onToggle={onToggle}
      activeCount={activeCount}
      saveResetButtons={saveResetButtons}
    >
      {children}
    </DesktopBar>
  )
}

/**
 * Slide-out drawer for mobile. Overlays from the right side.
 */
const MobileDrawer = ({
  children,
  showFilters,
  onToggle,
  activeCount,
  saveResetButtons,
}) => {
  const drawerRef = useRef<HTMLDivElement>(null)

  // Lock body scroll when drawer is open
  useEffect(() => {
    if (showFilters) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
    return () => {
      document.body.style.overflow = ''
    }
  }, [showFilters])

  // Close on Escape
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && showFilters) {
        onToggle()
      }
    }
    document.addEventListener('keydown', handleKey)
    return () => document.removeEventListener('keydown', handleKey)
  }, [showFilters, onToggle])

  return (
    <>
      {/* Floating trigger button */}
      <button
        className="filter-fab"
        onClick={onToggle}
        aria-label={`${showFilters ? 'Hide' : 'Show'} filters`}
        aria-expanded={showFilters}
      >
        <FilterIcon />
        {activeCount > 0 && (
          <span className="filter-fab-badge">{activeCount}</span>
        )}
      </button>

      {/* Backdrop */}
      <div
        className={`filter-drawer-backdrop ${showFilters ? 'open' : ''}`}
        onClick={onToggle}
        aria-hidden="true"
      />

      {/* Drawer */}
      <div
        ref={drawerRef}
        className={`filter-drawer ${showFilters ? 'open' : ''}`}
        role="dialog"
        aria-modal="true"
        aria-label="Filters"
      >
        <div className="filter-drawer-header">
          <span className="filter-drawer-title">Filters</span>
          {saveResetButtons}
          <button
            className="filter-drawer-close"
            onClick={onToggle}
            aria-label="Close filters"
          >
            ✕
          </button>
        </div>
        <div className="filter-drawer-body">{children}</div>
      </div>
    </>
  )
}

/**
 * Sticky collapsible bar for desktop.
 * Shows a compact toggle line with active filter count;
 * expands inline to show filter groups.
 */
const DesktopBar = ({
  children,
  showFilters,
  onToggle,
  activeCount,
  saveResetButtons,
}) => {
  const toggleText = showFilters ? '[–] hide filters' : '[+] show filters'

  return (
    <div className="filter-bar">
      <div className="filter-bar-toggle">
        <a
          onClick={onToggle}
          className="collapseToggle"
          role="button"
          tabIndex={0}
          onKeyDown={e => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault()
              onToggle()
            }
          }}
          aria-expanded={showFilters}
        >
          {toggleText}
        </a>
        {activeCount > 0 && (
          <span
            className="filter-bar-count"
            title={`${activeCount} active filter${activeCount > 1 ? 's' : ''}`}
          >
            {activeCount} active
          </span>
        )}
        {saveResetButtons}
      </div>
      {showFilters && <div className="filter-bar-body">{children}</div>}
    </div>
  )
}

const FilterIcon = () => (
  <svg
    width="20"
    height="20"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
  >
    <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3" />
  </svg>
)

export default FilterPanel
// test
