import type { CommandDef, SubCommandsDef } from 'citty'
import { consola } from 'consola'
import { Table } from 'console-table-printer'
import { compare } from 'semver'

const command = {
	meta: {
		name: 'downloads',
		description: 'TypeScript download stats',
	},
	subCommands: {},
	async run(context: CommandContext) {
		consola.debug(context, [])

		const downloads = await getDownloads('typescript')

		const totalDownloads = getTotalDownloads(downloads)

		const versionAdoption = getMinVersionAdoption(downloads, totalDownloads)

		const table = new Table({
			columns: [
				{ name: 'version', title: 'ver' },
				{ name: 'downloads', title: 'dl/s' },
				{ name: 'audience', title: 'acc dl/s' },
				{ name: 'audiencePCT', title: '%' },
			],
			rows: [
				...versionAdoption,
				{
					audience: '-',
					audiencePCT: '-',
					downloads: totalDownloads,
					version: 'all',
				},
			],
		})

		consola.log(table.render())
	},
} satisfies CommandDef

export const DownloadsCommand = {
	d: command,
	downloads: command,
} satisfies SubCommandsDef

async function getDownloads(
	packageName: string,
): Promise<Record<string, number>> {
	const response = await fetch(
		`https://api.npmjs.org/versions/${packageName}/last-week`,
	)

	const { downloads } = (await response.json()) as {
		downloads: Record<string, number>
	}

	return Object.fromEntries(
		Object.entries(downloads).filter(([version]) => !version.includes('-')),
	)
}

function getTotalDownloads(downloads: Record<string, number>) {
	return Object.values(downloads).reduce((sum, count) => sum + count, 0)
}

function getMinVersionAdoption(
	downloads: Record<string, number>,
	totalDownloads: number,
	options: { collapsePatches?: boolean } = { collapsePatches: true },
) {
	const versions = Object.keys(downloads).sort(compare)

	const adoption: {
		audience: number
		audiencePCT: number
		downloads: number
		version: string
	}[] = []

	for (let i = versions.length - 1; i >= 0; i--) {
		const version = versions[i]

		const downloadsAtVersion = downloads[version]

		const adoptionAtVersion = {
			audience: downloadsAtVersion,
			audiencePCT: -1,
			downloads: downloadsAtVersion,
			version,
		}
		adoption[i] = adoptionAtVersion

		if (i < versions.length - 1) {
			adoptionAtVersion.audience += adoption[i + 1].audience
		}

		adoptionAtVersion.audiencePCT = Number(
			Intl.NumberFormat('en-US', {
				maximumFractionDigits: 3,
			}).format((adoptionAtVersion.audience / totalDownloads) * 100),
		)
	}

	if (options.collapsePatches) {
		return adoption
			.filter((item, index) => {
				if (index === 0) return true

				const prevItem = adoption[index - 1]

				const [prevMajor, prevMinor] = prevItem.version.split('.')
				const [major, minor] = item.version.split('.')

				if (major !== prevMajor || minor !== prevMinor) return true

				prevItem.downloads += item.downloads

				return false
			})
			.map((item) => ({
				...item,
				version: item.version.split('.').slice(0, 2).join('.'),
			}))
	}

	return adoption
}
