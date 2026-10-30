import { useMemo, useRef } from 'react'
import { Link, useSearchParams } from 'react-router-dom'

import Hero from '../components/Hero'
import PopularServices from '../components/PopularServices'
import Footer from '../components/Footer'
import JobCard from '../components/JobCard'
import { useMarketplace } from '../hooks/useMarketplace'
import { matchesListingSearch, sortListings } from '../shared/search'

export default function Home() {
  const [params, setParams] = useSearchParams()
  const resultsRef = useRef(null)

  const {
    jobs = [],
    skills = [],
    jobsLoading,
    skillsLoading,
    jobsError,
    skillsError,
    hasMore,
    loadingMore,
    loadMore,
    refresh,
  } = useMarketplace()

  const query = params.get('q') || ''
  const listingType = ['all', 'skills', 'jobs'].includes(params.get('type')) ? params.get('type') : 'all'
  const sort = ['newest', 'price-low', 'price-high'].includes(params.get('sort')) ? params.get('sort') : 'newest'
  const category = params.get('category') || 'All'
  const location = params.get('location') || ''

  const filteredSkills = useMemo(() => {
    return sortListings(skills.filter(item => matchesListingSearch(item, { query, category, location })), sort)
  }, [skills, query, category, location, sort])

  const filteredJobs = useMemo(() => {
    return sortListings(jobs.filter(item => matchesListingSearch(item, { query, category, location })), sort)
  }, [jobs, query, category, location, sort])

  function updateFilter(name, value) {
    const next = new URLSearchParams(params)

    if (value) {
      next.set(name, value)
    } else {
      next.delete(name)
    }

    setParams(next, { replace: true })
  }

  function searchServices(value) {
    const next = new URLSearchParams()

    if (value.trim()) next.set('q', value.trim())

    next.set('type', 'skills')
    setParams(next)
    window.requestAnimationFrame(() => resultsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }))
  }

  return (
    <div className="gs-site">
      <main>
        <div className="gs-container">
          <Hero onSearch={searchServices} />
          <PopularServices onSelect={searchServices} />

          <section
            className="gs-section gs-explore-section"
            id="explore"
            ref={resultsRef}
          >
            <div className="gs-section-heading">
              <div>
                <p className="gs-eyebrow">Find your next connection</p>
                <h2>{query ? `Results for “${query}”` : 'Explore Gigspot'}</h2>
              </div>
            </div>

            <div className="gs-results-toolbar">
              <label className="gs-sr-only" htmlFor="results-search">
                Search listings
              </label>

              <input
                id="results-search"
                type="search"
                value={query}
                onChange={event => updateFilter('q', event.target.value)}
                placeholder="Search by skill, service, or location"
                maxLength={100}
              />

              <label className="gs-sr-only" htmlFor="listing-type">
                Listing type
              </label>

              <select
                id="listing-type"
                value={listingType}
                onChange={event => updateFilter('type', event.target.value)}
              >
                <option value="all">All listings</option>
                <option value="skills">Skill providers</option>
                <option value="jobs">Jobs and opportunities</option>
              </select>

              <label className="gs-sr-only" htmlFor="listing-category">Category</label>
              <select
                id="listing-category"
                value={category}
                onChange={event => updateFilter('category', event.target.value === 'All' ? '' : event.target.value)}
              >
                <option value="All">All categories</option>
                {['Tech', 'Design', 'Local', 'Content', 'Education'].map(item => (
                  <option value={item} key={item}>{item}</option>
                ))}
              </select>

              <label className="gs-sr-only" htmlFor="listing-location">Location</label>
              <input
                id="listing-location"
                type="search"
                value={location}
                onChange={event => updateFilter('location', event.target.value)}
                placeholder="Location"
                maxLength={80}
              />

              <label className="gs-sr-only" htmlFor="listing-sort">
                Sort listings
              </label>

              <select
                id="listing-sort"
                value={sort}
                onChange={event => updateFilter('sort', event.target.value)}
              >
                <option value="newest">Newest first</option>
                <option value="price-low">Lowest price</option>
                <option value="price-high">Highest price</option>
              </select>

              <button
                type="button"
                className="gs-text-button"
                onClick={() => setParams({})}
              >
                Clear
              </button>
            </div>

            {listingType !== 'jobs' && (
              <ListingSection
                title="People offering skills"
                description="Meet professionals and discover what they can do."
                items={filteredSkills}
                refresh={refresh}
                loading={skillsLoading}
                error={skillsError}
                onLoadMore={() => loadMore('skills')}
                hasMore={hasMore.skills}
                loadingMore={loadingMore.skills}
                skills
              />
            )}

            {listingType !== 'skills' && (
              <ListingSection
                title="Jobs and opportunities"
                description="Hiring requests publish immediately and may be suspended for policy violations."
                items={filteredJobs}
                refresh={refresh}
                loading={jobsLoading}
                error={jobsError}
                onLoadMore={() => loadMore('jobs')}
                hasMore={hasMore.jobs}
                loadingMore={loadingMore.jobs}
              />
            )}
          </section>

          <section className="gs-join-banner">
            <div>
              <p className="gs-eyebrow">Your skills deserve a spotlight</p>
              <h2>Do what you love.<br />Find people who need it.</h2>
              <p>
                Create a profile, show your work, and start a conversation.
              </p>
            </div>

            <Link
              className="gs-button gs-button-spark"
              to="/signup?intent=freelancer"
            >
              Join as freelancer →
            </Link>
          </section>
        </div>
      </main>

      <Footer />
    </div>
  )
}

function ListingSection({
  title,
  description,
  items,
  refresh,
  skills = false,
  loading,
  error,
  onLoadMore,
  hasMore,
  loadingMore,
}) {
  return (
    <section className="gs-listing-section">
      <div className="gs-listing-heading">
        <div>
          <h3>{title}</h3>
          <p>{description}</p>
        </div>

        <span>{items.length} found</span>
      </div>

      {error ? (
        <div className="gs-alert" role="alert">
          <p>{error}</p>
          <button type="button" onClick={refresh}>Try again</button>
        </div>
      ) : loading ? (
        <LoadingCards />
      ) : items.length === 0 ? (
        <div className="gs-empty-state">
          <h4>No matching listings yet</h4>
          <p>
            Try a different search or be among the first to share a listing.
          </p>
        </div>
      ) : (
        <div className={skills ? 'gs-skills-row' : 'gs-jobs-grid'}>
          {items.map(item => (
            <div key={item.id} className={skills ? 'gs-skill-item' : ''}>
              <JobCard
                job={item}
                compact={skills}
              />
            </div>
          ))}
        </div>
      )}

      {!loading && !error && hasMore && (
        <div className="gs-load-more-wrap">
          <p>Search currently covers the loaded listings. Load more to expand results.</p>
          <button className="gs-button gs-button-outline" onClick={onLoadMore} disabled={loadingMore}>
            {loadingMore ? 'Loading…' : 'Load more'}
          </button>
        </div>
      )}
    </section>
  )
}

function LoadingCards() {
  return (
    <div className="gs-jobs-grid" aria-label="Loading listings" aria-busy="true">
      {[1, 2, 3].map(item => (
        <div className="gs-skeleton-card" key={item}>
          <div />
          <span />
          <span />
        </div>
      ))}
    </div>
  )
}