"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { primaryNavItems, utilityNavItems } from "./signal-feed/mock-data";
import { navIcons } from "./signal-feed/icons";

type SidebarProps = {
  isOpen: boolean;
  onClose: () => void;
};

export default function Sidebar({ isOpen, onClose }: SidebarProps) {
  const pathname = usePathname();

  return (
    <>
      <div
        className={`fixed inset-0 z-40 bg-black/50 backdrop-blur-sm transition-opacity lg:hidden ${
          isOpen ? "opacity-100" : "pointer-events-none opacity-0"
        }`}
        onClick={onClose}
      />
      <nav
        className={`fixed left-0 top-16 h-[calc(100vh-64px)] w-64 z-50 flex flex-col justify-between border-r border-outline-variant bg-surface-container-lowest transform transition-transform duration-300 lg:z-40 lg:translate-x-0 ${
          isOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="flex flex-col">
          <div className="py-4">
            {primaryNavItems.map((item) => {
              const Icon = navIcons[item.icon];
              const isActive = pathname === item.href || (item.href !== "/" && pathname?.startsWith(item.href));

              return (
                <Link
                  key={item.label}
                  className={
                    isActive
                      ? "bg-surface-container-high text-primary-container border-l-2 border-primary-container flex items-center gap-3 px-4 py-3"
                      : "text-on-surface-variant flex items-center gap-3 px-4 py-3 hover:bg-surface-container transition-all duration-200"
                  }
                  href={item.href}
                  onClick={() => {
                    if (window.innerWidth < 1024) onClose();
                  }}
                >
                  <Icon size={18} strokeWidth={1.75} />
                  <span className="font-label-md text-label-md">
                    {item.label}
                  </span>
                </Link>
              );
            })}
          </div>
        </div>
        <div className="p-4 border-t border-outline-variant flex flex-col gap-1">
          {utilityNavItems.map((item) => {
            const Icon = navIcons[item.icon];

            return (
              <Link
                key={item.label}
                className="text-on-surface-variant flex items-center gap-3 px-4 py-2 hover:text-on-surface text-sm"
                href={item.href}
              >
                <Icon size={14} strokeWidth={1.75} />
                <span className="font-label-md text-label-md">
                  {item.label}
                </span>
              </Link>
            );
          })}
        </div>
      </nav>
    </>
  );
}
