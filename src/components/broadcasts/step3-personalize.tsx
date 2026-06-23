'use client';

import { useEffect, useMemo, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Contact, CustomField, MessageTemplate } from '@/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { ArrowLeft, ArrowRight, Eye, Loader2, FileText } from 'lucide-react';

type VariableType = 'static' | 'field' | 'custom_field';

interface VariableMapping {
  type: VariableType;
  value: string;
}

interface Step3Props {
  template: MessageTemplate;
  variables: Record<string, VariableMapping>;
  onUpdate: (variables: Record<string, VariableMapping>) => void;
  onNext: () => void;
  onBack: () => void;
}

const contactFields = [
  { value: 'name', label: 'Contact Name' },
  { value: 'phone', label: 'Phone Number' },
  { value: 'email', label: 'Email Address' },
  { value: 'company', label: 'Company' },
];

const SAMPLE_CONTACT: Contact = {
  id: 'sample',
  user_id: '',
  name: 'John Doe',
  phone: '+1234567890',
  email: 'john@example.com',
  company: 'Acme Corp',
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
};

export function Step3Personalize({
  template,
  variables,
  onUpdate,
  onNext,
  onBack,
}: Step3Props) {
  const [customFields, setCustomFields] = useState<CustomField[]>([]);
  const [loadingFields, setLoadingFields] = useState(true);
  const [firstContact, setFirstContact] = useState<Contact | null>(null);
  const [firstContactCustomValues, setFirstContactCustomValues] = useState<
    Map<string, string>
  >(new Map());
  const [loadingPreview, setLoadingPreview] = useState(true);

  // Load user's custom fields + a representative contact for the
  // live preview. Fall back to sample data if no contacts exist yet.
  useEffect(() => {
    let cancelled = false;
    (async () => {
      const supabase = createClient();
      const [fieldsRes, contactRes] = await Promise.all([
        supabase.from('custom_fields').select('*').order('field_name'),
        supabase
          .from('contacts')
          .select('*')
          .order('created_at', { ascending: false })
          .limit(1)
          .maybeSingle(),
      ]);
      if (cancelled) return;

      setCustomFields(fieldsRes.data ?? []);
      setLoadingFields(false);

      const contact = contactRes.data ?? null;
      setFirstContact(contact);

      if (contact) {
        const { data: customVals } = await supabase
          .from('contact_custom_values')
          .select('custom_field_id, value')
          .eq('contact_id', contact.id);
        if (!cancelled) {
          const map = new Map<string, string>();
          for (const row of customVals ?? []) {
            map.set(row.custom_field_id, row.value ?? '');
          }
          setFirstContactCustomValues(map);
        }
      }
      setLoadingPreview(false);
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const headerPlaceholders = useMemo(() => {
    if (template.header_type !== 'text' || !template.header_content) return [];
    const matches = template.header_content.match(/\{\{(\d+)\}\}/g);
    if (!matches) return [];
    return [...new Set(matches)].sort();
  }, [template.header_type, template.header_content]);

  const bodyPlaceholders = useMemo(() => {
    const matches = template.body_text.match(/\{\{(\d+)\}\}/g);
    if (!matches) return [];
    return [...new Set(matches)].sort((a, b) => {
      return Number(a.replace(/^\{\{|\}\}$/g, '')) - Number(b.replace(/^\{\{|\}\}$/g, ''));
    });
  }, [template.body_text]);

  const buttonPlaceholders = useMemo(() => {
    if (!template.buttons || !Array.isArray(template.buttons)) return [];
    const list: { buttonIndex: number; buttonText: string; placeholder: string }[] = [];
    (template.buttons as any[]).forEach((btn: any, buttonIndex: number) => {
      if (btn.type === 'URL' && btn.url) {
        const matches = btn.url.match(/\{\{(\d+)\}\}/g);
        if (matches) {
          const uniqueMatches = Array.from(new Set(matches)) as string[];
          uniqueMatches.forEach((m) => {
            list.push({
              buttonIndex,
              buttonText: (btn.text as string) || 'Button',
              placeholder: m,
            });
          });
        }
      }
    });
    return list;
  }, [template.buttons]);

  const hasAnyPlaceholders =
    headerPlaceholders.length > 0 ||
    bodyPlaceholders.length > 0 ||
    buttonPlaceholders.length > 0;

  const unmappedKeys = useMemo(() => {
    const missing: string[] = [];
    
    for (const p of headerPlaceholders) {
      const num = p.replace(/^\{\{|\}\}$/g, '');
      const key = `header_${num}`;
      const mapping = variables[key];
      if (!mapping || !mapping.value?.trim()) missing.push(`Header ${p}`);
    }

    for (const p of bodyPlaceholders) {
      const num = p.replace(/^\{\{|\}\}$/g, '');
      const key = `body_${num}`;
      const mapping = variables[key] ?? variables[num]; 
      if (!mapping || !mapping.value?.trim()) missing.push(`Body ${p}`);
    }

    for (const btn of buttonPlaceholders) {
      const num = btn.placeholder.replace(/^\{\{|\}\}$/g, '');
      const key = `button_${btn.buttonIndex}_${num}`;
      const mapping = variables[key];
      if (!mapping || !mapping.value?.trim()) {
        missing.push(`Button "${btn.buttonText}" ${btn.placeholder}`);
      }
    }

    return missing;
  }, [headerPlaceholders, bodyPlaceholders, buttonPlaceholders, variables]);

  function updateVariable(key: string, patch: Partial<VariableMapping>) {
    const current = variables[key] ?? { type: 'static' as VariableType, value: '' };
    onUpdate({
      ...variables,
      [key]: { ...current, ...patch },
    });
  }

  function resolveMappingValue(
    mapping: VariableMapping | undefined,
    contact: Contact,
    customValues: Map<string, string>,
  ): string {
    if (!mapping) return '';
    if (mapping.type === 'static') return mapping.value;
    if (mapping.type === 'field') {
      const fieldMap: Record<string, string | undefined> = {
        name: contact.name,
        phone: contact.phone,
        email: contact.email,
        company: contact.company,
      };
      return fieldMap[mapping.value] ?? '';
    }
    if (mapping.type === 'custom_field') {
      return customValues.get(mapping.value) ?? '';
    }
    return '';
  }

  const previewText = useMemo(() => {
    const contact = firstContact ?? SAMPLE_CONTACT;
    const customValues = firstContact
      ? firstContactCustomValues
      : new Map<string, string>();

    let text = template.body_text;
    for (const placeholder of bodyPlaceholders) {
      const num = placeholder.replace(/^\{\{|\}\}$/g, '');
      const key = `body_${num}`;
      const mapping = variables[key] ?? variables[num]; 
      const replacement = resolveMappingValue(mapping, contact, customValues) || placeholder;
      text = text.replaceAll(placeholder, replacement);
    }
    return text;
  }, [template.body_text, bodyPlaceholders, variables, firstContact, firstContactCustomValues]);

  const previewHeaderText = useMemo(() => {
    if (template.header_type !== 'text' || !template.header_content) return null;
    const contact = firstContact ?? SAMPLE_CONTACT;
    const customValues = firstContact
      ? firstContactCustomValues
      : new Map<string, string>();

    let text = template.header_content;
    for (const placeholder of headerPlaceholders) {
      const num = placeholder.replace(/^\{\{|\}\}$/g, '');
      const key = `header_${num}`;
      const mapping = variables[key];
      const replacement = resolveMappingValue(mapping, contact, customValues) || placeholder;
      text = text.replaceAll(placeholder, replacement);
    }
    return text;
  }, [template.header_type, template.header_content, headerPlaceholders, variables, firstContact, firstContactCustomValues]);

  const previewLabel = firstContact
    ? firstContact.name || firstContact.phone
    : 'sample data';

  function renderPlaceholderRow(placeholder: string, key: string, labelPrefix?: string) {
    const mapping = variables[key] ?? { type: 'static', value: '' };

    return (
      <div
        key={key}
        className="rounded-xl border border-slate-800 bg-slate-900/50 p-4"
      >
        <div className="mb-3 flex items-center gap-2">
          <span className="inline-flex items-center rounded-md bg-primary/10 px-2 py-0.5 text-xs font-mono font-medium text-primary">
            {placeholder}
          </span>
          {labelPrefix && (
            <span className="text-xs text-slate-400 font-medium">{labelPrefix}</span>
          )}
        </div>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div>
            <label className="mb-1.5 block text-xs font-medium text-slate-400">
              Mapping Type
            </label>
            <Select
              value={mapping.type}
              onValueChange={(val) =>
                updateVariable(key, {
                  type: val as VariableType,
                  value: '',
                })
              }
            >
              <SelectTrigger className="w-full border-slate-700 bg-slate-800 text-white">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="border-slate-700 bg-slate-800">
                <SelectItem value="static">Static Value</SelectItem>
                <SelectItem value="field">Contact Field</SelectItem>
                <SelectItem value="custom_field">
                  Custom Field
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <label className="mb-1.5 block text-xs font-medium text-slate-400">
              {mapping.type === 'static' ? 'Value' : 'Field'}
            </label>
            {mapping.type === 'static' ? (
              <Input
                value={mapping.value}
                onChange={(e) =>
                  updateVariable(key, { value: e.target.value })
                }
                placeholder="Enter value..."
                className="border-slate-700 bg-slate-800 text-white placeholder:text-slate-500"
              />
            ) : mapping.type === 'field' ? (
              <Select
                value={mapping.value || undefined}
                onValueChange={(val) =>
                  updateVariable(key, { value: val || '' })
                }
              >
                <SelectTrigger className="w-full border-slate-700 bg-slate-800 text-white">
                  <SelectValue placeholder="Select field..." />
                </SelectTrigger>
                <SelectContent className="border-slate-700 bg-slate-800">
                  {contactFields.map((field) => (
                    <SelectItem key={field.value} value={field.value}>
                      {field.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            ) : (
              <Select
                value={mapping.value || undefined}
                onValueChange={(val) =>
                  updateVariable(key, { value: val || '' })
                }
              >
                <SelectTrigger className="w-full border-slate-700 bg-slate-800 text-white">
                  <SelectValue
                    placeholder={
                      loadingFields
                        ? 'Loading…'
                        : customFields.length === 0
                          ? 'No custom fields'
                          : 'Select custom field…'
                    }
                  />
                </SelectTrigger>
                <SelectContent className="border-slate-700 bg-slate-800">
                  {customFields.map((f) => (
                    <SelectItem key={f.id} value={f.id}>
                      {f.field_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold text-white">Personalize Message</h2>
        <p className="mt-1 text-sm text-slate-400">
          Map template variables to contact fields, custom fields, or static values.
        </p>
      </div>

      {!hasAnyPlaceholders ? (
        <div className="rounded-xl border border-slate-800 bg-slate-900/50 p-6 text-center">
          <p className="text-sm text-slate-400">
            This template has no variables to personalize.
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          {headerPlaceholders.length > 0 && (
            <div className="space-y-3">
              <h3 className="text-xs font-bold uppercase tracking-wider text-primary flex items-center gap-1.5">
                <span className="h-1.5 w-1.5 rounded-full bg-primary" /> Header Personalization
              </h3>
              {headerPlaceholders.map((placeholder: string) => {
                const key = `header_${placeholder.replace(/^\{\{|\}\}$/g, '')}`;
                return renderPlaceholderRow(placeholder, key);
              })}
            </div>
          )}

          {bodyPlaceholders.length > 0 && (
            <div className="space-y-3">
              <h3 className="text-xs font-bold uppercase tracking-wider text-primary flex items-center gap-1.5">
                <span className="h-1.5 w-1.5 rounded-full bg-primary" /> Body Personalization
              </h3>
              {bodyPlaceholders.map((placeholder: string) => {
                const num = placeholder.replace(/^\{\{|\}\}$/g, '');
                const key = `body_${num}`;
                return renderPlaceholderRow(placeholder, key);
              })}
            </div>
          )}

          {buttonPlaceholders.length > 0 && (
            <div className="space-y-3">
              <h3 className="text-xs font-bold uppercase tracking-wider text-primary flex items-center gap-1.5">
                <span className="h-1.5 w-1.5 rounded-full bg-primary" /> Button Personalization
              </h3>
              {buttonPlaceholders.map((btn) => {
                const num = btn.placeholder.replace(/^\{\{|\}\}$/g, '');
                const key = `button_${btn.buttonIndex}_${num}`;
                return renderPlaceholderRow(btn.placeholder, key, `For button "${btn.buttonText}" link suffix`);
              })}
            </div>
          )}
        </div>
      )}

      <div className="rounded-xl border border-slate-800 bg-slate-900/50 p-4">
        <div className="mb-3 flex items-center gap-2">
          <Eye className="h-4 w-4 text-primary" />
          <p className="text-sm font-medium text-white">Live Preview</p>
          <span className="text-xs text-slate-500">({previewLabel})</span>
          {loadingPreview && (
            <Loader2 className="h-3.5 w-3.5 animate-spin text-primary" />
          )}
        </div>
        <div className="rounded-lg bg-[#0e1a12] p-3.5 border border-[#1e2d24]">
          <div className="ml-auto max-w-[85%] rounded-2xl bg-[#0b3c2a] text-[#e3fdf5] px-3.5 py-2.5 shadow-sm space-y-1.5">
            {template.header_type === 'text' && previewHeaderText && (
              <p className="font-extrabold text-sm text-white tracking-wide border-b border-[#124d37] pb-1">
                {previewHeaderText}
              </p>
            )}
            {template.header_type && template.header_type !== 'text' && (
              <div className="flex items-center gap-2 bg-[#062c1e] text-xs font-semibold text-teal-400 p-2 rounded-xl border border-[#0d3c2b]">
                <FileText className="size-4 shrink-0" />
                <span className="capitalize">{template.header_type} Header Attachment</span>
              </div>
            )}
            <p className="whitespace-pre-wrap text-sm leading-relaxed text-[#c3fae8]">
              {previewText}
            </p>
            {template.footer_text && (
              <p className="text-[10px] text-teal-500/70 italic mt-1 font-medium">
                {template.footer_text}
              </p>
            )}
          </div>
          {template.buttons && Array.isArray(template.buttons) && template.buttons.length > 0 && (
            <div className="ml-auto max-w-[85%] mt-1 space-y-1">
              {template.buttons.map((btn: any, idx: number) => {
                let dynamicUrlSuffix = '';
                if (btn.type === 'URL' && btn.url) {
                  const matches = btn.url.match(/\{\{(\d+)\}\}/g);
                  if (matches) {
                    const contact = firstContact ?? SAMPLE_CONTACT;
                    const customValues = firstContact
                      ? firstContactCustomValues
                      : new Map<string, string>();
                    
                    dynamicUrlSuffix = ' 🔗 ' + btn.url;
                    matches.forEach((m: string) => {
                      const num = m.replace(/^\{\{|\}\}$/g, '');
                      const key = `button_${idx}_${num}`;
                      const mapping = variables[key];
                      const val = resolveMappingValue(mapping, contact, customValues) || m;
                      dynamicUrlSuffix = dynamicUrlSuffix.replaceAll(m, val);
                    });
                  }
                }
                return (
                  <div
                    key={idx}
                    className="bg-[#1e2f26] border border-[#2b3f33] text-teal-300 rounded-xl py-2 px-3 text-center text-xs font-semibold hover:bg-[#25392e] transition-colors cursor-default"
                  >
                    {btn.text}
                    {dynamicUrlSuffix && (
                      <span className="text-[10px] text-teal-500 block font-normal truncate mt-0.5">
                        {dynamicUrlSuffix}
                      </span>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {unmappedKeys.length > 0 && (
        <div className="rounded-md border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-xs text-amber-300">
          Map every placeholder before continuing — still missing{' '}
          <span className="font-mono font-semibold">
            {unmappedKeys.join(', ')}
          </span>
          .
        </div>
      )}

      <div className="flex items-center justify-between border-t border-slate-800 pt-4">
        <Button
          variant="outline"
          onClick={onBack}
          className="border-slate-700 text-slate-300"
        >
          <ArrowLeft className="h-4 w-4" />
          Back
        </Button>
        <Button
          onClick={onNext}
          disabled={unmappedKeys.length > 0}
          className="bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
        >
          Next
          <ArrowRight className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
