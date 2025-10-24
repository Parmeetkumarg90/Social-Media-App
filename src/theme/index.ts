import { createTheme } from "@mui/material/styles";

const theme = createTheme({
    palette: {
        mode: "dark",
        background: {
            default: "#121212",
            paper: "#282828",
        },
        text: {
            primary: "#ffffff",
            secondary: "#bdbdbd",
        },
    },
    components: {
        MuiCard: {
            styleOverrides: {
                root: {
                    backgroundColor: "#282828",
                    margin: "0",
                    borderRadius: "10px",
                    overflowY: "auto",
                },
            },
        },
        MuiButton: {
            styleOverrides: {
                root: {
                    width: "60%",
                    minWidth: "fit-content",
                    fontSize: "1rem",
                    border: "1px solid #757575",
                    color: "#1A1A1A",
                    padding: "1%",
                    backgroundColor: "yellow",
                    fontWeight: "bolder",
                    margin: "1% 5%",
                    borderRadius: "10px",
                    "&:hover": {
                        color: "#8E8E8E",
                    },
                },
            },
        },
        MuiTypography: {
            styleOverrides: {
                root: {
                    fontWeight: "bolder",
                    fontSize: "0.9rem",
                    color: "#fff",
                },
            },
        },
        MuiList: {
            styleOverrides: {
                root: {
                    minWidth: "100%",
                    maxWidth: "fit-content",
                }
            }
        },
        MuiListItem: {
            styleOverrides: {
                root: {
                    maxWidth: "100%",
                }
            }
        },
        MuiTextField: {
            defaultProps: {
                variant: "outlined",
            },
            styleOverrides: {
                root: {
                    width: "80%",
                    background: "#282828",
                    color: "#fff",
                    "& .MuiInputBase-input": {
                        color: "#fff",
                    },
                    "& .MuiInputLabel-root": {
                        color: "#bdbdbd",
                    },
                    "& .MuiOutlinedInput-notchedOutline": {
                        borderColor: "#757575",
                    },
                    "&:hover .MuiOutlinedInput-notchedOutline": {
                        borderColor: "white",
                    },
                    "&.Mui-focused .MuiOutlinedInput-notchedOutline": {
                        borderColor: "yellow",
                    },
                },
            },
        },
    },
});

export default theme;
