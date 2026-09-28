import { describe, it, expect, vi, beforeEach } from 'vitest';
import { eligibilityService } from '@/services/eligibility.service';
import api from '@/api-client.service';

vi.mock('@/api-client.service', () => ({
  default: {
    get: vi.fn(),
    post: vi.fn(),
    patch: vi.fn(),
    put: vi.fn(),
    delete: vi.fn(),
  },
}));

describe('eligibilityService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('lê e escreve as preferências do professor', async () => {
    (api.get as any).mockResolvedValue({
      data: { networkInterests: [], schoolExclusions: [] },
    });
    (api.post as any).mockResolvedValue({ data: {} });
    (api.delete as any).mockResolvedValue({ data: {} });

    await eligibilityService.getMyPreferences();
    await eligibilityService.addNetworkInterest(2);
    await eligibilityService.removeNetworkInterest(2);
    await eligibilityService.addSchoolExclusion(9);
    await eligibilityService.removeSchoolExclusion(9);

    expect(api.get).toHaveBeenCalledWith('/professor-preferences');
    expect(api.post).toHaveBeenCalledWith('/professor-preferences/network-interests', { networkId: 2 });
    expect(api.delete).toHaveBeenCalledWith('/professor-preferences/network-interests/2');
    expect(api.post).toHaveBeenCalledWith('/professor-preferences/school-exclusions', { schoolId: 9 });
    expect(api.delete).toHaveBeenCalledWith('/professor-preferences/school-exclusions/9');
  });

  it('gerencia os grupos de prioridade da escola', async () => {
    (api.get as any).mockResolvedValue({ data: { schoolId: 6, groups: [] } });
    (api.post as any).mockResolvedValue({ data: { schoolId: 6, groups: [] } });
    (api.patch as any).mockResolvedValue({ data: { schoolId: 6, groups: [] } });
    (api.put as any).mockResolvedValue({ data: { schoolId: 6, groups: [] } });
    (api.delete as any).mockResolvedValue({ data: { schoolId: 6, groups: [] } });

    await eligibilityService.getTeacherGroups(6);
    await eligibilityService.createTeacherGroup(6, {
      name: 'Professores da casa',
      delayMinutes: 0,
    });
    await eligibilityService.updateTeacherGroup(6, 1, { delayMinutes: 30 });
    await eligibilityService.setTeacherGroupMembers(6, 1, [17, 18]);
    await eligibilityService.removeTeacherGroup(6, 1);

    expect(api.get).toHaveBeenCalledWith('/schools/6/teacher-groups');
    expect(api.post).toHaveBeenCalledWith('/schools/6/teacher-groups', {
      name: 'Professores da casa',
      delayMinutes: 0,
    });
    expect(api.patch).toHaveBeenCalledWith('/schools/6/teacher-groups/1', {
      delayMinutes: 30,
    });
    expect(api.put).toHaveBeenCalledWith('/schools/6/teacher-groups/1/members', {
      professorIds: [17, 18],
    });
    expect(api.delete).toHaveBeenCalledWith('/schools/6/teacher-groups/1');
  });

  it('salva as configurações de prioridade da escola', async () => {
    (api.patch as any).mockResolvedValue({ data: { schoolId: 6 } });

    await eligibilityService.updatePrioritySettings(6, {
      ungroupedDelayMinutes: 45,
      acceptedNetworkIds: [5],
    });

    expect(api.patch).toHaveBeenCalledWith('/schools/6/priority-settings', {
      ungroupedDelayMinutes: 45,
      acceptedNetworkIds: [5],
    });
  });

  it('lê e salva as interconexões da rede', async () => {
    (api.get as any).mockResolvedValue({ data: { networkId: 6, interconnections: [] } });
    (api.put as any).mockResolvedValue({ data: { networkId: 6, interconnections: [] } });

    await eligibilityService.getInterconnections(6);
    await eligibilityService.setInterconnections(6, [5]);

    expect(api.get).toHaveBeenCalledWith('/networks/6/interconnections');
    expect(api.put).toHaveBeenCalledWith('/networks/6/interconnections', {
      allowedNetworkIds: [5],
    });
  });
});
