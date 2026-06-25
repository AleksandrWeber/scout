import { buildAgentsSynthesisFallback } from '../../shared/agents';
import { runCodeSecurityAgent } from '../src/services/agents/code-security.agent';
import { runSupplyChainAgent } from '../src/services/agents/supply-chain.agent';
import { runSynthesisAgent } from '../src/services/agents/synthesis.agent';
import { runMultiAgentScan } from '../src/services/multi-agent-orchestrator.service';

jest.mock('../src/services/agents/supply-chain.agent', () => ({
  runSupplyChainAgent: jest.fn()
}));
jest.mock('../src/services/agents/code-security.agent', () => ({
  runCodeSecurityAgent: jest.fn()
}));
jest.mock('../src/services/agents/synthesis.agent', () => ({
  runSynthesisAgent: jest.fn()
}));

const mockedSupplyChain = runSupplyChainAgent as jest.MockedFunction<typeof runSupplyChainAgent>;
const mockedCodeSecurity = runCodeSecurityAgent as jest.MockedFunction<typeof runCodeSecurityAgent>;
const mockedSynthesis = runSynthesisAgent as jest.MockedFunction<typeof runSynthesisAgent>;

describe('runMultiAgentScan', () => {
  afterEach(() => {
    jest.resetAllMocks();
  });

  it('runs both deterministic agents in parallel and merges findings', async () => {
    mockedSupplyChain.mockResolvedValue({
      id: 'supply-chain',
      name: 'Supply Chain',
      status: 'success',
      durationMs: 12,
      dependencyFindings: [
        {
          scoutAgent: 'supply-chain',
          severity: 'HIGH',
          category: 'DEPENDENCY_VULNERABILITY',
          file: 'package.json',
          description: 'Vulnerable lodash',
          risk: 'risk',
          fix: 'fix',
          education: 'edu'
        }
      ],
      codeFindings: [
        {
          scoutAgent: 'supply-chain',
          severity: 'HIGH',
          category: 'SECRET',
          file: 'src/config.ts',
          description: 'Hardcoded token',
          risk: 'risk',
          fix: 'fix',
          education: 'edu'
        }
      ],
      secrets: { filesScanned: 3, count: 1 }
    });

    mockedCodeSecurity.mockResolvedValue({
      id: 'code-security',
      name: 'Code Security',
      status: 'success',
      durationMs: 20,
      codeFindings: [
        {
          scoutAgent: 'code-security',
          severity: 'HIGH',
          category: 'XSS',
          file: 'src/app.ts',
          description: 'dangerouslySetInnerHTML',
          risk: 'risk',
          fix: 'fix',
          education: 'edu'
        }
      ],
      semgrep: { status: 'success', count: 1 },
      ast: { filesScanned: 2, parseErrors: 0, count: 0 }
    });

    mockedSynthesis.mockResolvedValue({
      id: 'synthesis',
      status: 'success',
      durationMs: 5,
      synthesis: buildAgentsSynthesisFallback({
        locale: 'en',
        agentRuns: [],
        codeFindings: [],
        dependencyFindings: []
      })
    });

    const result = await runMultiAgentScan('/tmp/project', {
      locale: 'en',
      includeSynthesis: true
    });

    expect(mockedSupplyChain).toHaveBeenCalledWith('/tmp/project');
    expect(mockedCodeSecurity).toHaveBeenCalledWith('/tmp/project');
    expect(result.codeFindings).toHaveLength(2);
    expect(result.dependencyFindings).toHaveLength(1);
    expect(result.agentsReview.agents).toHaveLength(3);
    expect(result.agentsReview.synthesis?.overview).toContain('Scout ran');
    expect(result.summary.secretFindings).toBe(1);
    expect(result.summary.securityFindings).toBe(1);
  });

  it('skips synthesis when includeSynthesis is false', async () => {
    mockedSupplyChain.mockResolvedValue({
      id: 'supply-chain',
      name: 'Supply Chain',
      status: 'success',
      durationMs: 1,
      dependencyFindings: [],
      codeFindings: [],
      secrets: { filesScanned: 0, count: 0 }
    });
    mockedCodeSecurity.mockResolvedValue({
      id: 'code-security',
      name: 'Code Security',
      status: 'success',
      durationMs: 1,
      codeFindings: [],
      semgrep: { status: 'unknown', count: 0 },
      ast: { filesScanned: 0, parseErrors: 0, count: 0 }
    });

    const result = await runMultiAgentScan('/tmp/project', {
      locale: 'en',
      includeSynthesis: false
    });

    expect(mockedSynthesis).not.toHaveBeenCalled();
    expect(result.agentsReview.agents).toHaveLength(2);
    expect(result.agentsReview.synthesis).toBeUndefined();
  });
});
