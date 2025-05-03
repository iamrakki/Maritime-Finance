'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useRouter } from 'next/navigation';
import {
  Ship,
  Users,
  MapPin,
  Calendar,
  Target,
  DollarSign,
  CheckCircle2,
  ArrowRight,
  ArrowLeft,
  Plus,
  X,
  Navigation,
  Anchor,
} from 'lucide-react';
import { Voyage, Milestone, STORAGE_KEYS, PredefinedRoute } from '@/types/voyage';

// Predefined routes from MapView.tsx
const PREDEFINED_ROUTES: PredefinedRoute[] = [
  {
    id: 'sgsin-nlrtm',
    name: 'Singapore → Rotterdam (via Suez Canal)',
    origin: 'Singapore',
    destination: 'Rotterdam',
    waypoints: [
      [1.35, 103.82], // Singapore
      [2.0, 98.0], // Strait of Malacca
      [8.0, 77.0], // Arabian Sea
      [15.0, 50.0], // Gulf of Aden
      [30.5, 32.3], // Suez Canal
      [35.0, 25.0], // Mediterranean
      [40.0, 10.0], // Mediterranean
      [43.0, 3.0], // Mediterranean
      [51.9, 4.4], // Rotterdam
    ],
    distance: 8288,
    estimatedDays: 45,
    criticalWaypoints: [
      { name: 'Strait of Malacca', coordinates: [2.0, 98.0], description: 'Critical choke point' },
      { name: 'Suez Canal', coordinates: [30.5, 32.3], description: 'Canal transit required' },
    ],
  },
  {
    id: 'cnsha-uslax',
    name: 'Shanghai → Los Angeles (Trans-Pacific)',
    origin: 'Shanghai',
    destination: 'Los Angeles',
    waypoints: [
      [31.2, 121.5], // Shanghai
      [35.0, 140.0], // Pacific
      [38.0, 160.0], // Pacific
      [40.0, 180.0], // Pacific
      [38.0, -160.0], // Pacific
      [35.0, -140.0], // Pacific
      [33.9, -118.4], // Los Angeles
    ],
    distance: 6500,
    estimatedDays: 38,
    criticalWaypoints: [],
  },
  {
    id: 'hkhkg-aedxb',
    name: 'Hong Kong → Dubai (via Strait of Malacca)',
    origin: 'Hong Kong',
    destination: 'Dubai',
    waypoints: [
      [22.3, 114.2], // Hong Kong
      [10.0, 108.0], // South China Sea
      [2.0, 98.0], // Strait of Malacca
      [8.0, 77.0], // Bay of Bengal
      [15.0, 60.0], // Arabian Sea
      [25.2, 55.3], // Dubai
    ],
    distance: 5200,
    estimatedDays: 32,
    criticalWaypoints: [
      { name: 'Strait of Malacca', coordinates: [2.0, 98.0], description: 'Critical choke point' },
    ],
  },
];

export default function CreateVoyagePage() {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(1);
  const totalSteps = 6;

  // Form state
  const [vesselName, setVesselName] = useState('MV Ocean Titan');
  const [vesselIMO, setVesselIMO] = useState('IMO 9234567');
  const [vesselType, setVesselType] = useState('Container Ship');
  const [shipownerName, setShipownerName] = useState('Blue Horizon Shipping Ltd.');
  const [shipownerCompany, setShipownerCompany] = useState('Blue Horizon Maritime Group');
  const [chartererName, setChartererName] = useState('');
  const [chartererCompany, setChartererCompany] = useState('');

  const [selectedRoute, setSelectedRoute] = useState<PredefinedRoute | null>(null);
  const [customOrigin, setCustomOrigin] = useState('');
  const [customDestination, setCustomDestination] = useState('');

  const [departureDate, setDepartureDate] = useState('');
  const [arrivalDate, setArrivalDate] = useState('');

  const [autoMilestones, setAutoMilestones] = useState<Milestone[]>([]);
  const [customMilestones, setCustomMilestones] = useState<{ name: string; description: string }[]>([]);

  const [contractValue, setContractValue] = useState('');

  const steps = [
    { number: 1, title: 'Vessel & Parties', icon: Ship },
    { number: 2, title: 'Route', icon: MapPin },
    { number: 3, title: 'Schedule', icon: Calendar },
    { number: 4, title: 'Milestones', icon: Target },
    { number: 5, title: 'Financial', icon: DollarSign },
    { number: 6, title: 'Review', icon: CheckCircle2 },
  ];

  // Auto-generate milestones when route is selected
  const generateMilestones = (route: PredefinedRoute) => {
    const milestones: Milestone[] = [];
    const now = new Date().toISOString();

    // Port Departure
    milestones.push({
      id: `milestone-dep-${Date.now()}`,
      voyageId: '',
      type: 'port_departure',
      name: `Departure from ${route.origin}`,
      coordinates: route.waypoints[0],
      locationName: route.origin,
      status: 'pending',
      requiresVerification: true,
      createdAt: now,
      updatedAt: now,
    });

    // 25% Progress
    const idx25 = Math.floor(route.waypoints.length * 0.25);
    milestones.push({
      id: `milestone-25-${Date.now()}`,
      voyageId: '',
      type: 'route_segment',
      name: '25% Route Progress',
      coordinates: route.waypoints[idx25],
      progressPercentage: 25,
      status: 'pending',
      requiresVerification: true,
      createdAt: now,
      updatedAt: now,
    });

    // Critical waypoints
    route.criticalWaypoints.forEach((wp, i) => {
      milestones.push({
        id: `milestone-critical-${i}-${Date.now()}`,
        voyageId: '',
        type: 'critical_waypoint',
        name: wp.name,
        description: wp.description,
        coordinates: wp.coordinates,
        locationName: wp.name,
        status: 'pending',
        requiresVerification: true,
        createdAt: now,
        updatedAt: now,
      });
    });

    // 50% Progress
    const idx50 = Math.floor(route.waypoints.length * 0.5);
    milestones.push({
      id: `milestone-50-${Date.now()}`,
      voyageId: '',
      type: 'route_segment',
      name: '50% Route Progress',
      coordinates: route.waypoints[idx50],
      progressPercentage: 50,
      status: 'pending',
      requiresVerification: true,
      createdAt: now,
      updatedAt: now,
    });

    // 75% Progress
    const idx75 = Math.floor(route.waypoints.length * 0.75);
    milestones.push({
      id: `milestone-75-${Date.now()}`,
      voyageId: '',
      type: 'route_segment',
      name: '75% Route Progress',
      coordinates: route.waypoints[idx75],
      progressPercentage: 75,
      status: 'pending',
      requiresVerification: true,
      createdAt: now,
      updatedAt: now,
    });

    // Port Arrival
    milestones.push({
      id: `milestone-arr-${Date.now()}`,
      voyageId: '',
      type: 'port_arrival',
      name: `Arrival at ${route.destination}`,
      coordinates: route.waypoints[route.waypoints.length - 1],
      locationName: route.destination,
      status: 'pending',
      requiresVerification: true,
      createdAt: now,
      updatedAt: now,
    });

    setAutoMilestones(milestones);
  };

  const handleRouteSelect = (route: PredefinedRoute) => {
    setSelectedRoute(route);
    generateMilestones(route);

    // Auto-calculate arrival date
    if (departureDate) {
      const dep = new Date(departureDate);
      dep.setDate(dep.getDate() + route.estimatedDays);
      setArrivalDate(dep.toISOString().split('T')[0]);
    }
  };

  const addCustomMilestone = () => {
    setCustomMilestones([...customMilestones, { name: '', description: '' }]);
  };

  const removeCustomMilestone = (index: number) => {
    setCustomMilestones(customMilestones.filter((_, i) => i !== index));
  };

  const updateCustomMilestone = (index: number, field: 'name' | 'description', value: string) => {
    const updated = [...customMilestones];
    updated[index][field] = value;
    setCustomMilestones(updated);
  };

  const handleCreateVoyage = () => {
    if (!selectedRoute) return;

    const voyageId = `voyage-${Date.now()}`;
    const now = new Date().toISOString();

    // Create voyage object
    const voyage: Voyage = {
      id: voyageId,
      voyageNumber: `VOY-${Math.floor(Math.random() * 9000) + 1000}`,
      shipownerId: 'owner-001',
      shipownerName,
      shipownerCompany,
      chartererId: 'charterer-001',
      chartererName,
      chartererCompany,
      vesselName,
      vesselIMO,
      vesselType,
      origin: {
        name: selectedRoute.origin,
        coordinates: selectedRoute.waypoints[0],
      },
      destination: {
        name: selectedRoute.destination,
        coordinates: selectedRoute.waypoints[selectedRoute.waypoints.length - 1],
      },
      routeName: selectedRoute.name,
      routeCoordinates: selectedRoute.waypoints,
      totalDistance: selectedRoute.distance,
      scheduledDeparture: departureDate,
      estimatedArrival: arrivalDate,
      durationDays: selectedRoute.estimatedDays,
      status: 'scheduled',
      currentProgress: 0,
      milestones: autoMilestones.map(m => ({ ...m, voyageId })),
      milestonesCompleted: 0,
      milestonesTotal: autoMilestones.length,
      contractValue: parseFloat(contractValue),
      currency: 'RLUSD',
      invoiceIds: [],
      createdAt: now,
      updatedAt: now,
      createdBy: 'user-001',
      simulationActive: false,
    };

    // Save to localStorage
    localStorage.setItem(STORAGE_KEYS.voyage(voyageId), JSON.stringify(voyage));

    const voyageList = JSON.parse(localStorage.getItem(STORAGE_KEYS.voyageList) || '[]');
    voyageList.push(voyageId);
    localStorage.setItem(STORAGE_KEYS.voyageList, JSON.stringify(voyageList));

    // Save milestones
    voyage.milestones.forEach(milestone => {
      localStorage.setItem(STORAGE_KEYS.milestone(milestone.id), JSON.stringify(milestone));
    });

    // Redirect to voyage detail
    router.push(`/dashboard/voyages/${voyageId}`);
  };

  const canProceed = () => {
    switch (currentStep) {
      case 1:
        return vesselName && shipownerName && chartererName;
      case 2:
        return selectedRoute !== null;
      case 3:
        return departureDate && arrivalDate;
      case 4:
        return true;
      case 5:
        return contractValue;
      case 6:
        return true;
      default:
        return false;
    }
  };

  return (
    <div className="min-h-screen bg-maritime-dark">
      {/* Background effects */}
      <div className="fixed inset-0 z-0 opacity-5">
        <div
          className="w-full h-full"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='52' viewBox='0 0 60 52' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%2300d4aa' fill-opacity='1'%3E%3Cpath d='M30 26l-15 8.66V17.34L30 26zm0-26L0 13v26l30 13 30-13V13L30 0z' opacity='.3'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
            backgroundSize: '60px 52px',
          }}
        />
      </div>

      <div className="relative z-10">
        {/* Header */}
        <header className="border-b border-rlusd-primary/20 bg-maritime-deeper/95 backdrop-blur-xl">
          <div className="px-8 py-6">
            <div className="flex items-center gap-4">
              <div className="relative">
                <div className="absolute inset-0 bg-accent-sky/30 blur-xl" />
                <div className="relative w-14 h-14 rounded-lg bg-gradient-to-br from-accent-sky/40 to-accent-sky/10 flex items-center justify-center border border-accent-sky/50">
                  <Plus className="w-7 h-7 text-accent-sky" />
                </div>
              </div>
              <div>
                <h1 className="font-display text-3xl font-bold text-text-primary tracking-tight uppercase">
                  Create New Voyage
                </h1>
                <p className="text-sm text-text-muted font-mono mt-1">Mission Planning Interface</p>
              </div>
            </div>
          </div>
        </header>

        {/* Progress Stepper */}
        <div className="px-8 py-8 border-b border-white/5">
          <div className="max-w-5xl mx-auto">
            <div className="flex items-center justify-between">
              {steps.map((step, index) => {
                const isActive = currentStep === step.number;
                const isCompleted = currentStep > step.number;
                const Icon = step.icon;

                return (
                  <div key={step.number} className="flex items-center flex-1">
                    <div className="flex flex-col items-center flex-1">
                      <motion.div
                        className={`w-12 h-12 rounded-lg flex items-center justify-center border-2 transition-all ${
                          isCompleted
                            ? 'bg-rlusd-primary border-rlusd-primary text-maritime-dark'
                            : isActive
                            ? 'bg-accent-sky/20 border-accent-sky text-accent-sky'
                            : 'bg-maritime-slate/40 border-white/10 text-text-muted'
                        }`}
                        whileHover={{ scale: 1.05 }}
                      >
                        {isCompleted ? <CheckCircle2 className="w-6 h-6" /> : <Icon className="w-6 h-6" />}
                      </motion.div>
                      <p
                        className={`mt-2 text-xs font-mono uppercase ${
                          isActive ? 'text-accent-sky font-bold' : 'text-text-muted'
                        }`}
                      >
                        {step.title}
                      </p>
                    </div>

                    {index < steps.length - 1 && (
                      <div className="flex-1 h-px bg-white/10 mx-2 relative">
                        {isCompleted && (
                          <motion.div
                            className="absolute inset-0 bg-gradient-to-r from-rlusd-primary to-transparent"
                            initial={{ width: 0 }}
                            animate={{ width: '100%' }}
                            transition={{ duration: 0.5 }}
                          />
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Form Content */}
        <div className="px-8 py-12">
          <div className="max-w-4xl mx-auto">
            <AnimatePresence mode="wait">
              {/* Step 1: Vessel & Parties */}
              {currentStep === 1 && (
                <motion.div
                  key="step1"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="space-y-8"
                >
                  {/* Vessel Details */}
                  <div className="bg-gradient-to-br from-maritime-steel/60 to-maritime-slate/40 backdrop-blur-xl rounded-xl border border-white/10 p-8">
                    <div className="flex items-center gap-3 mb-6">
                      <Ship className="w-6 h-6 text-rlusd-glow" />
                      <h2 className="font-display text-2xl font-bold text-text-primary uppercase">Vessel Details</h2>
                    </div>

                    <div className="grid grid-cols-2 gap-6">
                      <div>
                        <label className="flex items-center gap-2 text-sm font-mono text-text-muted uppercase mb-2">
                          Vessel Name *
                          <span className="px-2 py-0.5 bg-accent-sky/10 text-accent-sky text-xs rounded-full border border-accent-sky/30 animate-pulse-glow">
                            Sample
                          </span>
                        </label>
                        <input
                          type="text"
                          value={vesselName}
                          onChange={(e) => setVesselName(e.target.value)}
                          className="w-full px-4 py-3 bg-maritime-dark/50 border border-accent-sky/20 rounded-lg text-text-primary font-mono focus:border-rlusd-primary focus:outline-none transition-all duration-300 focus:bg-maritime-dark/70"
                          placeholder="e.g., MV Pacific Meridian"
                        />
                      </div>

                      <div>
                        <label className="flex items-center gap-2 text-sm font-mono text-text-muted uppercase mb-2">
                          IMO Number
                          <span className="px-2 py-0.5 bg-accent-sky/10 text-accent-sky text-xs rounded-full border border-accent-sky/30 animate-pulse-glow">
                            Sample
                          </span>
                        </label>
                        <input
                          type="text"
                          value={vesselIMO}
                          onChange={(e) => setVesselIMO(e.target.value)}
                          className="w-full px-4 py-3 bg-maritime-dark/50 border border-accent-sky/20 rounded-lg text-text-primary font-mono focus:border-rlusd-primary focus:outline-none transition-all duration-300 focus:bg-maritime-dark/70"
                          placeholder="e.g., IMO 9234567"
                        />
                      </div>

                      <div className="col-span-2">
                        <label className="flex items-center gap-2 text-sm font-mono text-text-muted uppercase mb-2">
                          Vessel Type
                          <span className="px-2 py-0.5 bg-accent-sky/10 text-accent-sky text-xs rounded-full border border-accent-sky/30 animate-pulse-glow">
                            Sample
                          </span>
                        </label>
                        <select
                          value={vesselType}
                          onChange={(e) => setVesselType(e.target.value)}
                          className="w-full px-4 py-3 bg-maritime-dark/50 border border-accent-sky/20 rounded-lg text-text-primary font-mono focus:border-rlusd-primary focus:outline-none transition-all duration-300"
                        >
                          <option>Container Ship</option>
                          <option>Bulk Carrier</option>
                          <option>Tanker</option>
                          <option>General Cargo</option>
                          <option>Ro-Ro</option>
                        </select>
                      </div>
                    </div>
                  </div>

                  {/* Clear Sample Data Button */}
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => {
                      setVesselName('');
                      setVesselIMO('');
                      setVesselType('Container Ship');
                      setShipownerName('');
                      setShipownerCompany('');
                    }}
                    className="flex items-center gap-2 px-4 py-2 bg-maritime-steel/40 hover:bg-maritime-steel/60 border border-white/10 hover:border-accent-coral/40 rounded-lg text-text-muted hover:text-accent-coral font-mono text-sm uppercase transition-all duration-300"
                  >
                    <X className="w-4 h-4" />
                    Clear Sample Data
                  </motion.button>

                  {/* Parties */}
                  <div className="grid grid-cols-2 gap-6">
                    {/* Shipowner */}
                    <div className="bg-gradient-to-br from-maritime-steel/60 to-maritime-slate/40 backdrop-blur-xl rounded-xl border border-white/10 p-8">
                      <div className="flex items-center gap-3 mb-6">
                        <Anchor className="w-5 h-5 text-accent-sky" />
                        <h3 className="font-display text-xl font-bold text-text-primary uppercase">Shipowner</h3>
                      </div>

                      <div className="space-y-4">
                        <div>
                          <label className="flex items-center gap-2 text-sm font-mono text-text-muted uppercase mb-2">
                            Name *
                            <span className="px-2 py-0.5 bg-accent-sky/10 text-accent-sky text-xs rounded-full border border-accent-sky/30 animate-pulse-glow">
                              Sample
                            </span>
                          </label>
                          <input
                            type="text"
                            value={shipownerName}
                            onChange={(e) => setShipownerName(e.target.value)}
                            className="w-full px-4 py-3 bg-maritime-dark/50 border border-accent-sky/20 rounded-lg text-text-primary font-mono focus:border-rlusd-primary focus:outline-none transition-all duration-300 focus:bg-maritime-dark/70"
                            placeholder="John Smith"
                          />
                        </div>

                        <div>
                          <label className="flex items-center gap-2 text-sm font-mono text-text-muted uppercase mb-2">
                            Company
                            <span className="px-2 py-0.5 bg-accent-sky/10 text-accent-sky text-xs rounded-full border border-accent-sky/30 animate-pulse-glow">
                              Sample
                            </span>
                          </label>
                          <input
                            type="text"
                            value={shipownerCompany}
                            onChange={(e) => setShipownerCompany(e.target.value)}
                            className="w-full px-4 py-3 bg-maritime-dark/50 border border-accent-sky/20 rounded-lg text-text-primary font-mono focus:border-rlusd-primary focus:outline-none transition-all duration-300 focus:bg-maritime-dark/70"
                            placeholder="Blue Horizon Shipping"
                          />
                        </div>
                      </div>
                    </div>

                    {/* Charterer */}
                    <div className="bg-gradient-to-br from-maritime-steel/60 to-maritime-slate/40 backdrop-blur-xl rounded-xl border border-white/10 p-8">
                      <div className="flex items-center gap-3 mb-6">
                        <Users className="w-5 h-5 text-accent-amber" />
                        <h3 className="font-display text-xl font-bold text-text-primary uppercase">Charterer</h3>
                      </div>

                      <div className="space-y-4">
                        <div>
                          <label className="block text-sm font-mono text-text-muted uppercase mb-2">Name *</label>
                          <input
                            type="text"
                            value={chartererName}
                            onChange={(e) => setChartererName(e.target.value)}
                            className="w-full px-4 py-3 bg-maritime-dark/50 border border-white/10 rounded-lg text-text-primary font-mono focus:border-rlusd-primary focus:outline-none transition-colors"
                            placeholder="Jane Doe"
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-mono text-text-muted uppercase mb-2">Company</label>
                          <input
                            type="text"
                            value={chartererCompany}
                            onChange={(e) => setChartererCompany(e.target.value)}
                            className="w-full px-4 py-3 bg-maritime-dark/50 border border-white/10 rounded-lg text-text-primary font-mono focus:border-rlusd-primary focus:outline-none transition-colors"
                            placeholder="Global Commodities Corp"
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}

              {/* Step 2: Route */}
              {currentStep === 2 && (
                <motion.div
                  key="step2"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="space-y-6"
                >
                  <div className="bg-gradient-to-br from-maritime-steel/60 to-maritime-slate/40 backdrop-blur-xl rounded-xl border border-white/10 p-8">
                    <div className="flex items-center gap-3 mb-6">
                      <MapPin className="w-6 h-6 text-rlusd-glow" />
                      <h2 className="font-display text-2xl font-bold text-text-primary uppercase">Select Route</h2>
                    </div>

                    <div className="grid grid-cols-1 gap-4">
                      {PREDEFINED_ROUTES.map((route) => (
                        <motion.button
                          key={route.id}
                          onClick={() => handleRouteSelect(route)}
                          whileHover={{ scale: 1.01 }}
                          whileTap={{ scale: 0.99 }}
                          className={`relative p-6 rounded-xl border-2 text-left transition-all ${
                            selectedRoute?.id === route.id
                              ? 'bg-rlusd-primary/20 border-rlusd-primary'
                              : 'bg-maritime-dark/30 border-white/10 hover:border-accent-sky/40'
                          }`}
                        >
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <h3 className="font-display text-xl font-bold text-text-primary mb-2">{route.name}</h3>
                              <div className="flex items-center gap-6 text-sm font-mono text-text-muted">
                                <span>{route.distance.toLocaleString()} nm</span>
                                <span>~{route.estimatedDays} days</span>
                                <span>{route.criticalWaypoints.length} critical waypoints</span>
                              </div>
                            </div>

                            {selectedRoute?.id === route.id && (
                              <CheckCircle2 className="w-6 h-6 text-rlusd-glow" />
                            )}
                          </div>
                        </motion.button>
                      ))}
                    </div>
                  </div>
                </motion.div>
              )}

              {/* Step 3: Schedule */}
              {currentStep === 3 && (
                <motion.div
                  key="step3"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="space-y-6"
                >
                  <div className="bg-gradient-to-br from-maritime-steel/60 to-maritime-slate/40 backdrop-blur-xl rounded-xl border border-white/10 p-8">
                    <div className="flex items-center gap-3 mb-6">
                      <Calendar className="w-6 h-6 text-rlusd-glow" />
                      <h2 className="font-display text-2xl font-bold text-text-primary uppercase">Schedule</h2>
                    </div>

                    <div className="grid grid-cols-2 gap-6">
                      <div>
                        <label className="block text-sm font-mono text-text-muted uppercase mb-2">
                          Departure Date *
                        </label>
                        <input
                          type="date"
                          value={departureDate}
                          onChange={(e) => {
                            setDepartureDate(e.target.value);
                            if (selectedRoute) {
                              const dep = new Date(e.target.value);
                              dep.setDate(dep.getDate() + selectedRoute.estimatedDays);
                              setArrivalDate(dep.toISOString().split('T')[0]);
                            }
                          }}
                          className="w-full px-4 py-3 bg-maritime-dark/50 border border-white/10 rounded-lg text-text-primary font-mono focus:border-rlusd-primary focus:outline-none transition-colors"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-mono text-text-muted uppercase mb-2">
                          Estimated Arrival *
                        </label>
                        <input
                          type="date"
                          value={arrivalDate}
                          onChange={(e) => setArrivalDate(e.target.value)}
                          className="w-full px-4 py-3 bg-maritime-dark/50 border border-white/10 rounded-lg text-text-primary font-mono focus:border-rlusd-primary focus:outline-none transition-colors"
                        />
                      </div>

                      {selectedRoute && departureDate && arrivalDate && (
                        <div className="col-span-2 p-4 bg-accent-sky/10 border border-accent-sky/30 rounded-lg">
                          <p className="text-sm font-mono text-accent-sky">
                            Duration: {selectedRoute.estimatedDays} days ({Math.ceil(selectedRoute.distance / 12)} hours at 12 knots)
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                </motion.div>
              )}

              {/* Step 4: Milestones */}
              {currentStep === 4 && (
                <motion.div
                  key="step4"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="space-y-6"
                >
                  <div className="bg-gradient-to-br from-maritime-steel/60 to-maritime-slate/40 backdrop-blur-xl rounded-xl border border-white/10 p-8">
                    <div className="flex items-center gap-3 mb-6">
                      <Target className="w-6 h-6 text-rlusd-glow" />
                      <h2 className="font-display text-2xl font-bold text-text-primary uppercase">Milestones</h2>
                    </div>

                    <div className="mb-6">
                      <p className="text-sm font-mono text-text-muted mb-4">
                        {autoMilestones.length} milestones auto-generated from route
                      </p>

                      <div className="space-y-2">
                        {autoMilestones.map((milestone, index) => (
                          <div
                            key={index}
                            className="flex items-center gap-3 p-4 bg-maritime-dark/30 rounded-lg border border-white/5"
                          >
                            <CheckCircle2 className="w-4 h-4 text-rlusd-glow" />
                            <div className="flex-1">
                              <p className="font-mono text-sm text-text-primary">{milestone.name}</p>
                              {milestone.progressPercentage && (
                                <p className="text-xs text-text-muted">{milestone.progressPercentage}% progress</p>
                              )}
                            </div>
                            <span className="px-2 py-1 bg-rlusd-primary/20 text-rlusd-glow rounded text-xs font-mono">
                              {milestone.type.replace('_', ' ')}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="border-t border-white/10 pt-6">
                      <div className="flex items-center justify-between mb-4">
                        <h3 className="font-display text-lg font-bold text-text-primary uppercase">
                          Custom Milestones
                        </h3>
                        <motion.button
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                          onClick={addCustomMilestone}
                          className="px-4 py-2 bg-accent-sky/20 text-accent-sky rounded-lg border border-accent-sky/40 font-mono text-sm uppercase flex items-center gap-2"
                        >
                          <Plus className="w-4 h-4" />
                          Add Custom
                        </motion.button>
                      </div>

                      {customMilestones.length > 0 && (
                        <div className="space-y-3">
                          {customMilestones.map((milestone, index) => (
                            <div key={index} className="flex items-start gap-3 p-4 bg-maritime-dark/30 rounded-lg border border-white/5">
                              <div className="flex-1 space-y-3">
                                <input
                                  type="text"
                                  value={milestone.name}
                                  onChange={(e) => updateCustomMilestone(index, 'name', e.target.value)}
                                  placeholder="Milestone name"
                                  className="w-full px-3 py-2 bg-maritime-dark/50 border border-white/10 rounded text-text-primary font-mono text-sm focus:border-accent-sky focus:outline-none"
                                />
                                <input
                                  type="text"
                                  value={milestone.description}
                                  onChange={(e) => updateCustomMilestone(index, 'description', e.target.value)}
                                  placeholder="Description"
                                  className="w-full px-3 py-2 bg-maritime-dark/50 border border-white/10 rounded text-text-muted font-mono text-xs focus:border-accent-sky focus:outline-none"
                                />
                              </div>
                              <button
                                onClick={() => removeCustomMilestone(index)}
                                className="p-2 hover:bg-accent-coral/20 text-accent-coral rounded transition-colors"
                              >
                                <X className="w-4 h-4" />
                              </button>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </motion.div>
              )}

              {/* Step 5: Financial */}
              {currentStep === 5 && (
                <motion.div
                  key="step5"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="space-y-6"
                >
                  <div className="bg-gradient-to-br from-maritime-steel/60 to-maritime-slate/40 backdrop-blur-xl rounded-xl border border-white/10 p-8">
                    <div className="flex items-center gap-3 mb-6">
                      <DollarSign className="w-6 h-6 text-rlusd-glow" />
                      <h2 className="font-display text-2xl font-bold text-text-primary uppercase">Financial Details</h2>
                    </div>

                    <div className="space-y-6">
                      <div className="relative group">
                        <label className="flex items-center gap-2 text-sm font-mono text-text-muted uppercase mb-2">
                          Contract Value *
                          <span className="px-2 py-0.5 bg-rlusd-primary/10 text-rlusd-glow text-xs rounded-full border border-rlusd-primary/30">
                            RLUSD Only
                          </span>
                        </label>
                        <div className="relative">
                          {/* RLUSD Badge - Always visible inside input */}
                          <div className="absolute left-4 top-1/2 -translate-y-1/2 flex items-center gap-2 pointer-events-none">
                            <div className="w-2 h-2 rounded-full bg-rlusd-glow animate-pulse-glow"></div>
                            <span className="font-mono font-bold text-rlusd-glow">RLUSD</span>
                          </div>

                          <input
                            type="number"
                            value={contractValue}
                            onChange={(e) => setContractValue(e.target.value)}
                            className="w-full pl-28 pr-4 py-4 bg-maritime-dark/50 border-2 border-rlusd-primary/30 rounded-lg text-text-primary font-mono text-xl focus:border-rlusd-primary focus:outline-none focus:shadow-glow-md transition-all duration-300"
                            placeholder="850000"
                          />
                        </div>

                        {/* Value preview with formatting */}
                        {contractValue && (
                          <motion.div
                            initial={{ opacity: 0, y: -10 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="mt-3 p-3 bg-rlusd-primary/5 border border-rlusd-primary/20 rounded-lg"
                          >
                            <p className="text-sm font-mono text-text-muted">Contract Total</p>
                            <p className="text-2xl font-display font-bold text-rlusd-glow">
                              RLUSD ${parseFloat(contractValue).toLocaleString()}
                            </p>
                          </motion.div>
                        )}
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}

              {/* Step 6: Review */}
              {currentStep === 6 && (
                <motion.div
                  key="step6"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="space-y-6"
                >
                  <div className="bg-gradient-to-br from-maritime-steel/60 to-maritime-slate/40 backdrop-blur-xl rounded-xl border border-white/10 p-8">
                    <div className="flex items-center gap-3 mb-6">
                      <CheckCircle2 className="w-6 h-6 text-rlusd-glow" />
                      <h2 className="font-display text-2xl font-bold text-text-primary uppercase">Review & Create</h2>
                    </div>

                    <div className="space-y-6">
                      {/* Vessel */}
                      <div>
                        <h3 className="text-sm font-mono text-text-muted uppercase mb-3">Vessel</h3>
                        <div className="p-4 bg-maritime-dark/30 rounded-lg border border-white/5">
                          <p className="font-display text-lg text-text-primary">{vesselName}</p>
                          <p className="text-sm font-mono text-text-muted">{vesselType} • {vesselIMO || 'No IMO'}</p>
                        </div>
                      </div>

                      {/* Parties */}
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <h3 className="text-sm font-mono text-text-muted uppercase mb-3">Shipowner</h3>
                          <div className="p-4 bg-maritime-dark/30 rounded-lg border border-white/5">
                            <p className="font-mono text-text-primary">{shipownerName}</p>
                            {shipownerCompany && <p className="text-sm text-text-muted">{shipownerCompany}</p>}
                          </div>
                        </div>
                        <div>
                          <h3 className="text-sm font-mono text-text-muted uppercase mb-3">Charterer</h3>
                          <div className="p-4 bg-maritime-dark/30 rounded-lg border border-white/5">
                            <p className="font-mono text-text-primary">{chartererName}</p>
                            {chartererCompany && <p className="text-sm text-text-muted">{chartererCompany}</p>}
                          </div>
                        </div>
                      </div>

                      {/* Route */}
                      {selectedRoute && (
                        <div>
                          <h3 className="text-sm font-mono text-text-muted uppercase mb-3">Route</h3>
                          <div className="p-4 bg-maritime-dark/30 rounded-lg border border-white/5">
                            <p className="font-display text-lg text-text-primary mb-2">{selectedRoute.name}</p>
                            <p className="text-sm font-mono text-text-muted">
                              {selectedRoute.distance.toLocaleString()} nm • {selectedRoute.estimatedDays} days
                            </p>
                          </div>
                        </div>
                      )}

                      {/* Schedule */}
                      <div>
                        <h3 className="text-sm font-mono text-text-muted uppercase mb-3">Schedule</h3>
                        <div className="p-4 bg-maritime-dark/30 rounded-lg border border-white/5">
                          <div className="flex items-center justify-between">
                            <span className="font-mono text-text-primary">Departure: {departureDate}</span>
                            <span className="font-mono text-text-primary">Arrival: {arrivalDate}</span>
                          </div>
                        </div>
                      </div>

                      {/* Financial */}
                      <div>
                        <h3 className="text-sm font-mono text-text-muted uppercase mb-3">Financial</h3>
                        <div className="relative overflow-hidden">
                          {/* Animated background glow */}
                          <div className="absolute inset-0 bg-gradient-to-br from-rlusd-primary/5 via-rlusd-glow/10 to-rlusd-primary/5 animate-shimmer"></div>

                          <div className="relative p-6 rounded-xl border-2 border-rlusd-primary/40">
                            <div className="flex items-center gap-3 mb-2">
                              <div className="w-3 h-3 rounded-full bg-rlusd-glow animate-pulse-glow"></div>
                              <span className="text-xs font-mono text-text-muted uppercase tracking-wider">Contract Value</span>
                            </div>
                            <p className="text-3xl font-display font-bold text-rlusd-glow">
                              RLUSD ${parseFloat(contractValue).toLocaleString()}
                            </p>
                          </div>
                        </div>
                      </div>

                      {/* Milestones */}
                      <div>
                        <h3 className="text-sm font-mono text-text-muted uppercase mb-3">
                          Milestones ({autoMilestones.length + customMilestones.length})
                        </h3>
                        <div className="p-4 bg-maritime-dark/30 rounded-lg border border-white/5">
                          <p className="text-sm font-mono text-text-muted">
                            {autoMilestones.length} auto-generated + {customMilestones.length} custom
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Navigation Buttons */}
            <div className="flex items-center justify-between mt-8">
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => setCurrentStep(Math.max(1, currentStep - 1))}
                disabled={currentStep === 1}
                className={`px-6 py-3 rounded-lg border font-mono uppercase flex items-center gap-2 ${
                  currentStep === 1
                    ? 'bg-maritime-slate/20 border-white/5 text-text-muted cursor-not-allowed'
                    : 'bg-maritime-steel/40 border-white/10 text-text-primary hover:border-accent-sky/40'
                }`}
              >
                <ArrowLeft className="w-5 h-5" />
                Previous
              </motion.button>

              {currentStep < totalSteps ? (
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => setCurrentStep(Math.min(totalSteps, currentStep + 1))}
                  disabled={!canProceed()}
                  className={`px-6 py-3 rounded-lg font-mono uppercase flex items-center gap-2 ${
                    canProceed()
                      ? 'bg-gradient-to-r from-accent-sky to-accent-sky/80 text-maritime-dark font-bold'
                      : 'bg-maritime-slate/20 border border-white/5 text-text-muted cursor-not-allowed'
                  }`}
                >
                  Next
                  <ArrowRight className="w-5 h-5" />
                </motion.button>
              ) : (
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={handleCreateVoyage}
                  className="px-8 py-3 bg-gradient-to-r from-rlusd-primary to-rlusd-glow text-maritime-dark font-bold rounded-lg font-mono uppercase flex items-center gap-2"
                >
                  <Navigation className="w-5 h-5" />
                  Create Voyage
                </motion.button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
