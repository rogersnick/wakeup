export const clerkAppearance = {
  variables: {
    colorPrimary: "#3B82F6",
    colorText: "#111827",
    colorTextSecondary: "#4B5563",
    colorBackground: "#FFFFFF",
    colorInputBackground: "#F3F4F6",
    colorInputText: "#111827",
    borderRadius: "0.375rem",
    fontFamily: "var(--font-outfit), system-ui, sans-serif",
  },
  elements: {
    card: {
      boxShadow: "none",
      border: "none",
      backgroundColor: "#FFFFFF",
    },
    headerTitle: {
      fontWeight: "700",
      letterSpacing: "-0.02em",
    },
    formButtonPrimary: {
      boxShadow: "none",
      backgroundColor: "#3B82F6",
      fontWeight: "600",
      height: "3rem",
      "&:hover": {
        backgroundColor: "#2563EB",
      },
    },
    formFieldInput: {
      boxShadow: "none",
      backgroundColor: "#F3F4F6",
      border: "none",
      "&:focus": {
        backgroundColor: "#FFFFFF",
        border: "2px solid #3B82F6",
      },
    },
    footerActionLink: {
      color: "#3B82F6",
      fontWeight: "600",
    },
    socialButtonsBlockButton: {
      boxShadow: "none",
      border: "2px solid #E5E7EB",
    },
    userButtonPopoverCard: {
      boxShadow: "none",
      border: "2px solid #E5E7EB",
    },
  },
};
