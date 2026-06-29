/**
 * AppIcon — Unified SVG icon component replacing Material Symbols.
 *
 * Maps Material Symbol names to Lucide React SVG equivalents.
 * Eliminates the ~200-300KB Google Fonts Material Symbols woff2 download.
 * Icons render instantly (inline SVG, no font loading delay).
 *
 * Usage:
 *   <AppIcon name="favorite" size={20} filled className="text-red-500" />
 *   <AppIcon name="close" size={18} />
 */

import { memo } from "react";
import {
  Heart, Trash2, Camera, CheckCircle2, X, CloudUpload, ArrowRight,
  ArrowLeft, ArrowDown, ArrowUp, Sparkles, Lock, LogOut, AlertCircle,
  Image as ImageIcon, Compass, Search, SearchX, Star, History, Settings,
  ChevronDown, Plus, PlusCircle, RefreshCw, Upload, Download, Eye,
  EyeOff, Users, Package, ShieldCheck, Mail, Inbox, Palette, Shirt,
  Loader2, Check, ImagePlus, ExternalLink,
} from "lucide-react";

// Complete mapping: Material Symbol name → Lucide component
const ICON_MAP: Record<string, React.ComponentType<any>> = {
  // Actions
  close: X,
  check: Check,
  check_circle: CheckCircle2,
  delete: Trash2,
  refresh: RefreshCw,
  search: Search,
  search_off: SearchX,
  expand_more: ChevronDown,
  add: Plus,
  add_circle: PlusCircle,
  download: Download,

  // Navigation
  arrow_forward: ArrowRight,
  arrow_back: ArrowLeft,
  arrow_downward: ArrowDown,
  arrow_upward: ArrowUp,

  // Media
  image: ImageIcon,
  add_a_photo: Camera,
  add_photo_alternate: ImagePlus,
  cloud_upload: CloudUpload,
  cloud_download: Download,
  upload_file: Upload,

  // Features
  auto_awesome: Sparkles,
  favorite: Heart,
  palette: Palette,
  checkroom: Shirt,
  face: Users, // Closest match for face detection context
  science: Sparkles,
  visibility: Eye,

  // Status
  error: AlertCircle,
  error_outline: AlertCircle,
  progress_activity: Loader2,
  publish: ExternalLink,
  unpublished: EyeOff,
  inbox: Inbox,

  // Account/Settings
  lock_reset: Lock,
  logout: LogOut,
  settings: Settings,
  history: History,
  mail: Mail,
  group: Users,
  shield_person: ShieldCheck,
  inventory_2: Package,

  // Navigation/Places
  explore_off: Compass,
};

type AppIconProps = {
  name: string;
  size?: number;
  className?: string;
  filled?: boolean;
  style?: React.CSSProperties;
};

function AppIconInner({ name, size = 24, className = "", filled = false, style }: AppIconProps) {
  const IconComponent = ICON_MAP[name];

  if (!IconComponent) {
    // Development fallback — renders nothing in production
    if (process.env.NODE_ENV === "development") {
      console.warn(`[AppIcon] No mapping for icon: "${name}"`);
    }
    return <span className={className} style={{ width: size, height: size, display: "inline-block", ...style }} />;
  }

  // Special handling for icons that support filled state (Heart, Star, Check)
  const isFillable = name === "favorite" || name === "star" || name === "check_circle";

  return (
    <IconComponent
      size={size}
      className={className}
      fill={filled && isFillable ? "currentColor" : "none"}
      strokeWidth={filled && isFillable ? 0 : 2}
      style={style}
    />
  );
}

export const AppIcon = memo(AppIconInner);
export default AppIcon;
