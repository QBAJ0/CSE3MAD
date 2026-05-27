// app/challenge/[id]/details.tsx
// Detailed results view for a completed activity

import Ionicons from "@expo/vector-icons/Ionicons";
import { ResizeMode, Video } from "expo-av";
import { router, useLocalSearchParams } from "expo-router";
import { useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { ResultLocationMap } from "@/src/components/ResultLocationMap";
import { CommentsSection } from "../../../src/components/challenge/CommentsSection";
import { SoundMap } from "../../../src/components/challenge/SoundMap";
import { getChallengeById } from "../../../src/data/challenges";
import { parseSoundMapPoints } from "../../../src/utils/soundMap";
import {
  formatPredictionDisplay,
  getPrototypeOutcomeText,
  getPrototypeWereYouRight,
} from "../../../src/utils/prototypePrediction";
import { useTeam } from "../../../src/context/TeamContext";
import type { ColorTokens } from "../../../src/theme/colors";
import { useTheme } from "../../../src/theme/themeContext";
import { ActivityResult } from "../../../src/types";
import { storage } from "../../../src/utils/storage";

export default function ActivityDetailsScreen() {
  const { id, resultId } = useLocalSearchParams<{
    id: string;
    resultId: string;
  }>();

  const challenge = getChallengeById(Number(id));
  const { team } = useTeam();
  const [activity, setActivity] = useState<ActivityResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [expandedSections, setExpandedSections] = useState<Set<string>>(
    new Set(["prediction", "measurements", "reflection"]),
  );
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);

  useEffect(() => {
    const loadActivity = async () => {
      try {
        if (!resultId) {
          setLoading(false);
          return;
        }

        const activities = await storage.getCompletedActivities();
        const found = activities.find((a) => a.id === resultId);
        setActivity(found || null);
      } catch (e) {
        console.error("Failed to load activity:", e);
      } finally {
        setLoading(false);
      }
    };

    loadActivity();
  }, [resultId]);

  const measurementDetails = useMemo(
    () =>
      !challenge || !activity
        ? []
        : challenge.measurements
            .map((m) => {
              const prototypeValues = activity.prototypes.map((p) => ({
                prototypeIndex: p.index,
                value: p.measurements[m.key],
              }));
              return { measurement: m, prototypeValues };
            })
            .filter((item) => item.prototypeValues.some((pv) => pv.value !== undefined)),
    [challenge, activity],
  );

  const toggleSection = (section: string) => {
    setExpandedSections((prev) => {
      const updated = new Set(prev);
      if (updated.has(section)) {
        updated.delete(section);
      } else {
        updated.add(section);
      }
      return updated;
    });
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color={colors.info} />
      </View>
    );
  }

  if (!challenge || !activity) {
    return (
      <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <Ionicons name="chevron-back" size={24} color={colors.text} />
          <Text style={styles.backButtonText}>Back</Text>
        </TouchableOpacity>

        <View style={styles.errorContainer}>
          <Ionicons name="alert-circle-outline" size={48} color={colors.textMuted} />
          <Text style={styles.errorText}>Activity not found</Text>
        </View>
      </ScrollView>
    );
  }

  const date = new Date(activity.createdAt).toLocaleDateString("en-AU", {
    weekday: "short",
    day: "numeric",
    month: "short",
    year: "numeric",
  });

  const hasVideo = activity.prototypes.some((p) =>
    challenge.measurements.some(
      (m) =>
        (m.recorder === "video" || m.recorder === "slowMotion") &&
        p.measurements[m.key],
    ),
  );

  const hasGPS = Boolean(activity.location);

  const soundMapPoints = parseSoundMapPoints(challenge.id, activity.prototypes);

  return (
    <ScrollView
      style={styles.screen}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
    >
      {/* Back button */}
      <TouchableOpacity
        style={styles.backButton}
        onPress={() => router.back()}
      >
        <Ionicons name="chevron-back" size={24} color={colors.text} />
        <Text style={styles.backButtonText}>Back</Text>
      </TouchableOpacity>

      {/* Header — intentionally blue, as a "completed" design signal */}
      <View style={styles.header}>
        <View
          style={[
            styles.headerIconCircle,
            { backgroundColor: `${challenge.color}22` },
          ]}
        >
          <Ionicons
            name={challenge.icon as any}
            size={32}
            color={challenge.color}
          />
        </View>

        <Text style={styles.challengeTitle}>{challenge.title}</Text>
        <Text style={styles.dateText}>{date}</Text>

        <View style={styles.headerStats}>
          <View style={styles.headerStat}>
            <Ionicons name="star" size={16} color="#F59E0B" />
            <Text style={styles.headerStatText}>{activity.rating}/5</Text>
          </View>

          <View style={styles.headerStatDivider} />

          <View style={styles.headerStatDivider} />

          <View style={styles.headerStat}>
            <Ionicons name="construct-outline" size={16} color="#E2E8F0" />
            <Text style={styles.headerStatText}>
              {activity.prototypes.length}D
            </Text>
          </View>
        </View>

        <View style={styles.headerBadges}>
          {hasVideo && (
            <View style={styles.videoBadge}>
              <Ionicons name="videocam" size={12} color="#0369A1" />
              <Text style={styles.videoBadgeText}>Video</Text>
            </View>
          )}

          {hasGPS && (
            <View style={styles.gpsBadge}>
              <Ionicons name="location" size={12} color="#0F766E" />
              <Text style={styles.gpsBadgeText}>GPS</Text>
            </View>
          )}
        </View>
      </View>

      {/* Prediction / Outcome Section */}
      <View style={styles.sectionCard}>
        <TouchableOpacity
          style={styles.sectionHeader}
          onPress={() => toggleSection("prediction")}
          activeOpacity={0.7}
        >
          <View style={styles.sectionTitleRow}>
            <Ionicons name="bulb-outline" size={18} color="#F59E0B" />
            <Text style={styles.sectionTitle}>Prediction & Outcome</Text>
          </View>
          <Ionicons
            name={
              expandedSections.has("prediction")
                ? "chevron-up"
                : "chevron-down"
            }
            size={20}
            color={colors.textMuted}
          />
        </TouchableOpacity>

        {expandedSections.has("prediction") && (
          <View style={styles.sectionContent}>
            {activity.prototypes.length > 0 ? (
              activity.prototypes.map((prototype, idx) => {
                const predictionDisplay = formatPredictionDisplay(
                  challenge.id,
                  prototype,
                );
                const outcome = getPrototypeOutcomeText(challenge.id, prototype);
                const right = getPrototypeWereYouRight(prototype);
                return (
                  <View key={prototype.index} style={styles.predictionAttemptCard}>
                    <Text style={styles.predictionAttemptTitle}>
                      #{idx + 1}
                    </Text>
                    <Text style={styles.predictionText}>
                      Outcome: {outcome || "Not recorded"}
                    </Text>
                    <Text style={styles.predictionText}>
                      Prediction: {predictionDisplay || "Not recorded"}
                    </Text>
                    <Text style={styles.predictionText}>
                      Were you right?:{" "}
                      {right === "yes" ? "Yes" : right === "no" ? "No" : "Not answered"}
                    </Text>
                  </View>
                );
              })
            ) : (
              <Text style={styles.emptyText}>No attempt data recorded</Text>
            )}
          </View>
        )}
      </View>

      {/* Measurements Section */}
      <View style={styles.sectionCard}>
        <TouchableOpacity
          style={styles.sectionHeader}
          onPress={() => toggleSection("measurements")}
          activeOpacity={0.7}
        >
          <View style={styles.sectionTitleRow}>
            <Ionicons name="document-text-outline" size={18} color="#0369A1" />
            <Text style={styles.sectionTitle}>Measurements</Text>
          </View>
          <Ionicons
            name={
              expandedSections.has("measurements")
                ? "chevron-up"
                : "chevron-down"
            }
            size={20}
            color={colors.textMuted}
          />
        </TouchableOpacity>

        {expandedSections.has("measurements") && (
          <View style={styles.sectionContent}>
            {measurementDetails.length === 0 ? (
              <Text style={styles.emptyText}>No measurements recorded</Text>
            ) : (
              measurementDetails.map((item) => (
                <View key={item.measurement.key} style={styles.measurementGroup}>
                  <View style={styles.measurementLabel}>
                    <Text style={styles.measurementName}>
                      {item.measurement.label}
                    </Text>
                    {item.measurement.unit && (
                      <Text style={styles.measurementUnit}>
                        ({item.measurement.unit})
                      </Text>
                    )}
                  </View>

                  {item.prototypeValues.map((pv) => (
                    <View key={pv.prototypeIndex} style={styles.measurementValue}>
                      <Text style={styles.prototypeLabel}>
                        Design {pv.prototypeIndex}:
                      </Text>

                      {/* Video or photo display */}
                      {(item.measurement.recorder === "video" ||
                        item.measurement.recorder === "slowMotion" ||
                        item.measurement.recorder === "photo") &&
                      typeof pv.value === "string" &&
                      pv.value ? (
                        <View style={styles.mediaContainer}>
                          {item.measurement.recorder === "photo" ? (
                            <Text style={styles.mediaPlaceholder}>
                              Photo attached
                            </Text>
                          ) : (
                            <View style={styles.videoContainer}>
                              <Video
                                source={{ uri: pv.value }}
                                style={styles.videoPreview}
                                useNativeControls
                                resizeMode={ResizeMode.CONTAIN}
                                isLooping
                              />
                            </View>
                          )}
                        </View>
                      ) : pv.value !== undefined && pv.value !== "" ? (
                        <Text style={styles.measurementText}>
                          {String(pv.value)}
                        </Text>
                      ) : (
                        <Text style={styles.emptyValueText}>—</Text>
                      )}
                    </View>
                  ))}
                </View>
              ))
            )}
          </View>
        )}
      </View>

      {/* GPS Section */}
      {hasGPS && (
        <View style={styles.sectionCard}>
          <TouchableOpacity
            style={styles.sectionHeader}
            onPress={() => toggleSection("gps")}
            activeOpacity={0.7}
          >
            <View style={styles.sectionTitleRow}>
              <Ionicons name="location-outline" size={18} color="#0F766E" />
              <Text style={styles.sectionTitle}>Location</Text>
            </View>
            <Ionicons
              name={expandedSections.has("gps") ? "chevron-up" : "chevron-down"}
              size={20}
              color={colors.textMuted}
            />
          </TouchableOpacity>

          {expandedSections.has("gps") && activity.location && (
            <View style={styles.sectionContent}>
              <View style={styles.gpsCoordinates}>
                <Text style={styles.gpsLabel}>Latitude</Text>
                <Text style={styles.gpsValue}>
                  {activity.location.lat.toFixed(6)}°
                </Text>

                <Text style={styles.gpsLabel}>Longitude</Text>
                <Text style={styles.gpsValue}>
                  {activity.location.lng.toFixed(6)}°
                </Text>
              </View>

              <ResultLocationMap
                lat={activity.location.lat}
                lng={activity.location.lng}
              />
            </View>
          )}
        </View>
      )}

      {/* Sound Zone Map – Activity 2 only */}
      {soundMapPoints.length > 0 && (
        <View style={styles.sectionCard}>
          <TouchableOpacity
            style={styles.sectionHeader}
            onPress={() => toggleSection("soundMap")}
            activeOpacity={0.7}
          >
            <View style={styles.sectionTitleRow}>
              <Ionicons name="volume-high-outline" size={18} color="#0F766E" />
              <Text style={styles.sectionTitle}>Sound Pollution Zone Map</Text>
            </View>
            <Ionicons
              name={expandedSections.has("soundMap") ? "chevron-up" : "chevron-down"}
              size={20}
              color={colors.textMuted}
            />
          </TouchableOpacity>

          {expandedSections.has("soundMap") && (
            <SoundMap points={soundMapPoints} />
          )}
        </View>
      )}

      {/* Reflection Section */}
      <View style={styles.sectionCard}>
        <TouchableOpacity
          style={styles.sectionHeader}
          onPress={() => toggleSection("reflection")}
          activeOpacity={0.7}
        >
          <View style={styles.sectionTitleRow}>
            <Ionicons name="chatbubbles-outline" size={18} color="#8B5CF6" />
            <Text style={styles.sectionTitle}>Reflection</Text>
          </View>
          <Ionicons
            name={
              expandedSections.has("reflection")
                ? "chevron-up"
                : "chevron-down"
            }
            size={20}
            color={colors.textMuted}
          />
        </TouchableOpacity>

        {expandedSections.has("reflection") && (
          <View style={styles.sectionContent}>
            {activity.reflection ? (
              <Text style={styles.reflectionText}>{activity.reflection}</Text>
            ) : (
              <Text style={styles.emptyText}>No reflection recorded</Text>
            )}
          </View>
        )}
      </View>

      {/* Summary Section */}
      <View style={styles.sectionCard}>
        <TouchableOpacity
          style={styles.sectionHeader}
          onPress={() => toggleSection("summary")}
          activeOpacity={0.7}
        >
          <View style={styles.sectionTitleRow}>
            <Ionicons name="checkmark-circle-outline" size={18} color="#2563EB" />
            <Text style={styles.sectionTitle}>Summary</Text>
          </View>
          <Ionicons
            name={
              expandedSections.has("summary")
                ? "chevron-up"
                : "chevron-down"
            }
            size={20}
            color={colors.textMuted}
          />
        </TouchableOpacity>

        {expandedSections.has("summary") && (
          <View style={styles.summaryGrid}>
            <View style={styles.summaryItem}>
              <Text style={styles.summaryLabel}>Rating</Text>
              <View style={styles.ratingStars}>
                {[1, 2, 3, 4, 5].map((i) => (
                  <Ionicons
                    key={i}
                    name="star"
                    size={14}
                    color={i <= activity.rating ? "#F59E0B" : colors.border}
                  />
                ))}
              </View>
              <Text style={styles.summaryValue}>{activity.rating}/5</Text>
            </View>

            <View style={styles.summaryItem}>
              <Text style={styles.summaryLabel}>Prototypes</Text>
              <Text style={styles.summaryValue}>
                {activity.prototypes.length}
              </Text>
            </View>

            <View style={styles.summaryItem}>
              <Text style={styles.summaryLabel}>Points Earned</Text>
              <Text style={[styles.summaryValue, styles.xpValue]}>
                +{activity.points ?? 0}
              </Text>
            </View>

            <View style={styles.summaryItem}>
              <Text style={styles.summaryLabel}>Time Limit</Text>
              <Text style={styles.summaryValue}>
                {activity.completedInTime ? "On Time" : "Late"}
              </Text>
            </View>
          </View>
        )}
      </View>

      {team && (
        <CommentsSection
          challengeId={Number(id)}
          teamName={team.teamName}
          discriminator={team.discriminator}
        />
      )}
    </ScrollView>
  );
}

function createStyles(c: ColorTokens) {
  return StyleSheet.create({
    screen: {
      flex: 1,
      backgroundColor: c.background,
    },

    content: {
      paddingTop: 24,
      paddingBottom: 40,
    },

    container: {
      flex: 1,
      justifyContent: "center",
      alignItems: "center",
      backgroundColor: c.background,
    },

    backButton: {
      flexDirection: "row",
      alignItems: "center",
      paddingHorizontal: 20,
      paddingTop: 16,
      paddingBottom: 8,
      gap: 4,
    },

    backButtonText: {
      fontSize: 16,
      fontWeight: "600",
      color: c.text,
    },

    errorContainer: {
      alignItems: "center",
      gap: 12,
      marginTop: 60,
    },

    errorText: {
      fontSize: 16,
      fontWeight: "600",
      color: c.textSecondary,
    },

    // Intentionally blue header — signals "completed activity" view
    header: {
      backgroundColor: "#2563EB",
      paddingHorizontal: 20,
      paddingVertical: 24,
      alignItems: "center",
      gap: 12,
      borderBottomLeftRadius: 24,
      borderBottomRightRadius: 24,
    },

    headerIconCircle: {
      width: 72,
      height: 72,
      borderRadius: 36,
      alignItems: "center",
      justifyContent: "center",
      marginBottom: 8,
    },

    challengeTitle: {
      fontSize: 24,
      fontWeight: "800",
      color: "#FFFFFF",
      textAlign: "center",
    },

    dateText: {
      fontSize: 13,
      color: "rgba(255,255,255,0.8)",
    },

    headerStats: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      gap: 12,
      marginTop: 8,
    },

    headerStat: {
      flexDirection: "row",
      alignItems: "center",
      gap: 4,
    },

    headerStatText: {
      fontSize: 14,
      fontWeight: "600",
      color: "#E2E8F0",
    },

    headerStatDivider: {
      width: 1,
      height: 16,
      backgroundColor: "#475569",
    },

    headerBadges: {
      flexDirection: "row",
      justifyContent: "center",
      gap: 8,
      marginTop: 12,
      flexWrap: "wrap",
    },

    // Data-category badge colors are intentionally hardcoded
    difficultyBadge: {
      backgroundColor: "#7C3AED",
      paddingHorizontal: 10,
      paddingVertical: 4,
      borderRadius: 999,
    },

    difficultyBadgeText: {
      fontSize: 11,
      fontWeight: "600",
      color: "#FFFFFF",
    },

    videoBadge: {
      flexDirection: "row",
      alignItems: "center",
      backgroundColor: "#0369A1",
      paddingHorizontal: 10,
      paddingVertical: 4,
      borderRadius: 999,
      gap: 4,
    },

    videoBadgeText: {
      fontSize: 11,
      fontWeight: "600",
      color: "#FFFFFF",
    },

    gpsBadge: {
      flexDirection: "row",
      alignItems: "center",
      backgroundColor: "#0F766E",
      paddingHorizontal: 10,
      paddingVertical: 4,
      borderRadius: 999,
      gap: 4,
    },

    gpsBadgeText: {
      fontSize: 11,
      fontWeight: "600",
      color: "#FFFFFF",
    },

    sectionCard: {
      marginHorizontal: 16,
      marginVertical: 8,
      backgroundColor: c.surface,
      borderRadius: 16,
      borderWidth: 1,
      borderColor: c.border,
      overflow: "hidden",
    },

    sectionHeader: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      paddingHorizontal: 16,
      paddingVertical: 14,
      borderBottomWidth: 1,
      borderBottomColor: c.borderFaint,
    },

    sectionTitleRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: 10,
    },

    sectionTitle: {
      fontSize: 15,
      fontWeight: "700",
      color: c.text,
    },

    sectionContent: {
      paddingHorizontal: 16,
      paddingVertical: 12,
    },

  predictionText: {
    fontSize: 14,
    lineHeight: 20,
    color: "#1E293B",
  },
  predictionAttemptCard: {
    backgroundColor: "#F8FAFC",
    borderWidth: 1,
    borderColor: "#E2E8F0",
    borderRadius: 12,
    padding: 10,
    marginBottom: 8,
    gap: 4,
  },
  predictionAttemptTitle: {
    fontSize: 12,
    fontWeight: "700",
    color: "#0F172A",
    marginBottom: 2,
  },

    emptyText: {
      fontSize: 14,
      color: c.textMuted,
      fontStyle: "italic",
    },

    measurementGroup: {
      marginBottom: 16,
    },

    measurementLabel: {
      flexDirection: "row",
      alignItems: "center",
      gap: 4,
      marginBottom: 8,
    },

    measurementName: {
      fontSize: 13,
      fontWeight: "700",
      color: c.text,
    },

    measurementUnit: {
      fontSize: 12,
      color: c.textSecondary,
    },

    measurementValue: {
      marginLeft: 12,
      marginBottom: 8,
    },

    prototypeLabel: {
      fontSize: 12,
      fontWeight: "600",
      color: c.textSecondary,
      marginBottom: 4,
    },

    measurementText: {
      fontSize: 13,
      color: c.text,
      backgroundColor: c.backgroundSecondary,
      paddingHorizontal: 10,
      paddingVertical: 8,
      borderRadius: 8,
    },

    emptyValueText: {
      fontSize: 13,
      color: c.border,
    },

    mediaContainer: {
      marginVertical: 8,
      borderRadius: 12,
      overflow: "hidden",
      backgroundColor: c.backgroundSecondary,
    },

    mediaPlaceholder: {
      fontSize: 13,
      color: "#0369A1",
      paddingVertical: 16,
      paddingHorizontal: 12,
      textAlign: "center",
      backgroundColor: c.infoLight,
      borderRadius: 8,
    },

    videoContainer: {
      width: "100%",
      height: 200,
      backgroundColor: "#000000",
      borderRadius: 8,
      overflow: "hidden",
    },

    videoPreview: {
      width: "100%",
      height: "100%",
    },

    gpsCoordinates: {
      backgroundColor: c.infoLight,
      borderRadius: 12,
      paddingHorizontal: 16,
      paddingVertical: 12,
      marginBottom: 12,
    },

    gpsLabel: {
      fontSize: 11,
      fontWeight: "600",
      color: c.info,
      marginBottom: 2,
    },

    gpsValue: {
      fontSize: 13,
      fontWeight: "700",
      color: c.info,
      marginBottom: 8,
    },

    reflectionText: {
      fontSize: 14,
      lineHeight: 20,
      color: c.text,
    },

    summaryGrid: {
      flexDirection: "row",
      flexWrap: "wrap",
      gap: 12,
    },

    summaryItem: {
      flex: 1,
      minWidth: 140,
      backgroundColor: c.backgroundSecondary,
      borderRadius: 12,
      paddingHorizontal: 12,
      paddingVertical: 12,
      alignItems: "center",
    },

    summaryLabel: {
      fontSize: 11,
      fontWeight: "600",
      color: c.textSecondary,
      marginBottom: 6,
    },

    ratingStars: {
      flexDirection: "row",
      gap: 2,
      marginBottom: 4,
    },

    summaryValue: {
      fontSize: 16,
      fontWeight: "700",
      color: c.text,
    },

    xpValue: {
      color: "#F59E0B",
    },
  });
}
