const { createRequire } = require('node:module')
const { existsSync, readFileSync } = require('node:fs')
const path = require('node:path')

const repositoryRoot = path.resolve(__dirname, '..')
const serviceAccountPath = path.join(repositoryRoot, 'serviceAccountKey.json')
const functionsPackagePath = path.join(repositoryRoot, 'src', 'functions', 'package.json')
const functionsRequire = createRequire(functionsPackagePath)

async function main() {
  const [, , uid, confirmation] = process.argv

  if (!uid || !/^[A-Za-z0-9_-]{1,128}$/.test(uid) || confirmation !== '--confirm') {
    console.error('Usage: node scripts/setAdmin.cjs <firebase-auth-uid> --confirm')
    process.exitCode = 2
    return
  }

  if (!existsSync(serviceAccountPath)) {
    console.error('Missing ignored serviceAccountKey.json in the repository root.')
    process.exitCode = 2
    return
  }

  let serviceAccount
  try {
    serviceAccount = JSON.parse(readFileSync(serviceAccountPath, 'utf8'))
  } catch {
    console.error('The service account file is not valid JSON.')
    process.exitCode = 2
    return
  }

  let admin
  try {
    admin = functionsRequire('firebase-admin')
  } catch {
    console.error('Install the existing Functions dependencies from src/functions before using this utility.')
    process.exitCode = 2
    return
  }

  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
  })

  try {
    const user = await admin.auth().getUser(uid)
    await admin.auth().setCustomUserClaims(uid, {
      ...(user.customClaims || {}),
      role: 'admin',
    })
    console.log('Admin claim assigned. The user must sign out and back in to refresh the token.')
  } catch (error) {
    console.error('Could not assign the admin claim:', error.code || 'unknown error')
    process.exitCode = 1
  } finally {
    await admin.app().delete()
  }
}

main()
