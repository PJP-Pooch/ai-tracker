const required = (key: string): string => {
  const value = process.env[key]
  if (!value) throw new Error(`Missing required environment variable: ${key}`)
  return value
}

export const env = {
  NEXT_PUBLIC_SUPABASE_URL: required('NEXT_PUBLIC_SUPABASE_URL'),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: required('NEXT_PUBLIC_SUPABASE_ANON_KEY'),
  get SUPABASE_SERVICE_ROLE_KEY() { return required('SUPABASE_SERVICE_ROLE_KEY') },
  get DATAFORSEO_LOGIN() { return required('DATAFORSEO_LOGIN') },
  get DATAFORSEO_PASSWORD() { return required('DATAFORSEO_PASSWORD') },
  get OPENAI_API_KEY() { return required('OPENAI_API_KEY') },
  get CRON_SECRET() { return required('CRON_SECRET') },
}
