const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET,POST,PUT,PATCH,DELETE,OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  'Access-Control-Max-Age': '86400',
};

export function jsonResponse(data, status = 200, extraHeaders = {}) {
  const headers = {
    'Content-Type': 'application/json',
    ...CORS_HEADERS,
    ...extraHeaders,
  };
  return new Response(JSON.stringify(data), { status, headers });
}

export function textResponse(text, status = 200, extraHeaders = {}) {
  const headers = {
    'Content-Type': 'text/plain; charset=utf-8',
    ...CORS_HEADERS,
    ...extraHeaders,
  };
  return new Response(text, { status, headers });
}

export function optionsResponse() {
  return new Response(null, { status: 204, headers: CORS_HEADERS });
}

