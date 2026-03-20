import * as React from "react";
import { styled, useTheme } from "@mui/material/styles";
import Box from "@mui/material/Box";
import MuiDrawer from "@mui/material/Drawer";
import MuiAppBar from "@mui/material/AppBar";
import Toolbar from "@mui/material/Toolbar";
import List from "@mui/material/List";
import CssBaseline from "@mui/material/CssBaseline";
import Typography from "@mui/material/Typography";
import Divider from "@mui/material/Divider";
import IconButton from "@mui/material/IconButton";
import MenuIcon from "@mui/icons-material/Menu";
import ChevronLeftIcon from "@mui/icons-material/ChevronLeft";
import ChevronRightIcon from "@mui/icons-material/ChevronRight";
import ListItem from "@mui/material/ListItem";
import ListItemButton from "@mui/material/ListItemButton";
import ListItemIcon from "@mui/material/ListItemIcon";
import ListItemText from "@mui/material/ListItemText";
import InboxIcon from "@mui/icons-material/MoveToInbox";
import MailIcon from "@mui/icons-material/Mail";

const drawerWidth = 240;

const openedMixin = (theme) => ({
  width: drawerWidth,
  transition: theme.transitions.create("width", {
    easing: theme.transitions.easing.sharp,
    duration: theme.transitions.duration.enteringScreen,
  }),
  overflowX: "hidden",
});

const closedMixin = (theme) => ({
  transition: theme.transitions.create("width", {
    easing: theme.transitions.easing.sharp,
    duration: theme.transitions.duration.leavingScreen,
  }),
  overflowX: "hidden",
  width: `calc(${theme.spacing(7)} + 1px)`,
  [theme.breakpoints.up("sm")]: {
    width: `calc(${theme.spacing(8)} + 1px)`,
  },
});

const DrawerHeader = styled("div")(({ theme }) => ({
  display: "flex",
  alignItems: "center",
  justifyContent: "flex-end",
  padding: theme.spacing(0, 1),
  // necessary for content to be below app bar
  ...theme.mixins.toolbar,
}));

const AppBar = styled(MuiAppBar, {
  shouldForwardProp: (prop) => prop !== "open",
})(({ theme }) => ({
  zIndex: theme.zIndex.drawer + 1,
  transition: theme.transitions.create(["width", "margin"], {
    easing: theme.transitions.easing.sharp,
    duration: theme.transitions.duration.leavingScreen,
  }),
  variants: [
    {
      props: ({ open }) => open,
      style: {
        marginLeft: drawerWidth,
        width: `calc(100% - ${drawerWidth}px)`,
        transition: theme.transitions.create(["width", "margin"], {
          easing: theme.transitions.easing.sharp,
          duration: theme.transitions.duration.enteringScreen,
        }),
      },
    },
  ],
}));

const Drawer = styled(MuiDrawer, {
  shouldForwardProp: (prop) => prop !== "open",
})(({ theme }) => ({
  width: drawerWidth,
  flexShrink: 0,
  whiteSpace: "nowrap",
  boxSizing: "border-box",
  variants: [
    {
      props: ({ open }) => open,
      style: {
        ...openedMixin(theme),
        "& .MuiDrawer-paper": openedMixin(theme),
      },
    },
    {
      props: ({ open }) => !open,
      style: {
        ...closedMixin(theme),
        "& .MuiDrawer-paper": closedMixin(theme),
      },
    },
  ],
}));

export default function MiniDrawer() {
  const theme = useTheme();
  const [open, setOpen] = React.useState(false);

  const handleDrawerOpen = () => {
    setOpen(true);
  };

  const handleDrawerClose = () => {
    setOpen(false);
  };

  return (
    <Box sx={{ display: "flex" }}>
      <CssBaseline />
      <AppBar position="fixed" open={open}>
        <Toolbar>
          <IconButton
            color="inherit"
            aria-label="open drawer"
            onClick={handleDrawerOpen}
            edge="start"
            sx={[
              {
                marginRight: 5,
              },
              open && { display: "none" },
            ]}
          >
            <MenuIcon />
          </IconButton>
          <Typography variant="h6" noWrap component="div">
            Sampark AI
          </Typography>
        </Toolbar>
      </AppBar>
      <Drawer variant="permanent" open={open}>
        <DrawerHeader>
          <IconButton onClick={handleDrawerClose}>
            {theme.direction === "rtl" ? (
              <ChevronRightIcon />
            ) : (
              <ChevronLeftIcon />
            )}
          </IconButton>
        </DrawerHeader>
        <Divider />
        <List>
          {["Home", "Upload", "Actions", "AI Chat"].map((text, index) => (
            <ListItem key={text} disablePadding sx={{ display: "block" }}>
              <ListItemButton
                sx={[
                  {
                    minHeight: 48,
                    px: 2.5,
                  },
                  open
                    ? {
                        justifyContent: "initial",
                      }
                    : {
                        justifyContent: "center",
                      },
                ]}
              >
                <ListItemIcon
                  sx={[
                    {
                      minWidth: 0,
                      justifyContent: "center",
                    },
                    open
                      ? {
                          mr: 3,
                        }
                      : {
                          mr: "auto",
                        },
                  ]}
                >
                  {index === 0 ? <i class="fa-solid fa-house"></i> : <></>}
                  {index === 1 ? <i class="fa-solid fa-upload"></i> : <></>}
                  {index === 2 ? (
                    <i class="fa-solid fa-pen-to-square"></i>
                  ) : (
                    <></>
                  )}
                  {index === 3 ? <i class="fa-solid fa-robot"></i> : <></>}
                </ListItemIcon>
                <ListItemText
                  primary={text}
                  sx={[
                    open
                      ? {
                          opacity: 1,
                        }
                      : {
                          opacity: 0,
                        },
                  ]}
                />
              </ListItemButton>
            </ListItem>
          ))}
        </List>
      </Drawer>
      <Box component="main" sx={{ flexGrow: 1, p: 3 }}>
        <DrawerHeader />
        <h1 className="text-2xl font-bold">
          AI-Powered X12 EDI Parser & Validator
        </h1>
        <Typography sx={{ marginBottom: 2 }}>
          Transform complex healthcare EDI files into clear, structured insights
          — detect errors instantly, understand them in plain English, and fix
          them with AI assistance.
        </Typography>

        <h2 className="text-xl font-semibold">About the Platform</h2>
        <Typography sx={{ marginBottom: 2 }}>
          Healthcare data exchange relies heavily on X12 Electronic Data
          Interchange (EDI) — the backbone of claims processing, payments, and
          member enrollment in the US healthcare system. However, these files
          are difficult to read, validate, and debug due to their complex,
          delimiter-based structure and strict compliance rules. Our platform
          simplifies this process by converting raw EDI files into a structured,
          interactive, and human-readable format, enabling developers, billing
          teams, and administrators to quickly understand and resolve issues.
        </Typography>

        <h2 className="text-xl font-semibold">The Problem We Solve</h2>
        <Typography sx={{ marginBottom: 2 }}>
          Processing EDI files manually is time-consuming and error-prone. Even
          a small mistake — such as an invalid code, missing segment, or
          incorrect identifier — can lead to:
          <ul style={{ listStyleType: "disc", marginLeft: "20px" }}>
            <li>Claim rejections and delayed payments</li>
            <li>Enrollment failures leaving members uninsured</li>
            <li>Increased operational costs</li>
            <li>Hours of manual debugging</li>
          </ul>
          Our solution eliminates these inefficiencies by providing real-time
          validation and intelligent insights.
        </Typography>

        <h2 className="text-xl font-semibold">What Our Platform Does</h2>
        <Typography sx={{ marginBottom: 2 }}>
          <ol style={{ listStyleType: "decimal", marginLeft: "20px" }}>
            <li>
              <b>Smart File Ingestion:</b> Upload any X12 EDI file (837, 835, or
              834), and our system automatically detects its type and extracts
              key metadata.
            </li>
            <li>
              <b>Interactive EDI Parser:</b> Visualize the entire EDI structure
              in a collapsible tree format, making it easy to explore segments,
              loops, and elements without reading raw text.
            </li>
            <li>
              <b>Advanced Validation Engine:</b> Our rule-based engine checks
              for: Missing required segments Invalid formats (dates, NPIs,
              codes) Cross-field inconsistencies Transaction-specific compliance
              errors All issues are clearly highlighted with precise locations.
            </li>
            <li>
              <b>AI-Powered Error Explanation:</b> No more cryptic errors. Our
              AI assistant translates technical validation issues into simple,
              actionable explanations.
            </li>
            <li>
              <b>Intelligent Fix Suggestions:</b> For common errors, the
              platform suggests corrections that you can apply instantly —
              reducing debugging time significantly.
            </li>
            <li>
              <b>Transaction Insights:</b> View claim payments, adjustments, and
              patient responsibility and Track member additions, updates, and
              terminations
            </li>
          </ol>
        </Typography>

        <h2 className="text-xl font-semibold">Who is this for?</h2>
        <Typography sx={{ marginBottom: 2 }}>
          <ul style={{ listStyleType: "disc", marginLeft: "20px" }}>
            <li>Medical Billing Specialists</li>
            <li>Healthcare Developers</li>
            <li>Insurance Providers</li>
            <li>HR & Benefits Teams</li>
            <li>Healthcare IT Companies</li>
          </ul>
        </Typography>

        <h2 className="text-xl font-semibold">Why Choose Us?</h2>
        <Typography sx={{ marginBottom: 2 }}>
          <ul style={{ listStyleType: "disc", marginLeft: "20px" }}>
            <li>Instant parsing & validation</li>
            <li>AI-powered explanations</li>
            <li>Visual and intuitive interface</li>
            <li>Deep error insights</li>
            <li>Built for speed and accuracy</li>
          </ul>
        </Typography>

        <h2 className="text-xl font-semibold">Our Mission</h2>
        <Typography sx={{ marginBottom: 2 }}>
          To simplify healthcare data processing by making EDI files
          transparent, understandable, and error-free, empowering teams to work
          faster and more efficiently.
        </Typography>
      </Box>
    </Box>
  );
}
