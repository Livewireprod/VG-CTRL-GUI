import { baseProfile } from "./base";
import { deepMerge } from "./merge";

export const mercedes = deepMerge(baseProfile, {
  id: "mercedes",

  brand: {
    orgName: "Mercedes AMG Petronas Formula One Team",
    productName: "Viewing Gallery",
    headings: {
      dashboardTitle: "Mercedes Dashboard",
      dashboardSubtitle: "Control + Monitoring",
    },
    assets: {
      logo: "/brands/mercedes/logo.png",
      connectionBar: "/brands/mercedes/logo.png",
    },
  },

//   features: {
//     devTools: true,   
//     webrtc: false,
//   },

  defaults: {
    wsUrl: "ws://127.0.0.1:9900/",
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
