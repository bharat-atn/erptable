

## "Coming Soon" Teaser Dialogs for Upcoming Applications

When a user clicks on a "Coming Soon" app card, instead of just showing a brief toast notification, a rich teaser dialog will open with feature highlights and a roadmap preview for that application.

### Teaser Content

**Forestry Project Manager**
- Project planning and tracking for clearing and planting operations
- Team assignment and crew management across multiple sites
- GPS-based area mapping and progress visualization
- Financial planning with cost tracking per project phase
- Equipment and machinery allocation
- Weather-dependent scheduling and calendar integration
- Reporting dashboards for project status and profitability

**Payroll Management**
- Automated salary calculation based on hourly, monthly, or piece-work rates
- Integration with HR contracts for seamless rate importing
- Tax deduction and social contribution handling
- Payslip generation and distribution
- Overtime and premium pay calculations
- Multi-currency support for international workforce
- Export to accounting systems

**Employee Hub (Mobile App)**
- Personal profile and document management
- View and digitally sign employment contracts
- Daily attendance and time reporting
- Leave requests and approval tracking
- Push notifications for important updates
- Access to company policies and Code of Conduct
- Direct messaging with HR department

### UI Design

Each teaser opens as a Dialog containing:
- The app's icon and name at the top (matching launcher card colors)
- A short intro paragraph
- A list of planned features shown as checkmark bullet points
- A subtle "Expected availability" note at the bottom
- A "Notify Me" button (visual only for now) and a "Close" button

### Technical Details

**File to modify: `src/components/dashboard/AppLauncher.tsx`**

1. Add a `TEASER_CONTENT` map keyed by app id, containing the intro text, feature list, and expected timeline for each upcoming app
2. Create a `TeaserDialog` component that renders the teaser content in a styled Dialog
3. Update `handleLaunch` so that clicking a "Coming Soon" card opens the teaser dialog instead of firing a toast
4. Add state variables `teaserOpen` and `teaserAppId` to control which teaser is shown

No other files need changes -- this is self-contained within the App Launcher.

