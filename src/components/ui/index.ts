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
export { Menu, Select, Tooltip, Dialog, ToastProvider, useToast, type MenuItem } from "./Overlay";
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
  Spinner,
  Stat,
  type Status,
} from "./Display";
export { DataTable, type Column } from "./DataTable";
export { IconButton, ThemeToggle, useTheme } from "./Actions";
export * from "./icons";
