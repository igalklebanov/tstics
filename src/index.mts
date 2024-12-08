import { DownloadsCommand } from './commands/downloads.mjs'

const {
	d: { run: runD },
} = DownloadsCommand

export const d = runD
export const downloads = runD
