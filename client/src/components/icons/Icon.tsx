/**
 * Icon component — replaces Material Symbols with Lucide React icons.
 * 
 * Eliminates the ~300KB Material Symbols variable font download.
 * Lucide icons are tree-shaken SVGs (~200 bytes each, inline, instant render).
 *
 * Usage: <Icon name="favorite" className="text-red-500" size={20} />
 * Supports filled variant via `filled` prop for heart/star icons.
 */

import {
  Heart, Trash2, Camera, CheckCircle2, X, CloudUpload, ArrowRight,
  Sparkles, Lock, LogOut, AlertCircle, Image as ImageIcon, Compass,
  Search, SearchX, Star, History, Settings, ChevronDown, Plus,
  RefreshCw, Upload, Download, Eye, EyeOff, Users, BarChart3,
  Package, ShieldCheck, Mail, Inbox, MessageSquare, Lightbulb, Bug,
  Palette, ShoppingBag, Bookmark, Clock, Fingerprint, TrendingUp,
  Shirt, ChevronLeft, Share2, Loader2, Check, Copy, ExternalLink,
  CircleDot, type LucideProps,
} from "lucide-react";
import { memo } from "react";

// Map Material Symbol names → Lucide components
const ICON_MAP: Record<string, React.ComponentType<LucideProps>> = {
  favorite: Heart,
  delete: Trash2,
  add_a_photo: Camera,
  check_circle: CheckCircle2,
  close: X,
  cloud_upload: CloudUpload,
  arrow_forward: ArrowRight,
  auto_awesome: Sparkles,
  lock_reset: Lock,
  logout: LogOut,
  error: AlertCircle,
  image: ImageIcon,
  explore_off: Compass,
  search: Search,
  search_off: SearchX,
  star: Star,
  history: History,
  settings: Settings,
  expand_more: ChevronDown,
  add: Plus,
  add_circle: Plus,
  refresh: RefreshCw,
  upload_file: Upload,
  download: Download,
  visibility: Eye,
  visibility_off: EyeOff,
  group: Users,
  analytics: BarChart3,
  inventory_2: Package,
  shield_person: ShieldCheck,
  mail: Mail,
  inbox: Inbox,
  chat: MessageSquare,
  lightbulb: Lightbulb,
  bug_report: Bug,
  palette: Palette,
  shopping_bag: ShoppingBag,
  bookmark: Bookmark,
  checkroom: Shirt,
  face: Fingerprint,
  insights: TrendingUp,
  arrow_back: ChevronLeft,
  share: Share2,
  progress_activity: Loader2,
  check: Check,
  copy: Copy,
  publish: ExternalLink,
  unpublished: EyeOff,
  cloud_download: Download,
  cloud_sync: RefreshCw,
  style: Shirt,
  edit: CircleDot,
  feedback: MessageSquare,
};

type IconProps = {
  name: string;
  className?: string;
  size?: number;
  filled?: boolean;
  style?: React.CSSProperties;
};

function IconComponent({ name, className = "", size = 24, filled, style }: IconProps) {
  const LucideIcon = ICON_MAP[name];

  // Fallback: render the text for unmapped icons (graceful degradation)
  if (!LucideIcon) {
    return (
      <span className={`material-symbols-outlined ${className}`} style={style}>
        {name}
      </span>
    );
  }

  return (
    <LucideIcon
      className={className}
      size={size}
      fill={filled ? "currentColor" : "none"}
      strokeWidth={filled ? 0 : 2}
      style={style}
    />
  );
}

export const Icon = memo(IconComponent);
export default Icon;
