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
      connectionBar: "h-8 w-auto"
    },
  },
};
