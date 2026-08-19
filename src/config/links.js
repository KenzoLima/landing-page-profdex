// Todo link que sai desta página mora aqui.
//
// A landing é estática e vive num projeto Vercel próprio, então ela NÃO
// compartilha origem com o app — o CTA precisa ser absoluto. Se o app mudar de
// endereço (domínio próprio, por exemplo), é este arquivo que muda, e só ele.

/** O app. */
export const APP_URL = 'https://profdex-two.vercel.app'

/**
 * Destino do CTA.
 *
 * Aponta para a tela de login, nunca para um cadastro: em produção toda conta
 * nasce do Google institucional e `POST /auth/register` responde 404 de
 * propósito. A própria tela de login é que oferece o botão do Google.
 */
export const APP_LOGIN_URL = `${APP_URL}/login`

/** Domínios institucionais aceitos, exibidos junto ao CTA final. */
export const EMAIL_DOMAINS = {
  student: '@edu.unifil.br',
  admin: '@unifil.br',
}

export const REPO_URL = 'https://github.com/KenzoLima/landing-page-profdex'
export const UNIFIL_URL = 'https://www.unifil.br'
