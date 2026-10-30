import { Link } from 'react-router-dom'

export default function Footer() {
  return (
    <footer className="gs-footer">
      <div className="gs-container gs-footer-grid">
        <div className="gs-footer-brand">
          <Link className="gs-logo" to="/">
            gigspot<span>.</span>
          </Link>

          <p>
            Good work starts with the right connection.
            Find talent, share your skills, and build something worthwhile.
          </p>
        </div>

        <div>
          <h3>Explore</h3>
          <Link to="/?type=skills#explore">Find professionals</Link>
          <Link to="/?type=jobs#explore">Find opportunities</Link>
          <Link to="/signup">Create an account</Link>
        </div>

        <div>
          <h3>Your workspace</h3>
          <Link to="/my-skills">My Skills</Link>
          <Link to="/my-jobs">My Jobs</Link>
          <Link to="/messages">Messages</Link>
          <Link to="/saved">Saved listings</Link>
        </div>
      </div>

      <div className="gs-container gs-footer-bottom">
        <span>© {new Date().getFullYear()} Gigspot</span>
        <span>Skills. Ideas. Possibilities.</span>
      </div>
    </footer>
  )
}