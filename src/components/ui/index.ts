"use client";

/* Kit de elementos básicos de la app, construido sobre los átomos y la
 * fundación oficiales de Beautiful UI. Los átomos originales se reexportan
 * para importar todo desde "@/components/ui". */
export { Button, buttonVariants, type ButtonVariant } from "@/components/atoms/Button";
export { EntityChip, Monogram } from "@/components/atoms/EntityChip";
export { ValuePill } from "@/components/atoms/ValuePill";
export { Shimmer } from "@/components/atoms/Shimmer";
export { StreamText } from "@/components/atoms/StreamText";
export { default as GlideMenu } from "@/components/primitives/GlideMenu";

export { Input, Textarea, Field, Kbd } from "./Field";
export { Checkbox, RadioGroup, Switch } from "./Choice";
export { Segmented, Tabs, FilterChips } from "./Segmented";
export { Menu, ContextMenu, Select, Tooltip, Dialog, ToastProvider, useToast, type MenuItem } from "./Overlay";
export {
  Card,
  CardHeader,
  CardBody,
  CardFooter,
  StatusPill,
  Tag,
  Avatar,
  AvatarStack,
  Alert,
  EmptyState,
  Progress,
  Meter,
  Timeline,
  type TimelineEvent,
  Spinner,
  Stat,
  type Status,
} from "./Display";
export { DataTable, sortTableRows, type Column, type SortState } from "./DataTable";
export { Popover, Combobox, type ComboboxOption } from "./Popover";
export { Sheet } from "./Sheet";
export { CommandPalette, useHotkey, modKey, type CommandItem, type CommandGroup } from "./Command";
export { IconButton, ThemeToggle, useTheme, setTheme, setAccent, ACCENTS, type Accent, themeScript, ThemeScript } from "./Actions";
export { Breadcrumb, Pagination, pageRange, Stepper, type Crumb } from "./Navigation";
export { Separator, Skeleton, SkeletonText, Collapse, Collapsible, Accordion, ScrollArea, Resizable, ResizablePanel, ResizableHandle, type AccordionItem } from "./Layout";
export { Slider, NumberInput, PasswordInput, OtpInput, MultiSelect, Dropzone, formatBytes, type MultiOption } from "./Inputs";
export { Calendar, DatePicker, DateRangePicker, addDays, addMonths, startOfDay, sameDay, type DateRange, type RangePreset } from "./Dates";
export { ChartFrame, LineChart, BarChart, Sparkline, SegmentedBar, niceTicks, type Series } from "./Charts";
export { Floating, useRovingFocus, type Side, type Align } from "./floating";
export { usePopover, TRIGGER, Chevron } from "./Overlay";
export { UIProvider, useUI, useLabels, LABELS, type Labels } from "./i18n";
export * from "./icons";
