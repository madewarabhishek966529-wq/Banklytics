import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DATA_DIR = path.resolve(__dirname, '../../data');
const DB_FILE = path.join(DATA_DIR, 'banklytics_db.json');

// In-memory cache of the database
let dbState = {
  users: [],
  statements: [],
  transactions: [],
};

// Initialize file storage
export function initDB() {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }

    if (fs.existsSync(DB_FILE)) {
      const content = fs.readFileSync(DB_FILE, 'utf-8');
      if (content.trim()) {
        dbState = JSON.parse(content);
      }
    } else {
      saveDB();
    }
    console.log('[Banklytics Store] Local JSON database loaded successfully from:', DB_FILE);
  } catch (err) {
    console.warn('[Banklytics Store] Notice reading database file, initializing clean state:', err.message);
    saveDB();
  }
}

// Persist in-memory state to disk atomically
export function saveDB() {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    const tempFile = `${DB_FILE}.tmp.${Date.now()}`;
    fs.writeFileSync(tempFile, JSON.stringify(dbState, null, 2), 'utf-8');
    fs.renameSync(tempFile, DB_FILE);
  } catch (err) {
    console.error('[Banklytics Store] Error saving database:', err.message);
  }
}

// Generate unique ObjectId-like 24-char hex string
export function generateId() {
  return crypto.randomBytes(12).toString('hex');
}

// Helper to match queries
function matchesQuery(item, query = {}) {
  if (!query) return true;
  for (const [key, filter] of Object.entries(query)) {
    if (key === '$or' && Array.isArray(filter)) {
      const orMatched = filter.some((subQuery) => matchesQuery(item, subQuery));
      if (!orMatched) return false;
      continue;
    }

    const val = item[key];

    if (filter instanceof RegExp) {
      if (!filter.test(String(val || ''))) return false;
      continue;
    }

    if (typeof filter === 'object' && filter !== null) {
      if (filter.$in && Array.isArray(filter.$in)) {
        if (!filter.$in.includes(val)) return false;
      }
      if (filter.$gte !== undefined) {
        const itemDate = new Date(val).getTime();
        const targetDate = new Date(filter.$gte).getTime();
        if (isNaN(itemDate) || itemDate < targetDate) return false;
      }
      if (filter.$lte !== undefined) {
        const itemDate = new Date(val).getTime();
        const targetDate = new Date(filter.$lte).getTime();
        if (isNaN(itemDate) || itemDate > targetDate) return false;
      }
      if (filter.$regex) {
        const regex = new RegExp(filter.$regex, filter.$options || 'i');
        if (!regex.test(String(val || ''))) return false;
      }
      continue;
    }

    // Direct comparison
    if (String(val) !== String(filter)) {
      return false;
    }
  }
  return true;
}

// Query helper with sort, skip, limit, populate chaining
class QueryBuilder {
  constructor(items) {
    this._items = [...items];
  }

  sort(sortObj = {}) {
    this._items.sort((a, b) => {
      for (const [field, dir] of Object.entries(sortObj)) {
        let valA = a[field];
        let valB = b[field];

        if (field === 'transactionDate' || field === 'createdAt') {
          valA = new Date(valA).getTime() || 0;
          valB = new Date(valB).getTime() || 0;
        }

        if (valA < valB) return dir === -1 ? 1 : -1;
        if (valA > valB) return dir === -1 ? -1 : 1;
      }
      return 0;
    });
    return this;
  }

  skip(n = 0) {
    this._items = this._items.slice(n);
    return this;
  }

  limit(n = 0) {
    if (n > 0) {
      this._items = this._items.slice(0, n);
    }
    return this;
  }

  select(fieldsStr) {
    if (!fieldsStr) return this;
    const fields = fieldsStr.split(/\s+/).filter(Boolean);
    this._items = this._items.map((item) => {
      const projected = { _id: item._id };
      for (const f of fields) {
        if (item[f] !== undefined) projected[f] = item[f];
      }
      return projected;
    });
    return this;
  }

  populate(field, selectStr) {
    if (field === 'statementId') {
      const stmtMap = new Map(dbState.statements.map((s) => [String(s._id), s]));
      this._items = this._items.map((item) => {
        const stmt = stmtMap.get(String(item.statementId));
        return {
          ...item,
          statementId: stmt
            ? {
                _id: stmt._id,
                bankName: stmt.bankName,
                accountLabel: stmt.accountLabel,
                originalFileName: stmt.originalFileName,
              }
            : null,
        };
      });
    }
    return this;
  }

  // Allow awaiting query directly (thenable)
  then(resolve, reject) {
    return Promise.resolve(this._items).then(resolve, reject);
  }
}

// User Model API
export const User = {
  async findOne(query) {
    const user = dbState.users.find((u) => matchesQuery(u, query));
    if (!user) return null;
    return {
      ...user,
      comparePassword: async (candidate) => {
        const bcrypt = await import('bcryptjs');
        return (bcrypt.default || bcrypt).compare(candidate, user.passwordHash);
      },
    };
  },

  async findById(id) {
    const user = dbState.users.find((u) => String(u._id) === String(id));
    if (!user) return null;
    return { ...user };
  },

  async create(data) {
    const user = {
      _id: generateId(),
      ...data,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    dbState.users.push(user);
    saveDB();
    return user;
  },
};

// Statement Model API
export const Statement = {
  find(query = {}) {
    const matched = dbState.statements.filter((s) => matchesQuery(s, query));
    return new QueryBuilder(matched);
  },

  async findOne(query) {
    const stmt = dbState.statements.find((s) => matchesQuery(s, query));
    return stmt ? { ...stmt } : null;
  },

  async create(data) {
    const stmt = {
      _id: generateId(),
      ...data,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    dbState.statements.push(stmt);
    saveDB();
    return stmt;
  },

  async countDocuments(query = {}) {
    return dbState.statements.filter((s) => matchesQuery(s, query)).length;
  },

  async deleteOne(query) {
    const idx = dbState.statements.findIndex((s) => matchesQuery(s, query));
    if (idx !== -1) {
      dbState.statements.splice(idx, 1);
      saveDB();
      return { deletedCount: 1 };
    }
    return { deletedCount: 0 };
  },
};

// Transaction Model API
export const Transaction = {
  find(query = {}) {
    const matched = dbState.transactions.filter((t) => matchesQuery(t, query));
    return new QueryBuilder(matched);
  },

  async findOne(query) {
    const t = dbState.transactions.find((item) => matchesQuery(item, query));
    if (!t) return null;
    return {
      ...t,
      save: async function () {
        Object.assign(t, this, { updatedAt: new Date() });
        saveDB();
        return this;
      },
    };
  },

  async create(data) {
    const t = {
      _id: generateId(),
      ...data,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    dbState.transactions.push(t);
    saveDB();
    return t;
  },

  async insertMany(items = []) {
    const created = items.map((item) => ({
      _id: generateId(),
      ...item,
      createdAt: new Date(),
      updatedAt: new Date(),
    }));
    dbState.transactions.push(...created);
    saveDB();
    return created;
  },

  async countDocuments(query = {}) {
    return dbState.transactions.filter((t) => matchesQuery(t, query)).length;
  },

  async findOneAndDelete(query) {
    const idx = dbState.transactions.findIndex((t) => matchesQuery(t, query));
    if (idx !== -1) {
      const removed = dbState.transactions.splice(idx, 1)[0];
      saveDB();
      return removed;
    }
    return null;
  },

  async deleteMany(query) {
    const initialLen = dbState.transactions.length;
    dbState.transactions = dbState.transactions.filter((t) => !matchesQuery(t, query));
    const deletedCount = initialLen - dbState.transactions.length;
    if (deletedCount > 0) saveDB();
    return { deletedCount };
  },

  async updateOne(query, updates) {
    const t = dbState.transactions.find((item) => matchesQuery(item, query));
    if (t) {
      Object.assign(t, updates, { updatedAt: new Date() });
      saveDB();
      return { modifiedCount: 1 };
    }
    return { modifiedCount: 0 };
  },
};
