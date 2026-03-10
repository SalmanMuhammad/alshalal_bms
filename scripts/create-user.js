import bcrypt from 'bcryptjs';

const {
  MONGODB_DATA_API_URL,
  MONGODB_DATA_API_KEY,
  MONGODB_DATA_SOURCE = 'Cluster0',
  MONGODB_DATA_DATABASE = 'alshalal-factory',
  MONGODB_COLLECTION_USERS = 'users',
  SEED_USERNAME,
  SEED_PASSWORD,
  SEED_ROLE = 'admin',
  SEED_EMPLOYEE_ID,
} = process.env;

function requireEnv(name, value) {
  if (!value) {
    console.error(`Missing required env var: ${name}`);
    process.exit(1);
  }
}

requireEnv('MONGODB_DATA_API_URL', MONGODB_DATA_API_URL);
requireEnv('MONGODB_DATA_API_KEY', MONGODB_DATA_API_KEY);
requireEnv('SEED_USERNAME', SEED_USERNAME);
requireEnv('SEED_PASSWORD', SEED_PASSWORD);

if (!['admin', 'client'].includes(SEED_ROLE)) {
  console.error('SEED_ROLE must be "admin" or "client".');
  process.exit(1);
}

if (SEED_ROLE === 'client' && !SEED_EMPLOYEE_ID) {
  console.error('SEED_EMPLOYEE_ID is required when SEED_ROLE=client.');
  process.exit(1);
}

async function mongoAction(action, body) {
  const response = await fetch(`${MONGODB_DATA_API_URL}/action/${action}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'api-key': MONGODB_DATA_API_KEY,
    },
    body: JSON.stringify({
      dataSource: MONGODB_DATA_SOURCE,
      database: MONGODB_DATA_DATABASE,
      ...body,
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`MongoDB Data API error (${response.status}): ${errorText}`);
  }

  return response.json();
}

async function main() {
  const existing = await mongoAction('findOne', {
    collection: MONGODB_COLLECTION_USERS,
    filter: { username: SEED_USERNAME },
  });

  if (existing.document) {
    console.log(`User "${SEED_USERNAME}" already exists. No changes made.`);
    return;
  }

  const salt = bcrypt.genSaltSync(10);
  const hashed = bcrypt.hashSync(SEED_PASSWORD, salt);
  const now = new Date().toISOString();

  const userDoc = {
    username: SEED_USERNAME,
    password: hashed,
    role: SEED_ROLE,
    createdAt: now,
    updatedAt: now,
  };

  if (SEED_ROLE === 'client') {
    userDoc.employeeId = SEED_EMPLOYEE_ID;
  }

  const insertResult = await mongoAction('insertOne', {
    collection: MONGODB_COLLECTION_USERS,
    document: userDoc,
  });

  console.log(`User "${SEED_USERNAME}" created with id:`, insertResult.insertedId);
}

main().catch((error) => {
  console.error('Failed to create user:', error.message);
  process.exit(1);
});

