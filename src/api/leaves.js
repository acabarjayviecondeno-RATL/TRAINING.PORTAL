// Day 2: Leave / Absent API. Requests are identical to the ones ST pages made inline
// (same actions, same field names); the only addition is the session token from session.js.
import { getJson, postJson } from './client.js';

/** GET getLeaves -> { success, leaves: [...] } */
export function list(user) { return getJson('getLeaves', { user }); }

/** GET getLeaveSettings -> { success, allowEditApproved } (never cached) */
export function settings() { return getJson('getLeaveSettings', { t: Date.now() }, { cache: 'no-store' }); }

/**
 * POST saveLeave (new) or updateLeave (isEdit).
 * f = { id, planOnly, user, date, type, remarks, approverEmail, planTitle }
 */
export function submit(f, isEdit) {
  return postJson({
    action: isEdit ? 'updateLeave' : 'saveLeave',
    id: f.id, planOnly: f.planOnly, user: f.user, date: f.date, type: f.type,
    remarks: f.remarks, approverEmail: f.approverEmail, planTitle: f.planTitle,
  });
}

/** POST deleteLeave */
export function remove(f) { return postJson({ action: 'deleteLeave', user: f.user, date: f.date, type: f.type, id: f.id || '' }); }
