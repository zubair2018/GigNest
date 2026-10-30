import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'

const SEARCH_EXAMPLES = [
  'Website development',
  'Video editing',
  'App development',
  'Business tutor',
]

export default function Hero({ onSearch }) {
  const [query, setQuery] = useState('')
  const [focused, setFocused] = useState(false)
  const [exampleIndex, setExampleIndex] = useState(0)

  useEffect(() => {
    const reducedMotion = window.matchMedia(
      '(prefers-reduced-motion: reduce)'
    ).matches

    if (focused || query || reducedMotion) return undefined

    const interval = window.setInterval(() => {
      setExampleIndex(current => (
        (current + 1) % SEARCH_EXAMPLES.length
      ))
    }, 2800)

    return () => window.clearInterval(interval)
  }, [focused, query])

  function handleSubmit(event) {
    event.preventDefault()
    onSearch(query.trim())
  }

  return (
    <section className="gs-hero">
      <div className="gs-hero-content">
        <p className="gs-eyebrow">Independent talent. Real possibilities.</p>

        <h1>
          Find the right skills.
          <br />
          <span>Make it happen.</span>
        </h1>

        <p className="gs-hero-description">
          Discover people who can build your website, grow your business,
          edit your next video, and bring your ideas to life.
        </p>

        <form className="gs-hero-search" onSubmit={handleSubmit}>
          <label htmlFor="gigspot-search" className="gs-sr-only">
            Search freelance services
          </label>

          <input
            id="gigspot-search"
            type="search"
            value={query}
            onChange={event => setQuery(event.target.value)}
            onFocus={() => setFocused(true)}
            onBlur={() => setFocused(false)}
            placeholder={`Try “${SEARCH_EXAMPLES[exampleIndex]}”`}
            maxLength={100}
            autoComplete="off"
          />

          <button type="submit">
            Search <span aria-hidden="true">↗</span>
          </button>
        </form>

        <div className="gs-search-suggestions">
          <span>Popular:</span>

          {[
            ['Website development', 'website'],
            ['Video editing', 'video'],
            ['SEO expert', 'seo'],
          ].map(([label, value]) => (
            <button
              type="button"
              key={value}
              onClick={() => onSearch(value)}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      <div className="gs-hero-decoration" aria-hidden="true">
        <div className="gs-orbit gs-orbit-one" />
        <div className="gs-orbit gs-orbit-two" />
        <span>✦</span>
        <p>Your next great<br />collaboration starts here.</p>
      </div>

      <Link className="gs-hero-bottom-link" to="/signup?intent=freelancer">
        Have a skill to share? Join Gigspot →
      </Link>
    </section>
  )
}