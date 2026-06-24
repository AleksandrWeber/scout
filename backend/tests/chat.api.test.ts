import request from 'supertest';
import app from '../src/app';
import { generateSecurityChatReply } from '../src/services/security-chat.service';

jest.mock('../src/services/security-chat.service', () => ({
  generateSecurityChatReply: jest.fn()
}));

const mockedGenerateSecurityChatReply = generateSecurityChatReply as jest.MockedFunction<
  typeof generateSecurityChatReply
>;

describe('/api/chat', () => {
  afterEach(() => {
    jest.resetAllMocks();
  });

  it('returns 400 when message is missing', async () => {
    const response = await request(app).post('/api/chat').send({
      finding: { category: 'XSS', file: 'src/App.tsx' }
    });

    expect(response.status).toBe(400);
    expect(response.body).toEqual({ error: 'message is required' });
  });

  it('returns a chat reply for a valid finding and message', async () => {
    mockedGenerateSecurityChatReply.mockResolvedValue({
      reply: 'Start by sanitizing user HTML before rendering.',
      provider: 'local'
    });

    const response = await request(app).post('/api/chat').send({
      finding: {
        category: 'XSS',
        file: 'src/App.tsx',
        description: 'Uses dangerouslySetInnerHTML.'
      },
      message: 'How do I fix this?'
    });

    expect(response.status).toBe(200);
    expect(response.body.reply).toContain('sanitizing');
    expect(response.body.provider).toBe('local');
  });
});
