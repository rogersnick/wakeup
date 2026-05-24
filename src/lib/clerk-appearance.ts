export const clerkAppearance = {
  variables: {
    colorPrimary: "#ffffff",
    colorText: "#ffffff",
    colorTextSecondary: "#a3a3a3",
    colorBackground: "#000000",
    colorInputBackground: "#000000",
    colorInputText: "#ffffff",
    colorNeutral: "#a3a3a3",
    borderRadius: "0px",
    fontFamily: "var(--font-jakarta, var(--font-outfit)), system-ui, sans-serif",
  },
  elements: {
    card: {
      backgroundColor: "#000000",
      border: "2px solid #ffffff",
      boxShadow: "none",
      borderRadius: "0px",
    },
    headerTitle: {
      fontFamily: "var(--font-outfit), system-ui, sans-serif",
      fontWeight: "700",
      letterSpacing: "-0.03em",
      color: "#ffffff",
    },
    headerSubtitle: {
      color: "#a3a3a3",
    },
    formButtonPrimary: {
      backgroundColor: "#ffffff",
      color: "#000000",
      fontFamily: "var(--font-mono), monospace",
      fontSize: "0.75rem",
      fontWeight: "500",
      height: "3rem",
      letterSpacing: "0.1em",
      textTransform: "uppercase",
      border: "2px solid #ffffff",
      boxShadow: "none",
      borderRadius: "0px",
      transition: "background-color 100ms, color 100ms",
      "&:hover": {
        backgroundColor: "#000000",
        color: "#ffffff",
      },
      "&:focusVisible": {
        outline: "3px solid #ffffff",
        outlineOffset: "3px",
      },
    },
    formFieldInput: {
      backgroundColor: "#000000",
      border: "2px solid #ffffff",
      borderRadius: "0px",
      color: "#ffffff",
      boxShadow: "none",
      "&:focus": {
        borderColor: "#ffffff",
        boxShadow: "none",
        outline: "3px solid #ffffff",
        outlineOffset: "2px",
      },
    },
    footerActionLink: {
      color: "#ffffff",
      fontWeight: "600",
      textDecoration: "underline",
      textUnderlineOffset: "4px",
    },
    socialButtonsBlockButton: {
      backgroundColor: "#000000",
      border: "2px solid #ffffff",
      color: "#ffffff",
      borderRadius: "0px",
      boxShadow: "none",
      "&:hover": {
        backgroundColor: "#ffffff",
        color: "#000000",
      },
    },
    userButtonPopoverCard: {
      backgroundColor: "#000000",
      border: "2px solid #ffffff",
      boxShadow: "none",
      borderRadius: "0px",
    },
    userButtonPopoverActionButton: {
      color: "#ffffff",
      "&:hover": {
        backgroundColor: "#0a0a0a",
      },
    },
  },
};
