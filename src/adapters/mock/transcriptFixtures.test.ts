import { describe, expect, it } from 'vitest'
import { TRANSCRIPT_REQUEST_TEXT } from '../../model'
import {
  activityView,
  requestView,
} from '../../presentation/transcriptViews'
import {
  TRANSCRIPT_TASK_IDS,
  transcriptObservationFor,
  transcriptTaskObservation,
} from './transcriptFixtures'

describe('transcriptFixtures', () => {
  it('observed: full request provenance and qualified tool totals', () => {
    const obs = transcriptObservationFor('observed')
    const request = requestView(obs)
    const activity = activityView(obs)
    expect(request.title).toBe('Original request')
    expect(request.text).toBe(TRANSCRIPT_REQUEST_TEXT)
    expect(request.integrity).toContain('Verified stored request')
    expect(activity.countLabel).toBe('2 tool calls observed')
    expect(activity.toolCount).toBe(2)
  })

  it('loading: never shows missing totals as zero', () => {
    const activity = activityView(transcriptObservationFor('loading'))
    expect(activity.countLabel).toBe('Loading tool activity')
    expect(activity.toolCount).toBeNull()
    expect(activity.countLabel).not.toMatch(/\b0\b/)
  })

  it('partial: truncated request and incomplete history qualifications', () => {
    const obs = transcriptObservationFor('partial')
    const request = requestView(obs)
    const activity = activityView(obs)
    expect(request.title).toBe('Partial request')
    expect(request.text).toBe(TRANSCRIPT_REQUEST_TEXT.slice(0, 64))
    expect(request.integrity).toContain('Bounded prefix')
    expect(activity.title).toContain('capture gap')
    expect(activity.toolCount).toBeNull()
  })

  it('unavailable: refusal copy without inventing zero totals', () => {
    const obs = transcriptObservationFor('unavailable')
    expect(requestView(obs).unavailable).toBe(true)
    expect(requestView(obs).text).toBe('')
    expect(activityView(obs).toolCount).toBeNull()
    expect(activityView(obs).countLabel).not.toMatch(/\b0\b/)
  })

  it('integrity-failed: withholds assignment text from the observation', () => {
    const request = requestView(transcriptObservationFor('integrity-failed'))
    expect(request.withheld).toBe(true)
    expect(request.text).toBe('')
    expect(request.text).not.toContain('slot release')
  })

  it('reconnecting: keeps rows and exposes pending source for explicit rebase', () => {
    const obs = transcriptObservationFor('reconnecting')
    expect(obs.rows).toHaveLength(3)
    expect(obs.pendingSourceEpoch).toBe('mock-source-b')
  })

  it('capacity: keeps observed totals when coverage is sound', () => {
    const activity = activityView(transcriptObservationFor('capacity'))
    expect(activity.title).toContain('reached its limit')
    expect(activity.countLabel).toBe('2 tool calls observed')
  })

  it('sources: unknown history retains stub and ordering records', () => {
    const obs = transcriptObservationFor('events')
    expect(obs.history).toBe('unknown')
    expect(obs.stubRecord).not.toBeNull()
    expect(obs.ordering.length).toBeGreaterThan(0)
    expect(obs.recoveredMessage).toContain('Mock recovery text')
    expect(activityView(obs).toolCount).toBeNull()
  })

  it('task status stays Running for loading despite observation refusal paths', () => {
    expect(transcriptTaskObservation('unavailable').status).toBe('completed')
    expect(transcriptTaskObservation('loading').status).toBe('running')
    expect(transcriptTaskObservation('unavailable').statusBadge).toBe('Done')
    expect(TRANSCRIPT_TASK_IDS.events).toBe('task-transcript-sources')
  })
})
