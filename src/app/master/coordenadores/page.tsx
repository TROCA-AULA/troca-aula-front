'use client';

import { useCallback, useEffect, useState } from 'react';
import styled from 'styled-components';
import { toast } from 'react-toastify';
import { masterService } from '@/services/master.service';
import { useNetworks } from '@/hooks/useNetworks';
import { ConfirmModal } from '@/components/ConfirmModal';
import type { NetworkCoordinator } from '@/types/master';
import {
  PageContainer,
  PageHeader,
  PageTitle,
  PageSubtitle,
  PrimaryButton,
  Table,
  Th,
  Td,
  ActionButton,
  EmptyState,
  LoadingState,
} from '@/components/ui/AdminTable';
import { SkeletonRows } from '@/components/ui/Skeleton';
import { tempPasswordMessage } from '@/utils/temp-password';

// Coordenador municipal: gere todas as escolas das redes (municípios) que
// coordena — cria/edita escolas da rede, define políticas e interconexões
// da rede, vê a auditoria e opera cada escola como um diretor. Só o MASTER
// nomeia ou remove coordenadores.

const Section = styled.section`
  background: ${({ theme }) => theme.colors.surface};
  border-radius: ${({ theme }) => theme.radius.lg};
  padding: 20px;
  margin-bottom: 24px;
  box-shadow: ${({ theme }) => theme.shadow.card};
`;

const SectionTitle = styled.h2`
  font-size: 18px;
  font-weight: 600;
  color: ${({ theme }) => theme.colors.text};
  margin: 0 0 8px;
`;

const Hint = styled.p`
  font-size: 13px;
  color: ${({ theme }) => theme.colors.textMuted};
  margin: 0 0 12px;
`;

const Form = styled.form`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 12px;
  align-items: end;
`;

const FormGroup = styled.div`
  display: flex;
  flex-direction: column;
  gap: 6px;
`;

const Label = styled.label`
  font-size: 12px;
  font-weight: 500;
  color: ${({ theme }) => theme.colors.text};
`;

const Input = styled.input`
  padding: 8px 12px;
  border: 1px solid ${({ theme }) => theme.colors.border};
  border-radius: ${({ theme }) => theme.radius.md};
  font-size: 14px;
`;

const Select = styled.select`
  padding: 8px 12px;
  border: 1px solid ${({ theme }) => theme.colors.border};
  border-radius: ${({ theme }) => theme.radius.md};
  font-size: 14px;
`;

const DangerAction = styled(ActionButton)`
  background-color: ${({ theme }) => theme.colors.danger};
  color: ${({ theme }) => theme.colors.onPrimary};
`;

const TableWrapper = styled.div`
  overflow-x: auto;
`;

const EMPTY_FORM = { name: '', email: '', phone: '', networkId: '' };

export default function CoordenadoresPage() {
  const { networks } = useNetworks();
  const [coordinators, setCoordinators] = useState<NetworkCoordinator[]>([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState(EMPTY_FORM);
  const [busy, setBusy] = useState(false);
  const [toRemove, setToRemove] = useState<NetworkCoordinator | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      setCoordinators(await masterService.getCoordinators());
    } catch {
      setCoordinators([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const canSubmit =
    form.email.trim() !== '' &&
    form.name.trim() !== '' &&
    form.phone.trim() !== '' &&
    form.networkId !== '';

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!canSubmit) return;
    setBusy(true);
    try {
      const result = await masterService.addCoordinator({
        name: form.name.trim(),
        email: form.email.trim(),
        phone: form.phone.trim(),
        networkId: Number(form.networkId),
      });
      if (result.created) {
        toast.success(
          tempPasswordMessage(
            form.name.trim(),
            result.tempPassword ?? '',
            result.emailSent,
            'Conta criada.',
          ),
          { autoClose: false },
        );
      } else {
        toast.success('Coordenador vinculado (a pessoa já tinha cadastro)');
      }
      setForm(EMPTY_FORM);
      await load();
    } catch {
      // mensagem do backend já aparece no toast do api-client
    } finally {
      setBusy(false);
    }
  };

  const confirmRemove = async () => {
    const coordinator = toRemove;
    setToRemove(null);
    if (!coordinator) return;
    try {
      await masterService.removeCoordinator(coordinator.userId, coordinator.networkId);
      toast.success(`${coordinator.userName} não coordena mais ${coordinator.networkName ?? 'a rede'}`);
      await load();
    } catch {
      // toast do api-client
    }
  };

  return (
    <PageContainer>
      <PageHeader>
        <div>
          <PageTitle>Coordenadores municipais</PageTitle>
          <PageSubtitle>
            Quem gere todas as escolas de uma rede (município).
          </PageSubtitle>
        </div>
      </PageHeader>

      <Section>
        <SectionTitle>Nomear coordenador</SectionTitle>
        <Hint>
          Se o e-mail já tiver cadastro, a pessoa só é vinculada à rede. Se não tiver,
          a conta é criada e a senha temporária aparece uma única vez.
        </Hint>
        <Form onSubmit={handleSubmit}>
          <FormGroup>
            <Label htmlFor="coord-name">Nome</Label>
            <Input
              id="coord-name"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
            />
          </FormGroup>
          <FormGroup>
            <Label htmlFor="coord-email">E-mail</Label>
            <Input
              id="coord-email"
              type="email"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
            />
          </FormGroup>
          <FormGroup>
            <Label htmlFor="coord-phone">Telefone</Label>
            <Input
              id="coord-phone"
              value={form.phone}
              onChange={(e) => setForm({ ...form, phone: e.target.value })}
            />
          </FormGroup>
          <FormGroup>
            <Label htmlFor="coord-network">Rede (município)</Label>
            <Select
              id="coord-network"
              value={form.networkId}
              onChange={(e) => setForm({ ...form, networkId: e.target.value })}
            >
              <option value="">Selecione...</option>
              {networks.map((network) => (
                <option key={network.id} value={network.id}>
                  {network.name}
                </option>
              ))}
            </Select>
          </FormGroup>
          <PrimaryButton type="submit" disabled={busy || !canSubmit}>
            {busy ? 'Salvando...' : 'Nomear coordenador'}
          </PrimaryButton>
        </Form>
      </Section>

      <Section>
        <SectionTitle>Coordenadores atuais</SectionTitle>
        {loading ? (
          <LoadingState>
            <SkeletonRows />
          </LoadingState>
        ) : coordinators.length === 0 ? (
          <EmptyState>Nenhum coordenador municipal nomeado.</EmptyState>
        ) : (
          <TableWrapper>
            <Table>
              <thead>
                <tr>
                  <Th>Nome</Th>
                  <Th>E-mail</Th>
                  <Th>Telefone</Th>
                  <Th>Rede</Th>
                  <Th>Ações</Th>
                </tr>
              </thead>
              <tbody>
                {coordinators.map((coordinator) => (
                  <tr key={`${coordinator.userId}-${coordinator.networkId}`}>
                    <Td>{coordinator.userName}</Td>
                    <Td>{coordinator.userEmail}</Td>
                    <Td>{coordinator.userPhone ?? '-'}</Td>
                    <Td>{coordinator.networkName ?? `Rede #${coordinator.networkId}`}</Td>
                    <Td>
                      <DangerAction
                        onClick={() => setToRemove(coordinator)}
                        aria-label={`Remover ${coordinator.userName}`}
                      >
                        Remover
                      </DangerAction>
                    </Td>
                  </tr>
                ))}
              </tbody>
            </Table>
          </TableWrapper>
        )}
      </Section>

      <ConfirmModal
        open={toRemove != null}
        title="Remover coordenador"
        message={`${toRemove?.userName ?? ''} deixa de coordenar ${toRemove?.networkName ?? 'a rede'}. A conta continua existindo. A mudança vale no próximo login.`}
        confirmText="Remover"
        onConfirm={confirmRemove}
        onCancel={() => setToRemove(null)}
      />
    </PageContainer>
  );
}
