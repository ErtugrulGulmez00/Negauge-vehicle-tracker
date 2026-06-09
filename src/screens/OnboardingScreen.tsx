import React, { useState } from 'react';
import { View, Text, StyleSheet, SafeAreaView, TouchableOpacity, Dimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useVehicles } from '../context/VehicleContext';
import { COLORS } from '../theme/colors';
import { Button } from '../components/Button';
import * as Haptics from 'expo-haptics';
import { t } from '../localization/i18n';

const { width } = Dimensions.get('window');

interface Slide {
  icon: string;
  iconColor: string;
  title: string;
  description: string;
}

export const OnboardingScreen: React.FC = () => {
  const { completeOnboarding } = useVehicles();
  const [currentSlideIndex, setCurrentSlideIndex] = useState(0);

  const slides: Slide[] = [
    {
      icon: 'speedometer-outline',
      iconColor: COLORS.primary,
      title: t('onboarding_title_1'),
      description: t('onboarding_desc_1'),
    },
    {
      icon: 'analytics-outline',
      iconColor: COLORS.success,
      title: t('onboarding_title_2'),
      description: t('onboarding_desc_2'),
    },
    {
      icon: 'notifications-outline',
      iconColor: COLORS.warning,
      title: t('onboarding_title_3'),
      description: t('onboarding_desc_3'),
    },
    {
      icon: 'shield-checkmark-outline',
      iconColor: '#38BDF8',
      title: t('onboarding_title_4'),
      description: t('onboarding_desc_4'),
    },
  ];

  const handleNext = () => {
    if (currentSlideIndex < slides.length - 1) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
      setCurrentSlideIndex(prev => prev + 1);
    } else {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
      completeOnboarding();
    }
  };

  const handleSkip = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
    completeOnboarding();
  };

  const activeSlide = slides[currentSlideIndex];

  return (
    <SafeAreaView style={styles.container}>
      {/* Skip Button */}
      <View style={styles.header}>
        {currentSlideIndex < slides.length - 1 ? (
          <TouchableOpacity onPress={handleSkip}>
            <Text style={styles.skipText}>{t('onboarding_skip')}</Text>
          </TouchableOpacity>
        ) : (
          <View />
        )}
      </View>

      {/* Slide Content */}
      <View style={styles.slideContainer}>
        <View style={[styles.iconWrapper, { backgroundColor: activeSlide.iconColor + '15' }]}>
          <Ionicons name={activeSlide.icon as any} size={84} color={activeSlide.iconColor} />
        </View>
        <Text style={styles.title}>{activeSlide.title}</Text>
        <Text style={styles.description}>{activeSlide.description}</Text>
      </View>

      {/* Footer controls */}
      <View style={styles.footer}>
        {/* Indicators */}
        <View style={styles.indicatorContainer}>
          {slides.map((_, index) => (
            <View
              key={index}
              style={[
                styles.indicator,
                currentSlideIndex === index ? styles.indicatorActive : null,
              ]}
            />
          ))}
        </View>

        {/* Next/Start Button */}
        <Button
          title={currentSlideIndex === slides.length - 1 ? t('onboarding_start') : t('onboarding_next')}
          onPress={handleNext}
          style={styles.button}
        />
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
    justifyContent: 'space-between',
  },
  header: {
    height: 50,
    alignItems: 'flex-end',
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  skipText: {
    color: COLORS.textSecondary,
    fontSize: 15,
    fontWeight: '700',
  },
  slideContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 30,
  },
  iconWrapper: {
    width: 160,
    height: 160,
    borderRadius: 80,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 40,
  },
  title: {
    fontSize: 24,
    fontWeight: '800',
    color: COLORS.textPrimary,
    textAlign: 'center',
    marginBottom: 16,
  },
  description: {
    fontSize: 15,
    color: COLORS.textSecondary,
    textAlign: 'center',
    lineHeight: 24,
  },
  footer: {
    paddingHorizontal: 24,
    paddingBottom: 40,
  },
  indicatorContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: 30,
  },
  indicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: COLORS.cardBorder,
    marginHorizontal: 5,
  },
  indicatorActive: {
    width: 24,
    backgroundColor: COLORS.primary,
  },
  button: {
    width: '100%',
  },
});
