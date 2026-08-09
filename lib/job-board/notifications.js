export async function ensureNotificationPreferences(service, userId) {
  const { data, error } = await service
    .from('job_board_notification_preferences')
    .select('*')
    .eq('user_id', userId)
    .maybeSingle();
  if (error) throw error;
  if (data) return data;

  const { data: created, error: createError } = await service
    .from('job_board_notification_preferences')
    .insert({ user_id: userId })
    .select('*')
    .single();
  if (createError) throw createError;
  return created;
}

export async function createInAppNotification(service, { userId, jobId, recommendationId, type, title, message, metadata }) {
  const prefs = await ensureNotificationPreferences(service, userId);
  if (!prefs.in_app_enabled) {
    return null;
  }

  const { data, error } = await service
    .from('job_board_notifications')
    .insert({
      user_id: userId,
      job_id: jobId || null,
      recommendation_id: recommendationId || null,
      type,
      title,
      message,
      status: 'in_app_delivered',
      metadata: metadata || {},
    })
    .select('*')
    .single();
  if (error) throw error;

  await service.from('job_board_notification_logs').insert({
    user_id: userId,
    job_id: jobId || null,
    notification_id: data.id,
    channel: 'email',
    type,
    status: 'email_skipped',
    subject: title,
    metadata: { reason: 'Email delivery deferred to Netlify Functions phase', ...(metadata || {}) },
  });

  return data;
}

export async function generateDigestNotifications(service, { limit = 5 } = {}) {
  const { data: users, error: usersError } = await service
    .from('member_profiles')
    .select('user_id')
    .not('user_id', 'is', null);
  if (usersError) throw usersError;

  let generated = 0;
  for (const user of users || []) {
    const prefs = await ensureNotificationPreferences(service, user.user_id);
    if (prefs.digest_frequency === 'none') continue;

    const { data: recs, error: recError } = await service
      .from('job_board_recommendations')
      .select('id, job_id, score, job_board_jobs ( title, company )')
      .eq('user_id', user.user_id)
      .eq('status', 'active')
      .order('score', { ascending: false })
      .limit(limit);
    if (recError) throw recError;
    if (!recs?.length) continue;

    await createInAppNotification(service, {
      userId: user.user_id,
      type: 'digest',
      title: `${recs.length} recommended jobs are ready`,
      message: recs.map((rec) => `${rec.job_board_jobs?.company}: ${rec.job_board_jobs?.title}`).join('; '),
      metadata: { recommendation_ids: recs.map((rec) => rec.id), email_status: 'email_pending' },
    });
    generated += 1;
  }

  return { users: (users || []).length, generated };
}

export async function notifyRecommendations(service, userId) {
  const { data, error } = await service
    .from('job_board_recommendations')
    .select('id, job_id, score, explanation, job_board_jobs ( title, company )')
    .eq('user_id', userId)
    .eq('status', 'active')
    .order('score', { ascending: false })
    .limit(3);
  if (error) throw error;

  let generated = 0;
  for (const rec of data || []) {
    await createInAppNotification(service, {
      userId,
      jobId: rec.job_id,
      recommendationId: rec.id,
      type: 'recommendation',
      title: `Recommended: ${rec.job_board_jobs?.title || 'Job'}`,
      message: rec.explanation || `${rec.job_board_jobs?.company || 'A company'} may match your profile.`,
      metadata: { score: rec.score },
    });
    generated += 1;
  }

  return { generated };
}
