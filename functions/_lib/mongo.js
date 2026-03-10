import { normalizeDoc } from './utils.js';

function getConfig(env) {
  const baseUrl = env.MONGODB_DATA_API_URL;
  const apiKey = env.MONGODB_DATA_API_KEY;
  const dataSource = env.MONGODB_DATA_SOURCE || 'Cluster0';
  const database = env.MONGODB_DATA_DATABASE || env.MONGODB_DATABASE || 'alshalal-factory';

  if (!baseUrl || !apiKey) {
    throw new Error('MongoDB Data API configuration missing.');
  }

  return { baseUrl, apiKey, dataSource, database };
}

export function getCollections(env) {
  return {
    users: env.MONGODB_COLLECTION_USERS || 'users',
    employees: env.MONGODB_COLLECTION_EMPLOYEES || 'employees',
    attendance: env.MONGODB_COLLECTION_ATTENDANCE || 'attendances',
    quotations: env.MONGODB_COLLECTION_QUOTATIONS || 'quotations',
  };
}

async function mongoAction(env, action, body) {
  const { baseUrl, apiKey, dataSource, database } = getConfig(env);
  const response = await fetch(`${baseUrl}/action/${action}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'api-key': apiKey,
    },
    body: JSON.stringify({
      dataSource,
      database,
      ...body,
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`MongoDB Data API error (${response.status}): ${errorText}`);
  }

  return response.json();
}

export async function findOne(env, collection, filter, options = {}) {
  const result = await mongoAction(env, 'findOne', {
    collection,
    filter,
    ...options,
  });
  return normalizeDoc(result.document);
}

export async function findMany(env, collection, filter, options = {}) {
  const result = await mongoAction(env, 'find', {
    collection,
    filter,
    ...options,
  });
  return (result.documents || []).map(normalizeDoc);
}

export async function insertOne(env, collection, document) {
  const result = await mongoAction(env, 'insertOne', {
    collection,
    document,
  });
  return result;
}

export async function updateOne(env, collection, filter, update, options = {}) {
  const result = await mongoAction(env, 'updateOne', {
    collection,
    filter,
    update,
    ...options,
  });
  return result;
}

export async function deleteOne(env, collection, filter) {
  const result = await mongoAction(env, 'deleteOne', {
    collection,
    filter,
  });
  return result;
}

export async function deleteMany(env, collection, filter) {
  const result = await mongoAction(env, 'deleteMany', {
    collection,
    filter,
  });
  return result;
}

export async function aggregate(env, collection, pipeline) {
  const result = await mongoAction(env, 'aggregate', {
    collection,
    pipeline,
  });
  return (result.documents || []).map(normalizeDoc);
}

export async function countDocuments(env, collection, filter = {}) {
  const result = await aggregate(env, collection, [
    { $match: filter },
    { $count: 'count' },
  ]);
  return result[0]?.count || 0;
}

