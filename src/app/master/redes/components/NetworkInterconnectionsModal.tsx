'use client';

import { useEffect, useState } from 'react';
import styled from 'styled-components';
import { useInterconnections } from '@/hooks/useEligibility';
import type { Network } from '@/types/master';

// Fase 5 — interconexão DIRECIONAL entre redes (Design Doc Seção 9.3):
// "esta rede aceita professores das redes marcadas". Marcar Bomfim aqui não
// faz Bomfim aceitar esta rede de volta — cada rede declara a sua.
const Overlay = styled.div`
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.4);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 100;
`;

const Modal = styled.div`
  background: white;
  border-radius: 12px;
  padding: 24px;
  width: 100%;
  max-width: 480px;
  max-height: 80vh;
  overflow-y: auto;
  box-shadow: ${({ theme }) => theme.shadow.modal};
`;

const Title = styled.h2`
  font-size: 18px;
  font-weight: 600;
  color: ${({ theme }) => theme.colors.text};
  margin: 0 0 8px;
`;

const Hint = styled.p`
  font-size: 13px;
  color: ${({ theme }) => theme.colors.textMuted};
  margin: 0 0 16px;
`;

const Option = styled.label`
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 4px;
  border-bottom: 1px solid ${({ theme }) => theme.colors.borderLight};
  font-size: 14px;
  color: ${({ theme }) => theme.colors.text};
  cursor: pointer;
`;

const Actions = styled.div`
  display: flex;
  gap: 12px;
  justify-content: flex-end;
  margin-top: 20px;
`;

const Button = styled.button`
  padding: 9px 16px;
  border: none;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  background: ${({ theme }) => theme.colors.primary};
  color: white;

  &:hover {
    background: ${({ theme }) => theme.colors.primaryHover};
  }

  &:disabled {
    background: #ccc;
    cursor: not-allowed;
  }
`;

const SecondaryButton = styled(Button)`
  background: white;
  color: ${({ theme }) => theme.colors.primary};
  border: 1px solid ${({ theme }) => theme.colors.primary};

  &:hover {
    background: ${({ theme }) => theme.colors.background};
  }
`;

interface NetworkInterconnectionsModalProps {
  open: boolean;
  network: Network | null;
  networks: Network[];
  onClose: () => void;
}

export function NetworkInterconnectionsModal({
  open,
  network,
  networks,
  onClose,
}: NetworkInterconnectionsModalProps) {
  const { data, save } = useInterconnections(open ? (network?.id ?? null) : null);
  const [selected, setSelected] = useState<Set<number>>(new Set());
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (data && data.networkId === network?.id) {
      setSelected(new Set(data.interconnections.map((item) => item.networkId)));
    }
  }, [data, network?.id]);

  if (!open || !network) return null;

  const toggle = (id: number) => {
    setSelected((current) => {
      const next = new Set(current);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const onSave = async () => {
    setBusy(true);
    try {
      await save([...selected]);
      onClose();
    } catch {
      // erro exibido pelo interceptor
    } finally {
      setBusy(false);
    }
  };

  return (
    <Overlay onClick={onClose} role="dialog" aria-modal="true">
      <Modal onClick={(event) => event.stopPropagation()}>
        <Title>Interconexões de {network.name}</Title>
        <Hint>
          Professores com contrato nas redes marcadas (ou que declararam interesse nelas)
          passam a poder ver as vagas desta rede, conforme os níveis de prioridade
          configurados por cada escola. A relação é direcional.
        </Hint>

        {networks
          .filter((item) => item.id !== network.id)
          .map((item) => (
            <Option key={item.id}>
              <input
                type="checkbox"
                checked={selected.has(item.id)}
                onChange={() => toggle(item.id)}
              />
              {item.name}
            </Option>
          ))}

        <Actions>
          <SecondaryButton onClick={onClose} disabled={busy}>
            Cancelar
          </SecondaryButton>
          <Button onClick={onSave} disabled={busy}>
            {busy ? 'Salvando...' : 'Salvar'}
          </Button>
        </Actions>
      </Modal>
    </Overlay>
  );
}
