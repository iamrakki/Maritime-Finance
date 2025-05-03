'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import { Ship, FileText, Navigation, Shield } from 'lucide-react';

export default function Dashboard() {
  const navItems = [
    {
      title: 'Voyage Management',
      description: 'Create and track maritime voyages',
      icon: Navigation,
      href: '/dashboard/voyages',
      color: 'from-rlusd-primary to-rlusd-glow',
      iconColor: 'text-rlusd-glow',
    },
    {
      title: 'Invoices',
      description: 'Manage freight invoices and payments',
      icon: FileText,
      href: '/dashboard/invoices',
      color: 'from-accent-sky to-accent-sky/80',
      iconColor: 'text-accent-sky',
    },
    {
      title: 'Fleet Map',
      description: 'Track vessel positions in real-time',
      icon: Ship,
      href: '/dashboard/map',
      color: 'from-accent-violet to-accent-violet/80',
      iconColor: 'text-accent-violet',
    },
    {
      title: 'Waterfall Finance',
      description: 'XRPL blockchain payment simulator',
      icon: Shield,
      href: '/dashboard/simulator',
      color: 'from-accent-amber to-accent-amber/80',
      iconColor: 'text-accent-amber',
      badge: 'Live Demo',
    },
  ];

  return (
    <div className="min-h-screen bg-maritime-dark">
      {/* Hexagonal grid background */}
      <div className="fixed inset-0 z-0 opacity-5">
        <div
          className="w-full h-full"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='52' viewBox='0 0 60 52' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%2300d4aa' fill-opacity='1'%3E%3Cpath d='M30 26l-15 8.66V17.34L30 26zm0-26L0 13v26l30 13 30-13V13L30 0z' opacity='.3'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
            backgroundSize: '60px 52px',
          }}
        />
      </div>

      <div className="relative z-10 px-8 py-12">
        {/* Header */}
        <div className="max-w-6xl mx-auto mb-12">
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center"
          >
            <h1 className="font-display text-5xl font-bold text-text-primary mb-4 uppercase tracking-tight">
              Maritime Command Center
            </h1>
            <p className="text-text-muted font-mono text-lg">
              Voyage Management • Invoice Processing • Fleet Tracking
            </p>
          </motion.div>
        </div>

        {/* Navigation Grid */}
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-2 gap-6">
            {navItems.map((item, index) => {
              const Icon = item.icon;
              return (
                <motion.div
                  key={item.href}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                >
                  <Link href={item.href}>
                    <div className="group relative bg-gradient-to-br from-maritime-steel/60 to-maritime-slate/40 backdrop-blur-xl rounded-2xl border border-white/10 hover:border-rlusd-primary/40 p-8 transition-all duration-300 overflow-hidden h-full">
                      {/* Diagonal accent line */}
                      <div className="absolute top-0 right-0 w-px h-full bg-gradient-to-b from-rlusd-primary/50 via-rlusd-primary/20 to-transparent transform rotate-12 origin-top-right" />

                      {/* Corner accent */}
                      <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-white/5 to-transparent rounded-bl-[100px]" />

                      {/* Badge */}
                      {item.badge && (
                        <div className="absolute top-4 right-4 px-2 py-1 rounded-full bg-rlusd-primary/20 border border-rlusd-primary/40">
                          <span className="text-xs font-mono font-semibold text-rlusd-glow uppercase">{item.badge}</span>
                        </div>
                      )}

                      <div className="relative">
                        {/* Icon */}
                        <div className="mb-6">
                          <div className={`inline-flex w-16 h-16 rounded-xl bg-gradient-to-br ${item.color} items-center justify-center`}>
                            <Icon className="w-8 h-8 text-maritime-dark" />
                          </div>
                        </div>

                        {/* Content */}
                        <h3 className="font-display text-2xl font-bold text-text-primary mb-2 uppercase">
                          {item.title}
                        </h3>
                        <p className="text-text-muted font-mono text-sm">
                          {item.description}
                        </p>

                        {/* Arrow indicator */}
                        <div className="mt-6 flex items-center gap-2 text-rlusd-glow font-mono text-sm uppercase opacity-0 group-hover:opacity-100 transition-opacity">
                          <span>Access</span>
                          <svg
                            className="w-4 h-4 transform group-hover:translate-x-1 transition-transform"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                          </svg>
                        </div>
                      </div>

                      {/* Hover glow effect */}
                      <div className="absolute inset-0 bg-gradient-to-r from-rlusd-primary/0 via-rlusd-primary/5 to-rlusd-primary/0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />
                    </div>
                  </Link>
                </motion.div>
              );
            })}
          </div>
        </div>

        {/* Quick Stats */}
        <div className="max-w-6xl mx-auto mt-12">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
            className="bg-gradient-to-br from-maritime-steel/40 to-maritime-slate/20 backdrop-blur-xl rounded-xl border border-white/10 p-6"
          >
            <div className="grid grid-cols-4 gap-8">
              <div className="text-center">
                <p className="text-3xl font-display font-bold text-rlusd-glow mb-1">0</p>
                <p className="text-xs font-mono text-text-muted uppercase">Active Voyages</p>
              </div>
              <div className="text-center">
                <p className="text-3xl font-display font-bold text-accent-sky mb-1">0</p>
                <p className="text-xs font-mono text-text-muted uppercase">Pending Invoices</p>
              </div>
              <div className="text-center">
                <p className="text-3xl font-display font-bold text-accent-violet mb-1">0</p>
                <p className="text-xs font-mono text-text-muted uppercase">Vessels Tracked</p>
              </div>
              <div className="text-center">
                <p className="text-3xl font-display font-bold text-accent-amber mb-1">$0</p>
                <p className="text-xs font-mono text-text-muted uppercase">Total Value</p>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}