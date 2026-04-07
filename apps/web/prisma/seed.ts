import { PrismaClient, UserRole, CompressorStatus, TelemetrySource, AlertSeverity } from "@prisma/client";
import { Decimal } from "@prisma/client/runtime/library";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Seeding database...");

  // ─── Site ───────────────────────────────────────────────────────────
  const site = await prisma.site.upsert({
    where: { id: "site-hydrogen-01" },
    update: {},
    create: {
      id: "site-hydrogen-01",
      name: "Hydrogen Station Alpha",
      timezone: "America/Chicago",
      location: "Houston, TX",
    },
  });

  console.log("  ✓ Site created");

  // ─── Users ──────────────────────────────────────────────────────────
  const users = [
    { id: "user-admin-01", email: "admin@mpc.local", name: "Sarah Chen", role: UserRole.ADMIN },
    { id: "user-engineer-01", email: "engineer@mpc.local", name: "Marcus Rivera", role: UserRole.ENGINEER },
    { id: "user-engineer-02", email: "engineer2@mpc.local", name: "Aisha Patel", role: UserRole.ENGINEER },
    { id: "user-operator-01", email: "operator@mpc.local", name: "James Wilson", role: UserRole.OPERATOR },
    { id: "user-operator-02", email: "operator2@mpc.local", name: "Lisa Thompson", role: UserRole.OPERATOR },
  ];

  for (const user of users) {
    await prisma.user.upsert({
      where: { id: user.id },
      update: {},
      create: { ...user, status: "ACTIVE" },
    });
  }

  console.log("  ✓ 5 users created");

  // ─── Compressors ────────────────────────────────────────────────────
  const compressors = [
    { portNumber: 1, maxFlow: 5000, minFlow: 1000, startupPenalty: 250, runningStatus: CompressorStatus.ON, priceFactor: 1.0, minTakePerDay: 8000, availability: 98.5 },
    { portNumber: 2, maxFlow: 4500, minFlow: 900, startupPenalty: 200, runningStatus: CompressorStatus.ON, priceFactor: 1.1, minTakePerDay: 7500, availability: 95.2 },
    { portNumber: 3, maxFlow: 6000, minFlow: 1200, startupPenalty: 300, runningStatus: CompressorStatus.OFF, priceFactor: 0.95, minTakePerDay: 10000, availability: 100.0 },
    { portNumber: 4, maxFlow: 5500, minFlow: 1100, startupPenalty: 275, runningStatus: CompressorStatus.ON, priceFactor: 1.05, minTakePerDay: 9000, availability: 92.8 },
  ];

  for (const comp of compressors) {
    await prisma.compressor.upsert({
      where: { portNumber_siteId: { portNumber: comp.portNumber, siteId: site.id } },
      update: {},
      create: {
        portNumber: comp.portNumber,
        siteId: site.id,
        maxFlow: new Decimal(comp.maxFlow),
        minFlow: new Decimal(comp.minFlow),
        startupPenalty: new Decimal(comp.startupPenalty),
        runningStatus: comp.runningStatus,
        priceFactor: new Decimal(comp.priceFactor),
        minTakePerDay: new Decimal(comp.minTakePerDay),
        availability: new Decimal(comp.availability),
        updatedById: users[0]!.id,
      },
    });
  }

  console.log("  ✓ 4 compressors created");

  // ─── Telemetry (24h of mock data, 5-minute intervals) ─────────────
  const now = new Date();
  const readings: {
    source: TelemetrySource;
    siteId: string;
    timestamp: Date;
    value: Decimal;
    unit: string;
  }[] = [];

  for (let i = 0; i < 288; i++) {
    // 288 x 5min = 24h
    const timestamp = new Date(now.getTime() - (287 - i) * 5 * 60 * 1000);
    const hour = timestamp.getHours();
    const noise = () => (Math.random() - 0.5) * 2;

    // Pressure header: ~2800-3200 PSI with daily cycle
    readings.push({
      source: TelemetrySource.PRESSURE_HEADER,
      siteId: site.id,
      timestamp,
      value: new Decimal((3000 + 200 * Math.sin((hour / 24) * 2 * Math.PI) + noise() * 50).toFixed(6)),
      unit: "PSI",
    });

    // Pressure LIQ 01: ~150-180 PSI
    readings.push({
      source: TelemetrySource.PRESSURE_LIQ_01,
      siteId: site.id,
      timestamp,
      value: new Decimal((165 + 15 * Math.sin((hour / 24) * 2 * Math.PI) + noise() * 5).toFixed(6)),
      unit: "PSI",
    });

    // Power: ~800-1200 kW with demand pattern
    readings.push({
      source: TelemetrySource.POWER,
      siteId: site.id,
      timestamp,
      value: new Decimal((1000 + 200 * Math.sin(((hour - 6) / 24) * 2 * Math.PI) + noise() * 30).toFixed(6)),
      unit: "kW",
    });

    // Price: ~0.04-0.12 $/kWh with peak hours
    const isPeakHour = hour >= 14 && hour <= 20;
    readings.push({
      source: TelemetrySource.PRICE,
      siteId: site.id,
      timestamp,
      value: new Decimal(((isPeakHour ? 0.09 : 0.05) + noise() * 0.01).toFixed(6)),
      unit: "$/kWh",
    });

    // Liquifier flow: ~200-400 Nm3/h
    readings.push({
      source: TelemetrySource.LIQUIFIER_FLOW,
      siteId: site.id,
      timestamp,
      value: new Decimal((300 + 100 * Math.sin((hour / 24) * 2 * Math.PI) + noise() * 20).toFixed(6)),
      unit: "Nm3/h",
    });

    // Liquifier temp: ~-250 to -245 C
    readings.push({
      source: TelemetrySource.LIQUIFIER_TEMP,
      siteId: site.id,
      timestamp,
      value: new Decimal((-247.5 + 2.5 * Math.sin((hour / 24) * 2 * Math.PI) + noise() * 0.5).toFixed(6)),
      unit: "°C",
    });
  }

  // Batch insert telemetry
  await prisma.telemetryReading.createMany({ data: readings });
  console.log(`  ✓ ${readings.length} telemetry readings created (24h, 5-min intervals)`);

  // ─── Demand Forecasts (24h ahead, hourly) ─────────────────────────
  const forecasts = [];
  for (let i = 0; i < 24; i++) {
    const timestamp = new Date(now.getTime() + i * 60 * 60 * 1000);
    const hour = timestamp.getHours();
    const baseDemand = 5000 + 2000 * Math.sin(((hour - 6) / 24) * 2 * Math.PI);

    forecasts.push({
      siteId: site.id,
      timestamp,
      existingDemand: new Decimal((baseDemand + (Math.random() - 0.5) * 500).toFixed(6)),
      predictedDemand: new Decimal((baseDemand * 1.05 + (Math.random() - 0.5) * 300).toFixed(6)),
      modelVersion: "v1.0-mock",
    });
  }

  await prisma.demandForecast.createMany({ data: forecasts });
  console.log("  ✓ 24 demand forecasts created");

  // ─── Alerts ─────────────────────────────────────────────────────────
  const alerts = [
    { severity: AlertSeverity.DANGER, message: "Header pressure exceeding high limit (3200 PSI)", source: "PRESSURE_HEADER" },
    { severity: AlertSeverity.WARN, message: "Compressor #3 offline — scheduled maintenance", source: "COMPRESSOR" },
    { severity: AlertSeverity.WARN, message: "Energy price approaching peak threshold ($0.10/kWh)", source: "PRICE" },
    { severity: AlertSeverity.INFO, message: "Demand forecast model retrained — accuracy improved 2.3%", source: "ML_MODEL" },
    { severity: AlertSeverity.DANGER, message: "Liquifier temperature deviation detected (-243°C)", source: "LIQUIFIER_TEMP" },
    { severity: AlertSeverity.INFO, message: "Daily report generated for Hydrogen Station Alpha", source: "SYSTEM" },
    { severity: AlertSeverity.WARN, message: "Compressor #4 availability dropped below 93%", source: "COMPRESSOR" },
  ];

  for (const alert of alerts) {
    await prisma.alert.create({ data: alert });
  }

  console.log("  ✓ 7 alerts created");

  // ─── Audit Log (initial entries) ──────────────────────────────────
  await prisma.auditLog.create({
    data: {
      userId: users[0]!.id,
      action: "CREATE",
      resourceType: "SYSTEM",
      resourceId: "initial-seed",
      metadata: { description: "Initial database seed" },
    },
  });

  console.log("  ✓ Audit log initialized");
  console.log("\n✅ Seed complete!");
  console.log("\nDev login emails:");
  for (const user of users) {
    console.log(`  ${user.role.padEnd(10)} → ${user.email}`);
  }
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error("Seed failed:", e);
    await prisma.$disconnect();
    process.exit(1);
  });
