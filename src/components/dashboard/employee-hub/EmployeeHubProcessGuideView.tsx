import {
  LogIn, LogOut, Camera, MapPin, Clock, Calendar, FileText,
  User, Shield, CheckCircle, AlertCircle, Smartphone, BookOpen,
  HelpCircle, ChevronRight, Zap, Bell, Navigation,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface GuideSection {
  icon: React.ElementType;
  title: string;
  items: string[];
}

const purposePoints = [
  { icon: Clock, text: "Record your work hours with GPS-verified clock in/out" },
  { icon: MapPin, text: "Prove your location with geofence validation" },
  { icon: Camera, text: "Photo verification for attendance compliance" },
  { icon: Calendar, text: "View your daily and weekly schedule" },
  { icon: FileText, text: "Access your employment contracts anytime" },
  { icon: User, text: "Manage your personal profile and information" },
];

const howToClockIn: GuideSection = {
  icon: LogIn,
  title: "How to Clock In",
  items: [
    "Tap the large green 'Clock In' button on the Home screen",
    "Allow location access when prompted (required for geofence)",
    "Take a selfie photo when the camera opens",
    "Take a photo of your work environment",
    "Review the location status badge (green = inside work zone)",
    "Tap 'Confirm Clock In' to complete",
  ],
};

const howToClockOut: GuideSection = {
  icon: LogOut,
  title: "How to Clock Out",
  items: [
    "Tap the red 'Clock Out' button (appears when clocked in)",
    "Follow the same photo capture process",
    "Your GPS location will be recorded automatically",
    "Confirm to end your work session",
  ],
};

const geofenceGuide: GuideSection = {
  icon: Shield,
  title: "Understanding Geofence",
  items: [
    "The geofence ensures you are physically present at your assigned work location before clocking in or out",
    "Your employer defines approved work zones (e.g. forest sites, offices) — you must be within one to pass validation",
    "Green badge = You are inside an approved work area and can proceed normally",
    "Yellow badge = You are outside all known work zones — this will be flagged for review by your supervisor",
    "The system protects both you and the employer by proving you were on-site during work hours",
    "Ensure GPS is enabled and allow location permission for accurate zone detection",
  ],
};

const photoRequirements: GuideSection = {
  icon: Camera,
  title: "Photo Requirements",
  items: [
    "Selfie: Clear face photo to verify your identity",
    "Environment: Photo of your surroundings/worksite",
    "Both photos are required for each clock in/out",
    "Good lighting improves photo quality",
    "Photos are stored securely for compliance",
  ],
};

const troubleshooting = [
  { q: "Location not working?", a: "Enable GPS in your phone settings and allow location permission for this app." },
  { q: "Camera not opening?", a: "Allow camera permission when prompted. Check phone settings if blocked." },
  { q: "Clock button not appearing?", a: "Refresh the app. If already clocked in, you'll see 'Clock Out' instead." },
  { q: "Outside geofence warning?", a: "This is normal if you're away from designated work zones. HR will review." },
];

function SectionCard({ section }: { section: GuideSection }) {
  const Icon = section.icon;
  return (
    <div className="bg-card rounded-2xl border border-border/40 p-4 shadow-sm">
      <h3 className="font-bold text-sm mb-3 flex items-center gap-2 text-emerald-700 dark:text-emerald-500">
        <Icon className="w-4 h-4" /> {section.title}
      </h3>
      <ol className="space-y-2">
        {section.items.map((item, i) => (
          <li key={i} className="flex items-start gap-2.5 text-xs text-muted-foreground">
            <span className="w-5 h-5 rounded-full bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 flex items-center justify-center shrink-0 text-[10px] font-bold">
              {i + 1}
            </span>
            <span className="pt-0.5 leading-relaxed">{item}</span>
          </li>
        ))}
      </ol>
    </div>
  );
}

export function EmployeeHubProcessGuideView() {
  return (
    <div className="space-y-5 px-4 pt-2 pb-24">
      {/* Header */}
      <div className="bg-gradient-to-br from-emerald-600 to-emerald-700 rounded-3xl p-5 text-white shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-24 h-24 bg-white/10 rounded-full -mr-6 -mt-6" />
        <div className="relative">
          <BookOpen className="w-6 h-6 mb-2 opacity-80" />
          <h1 className="text-lg font-bold">Process Guide</h1>
          <p className="text-xs text-white/80 mt-1">
            Learn how to use the Employee Hub app effectively.
          </p>
        </div>
      </div>

      {/* What is this app? */}
      <div className="bg-card rounded-2xl border border-border/40 p-4 shadow-sm">
        <h3 className="font-bold text-sm mb-2 flex items-center gap-2">
          <Smartphone className="w-4 h-4 text-emerald-600" /> What is Employee Hub?
        </h3>
        <p className="text-xs text-muted-foreground leading-relaxed mb-3">
          Employee Hub is your mobile time tracking and attendance app. It allows you to clock in and out of work with GPS verification and photo proof, ensuring accurate and compliant time records.
        </p>
        <div className="space-y-2">
          {purposePoints.map((point, i) => {
            const Icon = point.icon;
            return (
              <div key={i} className="flex items-center gap-2.5 text-xs">
                <div className="w-6 h-6 rounded-lg bg-emerald-50 dark:bg-emerald-950/20 flex items-center justify-center shrink-0">
                  <Icon className="w-3.5 h-3.5 text-emerald-600" />
                </div>
                <span>{point.text}</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Why use it? */}
      <div className="bg-card rounded-2xl border border-border/40 p-4 shadow-sm">
        <h3 className="font-bold text-sm mb-2 flex items-center gap-2">
          <Zap className="w-4 h-4 text-emerald-600" /> Why Use Employee Hub?
        </h3>
        <div className="space-y-2.5">
          <div className="flex items-start gap-2.5">
            <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
            <div>
              <p className="text-xs font-medium">Accurate Time Records</p>
              <p className="text-[10px] text-muted-foreground">GPS-verified clock times ensure precise payroll calculation.</p>
            </div>
          </div>
          <div className="flex items-start gap-2.5">
            <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
            <div>
              <p className="text-xs font-medium">Compliance & Verification</p>
              <p className="text-[10px] text-muted-foreground">Photo proof meets employer and regulatory requirements.</p>
            </div>
          </div>
          <div className="flex items-start gap-2.5">
            <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
            <div>
              <p className="text-xs font-medium">No Paperwork</p>
              <p className="text-[10px] text-muted-foreground">Digital records replace manual timesheets.</p>
            </div>
          </div>
          <div className="flex items-start gap-2.5">
            <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
            <div>
              <p className="text-xs font-medium">Access Anywhere</p>
              <p className="text-[10px] text-muted-foreground">View schedules, contracts, and payslips on your phone.</p>
            </div>
          </div>
        </div>
      </div>

      {/* Step-by-step guides */}
      <SectionCard section={howToClockIn} />
      <SectionCard section={howToClockOut} />
      <SectionCard section={geofenceGuide} />
      <SectionCard section={photoRequirements} />

      {/* Navigation guide */}
      <div className="bg-card rounded-2xl border border-border/40 p-4 shadow-sm">
        <h3 className="font-bold text-sm mb-3 flex items-center gap-2 text-emerald-700 dark:text-emerald-500">
          <Navigation className="w-4 h-4" /> App Navigation
        </h3>
        <p className="text-xs text-muted-foreground mb-3">
          Use the bottom navigation bar to switch between sections:
        </p>
        <div className="grid grid-cols-5 gap-1 text-center">
          {[
            { icon: "🏠", label: "Home", desc: "Clock in/out" },
            { icon: "📅", label: "Schedule", desc: "View shifts" },
            { icon: "📖", label: "Guide", desc: "This manual" },
            { icon: "📄", label: "Contract", desc: "Agreements" },
            { icon: "👤", label: "Profile", desc: "Your info" },
          ].map((item) => (
            <div key={item.label} className="p-2 rounded-xl bg-muted/30">
              <div className="text-lg mb-0.5">{item.icon}</div>
              <p className="text-[9px] font-semibold">{item.label}</p>
              <p className="text-[8px] text-muted-foreground">{item.desc}</p>
            </div>
          ))}
        </div>
      </div>

      {/* FAQ / Troubleshooting */}
      <div className="bg-card rounded-2xl border border-border/40 p-4 shadow-sm">
        <h3 className="font-bold text-sm mb-3 flex items-center gap-2 text-emerald-700 dark:text-emerald-500">
          <HelpCircle className="w-4 h-4" /> Troubleshooting
        </h3>
        <div className="space-y-3">
          {troubleshooting.map((item, i) => (
            <div key={i} className="border-b border-border/30 pb-2.5 last:border-0 last:pb-0">
              <p className="text-xs font-semibold flex items-center gap-1.5">
                <AlertCircle className="w-3.5 h-3.5 text-amber-500" />
                {item.q}
              </p>
              <p className="text-[10px] text-muted-foreground mt-0.5 ml-5">{item.a}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Future Enhancements */}
      <div className="bg-card rounded-2xl border border-border/40 p-4 shadow-sm">
        <h3 className="font-bold text-sm mb-3 flex items-center gap-2 text-emerald-700 dark:text-emerald-500">
          <Zap className="w-4 h-4" /> Planned Enhancements
        </h3>
        <p className="text-xs text-muted-foreground mb-3">
          Features that may be added to improve your experience:
        </p>
        <div className="space-y-2">
          {[
            { icon: "🔔", title: "Push Notifications", desc: "Reminders to clock in/out and schedule alerts" },
            { icon: "📊", title: "Weekly Summary", desc: "Dashboard showing hours worked, earnings preview" },
            { icon: "📍", title: "Multiple Work Sites", desc: "Switch between different project locations" },
            { icon: "🌐", title: "Offline Mode", desc: "Clock in/out without internet, sync when connected" },
            { icon: "🗓️", title: "Shift Swapping", desc: "Request shift changes with colleagues" },
            { icon: "📝", title: "Leave Requests", desc: "Submit vacation and sick leave directly in-app" },
            { icon: "💬", title: "Team Chat", desc: "Communicate with your team and supervisor" },
            { icon: "📈", title: "Productivity Stats", desc: "View your performance metrics and achievements" },
            { icon: "🎯", title: "Task Assignments", desc: "Receive and complete daily work tasks" },
            { icon: "🪪", title: "Digital ID Badge", desc: "Show your employee credentials on screen" },
            { icon: "💰", title: "Expense Reporting", desc: "Submit travel and work expenses for reimbursement" },
            { icon: "📱", title: "Biometric Login", desc: "Face ID or fingerprint for faster access" },
          ].map((item, i) => (
            <div key={i} className="flex items-start gap-2.5 p-2 rounded-lg bg-muted/30 border border-border/20">
              <span className="text-base shrink-0">{item.icon}</span>
              <div>
                <p className="text-xs font-semibold">{item.title}</p>
                <p className="text-[10px] text-muted-foreground">{item.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Need help? */}
      <div className="bg-emerald-50 dark:bg-emerald-950/20 rounded-2xl border border-emerald-600/20 p-4 text-center">
        <Bell className="w-6 h-6 text-emerald-600 mx-auto mb-2" />
        <p className="text-xs font-semibold text-emerald-700 dark:text-emerald-400">Need More Help?</p>
        <p className="text-[10px] text-muted-foreground mt-1">
          Contact your HR manager or supervisor for assistance with the app or your schedule.
        </p>
      </div>
    </div>
  );
}
