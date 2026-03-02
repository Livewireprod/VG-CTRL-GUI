export const baseProfile = {
  id: "base",

  brand: {
    orgName: "Control System",
    productName: "Viewing Gallery",
    headings: {
      dashboardTitle: "Dashboard",
      dashboardSubtitle: "Control + Monitoring",
    },
    assets: {
      
      logo: "/brands/base/black.jpg",
      connectionBar: "/brands/base/black.jpg",
    },
  },

  features: {
    devTools: false,
    webrtc: false,
  },

  defaults: {
    wsUrl: "ws://127.0.0.1:9900/",
    pollMs: 0

  },

  ui: {
    colors: {
      primary: "#0E0E11",   
      secondary: "#1A1A1F", 
      tertiary: "#2A2A33",  
      text: "#E5E7EB",    
    },

    classes: {
      logo: "h-8 w-auto",   
      connectionBar: "h-8 w-auto",
      backgroundLogo:
        "pointer-events-none absolute left-1/2 top-1/2 w-72 md:w-96 lg:w-[40rem] -translate-x-1/2 -translate-y-1/2 opacity-10",
      connectionBarContainer:
        "flex items-center justify-between gap-4 border-b border-[var(--tertiary)] px-6 py-4",
      connectionBarOrgName: "text-sm font-medium",
      connectionBarStatus: "text-xs opacity-70",
      controlInput:
        "w-[320px] border border-white/10 bg-black/20 px-3 py-2 text-sm outline-none",
      controlButton:
        "border border-white/10 bg-black/20 px-3 py-2 text-sm font-medium hover:brightness-110",
      panelContainer: "bg-neutral-900/40 ring-1 ring-neutral-800",
      panelHeader: "flex items-center justify-between border-b border-[var(--tertiary)] px-5 py-4",
      panelTitle: "text-sm font-medium",
      panelAction: "text-xs opacity-70 hover:opacity-100",
      panelBody: "space-y-2 p-5 text-xs",
      panelItem: "px-3 py-2 ring-1 ring-neutral-800",
      panelEmpty: "text-neutral-500",
    },
  },
};
