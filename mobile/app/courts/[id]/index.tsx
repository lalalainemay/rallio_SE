import React, { useEffect, useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    SafeAreaView,
    ScrollView,
    Image,
    TouchableOpacity,
    ActivityIndicator,
    Dimensions,
} from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Spacing, Typography, Radius } from '@/constants/Colors';
import { Card, Button } from '@/components/ui';
import { supabase } from '@/lib/supabase';

const { width } = Dimensions.get('window');

interface Court {
    id: string;
    name: string;
    hourly_rate: number;
    court_type: string;
    is_active: boolean;
    court_images?: { url: string; is_primary: boolean }[];
}

interface Venue {
    id: string;
    name: string;
    address: string;
    latitude: number | null;
    longitude: number | null;
    opening_hours: Record<string, any> | null;
    description: string | null;
    phone: string | null;
    email: string | null;
    metadata: { amenities?: string[] } | null;
    courts?: Court[];
}

export default function VenueDetailsScreen() {
    const { id } = useLocalSearchParams<{ id: string }>();
    const [venue, setVenue] = useState<Venue | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [selectedImageIndex, setSelectedImageIndex] = useState(0);

    useEffect(() => {
        if (id) {
            fetchVenue();
        }
    }, [id]);

    const fetchVenue = async () => {
        setIsLoading(true);
        setError(null);

        const { data, error: fetchError } = await supabase
            .from('venues')
            .select(`
        id,
        name,
        address,
        latitude,
        longitude,
        opening_hours,
        description,
        phone,
        email,
        metadata,
        courts (
          id,
          name,
          hourly_rate,
          court_type,
          is_active,
          court_images (
            url,
            is_primary,
            display_order
          )
        )
      `)
            .eq('id', id)
            .single();

        if (fetchError) {
            setError(fetchError.message);
        } else {
            setVenue(data);
        }
        setIsLoading(false);
    };

    // Get all images from all courts
    const allImages = venue?.courts
        ?.flatMap((c) => c.court_images || [])
        .sort((a, b) => (a.is_primary ? -1 : 1)) || [];

    // Format currency
    const formatPrice = (price: number) => `₱${price.toLocaleString()}`;

    // Get price range
    const prices = venue?.courts?.map((c) => c.hourly_rate).filter(Boolean) || [];
    const minPrice = prices.length > 0 ? Math.min(...prices) : null;
    const maxPrice = prices.length > 0 ? Math.max(...prices) : null;

    if (isLoading) {
        return (
            <SafeAreaView style={styles.container}>
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color={Colors.dark.primary} />
                </View>
            </SafeAreaView>
        );
    }

    if (error || !venue) {
        return (
            <SafeAreaView style={styles.container}>
                <View style={styles.errorContainer}>
                    <Ionicons name="alert-circle-outline" size={64} color={Colors.dark.error} />
                    <Text style={styles.errorTitle}>Venue not found</Text>
                    <Text style={styles.errorText}>{error || 'This venue may no longer exist'}</Text>
                    <Button onPress={() => router.back()}>Go Back</Button>
                </View>
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView style={styles.container}>
            <ScrollView showsVerticalScrollIndicator={false}>
                {/* Back button */}
                <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
                    <Ionicons name="arrow-back" size={24} color={Colors.dark.text} />
                </TouchableOpacity>

                {/* Image Gallery */}
                <View style={styles.imageGallery}>
                    {allImages.length > 0 ? (
                        <>
                            <Image
                                source={{ uri: allImages[selectedImageIndex]?.url }}
                                style={styles.mainImage}
                            />
                            {allImages.length > 1 && (
                                <ScrollView
                                    horizontal
                                    showsHorizontalScrollIndicator={false}
                                    style={styles.thumbnailScroll}
                                    contentContainerStyle={styles.thumbnailContainer}
                                >
                                    {allImages.map((img, index) => (
                                        <TouchableOpacity
                                            key={index}
                                            onPress={() => setSelectedImageIndex(index)}
                                        >
                                            <Image
                                                source={{ uri: img.url }}
                                                style={[
                                                    styles.thumbnail,
                                                    selectedImageIndex === index && styles.thumbnailSelected
                                                ]}
                                            />
                                        </TouchableOpacity>
                                    ))}
                                </ScrollView>
                            )}
                        </>
                    ) : (
                        <View style={styles.imagePlaceholder}>
                            <Ionicons name="image-outline" size={64} color={Colors.dark.textTertiary} />
                        </View>
                    )}
                </View>

                {/* Content */}
                <View style={styles.content}>
                    {/* Venue Info */}
                    <Text style={styles.venueName}>{venue.name}</Text>

                    <View style={styles.addressRow}>
                        <Ionicons name="location" size={16} color={Colors.dark.textSecondary} />
                        <Text style={styles.address}>{venue.address}</Text>
                    </View>

                    {/* Price & Book */}
                    <Card variant="glass" padding="md" style={styles.priceCard}>
                        <View style={styles.priceRow}>
                            <View>
                                <Text style={styles.priceLabel}>Starting from</Text>
                                <Text style={styles.priceValue}>
                                    {minPrice ? `${formatPrice(minPrice)}/hr` : 'Price varies'}
                                </Text>
                            </View>
                            <Button onPress={() => router.push(`/courts/${id}/book`)}>
                                Book Now
                            </Button>
                        </View>
                    </Card>

                    {/* Opening Hours */}
                    {venue.opening_hours && (
                        <View style={styles.section}>
                            <Text style={styles.sectionTitle}>Opening Hours</Text>
                            <View style={styles.infoRow}>
                                <Ionicons name="time-outline" size={18} color={Colors.dark.primary} />
                                <Text style={styles.infoText}>
                                    {typeof venue.opening_hours === 'string'
                                        ? venue.opening_hours
                                        : 'See venue for hours'}
                                </Text>
                            </View>
                        </View>
                    )}

                    {/* Description */}
                    {venue.description && (
                        <View style={styles.section}>
                            <Text style={styles.sectionTitle}>About</Text>
                            <Text style={styles.description}>{venue.description}</Text>
                        </View>
                    )}

                    {/* Amenities */}
                    {venue.metadata?.amenities && venue.metadata.amenities.length > 0 && (
                        <View style={styles.section}>
                            <Text style={styles.sectionTitle}>Amenities</Text>
                            <View style={styles.amenitiesGrid}>
                                {venue.metadata.amenities.map((amenity: string, index: number) => (
                                    <View key={index} style={styles.amenityBadge}>
                                        <Ionicons name="checkmark-circle" size={16} color={Colors.dark.primary} />
                                        <Text style={styles.amenityText}>{amenity}</Text>
                                    </View>
                                ))}
                            </View>
                        </View>
                    )}

                    {/* Courts List */}
                    <View style={styles.section}>
                        <Text style={styles.sectionTitle}>Available Courts</Text>
                        {venue.courts?.filter(c => c.is_active).map((court) => (
                            <Card key={court.id} variant="default" padding="md" style={styles.courtCard}>
                                <View style={styles.courtHeader}>
                                    <Text style={styles.courtName}>{court.name}</Text>
                                    <View style={styles.courtTypeBadge}>
                                        <Text style={styles.courtTypeText}>{court.court_type}</Text>
                                    </View>
                                </View>
                                <Text style={styles.courtPrice}>{formatPrice(court.hourly_rate)}/hr</Text>
                            </Card>
                        ))}
                    </View>

                    {/* Contact */}
                    {(venue.phone || venue.email) && (
                        <View style={styles.section}>
                            <Text style={styles.sectionTitle}>Contact</Text>
                            {venue.phone && (
                                <TouchableOpacity style={styles.contactRow}>
                                    <Ionicons name="call-outline" size={18} color={Colors.dark.primary} />
                                    <Text style={styles.contactText}>{venue.phone}</Text>
                                </TouchableOpacity>
                            )}
                            {venue.email && (
                                <TouchableOpacity style={styles.contactRow}>
                                    <Ionicons name="mail-outline" size={18} color={Colors.dark.primary} />
                                    <Text style={styles.contactText}>{venue.email}</Text>
                                </TouchableOpacity>
                            )}
                        </View>
                    )}
                </View>
            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: Colors.dark.background,
    },
    loadingContainer: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
    },
    errorContainer: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        padding: Spacing.xl,
        gap: Spacing.md,
    },
    errorTitle: {
        ...Typography.h2,
        color: Colors.dark.text,
    },
    errorText: {
        ...Typography.body,
        color: Colors.dark.textSecondary,
        textAlign: 'center',
    },
    backButton: {
        position: 'absolute',
        top: Spacing.md,
        left: Spacing.md,
        zIndex: 10,
        width: 44,
        height: 44,
        borderRadius: 22,
        backgroundColor: 'rgba(0,0,0,0.5)',
        alignItems: 'center',
        justifyContent: 'center',
    },
    imageGallery: {
        width: '100%',
    },
    mainImage: {
        width: '100%',
        height: 280,
        resizeMode: 'cover',
    },
    imagePlaceholder: {
        width: '100%',
        height: 280,
        backgroundColor: Colors.dark.elevated,
        alignItems: 'center',
        justifyContent: 'center',
    },
    thumbnailScroll: {
        position: 'absolute',
        bottom: Spacing.md,
        left: 0,
        right: 0,
    },
    thumbnailContainer: {
        paddingHorizontal: Spacing.md,
        gap: Spacing.sm,
    },
    thumbnail: {
        width: 60,
        height: 60,
        borderRadius: Radius.sm,
        borderWidth: 2,
        borderColor: 'transparent',
    },
    thumbnailSelected: {
        borderColor: Colors.dark.primary,
    },
    content: {
        padding: Spacing.lg,
    },
    venueName: {
        ...Typography.h1,
        color: Colors.dark.text,
        marginBottom: Spacing.xs,
    },
    addressRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: Spacing.xs,
        marginBottom: Spacing.lg,
    },
    address: {
        ...Typography.body,
        color: Colors.dark.textSecondary,
        flex: 1,
    },
    priceCard: {
        marginBottom: Spacing.lg,
    },
    priceRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    priceLabel: {
        ...Typography.caption,
        color: Colors.dark.textSecondary,
    },
    priceValue: {
        ...Typography.h2,
        color: Colors.dark.primary,
    },
    section: {
        marginBottom: Spacing.lg,
    },
    sectionTitle: {
        ...Typography.h3,
        color: Colors.dark.text,
        marginBottom: Spacing.sm,
    },
    infoRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: Spacing.sm,
    },
    infoText: {
        ...Typography.body,
        color: Colors.dark.text,
    },
    description: {
        ...Typography.body,
        color: Colors.dark.textSecondary,
        lineHeight: 24,
    },
    amenitiesGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: Spacing.sm,
    },
    amenityBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: Spacing.xs,
        backgroundColor: Colors.dark.surface,
        paddingHorizontal: Spacing.sm,
        paddingVertical: Spacing.xs,
        borderRadius: Radius.full,
        borderWidth: 1,
        borderColor: Colors.dark.border,
    },
    amenityText: {
        ...Typography.bodySmall,
        color: Colors.dark.text,
    },
    courtCard: {
        marginBottom: Spacing.sm,
    },
    courtHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: Spacing.xs,
    },
    courtName: {
        ...Typography.body,
        color: Colors.dark.text,
        fontWeight: '600',
    },
    courtTypeBadge: {
        backgroundColor: Colors.dark.primary + '20',
        paddingHorizontal: Spacing.sm,
        paddingVertical: 2,
        borderRadius: Radius.full,
    },
    courtTypeText: {
        ...Typography.caption,
        color: Colors.dark.primary,
        fontWeight: '500',
    },
    courtPrice: {
        ...Typography.body,
        color: Colors.dark.primary,
    },
    contactRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: Spacing.sm,
        paddingVertical: Spacing.xs,
    },
    contactText: {
        ...Typography.body,
        color: Colors.dark.text,
    },
});
