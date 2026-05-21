import { useState } from 'react';
import { ScrollView, View, StyleSheet } from 'react-native';
import Animated from 'react-native-reanimated';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';

import { BentoCard } from '@/components/ui/bento-card';
import { VercelButton } from '@/components/ui/vercel-button';
import { VercelInput } from '@/components/ui/vercel-input';
import { VercelBadge } from '@/components/ui/vercel-badge';
import { VercelTabs } from '@/components/ui/vercel-tabs';
import { VercelModal, ModalHeader, ModalBody, ModalFooter } from '@/components/ui/vercel-modal';
import { VercelToast, ToastContainer } from '@/components/ui/vercel-toast';
import { Divider } from '@/components/ui/divider';
import { SectionLabel } from '@/components/ui/section-label';
import { StatNumber } from '@/components/ui/stat-number';
import { StatusTag } from '@/components/ui/status-tag';
import { EmptyState } from '@/components/ui/empty-state';
import { Dot, DotPulse } from '@/components/ui/dot';
import { IconCircle } from '@/components/ui/icon-circle';
import { ProgressBar } from '@/components/ui/progress-bar';
import { BackgroundGlow } from '@/components/ui/background-glow';
import { useFadeUp, useFadeIn } from '@/hooks/use-vercel-animations';

export default function HomeScreen() {
  const [activeTab, setActiveTab] = useState('overview');
  const [modalVisible, setModalVisible] = useState(false);
  const [toastVisible, setToastVisible] = useState(false);
  const [progress, setProgress] = useState(65);

  const fadeUpStyle = useFadeUp(100);
  const fadeInStyle = useFadeIn(200);

  const tabs = [
    { key: 'overview', label: 'Overview' },
    { key: 'analytics', label: 'Analytics' },
    { key: 'settings', label: 'Settings' },
  ];

  return (
    <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: 16, gap: 16 }}>
      {/* Header con Background Glow */}
      <ThemedView glow style={{ borderRadius: 16, padding: 24, marginBottom: 8 }}>
        <Animated.View style={[fadeUpStyle, styles.header]}>
          <ThemedText type="title">DIITRA</ThemedText>
          <ThemedText type="caption" style={{ opacity: 0.6 }}>
            Sistema de Diseño Vercel Mobile
          </ThemedText>
        </Animated.View>
      </ThemedView>

      {/* Tabs */}
      <VercelTabs tabs={tabs} activeTab={activeTab} onTabChange={setActiveTab} />

      {/* Bento Cards */}
      <View style={styles.grid}>
        <BentoCard style={{ flex: 1 }} onPress={() => setProgress((p) => (p >= 100 ? 0 : p + 10))}>
          <ThemedText type="sectionLabel" style={{ opacity: 0.6 }}>
            Usuarios
          </ThemedText>
          <StatNumber size="sm">1,248</StatNumber>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 8 }}>
            <Dot variant="success" />
            <ThemedText type="caption" style={{ opacity: 0.6 }}>
              12% vs mes pasado
            </ThemedText>
          </View>
        </BentoCard>

        <BentoCard style={{ flex: 1 }}>
          <ThemedText type="sectionLabel" style={{ opacity: 0.6 }}>
            Proyectos
          </ThemedText>
          <StatNumber size="sm">84</StatNumber>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 8 }}>
            <Dot variant="brand" />
            <ThemedText type="caption" style={{ opacity: 0.6 }}>
              3 activos
            </ThemedText>
          </View>
        </BentoCard>
      </View>

      {/* Badges */}
      <Animated.View style={[fadeInStyle, { gap: 8 }]}>
        <SectionLabel>Estados</SectionLabel>
        <View style={styles.rowWrap}>
          <VercelBadge variant="success">Aprobado</VercelBadge>
          <VercelBadge variant="error">Rechazado</VercelBadge>
          <VercelBadge variant="warning">En Revisión</VercelBadge>
          <VercelBadge variant="info">Convocatoria</VercelBadge>
          <VercelBadge variant="violet">Coordinador</VercelBadge>
          <VercelBadge variant="neutral">Borrador</VercelBadge>
        </View>
      </Animated.View>

      {/* Status Tags */}
      <View style={styles.rowWrap}>
        <StatusTag variant="success">Activo</StatusTag>
        <StatusTag variant="error">Error</StatusTag>
        <StatusTag variant="warning">Pendiente</StatusTag>
        <StatusTag variant="info">Info</StatusTag>
        <StatusTag variant="brand">Brand</StatusTag>
        <StatusTag variant="neutral">Neutral</StatusTag>
      </View>

      {/* Dots */}
      <View style={styles.row}>
        <Dot variant="success" />
        <Dot variant="warning" />
        <Dot variant="error" />
        <Dot variant="info" />
        <Dot variant="brand" />
        <DotPulse variant="brand" />
      </View>

      {/* Icon Circles */}
      <View style={styles.row}>
        <IconCircle variant="success">
          <ThemedText style={{ fontSize: 18 }}>✓</ThemedText>
        </IconCircle>
        <IconCircle variant="info">
          <ThemedText style={{ fontSize: 18 }}>i</ThemedText>
        </IconCircle>
        <IconCircle variant="warning">
          <ThemedText style={{ fontSize: 18 }}>!</ThemedText>
        </IconCircle>
        <IconCircle variant="error">
          <ThemedText style={{ fontSize: 18 }}>✕</ThemedText>
        </IconCircle>
        <IconCircle variant="brand">
          <ThemedText style={{ fontSize: 18 }}>★</ThemedText>
        </IconCircle>
      </View>

      {/* Progress */}
      <View style={{ gap: 8 }}>
        <SectionLabel>Progreso</SectionLabel>
        <ProgressBar progress={progress} variant="brand" />
        <ProgressBar progress={progress} variant="success" />
        <ThemedText type="caption" style={{ opacity: 0.6 }}>
          Toca la primera tarjeta Bento para animar el progreso
        </ThemedText>
      </View>

      {/* Buttons */}
      <View style={{ gap: 12 }}>
        <SectionLabel>Botones</SectionLabel>
        <VercelButton variant="primary">Primary Action</VercelButton>
        <VercelButton variant="secondary">Secondary Action</VercelButton>
        <VercelButton variant="brand">Brand Action</VercelButton>
      </View>

      {/* Input */}
      <View style={{ gap: 8 }}>
        <SectionLabel>Input</SectionLabel>
        <VercelInput placeholder="Escribe algo..." />
      </View>

      {/* Divider */}
      <Divider />

      {/* Empty State */}
      <EmptyState
        title="Sin datos"
        description="No hay información disponible en este momento."
      />

      {/* Modal Trigger */}
      <VercelButton variant="secondary" onPress={() => setModalVisible(true)}>
        Abrir Modal
      </VercelButton>

      {/* Toast Trigger */}
      <VercelButton variant="brand" onPress={() => { setToastVisible(true); setTimeout(() => setToastVisible(false), 3000); }}>
        Mostrar Toast
      </VercelButton>

      {/* Modal */}
      <VercelModal visible={modalVisible} onClose={() => setModalVisible(false)}>
        <ModalHeader>
          <ThemedText type="subtitle">Modal Vercel</ThemedText>
        </ModalHeader>
        <ModalBody>
          <ThemedText>
            Este es un modal con el estilo de diseño Vercel adaptado para React Native. Incluye blur nativo y animaciones suaves.
          </ThemedText>
        </ModalBody>
        <ModalFooter>
          <VercelButton variant="secondary" onPress={() => setModalVisible(false)}>
            Cancelar
          </VercelButton>
          <VercelButton variant="primary" onPress={() => setModalVisible(false)}>
            Aceptar
          </VercelButton>
        </ModalFooter>
      </VercelModal>

      {/* Toast */}
      <ToastContainer>
        <VercelToast visible={toastVisible}>
          <Dot variant="success" size={8} />
          <ThemedText type="caption">Operación completada exitosamente</ThemedText>
        </VercelToast>
      </ToastContainer>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  header: {
    gap: 4,
  },
  grid: {
    flexDirection: 'row',
    gap: 12,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  rowWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: 8,
  },
});
