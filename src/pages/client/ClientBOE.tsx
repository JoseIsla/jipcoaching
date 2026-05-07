import { useState, useEffect, useCallback, useMemo } from "react";
import { motion } from "framer-motion";
import ClientLayout from "@/components/client/ClientLayout";
import { useClient } from "@/contexts/ClientContext";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { FileText, ChevronDown, CalendarDays, Info } from "lucide-react";
import AnimatedChevron from "@/components/ui/animated-chevron";
import PassFailInfoBadge from "@/components/ui/pass-fail-info-badge";
import { useTrainingPlanStore, isOppositionModality } from "@/data/useTrainingPlanStore";
import { OppositionType, oppositionTypeLabels } from "@/types/api";
import type { PhysicalTestScaleEntry } from "@/types/api";
import { getOppositionTypeFromModality, getTestsForGender } from "@/data/oppositionScales";
import { GC_CONVOCATORIAS } from "@/data/guardiaCivilConvocatorias";
import { api } from "@/services/api";
import PullToRefresh from "@/components/client/PullToRefresh";

/** Opposition info mirroring AdminBaremos */
const oppositionInfo: Record<OppositionType, { title: string; description: string; boeRef: string; ageNote: string; scoring: string }> = {
  [OppositionType.POLICIA_NACIONAL]: {
    title: "Policía Nacional — Escala Básica",
    description: "Las pruebas físicas constan de circuito de agilidad, dominadas (hombres) o suspensión en barra (mujeres), y carrera de 1000 metros.",
    boeRef: "BOE Resolución del 11 de septiembre de 2024 (Orden INT/1136/2024).",
    ageNote: "Baremos únicos sin distinción de grupo de edad. Diferenciados por sexo.",
    scoring: "Escala 0-10 puntos por prueba. El aspirante debe alcanzar la puntuación mínima en cada prueba para superar esta fase.",
  },
  [OppositionType.POLICIA_LOCAL]: {
    title: "Policía Local",
    description: "Las pruebas físicas siguen los baremos de referencia de Policía Nacional. Las pruebas exactas pueden variar según el municipio convocante.",
    boeRef: "Varía según municipio. Referencia base: baremos CNP.",
    ageNote: "Depende de la convocatoria municipal concreta.",
    scoring: "Normalmente escala 0-10 puntos, pero puede variar por municipio. Consultar la convocatoria oficial.",
  },
  [OppositionType.BOMBEROS]: {
    title: "Bomberos",
    description: "Las pruebas incluyen carreras (60m, 100m, 1000m, 2000m), natación 50m, salto vertical, press de banca, dominadas y circuito de agilidad.",
    boeRef: "Varía según comunidad autónoma y ayuntamiento convocante.",
    ageNote: "Marcas generales. Consultar tramos de edad de cada convocatoria específica.",
    scoring: "Sistema apto / no apto. Todas las pruebas son eliminatorias: si no se supera una, el aspirante queda excluido.",
  },
  [OppositionType.TROPA_MARINERIA]: {
    title: "Tropa y Marinería",
    description: "Las pruebas constan de salto vertical, flexiones de brazos y Course Navette (test de resistencia aeróbica).",
    boeRef: "BOE — Resolución del MINISDEF, convocatoria anual de Tropa y Marinería.",
    ageNote: "Baremos únicos. No hay distinción por rango de edad.",
    scoring: "Sistema apto / no apto. El aspirante debe alcanzar las marcas mínimas en todas las pruebas.",
  },
  [OppositionType.GUARDIA_CIVIL]: {
    title: "Guardia Civil — Escala de Cabos y Guardias",
    description: "Las pruebas constan de carrera de resistencia 2000m, circuito de agilidad y coordinación, flexiones de brazos (potencia tren superior) y natación 50m (soltura acuática).",
    boeRef: "Ver convocatoria seleccionada.",
    ageNote: "3 grupos de edad: menor de 35 años, de 35 a 40 años, 40 años o más. Marcas diferenciadas por sexo y edad.",
    scoring: "Sistema apto / no apto. Todas las pruebas son obligatorias y eliminatorias. El aspirante calificado como «no apto» en cualquier ejercicio queda excluido.",
  },
};

const formatTimeValue = (seconds: number): string => {
  if (seconds >= 60) {
    const m = Math.floor(seconds / 60);
    const s = Math.round(seconds % 60);
    return `${m}'${s.toString().padStart(2, "0")}''`;
  }
  return `${seconds.toFixed(1)}''`;
};

const ClientBOE = () => {
  const { client } = useClient();
  const plans = useTrainingPlanStore((s) => s.plans);
  const fetchPlans = useTrainingPlanStore((s) => s.fetchPlans);
  const [scales, setScales] = useState<PhysicalTestScaleEntry[]>([]);
  const [gcConvYear, setGcConvYear] = useState<number>(GC_CONVOCATORIAS[0].year);

  const gcConv = useMemo(
    () => GC_CONVOCATORIAS.find(c => c.year === gcConvYear) ?? GC_CONVOCATORIAS[0],
    [gcConvYear]
  );

  const refreshData = useCallback(async () => {
    await fetchPlans(client.id);
  }, [client.id, fetchPlans]);

  useEffect(() => { refreshData(); }, [client.id]);

  const activePlan = plans.find((p) => p.clientId === client.id && p.active);
  const opType = activePlan && isOppositionModality(activePlan.modality)
    ? getOppositionTypeFromModality(activePlan.modality)
    : null;

  const genderKey = (client.sex?.toUpperCase() === "F" || client.sex?.toUpperCase() === "FEMALE" ? "FEMALE" : "MALE") as "MALE" | "FEMALE";
  const tests = opType ? getTestsForGender(opType, genderKey) : [];
  const isGC = opType === OppositionType.GUARDIA_CIVIL;
  const info = opType ? oppositionInfo[opType] : null;

  // Fetch scales from DB for non-GC oppositions
  useEffect(() => {
    if (!opType || isGC) return;
    api.get<PhysicalTestScaleEntry[]>(`/training/physical-scales?oppositionType=${opType}&gender=${genderKey}`)
      .then(d => setScales(d || []))
      .catch(() => {});
  }, [opType, genderKey, isGC]);

  const isPassFail = isGC || (scales.length > 0 && scales.every(s => s.score === 0 || s.score === 5));
  const boeRef = isGC ? gcConv.boeRef : info?.boeRef ?? "";

  // Group scales by testName
  const grouped = scales.reduce<Record<string, PhysicalTestScaleEntry[]>>((acc, s) => {
    if (!acc[s.testName]) acc[s.testName] = [];
    acc[s.testName].push(s);
    return acc;
  }, {});
  Object.values(grouped).forEach(arr => arr.sort((a, b) => a.score - b.score));

  const stagger = { animate: { transition: { staggerChildren: 0.07 } } };
  const fadeUp = {
    initial: { opacity: 0, y: 16 },
    animate: { opacity: 1, y: 0, transition: { duration: 0.3, ease: "easeOut" as const } },
  };

  if (!opType || !info) {
    return (
      <ClientLayout>
        <div className="flex flex-col items-center justify-center h-64 text-center">
          <FileText className="h-12 w-12 text-muted-foreground mb-4" />
          <h2 className="text-lg font-semibold text-foreground">Sin plan de oposiciones activo</h2>
          <p className="text-sm text-muted-foreground mt-1">Necesitas un plan de entrenamiento de oposiciones activo para ver la información del BOE.</p>
        </div>
      </ClientLayout>
    );
  }

  return (
    <ClientLayout>
      <PullToRefresh onRefresh={refreshData}>
      <motion.div className="space-y-4 max-w-lg mx-auto" variants={stagger} initial="initial" animate="animate">
        {/* Header */}
        <motion.div variants={fadeUp}>
          <div className="flex items-center gap-2 mb-1">
            <FileText className="h-5 w-5 text-accent" />
            <h1 className="text-xl font-bold text-foreground">Pruebas Físicas BOE</h1>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <Badge variant="outline" className="text-[10px]">{oppositionTypeLabels[opType]}</Badge>
            <Badge variant="secondary" className="text-[10px]">{genderKey === "MALE" ? "Hombre" : "Mujer"}</Badge>
          </div>
        </motion.div>

        {/* GC convocatoria selector */}
        {isGC && (
          <motion.div variants={fadeUp} className="flex items-center gap-2">
            <CalendarDays className="h-3.5 w-3.5 text-muted-foreground" />
            <Select value={String(gcConvYear)} onValueChange={(v) => setGcConvYear(Number(v))}>
              <SelectTrigger className="h-8 w-[220px] text-xs bg-background border-border">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {GC_CONVOCATORIAS.map(c => (
                  <SelectItem key={c.year} value={String(c.year)} className="text-xs">{c.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </motion.div>
        )}

        {/* Info card */}
        <motion.div variants={fadeUp}>
          <Card className="p-4 border border-border/50 space-y-3">
            <h2 className="text-sm font-bold text-foreground">{info.title}</h2>
            <p className="text-xs text-muted-foreground leading-relaxed">{info.description}</p>
            <div className="space-y-1.5">
              <div className="flex items-start gap-2">
                <span className="text-[10px] shrink-0">📄</span>
                <p className="text-[11px] text-muted-foreground">{isGC ? gcConv.boeRef : info.boeRef}</p>
              </div>
              <div className="flex items-start gap-2">
                <span className="text-[10px] shrink-0">👥</span>
                <p className="text-[11px] text-muted-foreground">{info.ageNote}</p>
              </div>
              <div className="flex items-start gap-2">
                <span className="text-[10px] shrink-0">📊</span>
                <p className="text-[11px] text-muted-foreground">{info.scoring}</p>
              </div>
            </div>
          </Card>
        </motion.div>

        {/* Test list */}
        <motion.div variants={fadeUp} className="space-y-2">
          <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
            Pruebas aplicables ({tests.length})
          </h3>
          {tests.map(testDef => {
            const testScales = grouped[testDef.testName] || [];

            return (
              <TestCard
                key={testDef.testName}
                testDef={testDef}
                scales={testScales}
                isPassFail={isPassFail}
                isGC={isGC}
                gcConv={isGC ? gcConv : undefined}
                gender={genderKey}
                boeRef={boeRef}
              />
            );
          })}
        </motion.div>

        {/* GC age group thresholds */}
        {isGC && (
          <motion.div variants={fadeUp}>
            <Card className="border border-border/30 overflow-hidden">
              <div className="p-3">
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">
                  Marcas mínimas por grupo de edad
                </p>
                <div className="space-y-3">
                  {gcConv.ageGroups.map(ag => (
                    <div key={ag.key}>
                      <p className="text-xs font-medium text-foreground mb-1">{ag.label}</p>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-0.5">
                        {ag.thresholds.map(t => {
                          const mVal = t.unit === "seconds" ? formatTimeValue(t.male) : `${t.male} ${t.unitLabel}`;
                          const fVal = t.unit === "seconds" ? formatTimeValue(t.female) : `${t.female} ${t.unitLabel}`;
                          return (
                            <div key={t.testName} className="text-[11px] flex justify-between">
                              <span className="text-muted-foreground">{t.testName}</span>
                              <span className="text-foreground">
                                H {t.lowerIsBetter ? "≤" : "≥"}{mVal} / M {t.lowerIsBetter ? "≤" : "≥"}{fVal}
                              </span>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </Card>
          </motion.div>
        )}

        {/* Non-GC baremos table */}
        {!isGC && scales.length > 0 && (
          <motion.div variants={fadeUp} className="space-y-2">
            <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Tabla de baremos ({genderKey === "MALE" ? "Hombre" : "Mujer"})
            </h3>
            {Object.entries(grouped).map(([testName, entries]) => (
              <ScaleTable key={testName} testName={testName} entries={entries} isPassFail={isPassFail} boeRef={boeRef} />
            ))}
          </motion.div>
        )}

        {/* Footer note */}
        <motion.div variants={fadeUp}>
          <div className="flex items-start gap-2 p-3 rounded-lg bg-muted/30 border border-border/30">
            <Info className="h-3.5 w-3.5 text-muted-foreground shrink-0 mt-0.5" />
            <p className="text-[10px] text-muted-foreground leading-relaxed">
              Los baremos mostrados son orientativos. Consulta siempre la convocatoria oficial publicada en el BOE para confirmar las marcas vigentes en tu proceso selectivo.
            </p>
          </div>
        </motion.div>
      </motion.div>
      </PullToRefresh>
    </ClientLayout>
  );
};


/** Individual test card with collapsible description */
interface TestCardProps {
  testDef: { testName: string; unit: string; unitLabel: string; lowerIsBetter: boolean };
  scales: PhysicalTestScaleEntry[];
  isPassFail: boolean;
  isGC: boolean;
  gcConv?: typeof GC_CONVOCATORIAS[0];
  gender: "MALE" | "FEMALE";
  boeRef?: string;
}

const TEST_DESCRIPTIONS: Record<string, string> = {
  "Circuito de agilidad": "Recorrido de un circuito con obstáculos en el menor tiempo posible. Se permiten dos intentos si el primero resulta nulo.",
  "Carrera 2000m": "Carrera de 2000 metros lisos en pista. Un único intento. Evalúa la resistencia aeróbica.",
  "Flexiones de brazos": "Flexiones-extensiones de brazos desde posición inclinada. Se permiten dos intentos espaciados.",
  "Natación 50m": "Recorrido de 50 metros estilo libre en piscina. Un único intento. Evalúa soltura acuática.",
  "Carrera 1000m": "Carrera de 1000 metros lisos en pista. Evalúa resistencia muscular.",
  "Dominadas": "Máximo número de dominadas con agarre en pronación. Sin balanceo.",
  "Suspensión en barra": "Mantenerse suspendido con brazos flexionados el máximo tiempo posible.",
  "Carrera 60m": "Sprint de 60 metros lisos. Evalúa velocidad pura.",
  "Carrera 100m": "Sprint de 100 metros lisos.",
  "Salto vertical": "Salto vertical desde posición estática. Se mide la altura alcanzada.",
  "Press de banca": "Levantamiento máximo de peso en press de banca horizontal.",
  "Course Navette": "Test de resistencia aeróbica con carreras de ida y vuelta a ritmo progresivo.",
};

const TestCard = ({ testDef, scales, isPassFail, isGC, gcConv, gender, boeRef }: TestCardProps) => {
  const [open, setOpen] = useState(false);
  const description = TEST_DESCRIPTIONS[testDef.testName];

  // For GC, show threshold from convocatoria
  const gcThresholds = isGC && gcConv
    ? gcConv.ageGroups.map(ag => {
        const t = ag.thresholds.find(th => th.testName === testDef.testName);
        if (!t) return null;
        const val = gender === "MALE" ? t.male : t.female;
        const display = t.unit === "seconds" ? formatTimeValue(val) : `${val} ${t.unitLabel}`;
        return { label: ag.label, display, symbol: t.lowerIsBetter ? "≤" : "≥" };
      }).filter(Boolean) as Array<{ label: string; display: string; symbol: string }>
    : [];

  return (
    <Collapsible open={open} onOpenChange={setOpen}>
      <Card className="border border-border/50 overflow-hidden">
        <CollapsibleTrigger className="w-full flex items-center justify-between p-3 hover:bg-muted/30 transition-colors">
          <div className="flex items-center gap-2">
            <AnimatedChevron open={open} />
            <span className="text-sm font-semibold text-foreground">{testDef.testName}</span>
            <Badge variant="outline" className="text-[9px]">{testDef.unitLabel}</Badge>
          </div>
          {isPassFail && (
            <PassFailInfoBadge
              boeRef={boeRef}
            />
          )}
        </CollapsibleTrigger>
        <CollapsibleContent>
          <div className="px-3 pb-3 space-y-2 border-t border-border/30 pt-2">
            {description && (
              <p className="text-xs text-muted-foreground leading-relaxed">{description}</p>
            )}

            {/* GC thresholds by age group */}
            {gcThresholds.length > 0 && (
              <div className="space-y-1">
                <p className="text-[10px] font-semibold text-muted-foreground uppercase">Marcas mínimas ({gender === "MALE" ? "H" : "M"})</p>
                {gcThresholds.map(t => (
                  <div key={t.label} className="flex justify-between text-[11px]">
                    <span className="text-muted-foreground">{t.label}</span>
                    <span className="text-foreground font-medium">{t.symbol} {t.display}</span>
                  </div>
                ))}
              </div>
            )}

            {/* Non-GC scale rows */}
            {!isGC && scales.length > 0 && (
              <div className="space-y-1">
                <p className="text-[10px] font-semibold text-muted-foreground uppercase">Baremos</p>
                {scales.map(s => (
                  <div key={s.id} className="flex items-center justify-between text-[11px]">
                    <span className="text-muted-foreground">{s.minValue} – {s.maxValue} {testDef.unitLabel}</span>
                    <div className="flex items-center gap-1.5">
                      {isPassFail ? (
                        <PassFailInfoBadge
                          boeRef={boeRef}
                          variant={s.score >= 5 ? "apto" : "noApto"}
                        />
                      ) : (
                        <span className="text-foreground font-medium">{s.score} pts</span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {!isGC && scales.length === 0 && (
              <p className="text-[10px] text-muted-foreground italic">Sin baremos cargados para esta prueba.</p>
            )}
          </div>
        </CollapsibleContent>
      </Card>
    </Collapsible>
  );
};

/** Compact scale table for non-GC oppositions */
const ScaleTable = ({ testName, entries, isPassFail, boeRef }: { testName: string; entries: PhysicalTestScaleEntry[]; isPassFail: boolean; boeRef?: string }) => (
  <Card className="border border-border/50 overflow-hidden">
    <div className="px-3 py-2 bg-muted/30 border-b border-border/30">
      <span className="text-xs font-semibold text-foreground">{testName}</span>
      <Badge variant="outline" className="text-[9px] ml-2">{entries[0]?.unit}</Badge>
    </div>
    <div className="divide-y divide-border/30">
      {entries.map(s => (
        <div key={s.id} className="flex items-center justify-between px-3 py-1.5 text-[11px]">
          <span className="text-muted-foreground">{s.minValue} – {s.maxValue}</span>
          {isPassFail ? (
            <PassFailInfoBadge
              boeRef={boeRef}
              variant={s.score >= 5 ? "apto" : "noApto"}
            />
          ) : (
            <span className="text-foreground font-bold">{s.score} pts</span>
          )}
        </div>
      ))}
    </div>
  </Card>
);

export default ClientBOE;