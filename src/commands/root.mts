import { type ArgsDef, type CommandDef, showUsage } from 'citty'
import { LogLevels, consola } from 'consola'
import pkgJson from '../../package.json' with { type: 'json' }
import { isInSubcommand } from '../utils/is-in-subcommand.mjs'
import { DownloadsCommand } from './downloads.mjs'

consola.options.formatOptions.date = false

const args = {
	version: {
		type: 'boolean',
		alias: 'v',
		description: 'Show version number',
	},
} satisfies ArgsDef

export const RootCommand = {
	meta: {
		name: pkgJson.name,
		version: pkgJson.version,
		description: pkgJson.description,
	},
	args,
	subCommands: {
		...DownloadsCommand,
	},
	setup(context) {
		const { args } = context

		if (args.debug) {
			consola.level = LogLevels.debug
		}
	},
	async run(context) {
		if (!isInSubcommand(context)) {
			consola.debug(context, [])

			if (context.args.version) {
				return consola.log(pkgJson.version)
			}

			await showUsage(context.cmd)
		}
	},
} satisfies CommandDef<typeof args>
