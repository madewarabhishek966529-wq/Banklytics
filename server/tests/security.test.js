import { describe, it, expect, beforeEach } from 'vitest';
import request from 'supertest';
import jwt from 'jsonwebtoken';
import { createApp } from '../src/app.js';
import { resetDB, User, Statement, Transaction } from '../src/data/store.js';

describe('Banklytics Security & Privacy Audit Suite', () => {
  const app = createApp();
  const secret = process.env.JWT_SECRET || 'banklytics_super_secret_jwt_key_2026_dev_secure_change_in_production';

  beforeEach(() => {
    resetDB();
  });

  it('SEC-01: Rejects unauthenticated request to protected routes with 401 UNAUTHORIZED', async () => {
    const res = await request(app).get('/api/v1/transactions');
    expect(res.status).toBe(401);
    expect(res.body.error).toBeDefined();
    expect(res.body.error.code).toBe('UNAUTHORIZED');
  });

  it('SEC-02: Rejects expired or forged JWT tokens with 401 INVALID_TOKEN', async () => {
    const forgedToken = jwt.sign({ userId: 'fake_user_123' }, 'wrong_secret_signature', { expiresIn: '1h' });
    const res = await request(app)
      .get('/api/v1/transactions')
      .set('Authorization', `Bearer ${forgedToken}`);

    expect(res.status).toBe(401);
    expect(res.body.error.code).toBe('INVALID_TOKEN');
  });

  it('SEC-03: IDOR Prevention - User B cannot view or modify User A transactions', async () => {
    // Create User A
    const userA = await User.create({
      name: 'User A',
      email: 'usera@example.com',
      passwordHash: 'hashA',
    });
    const tokenA = jwt.sign({ userId: userA._id }, secret, { expiresIn: '1h' });

    // Create User B
    const userB = await User.create({
      name: 'User B',
      email: 'userb@example.com',
      passwordHash: 'hashB',
    });
    const tokenB = jwt.sign({ userId: userB._id }, secret, { expiresIn: '1h' });

    // User A creates a transaction
    const txnA = await Transaction.create({
      userId: userA._id,
      transactionDate: new Date('2026-03-01'),
      description: 'User A Private Salary',
      amountPaise: 10000000,
      direction: 'CREDIT',
      category: 'Salary & Income',
      classification: 'INCOME',
    });

    // User B tries to update User A's transaction
    const updateRes = await request(app)
      .patch(`/api/v1/transactions/${txnA._id}`)
      .set('Authorization', `Bearer ${tokenB}`)
      .send({ description: 'Hacked by User B' });

    expect(updateRes.status).toBe(404);
    expect(updateRes.body.error.code).toBe('TRANSACTION_NOT_FOUND');

    // User B tries to delete User A's transaction
    const deleteRes = await request(app)
      .delete(`/api/v1/transactions/${txnA._id}`)
      .set('Authorization', `Bearer ${tokenB}`);

    expect(deleteRes.status).toBe(404);

    // Verify User A's transaction is unmodified
    const checkTxn = await Transaction.findOne({ _id: txnA._id });
    expect(checkTxn.description).toBe('User A Private Salary');
  });

  it('SEC-04: IDOR Prevention - User B cannot delete User A statement', async () => {
    const userA = await User.create({
      name: 'User A',
      email: 'stmt_a@example.com',
      passwordHash: 'hashA',
    });
    const userB = await User.create({
      name: 'User B',
      email: 'stmt_b@example.com',
      passwordHash: 'hashB',
    });
    const tokenB = jwt.sign({ userId: userB._id }, secret, { expiresIn: '1h' });

    const stmtA = await Statement.create({
      userId: userA._id,
      originalFileName: 'confidential_statement.csv',
      fileType: 'CSV',
      bankName: 'SBI',
      status: 'COMPLETED',
    });

    const res = await request(app)
      .delete(`/api/v1/statements/${stmtA._id}`)
      .set('Authorization', `Bearer ${tokenB}`);

    expect(res.status).toBe(404);

    // Verify statement still exists
    const checkStmt = await Statement.findOne({ _id: stmtA._id });
    expect(checkStmt).toBeDefined();
    expect(checkStmt.bankName).toBe('SBI');
  });

  it('SEC-05: CSV Formula Injection Prevention - neutralizes formula prefixes (=, +, -, @)', async () => {
    const user = await User.create({
      name: 'Formula Test User',
      email: 'formula@example.com',
      passwordHash: 'hash',
    });
    const token = jwt.sign({ userId: user._id }, secret, { expiresIn: '1h' });

    // Inject potentially malicious formula payloads
    await Transaction.create({
      userId: user._id,
      transactionDate: new Date('2026-03-01'),
      description: '=cmd|\' /C calc\'!A0',
      amountPaise: 50000,
      direction: 'DEBIT',
      category: '+@MaliciousFormula',
      classification: 'EXPENSE',
      reference: '@SUM(A1:A10)',
    });

    const res = await request(app)
      .get('/api/v1/transactions/export')
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    const csvContent = res.text;

    // Check that formula symbols at start of cell are neutralized with leading single quote
    expect(csvContent).toContain("'=cmd|' /C calc'!A0");
    expect(csvContent).toContain("'+@MaliciousFormula");
    expect(csvContent).toContain("'@SUM(A1:A10)");
  });

  it('SEC-06: Registration enforces validation on weak passwords and duplicate emails', async () => {
    // Weak password
    const weakRes = await request(app).post('/api/v1/auth/register').send({
      name: 'Test',
      email: 'valid@example.com',
      password: '123', // < 6 chars
    });
    expect(weakRes.status).toBe(400);

    // Register user
    const okRes = await request(app).post('/api/v1/auth/register').send({
      name: 'Unique User',
      email: 'duplicate@example.com',
      password: 'StrongPassword123!',
    });
    expect(okRes.status).toBe(201);

    // Duplicate email
    const dupRes = await request(app).post('/api/v1/auth/register').send({
      name: 'Another User',
      email: 'duplicate@example.com',
      password: 'AnotherPassword123!',
    });
    expect(dupRes.status).toBe(409);
    expect(dupRes.body.error.code).toBe('EMAIL_ALREADY_EXISTS');
  });

  it('SEC-07: Account Deletion completely purges user profile, statements, and transactions', async () => {
    const user = await User.create({
      name: 'Purge User',
      email: 'purge@example.com',
      passwordHash: 'hash',
    });
    const token = jwt.sign({ userId: user._id }, secret, { expiresIn: '1h' });

    const stmt = await Statement.create({
      userId: user._id,
      originalFileName: 'purge.csv',
      fileType: 'CSV',
    });

    await Transaction.create({
      userId: user._id,
      statementId: stmt._id,
      transactionDate: new Date(),
      description: 'Purge Item',
      amountPaise: 1000,
      direction: 'DEBIT',
    });

    const delRes = await request(app)
      .delete('/api/v1/auth/account')
      .set('Authorization', `Bearer ${token}`);

    expect(delRes.status).toBe(200);
    expect(delRes.body.success).toBe(true);

    // Verify all records for this user are purged
    expect(await User.findById(user._id)).toBeNull();
    expect(await Statement.countDocuments({ userId: user._id })).toBe(0);
    expect(await Transaction.countDocuments({ userId: user._id })).toBe(0);
  });
});
