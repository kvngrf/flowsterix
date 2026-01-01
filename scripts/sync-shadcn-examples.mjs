import { spawnSync } from 'node:child_process'
import { promises as fs } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const repoRoot = path.resolve(__dirname, '..')

const registryDir =
  process.env.FLOWSTERIX_REGISTRY_PATH ??
  path.resolve(repoRoot, 'packages/shadcn-registry/public/r')

const components = [
  'tour-provider',
  'tour-overlay',
  'tour-popover',
  'tour-controls',
  'tour-progress',
  'delay-progress-bar',
  'tour-tooltip',
  'tour-hud',
  'onboarding-flow',
  'use-tour',
]

const examples = [
  'examples/react-vite',
  'examples/react-router-vite',
  'examples/next',
]

const run = (command, args, cwd, envOverrides = {}) => {
  console.log(`[sync] ${command} ${args.join(' ')} (${cwd})`)
  const result = spawnSync(command, args, {
    cwd,
    stdio: 'inherit',
    shell: process.platform === 'win32',
    env: {
      ...process.env,
      ...envOverrides,
    },
  })

  if (result.status !== 0) {
    process.exit(result.status ?? 1)
  }
}

const loadRegistryItem = async (name) => {
  const filePath = path.join(registryDir, `${name}.json`)
  const raw = await fs.readFile(filePath, 'utf8')
  return JSON.parse(raw)
}

const normalizeAliasPath = (alias, exampleRoot, srcPrefix) => {
  if (!alias) return null
  if (alias.startsWith('@/')) {
    return path.join(exampleRoot, srcPrefix, alias.slice(2))
  }
  if (alias.startsWith('./') || alias.startsWith('../')) {
    return path.join(exampleRoot, alias)
  }
  return path.join(exampleRoot, srcPrefix, alias)
}

const getTargetBaseDir = (type, paths) => {
  switch (type) {
    case 'registry:hook':
      return paths.hooks ?? paths.components
    case 'registry:lib':
      return paths.lib ?? paths.components
    case 'registry:ui':
      return paths.ui ?? paths.components
    case 'registry:block':
    case 'registry:component':
    default:
      return paths.components
  }
}

const resolveTargetPath = (filePath, baseDir) => {
  const baseName = path.basename(baseDir)
  const normalized = filePath.replace(/^\/+/, '')
  const segments = normalized.split(/[\\/]/)
  const index = segments.indexOf(baseName)
  const relative =
    index >= 0 ? segments.slice(index + 1).join(path.sep) : segments.at(-1)
  return path.join(baseDir, relative)
}

const rewriteRegistryImports = (content, aliases) => {
  const replacements = [
    [/@\/registry\/[^/]+\/ui/g, aliases.ui],
    [/@\/registry\/[^/]+\/components/g, aliases.components],
    [/@\/registry\/[^/]+\/lib/g, aliases.lib],
    [/@\/registry\/[^/]+\/hooks/g, aliases.hooks],
    [/@\/registry\/[^/]+/g, aliases.components],
  ]

  return replacements.reduce(
    (acc, [pattern, replacement]) => acc.replace(pattern, replacement),
    content,
  )
}

const ensureFile = async (filePath, content) => {
  await fs.mkdir(path.dirname(filePath), { recursive: true })
  await fs.writeFile(filePath, content, 'utf8')
}

const ensureLibUtils = async (exampleRoot, aliases, srcPrefix) => {
  if (!aliases.lib) return
  const libDir = normalizeAliasPath(aliases.lib, exampleRoot, srcPrefix)
  const utilsPath = path.join(libDir, 'utils.ts')

  try {
    await fs.access(utilsPath)
  } catch {
    const content = `import { clsx, type ClassValue } from \"clsx\"\nimport { twMerge } from \"tailwind-merge\"\n\nexport function cn(...inputs: ClassValue[]) {\n  return twMerge(clsx(inputs))\n}\n`
    await ensureFile(utilsPath, content)
  }
}

const ensureUIButton = async (exampleRoot, aliases, srcPrefix) => {
  if (!aliases.ui) return
  const uiDir = normalizeAliasPath(aliases.ui, exampleRoot, srcPrefix)
  const buttonPath = path.join(uiDir, 'button.tsx')

  try {
    await fs.access(buttonPath)
  } catch {
    const sourcePath = path.resolve(
      repoRoot,
      'examples/shadcn-demo/src/components/ui/button.tsx',
    )
    const content = await fs.readFile(sourcePath, 'utf8')
    await ensureFile(buttonPath, content)
  }
}

const ensureUICard = async (exampleRoot, aliases, srcPrefix) => {
  if (!aliases.ui) return
  const uiDir = normalizeAliasPath(aliases.ui, exampleRoot, srcPrefix)
  const cardPath = path.join(uiDir, 'card.tsx')

  try {
    await fs.access(cardPath)
  } catch {
    const sourcePath = path.resolve(
      repoRoot,
      'examples/shadcn-demo/src/components/ui/card.tsx',
    )
    const content = await fs.readFile(sourcePath, 'utf8')
    await ensureFile(cardPath, content)
  }
}

const ensureDemoTourOverrides = async (exampleRoot, aliases, srcPrefix) => {
  const componentsDir = normalizeAliasPath(
    aliases.components,
    exampleRoot,
    srcPrefix,
  )
  if (!componentsDir) return

  const demoDir = path.resolve(
    repoRoot,
    'examples/shadcn-demo/src/components/tour',
  )
  const demoFiles = [
    'tour-hud.tsx',
    'tour-controls.tsx',
    'hold-to-skip-button.tsx',
  ]

  for (const name of demoFiles) {
    const sourcePath = path.join(demoDir, name)
    let content = await fs.readFile(sourcePath, 'utf8')
    if (name === 'tour-hud.tsx') {
      content = content.replace(
        /@\/components\/tour\//g,
        `${aliases.components}/`,
      )
    }
    const targetPath = path.join(componentsDir, name)
    await ensureFile(targetPath, content)
  }
}

const syncExamples = async () => {
  run(
    'pnpm',
    ['--filter', '@flowsterix/shadcn-registry', 'registry:build'],
    repoRoot,
  )

  for (const example of examples) {
    const exampleRoot = path.resolve(repoRoot, example)
    console.log(`[sync] syncing ${example}`)
    const configPath = path.join(exampleRoot, 'components.json')
    const config = JSON.parse(await fs.readFile(configPath, 'utf8'))
    const cssPath = config.tailwind?.css ?? ''
    const srcPrefix = cssPath.startsWith('src/') ? 'src' : ''

    const aliases = {
      components: config.aliases?.components ?? '@/components',
      ui: config.aliases?.ui ?? '@/components/ui',
      lib: config.aliases?.lib ?? '@/lib',
      hooks: config.aliases?.hooks ?? '@/hooks',
    }

    await ensureLibUtils(exampleRoot, aliases, srcPrefix)
    await ensureUIButton(exampleRoot, aliases, srcPrefix)
    await ensureUICard(exampleRoot, aliases, srcPrefix)

    for (const name of components) {
      console.log(`[sync] installing ${name} in ${example}`)
      const item = await loadRegistryItem(name)
      const baseDir = normalizeAliasPath(
        getTargetBaseDir(item.type, aliases),
        exampleRoot,
        srcPrefix,
      )

      for (const file of item.files ?? []) {
        const targetPath = resolveTargetPath(file.path, baseDir)
        const content = rewriteRegistryImports(
          file.content,
          aliases,
        )
        await ensureFile(targetPath, content)
      }
    }

    await ensureDemoTourOverrides(exampleRoot, aliases, srcPrefix)
  }
}

syncExamples().catch((error) => {
  console.error(error)
  process.exit(1)
})
