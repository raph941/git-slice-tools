import { Glob } from 'glob'
import path from 'path'
import fs from 'fs-extra'
import { terminal } from 'terminal-kit'
import { SimpleGit } from 'simple-git'
import { compareSync } from 'dir-compare'

export const deleteSliceIgnoresFilesDirs = async (
    sliceIgnores: string[],
    rootDir: string,
    logPrefix: string
): Promise<void> => {
    for (let i = 0; i < sliceIgnores.length; i++) {
        const pattern = sliceIgnores[i]

        terminal(`${logPrefix}: Getting ingoring files/directores with pattern '${pattern}'...`)

        const mg = new Glob(pattern, {
            cwd: rootDir,
            sync: true,
        })

        terminal(`Found ${mg.found.length} files/directories!\n`)

        if (mg.found.length === 0) {
            terminal('\n')
            continue
        }

        for (let j = 0; j < mg.found.length; j++) {
            const pathMatch = mg.found[j]
            const resolvedPath = path.join(rootDir, pathMatch)

            terminal(`${logPrefix}: Deleting: ${pathMatch}...`)

            fs.rmSync(resolvedPath, { force: true, recursive: true })

            terminal('Done!\n')
        }
    }
}

export const createCommitAndPushCurrentChanges = async (
    git: SimpleGit,
    commitMsg: string,
    branch: string,
    logPrefix: string,
    forcePush = false
): Promise<boolean> => {
    const status = await git.status()

    if (status.files.length === 0) {
        terminal(`${logPrefix}: No changes found\n`)

        return false
    }

    terminal(`${logPrefix}: Stage changes\n`)

    await git.add('.')

    terminal(
        [
            ...status.modified.map(x => ({ filePath: x, changeType: '~' })),
            ...status.deleted.map(x => ({ filePath: x, changeType: '-' })),
            ...status.created.map(x => ({ filePath: x, changeType: '+' })),
        ]
            .map(x => `${logPrefix}: Commit (${x.changeType}) ${x.filePath}`)
            .join('\n') + '\n'
    )

    terminal(`${logPrefix}: Creating '${commitMsg}' commit...`)

    await git.commit(commitMsg)

    terminal('Done!\n')

    terminal(`${logPrefix}: Pushing...`)

    await git.push('origin', branch, forcePush ? ['--force'] : [])

    terminal('Done!\n')

    return true
}

export const copyFiles = async (
    git: SimpleGit,
    fromDir: string,
    toDir: string,
    sliceIgnores: string[],
    logPrefix: string,
    forceAdd = false
): Promise<boolean> => {
    terminal(`${logPrefix}: Copy files from '${fromDir}' to '${toDir}'...\n`)

    const compareResponse = compareSync(toDir, fromDir, {
        compareContent: true,
        compareDate: false,
        compareSize: false,
        compareSymlink: true,
        excludeFilter: [
            '**/.DS_Store',
            '**/.git/**',
            // It requires to have `**/` as prefix to work with dir-compare filter
            ...sliceIgnores.map(x => (x.startsWith('**/') ? x : `**/${x.replace(/^\/+/, '')}`)),
        ].join(','),
    })

    if (compareResponse.diffSet) {
        // Filter files only on left = to Dir
        const onlyOnToDirFiles = compareResponse.diffSet.filter(dif => dif.state === 'left')

        terminal(`${logPrefix}: Found ${onlyOnToDirFiles.length} onlyOnToDir file(s)!\n`)

        for (let i = 0; i < onlyOnToDirFiles.length; i++) {
            const diff = onlyOnToDirFiles[i]

            const filePath = `${diff.relativePath.substring(1)}/${diff.name1}`
            const absPath = path.join(toDir, filePath)

            terminal(`${logPrefix}: Deleting: ${filePath}...`)

            fs.rmSync(absPath, { force: true, recursive: true })
            forceAdd && (await git.raw('add', absPath, '--force'))

            terminal('Done!\n')
        }

        const symlinkFiles: { filePath: string; targetLink: string }[] = []

        // TODO: Getting problem with `.gitignore` related case
        // + Client push update some files, then add them to .gitignore
        // + When we copy those files into slice ropo (included .gitignore) => source won't have those files

        // Filter files only on right = from Dir
        const onlyOnFromDirFiles = compareResponse.diffSet.filter(dif => dif.state === 'right')

        terminal(`${logPrefix}: Found ${onlyOnFromDirFiles.length} onlyOnFromDir file(s)!\n`)

        for (let i = 0; i < onlyOnFromDirFiles.length; i++) {
            const diff = onlyOnFromDirFiles[i]
            const filePath = `${diff.relativePath.substring(1)}/${diff.name2}`
            const lstat = await fs.lstat(path.join(fromDir, filePath))

            if (lstat.isSymbolicLink()) {
                const targetLink = await fs.readlink(path.join(fromDir, filePath))

                symlinkFiles.push({ filePath, targetLink })
            } else {
                terminal(`${logPrefix}: Copying: ${filePath}...`)

                fs.copySync(path.join(fromDir, filePath), path.join(toDir, filePath), {
                    overwrite: true,
                    dereference: false,
                    recursive: false,
                })

                forceAdd && (await git.raw('add', filePath, '--force'))

                terminal('Done!\n')
            }
        }

        const distinctFiles = compareResponse.diffSet.filter(dif => dif.state === 'distinct')

        terminal(`${logPrefix}: Found ${distinctFiles.length} distinct file(s)!\n`)

        for (let i = 0; i < distinctFiles.length; i++) {
            const diff = distinctFiles[i]
            const filePath = `${diff.relativePath.substring(1)}/${diff.name1}`
            const lstat = await fs.lstat(path.join(fromDir, filePath))

            if (lstat.isSymbolicLink()) {
                const targetLink = await fs.readlink(path.join(fromDir, filePath))

                symlinkFiles.push({ filePath, targetLink })
            } else {
                terminal(`${logPrefix}: Overriding: ${filePath}...`)

                fs.copySync(path.join(fromDir, filePath), path.join(toDir, filePath), {
                    overwrite: true,
                    dereference: false,
                    recursive: false,
                })

                forceAdd && (await git.raw('add', filePath, '--force'))

                terminal('Done!\n')
            }
        }

        terminal(`${logPrefix}: Found ${symlinkFiles.length} symlinks!\n`)

        for (let i = 0; i < symlinkFiles.length; i++) {
            const { filePath, targetLink } = symlinkFiles[i]
            terminal(`${logPrefix}: Linking : ${filePath}...`)
            const symlinkPath = path.join(toDir, filePath)

            fs.symlinkSync(targetLink, symlinkPath)
            forceAdd && (await git.raw('add', symlinkPath, '--force'))

            terminal('Done!\n')
        }
    } else {
        terminal(`${logPrefix}: Found 0 file(s)!\n`)
    }

    const status = await git.status()

    if (status.files.length === 0) {
        terminal(`${logPrefix}: No changes found\n`)

        return false
    }

    return true
}