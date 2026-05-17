import type { AgentRound, TaskRecord } from '../types'
import { replaceImageMentionsForApi, stripImageMentionMarkers } from './promptImageMentions'

const AGENT_ROUND_IMAGE_REFERENCE_RE = /@(?:第)?(\d+)轮图(\d+)/g

export function getAgentCurrentReferenceId(round: AgentRound, index: number) {
  return `round-${round.index}-reference-${index + 1}`
}

export function getAgentGeneratedImageReferenceId(round: AgentRound, index: number) {
  return `round-${round.index}-image-${index + 1}`
}

export function getAgentReferenceTag(referenceId: string) {
  return `<ref id="${referenceId}" />`
}

export function collectAgentRoundOutputImages(round: AgentRound, tasks: TaskRecord[]) {
  const images: string[] = []
  for (const taskId of round.outputTaskIds) {
    const task = tasks.find((item) => item.id === taskId)
    if (task) images.push(...task.outputImages)
  }
  return images
}

export function resolveAgentPromptImageReferences(prompt: string, rounds: AgentRound[], tasks: TaskRecord[]) {
  const refs: string[] = []
  for (const match of prompt.matchAll(AGENT_ROUND_IMAGE_REFERENCE_RE)) {
    const roundIndex = Number(match[1]) - 1
    const imageIndex = Number(match[2]) - 1
    const round = rounds[roundIndex]
    if (!round || imageIndex < 0) continue

    const imageId = collectAgentRoundOutputImages(round, tasks)[imageIndex]
    if (imageId) refs.push(imageId)
  }
  return refs
}

export function replaceAgentPromptImageReferencesForApi(
  prompt: string,
  currentRound: AgentRound,
  rounds: AgentRound[],
  tasks: TaskRecord[],
) {
  const withCurrentReferences = replaceImageMentionsForApi(
    prompt,
    currentRound.inputImageIds.length,
    (index) => getAgentReferenceTag(getAgentCurrentReferenceId(currentRound, index)),
  )

  const withAgentReferences = withCurrentReferences.replace(AGENT_ROUND_IMAGE_REFERENCE_RE, (text, roundNumber, imageNumber) => {
    const roundIndex = Number(roundNumber) - 1
    const imageIndex = Number(imageNumber) - 1
    const sourceRound = rounds[roundIndex]
    if (!sourceRound || imageIndex < 0) return text

    const imageId = collectAgentRoundOutputImages(sourceRound, tasks)[imageIndex]
    if (!imageId) return text

    const currentReferenceIndex = currentRound.inputImageIds.indexOf(imageId)
    const referenceId = currentReferenceIndex >= 0
      ? getAgentCurrentReferenceId(currentRound, currentReferenceIndex)
      : getAgentGeneratedImageReferenceId(sourceRound, imageIndex)
    return getAgentReferenceTag(referenceId)
  })
  return stripImageMentionMarkers(withAgentReferences)
}
