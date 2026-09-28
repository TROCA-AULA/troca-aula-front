import { describe, it, expect, vi, beforeEach } from 'vitest';
import { eligibilityService } from '@/services/eligibility.service';
import api from '@/api-client.service';

vi.mock('@/api-client.service', () => ({
  default: {
    get: vi.fn(),
    post: vi.fn(),
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

  it('lê e salva os níveis de prioridade da escola', async () => {
    (api.get as any).mockResolvedValue({
      data: { schoolId: 4, tiers: [], allowedNetworkIds: [], fallbackPriorityWindowHours: null },
    });
    (api.put as any).mockResolvedValue({ data: { schoolId: 4, tiers: [] } });

    await eligibilityService.getPriorityTiers(4);
    await eligibilityService.setPriorityTiers(4, [
      { order: 1, delayMinutes: 0, scopeType: 'ESCOLA' },
    ]);

    expect(api.get).toHaveBeenCalledWith('/schools/4/priority-tiers');
    expect(api.put).toHaveBeenCalledWith('/schools/4/priority-tiers', {
      tiers: [{ order: 1, delayMinutes: 0, scopeType: 'ESCOLA' }],
    });
  });

  it('lê e salva as interconexões da rede', async () => {
    (api.get as any).mockResolvedValue({ data: { networkId: 4, interconnections: [] } });
    (api.put as any).mockResolvedValue({ data: { networkId: 4, interconnections: [] } });

    await eligibilityService.getInterconnections(4);
    await eligibilityService.setInterconnections(4, [3]);

    expect(api.get).toHaveBeenCalledWith('/networks/4/interconnections');
    expect(api.put).toHaveBeenCalledWith('/networks/4/interconnections', {
      allowedNetworkIds: [3],
    });
  });
});
