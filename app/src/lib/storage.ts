import AsyncStorage from '@react-native-async-storage/async-storage';

import type { DoseLog, Medication } from '@/types';

const MEDICATIONS_KEY = 'medications';
const DOSE_LOGS_KEY = 'doseLogs';

async function readList<T>(key: string): Promise<T[]> {
  const value = await AsyncStorage.getItem(key);
  return value ? (JSON.parse(value) as T[]) : [];
}

export function loadMedications() {
  return readList<Medication>(MEDICATIONS_KEY);
}

export function loadDoseLogs() {
  return readList<DoseLog>(DOSE_LOGS_KEY);
}

export function saveMedications(medications: Medication[]) {
  return AsyncStorage.setItem(MEDICATIONS_KEY, JSON.stringify(medications));
}
