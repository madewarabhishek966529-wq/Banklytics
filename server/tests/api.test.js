import { describe, it, expect, vi } from 'vitest';
import request from 'supertest';
import { createApp } from '../src/app.js';
import jwt from 'jsonwebtoken';

// Mock Mongoose models
vi.mock('../src/models/User.js', () => {
  const dummyUser = {
    _id: '507f1f77bcf86cd799439011',
    name: 'Aditi Rao',
    email: 'aditi@example.com',
    passwordHash: '$2a$10$hashedpassword',
    comparePassword: vi.fn().mockResolvedValue(true),
    createdAt: new Date('2026-01-01'),
  };

  return {
    User: {
      findOne: vi.fn().mockImplementation(({ email }) => {
        if (email === 'aditi@example.com') return Promise.resolve(dummyUser);
        return Promise.resolve(null);
      }),
      findById: vi.fn().mockResolvedValue(dummyUser),
      create: vi.fn().mockResolvedValue(dummyUser),
    },
  };
});

vi.mock('../src/models/Statement.js', () => {
  const dummyStatement = {
    _id: '607f1f77bcf86cd799439022',
    userId: '507f1f77bcf86cd799439011',
    originalFileName: 'test_statement.csv',
    fileHash: 'test_hash_123',
    fileType: 'CSV',
    bankName: 'HDFC Bank',
    accountLabel: 'Primary Checking',
    currency: 'INR',
    openingBalancePaise: 5000000,
    closingBalancePaise: 11954950,
    status: 'COMPLETED',
    createdAt: new Date('2026-11-01'),
  };

  return {
    Statement: {
      findOne: vi.fn().mockImplementation((query) => {
        if (query.fileHash === 'already_imported_hash') return Promise.resolve(dummyStatement);
        if (query._id) return Promise.resolve(dummyStatement);
        return Promise.resolve(null);
      }),
      find: vi.fn().mockReturnValue({
        sort: vi.fn().mockReturnValue({
          skip: vi.fn().mockReturnValue({
            limit: vi.fn().mockResolvedValue([dummyStatement]),
          }),
        }),
      }),
      countDocuments: vi.fn().mockResolvedValue(1),
      create: vi.fn().mockResolvedValue(dummyStatement),
      deleteOne: vi.fn().mockResolvedValue({ deletedCount: 1 }),
    },
  };
});

vi.mock('../src/models/Transaction.js', () => {
  const dummyTxns = [
    {
      _id: '707f1f77bcf86cd799439031',
      userId: '507f1f77bcf86cd799439011',
      statementId: '607f1f77bcf86cd799439022',
      transactionDate: new Date('2026-11-02'),
      description: 'ACH SALARY CREDIT',
      amountPaise: 7500000,
      direction: 'CREDIT',
      category: 'Salary & Income',
      classification: 'INCOME',
    },
    {
      _id: '707f1f77bcf86cd799439032',
      userId: '507f1f77bcf86cd799439011',
      statementId: '607f1f77bcf86cd799439022',
      transactionDate: new Date('2026-11-05'),
      description: 'UPI/SWIGGY/12345',
      amountPaise: 45050,
      direction: 'DEBIT',
      category: 'Food & Dining',
      classification: 'EXPENSE',
    },
  ];

  return {
    Transaction: {
      find: vi.fn().mockImplementation((query) => {
        let results = [...dummyTxns];
        if (query?.category) {
          results = results.filter((t) => t.category === query.category);
        }
        const sortMock = vi.fn().mockImplementation(() => {
          const promise = Promise.resolve(results);
          promise.skip = vi.fn().mockReturnValue({
            limit: vi.fn().mockReturnValue({
              populate: vi.fn().mockResolvedValue(results),
            }),
          });
          promise.limit = vi.fn().mockReturnValue({
            populate: vi.fn().mockResolvedValue(results),
          });
          return promise;
        });

        return {
          sort: sortMock,
          select: vi.fn().mockResolvedValue(results),
        };
      }),
      countDocuments: vi.fn().mockResolvedValue(2),
      insertMany: vi.fn().mockResolvedValue(dummyTxns),
      findOne: vi.fn().mockResolvedValue(dummyTxns[0]),
      findOneAndDelete: vi.fn().mockResolvedValue(dummyTxns[0]),
      deleteMany: vi.fn().mockResolvedValue({ deletedCount: 2 }),
    },
  };
});

describe('Banklytics REST API Controller & End-to-End Suite', () => {
  const app = createApp();
  const secret = process.env.JWT_SECRET || 'banklytics_super_secret_jwt_key_2026_dev_secure_change_in_production';
  const validToken = jwt.sign({ userId: '507f1f77bcf86cd799439011' }, secret, { expiresIn: '1h' });

  it('GET /health returns 200 OK', async () => {
    const res = await request(app).get('/health');
    expect(res.status).toBe(200);
    expect(res.body.status).toBe('ok');
  });

  it('POST /api/v1/auth/register validates and registers a user', async () => {
    const res = await request(app).post('/api/v1/auth/register').send({
      name: 'Aditi Rao',
      email: 'newuser@example.com',
      password: 'securepassword123',
    });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.token).toBeDefined();
  });

  it('POST /api/v1/auth/login logs in valid user', async () => {
    const res = await request(app).post('/api/v1/auth/login').send({
      email: 'aditi@example.com',
      password: 'password123',
    });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.token).toBeDefined();
  });

  it('GET /api/v1/auth/me returns current user when authenticated', async () => {
    const res = await request(app)
      .get('/api/v1/auth/me')
      .set('Authorization', `Bearer ${validToken}`);

    expect(res.status).toBe(200);
    expect(res.body.user.email).toBe('aditi@example.com');
  });

  it('POST /api/v1/statements/preview extracts CSV rows and checks reconciliation without persisting', async () => {
    const sampleCSV = `Date,Narration,Chq / Ref No,Withdrawal,Deposit,Balance
01/11/2026,OPENING BALANCE,,0.00,0.00,50000.00
02/11/2026,ACH SALARY CREDIT,SAL101,,75000.00,125000.00
05/11/2026,UPI/SWIGGY/12345,SWG99,450.50,,124549.50
10/11/2026,CLOSING BALANCE,,0.00,0.00,124549.50
`;

    const res = await request(app)
      .post('/api/v1/statements/preview')
      .set('Authorization', `Bearer ${validToken}`)
      .attach('file', Buffer.from(sampleCSV), 'salary_statement.csv');

    expect(res.status).toBe(200);
    expect(res.body.preview.transactions.length).toBe(2);
    expect(res.body.preview.reconciliation.status).toBe('MATCHED');
    expect(res.body.preview.reconciliation.isBalanced).toBe(true);
    expect(res.body.preview.reconciliation.netCashFlowPaise).toBe(7500000 - 45050);
  });

  it('POST /api/v1/statements/confirm persists confirmed transactions', async () => {
    const payload = {
      originalFileName: 'salary_statement.csv',
      fileHash: 'unique_hash_xyz',
      fileType: 'CSV',
      bankName: 'HDFC Bank',
      accountLabel: 'Primary Checking',
      openingBalancePaise: 5000000,
      closingBalancePaise: 12454950,
      transactions: [
        {
          transactionDate: '2026-11-02',
          description: 'ACH SALARY CREDIT',
          amountPaise: 7500000,
          direction: 'CREDIT',
          category: 'Salary & Income',
          classification: 'INCOME',
        },
      ],
    };

    const res = await request(app)
      .post('/api/v1/statements/confirm')
      .set('Authorization', `Bearer ${validToken}`)
      .send(payload);

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.importedCount).toBe(1);
  });

  it('GET /api/v1/statements lists statements', async () => {
    const res = await request(app)
      .get('/api/v1/statements')
      .set('Authorization', `Bearer ${validToken}`);

    expect(res.status).toBe(200);
    expect(res.body.statements.length).toBe(1);
    expect(res.body.statements[0].bankName).toBe('HDFC Bank');
  });

  it('GET /api/v1/analytics/summary returns calculated cash flows', async () => {
    const res = await request(app)
      .get('/api/v1/analytics/summary')
      .set('Authorization', `Bearer ${validToken}`);

    expect(res.status).toBe(200);
    expect(res.body.currency).toBe('INR');
    expect(res.body.creditsPaise).toBe(7500000);
    expect(res.body.debitsPaise).toBe(45050);
  });

  it('GET /api/v1/transactions/export returns CSV file attachment', async () => {
    const res = await request(app)
      .get('/api/v1/transactions/export')
      .set('Authorization', `Bearer ${validToken}`);

    expect(res.status).toBe(200);
    expect(res.headers['content-type']).toContain('text/csv');
  });

  it('DELETE /api/v1/statements/:id cascades and deletes statement', async () => {
    const res = await request(app)
      .delete('/api/v1/statements/607f1f77bcf86cd799439022')
      .set('Authorization', `Bearer ${validToken}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
  });
});
