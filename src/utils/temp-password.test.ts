import { describe, it, expect } from 'vitest';
import { tempPasswordMessage } from './temp-password';

describe('tempPasswordMessage', () => {
  it('avisa que foi por e-mail, mas mostra a senha caso não chegue', () => {
    expect(tempPasswordMessage('Ana', 'Abc123456789', true, 'Conta criada.')).toBe(
      'Conta criada. A senha temporária foi enviada para o e-mail de Ana. Se não chegar, repasse: Abc123456789',
    );
  });

  it('sem e-mail, pede para repassar', () => {
    expect(tempPasswordMessage('Ana', 'X1')).toBe(
      'Senha temporária de Ana: X1 (o e-mail não foi enviado; repasse à pessoa — a senha não fica salva em outro lugar).',
    );
  });
});
