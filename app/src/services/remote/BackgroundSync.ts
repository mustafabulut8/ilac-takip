import * as BackgroundTask from 'expo-background-task';
import * as TaskManager from 'expo-task-manager';

import { logger } from '@/utils/logger';

const TASK_NAME = 'ilac-takip-esitleme';

/**
 * Uygulama kapalıyken ara sıra eşitleme (expo-background-task, Adapter). İşletim sistemi
 * ne zaman çalışacağına kendisi karar verir: Android'de en az 15 dakikada bir, iOS'ta
 * garanti yoktur; iOS simülatöründe hiç çalışmaz, kullanıcı uygulamayı kaydırıp
 * kapatırsa durur. Asıl eşitleme açılışta, öne gelişte ve canlı değişiklikte yapılır.
 *
 * `define` global kapsamda (services/index.ts yüklenirken) çağrılmalıdır; uygulama arka
 * planda uyandırıldığında React ağacı kurulmaz, yalnızca bu görev çalışır.
 */
export const backgroundSync = {
  define(run: () => Promise<void>) {
    TaskManager.defineTask(TASK_NAME, async () => {
      try {
        await run();
        return BackgroundTask.BackgroundTaskResult.Success;
      } catch (error) {
        logger.warn('Arka plan eşitlemesi başarısız:', error);
        return BackgroundTask.BackgroundTaskResult.Failed;
      }
    });
  },

  async register() {
    try {
      const status = await BackgroundTask.getStatusAsync();
      if (status !== BackgroundTask.BackgroundTaskStatus.Available) return;
      await BackgroundTask.registerTaskAsync(TASK_NAME, { minimumInterval: 15 });
    } catch (error) {
      logger.warn('Arka plan eşitlemesi kurulamadı:', error);
    }
  },
};
