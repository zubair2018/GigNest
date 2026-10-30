import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import {
  getSkill,
  updateSkill,
} from '../firebase/db'
import {
  parsePortfolio,
  parseTags,
  validateListing,
} from '../shared/validation'
import {
  EditLayout,
  LoadingScreen,
} from './Editjob'

export default function EditSkill() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { user } = useAuth()

  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const [form, setForm] = useState({
    title: '',
    category: 'Tech',
    location: '',
    description: '',
    payMin: '',
    payMax: '',
    payType: '/project',
    tags: '',
    availability: 'remote',
    portfolioText: '',
  })

  useEffect(() => {
    async function loadSkill() {
      if (!user) return

      try {
        const skill = await getSkill(id)

        if (!skill || skill.postedBy?.uid !== user.uid) {
          navigate('/')
          return
        }

        setForm({
          title: skill.title || '',
          category: skill.category || 'Tech',
          location: skill.location || '',
          description: skill.description || '',
          payMin: skill.payMin ?? '',
          payMax: skill.payMax ?? '',
          payType: skill.payType || '/project',
          tags: (skill.tags || []).join(', '),
          availability: skill.availability || 'remote',
          portfolioText: (skill.portfolio || [])
            .map(link => `${link.label || ''}${link.label ? ' | ' : ''}${link.url || ''}`)
            .join('\n'),
        })
      } catch (error) {
        console.error('Skill edit load error:', error)
        setError('Unable to load skill details.')
      } finally {
        setLoading(false)
      }
    }

    loadSkill()
  }, [id, user, navigate])

  function set(field, value) {
    setForm(previous => ({
      ...previous,
      [field]: value,
    }))
  }

  async function handleSubmit(event) {
    event.preventDefault()
    setError('')

    const validationError = validateListing(form, 'skill')

    if (validationError) {
      setError(validationError)
      return
    }

    setSaving(true)

    try {
      await updateSkill(id, {
        title: form.title.trim(),
        category: form.category,
        location: form.location.trim(),
        description: form.description.trim(),
        payMin: Number(form.payMin),
        payMax: Number(form.payMax),
        payType: form.payType,
        tags: parseTags(form.tags),
        availability: form.availability,
        portfolio: parsePortfolio(form.portfolioText),
      })

      navigate(`/job/${id}`)
    } catch (error) {
      console.error('Skill update error:', error)
      setError('Unable to update skill. Please try again.')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return <LoadingScreen />
  }

  return (
    <EditLayout
      title="Edit Skill"
      subtitle="Update your skill profile details."
      form={form}
      set={set}
      type="skill"
      error={error}
      saving={saving}
      onSubmit={handleSubmit}
      onCancel={() => navigate(-1)}
    />
  )
}