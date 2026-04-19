import { isConfigured, supabase } from './supabase';

/**
 * Fetch the latest metric snapshot for the selected project from Supabase.
 * Returns null if Supabase is not configured or no data found (caller uses mock).
 */
export async function fetchProjectMetrics(source: string): Promise<Record<string, unknown> | null> {
  if (!isConfigured || !supabase) return null;

  const slug =
    (typeof localStorage !== 'undefined' ? localStorage.getItem('growthhq-project') : null) ||
    'demo-enterprise';
  if (!slug) return null;

  // Resolve project id
  const projectResp = await supabase.from('projects').select('id').eq('slug', slug).single();

  if (projectResp.error || !projectResp.data) return null;
  const projectId = projectResp.data.id;

  const { data, error } = await supabase
    .from('metric_snapshots')
    .select('data')
    .eq('source', source)
    .eq('project_id', projectId)
    .order('fetched_at', { ascending: false })
    .limit(1)
    .single();

  if (error || !data) return null;
  return data.data as Record<string, unknown>;
}

/**
 * Fetch all active projects from Supabase.
 * Returns empty array if Supabase is not configured.
 */
export async function fetchProjects(): Promise<Array<{ id: number; name: string; slug: string }>> {
  if (!isConfigured || !supabase) return [];

  const { data, error } = await supabase
    .from('projects')
    .select('id, name, slug')
    .eq('is_active', true)
    .order('name');

  return error ? [] : (data ?? []);
}
