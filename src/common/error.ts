import { Octokit } from 'octokit'
import { addComment } from './github'

/**
 *
 * @param octokit Octokit
 * @param subjectId id of the pull request or the issue
 * @param message Error message and comment body
 */
export const throwWithGithubComment = async (octokit: Octokit, subjectId: string, message: string): Promise<void> => {
    await addComment(octokit, subjectId, `:warning: Error from \`git-slice-tools\`:\n${message}`)
    throw new Error(message)
}
