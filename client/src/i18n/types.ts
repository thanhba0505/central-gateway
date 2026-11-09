export type Locale = 'vi' | 'en';

export const SUPPORTED_LOCALES: readonly Locale[] = ['vi', 'en'] as const;
export const DEFAULT_LOCALE: Locale = 'vi';

export interface NavDictionary {
  overview: string;
  projects: string;
  logs: string;
  login: string;
  logout: string;
  role: string;
  profile: string;
}

export interface CommonDictionary {
  loading: string;
  refresh: string;
  refreshing: string;
  active: string;
  disabled: string;
  cancel: string;
  save: string;
  saving: string;
  delete: string;
  edit: string;
  actions: string;
  close: string;
  search: string;
  all: string;
  or: string;
  success: string;
  error: string;
  language: string;
  vietnamese: string;
  english: string;
}

export interface DashboardDictionary {
  title: string;
  subtitle: string;
  registered_apps: string;
  active_in_ecosystem: string;
  manage: string;
  slack_channels: string;
  routed_across: string;
  total_dispatches: string;
  success_rate: string;
  database_engine: string;
  serverless_pool: string;
  connected_apps: string;
  view_all: string;
  loading_projects: string;
  no_projects: string;
  ecosystem_service: string;
  events_count: string;
  view_audit_logs: string;
  topology_title: string;
  topology_desc: string;
  sso_protocol: string;
  backend_api: string;
  notification: string;
  recent_dispatches: string;
  all_logs: string;
  streaming_activity: string;
  no_dispatches: string;
  provider: string;
  logs: string;
}

export interface ProjectsDictionary {
  badge: string;
  title: string;
  subtitle: string;
  register_btn: string;
  loading: string;
  no_projects: string;
  no_projects_desc: string;
  events_recorded: string;
  view_logs: string;
  add_channel: string;
  no_channels: string;
  col_event_type: string;
  col_channel_name: string;
  col_channel_id: string;
  col_provider: string;
  col_actions: string;
  activate: string;
  deactivate: string;
  edit_channel: string;
  delete_channel: string;
  modal_register_title: string;
  field_slug: string;
  field_slug_placeholder: string;
  field_name: string;
  field_name_placeholder: string;
  field_desc: string;
  field_desc_placeholder: string;
  field_active: string;
  modal_channel_title: string;
  field_event_type: string;
  field_channel_id: string;
  field_channel_id_desc: string;
  field_channel_name: string;
  save_mapping: string;
  delete_confirm: string;
}

export interface LogsDictionary {
  badge: string;
  title: string;
  subtitle: string;
  refresh_logs: string;
  total_dispatches: string;
  successful: string;
  failures: string;
  success_rate: string;
  failed: string;
  filters: string;
  all_projects: string;
  all_events: string;
  clear_filters: string;
  filter_project: string;
  filter_status: string;
  filter_event: string;
  search_placeholder: string;
  col_timestamp: string;
  col_project: string;
  col_event_type: string;
  col_provider: string;
  col_channel: string;
  col_status: string;
  col_actions: string;
  inspect_btn: string;
  modal_title: string;
  modal_project: string;
  modal_event_scope: string;
  modal_provider: string;
  modal_dispatched_at: string;
  modal_payload_title: string;
  modal_response_title: string;
  close_inspector: string;
  tab_payload: string;
  tab_response: string;
  tab_metadata: string;
  loading: string;
  no_logs: string;
}

export interface AuthDictionary {
  title: string;
  subtitle_admin: string;
  subtitle_sso: string;
  sso_scope_banner: string;
  no_admin_role: string;
  no_admin_role_desc: string;
  logout_account: string;
  field_username_email: string;
  field_username: string;
  field_email: string;
  field_password: string;
  field_confirm_password: string;
  remember_me: string;
  forgot_password: string;
  forgot_password_contact: string;
  sign_in_btn: string;
  signing_in: string;
  google_btn: string;
  google_prompt: string;
  google_fail: string;
  no_account: string;
  has_account: string;
  register_link: string;
  login_link: string;
  register_title: string;
  register_subtitle: string;
  register_btn: string;
  registering: string;
  passwords_mismatch: string;
}

export interface AdminGuardDictionary {
  authenticating: string;
  redirecting: string;
  required_admin_badge: string;
  restricted_title: string;
  restricted_desc: string;
  account_label: string;
  email_label: string;
  not_linked: string;
  role_label: string;
  switch_account_btn: string;
  back_to_wonderlab: string;
}

export interface FooterDictionary {
  console_title: string;
}

export interface IntroDictionary {
  tagline: string;
}

export interface TranslationDictionary {
  nav: NavDictionary;
  common: CommonDictionary;
  dashboard: DashboardDictionary;
  projects: ProjectsDictionary;
  logs: LogsDictionary;
  auth: AuthDictionary;
  admin_guard: AdminGuardDictionary;
  footer: FooterDictionary;
  intro: IntroDictionary;
}
