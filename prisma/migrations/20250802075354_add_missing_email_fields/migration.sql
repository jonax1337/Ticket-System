-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_system_settings" (
    "id" TEXT NOT NULL PRIMARY KEY DEFAULT 'system',
    "appName" TEXT NOT NULL DEFAULT 'Support Dashboard',
    "slogan" TEXT,
    "logoUrl" TEXT,
    "hideAppName" BOOLEAN NOT NULL DEFAULT false,
    "themeColor" TEXT NOT NULL DEFAULT 'default',
    "ticketPrefix" TEXT NOT NULL DEFAULT 'T',
    "ticketNumberType" TEXT NOT NULL DEFAULT 'sequential',
    "ticketNumberLength" INTEGER NOT NULL DEFAULT 6,
    "lastTicketNumber" INTEGER NOT NULL DEFAULT 0,
    "automationEnabled" BOOLEAN NOT NULL DEFAULT true,
    "automationWarningDays" INTEGER NOT NULL DEFAULT 7,
    "automationCloseDays" INTEGER NOT NULL DEFAULT 14,
    "automationCheckInterval" INTEGER NOT NULL DEFAULT 60,
    "emailSubjectPrefix" TEXT NOT NULL DEFAULT '[Ticket {{ticketNumber}}]',
    "emailBaseTemplate" TEXT,
    "emailBaseTemplateActive" BOOLEAN NOT NULL DEFAULT true,
    "emailShowLogo" BOOLEAN NOT NULL DEFAULT true,
    "emailHideAppName" BOOLEAN NOT NULL DEFAULT false,
    "emailHideSlogan" BOOLEAN NOT NULL DEFAULT false,
    "emailMonochromeLogo" BOOLEAN NOT NULL DEFAULT false,
    "emailFixedHeaderColor" BOOLEAN NOT NULL DEFAULT false,
    "emailHeaderColor" TEXT NOT NULL DEFAULT '#2563eb',
    "emailDisclaimerText" TEXT NOT NULL DEFAULT 'This email was sent from {{systemName}} support system.',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);
INSERT INTO "new_system_settings" ("appName", "automationCheckInterval", "automationCloseDays", "automationEnabled", "automationWarningDays", "createdAt", "emailBaseTemplate", "emailBaseTemplateActive", "emailHideAppName", "emailHideSlogan", "emailShowLogo", "emailSubjectPrefix", "hideAppName", "id", "lastTicketNumber", "logoUrl", "slogan", "themeColor", "ticketNumberLength", "ticketNumberType", "ticketPrefix", "updatedAt") SELECT "appName", "automationCheckInterval", "automationCloseDays", "automationEnabled", "automationWarningDays", "createdAt", "emailBaseTemplate", "emailBaseTemplateActive", "emailHideAppName", "emailHideSlogan", "emailShowLogo", "emailSubjectPrefix", "hideAppName", "id", "lastTicketNumber", "logoUrl", "slogan", "themeColor", "ticketNumberLength", "ticketNumberType", "ticketPrefix", "updatedAt" FROM "system_settings";
DROP TABLE "system_settings";
ALTER TABLE "new_system_settings" RENAME TO "system_settings";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
