import { CLUB_CATEGORIES, ClubStepProps } from "@features/clubs/club.types"
import { Pressable, ScrollView, View } from "react-native"
import { Input, Text } from "@components/core"
import ClubLinksEditor from "@features/clubs/components/ClubLinksEditor"

/**
 * Info step of creating a club
 *
 * @author AJ Kneisl
 */
export default function ClubInfoStep({
    updateField,
    formState,
    errors
}: ClubStepProps) {
    return (
        <ScrollView
            className="flex-1 px-6"
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
        >
            <Input
                label="Club Name *"
                value={formState.name}
                onChangeText={(value) =>
                    updateField("name", value.toLowerCase().replace(/\s/g, "-"))
                }
                placeholder="my-club"
                error={errors.name}
                autoCapitalize="none"
            />

            <Input
                label="Display Name *"
                value={formState.displayName}
                onChangeText={(value) => updateField("displayName", value)}
                placeholder="My Club"
                error={errors.displayName}
            />

            {/* Category */}
            <View className="mb-4">
                <Text className="text-sm font-semibold text-text mb-3">
                    Category
                </Text>
                <View className="flex-row flex-wrap gap-2">
                    {CLUB_CATEGORIES.map((cat) => (
                        <Pressable
                            key={cat.value}
                            onPress={() => updateField("category", cat.value)}
                            className={`px-4 py-2 rounded-full border ${
                                formState.category === cat.value
                                    ? "bg-primary border-primary"
                                    : "bg-card border-card-border"
                            }`}
                        >
                            <Text
                                className={`text-sm font-semibold ${
                                    formState.category === cat.value
                                        ? "text-white"
                                        : "text-text"
                                }`}
                            >
                                {cat.label}
                            </Text>
                        </Pressable>
                    ))}
                </View>
            </View>

            <Input
                label="Description"
                value={formState.description}
                onChangeText={(value) => updateField("description", value)}
                placeholder="my-club"
                numberOfLines={4}
                multiline
            />

            {/* Links */}
            <View className="mb-4">
                <Text className="text-sm font-semibold text-text mb-3">
                    Links
                </Text>
                <ClubLinksEditor
                    links={formState.links}
                    onChange={(links) => updateField("links", links)}
                />
            </View>

            <View className="h-32" />
        </ScrollView>
    )
}
