export type UiLang = "en" | "sv" | "ro";

const translations: Record<string, Record<UiLang, string>> = {
  // Sidebar group labels
  "group.main": { en: "Main", sv: "Huvudmeny", ro: "Principal" },
  "group.settings": { en: "Settings", sv: "Inställningar", ro: "Setări" },
  "group.others": { en: "Others", sv: "Övrigt", ro: "Altele" },
  "group.management": { en: "Management", sv: "Hantering", ro: "Management" },

  // Sidebar menu items
  "menu.dashboard": { en: "Dashboard", sv: "Översikt", ro: "Panou" },
  "menu.operations": { en: "Operations", sv: "Operationer", ro: "Operațiuni" },
  "menu.invitations": { en: "Invitations", sv: "Inbjudningar", ro: "Invitații" },
  "menu.contracts": { en: "Contracts", sv: "Kontrakt", ro: "Contracte" },
  "menu.contract-template": { en: "Contract Template", sv: "Kontraktsmall", ro: "Șablon contract" },
  "menu.invitation-template": { en: "Invitation Template", sv: "Inbjudningsmall", ro: "Șablon invitație" },
  "menu.contract-data": { en: "Contract Data", sv: "Kontraktsdata", ro: "Date contract" },
  "menu.bank-list": { en: "Bank Information", sv: "Bankinformation", ro: "Informații bancare" },
  "menu.employee-register": { en: "Employee Register", sv: "Personalregister", ro: "Registru angajați" },
  "menu.company-register": { en: "Company Register", sv: "Företagsregister", ro: "Registru companii" },
  "menu.employee-id-settings": { en: "Employee ID", sv: "Anställnings-ID", ro: "ID angajat" },
  "menu.contract-id-settings": { en: "Contract ID", sv: "Kontrakts-ID", ro: "ID contract" },
  "menu.iso-standards": { en: "ISO Standards", sv: "ISO-standarder", ro: "Standarde ISO" },
  "menu.version-management": { en: "Version Management", sv: "Versionshantering", ro: "Gestionare versiuni" },
  "menu.process-guide": { en: "Process Guide", sv: "Processguide", ro: "Ghid procese" },
  "menu.audit-log": { en: "Audit Log", sv: "Revisionslogg", ro: "Jurnal audit" },
  "menu.user-management": { en: "Users", sv: "Användare", ro: "Utilizatori" },
  "menu.role-permissions": { en: "Role Permissions", sv: "Rollbehörigheter", ro: "Permisiuni roluri" },
  "menu.settings": { en: "Settings", sv: "Inställningar", ro: "Setări" },

  // Common UI strings
  "ui.signOut": { en: "Sign Out", sv: "Logga ut", ro: "Deconectare" },
  "ui.allApps": { en: "All Apps", sv: "Alla appar", ro: "Toate aplicațiile" },
  "ui.needSupport": { en: "Need Support", sv: "Behöver hjälp", ro: "Ai nevoie de ajutor" },
  "ui.needSupportDesc": { en: "Contact with one of our experts to get support.", sv: "Kontakta en av våra experter för att få hjälp.", ro: "Contactează un expert pentru asistență." },
  "ui.screen": { en: "Screen", sv: "Skärm", ro: "Ecran" },
  "ui.switchApp": { en: "Switch Application", sv: "Byt applikation", ro: "Schimbă aplicația" },
  "ui.switchOrg": { en: "Switch Organization", sv: "Byt organisation", ro: "Schimbă organizația" },
  "ui.backToAllApps": { en: "Back to All Apps", sv: "Tillbaka till alla appar", ro: "Înapoi la toate aplicațiile" },

  // Profile dialog
  "profile.title": { en: "Profile Settings", sv: "Profilinställningar", ro: "Setări profil" },
  "profile.avatar": { en: "Profile Picture", sv: "Profilbild", ro: "Fotografie profil" },
  "profile.uploadAvatar": { en: "Upload Photo", sv: "Ladda upp foto", ro: "Încarcă fotografie" },
  "profile.removeAvatar": { en: "Remove", sv: "Ta bort", ro: "Elimină" },
  "profile.changePassword": { en: "Change Password", sv: "Byt lösenord", ro: "Schimbă parola" },
  "profile.newPassword": { en: "New Password", sv: "Nytt lösenord", ro: "Parolă nouă" },
  "profile.confirmPassword": { en: "Confirm Password", sv: "Bekräfta lösenord", ro: "Confirmă parola" },
  "profile.updatePassword": { en: "Update Password", sv: "Uppdatera lösenord", ro: "Actualizează parola" },
  "profile.language": { en: "Preferred Language", sv: "Föredraget språk", ro: "Limba preferată" },
  "profile.save": { en: "Save", sv: "Spara", ro: "Salvează" },
};

export function t(key: string, lang: UiLang = "en"): string {
  return translations[key]?.[lang] ?? translations[key]?.en ?? key;
}

export const LANGUAGE_OPTIONS: { value: UiLang; label: string; flag: string }[] = [
  { value: "en", label: "English", flag: "🇬🇧" },
  { value: "sv", label: "Svenska", flag: "🇸🇪" },
  { value: "ro", label: "Română", flag: "🇷🇴" },
];
