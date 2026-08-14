import { useEffect, useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import {
  closestCenter, DndContext, KeyboardSensor, PointerSensor, TouchSensor,
  useSensor, useSensors, type DragEndEvent,
} from '@dnd-kit/core';
import {
  SortableContext, sortableKeyboardCoordinates, useSortable, verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import {
  Box, Button, Checkbox, FormControlLabel, IconButton, MenuItem, Stack, Tab, Tabs, TextField,
  Tooltip, Typography,
} from '@mui/material';
import { Icon } from '@shared/ui/Icon';
import type { FormField, FormSchema, FieldType } from '@core/forms/types';
import { listFieldTypes, getFieldType } from '@core/forms/registry';
import { useChallenge, useFormSchemas } from '@core/firebase/hooks';
import { usePublishSchema } from '@core/firebase/mutations';
import { useAuth } from '@core/auth';
import { FormRenderer, useFormEngine } from '@shared/ui/forms/FormRenderer';
import { EmptyState, Tag, Eyebrow, ListSkeleton } from '@shared/ui/primitives';
import { c, radius, ease, mono } from '@shared/design/tokens';

const EMPTY_SCHEMA: FormSchema = {
  id: '', orgId: '', version: 0, status: 'draft', title: '', description: null,
  sections: [], settings: { allowDrafts: false, showProgressBar: false, confirmationMessage: null },
};

let seq = 1000;
const newId = () => `f_${seq++}`;

/** Palette icons, keyed by the registry's group — not by field type. */
const GROUP_ICON: Record<string, string> = {
  text: 'short_text',
  number: 'tag',
  choice: 'list',
  date: 'calendar_month',
  file: 'attach_file',
  boolean: 'check_box',
  rating: 'star',
  link: 'link',
};

function blankField(type: FieldType, order: number): FormField {
  const def = getFieldType(type);
  return {
    id: newId(),
    key: `${type}_${seq}`,
    type,
    label: def.label,
    help: null,
    placeholder: null,
    required: false,
    order,
    defaultValue: type === 'multiSelect' ? [] : type === 'checkbox' ? false : '',
    options: def.hasOptions
      ? [
          { id: `o${seq}a`, label: 'Option one', value: 'one' },
          { id: `o${seq}b`, label: 'Option two', value: 'two' },
        ]
      : null,
    validation: {},
    config: { ...def.defaultConfig },
    visibleWhen: null,
    width: 'full',
    piiLevel: 'none',
  };
}

type SortableFieldCardProps = {
  field: FormField;
  index: number;
  sectionId: string;
  sectionLength: number;
  selected: boolean;
  onSelect: () => void;
  onMove: (dir: -1 | 1) => void;
  onRemove: () => void;
};

function SortableFieldCard({
  field, index, sectionId, sectionLength, selected, onSelect, onMove, onRemove,
}: SortableFieldCardProps) {
  const def = getFieldType(field.type);
  const {
    attributes, listeners, setNodeRef, transform, transition, isDragging,
  } = useSortable({ id: field.id, data: { sectionId } });

  return (
    <Box
      ref={setNodeRef}
      component="article"
      onClick={onSelect}
      sx={{
        cursor: 'pointer',
        display: 'grid',
        gridTemplateColumns: { xs: '32px minmax(0,1fr)', sm: '32px minmax(0,1fr) auto' },
        gap: { xs: 1, sm: 1.75 },
        alignItems: 'center',
        p: { xs: 1.25, sm: 2 },
        borderRadius: `${radius.row}px`,
        background: selected ? c.primaryContainer : c.surfaceContainer,
        border: `1px solid ${selected ? c.accent : 'transparent'}`,
        opacity: isDragging ? 0.62 : 1,
        transform: CSS.Transform.toString(transform),
        transition: transition ?? `background 160ms ${ease}, border-color 160ms ${ease}, opacity 160ms ${ease}`,
        boxShadow: isDragging ? '0 14px 32px rgba(33, 24, 0, 0.14)' : 'none',
        zIndex: isDragging ? 2 : 1,
      }}
    >
      <Tooltip title="Drag to reorder">
        <Box
          component="button"
          type="button"
          aria-label={`Drag ${field.label}`}
          {...attributes}
          {...listeners}
          onClick={(e) => e.stopPropagation()}
          sx={{
            width: 32,
            height: 32,
            border: 'none',
            borderRadius: `${radius.chip}px`,
            display: 'grid',
            placeItems: 'center',
            color: c.primaryIcon,
            background: 'transparent',
            cursor: 'grab',
            touchAction: 'none',
            '&:active': { cursor: 'grabbing' },
            '&:hover': { background: c.surfaceFieldHover },
          }}
        >
          <Icon name="drag_indicator" size={20} />
        </Box>
      </Tooltip>
      <Box sx={{ flex: 1, minWidth: 0 }}>
        <Typography noWrap sx={{ fontSize: 14, fontWeight: 600 }}>{field.label}</Typography>
        <Box sx={{ fontSize: 12, color: c.inkFaint, fontFamily: mono }}>
          {field.key} · {def.label}
        </Box>
      </Box>
      <Stack
        direction="row"
        gap={0.5}
        alignItems="center"
        justifyContent={{ xs: 'flex-start', sm: 'flex-end' }}
        flexWrap="wrap"
        sx={{ gridColumn: { xs: '1 / -1', sm: 'auto' } }}
      >
        {field.visibleWhen && <Tag bg={c.success} fg={c.onSuccess}>conditional</Tag>}
        {field.required && <Tag>required</Tag>}
        {field.piiLevel === 'high' && <Tag bg={c.errorContainer} fg={c.errorInk}>PII</Tag>}
        <IconButton size="small" aria-label="Move up" disabled={index === 0} onClick={(e) => { e.stopPropagation(); onMove(-1); }}>
          <Icon name="arrow_upward" size={18} />
        </IconButton>
        <IconButton size="small" aria-label="Move down" disabled={index === sectionLength - 1} onClick={(e) => { e.stopPropagation(); onMove(1); }}>
          <Icon name="arrow_downward" size={18} />
        </IconButton>
        <IconButton size="small" aria-label="Delete field" onClick={(e) => { e.stopPropagation(); onRemove(); }}>
          <Icon name="delete" size={18} />
        </IconButton>
      </Stack>
    </Box>
  );
}

/** S-30 — Form builder. Palette / canvas / field settings, per the design. */
export default function FormBuilder() {
  const { cid } = useParams();
  const { data: challenge, isLoading } = useChallenge(cid);
  const { data: schemas = {} } = useFormSchemas();
  const remote = challenge ? schemas[challenge.formSchemaId] : undefined;

  // The builder edits a local draft. Publishing it back to Firestore needs the
  // versioning write path (hard rule 6) — see STATUS.md.
  const [schema, setSchema] = useState<FormSchema | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  useEffect(() => {
    if (remote && !schema) {
      const draft = structuredClone(remote);
      setSchema(draft);
      setSelectedId(draft.sections[0]?.fields[0]?.id ?? null);
    }
  }, [remote, schema]);
  const { user } = useAuth();
  const publish = usePublishSchema();
  const [mode, setMode] = useState<'edit' | 'preview'>('edit');
  const [cfgTab, setCfgTab] = useState(0);
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 150, tolerance: 6 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  const previewEngine = useFormEngine(schema ?? EMPTY_SCHEMA);
  const types = useMemo(() => listFieldTypes(), []);

  if (isLoading) return <ListSkeleton rows={3} height={120} />;
  if (!challenge) return <EmptyState icon="search_off" title="Challenge not found" />;
  if (!schema) return <EmptyState icon="description" title="No form schema for this challenge" />;

  const selected = schema.sections.flatMap((s) => s.fields).find((f) => f.id === selectedId) ?? null;
  const totalFields = schema.sections.reduce((n, s) => n + s.fields.length, 0);

  const mutateField = (id: string, patch: Partial<FormField>) =>
    setSchema((prev) => (prev ? {
      ...prev,
      sections: prev.sections.map((s) => ({
        ...s,
        fields: s.fields.map((f) => (f.id === id ? { ...f, ...patch } : f)),
      })),
    } : prev));

  const addField = (type: FieldType) => {
    const sectionId = schema?.sections[0]?.id;
    if (!sectionId) return;
    const f = blankField(type, 999);
    setSchema((prev) => (prev ? {
      ...prev,
      sections: prev.sections.map((s) =>
        s.id === sectionId ? { ...s, fields: [...s.fields, { ...f, order: s.fields.length }] } : s,
      ),
    } : prev));
    setSelectedId(f.id);
  };

  const removeField = (id: string) =>
    setSchema((prev) => (prev ? {
      ...prev,
      sections: prev.sections.map((s) => ({ ...s, fields: s.fields.filter((f) => f.id !== id) })),
    } : prev));

  const moveField = (sectionId: string, idx: number, dir: -1 | 1) =>
    setSchema((prev) => (prev ? {
      ...prev,
      sections: prev.sections.map((s) => {
        if (s.id !== sectionId) return s;
        const fields = [...s.fields];
        const j = idx + dir;
        if (j < 0 || j >= fields.length) return s;
        [fields[idx], fields[j]] = [fields[j]!, fields[idx]!];
        return { ...s, fields: fields.map((f, i) => ({ ...f, order: i })) };
      }),
    } : prev));

  const reorderField = (sectionId: string, fieldId: string, targetId: string) => {
    if (fieldId === targetId) return;
    setSchema((prev) => (prev ? {
      ...prev,
      sections: prev.sections.map((s) => {
        if (s.id !== sectionId) return s;
        const from = s.fields.findIndex((f) => f.id === fieldId);
        const to = s.fields.findIndex((f) => f.id === targetId);
        if (from < 0 || to < 0) return s;
        const fields = [...s.fields];
        const [field] = fields.splice(from, 1);
        fields.splice(to, 0, field!);
        return { ...s, fields: fields.map((f, i) => ({ ...f, order: i })) };
      }),
    } : prev));
  };

  const finishFieldDrop = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const fromSection = active.data.current?.sectionId;
    const toSection = over.data.current?.sectionId;
    if (typeof active.id === 'string' && typeof over.id === 'string' && fromSection === toSection) {
      reorderField(String(fromSection), active.id, over.id);
    }
  };

  return (
    <>
      <Stack direction="row" alignItems="center" flexWrap="wrap" gap={2} sx={{ mb: 3 }}>
        <Box
          component={Link}
          to={`/org/challenges/${challenge.id}`}
          aria-label="Back to challenge"
          sx={{ width: 48, height: 48, flex: 'none', borderRadius: '50%', background: c.surfaceField, display: 'grid', placeItems: 'center', color: c.ink, '&:hover': { background: c.surfaceFieldHover } }}
        >
          <Icon name="arrow_back" size={22} />
        </Box>
        <Box sx={{ flex: 1, minWidth: 200 }}>
          <Typography sx={{ fontSize: 12, color: c.inkFaint }}>
            {challenge.title} · schema v{schema.version} · {schema.status} · {totalFields} fields
          </Typography>
          <Typography sx={{ fontSize: 28, fontWeight: 700, letterSpacing: 0, mt: 0.5 }}>
            {schema.title}
          </Typography>
        </Box>
        <Button
          variant="outlined"
          onClick={() => setMode(mode === 'edit' ? 'preview' : 'edit')}
          startIcon={<Icon name={mode === 'edit' ? 'visibility' : 'edit'} size={20} />}
        >
          {mode === 'edit' ? 'Preview' : 'Edit'}
        </Button>
        <Button
          variant="contained"
          disabled={publish.isPending}
          onClick={() => publish.mutate({ schema, userId: user?.uid })}
        >
          {publish.isPending ? 'Publishing…' : `Publish v${schema.version + 1}`}
        </Button>
      </Stack>

      {publish.error && (
        <Stack
          direction="row"
          gap={1.75}
          alignItems="flex-start"
          sx={{ mb: 3, p: 2.25, borderRadius: `${radius.tile}px`, background: c.errorContainer }}
        >
          <Icon name="lock" size={22} color={c.errorInk} />
          <Box>
            <Typography sx={{ fontSize: 15, fontWeight: 600, color: c.onErrorContainer, mb: 0.25 }}>
              Could not publish
            </Typography>
            <Typography sx={{ fontSize: 13, lineHeight: 1.5, color: c.errorBody }}>
              Publishing writes a new schema version to shared organization state, so it needs the{' '}
              <Box component="code" sx={{ fontFamily: mono }}>form.manage</Box> permission — a demo viewer
              does not have it. Your edits are still here; nothing was lost.
            </Typography>
          </Box>
        </Stack>
      )}

      {publish.isSuccess && (
        <Stack
          direction="row"
          gap={1.75}
          alignItems="center"
          sx={{ mb: 3, p: 2.25, borderRadius: `${radius.tile}px`, background: c.success }}
        >
          <Icon name="check_circle" size={22} fill color={c.successInk} />
          <Typography sx={{ fontSize: 14, color: c.onSuccess }}>
            Published as v{schema.version + 1}. The previous version is untouched — existing entries still
            validate against the version they were made with.
          </Typography>
        </Stack>
      )}

      {mode === 'preview' ? (
        <Box sx={{ maxWidth: 680, mx: 'auto' }}>
          <Stack direction="row" gap={1.75} sx={{ p: 2.25, borderRadius: `${radius.tile}px`, background: c.surfaceContainer, mb: 3 }}>
            <Icon name="visibility" size={22} color={c.primaryIcon} />
            <Typography sx={{ fontSize: 13, lineHeight: 1.55, color: c.inkMuted }}>
              This is the participant view, rendered from the schema you are editing — the same renderer, the
              same compiled validation.
            </Typography>
          </Stack>
          <FormRenderer schema={schema} engine={previewEngine} />
        </Box>
      ) : (
        <Box
          sx={{
            display: 'grid',
            // Palette + canvas from md; the settings panel joins as a third
            // column only when there is room for it beside the shell sidebar.
            gridTemplateColumns: { xs: '1fr', md: '200px minmax(0,1fr)', lg: '200px minmax(0,1fr) 290px' },
            gap: 2.5,
            alignItems: 'start',
          }}
        >
          {/* Palette */}
          <Box sx={{ borderRadius: `${radius.card}px`, background: c.surfaceContainer, p: 2 }}>
            <Eyebrow>Field types</Eyebrow>
            <Typography sx={{ fontSize: 12, color: c.inkFaint, px: 1, pb: 1.5 }}>
              Registered, not hardcoded
            </Typography>
            <Stack
              spacing={0.5}
              sx={{
                display: { xs: 'grid', md: 'flex' },
                gridTemplateColumns: { xs: 'repeat(2, minmax(0, 1fr))', sm: 'repeat(3, minmax(0, 1fr))' },
              }}
            >
              {types.map((ft) => (
                <Box
                  key={ft.type}
                  component="button"
                  onClick={() => addField(ft.type)}
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 1.5,
                    minHeight: 48,
                    p: '12px 14px',
                    border: 'none',
                    borderRadius: '14px',
                    background: 'transparent',
                    textAlign: 'left',
                    cursor: 'pointer',
                    fontSize: 14,
                    transition: `background 160ms ${ease}`,
                    '&:hover': { background: c.surfaceFieldHover },
                  }}
                >
                  <Icon name={GROUP_ICON[ft.group] ?? 'short_text'} size={20} color={c.inkMuted} />
                  {ft.label}
                </Box>
              ))}
            </Stack>
          </Box>

          {/* Canvas */}
          <Box sx={{ borderRadius: `${radius.card}px`, background: c.surfaceCard, border: `1px solid ${c.outline}`, p: { xs: 1.5, sm: 2.5 } }}>
            {schema.sections.map((section) => (
              <Box key={section.id} sx={{ mb: 3, '&:last-of-type': { mb: 0 } }}>
                <Typography variant="overline" sx={{ display: 'block', color: c.primaryInk, mb: 1.25 }}>
                  {section.title}
                </Typography>
                <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={finishFieldDrop}>
                  <SortableContext items={section.fields.map((f) => f.id)} strategy={verticalListSortingStrategy}>
                    <Stack spacing={1.25}>
                      {section.fields.map((f, idx) => {
                        const isSel = f.id === selectedId;
                        return (
                          <SortableFieldCard
                            key={f.id}
                            field={f}
                            index={idx}
                            sectionId={section.id}
                            sectionLength={section.fields.length}
                            selected={isSel}
                            onSelect={() => setSelectedId(f.id)}
                            onMove={(dir) => moveField(section.id, idx, dir)}
                            onRemove={() => removeField(f.id)}
                          />
                        );
                      })}
                    </Stack>
                  </SortableContext>
                </DndContext>
              </Box>
            ))}
          </Box>

          {/* Field settings */}
          <Box
            sx={{
              borderRadius: `${radius.card}px`,
              background: c.surfaceContainer,
              p: 2.5,
              gridColumn: { md: '1 / -1', lg: 'auto' },
            }}
          >
            <Eyebrow>Field settings</Eyebrow>
            {!selected ? (
              <Typography sx={{ fontSize: 14, color: c.inkMuted, mt: 2 }}>
                Pick a field on the canvas to configure it.
              </Typography>
            ) : (
              <>
                <Typography sx={{ fontSize: 16, fontWeight: 700, mt: 0.5, mb: 2 }}>{selected.label}</Typography>
                <Tabs value={cfgTab} onChange={(_, v: number) => setCfgTab(v)} variant="fullWidth" sx={{ mb: 2.5 }}>
                  <Tab label="Field" /><Tab label="Rules" /><Tab label="Logic" />
                </Tabs>

                {cfgTab === 0 && (
                  <Stack spacing={2}>
                    <TextField label="Label" fullWidth value={selected.label}
                      onChange={(e) => mutateField(selected.id, { label: e.target.value })} />
                    <TextField
                      label="Field ID" fullWidth value={selected.id} disabled
                      helperText="Immutable — answers are keyed by it"
                      InputProps={{
                        endAdornment: (
                          <Tooltip title="Field ids are never renamed or reused">
                            <Box component="span" sx={{ color: c.inkFaint, display: 'flex' }}>
                              <Icon name="lock" size={18} />
                            </Box>
                          </Tooltip>
                        ),
                      }}
                    />
                    <TextField label="Answer key" fullWidth value={selected.key}
                      onChange={(e) => mutateField(selected.id, { key: e.target.value })} />
                    <TextField label="Help text" fullWidth value={selected.help ?? ''}
                      onChange={(e) => mutateField(selected.id, { help: e.target.value || null })} />
                    <TextField label="Placeholder" fullWidth value={selected.placeholder ?? ''}
                      onChange={(e) => mutateField(selected.id, { placeholder: e.target.value || null })} />
                    <TextField select label="Width" fullWidth value={selected.width}
                      onChange={(e) => mutateField(selected.id, { width: e.target.value as 'full' | 'half' })}>
                      <MenuItem value="full">Full width</MenuItem>
                      <MenuItem value="half">Half width</MenuItem>
                    </TextField>
                    <TextField select label="PII level" fullWidth value={selected.piiLevel}
                      onChange={(e) => mutateField(selected.id, { piiLevel: e.target.value as FormField['piiLevel'] })}>
                      <MenuItem value="none">None</MenuItem>
                      <MenuItem value="low">Low</MenuItem>
                      <MenuItem value="high">High — redact on export</MenuItem>
                    </TextField>
                    <FormControlLabel
                      control={<Checkbox checked={selected.required}
                        onChange={(e) => mutateField(selected.id, { required: e.target.checked })} />}
                      label="Required"
                    />
                  </Stack>
                )}

                {cfgTab === 1 && (
                  <Stack spacing={2}>
                    <Typography sx={{ fontSize: 12, color: c.inkFaint, lineHeight: 1.5 }}>
                      These compile straight into the Zod validator used by the builder preview, the
                      participant form and the server.
                    </Typography>
                    <TextField label="Min length" type="number" fullWidth
                      value={selected.validation.minLength ?? ''}
                      onChange={(e) => mutateField(selected.id, { validation: { ...selected.validation, minLength: e.target.value ? Number(e.target.value) : undefined } })} />
                    <TextField label="Max length" type="number" fullWidth
                      value={selected.validation.maxLength ?? ''}
                      onChange={(e) => mutateField(selected.id, { validation: { ...selected.validation, maxLength: e.target.value ? Number(e.target.value) : undefined } })} />
                    <TextField label="Min value" type="number" fullWidth
                      value={selected.validation.min ?? ''}
                      onChange={(e) => mutateField(selected.id, { validation: { ...selected.validation, min: e.target.value ? Number(e.target.value) : undefined } })} />
                    <TextField label="Max value" type="number" fullWidth
                      value={selected.validation.max ?? ''}
                      onChange={(e) => mutateField(selected.id, { validation: { ...selected.validation, max: e.target.value ? Number(e.target.value) : undefined } })} />
                    <TextField label="Max file size (MB)" type="number" fullWidth
                      value={selected.validation.maxFileSizeMB ?? ''}
                      onChange={(e) => mutateField(selected.id, { validation: { ...selected.validation, maxFileSizeMB: e.target.value ? Number(e.target.value) : undefined } })} />
                  </Stack>
                )}

                {cfgTab === 2 && (
                  <Stack spacing={2}>
                    <Typography sx={{ fontSize: 12, color: c.inkFaint, lineHeight: 1.5 }}>
                      Show this field only when a condition holds. Hidden fields are excluded from validation
                      and dropped before storage.
                    </Typography>
                    <Box
                      component="pre"
                      sx={{ fontFamily: mono, fontSize: 12, m: 0, p: 2, overflow: 'auto', borderRadius: `${radius.chip}px`, background: c.surfaceCard, border: `1px solid ${c.outline}` }}
                    >
                      {JSON.stringify(selected.visibleWhen, null, 2) ?? 'null'}
                    </Box>
                    <Button
                      variant="outlined"
                      size="small"
                      onClick={() => mutateField(selected.id, {
                        visibleWhen: selected.visibleWhen ? null : { field: 'department', op: 'eq', value: 'external' },
                      })}
                    >
                      {selected.visibleWhen ? 'Remove condition' : 'Add sample condition'}
                    </Button>
                  </Stack>
                )}
              </>
            )}
          </Box>
        </Box>
      )}
    </>
  );
}
