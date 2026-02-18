import { baseProfile } from "./base";

export const cadillac = {
  ...baseProfile,
  id: "cadillac",

  brand: {
    ...baseProfile.brand,
    orgName: "CADILLAC F1 TEAM",
    headings: {
      dashboardTitle: "Cadillac Dashboard",
      dashboardSubtitle: "Viewing Gallery Control",
    },
    assets: {
      logo: "/brands/cadillac/logo.png",
      connectionBar: "/brands/cadillac/Emblem.png",
      wordmark: "/brands/cadillac/wordmark.svg",
    },
  },

  ui: {
    ...baseProfile.ui,
    colors: {
      primary: "#0E0E11",   
      secondary: "#1A1A1F", 
      tertiary: "#2A2A33",  
      text: "#E5E7EB",    
    },
    classes: {
      ...baseProfile.ui.classes,
      connectionBar: "h-8 w-auto invert"
    },
    typography: {
      fontFamily: '"Cadillac Gothic Narrow", sans-serif',
    },
  },

  features: {
    ...baseProfile.features,
    webrtc: true,
    devTools: false,
  },

  data: {
    ...baseProfile.data,
    feeds: [
      { id: "FEED_01", label: "Program" },
      { id: "FEED_02", label: "Onboard" },
      { id: "FEED_03", label: "Pit Lane" },
    ],
  },
};
