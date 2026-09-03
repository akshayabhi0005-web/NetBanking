import { Router, Request, Response } from 'express';
import { db } from '../database/db.js';

export const contentRouter = Router();

/**
 * Public/User Notices & Announcements
 */
contentRouter.get('/notices', (req: Request, res: Response) => {
  const notices = db.prepare('SELECT * FROM system_notices WHERE is_active = 1 ORDER BY priority DESC, created_at DESC').all() as any[];
  res.json({
    success: true,
    notices: notices.map(n => ({
      id: n.id,
      category: n.category,
      title: n.title,
      message: n.message,
      priority: n.priority,
      createdAt: n.created_at
    }))
  });
});

/**
 * Security Advisories
 */
contentRouter.get('/security-advisories', (req: Request, res: Response) => {
  const advisories = db.prepare('SELECT * FROM security_advisories ORDER BY created_at DESC').all() as any[];
  res.json({
    success: true,
    advisories: advisories.map(a => ({
      id: a.id,
      category: a.category,
      title: a.title,
      description: a.description
    }))
  });
});

/**
 * FAQs
 */
contentRouter.get('/faqs', (req: Request, res: Response) => {
  const faqs = db.prepare('SELECT * FROM faqs ORDER BY order_num ASC').all() as any[];
  res.json({
    success: true,
    faqs: faqs.map(f => ({
      id: f.id,
      category: f.category,
      question: f.question,
      answer: f.answer
    }))
  });
});

/**
 * System Health & Environment Status
 */
contentRouter.get('/health', (req: Request, res: Response) => {
  res.json({
    success: true,
    status: 'OPERATIONAL',
    service: 'SecureBank Internet Banking Core',
    environment: 'Simulated Educational Banking Environment',
    serverTime: new Date().toISOString()
  });
});
