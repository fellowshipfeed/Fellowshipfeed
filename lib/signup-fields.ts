export type SignupFieldType =
  | 'name'
  | 'email'
  | 'phone'
  | 'allergies'
  | 'shortText'
  | 'longText'
  | 'select';

export type SignupField = {
  id: string;
  type: SignupFieldType;
  label: string;
  required: boolean;
  hint?: string;
  options?: string[];
};

export type PostSignupConfig = {
  title: string;
  capacity: number | null;
  form_fields: SignupField[];
};

export const SIGNUP_PRESETS: Record<'name' | 'email' | 'phone' | 'allergies', SignupField> = {
  name: { id: 'name', type: 'name', label: 'Full name', required: true },
  email: { id: 'email', type: 'email', label: 'Email', required: true },
  phone: { id: 'phone', type: 'phone', label: 'Phone number', required: false },
  allergies: {
    id: 'allergies',
    type: 'allergies',
    label: 'Allergies or dietary restrictions',
    required: false,
    hint: 'Optional',
  },
};

export function buildSignupConfig(
  title: string,
  capacity: number | null,
  enabledPresets: Set<keyof typeof SIGNUP_PRESETS>,
  customFields: SignupField[] = [],
): PostSignupConfig {
  const form_fields: SignupField[] = [];
  for (const key of ['name', 'email', 'phone', 'allergies'] as const) {
    if (enabledPresets.has(key)) form_fields.push({ ...SIGNUP_PRESETS[key] });
  }
  form_fields.push(...customFields);
  return { title, capacity, form_fields };
}

export function parseSignupConfig(raw: unknown): PostSignupConfig | null {
  if (!raw || typeof raw !== 'object') return null;
  const obj = raw as PostSignupConfig;
  if (!obj.title || !Array.isArray(obj.form_fields)) return null;
  return obj;
}
