import Admin_dashboard from "@/Pages/index.js";


export const LOGIN = "/"
export const LAYOUT = "/layout/:user_id"

// ADMIN ROUTER
export const ADMIN_DASHBOARD = "/"







// ROUTERS LAYOUT
export const AdminLayout = [
    {
        Path: ADMIN_DASHBOARD,
        Component: Admin_dashboard,
        Icon: "",
        Label: "Dashboard"
    },
]
export const AdminRouter = [
    {
        Path: ADMIN_DASHBOARD,
        Component: Admin_dashboard,
    },
]

