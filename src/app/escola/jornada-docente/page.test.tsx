import { render, screen, fireEvent, act } from '@/test-utils';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import JornadaDocentePage from './page';
import { useSchoolContext } from '@/contexts/SchoolContext';
import { useTeacherWorkloadRecords } from '@/hooks/useTeacherWorkloadRecords';
import { useTeachers } from '@/hooks/useTeachers';

vi.mock('@/contexts/SchoolContext', () => ({ useSchoolContext: vi.fn() }));
vi.mock('@/hooks/useTeacherWorkloadRecords', () => ({
  useTeacherWorkloadRecords: vi.fn(),
}));
vi.mock('@/hooks/useTeachers', () => ({ useTeachers: vi.fn() }));
const workloadFormMock = vi.hoisted(() => vi.fn(() => null));
vi.mock('./components/WorkloadRecordForm', () => ({
  WorkloadRecordForm: workloadFormMock,
}));

const fetchLinkedTeachers = vi.fn();

function mockSchool(activeSchoolId: number | null) {
  vi.mocked(useSchoolContext).mockReturnValue({
    user: { id: 1, name: 'Diretora', email: 'd@e.com', profileId: 1 },
    isLoading: false,
    logout: vi.fn(),
    refreshUserData: vi.fn(),
    schoolLinks: [],
    activeSchoolId,
    activeProfileId: 1,
    activeNetworkId: null,
    setActiveSchoolId: vi.fn(),
  } as any);
}

describe('JornadaDocentePage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(useTeachers).mockReturnValue({
      linkedTeachers: [{ id: 7, name: 'Maria', email: 'm@e.com', profileId: 3, totalSubstitutions: 0 }],
      availableTeachers: [],
      enrollmentRequests: [],
      loading: false,
      error: null,
      fetchLinkedTeachers,
      fetchAvailableTeachers: vi.fn(),
      fetchEnrollmentRequests: vi.fn(),
      linkTeacher: vi.fn(),
      unlinkTeacher: vi.fn(),
      updateEnrollmentStatus: vi.fn(),
    } as any);
  });

  it('pede para selecionar uma escola quando não há escola ativa', () => {
    mockSchool(null);
    vi.mocked(useTeacherWorkloadRecords).mockReturnValue({
      records: [],
      loading: false,
      error: null,
      createRecord: vi.fn(),
      refetch: vi.fn(),
    } as any);

    render(<JornadaDocentePage />);

    expect(screen.getByText('Selecione uma escola para continuar.')).toBeInTheDocument();
  });

  it('lista os registros com o nome do professor resolvido', () => {
    mockSchool(1);
    vi.mocked(useTeacherWorkloadRecords).mockReturnValue({
      records: [
        {
          id: 1,
          userId: 7,
          schoolId: 1,
          workloadTypeId: 4,
          hours: 6,
          validFrom: '2026-01-01',
          validTo: null,
          ataOficialRef: null,
          createdById: 1,
          createdAt: '2026-01-01',
        },
      ],
      loading: false,
      error: null,
      createRecord: vi.fn(),
      refetch: vi.fn(),
    } as any);

    render(<JornadaDocentePage />);

    expect(screen.getByText('Maria')).toBeInTheDocument();
    expect(screen.getByText('6h')).toBeInTheDocument();
  });

  it('mostra o estado vazio quando não há registros', () => {
    mockSchool(1);
    vi.mocked(useTeacherWorkloadRecords).mockReturnValue({
      records: [],
      loading: false,
      error: null,
      createRecord: vi.fn(),
      refetch: vi.fn(),
    } as any);

    render(<JornadaDocentePage />);

    expect(screen.getByText('Nenhum registro de jornada ainda.')).toBeInTheDocument();
  });

  it('mostra o carregando enquanto os registros não chegam', () => {
    mockSchool(1);
    vi.mocked(useTeacherWorkloadRecords).mockReturnValue({
      records: [],
      loading: true,
      error: null,
      createRecord: vi.fn(),
      refetch: vi.fn(),
    } as any);

    render(<JornadaDocentePage />);

    expect(screen.getByText('Carregando...')).toBeInTheDocument();
  });

  it('recarrega os professores ao clicar em "+ Novo Registro"', () => {
    mockSchool(1);
    vi.mocked(useTeacherWorkloadRecords).mockReturnValue({
      records: [],
      loading: false,
      error: null,
      createRecord: vi.fn(),
      refetch: vi.fn(),
    } as any);

    render(<JornadaDocentePage />);
    fireEvent.click(screen.getByText('+ Novo Registro'));

    expect(fetchLinkedTeachers).toHaveBeenCalled();
  });

  it('fecha o formulário quando o modal pede para fechar', () => {
    mockSchool(1);
    vi.mocked(useTeacherWorkloadRecords).mockReturnValue({
      records: [],
      loading: false,
      error: null,
      createRecord: vi.fn(),
      refetch: vi.fn(),
    } as any);

    render(<JornadaDocentePage />);
    fireEvent.click(screen.getByText('+ Novo Registro'));

    const calls = workloadFormMock.mock.calls as unknown as Array<
      [{ open: boolean; onClose: () => void }]
    >;
    const props = calls[calls.length - 1][0];
    expect(props.open).toBe(true);

    act(() => props.onClose());

    const updatedCalls = workloadFormMock.mock.calls as unknown as Array<
      [Record<string, unknown>]
    >;
    expect(updatedCalls[updatedCalls.length - 1][0]).toEqual(
      expect.objectContaining({ open: false }),
    );
  });

  it('mostra a vigência com fim, a ata oficial e o nome padrão de professor desconhecido', () => {
    mockSchool(1);
    vi.mocked(useTeacherWorkloadRecords).mockReturnValue({
      records: [
        {
          id: 2,
          userId: 99,
          schoolId: 1,
          workloadTypeId: 4,
          hours: 8,
          validFrom: '2026-01-01',
          validTo: '2026-06-30',
          ataOficialRef: 'ATA-2026-001',
          createdById: 1,
          createdAt: '2026-01-01',
        },
      ],
      loading: false,
      error: null,
      createRecord: vi.fn(),
      refetch: vi.fn(),
    } as any);

    render(<JornadaDocentePage />);

    expect(screen.getByText('Professor #99')).toBeInTheDocument();
    expect(
      screen.getByText(
        `${new Date('2026-01-01').toLocaleDateString('pt-BR')} até ${new Date(
          '2026-06-30',
        ).toLocaleDateString('pt-BR')}`,
      ),
    ).toBeInTheDocument();
    expect(screen.getByText('ATA-2026-001')).toBeInTheDocument();
  });
});
