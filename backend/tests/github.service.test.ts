import axios from 'axios';
import { fetchRepositoryArchive } from '../src/services/github.service';

jest.mock('axios');

describe('fetchRepositoryArchive', () => {
  it('returns a buffer when axios returns arraybuffer data', async () => {
    (axios.get as jest.Mock).mockResolvedValue({ data: Buffer.from('zipdata') });

    const buf = await fetchRepositoryArchive('https://github.com/owner/repo');
    expect(Buffer.isBuffer(buf)).toBe(true);
    expect(buf.toString()).toBe('zipdata');
  });
});
