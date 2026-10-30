const POPULAR_SERVICES = [
  {
    title: 'Website development',
    query: 'website',
    icon: '⌘',
    className: 'website',
  },
  {
    title: 'Video editing',
    query: 'video',
    icon: '▶',
    className: 'video',
  },
  {
    title: 'App development',
    query: 'app',
    icon: '▣',
    className: 'app',
  },
  {
    title: 'SEO expert',
    query: 'seo',
    icon: '↗',
    className: 'seo',
  },
  {
    title: 'Social media marketing',
    query: 'social media',
    icon: '◎',
    className: 'social',
  },
  {
    title: 'Graphic design',
    query: 'design',
    icon: '✦',
    className: 'design',
  },
  {
    title: 'Tutoring',
    query: 'tutor',
    icon: '◇',
    className: 'tutor',
  },
]

export default function PopularServices({ onSelect }) {
  return (
    <section className="gs-section">
      <div className="gs-section-heading">
        <div>
          <p className="gs-eyebrow">
            Discover what is possible
          </p>

          <h2>Popular services</h2>
        </div>
      </div>

      <div className="gs-popular-services">
        {POPULAR_SERVICES.map(service => (
          <button
            key={service.className}
            type="button"
            className={`gs-service-category gs-category-${service.className}`}
            onClick={() => onSelect(service.query)}
            aria-label={`Find ${service.title.toLowerCase()} services`}
          >
            <span>{service.title}</span>

            <span className="gs-category-icon" aria-hidden="true">
              {service.icon}
            </span>
          </button>
        ))}
      </div>
    </section>
  )
}