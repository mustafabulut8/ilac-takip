import * as SplashScreen from 'expo-splash-screen';
import { Component, type ErrorInfo, type ReactNode } from 'react';
import { StyleSheet, Text } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { BigButton } from '@/components/big-button';
import { Colors, FontSize, Spacing } from '@/constants/theme';
import { logger } from '@/utils/logger';

type Props = { children: ReactNode };
type State = { hasError: boolean };

/**
 * Bir ekran çizilirken hata çıkarsa uygulama beyaz ekranda kalmaz;
 * Türkçe mesaj ve "Yeniden dene" butonu gösterilir. React'te hata sınırı
 * yalnızca sınıf bileşeniyle yazılabilir.
 */
export class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false };

  static getDerivedStateFromError(): State {
    return { hasError: true };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    logger.error('Ekran çizilirken hata oluştu:', { error, componentStack: info.componentStack });
    // Hata açılışta olduysa açılış ekranı kapanmazdı.
    SplashScreen.hideAsync().catch(() => {});
  }

  private retry = () => {
    this.setState({ hasError: false });
  };

  render() {
    if (!this.state.hasError) return this.props.children;
    return (
      <SafeAreaView style={styles.container}>
        <Text style={styles.title}>Bir sorun oluştu</Text>
        <Text style={styles.body}>
          Ekran açılırken beklenmeyen bir hata oldu. İlaç bilgileriniz silinmedi.
        </Text>
        <BigButton label="Yeniden dene" onPress={this.retry} />
      </SafeAreaView>
    );
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    gap: Spacing.three,
    padding: Spacing.three,
    backgroundColor: Colors.background,
  },
  title: {
    color: Colors.danger,
    fontSize: FontSize.title,
    fontWeight: '800',
    textAlign: 'center',
  },
  body: {
    color: Colors.text,
    fontSize: FontSize.body,
    textAlign: 'center',
  },
});
