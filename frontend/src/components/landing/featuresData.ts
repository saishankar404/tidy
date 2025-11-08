interface Feature {
  title: string;
  description: string;
  color: string;
}

export const features: Feature[] = [
  {
    title: "Lightning Fast",
    description: "Built for speed. Deploy your projects in seconds, not hours. Hot reload keeps you in the flow.",
    color: "#201E1F"
  },
  {
    title: "Type Safe",
    description: "Catch errors before they ship. Full TypeScript support with intelligent auto-completion.",
    color: "#C9FC31"
  },
  {
    title: "Developer First",
    description: "Designed by developers, for developers. Beautiful DX with powerful CLI tools and intuitive APIs.",
    color: "#7D53FF"
  },
  {
    title: "Zero Config",
    description: "Start building immediately. Smart defaults that just work, with full customization when you need it.",
    color: "#C9BCF4"
  }
]