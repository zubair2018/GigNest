const { createRequire } = require('node:module')
const { existsSync, readFileSync } = require('node:fs')
const path = require('node:path')

const repositoryRoot = path.resolve(__dirname, '..')
const serviceAccountPath = path.join(repositoryRoot, 'serviceAccountKey.json')
const functionsRequire = createRequire(path.join(repositoryRoot, 'src', 'functions', 'package.json'))
const pageSize = 200

async function main() {
  if (!process.argv.includes('--read-only')) {
    console.error('This command only reads Firestore. Re-run with --read-only to confirm the scan.')
    process.exitCode = 2
    return
  }

  if (!existsSync(serviceAccountPath)) {
    console.error('Missing ignored serviceAccountKey.json in the repository root.')
    process.exitCode = 2
    return
  }

  let admin
  let serviceAccount
  try {
    admin = functionsRequire('firebase-admin')
    serviceAccount = JSON.parse(readFileSync(serviceAccountPath, 'utf8'))
  } catch {
    console.error('Could not load the local service account or Firebase Admin SDK.')
    process.exitCode = 2
    return
  }

  admin.initializeApp({ credential: admin.credential.cert(serviceAccount) })
  const db = admin.firestore()

  try {
    for (const collectionName of ['jobs', 'skills']) {
      const summary = {
        total: 0,
        missingPrivacySafe: 0,
        containsLegacyPhoneField: 0,
        publishedOrActive: 0,
        hasLegacySavedBy: 0,
      }
      let cursor = null

      while (true) {
        let query = db.collection(collectionName)
          .orderBy(admin.firestore.FieldPath.documentId())
          .limit(pageSize)
        if (cursor) query = query.startAfter(cursor)

        const snapshot = await query.get()
        for (const document of snapshot.docs) {
          const data = document.data()
          summary.total += 1
          if (data.privacySafe !== true) summary.missingPrivacySafe += 1
          if (Object.prototype.hasOwnProperty.call(data, 'phone')) summary.containsLegacyPhoneField += 1
          if (data.status === 'published' || data.status === 'active') summary.publishedOrActive += 1
          if (Array.isArray(data.savedBy) && data.savedBy.length) summary.hasLegacySavedBy += 1
        }

        if (snapshot.size < pageSize) break
        cursor = snapshot.docs[snapshot.docs.length - 1]
      }

      console.log(`${collectionName}: ${JSON.stringify(summary)}`)
    }
  } catch (error) {
    console.error('Read-only audit failed:', error.code || 'unknown error')
    process.exitCode = 1
  } finally {
    await admin.app().delete()
  }
}

main()
