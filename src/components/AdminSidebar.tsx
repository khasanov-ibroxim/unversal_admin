import {
    LayoutDashboard,
    ShoppingCart,
    Package,
    Users,
    BarChart3,
    Settings,
    Bell,
    Store,
    Tag,
    MessageSquare,
} from "lucide-react";
import { NavLink } from "@/components/NavLink";
import {
    Sidebar,
    SidebarContent,
    SidebarGroup,
    SidebarGroupContent,
    SidebarGroupLabel,
    SidebarMenu,
    SidebarMenuButton,
    SidebarMenuItem,
    SidebarHeader,
    SidebarFooter,
    useSidebar,
} from "@/components/ui/sidebar";
import { useLang } from "@/context/LangContext";

export function AdminSidebar() {
    const { state } = useSidebar();
    const collapsed = state === "collapsed";
    const { tr } = useLang();

    const mainItems = [
        { title: tr.dashboard, url: "/", icon: LayoutDashboard },
        { title: tr.orders, url: "/orders", icon: ShoppingCart },
        { title: tr.products, url: "/products", icon: Package },
        { title: tr.categories, url: "/categories", icon: Tag },
        { title: tr.users, url: "/users", icon: Users },
    ];

    const secondaryItems = [
        { title: tr.shops, url: "/shops", icon: Store },
        { title: tr.messages, url: "/messages", icon: MessageSquare },
        { title: tr.analytics, url: "/analytics", icon: BarChart3 },
        { title: tr.notifications, url: "/notifications", icon: Bell },
        { title: tr.settings, url: "/settings", icon: Settings },
    ];

    return (
        <Sidebar collapsible="icon" className="border-r-0">
            <SidebarHeader className="p-4">
                <div className="flex items-center gap-3">

                    {!collapsed && (
                        <div>
                            {/*<h2 className="text-sm font-bold text-foreground">{tr.marketplace}</h2>*/}
                            <h2 className="text-sm font-bold text-foreground">Innove Couture</h2>
                            <p className="text-xs text-muted-foreground">{tr.adminPanel}</p>
                        </div>
                    )}
                </div>
            </SidebarHeader>

            <SidebarContent>
                <SidebarGroup>
                    <SidebarGroupLabel className="text-muted-foreground text-xs uppercase tracking-wider">
                        {!collapsed && tr.main}
                    </SidebarGroupLabel>
                    <SidebarGroupContent>
                        <SidebarMenu>
                            {mainItems.map((item) => (
                                <SidebarMenuItem key={item.url}>
                                    <SidebarMenuButton asChild>
                                        <NavLink
                                            to={item.url}
                                            end={item.url === "/"}
                                            className="hover:bg-sidebar-accent/50 rounded-lg transition-colors"
                                            activeClassName="bg-primary/15 text-primary font-semibold"
                                        >
                                            <item.icon className="h-4 w-4 mr-2 shrink-0" />
                                            {!collapsed && <span>{item.title}</span>}
                                        </NavLink>
                                    </SidebarMenuButton>
                                </SidebarMenuItem>
                            ))}
                        </SidebarMenu>
                    </SidebarGroupContent>
                </SidebarGroup>


            </SidebarContent>

            <SidebarFooter className="p-4">
                {!collapsed && (
                    <div className="glass-subtle rounded-lg p-3">
                        <p className="text-xs text-muted-foreground">{tr.version}</p>
                    </div>
                )}
            </SidebarFooter>
        </Sidebar>
    );
}