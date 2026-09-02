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
import type { FormField, FormSchema, FieldType, FieldOption, ConditionOp } from '@core/forms/types';
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

let seq = Date.now() % 100000;
const newId = (prefix = 'f') => `${prefix}_${++seq}`;

/** Palette icons, keyed by registry group. */
const GROUP_ICON: Record<string, string> = {
  text: 'short_text',
  number: 'tag',
  choice: 'list',
  date: 'calendar_month',
  file: 'attach_file',
  boolean: 'check_box',
  rating: 'star',
  link: 'link',
  special: 'tune',
};

function blankField(type: FieldType, order: number): FormField {
  const def = getFieldType(type);
  const fid = newId('f');
  return {
    id: fid,
    key: `${type}_${fid}`,
    type,
    label: def.label,
    help: null,
    placeholder: null,
    required: false,
    order,
    defaultValue: type === 'multiSelect' ? [] : type === 'checkbox' ? false : '',
    options: def.hasOptions
      ? [
          { id: newId('opt'), label: 'Option 1', value: 'option_1' },
          { id: newId('opt'), label: 'Option 2', value: 'option_2' },
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
        p: { xs: 1.25, sm: 1.75 },
        borderRadius: `${radius.row}px`,
        background: selected ? c.primaryContainer : c.surfaceContainer,
        border: `1.5px solid ${selected ? c.accent : 'transparent'}`,
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
        <Typography noWrap sx={{ fontSize: 14, fontWeight: 650 }}>{field.label}</Typography>
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
        {field.options && <Tag bg={c.surfaceCard} fg={c.inkMuted}>{field.options.length} options</Tag>}
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

/** S-30 — Form builder with full Options manager, Section management, and Condition designer. */
export default function FormBuilder() {
  const { cid } = useParams();
  const { data: challenge, isLoading } = useChallenge(cid);
  const { data: schemas = {} } = useFormSchemas();
  const remote = challenge ? schemas[challenge.formSchemaId] : undefined;

  const [schema, setSchema] = useState<FormSchema | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [activeSectionId, setActiveSectionId] = useState<string | null>(null);

  useEffect(() => {
    if (remote && !schema) {
      const draft = structuredClone(remote);
      setSchema(draft);
      setSelectedId(draft.sections[0]?.fields[0]?.id ?? null);
      setActiveSectionId(draft.sections[0]?.id ?? null);
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

  const allFields = useMemo(() => (schema ? schema.sections.flatMap((s) => s.fields) : []), [schema]);
  const selected = useMemo(() => allFields.find((f) => f.id === selectedId) ?? null, [allFields, selectedId]);
  const otherFields = useMemo(() => allFields.filter((f) => f.id !== selectedId), [allFields, selectedId]);

  if (isLoading) return <ListSkeleton rows={3} height={120} />;
  if (!challenge) return <EmptyState icon="search_off" title="Challenge not found" />;
  if (!schema) return <EmptyState icon="description" title="No form schema for this challenge" />;

  const totalFields = allFields.length;

  const mutateField = (id: string, patch: Partial<FormField>) =>
    setSchema((prev) => (prev ? {
      ...prev,
      sections: prev.sections.map((s) => ({
        ...s,
        fields: s.fields.map((f) => (f.id === id ? { ...f, ...patch } : f)),
      })),
    } : prev));

  const addField = (type: FieldType) => {
    const targetSection = schema.sections.find((s) => s.id === activeSectionId) ?? schema.sections[0];
    if (!targetSection) return;
    const f = blankField(type, targetSection.fields.length);
    setSchema((prev) => (prev ? {
      ...prev,
      sections: prev.sections.map((s) =>
        s.id === targetSection.id ? { ...s, fields: [...s.fields, f] } : s,
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

  /* Section Management */
  const addSection = () => {
    const sid = newId('sec');
    const newSec = {
      id: sid,
      title: `Section ${schema.sections.length + 1}`,
      description: null,
      order: schema.sections.length,
      fields: [],
      visibleWhen: null,
    };
    setSchema((prev) => (prev ? { ...prev, sections: [...prev.sections, newSec] } : prev));
    setActiveSectionId(sid);
  };

  const updateSectionTitle = (sectionId: string, title: string) => {
    setSchema((prev) => (prev ? {
      ...prev,
      sections: prev.sections.map((s) => (s.id === sectionId ? { ...s, title } : s)),
    } : prev));
  };

  const removeSection = (sectionId: string) => {
    if (schema.sections.length <= 1) return;
    setSchema((prev) => (prev ? {
      ...prev,
      sections: prev.sections.filter((s) => s.id !== sectionId),
    } : prev));
  };

  /* Options Management */
  const addOption = (fieldId: string) => {
    const currentOptions = selected?.options ?? [];
    const optNum = currentOptions.length + 1;
    const newOpt: FieldOption = {
      id: newId('opt'),
      label: `Option ${optNum}`,
      value: `option_${optNum}`,
    };
    mutateField(fieldId, { options: [...currentOptions, newOpt] });
  };

  const updateOption = (fieldId: string, optId: string, patch: Partial<FieldOption>) => {
    const currentOptions = selected?.options ?? [];
    const updated = currentOptions.map((o) => (o.id === optId ? { ...o, ...patch } : o));
    mutateField(fieldId, { options: updated });
  };

  const removeOption = (fieldId: string, optId: string) => {
    const currentOptions = selected?.options ?? [];
    mutateField(fieldId, { options: currentOptions.filter((o) => o.id !== optId) });
  };

  return (
    <>
      <Stack direction="row" alignItems="center" flexWrap="wrap" gap={2} sx={{ mb: 3 }}>
        <Box
          component={Link}
          to={`/org/challenges/${challenge.id}`}
          aria-label="Back to challenge"
          sx={{ width: 44, height: 44, flex: 'none', borderRadius: '50%', background: c.surfaceField, display: 'grid', placeItems: 'center', color: c.ink, '&:hover': { background: c.surfaceFieldHover } }}
        >
          <Icon name="arrow_back" size={22} />
        </Box>
        <Box sx={{ flex: 1, minWidth: 200 }}>
          <Typography sx={{ fontSize: 12, color: c.inkFaint }}>
            {challenge.title} · schema v{schema.version} · {schema.status} · {totalFields} fields
          </Typography>
          <Typography sx={{ fontSize: 26, fontWeight: 700, letterSpacing: 0, mt: 0.25 }}>
            {schema.title || 'Entry Form Questions'}
          </Typography>
        </Box>
        <Button
          variant="outlined"
          onClick={() => setMode(mode === 'edit' ? 'preview' : 'edit')}
          startIcon={<Icon name={mode === 'edit' ? 'visibility' : 'edit'} size={20} />}
        >
          {mode === 'edit' ? 'Interactive Preview' : 'Back to Builder'}
        </Button>
        <Button
          variant="contained"
          disabled={publish.isPending}
          onClick={() => publish.mutate({ schema, userId: user?.uid })}
          startIcon={<Icon name="publish" size={20} />}
        >
          {publish.isPending ? 'Publishing…' : `Publish v${schema.version + 1}`}
        </Button>
      </Stack>

      {publish.error && (
        <Stack direction="row" gap={1.75} alignItems="flex-start" sx={{ mb: 3, p: 2, borderRadius: `${radius.tile}px`, background: c.errorContainer }}>
          <Icon name="error" size={22} color={c.errorInk} />
          <Box>
            <Typography sx={{ fontSize: 14, fontWeight: 650, color: c.onErrorContainer }}>Could not publish</Typography>
            <Typography sx={{ fontSize: 13, color: c.errorBody }}>Ensure you hold form.manage permission on this organization.</Typography>
          </Box>
        </Stack>
      )}

      {publish.isSuccess && (
        <Stack direction="row" gap={1.75} alignItems="center" sx={{ mb: 3, p: 2, borderRadius: `${radius.tile}px`, background: c.success }}>
          <Icon name="check_circle" size={22} fill color={c.successInk} />
          <Typography sx={{ fontSize: 14, color: c.onSuccess }}>
            Published as v{schema.version + 1}. All incoming submissions will now validate against this version.
          </Typography>
        </Stack>
      )}

      {mode === 'preview' ? (
        <Box sx={{ maxWidth: 680, mx: 'auto' }}>
          <Stack direction="row" gap={1.75} sx={{ p: 2.25, borderRadius: `${radius.tile}px`, background: c.surfaceContainer, mb: 3 }}>
            <Icon name="visibility" size={22} color={c.primaryIcon} />
            <Typography sx={{ fontSize: 13, lineHeight: 1.55, color: c.inkMuted }}>
              Participant view, rendered with real condition evaluation, live validation, and draft persistence.
            </Typography>
          </Stack>
          <FormRenderer schema={schema} engine={previewEngine} />
        </Box>
      ) : (
        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: { xs: '1fr', md: '210px minmax(0,1fr)', lg: '210px minmax(0,1fr) 320px' },
            gap: 2.5,
            alignItems: 'start',
          }}
        >
          {/* Palette */}
          <Box sx={{ borderRadius: `${radius.card}px`, background: c.surfaceContainer, p: 2 }}>
            <Eyebrow>Field types</Eyebrow>
            <Typography sx={{ fontSize: 12, color: c.inkFaint, px: 0.5, pb: 1.5 }}>
              Click to add to form
            </Typography>
            <Stack
              spacing={0.5}
              sx={{
                display: { xs: 'grid', md: 'flex' },
                gridTemplateColumns: { xs: 'repeat(2, minmax(0, 1fr))' },
                maxHeight: '75vh',
                overflowY: 'auto',
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
                    gap: 1.25,
                    minHeight: 42,
                    px: 1.5,
                    py: 1,
                    border: 'none',
                    borderRadius: '10px',
                    background: 'transparent',
                    textAlign: 'left',
                    cursor: 'pointer',
                    fontSize: 13.5,
                    fontWeight: 550,
                    transition: `background 140ms ${ease}`,
                    '&:hover': { background: c.surfaceFieldHover },
                  }}
                >
                  <Icon name={GROUP_ICON[ft.group] ?? 'short_text'} size={18} color={c.inkMuted} />
                  <Typography noWrap sx={{ fontSize: 13 }}>{ft.label}</Typography>
                </Box>
              ))}
            </Stack>
          </Box>

          {/* Canvas */}
          <Box sx={{ borderRadius: `${radius.card}px`, background: c.surfaceCard, border: `1px solid ${c.outline}`, p: { xs: 2, sm: 2.5 } }}>
            {schema.sections.map((section) => (
              <Box
                key={section.id}
                onClick={() => setActiveSectionId(section.id)}
                sx={{
                  mb: 3.5,
                  p: 2,
                  borderRadius: `${radius.card}px`,
                  border: `1px dashed ${activeSectionId === section.id ? c.accent : c.outline}`,
                  background: activeSectionId === section.id ? 'rgba(243, 220, 133, 0.05)' : 'transparent',
                }}
              >
                <Stack direction="row" alignItems="center" justifyContent="space-between" gap={1.5} sx={{ mb: 1.5 }}>
                  <TextField
                    variant="standard"
                    value={section.title}
                    onChange={(e) => updateSectionTitle(section.id, e.target.value)}
                    InputProps={{ disableUnderline: true }}
                    sx={{
                      '& .MuiInputBase-input': {
                        fontSize: 15,
                        fontWeight: 700,
                        color: c.primaryInk,
                        letterSpacing: '0.02em',
                      },
                    }}
                  />
                  <Stack direction="row" alignItems="center" gap={0.5}>
                    <Tag>{section.fields.length} field{section.fields.length === 1 ? '' : 's'}</Tag>
                    {schema.sections.length > 1 && section.fields.length === 0 && (
                      <IconButton size="small" aria-label="Remove section" onClick={() => removeSection(section.id)}>
                        <Icon name="delete" size={18} />
                      </IconButton>
                    )}
                  </Stack>
                </Stack>

                <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={finishFieldDrop}>
                  <SortableContext items={section.fields.map((f) => f.id)} strategy={verticalListSortingStrategy}>
                    <Stack spacing={1.25}>
                      {section.fields.map((f, idx) => (
                        <SortableFieldCard
                          key={f.id}
                          field={f}
                          index={idx}
                          sectionId={section.id}
                          sectionLength={section.fields.length}
                          selected={f.id === selectedId}
                          onSelect={() => {
                            setSelectedId(f.id);
                            setActiveSectionId(section.id);
                          }}
                          onMove={(dir) => moveField(section.id, idx, dir)}
                          onRemove={() => removeField(f.id)}
                        />
                      ))}
                      {section.fields.length === 0 && (
                        <Typography sx={{ fontSize: 13, color: c.inkFaint, py: 2, textAlign: 'center' }}>
                          Empty section. Pick a field type from the left palette to add questions here.
                        </Typography>
                      )}
                    </Stack>
                  </SortableContext>
                </DndContext>
              </Box>
            ))}

            <Button
              variant="outlined"
              fullWidth
              onClick={addSection}
              startIcon={<Icon name="add_circle" size={20} />}
              sx={{ py: 1.25, borderRadius: `${radius.tile}px` }}
            >
              Add another section
            </Button>
          </Box>

          {/* Field Settings Panel */}
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
                Pick a question card on the canvas to configure its properties and options.
              </Typography>
            ) : (
              <>
                <Typography noWrap sx={{ fontSize: 16, fontWeight: 700, mt: 0.5, mb: 1.5 }}>
                  {selected.label}
                </Typography>
                <Tabs value={cfgTab} onChange={(_, v: number) => setCfgTab(v)} variant="fullWidth" sx={{ mb: 2.5 }}>
                  <Tab label="Field" />
                  <Tab label="Rules" />
                  <Tab label="Logic" />
                </Tabs>

                {/* Tab 0: Core properties & Options */}
                {cfgTab === 0 && (
                  <Stack spacing={2}>
                    <TextField
                      label="Question / Label"
                      fullWidth
                      size="small"
                      value={selected.label}
                      onChange={(e) => mutateField(selected.id, { label: e.target.value })}
                    />
                    <TextField
                      label="Field ID"
                      fullWidth
                      size="small"
                      value={selected.id}
                      disabled
                      helperText="Immutable ID used for storage"
                    />
                    <TextField
                      label="Answer key"
                      fullWidth
                      size="small"
                      value={selected.key}
                      onChange={(e) => mutateField(selected.id, { key: e.target.value })}
                      helperText="Key in submissions export"
                    />
                    <TextField
                      label="Help text"
                      fullWidth
                      size="small"
                      value={selected.help ?? ''}
                      onChange={(e) => mutateField(selected.id, { help: e.target.value || null })}
                    />
                    <TextField
                      label="Placeholder"
                      fullWidth
                      size="small"
                      value={selected.placeholder ?? ''}
                      onChange={(e) => mutateField(selected.id, { placeholder: e.target.value || null })}
                    />
                    <TextField
                      select
                      label="Width"
                      fullWidth
                      size="small"
                      value={selected.width}
                      onChange={(e) => mutateField(selected.id, { width: e.target.value as 'full' | 'half' })}
                    >
                      <MenuItem value="full">Full width</MenuItem>
                      <MenuItem value="half">Half width</MenuItem>
                    </TextField>
                    <TextField
                      select
                      label="PII privacy level"
                      fullWidth
                      size="small"
                      value={selected.piiLevel}
                      onChange={(e) => mutateField(selected.id, { piiLevel: e.target.value as FormField['piiLevel'] })}
                    >
                      <MenuItem value="none">None (public answer)</MenuItem>
                      <MenuItem value="low">Low</MenuItem>
                      <MenuItem value="high">High (redact on blind judging)</MenuItem>
                    </TextField>
                    <FormControlLabel
                      control={
                        <Checkbox
                          checked={selected.required}
                          onChange={(e) => mutateField(selected.id, { required: e.target.checked })}
                        />
                      }
                      label="Required question"
                    />

                    {/* Interactive Options Editor for Choice Fields */}
                    {selected.options !== null && (
                      <Box sx={{ mt: 1, p: 2, borderRadius: `${radius.row}px`, background: c.surfaceCard, border: `1px solid ${c.outline}` }}>
                        <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 1.5 }}>
                          <Typography sx={{ fontSize: 13, fontWeight: 700 }}>Options ({selected.options.length})</Typography>
                          <Button size="small" variant="text" onClick={() => addOption(selected.id)} startIcon={<Icon name="add" size={16} />}>
                            Add
                          </Button>
                        </Stack>
                        <Stack spacing={1}>
                          {selected.options.map((opt) => (
                            <Stack key={opt.id} direction="row" alignItems="center" gap={1}>
                              <TextField
                                size="small"
                                placeholder="Option label"
                                value={opt.label}
                                onChange={(e) => updateOption(selected.id, opt.id, { label: e.target.value, value: e.target.value.toLowerCase().replace(/\s+/g, '_') })}
                                sx={{ flex: 1 }}
                              />
                              <IconButton
                                size="small"
                                aria-label="Delete option"
                                disabled={selected.options!.length <= 1}
                                onClick={() => removeOption(selected.id, opt.id)}
                              >
                                <Icon name="close" size={16} />
                              </IconButton>
                            </Stack>
                          ))}
                        </Stack>
                      </Box>
                    )}
                  </Stack>
                )}

                {/* Tab 1: Validation Rules */}
                {cfgTab === 1 && (
                  <Stack spacing={2}>
                    <Typography sx={{ fontSize: 12, color: c.inkFaint }}>
                      Rules compile directly into the Zod validator.
                    </Typography>
                    <TextField
                      label="Min text length"
                      type="number"
                      size="small"
                      fullWidth
                      value={selected.validation.minLength ?? ''}
                      onChange={(e) => mutateField(selected.id, { validation: { ...selected.validation, minLength: e.target.value ? Number(e.target.value) : undefined } })}
                    />
                    <TextField
                      label="Max text length"
                      type="number"
                      size="small"
                      fullWidth
                      value={selected.validation.maxLength ?? ''}
                      onChange={(e) => mutateField(selected.id, { validation: { ...selected.validation, maxLength: e.target.value ? Number(e.target.value) : undefined } })}
                    />
                    <TextField
                      label="Min number value"
                      type="number"
                      size="small"
                      fullWidth
                      value={selected.validation.min ?? ''}
                      onChange={(e) => mutateField(selected.id, { validation: { ...selected.validation, min: e.target.value ? Number(e.target.value) : undefined } })}
                    />
                    <TextField
                      label="Max number value"
                      type="number"
                      size="small"
                      fullWidth
                      value={selected.validation.max ?? ''}
                      onChange={(e) => mutateField(selected.id, { validation: { ...selected.validation, max: e.target.value ? Number(e.target.value) : undefined } })}
                    />
                    <TextField
                      label="Max file size (MB)"
                      type="number"
                      size="small"
                      fullWidth
                      value={selected.validation.maxFileSizeMB ?? ''}
                      onChange={(e) => mutateField(selected.id, { validation: { ...selected.validation, maxFileSizeMB: e.target.value ? Number(e.target.value) : undefined } })}
                    />
                  </Stack>
                )}

                {/* Tab 2: Visual Conditional Logic Builder */}
                {cfgTab === 2 && (
                  <Stack spacing={2}>
                    <Typography sx={{ fontSize: 12.5, color: c.inkMuted }}>
                      Display this question only when a condition on another field is satisfied.
                    </Typography>

                    {otherFields.length === 0 ? (
                      <Typography sx={{ fontSize: 13, color: c.inkFaint }}>
                        Add more fields to build conditional relationships.
                      </Typography>
                    ) : (
                      <>
                        <FormControlLabel
                          control={
                            <Checkbox
                              checked={selected.visibleWhen !== null}
                              onChange={(e) => {
                                if (e.target.checked) {
                                  const firstOther = otherFields[0]!;
                                  mutateField(selected.id, {
                                    visibleWhen: { field: firstOther.key, op: 'eq', value: 'yes' },
                                  });
                                } else {
                                  mutateField(selected.id, { visibleWhen: null });
                                }
                              }}
                            />
                          }
                          label="Enable conditional display"
                        />

                        {selected.visibleWhen && 'field' in selected.visibleWhen && (
                          <Stack spacing={1.5} sx={{ p: 2, borderRadius: `${radius.row}px`, background: c.surfaceCard, border: `1px solid ${c.outline}` }}>
                            <TextField
                              select
                              size="small"
                              label="When question"
                              fullWidth
                              value={selected.visibleWhen.field}
                              onChange={(e) => {
                                const curr = selected.visibleWhen as { field: string; op: ConditionOp; value?: unknown };
                                mutateField(selected.id, { visibleWhen: { ...curr, field: e.target.value } });
                              }}
                            >
                              {otherFields.map((f) => (
                                <MenuItem key={f.key} value={f.key}>{f.label} ({f.key})</MenuItem>
                              ))}
                            </TextField>

                            <TextField
                              select
                              size="small"
                              label="Operator"
                              fullWidth
                              value={selected.visibleWhen.op}
                              onChange={(e) => {
                                const curr = selected.visibleWhen as { field: string; op: ConditionOp; value?: unknown };
                                mutateField(selected.id, { visibleWhen: { ...curr, op: e.target.value as ConditionOp } });
                              }}
                            >
                              <MenuItem value="eq">Equals (==)</MenuItem>
                              <MenuItem value="neq">Does not equal (!=)</MenuItem>
                              <MenuItem value="contains">Contains</MenuItem>
                              <MenuItem value="isNotEmpty">Is not empty</MenuItem>
                              <MenuItem value="isEmpty">Is empty</MenuItem>
                            </TextField>

                            {!['isEmpty', 'isNotEmpty'].includes(selected.visibleWhen.op) && (
                              <TextField
                                size="small"
                                label="Expected value"
                                fullWidth
                                value={String(selected.visibleWhen.value ?? '')}
                                onChange={(e) => {
                                  const curr = selected.visibleWhen as { field: string; op: ConditionOp; value?: unknown };
                                  mutateField(selected.id, { visibleWhen: { ...curr, value: e.target.value } });
                                }}
                              />
                            )}
                          </Stack>
                        )}
                      </>
                    )}
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
