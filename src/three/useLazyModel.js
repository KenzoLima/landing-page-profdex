import { onBeforeUnmount, readonly, ref } from 'vue'

// A cadeia de guardas que decide se esta página pode montar WebGL.
//
// Contexto (LANDING-PAGE.md §3 e §6.4): os .glb do projeto têm 27 MB, 27 MB e
// 74 MB, e dois deles carregados juntos já derrubaram uma aba de iPhone em
// produção. O briefing pede, com todas as letras, para NÃO colocar .glb numa
// landing — e abre uma exceção: um só modelo, sob interação explícita, e
// otimizado antes. Este arquivo é essa exceção escrita como código.
//
// A regra de ouro: no estado inicial a seção é uma IMAGEM. WebGL só existe
// depois que todas as guardas abaixo passarem, e some quando a seção sai.

/**
 * Tamanho do modelo publicado, em MB — mostrado ao usuário antes de baixar.
 *
 * O scripts/check-asset-budget.mjs compara este número com o arquivo real e
 * quebra o build se eles divergirem: um aviso de tamanho que mente é pior que
 * nenhum aviso.
 */
export const MODEL_SIZE_MB = 0.4

// Trava de instância única no escopo do MÓDULO (não do componente): mesmo que
// alguém instancie duas seções 3D, só uma consegue montar. Este é literalmente
// o bug de memória invertido — lá, dois contextos WebGL coexistiam.
let activeInstance = null

/**
 * @typedef {'idle'|'loading'|'ready'|'refused'|'error'} ModelStatus
 */

/**
 * @param {{ modelUrl: string|null }} options
 */
export function useLazyModel({ modelUrl = null } = {}) {
  const status = ref(/** @type {ModelStatus} */ ('idle'))
  /** Motivo da recusa — vira a mensagem exibida (copy.model3d.refusals). */
  const reason = ref('')
  const token = Symbol('lazy-model')

  /**
   * Testa se dá para criar um contexto WebGL, e o destrói em seguida.
   *
   * O contexto de sondagem é descartado de propósito com
   * `WEBGL_lose_context`: um contexto esquecido conta para o limite do
   * navegador (16 no Chrome) e some sozinho só quando o GC quiser.
   */
  function hasWebgl() {
    try {
      const canvas = document.createElement('canvas')
      const gl = canvas.getContext('webgl2') ?? canvas.getContext('webgl')
      if (!gl) return false
      gl.getExtension('WEBGL_lose_context')?.loseContext()
      return true
    } catch {
      return false
    }
  }

  /**
   * Roda a cadeia de guardas. Devolve `null` se pode carregar, ou a chave do
   * motivo da recusa.
   */
  function checkGuards() {
    if (!modelUrl) return 'no-asset'

    // `navigator.connection` não existe no Safari. Ausência não é recusa: só
    // deixa de haver informação para recusar.
    const connection = navigator.connection
    if (connection?.saveData === true) return 'save-data'
    if (connection?.effectiveType && ['slow-2g', '2g'].includes(connection.effectiveType)) {
      return 'slow-network'
    }

    // `deviceMemory` vem em GB e é arredondado para baixo (0.25, 0.5, 1, 2, 4,
    // 8). Abaixo de 4 GB é justamente a faixa de aparelho em que o incidente
    // apareceu. Também não existe no Safari — de novo, ausência não recusa.
    if (typeof navigator.deviceMemory === 'number' && navigator.deviceMemory < 4) {
      return 'low-memory'
    }

    if (!hasWebgl()) return 'no-webgl'

    return null
  }

  /**
   * Chamada SÓ a partir de um clique do usuário. É a guarda que nenhuma
   * heurística substitui: sem gesto, nenhum byte de modelo é pedido.
   */
  function activate() {
    if (status.value === 'loading' || status.value === 'ready') return

    const refusal = checkGuards()
    if (refusal) {
      reason.value = refusal
      status.value = 'refused'
      return
    }

    // Alguém já está com o palco montado: derruba o outro antes de montar este.
    if (activeInstance && activeInstance.token !== token) {
      activeInstance.release?.()
    }

    activeInstance = { token, release }
    status.value = 'loading'
  }

  /** O modelo terminou de carregar (chamado pelo GlbModel). */
  function markReady() {
    if (status.value === 'loading') status.value = 'ready'
  }

  /** Falha de rede/parse — cai para a arte 2D sem drama. */
  function markError() {
    reason.value = 'error'
    status.value = 'error'
  }

  /**
   * Desmonta o palco. O `dispose` de verdade acontece no `onBeforeUnmount` do
   * GlbModel/ModelStage, disparado por esta troca de status.
   */
  function release() {
    if (activeInstance?.token === token) activeInstance = null
    status.value = 'idle'
    reason.value = ''
  }

  onBeforeUnmount(release)

  return {
    status: readonly(status),
    reason: readonly(reason),
    activate,
    release,
    markReady,
    markError,
  }
}
