import Image from "next/image";
import Link from "next/link";
import { Compass, HeartHandshake, Mail, MapPin, Phone, ShieldCheck, TreePine } from "lucide-react";

export function TamanSafariFooter() {
  return (
    <footer className="mt-16 border-t-4 border-lime bg-forest text-white">
      {/* Upper Footer: Pillars of Conservation & Smart Operations */}
      <div className="border-b border-white/10 bg-forest-dark/50 px-4 py-8 sm:px-6 lg:px-8">
        <div className="mx-auto grid max-w-7xl gap-6 sm:grid-cols-2 lg:grid-cols-4">
          <div className="flex items-start gap-3.5">
            <div className="flex size-10 shrink-0 items-center justify-center rounded-2xl bg-lime/20 text-lime">
              <TreePine className="size-5" />
            </div>
            <div>
              <div className="text-sm font-extrabold text-white">Conservation & Welfare</div>
              <div className="mt-0.5 text-xs text-white/70">
                Preserving endangered Indonesian wildlife and fostering global biodiversity.
              </div>
            </div>
          </div>

          <div className="flex items-start gap-3.5">
            <div className="flex size-10 shrink-0 items-center justify-center rounded-2xl bg-lime/20 text-lime">
              <ShieldCheck className="size-5" />
            </div>
            <div>
              <div className="text-sm font-extrabold text-white">Smart AI Vision Monitoring</div>
              <div className="mt-0.5 text-xs text-white/70">
                Real-time queue monitoring, capacity limits, and safety incident detection.
              </div>
            </div>
          </div>

          <div className="flex items-start gap-3.5">
            <div className="flex size-10 shrink-0 items-center justify-center rounded-2xl bg-lime/20 text-lime">
              <HeartHandshake className="size-5" />
            </div>
            <div>
              <div className="text-sm font-extrabold text-white">Exceptional Guest Experience</div>
              <div className="mt-0.5 text-xs text-white/70">
                Seamless vehicle entry, optimized dining flow, and responsive park services.
              </div>
            </div>
          </div>

          <div className="flex items-start gap-3.5">
            <div className="flex size-10 shrink-0 items-center justify-center rounded-2xl bg-lime/20 text-lime">
              <Compass className="size-5" />
            </div>
            <div>
              <div className="text-sm font-extrabold text-white">Countless Excitements</div>
              <div className="mt-0.5 text-xs text-white/70">
                Creating memorable adventures across all 6 Taman Safari parks in Indonesia.
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Footer Content */}
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="grid gap-10 md:grid-cols-2 lg:grid-cols-4">
          {/* Col 1: Brand & Logo */}
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="flex size-12 shrink-0 items-center justify-center rounded-2xl bg-white/10 p-2 shadow-inner ring-1 ring-white/20">
                <Image
                  src="/logo_safari.svg"
                  alt="Taman Safari Indonesia Logo"
                  width={40}
                  height={40}
                  className="size-full object-contain"
                />
              </div>
              <div>
                <div className="text-[10px] font-extrabold tracking-[0.2em] text-lime uppercase">
                  PT Taman Safari Indonesia
                </div>
                <div className="text-lg font-black tracking-tight text-white">
                  Taman Safari
                </div>
              </div>
            </div>

            <p className="text-xs leading-relaxed text-white/75">
              Indonesia&apos;s premier world-class conservation institution and wildlife eco-park.
              Operating under international standards for animal welfare, education, and research.
            </p>

            <div className="flex items-center gap-2 pt-2">
              <span className="rounded-full bg-lime px-3 py-1 text-[11px] font-extrabold text-forest uppercase tracking-wider">
                Official Operations Hub
              </span>
            </div>
          </div>

          {/* Col 2: Our Parks & Destinations */}
          <div>
            <div className="text-sm font-black tracking-wider text-lime uppercase">
              Our Parks & Resorts
            </div>
            <ul className="mt-4 space-y-2 text-xs text-white/80">
              <li>
                <a
                  href="https://tamansafari.com/taman-safari-bogor/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-lime transition-colors flex items-center justify-between"
                >
                  <span>Taman Safari Bogor</span>
                  <span className="text-[10px] text-lime font-bold">Active Hub</span>
                </a>
              </li>
              <li>
                <a
                  href="https://tamansafari.com/taman-safari-prigen/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-lime transition-colors"
                >
                  Taman Safari Prigen (Jawa Timur)
                </a>
              </li>
              <li>
                <a
                  href="https://tamansafari.com/taman-safari-bali/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-lime transition-colors"
                >
                  Bali Safari & Marine Park
                </a>
              </li>
              <li>
                <a
                  href="https://www.jakartaaquariumsafari.com/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-lime transition-colors"
                >
                  Jakarta Aquarium & Safari
                </a>
              </li>
              <li>
                <a
                  href="https://tamansafari.com/solo-safari/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-lime transition-colors"
                >
                  Solo Safari (Jawa Tengah)
                </a>
              </li>
              <li>
                <a
                  href="https://tamansafari.com/beach-safari-batang/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-lime transition-colors"
                >
                  Safari Beach Jateng
                </a>
              </li>
            </ul>
          </div>

          {/* Col 3: AI Operations Coverage */}
          <div>
            <div className="text-sm font-black tracking-wider text-lime uppercase">
              Vision AI Subsystems
            </div>
            <ul className="mt-4 space-y-2 text-xs text-white/80">
              <li>
                <Link href="/vehicles" className="hover:text-lime transition-colors flex items-center gap-1.5">
                  <span className="text-lime">›</span> Safari Journey Gate 1 & 2 (ANPR)
                </Link>
              </li>
              <li>
                <Link href="/cashier" className="hover:text-lime transition-colors flex items-center gap-1.5">
                  <span className="text-lime">›</span> Loket Mini Train & Ticketing Desks
                </Link>
              </li>
              <li>
                <Link href="/restaurant" className="hover:text-lime transition-colors flex items-center gap-1.5">
                  <span className="text-lime">›</span> Safari Cafe & Rainforest Dining
                </Link>
              </li>
              <li>
                <Link href="/rides" className="hover:text-lime transition-colors flex items-center gap-1.5">
                  <span className="text-lime">›</span> Horse & Pony Riding Area (Wahana)
                </Link>
              </li>
              <li>
                <Link href="/events" className="hover:text-lime transition-colors flex items-center gap-1.5">
                  <span className="text-lime">›</span> Security Incident & Capacity Stream
                </Link>
              </li>
            </ul>
          </div>

          {/* Col 4: Control Room & Contact */}
          <div>
            <div className="text-sm font-black tracking-wider text-lime uppercase">
              Park Control & Hotline
            </div>
            <div className="mt-4 space-y-3 text-xs text-white/80">
              <div className="flex items-start gap-2.5">
                <MapPin className="size-4 shrink-0 text-lime mt-0.5" />
                <span>
                  Jl. Kapten Harun Kabir No. 724, Cibeureum, Cisarua, Kabupaten Bogor, Jawa Barat 16750
                </span>
              </div>
              <div className="flex items-center gap-2.5">
                <Phone className="size-4 shrink-0 text-lime" />
                <span>Call Center: +62 251 825 3000</span>
              </div>
              <div className="flex items-center gap-2.5">
                <Mail className="size-4 shrink-0 text-lime" />
                <span>ops@tamansafari.com</span>
              </div>
              <div className="rounded-xl border border-white/15 bg-white/5 p-3 text-[11px] text-white/70">
                <div className="font-bold text-white">Operations Hours:</div>
                <div>Senin – Minggu: 08:30 – 17:00 WIB</div>
                <div className="text-lime text-[10px] mt-0.5">Safari Malam (Night Safari): Weekend 18:30 WIB</div>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="mt-12 flex flex-col items-center justify-between gap-4 border-t border-white/10 pt-6 text-xs text-white/60 sm:flex-row">
          <div>
            © 2026 PT Taman Safari Indonesia. All rights reserved. &quot;Countless Excitements&quot; is a registered trademark.
          </div>
          <div className="flex items-center gap-4 text-[11px]">
            <span className="text-lime font-bold">MetaVMS AI Vision Integration</span>
            <span>•</span>
            <span>Version 2.4.0 (Enterprise)</span>
            <span>•</span>
            <span>Timezone: WIB (UTC+7)</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
