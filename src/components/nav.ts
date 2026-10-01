import { Car, LayoutDashboard, ScrollText, Store, Ticket, Utensils } from "lucide-react";

export const NAV = [
  { href: "/", label: "Overview", Icon: LayoutDashboard },
  { href: "/vehicles", label: "Vehicle gate", Icon: Car },
  { href: "/cashier", label: "Cashier desks", Icon: Store },
  { href: "/restaurant", label: "Restaurant", Icon: Utensils },
  { href: "/rides", label: "Pony rides", Icon: Ticket },
  { href: "/events", label: "Event log", Icon: ScrollText },
];
