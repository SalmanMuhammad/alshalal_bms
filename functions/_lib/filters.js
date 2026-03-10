import { isObjectId, toObjectId } from './utils.js';

export function buildIdFilter(id) {
  if (!isObjectId(id)) {
    return { _id: id };
  }
  return { $or: [{ _id: id }, { _id: toObjectId(id) }] };
}

export function buildEmployeeIdFilter(employeeId) {
  if (!isObjectId(employeeId)) {
    return { employeeId };
  }
  return {
    $or: [{ employeeId }, { employeeId: toObjectId(employeeId) }],
  };
}

