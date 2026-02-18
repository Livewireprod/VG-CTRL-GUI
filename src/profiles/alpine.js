import { baseProfile } from "./base";
import { deepMerge } from "./merge";

export const alpine = deepMerge(baseProfile, {
  id: "alpine",

  brand: {
    orgName: "BWT Alpine F1 Team",
    productName: "Viewing Gallery",
    headings: {
      dashboardTitle: "Alpine Dashboard",
      dashboardSubtitle: "Control + Monitoring",
    },
    assets: {
      logo: "/brands/alpine/Logo3.png",
      connectionBar: "/brands/alpine/Logo3.png",
    },
  },

  features: {
    devTools: true,   
    webrtc: false,
  },

  defaults: {
    wsUrl: "ws://localhost:9900/",
  },

ui: {
    colors: {
      primary: "#06324d",
      secondary: "#00a2fa",
      tertiary: "#FD4BC7",
      text: "#ffffff"
    },
     classes: {
      logo: "h-8 w-auto invert", 
      connectionBar: "h-8 w-auto invert"
    }
  },

  

});
