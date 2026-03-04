import ClientLayout from "@/components/client/ClientLayout";
import { useClient } from "@/contexts/ClientContext";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { BarChart3 } from "lucide-react";
import { useQuestionnaireStore } from "@/data/useQuestionnaireStore";
import { useTranslation } from "@/i18n/useTranslation";
import AdherenceCard from "@/components/client/progress/AdherenceCard";
import NutritionProgressTab from "@/components/client/progress/NutritionProgressTab";
import TrainingProgressTab from "@/components/client/progress/TrainingProgressTab";

const ClientProgress = () => {
  const { t } = useTranslation();
  const { client } = useClient();
  const hasNutrition = client.services.includes("nutrition");
  const hasTraining = client.services.includes("training");
  const getWeightHistory = useQuestionnaireStore((s) => s.getWeightHistory);
  const getBestRMs = useQuestionnaireStore((s) => s.getBestRMs);
  const getTrainingProgress = useQuestionnaireStore((s) => s.getTrainingProgress);

  const weightData = getWeightHistory(client.id);
  const bestRMs = getBestRMs(client.id);
  const trainingProgress = getTrainingProgress(client.id);
  const defaultTab = hasNutrition ? "nutrition" : "training";

  return (
    <ClientLayout>
      <div className="space-y-5 max-w-lg md:max-w-2xl lg:max-w-4xl mx-auto animate-fade-in">
        <div>
          <h1 className="text-xl font-bold text-foreground flex items-center gap-2">
            <BarChart3 className="h-5 w-5 text-primary" />
            {t("clientProgress.title")}
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">{t("clientProgress.subtitle")}</p>
        </div>

        <AdherenceCard clientId={client.id} />

        <Tabs defaultValue={defaultTab} className="space-y-4">
          <TabsList className="bg-card border border-border w-full">
            {hasNutrition && <TabsTrigger value="nutrition" className="flex-1 text-xs">🍎 {t("common.nutrition")}</TabsTrigger>}
            {hasTraining && <TabsTrigger value="training" className="flex-1 text-xs">🏋️ {t("common.training")}</TabsTrigger>}
          </TabsList>

          {hasNutrition && (
            <TabsContent value="nutrition">
              <NutritionProgressTab clientId={client.id} weightData={weightData} />
            </TabsContent>
          )}

          {hasTraining && (
            <TabsContent value="training">
              <TrainingProgressTab bestRMs={bestRMs} trainingProgress={trainingProgress} />
            </TabsContent>
          )}
        </Tabs>
      </div>
    </ClientLayout>
  );
};

export default ClientProgress;
