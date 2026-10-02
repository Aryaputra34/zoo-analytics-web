import { Car, LayoutDashboard, ScrollText, Store, Ticket, Utensils } from "lucide-react";

export const NAV = [
  { href: "/", label: "Overview", sub: "Command Center", Icon: LayoutDashboard },
  { href: "/vehicles", label: "Vehicle Gate", sub: "Hitung Kendaraan", Icon: Car },
  { href: "/cashier", label: "Cashier Desks", sub: "Loket & Retail Plaza", Icon: Store },
  { href: "/restaurant", label: "Restaurant", sub: "Safari Rainforest Dining", Icon: Utensils },
  { href: "/rides", label: "Pony Rides", sub: "Animal Encounters Arena", Icon: Ticket },
  { href: "/events", label: "Event Log", sub: "Live Incident Stream", Icon: ScrollText },
];

export const DESTINATIONS = [
  { id: "bogor", name: "Taman Safari Bogor", location: "Cisarua, Puncak", active: true, cameras: 4 },
  { id: "prigen", name: "Taman Safari Prigen", location: "Pasuruan, Jawa Timur", active: false, cameras: 0 },
  { id: "bali", name: "Bali Safari Marine Park", location: "Gianyar, Bali", active: false, cameras: 0 },
  { id: "jakarta", name: "Jakarta Aquarium & Safari", location: "Neo Soho, Jakarta", active: false, cameras: 0 },
  { id: "solo", name: "Solo Safari", location: "Surakarta, Jawa Tengah", active: false, cameras: 0 },
  { id: "batang", name: "Safari Beach Jateng", location: "Batang, Jawa Tengah", active: false, cameras: 0 },
];

