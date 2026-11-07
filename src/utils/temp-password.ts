// Mensagem única para senha temporária (criação de conta ou redefinição).
// Com servidor de e-mail configurado, a pessoa recebe a senha por e-mail;
// sem ele (ou se o envio falhar), quem fez a ação repassa a senha.
export function tempPasswordMessage(
  name: string,
  tempPassword: string,
  emailSent?: boolean,
  prefix = '',
): string {
  const start = prefix ? `${prefix} ` : '';
  if (emailSent) {
    return `${start}A senha temporária foi enviada para o e-mail de ${name}. Se não chegar, repasse: ${tempPassword}`;
  }
  return `${start}Senha temporária de ${name}: ${tempPassword} (o e-mail não foi enviado; repasse à pessoa — a senha não fica salva em outro lugar).`;
}
