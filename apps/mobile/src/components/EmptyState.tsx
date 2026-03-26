/**
 * EmptyState component - Beautiful empty states for lists
 */
import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { COLORS } from '../lib/constants';
import { Ionicons } from '@expo/vector-icons';

interface EmptyStateProps {
  icon: string;
  title: string;
  subtitle?: string;
  actionLabel?: string;
  onAction?: () => void;
  secondaryActionLabel?: string;
  onSecondaryAction?: () => void;
}

export function EmptyState({
  icon,
  title,
  subtitle,
  actionLabel,
  onAction,
  secondaryActionLabel,
  onSecondaryAction,
}: EmptyStateProps) {
  return (
    <View style={styles.container}>
      <View style={styles.iconContainer}>
        <Ionicons name={icon as any} size={64} color={COLORS.textSecondary} />
      </View>
      
      <Text style={styles.title}>{title}</Text>
      
      {subtitle && (
        <Text style={styles.subtitle}>{subtitle}</Text>
      )}
      
      {actionLabel && onAction && (
        <TouchableOpacity
          style={styles.actionButton}
          onPress={onAction}
          activeOpacity={0.8}
        >
          <Text style={styles.actionText}>{actionLabel}</Text>
        </TouchableOpacity>
      )}
      
      {secondaryActionLabel && onSecondaryAction && (
        <TouchableOpacity
          style={styles.secondaryButton}
          onPress={onSecondaryAction}
          activeOpacity={0.8}
        >
          <Text style={styles.secondaryText}>{secondaryActionLabel}</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

// Pre-built empty states
export function NoJourneysEmptyState({ onAdd }: { onAdd: () => void }) {
  return (
    <EmptyState
      icon="train-outline"
      title="No journeys yet"
      subtitle="Track your train journeys and never miss a departure again."
      actionLabel="Add Your First Journey"
      onAction={onAdd}
    />
  );
}

export function NoResultsEmptyState({ onClear }: { onClear?: () => void }) {
  return (
    <EmptyState
      icon="search-outline"
      title="No results found"
      subtitle="Try adjusting your search or check your spelling."
      actionLabel={onClear ? "Clear Search" : undefined}
      onAction={onClear}
    />
  );
}

export function NoConnectionEmptyState({ onRetry }: { onRetry: () => void }) {
  return (
    <EmptyState
      icon="wifi-outline"
      title="No connection"
      subtitle="Check your internet connection and try again."
      actionLabel="Try Again"
      onAction={onRetry}
    />
  );
}

export function ErrorEmptyState({ 
  message, 
  onRetry 
}: { 
  message?: string; 
  onRetry: () => void;
}) {
  return (
    <EmptyState
      icon="alert-circle-outline"
      title="Something went wrong"
      subtitle={message || "We couldn't load the data. Please try again."}
      actionLabel="Try Again"
      onAction={onRetry}
    />
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 40,
    paddingVertical: 60,
  },
  iconContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: COLORS.card,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
    color: COLORS.text,
    textAlign: 'center',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 15,
    color: COLORS.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 24,
  },
  actionButton: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: 12,
    marginBottom: 12,
  },
  actionText: {
    color: COLORS.text,
    fontSize: 16,
    fontWeight: '600',
  },
  secondaryButton: {
    paddingHorizontal: 24,
    paddingVertical: 12,
  },
  secondaryText: {
    color: COLORS.primary,
    fontSize: 16,
    fontWeight: '500',
  },
});
