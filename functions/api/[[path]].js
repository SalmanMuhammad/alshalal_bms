import { jsonResponse, optionsResponse } from '../_lib/response.js';
import { parseJsonBody, getPathSegments, normalizeObjectId, isObjectId, toObjectId } from '../_lib/utils.js';
import { authenticateToken, comparePassword, generateToken, hashPassword, requireAdmin } from '../_lib/auth.js';
import { getCollections, findOne, findMany, insertOne, updateOne, deleteOne, deleteMany, countDocuments } from '../_lib/mongo.js';
import { buildIdFilter, buildEmployeeIdFilter } from '../_lib/filters.js';

function buildEmployeeIdsFilter(employeeIds) {
  if (!employeeIds.length) return { employeeId: { $in: [] } };
  const orClauses = [{ employeeId: { $in: employeeIds } }];
  const objectIds = employeeIds.filter(isObjectId).map(toObjectId);
  if (objectIds.length) {
    orClauses.push({ employeeId: { $in: objectIds } });
  }
  if (orClauses.length === 1) {
    return orClauses[0];
  }
  return { $or: orClauses };
}

async function requireAuth(request, env) {
  const auth = await authenticateToken(request, env);
  if (auth.error) {
    return { response: jsonResponse({ error: auth.error }, auth.status) };
  }
  return { user: auth.user };
}

export async function onRequest(context) {
  const { request, env } = context;

  if (request.method === 'OPTIONS') {
    return optionsResponse();
  }

  const url = new URL(request.url);
  const segments = getPathSegments(url.pathname);
  if (segments[0] !== 'api') {
    return jsonResponse({ error: 'Not found' }, 404);
  }

  const route = segments.slice(1);
  const collections = getCollections(env);

  try {
    if (!route.length) {
      return jsonResponse({ error: 'Not found' }, 404);
    }

    if (route[0] === 'health' && request.method === 'GET') {
      return jsonResponse({ status: 'OK', message: 'Server is running' });
    }

    if (route[0] === 'auth') {
      return await handleAuth(route.slice(1), request, env, collections);
    }

    if (route[0] === 'employees') {
      return await handleEmployees(route.slice(1), request, env, collections);
    }

    if (route[0] === 'attendance') {
      return await handleAttendance(route.slice(1), request, env, collections);
    }

    if (route[0] === 'quotations') {
      return await handleQuotations(route.slice(1), request, env, collections);
    }

    return jsonResponse({ error: 'Not found' }, 404);
  } catch (error) {
    console.error('API error:', error);
    return jsonResponse({ error: error.message || 'Internal server error' }, 500);
  }
}

async function handleAuth(route, request, env, collections) {
  const action = route[0];
  const body = await parseJsonBody(request);

  if (action === 'register' && request.method === 'POST') {
    let requireAdminAuth = false;
    try {
      const userCount = await countDocuments(env, collections.users);
      if (userCount > 0) requireAdminAuth = true;
    } catch (error) {
      console.log('User count check failed, allowing registration for initial setup');
    }

    if (requireAdminAuth) {
      const authResult = await requireAuth(request, env);
      if (authResult.response) return authResult.response;
      const adminError = requireAdmin(authResult.user);
      if (adminError) return jsonResponse({ error: adminError.error }, adminError.status);
    }

    const { username, password, role, employeeId } = body || {};
    if (!username || !password || !role) {
      return jsonResponse({ error: 'Username, password, and role are required' }, 400);
    }

    if (role === 'client' && !employeeId) {
      return jsonResponse({ error: 'Employee ID is required for client role' }, 400);
    }

    const existingUser = await findOne(env, collections.users, { username });
    if (existingUser) {
      return jsonResponse({ error: 'Username already exists. Please choose a different username.' }, 400);
    }

    let employeeIdString = null;
    if (role === 'client') {
      const employee = await findOne(env, collections.employees, buildIdFilter(employeeId));
      if (!employee) {
        return jsonResponse({ error: 'Employee not found' }, 404);
      }
      employeeIdString = employee._id;
      const existingEmployeeUser = await findOne(env, collections.users, {
        role: 'client',
        ...buildEmployeeIdFilter(employeeIdString),
      });
      if (existingEmployeeUser) {
        return jsonResponse({ error: 'This employee already has a registered user account.' }, 400);
      }
    }

    const now = new Date().toISOString();
    const userDoc = {
      username,
      password: hashPassword(password),
      role,
      employeeId: role === 'client' ? employeeIdString : undefined,
      createdAt: now,
      updatedAt: now,
    };

    const insertResult = await insertOne(env, collections.users, userDoc);
    const insertedId = normalizeObjectId(insertResult.insertedId);
    const token = await generateToken(
      {
        _id: insertedId,
        username,
        role,
        employeeId: userDoc.employeeId,
      },
      env,
    );

    return jsonResponse(
      {
        message: 'User registered successfully',
        token,
        user: {
          id: insertedId,
          username,
          role,
          employeeId: userDoc.employeeId || null,
        },
      },
      201,
    );
  }

  if (action === 'login' && request.method === 'POST') {
    const { username, password } = body || {};
    if (!username || !password) {
      return jsonResponse({ error: 'Username and password are required' }, 400);
    }

    const user = await findOne(env, collections.users, { username });
    if (!user) {
      return jsonResponse({ error: 'Invalid username or password' }, 401);
    }

    const isPasswordValid = comparePassword(password, user.password);
    if (!isPasswordValid) {
      return jsonResponse({ error: 'Invalid username or password' }, 401);
    }

    let employee = null;
    let employeeIdString = user.employeeId || null;
    if (employeeIdString) {
      employee = await findOne(env, collections.employees, buildIdFilter(employeeIdString));
      if (!employee) {
        employeeIdString = null;
      }
    }

    const token = await generateToken(
      {
        _id: user._id,
        username: user.username,
        role: user.role,
        employeeId: employeeIdString,
      },
      env,
    );

    return jsonResponse({
      message: 'Login successful',
      token,
      user: {
        id: user._id,
        username: user.username,
        role: user.role,
        employeeId: employeeIdString,
        employee: employee
          ? {
              id: employee._id,
              name: employee.name,
              position: employee.position,
            }
          : null,
      },
    });
  }

  if (action === 'me' && request.method === 'GET') {
    const authResult = await requireAuth(request, env);
    if (authResult.response) return authResult.response;

    const user = await findOne(env, collections.users, buildIdFilter(authResult.user.userId));
    if (!user) {
      return jsonResponse({ error: 'User not found' }, 404);
    }

    let employee = null;
    let employeeIdString = user.employeeId || null;
    if (employeeIdString) {
      employee = await findOne(env, collections.employees, buildIdFilter(employeeIdString));
      if (!employee) {
        employeeIdString = null;
      }
    }

    return jsonResponse({
      id: user._id,
      username: user.username,
      role: user.role,
      employeeId: employeeIdString,
      employee: employee
        ? {
            id: employee._id,
            name: employee.name,
            position: employee.position,
          }
        : null,
    });
  }

  if (action === 'reset-password' && request.method === 'POST') {
    const authResult = await requireAuth(request, env);
    if (authResult.response) return authResult.response;
    const adminError = requireAdmin(authResult.user);
    if (adminError) return jsonResponse({ error: adminError.error }, adminError.status);

    const { username, newPassword } = body || {};
    if (!username || !newPassword) {
      return jsonResponse({ error: 'Username and new password are required' }, 400);
    }

    const targetUser = await findOne(env, collections.users, { username });
    if (!targetUser) {
      return jsonResponse({ error: 'User not found' }, 404);
    }

    await updateOne(
      env,
      collections.users,
      buildIdFilter(targetUser._id),
      {
        $set: {
          password: hashPassword(newPassword),
          updatedAt: new Date().toISOString(),
        },
      },
    );

    return jsonResponse({ message: 'Password reset successfully' });
  }

  return jsonResponse({ error: 'Not found' }, 404);
}

async function handleEmployees(route, request, env, collections) {
  const authResult = await requireAuth(request, env);
  if (authResult.response) return authResult.response;
  const adminError = requireAdmin(authResult.user);
  if (adminError) return jsonResponse({ error: adminError.error }, adminError.status);

  if (route.length === 0 && request.method === 'GET') {
    const employees = await findMany(env, collections.employees, {}, { sort: { createdAt: 1 } });
    return jsonResponse(employees);
  }

  if (route.length === 1 && request.method === 'GET') {
    const employee = await findOne(env, collections.employees, buildIdFilter(route[0]));
    if (!employee) {
      return jsonResponse({ error: 'Employee not found' }, 404);
    }
    return jsonResponse(employee);
  }

  if (route.length === 0 && request.method === 'POST') {
    const body = await parseJsonBody(request);
    if (!body?.name) {
      return jsonResponse({ error: 'Name is required' }, 400);
    }
    const now = new Date().toISOString();
    const employeeDoc = {
      name: body.name,
      position: body.position || 'Labor',
      createdAt: now,
      updatedAt: now,
    };
    const insertResult = await insertOne(env, collections.employees, employeeDoc);
    return jsonResponse(
      {
        ...employeeDoc,
        _id: normalizeObjectId(insertResult.insertedId),
      },
      201,
    );
  }

  if (route.length === 1 && request.method === 'PUT') {
    const body = await parseJsonBody(request);
    const updateResult = await updateOne(
      env,
      collections.employees,
      buildIdFilter(route[0]),
      {
        $set: {
          name: body?.name,
          position: body?.position,
          updatedAt: new Date().toISOString(),
        },
      },
    );
    if (!updateResult.matchedCount) {
      return jsonResponse({ error: 'Employee not found' }, 404);
    }
    const employee = await findOne(env, collections.employees, buildIdFilter(route[0]));
    return jsonResponse(employee);
  }

  if (route.length === 1 && request.method === 'DELETE') {
    const employeeId = route[0];
    await deleteMany(env, collections.attendance, buildEmployeeIdFilter(employeeId));
    const deleteResult = await deleteOne(env, collections.employees, buildIdFilter(employeeId));
    if (!deleteResult.deletedCount) {
      return jsonResponse({ error: 'Employee not found' }, 404);
    }
    return jsonResponse({ message: 'Employee and all attendance records deleted successfully' });
  }

  return jsonResponse({ error: 'Not found' }, 404);
}

async function handleQuotations(route, request, env, collections) {
  const authResult = await requireAuth(request, env);
  if (authResult.response) return authResult.response;
  const adminError = requireAdmin(authResult.user);
  if (adminError) return jsonResponse({ error: adminError.error }, adminError.status);

  if (route.length === 0 && request.method === 'GET') {
    const quotations = await findMany(env, collections.quotations, {}, {
      sort: { createdAt: -1 },
      projection: {
        documentNumber: 1,
        quotationDate: 1,
        client: 1,
        createdAt: 1,
        updatedAt: 1,
      },
    });
    return jsonResponse(quotations);
  }

  if (route.length === 1 && request.method === 'GET') {
    const quotation = await findOne(env, collections.quotations, buildIdFilter(route[0]));
    if (!quotation) {
      return jsonResponse({ error: 'Quotation not found' }, 404);
    }
    return jsonResponse(quotation);
  }

  if (route.length === 0 && request.method === 'POST') {
    const body = await parseJsonBody(request);
    if (!body?.documentNumber || !body?.quotationDate) {
      return jsonResponse({ error: 'Document number and date are required' }, 400);
    }
    const now = new Date().toISOString();
    const quotationDoc = {
      ...body,
      createdAt: now,
      updatedAt: now,
    };
    const insertResult = await insertOne(env, collections.quotations, quotationDoc);
    return jsonResponse(
      {
        ...quotationDoc,
        _id: normalizeObjectId(insertResult.insertedId),
      },
      201,
    );
  }

  if (route.length === 1 && request.method === 'PUT') {
    const body = await parseJsonBody(request);
    if (!body) {
      return jsonResponse({ error: 'Invalid payload' }, 400);
    }
    const updateDoc = { ...body };
    delete updateDoc._id;
    const updateResult = await updateOne(
      env,
      collections.quotations,
      buildIdFilter(route[0]),
      {
        $set: {
          ...updateDoc,
          updatedAt: new Date().toISOString(),
        },
      },
    );
    if (!updateResult.matchedCount) {
      return jsonResponse({ error: 'Quotation not found' }, 404);
    }
    const quotation = await findOne(env, collections.quotations, buildIdFilter(route[0]));
    return jsonResponse(quotation);
  }

  if (route.length === 1 && request.method === 'DELETE') {
    const deleteResult = await deleteOne(env, collections.quotations, buildIdFilter(route[0]));
    if (!deleteResult.deletedCount) {
      return jsonResponse({ error: 'Quotation not found' }, 404);
    }
    return jsonResponse({ message: 'Quotation deleted successfully' });
  }

  return jsonResponse({ error: 'Not found' }, 404);
}

async function handleAttendance(route, request, env, collections) {
  const authResult = await requireAuth(request, env);
  if (authResult.response) return authResult.response;
  const user = authResult.user;

  if (route.length === 2 && request.method === 'GET') {
    const monthNum = Number.parseInt(route[0], 10);
    const yearNum = Number.parseInt(route[1], 10);

    if (!monthNum || !yearNum) {
      return jsonResponse({ error: 'Invalid month or year' }, 400);
    }

    let employeeFilter = {};
    if (user.role === 'client' && user.employeeId) {
      employeeFilter = buildIdFilter(user.employeeId);
    } else if (user.role === 'client') {
      return jsonResponse({ error: 'Invalid employee ID. Please contact administrator.' }, 400);
    }

    const employees = await findMany(env, collections.employees, employeeFilter, { sort: { createdAt: 1 } });
    const attendanceRecords = await findMany(env, collections.attendance, {
      month: monthNum,
      year: yearNum,
    });

    const employeeIds = employees.map((emp) => emp._id).filter(Boolean);
    let users = [];
    if (employeeIds.length) {
      users = await findMany(env, collections.users, {
        role: 'client',
        ...buildEmployeeIdsFilter(employeeIds),
      }, { projection: { username: 1, employeeId: 1 } });
    }

    const userMap = {};
    users.forEach((account) => {
      const empId = normalizeObjectId(account.employeeId);
      if (empId) {
        userMap[empId] = {
          username: account.username,
          hasUser: true,
        };
      }
    });

    const attendanceMap = {};
    attendanceRecords.forEach((record) => {
      const empId = normalizeObjectId(record.employeeId);
      if (empId) {
        attendanceMap[empId] = record;
      }
    });

    const attendanceData = employees.map((emp) => {
      const attendanceRecord = attendanceMap[emp._id];
      const userInfo = userMap[emp._id];
      const overtimeObj = attendanceRecord?.overtime && typeof attendanceRecord.overtime === 'object'
        ? attendanceRecord.overtime
        : {};

      return {
        id: emp._id,
        name: emp.name || '',
        position: emp.position || 'Labor',
        hasUser: !!userInfo,
        username: userInfo?.username || null,
        salaryType: attendanceRecord?.salaryType || null,
        basicSalary: attendanceRecord?.basicSalary ?? null,
        pendingSalary: attendanceRecord?.pendingSalary || 0,
        bonus: attendanceRecord?.bonus || 0,
        fine: attendanceRecord?.fine || 0,
        paidAmount: attendanceRecord?.paidAmount || 0,
        notes: attendanceRecord?.notes || '',
        attendance: Array.isArray(attendanceRecord?.attendance) ? attendanceRecord.attendance : [],
        overtime: overtimeObj,
        transferredPending: attendanceRecord?.transferredPending ?? null,
      };
    });

    return jsonResponse(attendanceData);
  }

  if (route.length === 2 && request.method === 'POST') {
    const monthNum = Number.parseInt(route[0], 10);
    const yearNum = Number.parseInt(route[1], 10);
    const body = await parseJsonBody(request);
    const employees = body?.employees || [];

    if (!monthNum || !yearNum) {
      return jsonResponse({ error: 'Invalid month or year' }, 400);
    }

    let employeesToSave = employees;
    if (user.role === 'client' && user.employeeId) {
      employeesToSave = employees.filter((emp) => emp.id === user.employeeId);
      if (!employeesToSave.length) {
        return jsonResponse({ error: 'You can only update your own attendance' }, 403);
      }
    }

    const now = new Date().toISOString();

    const updatePromises = employeesToSave.map(async (empData) => {
      if (user.role === 'client' && user.employeeId && empData.id !== user.employeeId) {
        throw new Error('You can only update your own attendance');
      }

      const employee = await findOne(env, collections.employees, buildIdFilter(empData.id));
      if (!employee) {
        throw new Error(`Employee ${empData.id} not found`);
      }

      await updateOne(
        env,
        collections.employees,
        buildIdFilter(empData.id),
        {
          $set: {
            name: empData.name,
            position: empData.position,
            updatedAt: now,
          },
        },
      );

      const overtimeObj = {};
      if (empData.overtime) {
        Object.entries(empData.overtime).forEach(([day, hours]) => {
          const parsedHours = Number.parseFloat(hours);
          if (!Number.isNaN(parsedHours) && parsedHours > 0) {
            overtimeObj[day] = parsedHours;
          }
        });
      }

      const attendanceFilter = {
        month: monthNum,
        year: yearNum,
        ...buildEmployeeIdFilter(empData.id),
      };
      const existingRecord = await findOne(env, collections.attendance, attendanceFilter);
      const attendanceDoc = {
        employeeId: empData.id,
        month: monthNum,
        year: yearNum,
        salaryType: empData.salaryType,
        basicSalary: empData.basicSalary,
        pendingSalary: empData.pendingSalary,
        bonus: empData.bonus,
        fine: empData.fine,
        paidAmount: empData.paidAmount || 0,
        attendance: empData.attendance || [],
        overtime: overtimeObj,
        transferredPending: empData.transferredPending ?? null,
        notes: empData.notes || '',
        updatedAt: now,
      };

      if (existingRecord) {
        await updateOne(
          env,
          collections.attendance,
          attendanceFilter,
          {
            $set: attendanceDoc,
          },
        );
      } else {
        await insertOne(env, collections.attendance, {
          ...attendanceDoc,
          createdAt: now,
        });
      }
    });

    await Promise.all(updatePromises);
    return jsonResponse({ message: 'Attendance saved successfully' });
  }

  if (route.length === 4 && request.method === 'PATCH') {
    const [employeeId, monthStr, yearStr, dayIndexStr] = route;
    const monthNum = Number.parseInt(monthStr, 10);
    const yearNum = Number.parseInt(yearStr, 10);
    const dayIdx = Number.parseInt(dayIndexStr, 10);
    const body = await parseJsonBody(request);

    if (!monthNum || !yearNum || Number.isNaN(dayIdx)) {
      return jsonResponse({ error: 'Invalid parameters' }, 400);
    }

    if (user.role === 'client' && user.employeeId && user.employeeId !== employeeId) {
      return jsonResponse({ error: 'You can only update your own attendance' }, 403);
    }

    const employee = await findOne(env, collections.employees, buildIdFilter(employeeId));
    if (!employee) {
      return jsonResponse({ error: 'Employee not found' }, 404);
    }

    const attendanceFilter = {
      month: monthNum,
      year: yearNum,
      ...buildEmployeeIdFilter(employeeId),
    };
    const existingRecord = await findOne(env, collections.attendance, attendanceFilter);
    const now = new Date().toISOString();
    let attendanceArray = Array.isArray(existingRecord?.attendance) ? [...existingRecord.attendance] : [];
    while (attendanceArray.length <= dayIdx) {
      attendanceArray.push(null);
    }

    if (body?.status !== undefined) {
      attendanceArray[dayIdx] = body.status;
    }

    const overtimeObj = existingRecord?.overtime && typeof existingRecord.overtime === 'object'
      ? { ...existingRecord.overtime }
      : {};

    if (body?.overtime !== undefined) {
      const parsedOvertime = Number.parseFloat(body.overtime);
      if (!Number.isNaN(parsedOvertime) && parsedOvertime > 0) {
        overtimeObj[dayIndexStr] = parsedOvertime;
      } else {
        delete overtimeObj[dayIndexStr];
      }
    }

    const attendanceDoc = {
      employeeId,
      month: monthNum,
      year: yearNum,
      attendance: attendanceArray,
      overtime: overtimeObj,
      updatedAt: now,
    };

    if (existingRecord) {
      await updateOne(env, collections.attendance, attendanceFilter, { $set: attendanceDoc });
    } else {
      await insertOne(env, collections.attendance, {
        ...attendanceDoc,
        createdAt: now,
      });
    }

    return jsonResponse({ message: 'Attendance updated successfully' });
  }

  return jsonResponse({ error: 'Not found' }, 404);
}

