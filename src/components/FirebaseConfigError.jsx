export default function FirebaseConfigError({ message }) {
  return (
    <main className="gs-auth-shell" role="alert">
      <section className="gs-auth-card">
        <p className="gs-eyebrow">Setup required</p>
        <h1>Firebase configuration is incomplete</h1>
        <p className="gs-auth-description">Add these variable names to the local environment file, then restart the development server:</p>
        <code className="gs-config-error">{message}</code>
      </section>
    </main>
  )
}
