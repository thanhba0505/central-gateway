export type Locale = 'vi' | 'en';

export const SUPPORTED_LOCALES: readonly Locale[] = ['vi', 'en'] as const;
export const DEFAULT_LOCALE: Locale = 'vi';

export interface NavDictionary {
  overview: string;
  projects: string;
  users: string;
  cron: string;
  platforms: string;
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
  activate: string;
  deactivate: string;
  modal_register_title: string;
  field_slug: string;
  field_slug_placeholder: string;
  field_name: string;
  field_name_placeholder: string;
  field_desc: string;
  field_desc_placeholder: string;
  field_active: string;
  delete_confirm: string;
}

export interface UsersDictionary {
  badge: string;
  title: string;
  subtitle: string;
  search_placeholder: string;
  all_roles: string;
  status: string;
  role: string;
  active: string;
  inactive: string;
  created_at: string;
  no_users: string;
  no_users_desc: string;
  self_warning: string;
  update_success: string;
  update_failed: string;
  actions: string;
  save: string;
  saving: string;
  save_all: string;
  cancel: string;
  unsaved_changes: string;
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
  google_connecting: string;
  google_prompt: string;
  google_fail: string;
  google_production_notice: string;
  no_account: string;
  has_account: string;
  register_link: string;
  login_link: string;
  register_title: string;
  register_subtitle: string;
  register_btn: string;
  registering: string;
  passwords_mismatch: string;
  dev_db_test_account: string;
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

export interface CronDictionary {
  badge: string;
  title: string;
  subtitle: string;
  create_btn: string;
  sync_folders_btn: string;
  syncing_folders: string;
  configured_ok: string;
  configured_missing: string;
  folder_pattern: string;
  total_folders: string;
  total_jobs: string;
  no_jobs: string;
  no_jobs_desc: string;
  localhost_notice: string;
  field_service: string;
  field_job_key: string;
  field_title: string;
  field_path: string;
  field_method: string;
  field_preset: string;
  field_timezone: string;
  field_hours: string;
  field_minutes: string;
  field_header_key: string;
  field_header_value: string;
  field_enabled: string;
  preset_every_10m: string;
  preset_every_15m: string;
  preset_daily_20h: string;
  preset_custom: string;
  enable: string;
  pause: string;
  trigger_now: string;
  triggering: string;
  history: string;
  history_title: string;
  no_history: string;
  confirm_delete: string;
  last_trigger: string;
  modal_title: string;
  submit_create: string;
}

export interface PlatformsDictionary {
  badge: string;
  title: string;
  subtitle: string;
  add_btn: string;
  search_placeholder: string;
  no_links: string;
  no_links_desc: string;
  open_primary: string;
  copy_url: string;
  copied: string;
  edit_btn: string;
  note_label: string;
  inactive_badge: string;
  modal_create_title: string;
  modal_edit_title: string;
  field_title: string;
  field_slug: string;
  field_category: string;
  field_environment: string;
  field_url: string;
  field_secondary_url: string;
  field_secondary_label: string;
  field_description: string;
  field_account_note: string;
  field_sort_order: string;
  field_active: string;
  confirm_delete: string;
  categories: {
    all: string;
    apps: string;
    infra: string;
    source: string;
    auth_notify: string;
    ai_standup: string;
    planned: string;
  };
}

export interface TranslationDictionary {
  nav: NavDictionary;
  common: CommonDictionary;
  dashboard: DashboardDictionary;
  projects: ProjectsDictionary;
  users: UsersDictionary;
  cron: CronDictionary;
  platforms: PlatformsDictionary;
  auth: AuthDictionary;
  admin_guard: AdminGuardDictionary;
  footer: FooterDictionary;
  intro: IntroDictionary;
}
