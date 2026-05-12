// app/challenge/[id]/details.tsx
// Detailed results view for a completed activity

import Ionicons from "@expo/vector-icons/Ionicons";
import { ResizeMode, Video } from "expo-av";
import { router, useLocalSearchParams } from "expo-router";
import { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { ResultLocationMap } from "@/src/components/ResultLocationMap";
import { getChallengeById } from "../../../src/data/challenges";
import { ActivityResult } from "../../../src/types";
import { storage } from "../../../src/utils/storage";

export default function ActivityDetailsScreen() {
  const { id, resultId } = useLocalSearchParams<{
    id: string;
    resultId: string;
  }>();

  const challenge = getChallengeById(Number(id));
  const [activity, setActivity] = useState<ActivityResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [expandedSections, setExpandedSections] = useState<Set<string>>(
    new Set(["prediction", "measurements", "reflection"]),
  );

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
        <ActivityIndicator size="large" color="#22C55E" />
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
          <Ionicons name="chevron-back" size={24} color="#0F172A" />
          <Text style={styles.backButtonText}>Back</Text>
        </TouchableOpacity>

        <View style={styles.errorContainer}>
          <Ionicons name="alert-circle-outline" size={48} color="#94A3B8" />
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

  // Collect all measurements and their values
  const measurementDetails = challenge.measurements
    .map((m) => {
      const prototypeValues = activity.prototypes.map((p) => ({
        prototypeIndex: p.index,
        value: p.measurements[m.key],
      }));
      return { measurement: m, prototypeValues };
    })
    .filter((item) => item.prototypeValues.some((pv) => pv.value !== undefined));

  const hasVideo = activity.prototypes.some((p) =>
    challenge.measurements.some(
      (m) =>
        (m.recorder === "video" || m.recorder === "slowMotion") &&
        p.measurements[m.key],
    ),
  );

  const hasGPS = Boolean(activity.location);

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
        <Ionicons name="chevron-back" size={24} color="#0F172A" />
        <Text style={styles.backButtonText}>Back</Text>
      </TouchableOpacity>

      {/* Header */}
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

          <View style={styles.headerStat}>
            <Ionicons name="flash" size={16} color="#F59E0B" />
            <Text style={styles.headerStatText}>+{activity.points ?? 0} XP</Text>
          </View>

          <View style={styles.headerStatDivider} />

          <View style={styles.headerStat}>
            <Ionicons name="construct-outline" size={16} color="#64748B" />
            <Text style={styles.headerStatText}>
              {activity.prototypes.length}D
            </Text>
          </View>
        </View>

        <View style={styles.headerBadges}>
          {activity.difficulty === "highSchool" && (
            <View style={styles.difficultyBadge}>
              <Text style={styles.difficultyBadgeText}>High School</Text>
            </View>
          )}

          {hasVideo && (
            <View style={styles.videoBadge}>
              <Ionicons name="videocam" size={12} color="#0369A1" />
              <Text style={styles.videoBadgeText}>Video</Text>
            </View>
          )}

          {hasGPS && (
            <View style={styles.gpsBadge}>
              <Ionicons name="location" size={12} color="#166534" />
              <Text style={styles.gpsBadgeText}>GPS</Text>
            </View>
          )}
        </View>
      </View>

      {/* Prediction Section */}
      <View style={styles.sectionCard}>
        <TouchableOpacity
          style={styles.sectionHeader}
          onPress={() => toggleSection("prediction")}
          activeOpacity={0.7}
        >
          <View style={styles.sectionTitleRow}>
            <Ionicons name="bulb-outline" size={18} color="#F59E0B" />
            <Text style={styles.sectionTitle}>Prediction</Text>
          </View>
          <Ionicons
            name={
              expandedSections.has("prediction")
                ? "chevron-up"
                : "chevron-down"
            }
            size={20}
            color="#64748B"
          />
        </TouchableOpacity>

        {expandedSections.has("prediction") && (
          <View style={styles.sectionContent}>
            {activity.prediction ? (
              <Text style={styles.predictionText}>{activity.prediction}</Text>
            ) : (
              <Text style={styles.emptyText}>No prediction recorded</Text>
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
            color="#64748B"
          />
        </TouchableOpacity>

        {expandedSections.has("measurements") && (
          <View style={styles.sectionContent}>
            {measurementDetails.length === 0 ? (
              <Text style={styles.emptyText}>No measurements recorded</Text>
            ) : (
              measurementDetails.map((item, idx) => (
                <View key={idx} style={styles.measurementGroup}>
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

                  {item.prototypeValues.map((pv, pvIdx) => (
                    <View key={pvIdx} style={styles.measurementValue}>
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
                              📸 Photo attached
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
              <Ionicons name="location-outline" size={18} color="#166534" />
              <Text style={styles.sectionTitle}>Location</Text>
            </View>
            <Ionicons
              name={expandedSections.has("gps") ? "chevron-up" : "chevron-down"}
              size={20}
              color="#64748B"
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
            color="#64748B"
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
            <Ionicons name="checkmark-circle-outline" size={18} color="#22C55E" />
            <Text style={styles.sectionTitle}>Summary</Text>
          </View>
          <Ionicons
            name={
              expandedSections.has("summary")
                ? "chevron-up"
                : "chevron-down"
            }
            size={20}
            color="#64748B"
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
                    color={i <= activity.rating ? "#F59E0B" : "#E2E8F0"}
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
                {activity.completedInTime ? "✅ On Time" : "⏰ Late"}
              </Text>
            </View>
          </View>
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: "#F8FAFC",
  },

  content: {
    padding: 0,
    paddingBottom: 40,
  },

  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#F8FAFC",
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
    color: "#0F172A",
  },

  errorContainer: {
    alignItems: "center",
    gap: 12,
    marginTop: 60,
  },

  errorText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#64748B",
  },

  header: {
    backgroundColor: "#0F172A",
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
    color: "#94A3B8",
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
    backgroundColor: "#166534",
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
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    overflow: "hidden",
  },

  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: "#F1F5F9",
  },

  sectionTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },

  sectionTitle: {
    fontSize: 15,
    fontWeight: "700",
    color: "#0F172A",
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

  emptyText: {
    fontSize: 14,
    color: "#94A3B8",
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
    color: "#0F172A",
  },

  measurementUnit: {
    fontSize: 12,
    color: "#64748B",
  },

  measurementValue: {
    marginLeft: 12,
    marginBottom: 8,
  },

  prototypeLabel: {
    fontSize: 12,
    fontWeight: "600",
    color: "#475569",
    marginBottom: 4,
  },

  measurementText: {
    fontSize: 13,
    color: "#1E293B",
    backgroundColor: "#F8FAFC",
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: 8,
  },

  emptyValueText: {
    fontSize: 13,
    color: "#CBD5E1",
  },

  mediaContainer: {
    marginVertical: 8,
    borderRadius: 12,
    overflow: "hidden",
    backgroundColor: "#F8FAFC",
  },

  mediaPlaceholder: {
    fontSize: 13,
    color: "#0369A1",
    paddingVertical: 16,
    paddingHorizontal: 12,
    textAlign: "center",
    backgroundColor: "#F0F9FF",
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
    backgroundColor: "#F0FDF4",
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginBottom: 12,
  },

  gpsLabel: {
    fontSize: 11,
    fontWeight: "600",
    color: "#166534",
    marginBottom: 2,
  },

  gpsValue: {
    fontSize: 13,
    fontWeight: "700",
    color: "#166534",
    marginBottom: 8,
  },

  reflectionText: {
    fontSize: 14,
    lineHeight: 20,
    color: "#1E293B",
  },

  summaryGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
  },

  summaryItem: {
    flex: 1,
    minWidth: 140,
    backgroundColor: "#F8FAFC",
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 12,
    alignItems: "center",
  },

  summaryLabel: {
    fontSize: 11,
    fontWeight: "600",
    color: "#64748B",
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
    color: "#0F172A",
  },

  xpValue: {
    color: "#F59E0B",
  },
});
