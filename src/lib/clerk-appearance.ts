export const clerkAppearance = {
  variables: {
    colorPrimary:       "#a78bfa",
    colorText:          "#f1f5f9",
    colorTextSecondary: "#94a3b8",
    colorBackground:    "#1a1827",
    colorInputBackground: "#0f0e17",
    colorInputText:     "#f1f5f9",
    colorNeutral:       "#94a3b8",
    borderRadius:       "12px",
    fontFamily:         "var(--font-jakarta, var(--font-outfit)), system-ui, sans-serif",
  },
  elements: {
    card: {
      backgroundColor: "#1a1827",
      border:          "2px solid #2d2a3e",
      boxShadow:       "6px 6px 0px 0px #4c1d95",
      borderRadius:    "16px",
    },
    headerTitle: {
      fontFamily:   "var(--font-outfit), system-ui, sans-serif",
      fontWeight:   "800",
      letterSpacing: "-0.02em",
      color:        "#f1f5f9",
    },
    formButtonPrimary: {
      backgroundColor: "#a78bfa",
      color:           "#0f0e17",
      fontWeight:      "700",
      height:          "2.75rem",
      border:          "2px solid #6d28d9",
      boxShadow:       "4px 4px 0px 0px #4c1d95",
      borderRadius:    "9999px",
      "&:hover": {
        transform:  "translate(-2px, -2px)",
        boxShadow: "6px 6px 0px 0px #4c1d95",
      },
    },
    formFieldInput: {
      backgroundColor: "#0f0e17",
      border:          "2px solid #2d2a3e",
      borderRadius:    "8px",
      color:           "#f1f5f9",
      "&:focus": {
        borderColor: "#a78bfa",
        boxShadow:   "4px 4px 0px 0px #4c1d95",
      },
    },
    footerActionLink: {
      color:      "#a78bfa",
      fontWeight: "600",
    },
    socialButtonsBlockButton: {
      backgroundColor: "#0f0e17",
      border:          "2px solid #2d2a3e",
      color:           "#f1f5f9",
      borderRadius:    "9999px",
      "&:hover": {
        borderColor: "#a78bfa",
      },
    },
    userButtonPopoverCard: {
      backgroundColor: "#1a1827",
      border:          "2px solid #2d2a3e",
      boxShadow:       "6px 6px 0px 0px #4c1d95",
      borderRadius:    "16px",
    },
    userButtonPopoverActionButton: {
      color: "#f1f5f9",
      "&:hover": {
        backgroundColor: "#2d2a3e",
      },
    },
  },
};
