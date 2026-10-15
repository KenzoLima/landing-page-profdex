/**
 * Onde estão os `.glb` de origem do elenco (professores e formas especiais).
 *
 * A landing NÃO versiona os originais: as esculturas de ~60 MB não têm por que
 * viajar num repo de página estática. O que este repo guarda é o RESULTADO
 * (`public/models/`) mais o script que sabe refazê-lo — então quem só quer rodar
 * `npm run dev` não precisa da pasta de modelos, e quem vai reprocessar precisa.
 *
 * A ordem de busca é: variável de ambiente primeiro (é a resposta de quem sabe),
 * depois a pasta-irmã que o time usa no disco. Falhar com a lista toda na
 * mensagem economiza uma ida ao README.
 */
import { existsSync } from 'node:fs'
import path from 'node:path'

const MODEL_DIR_CANDIDATES = [
  process.env.PROFDEX_MODELS_DIR,
  path.resolve(import.meta.dirname, '../../professores profdex 3D'),
  'D:\\profdex\\professores profdex 3D',
].filter(Boolean)

/** Marca d'água: uma pasta só é a dos modelos se tiver um que todo elenco tem. */
const MARKER = 'professor-mario.glb'

export function resolveModelsDir() {
  for (const dir of MODEL_DIR_CANDIDATES) {
    if (existsSync(path.join(dir, MARKER))) return dir
  }

  throw new Error(
    'Não encontrei a pasta dos modelos 3D. Aponte com PROFDEX_MODELS_DIR=<caminho>.\n' +
      'Procurei em:\n' +
      MODEL_DIR_CANDIDATES.map((c) => `  · ${c}`).join('\n'),
  )
}
