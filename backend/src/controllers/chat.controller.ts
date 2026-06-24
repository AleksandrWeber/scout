import { Request, Response } from 'express';
import { generateSecurityChatReply } from '../services/security-chat.service';

export const chatController = async (req: Request, res: Response) => {
  const { finding, message, history } = req.body;

  if (!finding || typeof finding !== 'object') {
    return res.status(400).json({ error: 'finding is required' });
  }

  if (!message || typeof message !== 'string' || !message.trim()) {
    return res.status(400).json({ error: 'message is required' });
  }

  if (history !== undefined && !Array.isArray(history)) {
    return res.status(400).json({ error: 'history must be an array when provided' });
  }

  try {
    const response = await generateSecurityChatReply({
      finding,
      message,
      history
    });
    return res.json(response);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: 'Failed to generate chat response' });
  }
};
